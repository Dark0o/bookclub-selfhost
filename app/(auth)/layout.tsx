import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Minimal top bar */}
      <header className="flex items-center px-6 py-5 border-b border-border">
        <Link
          href="/"
          className="font-serif text-base font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity"
        >
          BookClub
        </Link>
      </header>

      {/* Centered form area */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  )
}
