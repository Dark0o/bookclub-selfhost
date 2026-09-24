"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  proposeQuestionSchema,
  type ProposeQuestionInput,
  voteOnQuestionSchema,
  type VoteOnQuestionInput,
  pinQuestionSchema,
  type PinQuestionInput,
  reactToQuestionSchema,
  type ReactToQuestionInput,
} from "@/lib/validations";

type QuestionResult = { success: true } | { error: string };

export const proposeQuestion = async (
  input: ProposeQuestionInput,
): Promise<QuestionResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const parsed = proposeQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { phaseId, content } = parsed.data;

  const phase = await db.readingPhase.findUnique({
    where: { id: phaseId },
    include: {
      club: {
        include: { memberships: { where: { userId: session.user.id } } },
      },
    },
  });
  if (!phase) return { error: "Phase not found" };
  if (phase.club.memberships.length === 0) return { error: "Not a member" };
  if (!phase.isOpen) return { error: "Phase is not open" };

  try {
    await db.question.create({
      data: {
        phaseId,
        content,
        authorId: session.user.id,
        status: "PROPOSED",
        upvotesCount: 0,
        isPinned: false,
      },
    });

    revalidatePath(`/clubs/${phase.clubId}`);
    return { success: true };
  } catch {
    return { error: "Failed to propose question. Please try again." };
  }
};

export const voteOnQuestion = async (
  input: VoteOnQuestionInput,
): Promise<QuestionResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const parsed = voteOnQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { questionId } = parsed.data;

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      phase: {
        include: {
          club: {
            include: { memberships: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  });
  if (!question) return { error: "Question not found" };
  if (question.phase.club.memberships.length === 0)
    return { error: "Not a member" };
  if (question.authorId === session.user.id)
    return { error: "Cannot vote on your own question" };

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { userId_questionId: { userId: session.user.id, questionId } },
      });

      if (existing) {
        await tx.vote.delete({ where: { id: existing.id } });
        await tx.question.update({
          where: { id: questionId },
          data: { upvotesCount: { decrement: 1 } },
        });
      } else {
        await tx.vote.create({ data: { userId: session.user.id, questionId } });
        await tx.question.update({
          where: { id: questionId },
          data: { upvotesCount: { increment: 1 } },
        });
      }
    });

    revalidatePath(`/clubs/${question.phase.clubId}`);
    return { success: true };
  } catch {
    return { error: "Failed to vote on question. Please try again." };
  }
};

export const pinQuestion = async (
  input: PinQuestionInput,
): Promise<QuestionResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const parsed = pinQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { questionId, clubId } = parsed.data;

  const membership = await db.clubMembership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  });
  if (!membership || membership.role !== "MODERATOR")
    return { error: "Unauthorized" };

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: { phase: { select: { id: true, clubId: true } } },
  });
  if (!question) return { error: "Question not found" };
  if (question.phase.clubId !== clubId)
    return { error: "Question does not belong to this club" };

  try {
    await db.$transaction(async (tx) => {
      if (question.isPinned) {
        await tx.question.update({
          where: { id: questionId },
          data: { isPinned: false },
        });
      } else {
        await tx.question.updateMany({
          where: { phaseId: question.phaseId },
          data: { isPinned: false },
        });
        await tx.question.update({
          where: { id: questionId },
          data: { isPinned: true },
        });
      }
    });

    revalidatePath(`/clubs/${clubId}`);
    return { success: true };
  } catch {
    return { error: "Failed to pin question. Please try again." };
  }
};

export const reactToQuestion = async (
  input: ReactToQuestionInput,
): Promise<QuestionResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const parsed = reactToQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { questionId, emoji } = parsed.data;

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      phase: {
        include: {
          club: {
            include: { memberships: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  });
  if (!question) return { error: "Question not found" };
  if (question.phase.club.memberships.length === 0)
    return { error: "Not a member" };

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.reaction.findUnique({
        where: {
          userId_questionId_emoji: {
            userId: session.user.id,
            questionId,
            emoji,
          },
        },
      });
      if (existing) {
        await tx.reaction.delete({ where: { id: existing.id } });
      } else {
        await tx.reaction.create({
          data: { userId: session.user.id, questionId, emoji },
        });
      }
    });

    revalidatePath(`/clubs/${question.phase.clubId}`);
    return { success: true };
  } catch {
    return { error: "Failed to react to question. Please try again." };
  }
};

export type QuestionRecord = Awaited<
  ReturnType<typeof getQuestionsByPhase>
>[number];

export const getQuestionsByPhase = async (phaseId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  return db.question.findMany({
    where: { phaseId },
    select: {
      id: true,
      content: true,
      isPinned: true,
      upvotesCount: true,
      status: true,
      author: { select: { id: true, name: true, image: true } },
      votes: { where: { userId: session.user.id }, select: { userId: true } },
      reactions: { select: { userId: true, emoji: true } },
    },
    orderBy: [{ isPinned: "desc" }, { upvotesCount: "desc" }],
  });
};
