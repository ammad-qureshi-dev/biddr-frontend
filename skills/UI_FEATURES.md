- When creating UI components, refer to this for design features.

# Bidder — UI Design Doc

> Scope: **visual/UI system only.** No business logic, no data models, no API contracts — this doc exists so any screen built for Bidder looks and behaves like it belongs to the same product. Written for use as a design-reference skill file.

---

## 1. Design Direction

Bidder is a live-bidding auction platform (general goods, cars, real estate). The inspiration set (Auction Results Page, Drivebay car auctions, Real Estate Auction site) shares one instinct worth stealing: **auctions are a scoreboard, not a catalog.** The number is the content. Time is the content. Everything else — photography, copy, chrome — supports those two things and gets out of the way when the clock is running.

**Direction: "Auction House Ledger."** Think the paddle-and-podium physicality of a real auction house crossed with a departure board. A composed, ink-and-paper base (this is a place where large sums of money change hands — it should feel trustworthy, not gamified), with bid amounts and countdowns rendered in a mechanical, tabular ticker style that snaps and flips rather than fades. Status is color-coded like a scoreboard: winning, outbid, reserve not met, sold.

Avoid: casino/game-show energy (no neon, no confetti-colored gradients), and avoid generic SaaS-dashboard blandness (no default indigo-on-white card grid). The product should feel closer to Sotheby's-meets-Bloomberg-terminal than to a generic marketplace template.

---

## 2. Color System

| Token            | Hex       | Use                                                            |
| ---------------- | --------- | -------------------------------------------------------------- |
| `--ink-950`      | `#14171F` | Primary dark surface (nav, hero, live-auction room background) |
| `--ink-800`      | `#1F2430` | Secondary dark surface (cards on dark)                         |
| `--paper-50`     | `#F6F4EE` | Primary light surface (catalog/browsing background)            |
| `--paper-100`    | `#EDEAE0` | Card surface on light                                          |
| `--brass-500`    | `#C7A241` | Primary accent — CTAs, active bid highlight, selected states   |
| `--brass-600`    | `#A9862F` | Brass hover/pressed                                            |
| `--ledger-green` | `#2E8B57` | Winning / you're the highest bidder / success                  |
| `--ledger-red`   | `#B23A2F` | Outbid / reserve not met / closes soon urgency                 |
| `--slate-500`    | `#6B7280` | Secondary text, metadata, timestamps                           |
| `--slate-200`    | `#D8D6CC` | Borders, dividers on light                                     |
| `--slate-700`    | `#3A3E48` | Borders, dividers on dark                                      |

Rules:

- Dark surfaces (`ink`) are reserved for **live/active bidding contexts** — the auction room, the countdown hero, the bid ticker. This is a deliberate signal: dark = the clock is running, money is moving right now.
- Light surfaces (`paper`) are for **browsing/research contexts** — catalog grids, lot detail pages before bidding opens, account pages, results archives.
- Brass is the only warm accent and is spent on exactly one thing per screen: the primary action or the currently-winning number. Never use brass decoratively.
- Green/red are reserved strictly for bid status. Never reused for generic UI (e.g., don't make a "success toast" green unless it's genuinely a bid outcome).

---

## 3. Typography

| Role                | Typeface                                      | Notes                                                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display / headlines | **Fraunces** (or similar high-contrast serif) | Auction titles, lot names, hero numbers when not live-ticking. Used at large sizes, semibold–bold, tight tracking.                                                                                                                          |
| UI / body           | **Inter**                                     | Nav, buttons, form labels, descriptions, all UI chrome. Never used for the bid amount itself.                                                                                                                                               |
| Numeric / ticker    | **IBM Plex Mono** (tabular figures)           | **All bid amounts, countdown timers, lot numbers, currency.** Fixed-width digits so numbers don't jiggle the layout when they update. This is the signature typographic move — money and time are always monospace, everything else is not. |

Type scale (base 16px):

- Display XL: 56 / 60 — auction hero title
- Display L: 36 / 42 — lot title on detail page
- Ticker XL: 44px mono, tabular-nums — live current-bid figure
- Ticker M: 20px mono — countdown, secondary bid figures on cards
- Body: 16 / 24 — descriptions
- Caption: 13 / 18, `--slate-500` — metadata, timestamps, lot numbers

---

## 4. Core Components

### 4.1 Buttons

Three tiers only — don't add a fourth without a reason.

- **Primary (Bid actions):** Solid `--brass-500` fill, `--ink-950` text, 8px radius, bold weight. Pressed state darkens to `--brass-600` and scales to 98%. Reserved exclusively for the bid-related CTA on any given screen (Place Bid, Confirm Bid, Register to Bid) — there is only ever **one** primary button visible at a time.
- **Secondary:** 1.5px `--ink-950` (or `--paper-50` on dark) outline, transparent fill. For Watch/Save, Ask a Question, View Details.
- **Tertiary / text:** No border, `--slate-500` text, underline on hover. For Cancel, Learn more, in-table row actions.
- All buttons: 44px min height (touch target), 8px corner radius, no gradients, no shadows on the button itself.

### 4.2 Bid Amount Display

The signature component. Always mono/tabular-nums, always right-aligned in tables so digits line up. On update (a new bid lands), the digits **flip/snap** — not a fade or slide. Treat each digit like a mechanical odometer character.

```
CURRENT BID
$ 48,500
↑ 12 bids · reserve met
```

States:

- Default: `--ink-950` on paper / `--paper-50` on ink
- You are winning: number rendered in `--ledger-green`, small "you're winning" tag
- You've been outbid: number in `--ledger-red`, tag "outbid — bid again"
- Reserve not met: amount in default color, small red flag icon + "reserve not met" caption

### 4.3 Countdown Timer

Mono ticker, `HH:MM:SS`, always tabular width so it doesn't reflow the layout. Under 5 minutes: switch to `--ledger-red`, add a slow pulse (opacity 100%→85%→100%, 1.2s ease, not a hard blink). Under 60 seconds: seconds digits go bold. Never use a circular progress ring as the primary countdown — a ring can't be read at a glance the way digits can; use one only as a small secondary accent if needed.

### 4.4 Lot Card (catalog grid)

```
┌─────────────────────────┐
│                          │  ← image, 4:3, object-fit cover
│                          │
├─────────────────────────┤
│ LOT 0042          ⏱ 2:14:09
│ 1967 Porsche 911S       │ ← Fraunces, display
│ CURRENT BID              │
│ $ 48,500          [Bid] │ ← mono ticker + primary button
└─────────────────────────┘
```

- `--paper-100` surface, 1px `--slate-200` border, 12px radius, no drop shadow at rest; on hover, lift 2px with a soft shadow (`0 8px 24px rgba(20,23,31,0.08)`).
- Lot number always top-left in mono caption style, small and quiet — it's a reference number, not a headline.
- Status badge (Live / Upcoming / Sold / Reserve Not Met) top-right of image as a pill: solid fill, white text, color per §2.

### 4.5 Status Pills / Badges

Pill shape, 4px vertical / 10px horizontal padding, 12px caption text, uppercase, letterspaced.

- **Live** — `--ledger-green` fill
- **Ending Soon** — `--ledger-red` fill (auto-applies under 15 min)
- **Upcoming** — `--slate-500` fill
- **Sold** — `--ink-950` fill, `--brass-500` text
- **Reserve Not Met** — outline only, `--ledger-red` text

### 4.6 Bid Input / Confirm

Bidding is the highest-stakes interaction in the product — never let it feel like a generic form field.

- Stepper input: `−` / amount / `+` buttons, amount in mono, increments follow the lot's set bid-increment (display it as helper text: "increments of $500").
- Confirm is a **two-step, deliberate action**: tapping the primary Bid button opens a lightweight confirm sheet/modal ("Confirm bid of $49,000?") rather than firing instantly. This mirrors a real paddle-raise — a beat of intent before commitment — and prevents costly mis-taps.
- After confirmation: brief full-width toast in `--ledger-green`, "Bid placed — you're the highest bidder," auto-dismiss 4s.

### 4.7 Live Bid Ticker / Activity Feed

Sidebar or drawer on the live auction room screen, dark surface. Each row: timestamp (mono, small, `--slate-500`) · bidder initials/avatar · amount (mono, bold). New rows insert at top with a quick slide-down, not a fade — reinforces the "ledger entry just posted" feeling.

### 4.8 Navigation

- Top nav: `--ink-950` bar, logo left (wordmark in Fraunces), primary nav center/right in Inter, a persistent "Watching" or "My Bids" icon with a small mono count badge in brass.
- On a live auction room screen, the nav collapses to a slim bar so the countdown/bid area dominates the viewport.

### 4.9 Forms & Inputs

Standard fields: `--paper-100` fill, 1px `--slate-200` border, 8px radius, `--brass-500` 2px border on focus (no glow/shadow focus rings — keep it crisp). Labels in Inter, 13px, `--slate-500`, positioned above the field, always visible (no placeholder-as-label).

### 4.10 Empty / Error States

Written in the interface's voice, not apologetic. Example: an empty "My Bids" page says "You haven't bid on anything yet — browse live auctions" with a primary button straight to the catalog, not a generic illustration-and-shrug.

---

## 5. Page Skeletons

### 5.1 Catalog / Browse (light, `--paper-50`)

Hero band (optional, auction house branding) → filter/sort bar (sticky) → responsive lot-card grid (4.4) → pagination or infinite scroll. Filters: category, closing time, price range, "Live now" toggle pinned first.

### 5.2 Lot Detail (light, transitions to dark once live)

Two-column: image gallery/carousel left (60%), sticky bid panel right (40%) containing current bid (4.2), countdown (4.3), bid input (4.6), bid history table (mono, compact rows). Description, condition report, seller info below the fold. When the auction goes live, the right panel's background shifts to `--ink-950` to signal "this is happening now."

### 5.3 Live Auction Room (dark, `--ink-950`)

Full-bleed dark. Center: hero countdown + current bid in giant mono ticker. Below: bid input (4.6). Side/drawer: live activity feed (4.7). This is the only screen where the countdown is the largest element on the page — everything else recedes to `--slate-700` borders and low-contrast chrome.

### 5.4 Results / Post-Auction (light)

Modeled directly on the "Auction Results" inspiration: a table-first layout, mono figures throughout (hammer price, lot #, bid count), sortable columns, final status pill (Sold / Passed / Reserve Not Met) per row. Summary stat strip at top (total lots, total hammer value, sell-through %) in large mono numerals.

### 5.5 My Bids / Account

List of lots grouped by status tabs (Winning / Outbid / Won / Lost), each row reusing the lot-card pattern in a compact horizontal variant.

---

## 6. Motion Principles

- **Numbers snap, they don't fade.** Bid amounts and countdown digits use a quick flip/step transition (~120ms), never a cross-fade — reinforces mechanical precision over decorative animation.
- **New activity slides, doesn't pop.** Ticker rows and toasts enter with a short translate + ease-out, no bounce/spring.
- **Urgency escalates via color and weight, not motion volume.** Under 5 minutes, the countdown pulses gently; avoid shaking, confetti, or celebratory animation even on a win — a subtle green check and a calm toast is enough.
- Respect `prefers-reduced-motion`: disable the pulse and flip, fall back to instant value swaps.

---

## 7. Responsive & Accessibility Baseline

- Grid: 4-col cards → 2-col (tablet) → 1-col (mobile), bid panel on lot detail becomes a bottom sheet on mobile rather than a sidebar.
- All interactive targets ≥44px.
- Visible keyboard focus on every control (2px `--brass-500` outline, offset 2px) — never `outline: none` without a replacement.
- Color is never the sole status signal: every status pill also carries a text label (not color/icon alone) for colorblind and screen-reader users.
- Minimum contrast: body text 4.5:1, mono ticker figures at large sizes may use 3:1 per WCAG large-text allowance but should aim higher given their importance.

---

## 8. What NOT to do

- No countdown rings/donut charts as the primary timer.
- No confetti, gradients, or neon on bid confirmation — a win is confirmed with calm color and clear text, not a celebration animation.
- No proportional (non-tabular) numerals anywhere money or time appears.
- Never more than one primary (brass) button on screen at once.
- Don't reuse `--ledger-green` / `--ledger-red` for anything other than bid status.
