- When making UI changes, always refer to these feature lists. _Always_ have these features included. New features will be added here.

# App Features

This document describes the user-facing features of the bidding application, derived from the backend services (identity/auth, catalog, bidding, notification). It is organized by domain/category and is meant to drive frontend screen and flow design. Each bullet is a discrete, specific capability the frontend should support.

---

## Standard API Response Envelope

Every service (identity/auth, catalog, bidding, notification) wraps **every** HTTP response — success or failure — in the same envelope shape. The frontend's API client should have exactly **one** response-unwrapping layer built around this shape rather than per-endpoint parsing.

```ts
interface ApiResponse<T> {
  data: T | null;
  completedAt: string; // ISO-8601 timestamp, e.g. "2026-08-08T14:32:01.123"
  requestId: string; // UUID, unique per request — useful for support/debugging correlation
  messages: ApiMessage[]; // always an array, never null; empty on a plain success
}

interface ApiMessage {
  type: "WARNING" | "INFO" | "ERROR";
  content: string; // human-readable message text
}
```

- **`data`** — the actual payload for the endpoint (e.g. a `UUID` for a create action, a summary object, a list of summaries). On error responses, `data` is `null`.
- **`completedAt`** — server timestamp of when the response was produced. Not the same as any domain timestamp (e.g. bid `placedAt`) — purely a response-envelope metadata field.
- **`requestId`** — a fresh UUID generated per response. Worth logging/surfacing in error toasts or a "copy request ID" affordance for support/debugging.
- **`messages`** — a list of zero or more `ApiMessage` entries. On a clean success this is typically empty. On errors, it will contain at least one message (see below). The frontend should be prepared to render **multiple** messages (e.g. stacked toasts) even though today's handlers only emit one.

### Error handling contract

There is **no separate error response shape** — failures are still an `ApiResponse` with `data: null` and one or more `messages` explaining what went wrong. The frontend should branch on **HTTP status code** to decide how to treat the response, then read `messages[0].content` (or all of them) for user-facing text:

| HTTP Status                 | When it happens                                                                                    | `ApiMessage.type` |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| `400 Bad Request`           | A business-rule/validation failure (e.g. bid too low, invalid auction timing, user already exists) | `WARNING`         |
| `401 Unauthorized`          | Bad login credentials                                                                              | `ERROR`           |
| `403 Forbidden`             | Illegal access — e.g. an expired or invalid password-reset/verification token                      | `ERROR`           |
| `404 Not Found`             | Requested resource doesn't exist (e.g. unknown auction/bid/item ID)                                | `WARNING`         |
| `500 Internal Server Error` | Unhandled/unexpected exception                                                                     | `ERROR`           |

Practical guidance for the frontend:

- Treat `WARNING`-type messages (400/404) as recoverable, user-correctable issues — show inline form errors or a toast, don't treat as a crash.
- Treat `ERROR`-type messages (401/403/500) as harder failures — for 401, redirect to login; for 403 on a token flow, show "link expired/invalid, please request a new one"; for 500, show a generic "something went wrong" state.
- Because the error text in `messages[].content` is often the raw exception message (not a stable error code), don't pattern-match on exact strings for critical logic — use the HTTP status as the primary signal and the message purely for display.
- Successful responses can still carry `messages` (e.g. an `INFO` note) alongside real `data` — always render `messages` if present, even on the happy path, rather than only checking them when `data` is null.
- One inconsistency to be aware of: catalog-service (auction/item endpoints) currently mirrors this exact shape via its own local copy of the DTOs rather than the shared one the other services use — the JSON on the wire is identical, so the frontend client does not need to special-case it.

---

## Request Identity Header (`X-App-User-Id`)

**Important, cross-cutting contract:** any backend request whose handling depends on "who is the current user" — i.e. any endpoint marked `auth: true` in the frontend client, across **all four services** (identity/auth, catalog, bidding, notification) — expects an **`X-App-User-Id`** header carrying that user's ID, in addition to whatever session/JWT credential is sent.

- The user ID for this header is derived from the caller's auth token (the backend does not re-derive identity purely from the header — it's sent alongside the token, not instead of it).
- The frontend API client (`app/lib/api.ts`) already implements this: `getUserId()` reads the session's stored user ID and the shared `request()` helper attaches it as `X-App-User-Id` on every call where it's available, and rejects with a `401` client-side before sending if a call marked `auth: true` has no user ID to attach.
- Any **new** endpoint or service call that depends on the current user (fetching "my" data, mutating a user-owned resource, anything gated on ownership) must go through this same path so the header is populated — don't hand-roll a `fetch` that skips it.
- Because this applies uniformly across services, treat it as a base transport concern (like the response envelope above), not something to reason about per-endpoint.

---

## App User / Account

### Registration & Login

- A visitor can **register** a new account with:
  - Full name (required)
  - Email address and/or phone number (at least one of the two is required)
  - Password (required)
- Password must meet complexity rules: at least 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character. (Note: this rule may be relaxed in some environments, so the frontend should still surface server-side validation errors, not just its own.)
- Registration fails with a clear error if the email is already in use.
- On successful registration, the user is automatically logged in (session/token issued) and a **welcome notification** is sent to whichever contact method (email or phone) they registered with.
- A visitor can **log in** using either their email or phone number, plus their password.
- Login fails with a generic "invalid credentials" error (no hinting whether it was the identifier or password that was wrong).
- A logged-in user can **log out**, ending their session.

### Account Verification

- A user can request an **account verification link/code** be sent to a contact method of their choice (email or phone).
- If a verification request is already pending and not expired, a duplicate request is silently ignored (no new link is sent) — the frontend should treat "resend" as safe to click but explain a link may already be on its way.
- The verification link contains a token; submitting that token via the **verify account** action marks the account as verified.
- A verification link is time-limited; using an expired link shows a "link expired" error and the user must request a new one.
- A **confirmation notification** is sent once the account is successfully verified.
- A logged-in user can **check whether their account is verified** (`GET /auth/account-verification/is-verified`, identity service). The frontend surfaces this on the Account page: a badge next to the "Account" eyebrow (a green checkmark, tooltip "Account is verified", when verified; a "Not Verified" pill, tooltip "Account is not verified, please verify", when not) and hides the "Verify your account" panel entirely once the account is verified, since it's no longer actionable.

### Password Management

- Any visitor — signed in or not — can request a **password reset link** by submitting the raw email address or phone number on the account (`POST /auth/password/reset/send-link`, body `{ contact }`; the backend looks the account up by that value rather than a session). This powers a proper "forgot password" flow from the sign-in page for someone who is locked out and never authenticated. A logged-in user can also trigger it from the Account page by picking Email/Phone, which resolves to that contact's stored value.
- The response never confirms or denies whether the contact matched an account (the frontend treats a "not found" the same as a successful send) — this flow must not become a way to enumerate registered emails/phone numbers.
- Like verification links, only one active reset request can exist at a time; requesting again while one is pending won't issue a second link.
- The reset link contains a token; the user submits the token along with their **new password** to complete the reset. The token identifies the account on its own — the reset screen must **not** ask the user to re-enter their email/phone (irrelevant to the flow and an unnecessary way to surface/collect an identifier on a page reached from a link).
- Reset tokens are time-limited; expired tokens show a "link expired" message.
- After a successful password reset, a **confirmation notification** is sent to the user's preferred contact method.

### Contact Methods & Preferences

- A user can view their current **contact methods** (email and phone number, showing "N/A" for any that aren't set).
- A user can view and set their **preferred contact method** — Email, Phone, or in-App — which is used as the default channel for all system notifications (bid updates, password resets, etc.).
- When setting a preferred contact method that the user doesn't have on file yet (e.g. choosing "Phone" but no phone number is saved), the user must supply that contact value at the same time.
- If a user has not yet set a preferred contact method, actions that depend on it (e.g. sending a notification) will prompt them to set one first.

---

## Auction

### Creating & Managing Auctions

- A logged-in user can **create an auction** with:
  - A title
  - A start time and an end time
  - One or more **items** to be auctioned (an auction cannot be created with zero items)
  - One or more **categories** describing the auction, chosen from: Electronics, Vehicles, Real Estate, Art & Collectibles, Jewellery & Watches, Fashion & Accessories, Furniture & Home, Sports & Outdoors, Books & Media, Toys & Games, Industrial & Machinery, Antiques, Other
- Auction start/end time validation: the start time must be before the end time, unless both start and end are already in the past (which allows backdating/importing historical auctions); the UI should validate this before submit and surface a clear "invalid auction timing" error otherwise. (TODO: catalog-service now rejects any past start/end time, so the backdating allowance is slated for removal — kept in the FE for now.)
- Auction start and end times must fall on a **15-minute mark** (minutes of :00, :15, :30 or :45, with zero seconds) — the catalog service rejects any other value. The create/edit form steps the datetime pickers in 15-minute increments, snaps a typed-in value to the nearest quarter hour on blur, and blocks submit with an inline error if the time isn't on a 15-minute mark.
- The creator of the auction becomes its **owner**.
- The owner (or an admin flow) can **edit an auction**: update its title, start time, end time, and categories, and **add new items** to it.
- The owner can **change the auction's status** between:
  - **Live** — actively accepting bids (formerly called "Open" — the API and frontend both use `LIVE` now)
  - **Paused** — temporarily not accepting activity
  - **Closed** — auction has ended, no further bidding
- Status transitions are one-way once **Closed**: the backend rejects any attempt to move a closed auction back to Live or Paused ("Auction is CLOSED, cannot perform update"), and a Live/Paused auction whose end time has already passed can't be moved to Live either ("Auction window has closed"). The frontend hides the status-changer entirely once an auction is closed, and confirms before closing since it's irreversible.
- **Closing an auction** (`PUT /auction/{auctionId}/status/CLOSED`) is a consequential, one-way action: the backend finalizes the highest bid on every item in the auction and sends each winning bidder a "bid accepted" notification as part of the same request. The frontend should treat clicking "Closed" like a bid confirmation — a deliberate second step, not a bare status toggle.
- A user can view **"My Auctions"** — a list of all auctions they created, shown as summaries (title, status, categories, item count, start/end time).

### Browsing & Searching Auctions

- Any user can **view full auction details**: title, owner, status, categories, start/end time, and the list of items in it.
- Any user can **view the items within a given auction**.
- Any user can **search/browse auctions** using any combination of filters:
  - Title keyword search
  - Status (Live / Paused / Closed)
  - Starting after a given date/time
  - Ending before a given date/time
- Search results are returned as summaries suitable for a list/grid view (title, status, categories, item count, start/end time).

---

## Item

- Each auction contains one or more **items**, each with:
  - A title
  - A description
  - An optional **minimum (reserve) price** — if set, no bid below this amount can be accepted
- Any user can **view an individual item's details**, including:
  - Title, description, minimum price
  - The **current highest bid amount** and which bid it belongs to (live "leading bid" indicator)
  - The **final sold price**, once the item has been sold/awarded
- Item summaries (used in auction listing pages) show title, description, minimum price, and a **sold/unsold flag** — useful for showing a "SOLD" badge in the UI.
- New items can be added to an existing auction (via the auction edit flow); items already in an auction are not removed or edited through that flow.

---

## Bid

### Placing & Managing Bids

- A logged-in user can **place a bid** on an item by specifying:
  - The auction and item being bid on
  - A bid amount
  - An optional **expiration time** for the bid (after which it's no longer eligible to win if not acted on)
- Bid amount validation:
  - The bid must be **strictly higher** than the current highest bid on that item (if one exists).
  - The bid must be **at or above the item's minimum price**, if a minimum price is set.
  - The frontend should proactively show the current highest bid / minimum price on the bid form and block submission if the entered amount doesn't clear both.
- Placing a new highest bid automatically **outbids** the previous highest bidder on that item — the previous bidder's bid flips to an "outbid" state (frontend should notify/highlight this to the previous bidder, e.g. via their notification inbox).
- A bidder can **update/raise their own existing bid** (same amount and reserve-price validation applies). Only the original bidder can update their bid — attempting to modify someone else's bid is rejected.
- Placing a bid triggers a **"bid placed" confirmation notification** to the bidder.

### Accepting & Rejecting Bids

- The party reviewing bids on an item can **accept a bid**, marking it as the **Winner**.
  - Only the bid that is currently the active/highest bid can be accepted.
  - Once a bid has been accepted for an item, no other bid on that item can subsequently be accepted (an item can only be sold/awarded once).
  - Only the bid's owner path (per current bid-ownership check) can trigger acceptance — the UI should reflect that action is unavailable/hidden if the caller doesn't have accept rights on the bid.
- A bid can be **rejected** with a required **rejection reason** (free text, e.g. "insufficient funds"), which is stored and shown back to the bidder.
  - A user cannot reject their own bid.
  - When the currently-active bid on an item is rejected, the system automatically **promotes the next-highest, unexpired bid** to active status — the UI should reflect this hand-off (e.g. re-fetch the item's leading bid after a rejection).

### Bid Visibility & History

- A user can **view a single bid's details**: amount, status, status description (e.g. rejection reason), when it was placed, and when it expires.
- A user can view **"My Bids"** — every bid they've personally placed, across all items/auctions, with current status.
- Any user can view the **full bid history for an item** — every bid placed on it, useful for a "bid activity" panel on the item detail page.
- Bid status values the frontend should render distinctly (e.g. as colored badges):
  - **Active** — currently the highest/leading bid
  - **Outbid** — was leading, has since been surpassed
  - **Winner** — accepted as the winning bid for the item
  - **Rejected** — explicitly rejected, with a reason shown
  - **Withdrawn** — bidder pulled out of the bid

---

## Notifications

- The system automatically sends notifications to users for key lifecycle events, including:
  - Welcome message on registration
  - Account verification link sent / account verified confirmation
  - Password reset link sent / password successfully updated
  - Contact method set up
  - Bid placed ("bid request sent"), bid updated, bid accepted, bid rejected
- Notifications are delivered via the recipient's chosen/preferred **contact channel**: Email, Phone (SMS), or in-App — the frontend's in-app notification inbox should reflect "App" channel notifications specifically.
- A user can **view their notification history**, optionally filtered by channel (Email / Phone / App) — useful for building a filterable notification/inbox screen.
- A user (or the system) can **update a notification's status**, e.g. marking it as **Opened** once the user has viewed/read it — the frontend should call this when a notification is opened so unread counts stay accurate.
- Each notification carries a **status** — Sent, Opened, or Failed to Send — and a **type/severity** — Action Required, Success, Info, Warning, or Error — both of which the frontend should use to drive iconography/styling (e.g. red for Error/Failed, a badge for Action Required).
- Each notification has a subject line suitable for a notification list/preview.
