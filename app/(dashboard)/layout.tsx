import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { UserMenu } from '@/components/ui/user-menu'
import { HouseSimpleIcon, BookOpenIcon } from '@phosphor-icons/react/ssr'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  const displayName =
    session?.user.name?.split(' ')[0] ??
    session?.user.email ??
    'Account'

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-border">
          <Link
            href="/dashboard"
            className="font-serif text-base font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity"
          >
            BookClub
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2 py-2 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <HouseSimpleIcon size={14} className="shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <BookOpenIcon size={14} className="shrink-0" />
            My Clubs
          </Link>
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-border flex items-center gap-2.5">
          <UserMenu userName={displayName} />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
