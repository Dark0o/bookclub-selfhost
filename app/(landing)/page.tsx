import Link from "next/link";
import {
  BooksIcon,
  ChatTeardropTextIcon,
  CalendarDotsIcon,
} from "@phosphor-icons/react/ssr";
import { NavAuth } from "@/components/landing/nav-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    Icon: BooksIcon,
    title: "Private Clubs",
    description:
      "Your space, your rules. Invite a small circle of readers and define the pace together. No algorithms, no noise.",
  },
  {
    Icon: ChatTeardropTextIcon,
    title: "Deep Discussions",
    description:
      "Structured weekly threads keep conversations focused. Members propose questions; the group votes; the best rise.",
  },
  {
    Icon: CalendarDotsIcon,
    title: "Reading Sync",
    description:
      "Threads unlock only when the week's pages are due. Everyone arrives at the discussion having read the same words.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-serif text-base font-bold tracking-tight">BookClub</span>
        <div className="flex items-center gap-3">
          <NavAuth />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-grid-pattern overflow-hidden">
        {/* Soft fade so the grid dissolves into white at the bottom */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/0 via-background/20 to-background" />

        <div className="relative mx-auto max-w-5xl px-6 py-32 lg:py-52 flex flex-col gap-8">
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Reading Reimagined
          </span>

          <h1 className="font-serif text-5xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-foreground max-w-2xl">
            Open a Book.
            <br />
            Start the
            <br />
            Conversation.
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Private reading clubs built for deep thinkers. Weekly structured
            threads, a question-valuation system, and a permanent archive of
            your group&rsquo;s best insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="h-11 px-8 text-xs tracking-wide"
              asChild
            >
              <Link href="/sign-in">Start Your Club</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-8 text-xs tracking-wide"
              asChild
            >
              <Link href="/sign-up">Create an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="mx-auto w-full max-w-3xl px-6 py-28 lg:py-36 flex flex-col items-center gap-8 text-center">
        <div className="h-px w-10 bg-border" />

        <blockquote className="font-serif text-2xl lg:text-3xl leading-normal text-foreground">
          &ldquo;A story is a letter that the author writes to himself, to tell
          himself things that he would be unable to discover otherwise.&rdquo;
        </blockquote>

        <cite className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase not-italic">
          — Carlos Ruiz Zafón
        </cite>

        <div className="h-px w-10 bg-border" />
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-5xl px-6 py-24 lg:py-32 flex flex-col gap-14">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              What we offer
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-foreground">
              Built for serious readers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border border border-border">
            {features.map(({ Icon, title, description }) => (
              <Card
                key={title}
                className="rounded-none ring-0 border-0 bg-card py-8"
              >
                <CardHeader className="gap-4">
                  <Icon size={22} className="text-foreground" />
                  <CardTitle className="text-sm font-medium tracking-wide">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="mx-auto w-full max-w-3xl px-6 py-32 lg:py-44 flex flex-col items-center gap-8 text-center">
        <h2 className="font-serif text-3xl lg:text-4xl text-foreground leading-[1.3]">
          The next great conversation
          <br />
          starts with a single page.
        </h2>

        <Button size="lg" className="h-11 px-8 text-xs tracking-wide" asChild>
          <Link href="/sign-up">Join the Community</Link>
        </Button>

        <p className="font-mono text-xs text-muted-foreground tracking-wide">
          Free to start. No credit card required.
        </p>
      </section>
    </main>
  );
}
