- When creating UI components, refer to this for design features.

# Bidder — UI Design Doc

> Scope: **visual/UI system only.** No business logic, no data models, no API contracts — this doc exists so any screen built for Bidder looks and behaves like it belongs to the same product. Written for use as a design-reference skill file.

---

## 1. Design Direction

Bidder is a live-bidding auction platform (general goods, cars, real estate). One instinct still holds regardless of visual style: **auctions are a scoreboard, not a catalog.** The number is the content. Time is the content. Everything else — copy, chrome, decoration — supports those two things and gets out of the way when the clock is running.

**Direction: "quiet SaaS workspace."** Modeled on dribbble.com/shots/27531624-AI-Voice-SaaS-Dashboard-Design. Near-monochrome: a flat sidebar sitting directly on a gray canvas, one large white content panel with the top bar built into it, cards with hairline borders, black primary buttons. It should look hand-designed and simple, not generated — restraint is the whole point.

**Themes:** dark is the default; a sun/moon button in the top bar switches to light (the reference look) and the choice is remembered per browser (`localStorage` key `bidder.theme`, applied as `<html data-theme="light">` by an inline pre-paint script in `app/layout.tsx`, so there's no flash). Every color comes from a token so both themes work.

**Don't (the "vibe-coded" tells):**
- Icons in colored circles/tiles next to every heading, stat, row, toast, or empty state. Icons appear only in nav, buttons, and the auction-card thumbnail tile.
- Filled/soft-colored badges everywhere. Status is a small colored dot + plain text.
- Big stat cards for facts that aren't the point of the page; uppercase tracked eyebrows; ID/lot-number noise; pulsing decorations; a description sentence under every heading.
- Gradients, glows, emoji, drop shadows as decoration (only modals, toasts, and the active nav item get a faint shadow).
- Accent color as decoration. Blue is reserved for links and the focus ring.

---

## 2. Color System

Tokens live in `app/globals.css`: dark values in `@theme` (the default), light values under `:root[data-theme="light"]`. Use them as Tailwind classes (`bg-canvas`, `text-muted`, `border-line`, …); a `light:` variant exists for rare theme-specific tweaks. Hex values are **light / dark**.

| Token          | Hex                     | Use                                                                |
| -------------- | ----------------------- | ------------------------------------------------------------------ |
| `canvas`       | `#F4F4F6` / `#0B0B0D`   | Behind the sidebar and around the content panel                    |
| `surface`      | `#FFFFFF` / `#131316`   | Content panel, cards, inputs, modals; text on an `fg` fill         |
| `subtle`       | `#F6F6F8` / `#1B1B1F`   | Search field, segmented track, thumbnail tiles, fact tiles, hover rows |
| `line`         | `#EBEBEE` / `#25252A`   | Every border and divider                                           |
| `line-strong`  | `#DDDDE2` / `#323238`   | Hover borders                                                      |
| `fg`           | `#111013` / `#EDEDEF`   | Text; **primary button fill**; selected category chips              |
| `muted`        | `#6E6E76` / `#A1A1A9`   | Secondary text, labels, table headers                              |
| `faint`        | `#A1A1A8` / `#6C6C74`   | Chevrons, placeholders, the neutral status dot                     |
| `accent`       | `#1789FE` / `#4AA3FF`   | Links, focus ring, "Upcoming"/"Winner"/"Sent" status dots          |
| `success`      | `#15924A` / `#3CCB7F`   | Live / winning / active bid                                        |
| `danger`       | `#D83B21` / `#F0674F`   | Outbid / rejected / errors / under-5-minute countdown / reserve not met |
| `warning`      | `#B26B00` / `#E3A43B`   | Paused                                                             |

Each status color has a `-soft` variant used only for inline error/success callouts (e.g. a form error box). `success`/`danger` mean bid/auction status and errors — don't reuse them elsewhere. Scrims are `black/40`.

---

## 3. Typography

- **Inter**, loaded via `next/font/google` with the `opsz` axis, so large headings automatically render in the Inter Display cut (as in the reference). Used for everything.
- **Instrument Serif italic** (`font-serif italic font-normal`, ~1.12em) as a single accent word in a page title — currently only "Live & upcoming *auctions*" and "Welcome *back*" on sign-in. Never more than one per screen; don't add it to new screens by default.
- Numbers (money, countdowns, dates, counts) use `.tabular-ticker` (tabular figures) so they don't jiggle.
- Weights: 600 for page/card titles, 500 for row titles and buttons, 400 for everything else. Headings get `-0.02em` tracking.
- Scale: page title 34px (28px mobile) · top-bar title 17px · card title 17px · body 14–15px · labels, table headers, metadata 13px `muted` · current bid 40px.

---

## 4. Core Components

Shared primitives live in `app/components/ui/`; domain components in `app/components/domain/`.

### 4.1 App shell (`AppShell`)

- **Sidebar** (lg+): flat on `canvas`, no card. "Bidder" wordmark (text only), then nav: Browse auctions, then a "Workspace" label with My Auctions, My Bids, Notifications, Account, New auction (signed in). Items are 14px text with a muted 18px icon; the active item is a `surface` pill with a `line` border and a faint shadow. Bottom: a bordered card with the signed-in user, or "Start bidding / Log in" when signed out.
- **Content panel**: one `surface` panel, `rounded-2xl`, `line` border, 8px inset from the viewport.
- **Top bar**: sticky inside the panel with a `line` bottom border. Page title left; right side holds the search field (gray `subtle` fill, "Search auctions"), the theme toggle, notifications and avatar, or Log in / Register when signed out. Icon buttons are 40px squares with a `line` border. The search filters browse live via `?q=`; elsewhere Enter jumps to browse with that query.
- **Mobile** (< lg): the sidebar becomes a slide-in drawer from a menu button, and search drops to its own row.
- **Auth routes** (`/login`, `/register`, `/password/reset`, `/verify-account`) have no shell: wordmark above one centered bordered card.

### 4.2 Buttons (`Button`, `LinkButton`)

Radius 10px, 44px min height (`size="sm"` 36px), weight 500, leading 16px `lucide-react` icon where it names the action.

- **Primary:** `fg` fill with `surface` text, so black in light mode and near-white in dark. Only **one** visible per screen.
- **Secondary:** `surface` with a `line` border.
- **Tertiary:** text only, `muted` → `fg` on hover.
- Use `LinkButton` for navigation, never a `<button>` inside a `<Link>`.

### 4.3 Cards, tables, summary strips

- `Card`: `surface`, `rounded-2xl`, `line` border. `CardHeader`: 17px semibold title, optional short description, actions right.
- Tables sit flush in a card: 13px `muted` header row (normal weight), rows divided by `line`, whole row clickable with a trailing chevron, numbers right-aligned and tabular. Wrap wide tables in `relative overflow-x-auto`. The `relative` matters: without it, `sr-only` header labels escape the scroll container and cause sideways page scroll on mobile.
- **Summary strip** for at-a-glance facts (auction countdown, item count, start, end): one card split by 1px `line` gaps, each cell a 13px muted label over a 15px medium value, with no icons. Don't repeat something already shown above the title (e.g. status).
- **Fact tiles** (item details): `subtle` rounded tiles with a label/value, in a 2-column grid.

### 4.4 Bid Amount Display
13px muted "Current Bid" label, then a 40px tabular figure that snaps on change, then a plain-text line: bid count, plus "You're winning" (success), "Outbid — bid again" (danger), or "Reserve not met" (danger, flag icon). No pills.

### 4.5 Countdown Timer
Tabular `HH:MM:SS`. Under 5 minutes: `danger` with a slow pulse (opacity 100%→85%, 1.2s). Under 60 seconds: seconds go bold. No progress rings.

### 4.6 Status (`StatusPill`)
6px colored dot + 13px `fg` text. Tones: `success` (Live, Active), `danger` (Ending soon, Outbid, Rejected, Failed to send), `warning` (Paused), `info` (Upcoming, Winner, Sent), `neutral` (Closed, Opened, Sold, Pending/Withdrawn).

### 4.7 Segmented control (`Segmented`)
`subtle` track with 10px radius; the selected option is a `surface` pill with a hairline ring. Used for the browse status filter, My Bids filter (with counts), and the notifications channel filter. It scrolls horizontally rather than wrapping.

### 4.8 Bid Input / Confirm
Stepper `−` / amount / `+` (48px, tabular), helper text with the floor and step. Two-step confirm: Place Bid opens a modal with the amount in a `subtle` tile, plus Cancel (secondary) and Confirm (primary). Results show as a dark toast (`fg` fill, `surface` text) with a small status dot, bottom-right, auto-dismissing after 4s.

### 4.9 Forms & Inputs
`surface` field, `line` border, 10px radius, 44px tall; focus turns the border `fg`. 13px `muted` label above (never placeholder-as-label), hint/error below. Forms split into titled cards; submit is right-aligned at the bottom. Errors show as a `danger-soft` callout.

### 4.10 Empty / Error States
A bordered card with a short semibold title, one `muted` sentence in the interface's voice, and at most one secondary button to the next useful place. No icons or illustrations.

---

## 5. Page Skeletons

Every in-shell page starts with a `PageHeader`: optional back link (arrow + muted text), optional `meta` line (status dot, categories), title, optional one-line description, right-aligned actions.

- **Browse (`/`)**: header → status segmented control + result count → 3-column grid (2 on tablet, 1 on mobile) of `AuctionCard`s. Each card is a bordered row: a `subtle` thumbnail tile with the category icon, title, "categories · N items", then status + countdown/end date. Infinite scroll.
- **Auction detail**: header (status + categories meta, owner actions: Edit, Mark Live/Paused, Close auction with confirm modal) → summary strip → Items table card.
- **Item detail**: two columns on desktop. Left: Details card (description + fact tiles) and Top bids table. Right: sticky bid panel (Live now dot, current bid, countdown row, owner Accept/Reject, bid input). On mobile the panel comes first.
- **My Bids**: segmented filter with counts (All / Winning / Outbid / Won / Lost) → bids table.
- **My Auctions**: header with "Create Auction" primary → auctions table card. Infinite scroll.
- **Notifications**: one "Inbox" card with a channel filter; rows show subject, type status, delivery status.
- **Account**: profile card (avatar, "Account" label with the verified checkmark or "Not Verified" badge, name, Log out) → settings sections (title/description left, controls right).

---

## 6. Motion Principles

- **Numbers snap, they don't fade.** Bid amounts and countdown digits use a quick flip/step transition (~120ms), never a cross-fade — reinforces mechanical precision over decorative animation.
- **New activity slides, doesn't pop.** Ticker rows and toasts enter with a short translate + ease-out, no bounce/spring.
- **Urgency escalates via color and weight, not motion volume.** Under 5 minutes, the countdown pulses gently; avoid shaking, confetti, or celebratory animation even on a win — a subtle green check and a calm toast is enough.
- Respect `prefers-reduced-motion`: disable the pulse and flip, fall back to instant value swaps.

---

## 7. Responsive & Accessibility Baseline

- Grid: 4-col cards → 2-col (tablet) → 1-col (mobile). Sidebar becomes a drawer below `lg`. On item detail the bid panel stacks above the details on mobile. Wide tables scroll horizontally inside their card.
- All interactive targets ≥44px.
- Visible keyboard focus on every control (2px `accent` outline, offset 2px) — never `outline: none` without a replacement.
- Color is never the sole status signal: every status pill also carries a text label (not color/icon alone) for colorblind and screen-reader users.
- Minimum contrast: body text 4.5:1, ticker figures at large sizes may use 3:1 per WCAG large-text allowance but should aim higher given their importance.

---

## 8. What NOT to do

- No countdown rings/donut charts as the primary timer.
- No confetti, gradients, or neon on bid confirmation — a win is confirmed with calm color and clear text, not a celebration animation.
- No proportional (non-tabular) numerals anywhere money or time appears.
- Never more than one primary (accent) button on screen at once.
- Don't reuse `success` / `danger` for anything other than bid/auction status and errors.
