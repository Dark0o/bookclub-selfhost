# BookClub — Product Decisions (v1)

> This document captures all product decisions made during the pre-development planning phase.
> It serves as the source of truth for v1 scope. Anything not listed here is explicitly out of scope.

---

## 1. Core Concept

Private reading clubs for structured, deep book discussions. The core value proposition is transforming passive reading into active group engagement through a structured question-and-discussion system.

**The problem being solved:** Online discussions about books (Reddit, etc.) are too general and lack focus. This app creates a small, private, structured space where a group reads the same book at the same pace and builds a curated archive of the group's best insights.

**Core differentiator:** The Question Pool + Voting + Admin Veto system. Good questions are the currency of the app.

---

## 2. v1 Segments & Scope

### Segment 1 — Auth & Profile
- Email/password and Google OAuth login
- Session management via Better Auth
- Basic user identity (name, email, avatar)
- **No dedicated profile page in v1** — post-v1

### Segment 2 — Club
- Admin creates a club with the following form:
  - Club Name (required)
  - Description (optional)
  - Book Title (required)
  - Book Author (required)
  - Total Pages (required)
  - Number of Weeks (required)
- `Book` is **not a separate model** — `bookTitle` and `bookAuthor` are stored directly on the `Club` model
- Club is created in **DRAFT** status
- Reading phases are **auto-generated** on club creation: pages divided equally across weeks
- Admin **manually launches** the club (DRAFT → ACTIVE) by setting a start date; unlock dates for all phases are calculated automatically from that date
- No minimum member requirement — Admin decides when to launch based on who has joined
- Invite system via unique 6-char token link (`/join/[token]`)
- Club lifecycle: **DRAFT → ACTIVE → ARCHIVED**
- Admin manually archives the club after the last phase is closed

### Segment 3 — Reading Phases
- Each phase has:
  - Page range (start/end), auto-calculated but Admin can adjust
  - Description written by Admin
  - Unlock date (auto-calculated from start date)
- A phase unlocks automatically on its unlock date
- **Member Cards** are displayed within each phase (see Segment 5 — Engagement)
- Admin closes a phase manually and selects which questions move to the Grand Library

### Segment 4 — Question Pool
- Active during an open reading phase
- Any member can propose questions related to the current reading section
- All members can vote on questions (upvote only)
- Members can add **emoji reactions** to questions (lightweight, non-vote engagement)
- Admin can **pin one question** regardless of vote count (Admin Veto)
- Questions in the Pool are only questions — no discussion threads here
- When Admin closes the phase, the app surfaces top-voted questions as suggestions; Admin confirms or adjusts which ones move to the Grand Library

### Segment 5 — Member Engagement (Gamification)
- Each member has a **Member Card** visible to all members within a phase
- The card contains:
  - Reading progress (current page), updated via a **slider**
  - A short personal comment/takeaway for that phase
- Cards are **visually positioned** along the phase timeline based on reading progress — members "move" toward the end of the phase as they read
- This creates a lightweight social/competitive awareness without explicit leaderboards

### Segment 6 — Grand Library
- Created from top questions selected by Admin at the end of each phase
- Each selected question becomes a **threaded discussion** (Reddit-style nested replies)
- All content is **spoiler-safe by default** — blurred until clicked ("Click to Reveal")
- The Grand Library accumulates entries from all phases throughout the book
- Upon club archival, the Grand Library becomes the permanent "digital shelf" of that club's best insights

---

## 3. Explicit Out-of-Scope for v1

- User profile page
- Notifications / reminders
- Free-form chat or feed within a phase
- Public clubs / club discovery
- Grand Library auto-archiving (manual Admin action only)
- Mobile app
- Cultural book map / cross-region book discovery (separate product idea)
- Public sharing of answers or notes
- Book model as a separate entity (ISBN, covers, metadata)

---

## 4. Key Product Decisions (Reasoning)

| Decision | Choice | Reason |
|---|---|---|
| Book as embedded data vs. separate model | Embedded on Club | Avoids duplicates, no book discovery in v1 |
| Phase generation | Auto-generated, Admin can adjust | Better onboarding UX, one less manual step |
| Club launch trigger | Manual by Admin | Small private groups, Admin knows when everyone is in |
| Minimum members to launch | None | Admin controls timing, keeps flow simple |
| Phase closing | Manual by Admin | Gives Admin control over pacing |
| Question → Grand Library transition | Admin confirms top suggestions | Curated feel, not purely algorithmic |
| Free chat inside phase | Excluded | Members have WhatsApp etc.; would dilute Question Pool focus |
| Grand Library in v1 | Included | Core part of the value loop, not optional |
| Progress tracking | Slider input, visible to all | Simple UX, drives social engagement |
| Reactions on questions | Emoji reactions | Low effort, increases engagement without complexity |

---

## 5. The Full User Flow (v1)

```
Admin creates club (name, book, pages, weeks)
  → Phases auto-generated
  → Club in DRAFT

Members join via invite link
  → Admin sets start date and launches club
  → Club becomes ACTIVE, Phase 1 unlocks

Phase is open:
  → Members read their section
  → Members update progress via slider on their Member Card
  → Members add a short comment to their Member Card
  → Members propose questions in the Question Pool
  → Members vote and react to questions in the Pool
  → Admin can pin one question (Veto)

Admin closes the phase:
  → App suggests top-voted questions
  → Admin confirms selection
  → Selected questions move to Grand Library as discussion threads
  → Members discuss in threaded replies (spoiler-safe)
  → Next phase unlocks

Repeat for all phases.

Admin archives the club:
  → Grand Library becomes permanent record
  → Club moves to ARCHIVED
```

---

## 6. Post-v1 Backlog

- User profile page (reading history, finished clubs, wish list)
- Notifications and reminders
- Free-form phase chat
- Public club discovery
- Insight Digest (personalized summary per member at end of club)
- Supabase Realtime for live updates
- Mobile app
- Cultural book map (separate product)
