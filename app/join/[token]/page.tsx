import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinButton } from './join-button'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const club = await db.club.findUnique({
    where: { inviteCode: token },
  })

  if (!club) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-serif text-base font-semibold">Invalid invite link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This invite link is not valid. Ask the club admin for a new one.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect(`/sign-in?callbackUrl=/join/${token}`)
  }

  const existingMembership = await db.clubMembership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: club.id } },
  })

  if (existingMembership) {
    redirect(`/clubs/${club.id}`)
  }

  if (club.status === 'ARCHIVED') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-serif text-base font-semibold">Club archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This club is no longer accepting members.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-base font-semibold">
            You&apos;ve been invited
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="font-serif text-lg font-semibold">{club.name}</p>
            <p className="text-sm text-muted-foreground">
              {club.bookTitle}{' '}
              <span className="text-muted-foreground/60">—</span>{' '}
              {club.bookAuthor}
            </p>
          </div>
          <JoinButton clubId={club.id} />
        </CardContent>
      </Card>
    </main>
  )
}
