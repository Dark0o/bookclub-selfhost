import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateClubDialog } from '@/components/clubs/create-club-dialog'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const memberships = await db.clubMembership.findMany({
    where: { userId: session.user.id },
    include: { club: true },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <div className="px-8 py-10 flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            My Clubs
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Your reading communities
          </p>
        </div>
        <CreateClubDialog />
      </div>

      {memberships.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-6 py-24 border border-dashed border-border">
          <div className="flex flex-col items-center gap-2 text-center max-w-xs">
            <p className="font-serif text-xl text-foreground">No clubs yet</p>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              Create your first reading club and invite friends to read and
              think deeply together.
            </p>
          </div>
          <CreateClubDialog triggerLabel="Create Your First Club" />
        </div>
      ) : (
        /* ── Club grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map(({ club, role }) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
            <Card
              className="hover:bg-muted/30 transition-colors cursor-pointer h-full"
            >
              <CardHeader>
                <CardTitle className="font-serif text-sm font-semibold">
                  {club.name}
                </CardTitle>
                <CardDescription>
                  {club.bookTitle}{' '}
                  <span className="text-muted-foreground/60">—</span>{' '}
                  {club.bookAuthor}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {club.status}
                  </span>
                  {role === 'MODERATOR' && (
                    <span className="font-mono text-xs border border-border px-1.5 py-0.5">
                      Moderator
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
