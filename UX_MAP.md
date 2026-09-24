# BookClub — UX Map (v1)

> This document defines all screens, their contents, and navigation structure for v1.
> It serves as the source of truth for frontend implementation.

---

## 1. Application Zones

The app is divided into three main zones:

- **Public** — unauthenticated pages (landing, auth, invite)
- **Dashboard** — authenticated user's home base
- **Club** — everything inside a single club

---

## 2. Public Zone

### `/` — Landing Page
- Marketing page, app value proposition
- Sign in / Sign up CTAs

### `/sign-in` — Sign In
- Email/password login
- Google OAuth login

### `/sign-up` — Sign Up
- Email/password registration
- Google OAuth registration

### `/join/[token]` — Invite Page
- Basic club info (name, book title, author)
- "Join Club" CTA
- Requires authentication — redirect to sign-in if not logged in, then back to this page

---

## 3. Dashboard Zone

### `/dashboard` — My Clubs
- List of all clubs the user belongs to (as Admin or Member)
- Club card shows: club name, book title, status (DRAFT / ACTIVE / ARCHIVED), current phase
- "Create Club" button → opens Create Club modal

#### Create Club Modal
Form fields:
- Club Name (required)
- Description (optional)
- Book Title (required)
- Book Author (required)
- Total Pages (required)
- Number of Weeks (required)

On submit: club created in DRAFT status, reading phases auto-generated (equal page distribution across weeks), user redirected to club page.

---

## 4. Club Zone

Club URL: `/clubs/[clubId]`

The club renders differently based on its status.

---

### 4a. Club — DRAFT Status

**Club Settings Page**

Everything the Admin entered during creation, all editable:
- Club Name
- Description
- Book Title / Author
- Total Pages / Number of Weeks
- Phase page ranges (auto-calculated, Admin can adjust)

Additional:
- Members list — shows who has joined via invite link so far (avatar + name)
- Invite link — copyable, shareable
- **"Launch Club"** button — Admin sets a start date, all phase unlock dates are calculated automatically, club transitions to ACTIVE

> Members who joined see a "waiting" state — club hasn't launched yet.

---

### 4b. Club — ACTIVE Status

Top navigation inside the club: **Phases | Overview | Grand Library**

Default view on entry: **Phases tab, active phase selected.**

---

#### Phases Tab

Top of the page: phase tab bar showing all phases (e.g. Phase 1 | Phase 2 | Phase 3 | Phase 4).
- Unlocked phases: clickable
- Locked phases: visible but greyed out, not clickable

**Active/Unlocked Phase View — Two-column layout:**

**Left (main area) — Member Cards**
- One card per club member
- Cards are arranged vertically (order by join date) and positioned horizontally based on reading progress
- Left edge = beginning of phase, right edge = end of phase page range
- Each card shows:
  - Member avatar + name
  - Progress bar / current page (updated via slider)
  - Short personal comment/takeaway (one per phase, editable)
- User can update their own card's progress and comment at any time

**Right (sidebar) — Question Pool**
- Header: "Question Pool"
- List of proposed questions, stacked vertically (folder/file style)
- Each question row shows: question text (truncated), vote count, emoji reactions, pin indicator (if Admin-pinned)
- Clicking a question → opens Question Detail modal
  - Full question text
  - Upvote button + count
  - Emoji reactions
  - Admin pin indicator
- "Ask Question" button at the bottom → opens Ask Question modal
  - Textarea for question
  - Submit

**Admin-only actions (within active phase):**
- Pin one question (Admin Veto) — replaces any previous pin
- "Close Phase" button → triggers phase closing flow:
  - App surfaces top-voted questions as suggestions
  - Admin confirms or adjusts which questions move to Grand Library
  - Selected questions become discussion threads in Grand Library
  - Next phase unlocks

---

#### Overview Tab

Read-only informational screen:
- Club name + description
- Book title + author
- Club status
- Phase progress (e.g. "Phase 2 of 4")
- Members list (avatar + name)

---

#### Grand Library Tab

All questions that have been moved from the Question Pool across all closed phases.

- Questions grouped by phase (Phase 1, Phase 2, etc.)
- Each question shows: question text, number of replies, phase label
- All content is **spoiler-safe by default** — blurred until clicked ("Click to Reveal")
- Clicking a question → navigates to **Question Thread Page**

---

#### Question Thread Page

URL: `/clubs/[clubId]/library/[questionId]`

- Full question text (spoiler-safe blur, click to reveal)
- Threaded discussion (Reddit-style nested replies)
  - Reply to the question directly
  - Reply to any existing reply
  - All replies spoiler-safe by default
- Back navigation → Grand Library

---

### 4c. Club — ARCHIVED Status

Top navigation: **Overview | Grand Library**

Phases tab is hidden — reading is complete.

- **Overview** — same as ACTIVE, read-only
- **Grand Library** — same as ACTIVE, permanent record of all discussions
- **Question Thread Page** — same as ACTIVE

> No actions available — club is a read-only "digital shelf."

---

## 5. Navigation Summary

| Screen | URL | Access |
|---|---|---|
| Landing | `/` | Public |
| Sign In | `/sign-in` | Public |
| Sign Up | `/sign-up` | Public |
| Invite | `/join/[token]` | Public (auth required to join) |
| Dashboard | `/dashboard` | Authenticated |
| Club (DRAFT) | `/clubs/[clubId]` | Club members |
| Club (ACTIVE) | `/clubs/[clubId]` | Club members |
| Club (ARCHIVED) | `/clubs/[clubId]` | Club members |
| Question Thread | `/clubs/[clubId]/library/[questionId]` | Club members |

---

## 6. Modal Inventory

| Modal | Trigger | Content |
|---|---|---|
| Create Club | Dashboard "Create Club" button | Club + book + reading plan form |
| Ask Question | Question Pool "Ask Question" button | Question textarea + submit |
| Question Detail | Clicking a question in the Pool | Full question, votes, reactions |
| Close Phase | Admin "Close Phase" button | Top question suggestions, Admin confirms selection |
