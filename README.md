# BookClub

Private reading clubs for structured book discussions. A small group reads one book at the same
pace, week by week. Members propose questions about each week's section, vote on the best ones, and
the club builds an archive of its best insights.

## How it works

1. **An admin creates a club** for one book: title, author, total pages and number of weeks. The
   pages are split into weekly reading phases automatically.
2. **Members join through an invite link** (`/join/<code>`).
3. **The admin launches the club** by picking a start date. Club status goes `DRAFT → ACTIVE`, and
   each phase unlocks on its date.
4. **During a phase**, members post progress on their member cards and propose questions in the
   Question Pool. Everyone upvotes; the admin can pin one question regardless of votes.
5. **The admin closes each phase** and picks which questions move on. After the last phase, the club
   is archived.

Question and answer content is spoiler-safe: blurred until the reader chooses to reveal it.

## Tech stack

- **Next.js 16** (App Router) and **React 19**
- **Better Auth** for email/password and Google sign-in
- **PostgreSQL** (Supabase) with **Prisma 7**
- **Tailwind CSS 4** and **shadcn/ui**
- **TanStack Query** for client data
- **Zod** for validation
- **Vitest** for unit tests

## Getting started

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env   # fill in the values listed in CLAUDE.md → Environment Variables
npx prisma migrate dev
npm run dev            # http://localhost:3000
```

## Scripts

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Project layout

```
app/          Routes: (landing), (auth), (dashboard), join/[token], api/auth
components/   Club UI (dialogs, phases, question pool) and shadcn/ui primitives
lib/          Server actions, auth, db client, Zod schemas, domain helpers
prisma/       Schema and migrations
utils/        Supabase clients
```

## Documentation

- **`PRODUCT_DECISIONS.md`**: v1 scope and product rules. **Source of truth** when documents
  disagree.
- **`UX_MAP.md`**: every screen and how they connect.
- **`CLAUDE.md`**: architecture rules, conventions and common tasks for contributors and coding
  agents.
- **`BLUEPRINT.md`**: the original concept. Partly superseded; see the note at its top.

## Status

v1 in progress. Clubs, invites, launching, reading phases, member cards and the Question Pool work.
Not built yet: nested answer threads, the Grand Library archive view, a club settings page, realtime
updates, and editing phases after launch.
