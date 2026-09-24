@AGENTS.md

# BookClub — Agent Orientation

## What This App Does

Private reading clubs for structured book discussions. Members propose questions, vote on the best ones, and build a permanent archive of the group's top insights.

**Club lifecycle:** DRAFT → ACTIVE → ARCHIVED  
**Core loop:** Admin creates club → invites members → sets weekly reading phases → members propose & vote on questions → best answers get archived to the Grand Library.

---

## Tech Stack (exact versions matter)

| Layer         | Technology                               | Version             |
| ------------- | ---------------------------------------- | ------------------- |
| Framework     | Next.js App Router                       | 16.2.4              |
| UI runtime    | React                                    | 19.2.4              |
| Auth          | Better Auth (`better-auth`)              | latest              |
| Database      | Supabase PostgreSQL + Prisma ORM         | Prisma 7.7          |
| DB adapter    | `@prisma/adapter-pg`                     | 7.7                 |
| Component lib | shadcn/ui (style: `radix-lyra`)          | 4.3                 |
| CSS           | Tailwind CSS                             | v4 (PostCSS plugin) |
| Icons         | Phosphor Icons (`@phosphor-icons/react`) | 2.x                 |
| Validation    | Zod                                      | 4.x                 |
| Data fetching | TanStack Query (`@tanstack/react-query`) | 5.x                 |

> **Next.js 16 / React 19 warning:** APIs differ significantly from training data. Always check `node_modules/next/dist/docs/` before using any Next.js APIs. Heed deprecation notices.

---

## File Structure

```
app/
  (auth)/             # Public auth routes — sign-in, sign-up (custom Shadcn forms)
    sign-in/page.tsx  # Email/password + Google OAuth
    sign-up/page.tsx  # Email/password + Google OAuth
  (dashboard)/        # Protected routes — layout has sidebar + UserMenu
    dashboard/        # Main dashboard: user's clubs list
    clubs/[clubId]/   # Club detail page — branches on club.status:
                      #   DRAFT: info, phases, members, invite, launch button
                      #   ACTIVE: tab layout (Phases | Overview | Grand Library) via ?tab= search param
  (landing)/          # Public marketing page
  join/[token]/       # Invite link handler — public route, auth-checks internally
  api/auth/[...all]/  # Better Auth catch-all API handler
  layout.tsx          # Root layout: plain server component, no provider needed
  globals.css         # Tailwind v4 + OKLCh CSS variables

components/
  ui/                 # shadcn/ui primitives + user-menu.tsx (sign-out button, takes userName prop)
                      # installed: button, card, dialog, form, input, label, textarea, calendar, popover
  clubs/              # Business components: create-club-dialog.tsx, edit-club-dialog.tsx, invite-copy-button.tsx,
                      #   launch-club-dialog.tsx (DRAFT → ACTIVE: date picker + unlock-date preview table)
                      #   phases-view.tsx (ACTIVE Phases tab: phase selector [isOpen-gated], member card grid, question pool)
                      #     isAdmin prop controls Close Phase button visibility
                      #   close-phase-modal.tsx (admin-only: select questions to approve, calls closePhase() action)
                      #   member-card-item.tsx (single member card: progress bar, comment, inline edit for own card)
                      #   question-pool.tsx (right sidebar: question list with upvote/react/pin, TanStack Query + optimistic updates)
                      #     ProposeQuestionModal — textarea + char counter, react-hook-form/zodResolver, own useTransition, inline server error
                      #     QuestionDetailModal — full text, author, upvote/react/pin; reuses QuestionPool handlers, no duplicated action logic
  landing/            # nav-auth.tsx — client component for landing page nav
  providers.tsx       # QueryClientProvider wrapper — wraps all children in root layout

lib/
  auth.ts             # Server-side Better Auth instance (Prisma adapter + Google + email/password)
  auth-client.ts      # Client-side: createAuthClient, exports signIn/signOut/signUp/useSession
  actions/            # Server actions ('use server') — one file per domain
    club.actions.ts   # createClub(), updateClub(), joinClub(), launchClub()
    phase.actions.ts  # getMemberCards(phaseId), updateMemberCard(input), closePhase(input)
    question.actions.ts # proposeQuestion(), voteOnQuestion(), pinQuestion(), reactToQuestion(), getQuestionsByPhase(phaseId)
  validations/        # Zod schemas — one file per domain, re-exported from index.ts
    club.schema.ts
    phase.schema.ts   # updateMemberCardSchema, closePhaseSchema
    question.schema.ts # proposeQuestionSchema, voteOnQuestionSchema, pinQuestionSchema, reactToQuestionSchema
    index.ts
  db.ts               # Prisma client singleton (PrismaPg adapter)
  utils.ts            # cn() — clsx + tailwind-merge

utils/supabase/       # Supabase clients (browser / server / middleware) — set up but not used for data yet
middleware.ts         # Better Auth session cookie route protection
prisma/
  schema.prisma       # Source of truth for DB schema
  migrations/         # Never edit manually
generated/            # Prisma client output — gitignored, never edit
```

---

## Architecture Rules

### Server vs Client Components

- **Default to server components** — every page and layout is a server component unless it needs interactivity.
- Mark `'use client'` only when the component uses: state, effects, event handlers, browser APIs, or `useTransition`.
- Never import server-only code (`db`, `auth` from `@/lib/auth`) into client components. Use `authClient` from `@/lib/auth-client` on the client side.

### Data Fetching — TanStack Query

`QueryClientProvider` is set up in `components/providers.tsx` and mounted in the root layout. Every interactive feature follows this pattern:

1. **Server component fetches initial data** and passes it as `initialData` to the client component — no loading spinner on first render.
2. **Client component hydrates TQ** with that data, owns state from there on.
3. **Mutations call server actions**, then invalidate the relevant query key on success.

```tsx
// Server page
const questions = await db.question.findMany(...)
<QuestionList initialQuestions={questions} phaseId={phaseId} />

// Client component
const { data: questions } = useQuery({
  queryKey: ["questions", phaseId],
  queryFn: () => fetchQuestions(phaseId),
  initialData: initialQuestions,
})

const { mutate: vote } = useMutation({
  mutationFn: voteOnQuestion,
  onMutate: async (questionId) => { /* optimistic update */ },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["questions", phaseId] }),
})
```

### URL-Based Tab Navigation

Prefer `?tab=` search params over client state for tab navigation — tabs become deep-linkable and survive refresh with zero client JS.

In the server page, read `searchParams` (a Promise in Next.js 16) and pass the active tab down:

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<...> }) {
  const { tab = 'phases' } = await searchParams
  // render <Link href={`/clubs/${clubId}?tab=overview`}>
}
```

Client state for tabs is only appropriate when the tabs hold transient UI state (e.g. a wizard) that must not be bookmarkable.

### Passing Dates Across the Server/Client Boundary

`Date` objects must be serialized to ISO strings before being passed as props from a server component to a client component. Pass them as `string | null`, convert in the server component with `.toISOString()`, and compare using `new Date(str).getTime()` on the client.

```tsx
// ✓ Server page
phases={phases.map(p => ({ ...p, startedAt: club.startedAt?.toISOString() ?? null }))}

// ✓ Client component
const started = startedAt != null && new Date(startedAt).getTime() <= Date.now()
```

### Server Actions as TanStack Query `queryFn`

Read-only server actions can be used directly as a `queryFn` — Next.js converts the call to an RPC request from the client. This avoids the need for separate API routes for simple data reads.

```tsx
// lib/actions/phase.actions.ts  ('use server')
export const getMemberCards = async (phaseId: string) => { ... }

// Client component
useQuery({
  queryKey: ['member-cards', phaseId],
  queryFn: () => getMemberCards(phaseId),
  initialData: ...,
  refetchInterval: 60_000,
})
```

Keep mutations and reads in the same `<domain>.actions.ts` file — split only when the file grows unwieldy.

### Session in Client Components

**Client components inside `(dashboard)` never call `useSession()`** — middleware already guarantees the user is authenticated. Session data is fetched once in the server layout/page and passed down as props.

```tsx
// ✓ Server layout fetches session, passes display name as prop
const session = await auth.api.getSession({ headers: await headers() })
<UserMenu userName={session?.user.name} />

// ✗ Don't do this inside protected routes
const { data: session } = useSession()
```

`useSession()` is only appropriate in client components **outside protected routes** (e.g. `NavAuth` on the landing page) where no server parent holds a session to pass down.

### Phase Progression — Admin-Driven, Not Time-Driven

**`isOpen` is the single source of truth for phase state.** All phase-gating logic (question interactions, phase selector navigation, Overview progress) derives from `isOpen`, not from `unlockDate`.

- `launchClub()` sets phase 0 `isOpen: true` and all others `false`. That's the only place `isOpen` is set to `true` outside of `closePhase()`.
- `closePhase()` is the only mechanism to advance phases: sets current phase `isOpen: false`, sets next phase (by `weekIndex + 1`) `isOpen: true`, and marks selected questions `APPROVED`.
- If the last phase is closed, the club stays `ACTIVE` — no automatic archiving.
- `unlockDate` is stored on each `ReadingPhase` (set at launch as `startDate + weekIndex * 7 days`) but is **metadata only** — it is never used for any logic in the app. Do not add `unlockDate`-based conditions.
- `Club.startedAt` records when the club was launched (set once by `launchClub()`).
- Phase selector tabs are accessible if `phase.isOpen || phase.weekIndex < openPhaseIndex` — past phases stay browsable, future phases are locked.

### Mutations → Server Actions

- All DB writes go through server actions in `lib/actions/`.
- Server actions always start with `'use server'`.
- Return type pattern: `{ success: true; data: T } | { error: string }`.
- Validate input with Zod before touching the DB.
- Use `revalidatePath()` after mutations that change displayed data.
- Call server actions from client components via `useTransition()` — never `await` directly in event handlers.

### Database Access

- Import `db` from `@/lib/db` — never instantiate `PrismaClient` elsewhere.
- Multi-step writes **must** use `db.$transaction()`.
- The Prisma client output lives in `/generated/` (custom output path in schema.prisma). Import types from there or from `@prisma/client` (re-exported).
- At runtime, Prisma uses `DATABASE_URL` (pgbouncer-pooled). Never use `DIRECT_URL` in app code.

#### Prisma / DB rules

- **`prisma/schema.prisma` is the single source of truth.** Never alter the DB directly (Supabase dashboard, raw SQL, etc.) — Prisma will detect the divergence as "drift" and block the next migration.
- **`migrate dev` is for development only.** It creates + applies a new migration and regenerates the client. Always use a descriptive name: `npx prisma migrate dev --name <descriptive-name>`.
- **`migrate deploy` is for production/CI.** It applies pending migrations without interactive prompts and never resets anything. Never run `migrate dev` or `migrate reset` against a production database.
- **Never edit migration SQL files manually.** Change `schema.prisma` and let Prisma generate the SQL.
- **If drift is detected and you have data to keep:** run `npx prisma migrate resolve --applied <last-migration-name>` to acknowledge the current DB state as the baseline, then run `migrate dev` normally.
- **If drift is detected and data doesn't matter (early dev):** `npx prisma migrate reset --force` drops and rebuilds the schema cleanly, then run `migrate dev` to apply the new migration.
- **After editing the schema without migrating** (e.g. to unblock TypeScript): run `npx prisma generate` to regenerate the client from the schema without touching the DB.

### Validation

- Define Zod schemas in `lib/validations/<domain>.schema.ts`.
- Export types with `export type Foo = z.infer<typeof fooSchema>`.
- Re-export from `lib/validations/index.ts`.
- Validate in both the client component (fast feedback) and the server action (security).

### Styling

- **Tailwind v4** — config lives in `globals.css`, not `tailwind.config.js`.
- Colors use **OKLCh** (`oklch(L C H)`) — do not hardcode hex values; use CSS variables (`--background`, `--foreground`, `--primary`, etc.).
- Custom fonts: serif = `font-[family-name:var(--font-playfair)]`, mono = `font-[family-name:var(--font-mono)]`.
- Use `cn()` from `@/lib/utils` for conditional/merged class names.

### Components

- shadcn components live in `components/ui/` — never edit them directly; extend via `cva` if needed.
- Business components go in `components/<domain>/` (e.g., `components/clubs/`).
- Use Phosphor Icons (`@phosphor-icons/react`), not Lucide.

---

## Auth (Better Auth)

- `middleware.ts` protects all routes except `/`, `/sign-in`, `/sign-up`, `/join/*` using `getSessionCookie` from `better-auth/cookies`. The join page is public so it can redirect unauthenticated users to `/sign-in?callbackUrl=/join/[token]` (sign-in reads `callbackUrl` and uses it as the post-login redirect).
- **Server-side session** (pages, layouts, server actions):
  ```ts
  import { auth } from "@/lib/auth";
  import { headers } from "next/headers";
  const session = await auth.api.getSession({ headers: await headers() });
  // session.user.id, session.user.email, session.user.name
  ```
- **Client-side session** (client components):
  ```ts
  import { useSession, signIn, signOut, signUp } from "@/lib/auth-client";
  const { data: session } = useSession();
  ```
- **Sign in with email:** `signIn.email({ email, password, callbackURL: "/dashboard" })`
- **Sign in with Google:** `signIn.social({ provider: "google", callbackURL: "/dashboard" })`
- **Sign out:** `signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/sign-in" } } })`
- No provider wrapper needed in layout — Better Auth works via API routes and cookies.
- User `id` is a cuid auto-generated by Better Auth (not tied to any external provider UID).

---

## Database Schema (Prisma)

Key models and relationships:

```
User (cuid PK, auto-generated by Better Auth)
  emailVerified   → Boolean
  image           → String?
  sessions        → Session[]
  accounts        → Account[]
  ownedClubs      → Club[]
  memberships     → ClubMembership[]
  questions       → Question[]
  answers         → Answer[]
  votes           → Vote[]
  memberCards     → MemberCard[]
  reactions       → Reaction[]

Session / Account / Verification  ← Better Auth internal tables, do not query directly

Club
  ownerId         → User
  bookTitle       → String (embedded, no separate Book model)
  bookAuthor      → String
  totalPages      → Int
  numberOfWeeks   → Int
  status          → ClubStatus (DRAFT | ACTIVE | ARCHIVED)
  startedAt       → DateTime? (set when club is launched — never changes after that)
  inviteCode      → String @unique (6-char hex, e.g. "A1B2C3")
  memberships     → ClubMembership[]
  readingPhases   → ReadingPhase[]

ClubMembership  (@@unique [userId, clubId])
  role            → MemberRole (MEMBER | MODERATOR)

ReadingPhase    (weekly reading chunk)
  weekIndex, description?, startUnit, endUnit
  unlockDate?     → metadata only — stored but never used for logic (see Phase Progression above)
  isOpen          → Boolean — the authoritative flag; only one phase is open at a time
  questions       → Question[]
  memberCards     → MemberCard[]

MemberCard      (@@unique [userId, phaseId])
  currentPage     → Int
  comment         → String?
  userId          → User
  phaseId         → ReadingPhase

Question
  status          → QuestionStatus (PROPOSED | APPROVED)
  isPinned        → Boolean (admin veto pin — exclusive per phase, toggle)
  upvotesCount    → Int (denormalized count, kept in sync by voteOnQuestion transaction)
  answers         → Answer[]
  votes           → Vote[]
  reactions       → Reaction[]

Answer          (self-relation for nested replies)
  parentId        → Answer? (Reddit-style threads)
  replies         → Answer[]

Vote            (@@unique [userId, questionId])

Reaction        (@@unique [userId, questionId, emoji])
  emoji          → String
  userId         → User
  questionId     → Question
```

---

## Code Style

- **Functions:** Use `const` arrow functions — never `function` declarations.
  ```ts
  const handleSubmit = () => { ... }   // ✓
  function handleSubmit() { ... }      // ✗
  ```
- **Event handlers:** Prefix with `handle` (e.g., `handleSubmit`, `handleOpenChange`).
- **Type imports:** Use `import type` for type-only imports.
- **File naming:** `kebab-case` for files, `PascalCase` for components and types.
- **Async server action results:** Always destructure and return `{ error }` — never throw.

### Comments

- Comments explain **why**, never what — code that needs a "what" comment should be refactored instead.
- Inline JSX section dividers (`{/* Book */}`) are fine. Remove all other obvious comments.

### TypeScript

- No `any` — use `unknown` and narrow, or fix the type properly.
- No non-null assertions (`!`) unless an outer null-check already guarantees the value (e.g., after `if (!userId) return`).
- Prefer `type` over `interface`.

### Next.js / React

- `'use client'` / `'use server'` directives go on line 1, before imports.
- Server components should be `async` — fetch data directly, no `useEffect` for data loading.
- Prefer `Promise.all()` for parallel fetches in server components over sequential `await`.
- No `useEffect` for derived state — compute inline or with `useMemo`.
- Co-locate types with the file that owns them — only extract to a shared file if 3+ files need them.

---

## Environment Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=    # generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (callback URL: http://localhost:3000/api/auth/callback/google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Postgres
DATABASE_URL=          # pgbouncer-pooled — used by Prisma at runtime
DIRECT_URL=            # direct connection — used by Prisma CLI only
```

---

## Common Tasks

### Add a new server action

1. Create or add to `lib/actions/<domain>.actions.ts` with `'use server'` at top.
2. Add Zod schema to `lib/validations/<domain>.schema.ts` and re-export from `index.ts`.
3. Return `{ success: true; ... } | { error: string }`.
4. Call `revalidatePath(...)` after successful mutation.

### Add a new protected page

1. Create `app/(dashboard)/<route>/page.tsx` as an async server component.
2. Get session via:
   ```ts
   import { auth } from "@/lib/auth";
   import { headers } from "next/headers";
   const session = await auth.api.getSession({ headers: await headers() });
   if (!session) return null;
   ```
3. Fetch data with `db.<model>.findMany({ where: { userId: session.user.id } })`.
4. Add nav link in `app/(dashboard)/layout.tsx` sidebar.

### Add a new public page

1. Create `app/(landing)/<route>/page.tsx` or a new route group.
2. Add to `publicRoutes` in `middleware.ts` if needed.

### Add a shadcn component

```bash
npx shadcn@latest add <component>
```

Components land in `components/ui/`. Use the `radix-lyra` style.

### Prisma schema change

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive-name>`.
3. Prisma regenerates `/generated/` automatically.
4. Never manually edit migration SQL.
5. If TypeScript is blocking you before the migration runs, `npx prisma generate` regenerates types from the schema without touching the DB.

---

## What's Not Yet Built

- Nested answer threads
- Grand Library (placeholder tab exists; APPROVED questions are stored but no UI to display them yet)
- Club settings / admin panel
- Supabase Realtime (for live updates — member cards currently poll every 60 s via TanStack Query)
- Reading phase management after launch (phases are created at launch; no UI to edit page ranges or descriptions after)
