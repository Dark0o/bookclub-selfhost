import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { EditClubDialog } from '@/components/clubs/edit-club-dialog'
import { InviteCopyButton } from '@/components/clubs/invite-copy-button'
import { LaunchClubDialog } from '@/components/clubs/launch-club-dialog'
import { PhasesView } from '@/components/clubs/phases-view'
import { ProgressPanel } from '@/components/clubs/progress-panel'
import { getClubProgress } from '@/lib/actions/progress.actions'
import { getQuestionsByPhase } from '@/lib/actions/question.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clubId } = await params
  const { tab } = await searchParams
  const activeTab = typeof tab === 'string' ? tab : 'phases'

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const club = await db.club.findUnique({
    where: { id: clubId },
    include: {
      readingPhases: { orderBy: { weekIndex: 'asc' } },
      memberships: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  })

  if (!club) redirect('/dashboard')

  const currentMembership = club.memberships.find((m) => m.userId === session.user.id)
  if (!currentMembership) redirect('/dashboard')

  const isAdmin = currentMembership.role === 'MODERATOR'

  /* ── ACTIVE layout ─────────────────────────────────────────────────────── */

  if (club.status === 'ACTIVE') {
    const currentPhase =
      club.readingPhases.find((p) => p.isOpen) ??
      club.readingPhases[club.readingPhases.length - 1] ??
      null

    const [initialMemberCards, initialQuestions, progressResult] = await Promise.all([
      currentPhase
        ? db.memberCard.findMany({
            where: { phaseId: currentPhase.id },
            select: { userId: true, currentPage: true, comment: true },
          })
        : Promise.resolve([]),
      currentPhase
        ? getQuestionsByPhase(currentPhase.id)
        : Promise.resolve([]),
      activeTab === 'progress' ? getClubProgress(clubId) : Promise.resolve(null),
    ])

    const currentPhaseNumber = currentPhase ? currentPhase.weekIndex + 1 : club.numberOfWeeks

    const tabs = [
      { label: 'Phases', value: 'phases' },
      { label: 'Progress', value: 'progress' },
      { label: 'Overview', value: 'overview' },
      { label: 'Grand Library', value: 'library' },
    ]

    return (
      <div className="px-8 py-10 flex flex-col gap-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">{club.name}</h1>
            <span className="font-mono text-xs border border-border px-1.5 py-0.5 text-muted-foreground">
              ACTIVE
            </span>
          </div>
          {club.description && (
            <p className="text-sm text-muted-foreground">{club.description}</p>
          )}
        </div>

        {/* Tab navigation */}
        <nav className="flex border-b border-border -mb-8">
          {tabs.map(({ label, value }) => (
            <Link
              key={value}
              href={`/clubs/${clubId}?tab=${value}`}
              className={cn(
                'px-4 py-2.5 font-mono text-xs tracking-[0.1em] uppercase border-b-2 -mb-px transition-colors',
                activeTab === value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Phases tab */}
        {activeTab === 'phases' &&
          (currentPhase ? (
            <PhasesView
              phases={club.readingPhases.map((p) => ({
                id: p.id,
                weekIndex: p.weekIndex,
                startUnit: p.startUnit,
                endUnit: p.endUnit,
                isOpen: p.isOpen,
              }))}
              memberships={club.memberships.map((m) => ({ user: m.user }))}
              initialMemberCards={initialMemberCards}
              initialQuestions={initialQuestions}
              currentUserId={session.user.id}
              userRole={currentMembership.role}
              isAdmin={isAdmin}
              clubId={clubId}
              defaultPhaseId={currentPhase.id}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No phases are available yet.</p>
          ))}

        {/* Progress tab */}
        {activeTab === 'progress' &&
          (progressResult && 'success' in progressResult ? (
            <ProgressPanel
              clubId={clubId}
              currentUserId={session.user.id}
              openPhaseId={club.readingPhases.find((p) => p.isOpen)?.id ?? null}
              members={club.memberships.map((m) => ({ id: m.user.id, name: m.user.name }))}
              initialProgress={progressResult.data}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Progress is not available.</p>
          ))}

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-[3fr_2fr] gap-8 items-start">
            <div className="flex flex-col gap-6">
              {/* Club info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                    Club
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <p className="font-serif text-base font-semibold">{club.name}</p>
                    {club.description && (
                      <p className="text-sm text-muted-foreground">{club.description}</p>
                    )}
                  </div>
                  <span className="font-mono text-xs border border-border px-1.5 py-0.5 text-muted-foreground w-fit">
                    {club.status}
                  </span>
                </CardContent>
              </Card>

              {/* Book */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                    The Book
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <p className="font-serif text-base font-semibold">{club.bookTitle}</p>
                    <p className="text-sm text-muted-foreground">{club.bookAuthor}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">Total Pages</p>
                      <p className="text-sm">{club.totalPages}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">Progress</p>
                      <p className="text-sm">
                        Phase {currentPhaseNumber} of {club.numberOfWeeks}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {club.memberships.map(({ user, role }) => {
                    const initial = user.name?.charAt(0).toUpperCase() ?? '?'
                    return (
                      <li key={user.id} className="flex items-center gap-2.5">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt={user.name ?? ''}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-mono text-xs shrink-0">
                            {initial}
                          </div>
                        )}
                        <span className="text-sm truncate">{user.name ?? 'Unknown'}</span>
                        {role === 'MODERATOR' && (
                          <span className="font-mono text-[10px] border border-border px-1 py-0.5 ml-auto shrink-0">
                            Admin
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grand Library tab */}
        {activeTab === 'library' && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              No discussions yet. The Grand Library will fill up as phases are completed.
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ── DRAFT layout ──────────────────────────────────────────────────────── */

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${club.inviteCode}`

  return (
    <div className="px-8 py-10 flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">{club.name}</h1>
            <span className="font-mono text-xs border border-border px-1.5 py-0.5 text-muted-foreground">
              {club.status}
            </span>
          </div>
          {club.description && (
            <p className="text-sm text-muted-foreground">{club.description}</p>
          )}
        </div>
        <EditClubDialog club={club} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[2fr_1fr] gap-8 items-start">
        {/* Left — Club info + Reading Phases */}
        <div className="flex flex-col gap-6">
          {/* Book details */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                The Book
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="font-serif text-base font-semibold">{club.bookTitle}</p>
                <p className="text-sm text-muted-foreground">{club.bookAuthor}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">Total Pages</p>
                  <p className="text-sm">{club.totalPages}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm">
                    {club.numberOfWeeks} {club.numberOfWeeks === 1 ? 'week' : 'weeks'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reading Phases */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                Reading Phases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2">
                {club.readingPhases.map((phase) => (
                  <li key={phase.id} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
                      Phase {phase.weekIndex + 1}
                    </span>
                    <span className="text-sm">
                      pages {phase.startUnit}–{phase.endUnit}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right — Members + Invite */}
        <div className="flex flex-col gap-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {club.memberships.map(({ user, role }) => {
                  const initial = user.name?.charAt(0).toUpperCase() ?? '?'
                  return (
                    <li key={user.id} className="flex items-center gap-2.5">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name ?? ''}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-mono text-xs shrink-0">
                          {initial}
                        </div>
                      )}
                      <span className="text-sm truncate">{user.name ?? 'Unknown'}</span>
                      {role === 'MODERATOR' && (
                        <span className="font-mono text-[10px] border border-border px-1 py-0.5 ml-auto shrink-0">
                          Admin
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase">
                Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="font-mono text-xs text-muted-foreground break-all">{inviteUrl}</p>
              <InviteCopyButton inviteUrl={inviteUrl} />
            </CardContent>
          </Card>

          {/* Launch Club — admin only, DRAFT only */}
          {isAdmin && <LaunchClubDialog club={club} />}
        </div>
      </div>
    </div>
  )
}
