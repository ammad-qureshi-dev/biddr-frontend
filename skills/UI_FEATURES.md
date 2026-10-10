- When creating UI components, refer to this for design features.

# Bidder — UI Design Doc

> Scope: **visual/UI system only.** No business logic, no data models, no API contracts — this doc exists so any screen built for Bidder looks and behaves like it belongs to the same product. Written for use as a design-reference skill file.

---

## 1. Design Direction

Bidder is a live-bidding auction platform (general goods, cars, real estate). One instinct still holds regardless of visual style: **auctions are a scoreboard, not a catalog.** The number is the content. Time is the content. Everything else — copy, chrome, decoration — supports those two things and gets out of the way when the clock is running.

**Direction: "Airbnb."** This is a single-theme **light** application — there is no dark mode and no toggle, the whole product is always light. It's an image-forward listings product: generous rounded corners (`rounded-2xl` on cards/images, fully pill-shaped buttons and search fields), borderless cards that rely on whitespace and a large square image instead of a bordered panel, soft hover lift/zoom instead of shadows-as-decoration. Colorwise: a white/off-white app background, a single coral accent (Airbnb's own "Rausch" red-pink), near-black text, neutral (not cold) grays. One typeface family (Poppins) for everything except numbers, which stay monospace.

Bid amounts and countdowns still snap rather than fade, and status is still color-coded — that mechanical-ticker precision survives every visual direction this doc has been through.

Avoid: gradients, neon, confetti, dark panels floating in the light UI, drop shadows as decoration, cold/gray-blue tints (grays are neutral, warm-leaning like Airbnb's own, not slate-blue), and don't build a dark-mode variant or a theme switcher — light is the only theme. Structure and whitespace carry the hierarchy; the accent color is spent sparingly and only when it means something.

---

## 2. Color System

> Token names below (`ink`, `paper`, `brass`, `ledger-*`) are historical from earlier visual directions this doc has cycled through — kept as-is so component code doesn't need renaming every time the palette changes. Read the Hex/Use columns as ground truth, not the names.

| Token            | Hex       | Use                                                                                   |
| ---------------- | --------- | -------------------------------------------------------------------------------------- |
| `--ink-950`      | `#222222` | Primary text and borders/outlines — near-black, drawn on the light app background      |
| `--ink-800`      | `#484848` | Secondary dark tone, rarely used directly                                              |
| `--paper-50`     | `#FFFFFF` | Page background — white, the base the whole app sits on                                |
| `--paper-100`    | `#F7F7F7` | Elevated surface — cards, panels, image placeholders; one step darker than the page so content reads as "raised" without a shadow |
| `--brass-500`    | `#FF385C` | Primary accent — Airbnb's "Rausch" coral. CTAs, links, focus ring, selected states      |
| `--brass-600`    | `#E61E4D` | Accent hover/pressed                                                                    |
| `--ledger-green` | `#00A699` | Winning / live / success status (a teal-leaning green, distinct from the coral accent so "you're winning" doesn't visually blend into every button on the page) |
| `--ledger-red`   | `#D93900` | Outbid / error / closes-soon urgency                                                   |
| `--slate-500`    | `#717171` | Secondary text, metadata, timestamps                                                    |
| `--slate-200`    | `#EBEBEB` | Borders, dividers — a step darker than the page background, not lighter                 |
| `--slate-700`    | `#484848` | Rarely used; a slightly stronger border/divider than slate-200 for components that need more separation |

Rules:

- **Text drawn directly on the coral accent (or on the status greens/reds) is always white, never dark.** Coral, the status green, and the status red are all saturated/dark enough that white text passes contrast comfortably — buttons, selected chips, and status pills all use literal `text-white` for their on-fill text. (If the accent or a status color is ever swapped for something pale/pastel, re-check this — a light enough fill color needs dark on-fill text instead, as was true during an earlier mint-green accent pass.)
- Elevation is tonal, not shadow-based: the page is `paper-50`, anything meant to read as a card/panel/dialog sits on `paper-100`, separated by a thin `slate-200` border. Don't reach for `box-shadow` to separate surfaces.
- The accent (`brass-500`, coral) is spent on exactly one thing per screen: the primary action, a link, or a selected/focused state.
- `ledger-green` (status) and `brass-500` (accent, coral) are deliberately different hues so a "you're winning" indicator doesn't read as just another button.
- Modal/overlay scrims are a literal `black/70` — this works regardless of the app's base theme.
- Red is reserved for bid/auction urgency and errors. Don't reuse it for unrelated UI.

---

## 3. Typography

| Role                | Typeface                            | Notes                                                                                                                                                                                                       |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display / headlines | **Poppins**, semibold–bold           | Auction titles, item names, page headings. A rounded geometric sans, warmer than a neutral UI font, still legible at every size. (The `font-display` class exists in code for these spots and now maps to Poppins.) |
| UI / body           | **Poppins**                          | Nav, buttons, form labels, descriptions — the whole app uses one family, at different weights, rather than pairing a display font with a separate body font.                                              |
| Numeric / ticker    | **IBM Plex Mono** (tabular figures)  | **All bid amounts, countdown timers, lot numbers, currency.** Fixed-width digits so numbers don't jiggle the layout when they update — the one place the app intentionally breaks from Poppins, because tabular alignment matters more than typeface consistency for money and time. |

Type scale (base 16px):

- Display XL: 40 / 44, semibold — page hero title
- Display L: 24 / 28, semibold — item title on detail page, lot card titles
- Ticker XL: 44px mono, tabular-nums — live current-bid figure
- Ticker M: 20px mono — countdown, secondary bid figures on cards
- Body: 16 / 24 — descriptions
- Caption: 13 / 18, `--slate-500` — metadata, timestamps, lot numbers

---

## 4. Core Components

### 4.1 Buttons

Three tiers only — don't add a fourth without a reason.

- **Primary (Bid actions):** Solid `--brass-500` fill, white text, fully pill-shaped (`rounded-full`), bold weight. Pressed state darkens to `--brass-600` and scales to 98%. Reserved exclusively for the primary CTA on any given screen (Place Bid, Confirm Bid, Register) — there is only ever **one** primary button visible at a time.
- **Secondary:** 1.5px `--ink-950` outline, transparent fill, pill-shaped. For Watch/Save, Ask a Question, View Details.
- **Tertiary / text:** No border, `--slate-500` text, underline on hover. For Cancel, Learn more, in-table row actions.
- All buttons: 44px min height (touch target), no gradients, no shadows on the button itself.
- Every button and CTA carries a leading icon (16px, `lucide-react`) — pick one that names the action, not a decorative one: `Gavel` for bid/auction actions, `Check`/`X`/`Ban` for accept/cancel/reject, `Plus`/`Trash2` for add/remove item rows, `Save` for saving a form, `LogIn`/`LogOut`/`UserPlus` for auth, `Mail`/`MessageSquare`/`Send` for contact actions, `Search` for browse/find. Nav links follow the same rule (see §4.8). The shared `Button` component takes an `icon` prop for this — don't hand-roll icon + label markup outside it if a plain `<Button>` will do.

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
│                          │  ← square image, rounded-2xl, no border
│                          │     status pill floats top-right on the image
│                          │
└─────────────────────────┘
  LOT 0042          ⏱ 2:14:09      ← below the image, not inside a card panel
  1967 Porsche 911S               ← Poppins, semibold
  CURRENT BID
  $ 48,500                        ← mono ticker
```

- No card border or background — the "card" is just a large square image (`rounded-2xl`, neutral-gray placeholder if there's no photo) with the title/metadata sitting directly on the page below it, Airbnb-listing style. On hover, the image scales up slightly (~1.05×); the text block doesn't move.
- Lot number always top-left in mono caption style, small and quiet — it's a reference number, not a headline.
- Status badge (Live / Upcoming / Closed / Reserve Not Met) floats top-right *on the image* as a pill: solid fill, color per §2.

### 4.5 Status Pills / Badges

Pill shape (`rounded-full`), 4px vertical / 10px horizontal padding, 12px caption text, uppercase, letterspaced.

- **Live** — `--ledger-green` fill, white text
- **Ending Soon** — `--ledger-red` fill (auto-applies under 15 min), white text
- **Upcoming** — `--slate-500` fill, white text
- **Closed / Sold** — `--ink-950` fill, white text
- **Reserve Not Met** — outline only, `--ledger-red` text, transparent fill

### 4.6 Bid Input / Confirm

Bidding is the highest-stakes interaction in the product — never let it feel like a generic form field.

- Stepper input: `−` / amount / `+` buttons, amount in mono, increments follow the lot's set bid-increment (display it as helper text: "increments of $500").
- Confirm is a **two-step, deliberate action**: tapping the primary Bid button opens a lightweight confirm sheet/modal ("Confirm bid of $49,000?") rather than firing instantly. This mirrors a real paddle-raise — a beat of intent before commitment — and prevents costly mis-taps.
- After confirmation: brief full-width toast in `--ledger-green`, "Bid placed — you're the highest bidder," auto-dismiss 4s.

### 4.7 Live Bid Ticker / Activity Feed

A plain list (table on desktop, compact rows generally), same white surface as everything else — no separate dark drawer. Each row: bidder · timestamp (mono, small, `--slate-500`) · status pill · amount (mono, bold, right-aligned). New rows can slide in rather than fade when used as a live-updating feed.

### 4.8 Navigation

- Top nav: same `paper-50` app background as the page, 1px `--slate-200` bottom border, split into two groups. **Left:** logo (accent color) + Browse. **Right:** the signed-in-only links (My Auctions, My Bids, Notifications) immediately followed by the profile avatar — or Log in / Register (pill, accent-filled) when signed out. Nothing sits in the center.
- Signed-in profile control is a circular avatar (initial of the user's first name, `slate-700` fill) linking to `/account` — not a name + separate logout control. Account/logout live on the account page itself.
- On a focused bidding view, the nav can collapse to a slim bar (hide the Browse link and the My Auctions/My Bids/Notifications group) so the bid panel gets more room — the avatar and logo stay, and it's still the same `paper-50` bar, it doesn't invert to a different color.

### 4.9 Forms & Inputs

Standard fields: white fill, 1px `--slate-200` border, `rounded-xl` (or `rounded-full` for a search field), 2px `--ink-950` border on focus — focus state is dark, not the accent color, matching how the accent is reserved for actions rather than form chrome. Labels 13px, `--slate-500`, positioned above the field, always visible (no placeholder-as-label).

### 4.10 Empty / Error States

Written in the interface's voice, not apologetic. Example: an empty "My Bids" page says "You haven't bid on anything yet — browse live auctions" with a primary button straight to the catalog, not a generic illustration-and-shrug.

---

## 5. Page Skeletons

### 5.1 Catalog / Browse

Page heading → sticky filter bar (pill "Live now" toggle, pill search field, status dropdown) → responsive lot-card grid (4.4, borderless image cards) → pagination or infinite scroll.

### 5.2 Item Detail

Two-column: large square image left, bid panel right (bordered card, `rounded-2xl`, `paper-100` surface) containing current bid (4.2), countdown (4.3), bid input (4.6), bid history below. Description below the title. **There is no separate "live room" mode** — when the auction is live, the same layout shows a small pulsing accent-colored "Live now" badge inside the bid card instead of a distinct full-page treatment. One consistent layout regardless of auction status keeps the page simple to reason about.

### 5.3 Results / Post-Auction

Modeled directly on the "Auction Results" inspiration: a table-first layout, mono figures throughout (hammer price, lot #, bid count), sortable columns, final status pill (Sold / Passed / Reserve Not Met) per row. Summary stat strip at top (total lots, total hammer value, sell-through %) in large mono numerals.

### 5.4 My Bids / Account

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
