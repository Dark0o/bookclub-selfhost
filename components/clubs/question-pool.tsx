"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getQuestionsByPhase,
  voteOnQuestion,
  reactToQuestion,
  pinQuestion,
  proposeQuestion,
  type QuestionRecord,
} from "@/lib/actions/question.actions";
import {
  proposeQuestionSchema,
  type ProposeQuestionInput,
} from "@/lib/validations";
import { PushPin, ArrowUp, Plus, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const EMOJI_SET = ["🤔", "💡", "❤️", "😮", "🔥"];

type Props = {
  phaseId: string;
  phaseIsOpen: boolean;
  initialQuestions?: QuestionRecord[];
  currentUserId: string;
  userRole: "MEMBER" | "MODERATOR";
  clubId: string;
};

type QuestionItemProps = {
  question: QuestionRecord;
  currentUserId: string;
  userRole: "MEMBER" | "MODERATOR";
  phaseIsOpen: boolean;
  isPending: boolean;
  onVote: (questionId: string) => void;
  onReact: (questionId: string, emoji: string) => void;
  onPin: (questionId: string) => void;
  onOpenDetail: (questionId: string) => void;
};

type ProposeModalProps = {
  phaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type DetailModalProps = {
  question: QuestionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  userRole: "MEMBER" | "MODERATOR";
  phaseIsOpen: boolean;
  isPending: boolean;
  onVote: (questionId: string) => void;
  onReact: (questionId: string, emoji: string) => void;
  onPin: (questionId: string) => void;
};

const ProposeQuestionModal = ({
  phaseId,
  open,
  onOpenChange,
  onSuccess,
}: ProposeModalProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProposeQuestionInput>({
    resolver: zodResolver(proposeQuestionSchema),
    defaultValues: { phaseId, content: "" },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    form.reset({ phaseId, content: "" });
    setServerError(null);
    onOpenChange(nextOpen);
  };

  const handleSubmit = (values: ProposeQuestionInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await proposeQuestion(values);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        handleOpenChange(false);
        onSuccess();
      }
    });
  };

  const content = form.watch("content");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-base font-semibold">
            Propose a Question
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What question do you want to discuss?"
                      className="resize-none"
                      rows={4}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-right font-mono text-[10px] text-muted-foreground">
                    {content.length}/500
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && (
              <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2">
                {serverError}
              </p>
            )}
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <SpinnerGap className="animate-spin mr-1" size={14} />
                )}
                {isPending ? "Proposing…" : "Propose Question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const QuestionDetailModal = ({
  question,
  open,
  onOpenChange,
  currentUserId,
  userRole,
  phaseIsOpen,
  isPending,
  onVote,
  onReact,
  onPin,
}: DetailModalProps) => {
  const hasVoted =
    question?.votes.some((v) => v.userId === currentUserId) ?? false;

  const reactionGroups = EMOJI_SET.map((emoji) => ({
    emoji,
    count: question?.reactions.filter((r) => r.emoji === emoji).length ?? 0,
    hasReacted:
      question?.reactions.some(
        (r) => r.userId === currentUserId && r.emoji === emoji,
      ) ?? false,
  }));

  const visibleReactions = phaseIsOpen
    ? reactionGroups
    : reactionGroups.filter((g) => g.count > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-base font-semibold flex items-center gap-2">
            {question?.isPinned && (
              <PushPin
                weight="fill"
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            )}
            Question
          </DialogTitle>
        </DialogHeader>

        {question && (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed">{question.content}</p>

            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
              — {question.author.name ?? "Unknown"}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={
                  !phaseIsOpen ||
                  isPending ||
                  question.author.id === currentUserId
                }
                onClick={() => onVote(question.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 shrink-0 px-1.5 py-1 border transition-colors min-w-[32px]",
                  hasVoted
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                  (!phaseIsOpen ||
                    isPending ||
                    question.author.id === currentUserId) &&
                    "opacity-40 cursor-not-allowed hover:border-border hover:text-muted-foreground",
                )}
              >
                <ArrowUp size={10} weight="bold" />
                <span className="font-mono text-[10px] leading-none">
                  {question.upvotesCount}
                </span>
              </button>
              <span className="font-mono text-[10px] text-muted-foreground">
                {question.upvotesCount === 1
                  ? "1 upvote"
                  : `${question.upvotesCount} upvotes`}
              </span>
            </div>

            {(visibleReactions.length > 0 || userRole === "MODERATOR") && (
              <div className="flex items-center gap-1 flex-wrap">
                {visibleReactions.map(({ emoji, count, hasReacted }) => (
                  <button
                    key={emoji}
                    disabled={
                      !phaseIsOpen ||
                      isPending ||
                      question.author.id === currentUserId
                    }
                    onClick={() => onReact(question.id, emoji)}
                    className={cn(
                      "font-mono text-xs px-1.5 py-0.5 border leading-none",
                      !phaseIsOpen
                        ? "border-border cursor-default"
                        : hasReacted
                          ? "transition-colors border-foreground bg-foreground/5"
                          : "transition-colors border-border hover:border-foreground",
                      phaseIsOpen &&
                        isPending &&
                        "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {emoji}
                    {count > 0 && (
                      <span className="ml-0.5 text-[10px]">{count}</span>
                    )}
                  </button>
                ))}

                {userRole === "MODERATOR" && (
                  <button
                    disabled={isPending}
                    onClick={() => onPin(question.id)}
                    className={cn(
                      "ml-auto flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 border transition-colors",
                      question.isPinned
                        ? "border-foreground text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                      (!phaseIsOpen ||
                        isPending ||
                        question.author.id === currentUserId) &&
                        "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <PushPin
                      size={10}
                      weight={question.isPinned ? "fill" : "regular"}
                    />
                    {question.isPinned ? "Unpin" : "Pin"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const QuestionItem = ({
  question,
  currentUserId,
  userRole,
  phaseIsOpen,
  isPending,
  onVote,
  onReact,
  onPin,
  onOpenDetail,
}: QuestionItemProps) => {
  const hasVoted = question.votes.some((v) => v.userId === currentUserId);

  const reactionGroups = EMOJI_SET.map((emoji) => ({
    emoji,
    count: question.reactions.filter((r) => r.emoji === emoji).length,
    hasReacted: question.reactions.some(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    ),
  }));

  const visibleReactions = phaseIsOpen
    ? reactionGroups
    : reactionGroups.filter((g) => g.count > 0);

  return (
    <div className="border border-border p-3 flex flex-col gap-2 bg-card">
      {/* Row 1: pin indicator + text + upvote */}
      <div className="flex items-start gap-2">
        {question.isPinned && (
          <PushPin
            weight="fill"
            size={12}
            className="shrink-0 text-muted-foreground mt-0.5"
          />
        )}
        <button
          className="text-sm leading-snug line-clamp-2 flex-1 text-left hover:text-foreground/80 transition-colors"
          onClick={() => onOpenDetail(question.id)}
        >
          {question.content}
        </button>
        <button
          disabled={
            !phaseIsOpen || isPending || question.author.id === currentUserId
          }
          onClick={() => onVote(question.id)}
          className={cn(
            "flex flex-col items-center gap-0.5 shrink-0 px-1.5 py-1 border transition-colors min-w-[32px]",
            hasVoted
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            (!phaseIsOpen ||
              isPending ||
              question.author.id === currentUserId) &&
              "opacity-40 cursor-not-allowed hover:border-border hover:text-muted-foreground",
          )}
        >
          <ArrowUp size={10} weight="bold" />
          <span className="font-mono text-[10px] leading-none">
            {question.upvotesCount}
          </span>
        </button>
      </div>

      {/* Row 2: emoji reactions + pin toggle (mod only) */}
      {(visibleReactions.length > 0 || userRole === "MODERATOR") && (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleReactions.map(({ emoji, count, hasReacted }) => (
            <button
              key={emoji}
              disabled={!phaseIsOpen || isPending}
              onClick={() => onReact(question.id, emoji)}
              className={cn(
                "font-mono text-xs px-1.5 py-0.5 border leading-none",
                !phaseIsOpen
                  ? "border-border cursor-default"
                  : hasReacted
                    ? "transition-colors border-foreground bg-foreground/5"
                    : "transition-colors border-border hover:border-foreground",
                phaseIsOpen && isPending && "opacity-40 cursor-not-allowed",
              )}
            >
              {emoji}
              {count > 0 && <span className="ml-0.5 text-[10px]">{count}</span>}
            </button>
          ))}

          {userRole === "MODERATOR" && (
            <button
              disabled={isPending}
              onClick={() => onPin(question.id)}
              className={cn(
                "ml-auto flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 border transition-colors",
                question.isPinned
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                isPending && "opacity-40 cursor-not-allowed",
              )}
            >
              <PushPin
                size={10}
                weight={question.isPinned ? "fill" : "regular"}
              />
              {question.isPinned ? "Unpin" : "Pin"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const QuestionPool = ({
  phaseId,
  phaseIsOpen,
  initialQuestions,
  currentUserId,
  userRole,
  clubId,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: questions = [] } = useQuery({
    queryKey: ["questions", phaseId],
    queryFn: () => getQuestionsByPhase(phaseId),
    initialData: initialQuestions,
    refetchInterval: 60_000,
  });

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.upvotesCount - a.upvotesCount;
  });

  const selectedQuestion =
    questions.find((q) => q.id === selectedQuestionId) ?? null;

  const handleVote = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const hasVoted = question.votes.some((v) => v.userId === currentUserId);

    queryClient.setQueryData<QuestionRecord[]>(
      ["questions", phaseId],
      (old = []) =>
        old.map((q) =>
          q.id !== questionId
            ? q
            : {
                ...q,
                upvotesCount: hasVoted
                  ? q.upvotesCount - 1
                  : q.upvotesCount + 1,
                votes: hasVoted
                  ? q.votes.filter((v) => v.userId !== currentUserId)
                  : [...q.votes, { userId: currentUserId }],
              },
        ),
    );

    startTransition(async () => {
      const result = await voteOnQuestion({ questionId });
      if ("error" in result) {
        queryClient.invalidateQueries({ queryKey: ["questions", phaseId] });
      }
    });
  };

  const handleReact = (questionId: string, emoji: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const hasReacted = question.reactions.some(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );

    queryClient.setQueryData<QuestionRecord[]>(
      ["questions", phaseId],
      (old = []) =>
        old.map((q) =>
          q.id !== questionId
            ? q
            : {
                ...q,
                reactions: hasReacted
                  ? q.reactions.filter(
                      (r) => !(r.userId === currentUserId && r.emoji === emoji),
                    )
                  : [...q.reactions, { userId: currentUserId, emoji }],
              },
        ),
    );

    startTransition(async () => {
      const result = await reactToQuestion({ questionId, emoji });
      if ("error" in result) {
        queryClient.invalidateQueries({ queryKey: ["questions", phaseId] });
      }
    });
  };

  const handlePin = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const newPinned = !question.isPinned;

    queryClient.setQueryData<QuestionRecord[]>(
      ["questions", phaseId],
      (old = []) =>
        old.map((q) => {
          if (q.id === questionId) return { ...q, isPinned: newPinned };
          if (newPinned) return { ...q, isPinned: false };
          return q;
        }),
    );

    startTransition(async () => {
      const result = await pinQuestion({ questionId, clubId });
      if ("error" in result) {
        queryClient.invalidateQueries({ queryKey: ["questions", phaseId] });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {sortedQuestions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {phaseIsOpen
            ? "No questions yet. Be the first to ask one."
            : "No questions proposed for this phase."}
        </p>
      ) : (
        sortedQuestions.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            currentUserId={currentUserId}
            userRole={userRole}
            phaseIsOpen={phaseIsOpen}
            isPending={isPending}
            onVote={handleVote}
            onReact={handleReact}
            onPin={handlePin}
            onOpenDetail={setSelectedQuestionId}
          />
        ))
      )}

      <button
        disabled={!phaseIsOpen}
        onClick={() => setProposeOpen(true)}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-border font-mono text-xs text-muted-foreground transition-colors",
          phaseIsOpen
            ? "hover:border-foreground hover:text-foreground cursor-pointer"
            : "opacity-40 cursor-not-allowed",
        )}
      >
        <Plus size={10} weight="bold" />
        Ask a Question
      </button>

      <ProposeQuestionModal
        phaseId={phaseId}
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["questions", phaseId] })
        }
      />
      <QuestionDetailModal
        question={selectedQuestion}
        open={selectedQuestionId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedQuestionId(null);
        }}
        currentUserId={currentUserId}
        userRole={userRole}
        phaseIsOpen={phaseIsOpen}
        isPending={isPending}
        onVote={handleVote}
        onReact={handleReact}
        onPin={handlePin}
      />
    </div>
  );
};
