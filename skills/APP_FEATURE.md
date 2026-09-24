- When making UI changes, always refer to these feature lists. _Always_ have these features included. New features will be added here.

# App Features

This document describes the user-facing features of the bidding application, derived from reading the actual backend service source (identity-auth, catalog, bidding, notification — all Spring Boot, under `/backend`). It is organized by domain/category and is meant to drive frontend screen and flow design. Each bullet is a discrete, specific capability the frontend should support. Where the backend's actual behavior is incomplete, inconsistent, or has a known bug that the frontend needs to work around or account for, that's called out explicitly — this document reflects what the backend **actually does today**, not just the intended design.

---

## Standard API Response Envelope

Every service (identity-auth, catalog, bidding, notification) wraps **every** HTTP response — success or failure — in the same envelope shape. The frontend's API client should have exactly **one** response-unwrapping layer built around this shape rather than per-endpoint parsing.

```ts
interface ApiResponse<T> {
  data: T | null;
  completedAt: string; // ISO-8601 timestamp, e.g. "2026-08-08T14:32:01.123"
  requestId: string; // UUID, unique per request — useful for support/debugging correlation
  messages: ApiMessage[]; // always an array, never null; empty on a plain success
}

interface ApiMessage {
  type: "WARNING" | "INFO" | "ERROR";
  content: string; // human-readable message text, often the raw exception message and sometimes null/empty
}
```

- **`data`** — the actual payload for the endpoint (e.g. a `UUID` for a create action, a summary object, a list of summaries). On error responses, `data` is `null`.
- **`completedAt`** — server timestamp of when the response was produced. Not the same as any domain timestamp (e.g. bid `placedAt`) — purely a response-envelope metadata field.
- **`requestId`** — a fresh UUID generated per response. Worth logging/surfacing in error toasts or a "copy request ID" affordance for support/debugging.
- **`messages`** — a list of zero or more `ApiMessage` entries. On a clean success this is typically empty. On errors, it will contain at least one message.

### Error handling contract

There is **no separate error response shape** — failures are still an `ApiResponse` with `data: null` and one or more `messages` explaining what went wrong. The frontend should branch on **HTTP status code** to decide how to treat the response, then read `messages[0].content` (or all of them) for user-facing text:

| HTTP Status                 | When it happens                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | A business-rule/validation failure (e.g. bid too low, invalid auction timing, user already exists) |
| `401 Unauthorized`          | Bad login credentials (identity-auth only)                                                         |
| `403 Forbidden`             | Illegal access — e.g. an expired or invalid password-reset/verification token (identity-auth only) |
| `404 Not Found`             | Requested resource doesn't exist (e.g. unknown auction/bid/item ID)                                |
| `500 Internal Server Error` | Unhandled/unexpected exception — see note below, this fires more often than the name implies       |

**Important correction: `ApiMessage.type` is not a reliable severity signal across services.** Only **identity-auth** actually differentiates message type by status (400/404 → `WARNING`, 401/403/500 → `ERROR`). **Catalog, bidding, and notification services all emit `type: "ERROR"` for every failure, including plain 400/404s** — they either share or copy the same handler, which hardcodes `ResponseType.ERROR` regardless of HTTP status. Practical guidance:

- **Use the HTTP status code as the only reliable signal for branching logic** (this was already correct guidance) — but don't expect `ApiMessage.type` to consistently tell you "this is recoverable" vs. "this is a crash" outside of identity-auth. Treat `type` as cosmetic/display-only across catalog/bidding/notification, not as a severity API.
- Because the error text in `messages[].content` is often the raw exception message (not a stable error code), don't pattern-match on exact strings for critical logic.
- **A meaningful fraction of "should be 400" validation failures actually come back as `500`.** Example: invalid auction timing or an auction submitted with zero items throws a plain `RuntimeException` in catalog-service rather than the `IllegalStateException`/`NoSuchElementException` the handler specifically maps to 400/404 — so it falls through to the generic handler and returns 500. Don't assume "500 = show a generic crash screen and give up" everywhere; for auction create/update specifically, a 500 can still be a normal validation failure and its `messages[0].content` is still worth showing to the user.
- `NoSuchElementException`-based 404s frequently carry a `null`/empty `content` (many `.orElseThrow()` calls in the backend don't pass a message) — have a generic "not found" fallback string ready rather than relying on the server text always being present.
- Successful responses can still carry `messages` (e.g. an `INFO` note) alongside real `data` — always render `messages` if present, even on the happy path.

---

## Request Identity Header (`X-App-User-Id`)

**The frontend does not need to send this header.** Downstream services (catalog, bidding, identity-auth) still read `X-App-User-Id` off every request that needs to know "who's calling," but the **frontend's only job is to send the `token` cookie** (an httpOnly JWT, set on login/register) with every request. The api-gateway takes care of the rest:

- The gateway's `JwtAuthenticationFilter` reads the `token` cookie and authenticates the request from the JWT.
- Immediately after, a second gateway filter (`AppUserIdHeader`) rewrites the outgoing request so that `X-App-User-Id` is always set to the authenticated user's ID from that JWT — **overwriting or injecting the header regardless of whether the client sent one at all.** So there's no point in the frontend attaching it manually; the gateway derives and injects it for every authenticated request before proxying to catalog/bidding/identity-auth. (There's no error/mismatch case to worry about either — the gateway doesn't compare against a client-supplied value, it just sets its own.)
- This only happens for requests the gateway actually authenticates. A handful of routes are whitelisted as fully public at the gateway (login, register, auction/item browsing and search, item-level bid history) — the JWT filter is skipped entirely for those, so no `X-App-User-Id` gets injected, but none of those endpoints need one downstream either. For everything else, a missing/invalid `token` cookie gets a bare `401` straight from the gateway (empty body, not the usual `ApiResponse` envelope) before the request ever reaches a backend service.
- **Not every mutating/ownership-sensitive endpoint actually enforces this header downstream even when it is present.** Notably: catalog-service's `PUT /auction/{id}` (edit auction) and `PUT /auction/{id}/status/{status}` (change status, including close) don't read `X-App-User-Id` at all and perform **no ownership check** — currently any authenticated caller can edit or close any auction regardless of who owns it. The frontend should still gate these actions in the UI (hide/disable if the viewer isn't the owner) since the backend won't stop it today, but don't build frontend logic that assumes a 403 will come back for a non-owner — it won't.
- Similarly, identity-auth's `GET /app-user/{appUserId}` (fetch any user's profile) and the internal `GET /app-user/internal/contacts/preferred-contact-methods` (bulk contact lookup by ID list) require **no auth at all** and return PII (name, email, phone) for any user ID passed in — flagged as a known gap in the backend's own code comments, not a frontend concern to fix, but worth knowing if the frontend is tempted to build a "look up another user" feature on top of these.

---

## App User / Account

### Registration & Login

- A visitor can **register** a new account with:
  - Full name (required)
  - Email address and/or phone number (at least one of the two is required)
  - Password (required)
- Password must meet complexity rules: at least 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character (exact backend regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$`). This rule is bypassable in some environments via a server-side flag (`auth.registration-pwd.allow-simple`), so the frontend should still surface server-side validation errors, not just its own.
- Registration fails with a clear error if the **email** is already in use. **Note: there is currently no equivalent uniqueness check for phone number** — two accounts can be registered with the same phone number today. Don't build frontend copy/logic that assumes phone numbers are unique.
- On successful registration, the user is automatically logged in (session/token issued) and a **welcome notification** is sent to whichever contact method (email preferred, then phone) they registered with.
- A visitor can **log in** using either their email or phone number, plus their password.
- Login fails with a generic "invalid credentials" error (no hinting whether it was the identifier or password that was wrong).
- **An unverified account can still log in successfully** — account verification is not a login gate in the current backend, so don't build a "please verify before you can sign in" wall; verification is informational/optional-gated elsewhere, not enforced at login.
- A logged-in user can **log out**, ending their session (clears the cookie; there's no server-side token revocation since JWTs are stateless, but the frontend doesn't need to account for that).

### Account Verification

- A user can request an **account verification link/code** be sent to a contact method of their choice (email or phone).
- **Known backend bug:** requesting verification via **phone** currently sends the notification to the user's **email address** instead (a copy-paste bug in the backend — it looks up `getEmail()` in the phone branch). Until this is fixed server-side, treat the "verify via phone" option as non-functional; if you want to ship it now, flag it to the backend team rather than building frontend UX around it as if it worked. Verify via email works correctly.
- If a verification request is already pending and not expired, a duplicate request is silently ignored (no new link is sent, but the endpoint still returns success) — the frontend should treat "resend" as safe to click but explain a link may already be on its way.
- The verification link contains a token; submitting that token via the **verify account** action marks the account as verified.
- A verification link is time-limited; using an expired link shows a "link expired" error and the user must request a new one.
- **Correction: no confirmation notification is currently sent when an account is successfully verified**, despite a template/subject for it ("Your account is verified") existing in the notification service's config — the identity-auth service's verify flow never triggers it. Don't build a "check your inbox for a verification-success email" moment; the UI's own success state (toast/badge update) is the only confirmation the user will get.
- A logged-in user can **check whether their account is verified** (`GET /auth/account-verification/is-verified`, identity-auth service). The frontend surfaces this on the Account page: a badge next to the "Account" eyebrow (a green checkmark, tooltip "Account is verified", when verified; a "Not Verified" pill, tooltip "Account is not verified, please verify", when not) and hides the "Verify your account" panel entirely once the account is verified, since it's no longer actionable.

### Password Management

- Any visitor — signed in or not — can request a **password reset link** by submitting the raw email address or phone number on the account (`POST /auth/password/reset/send-link`, body `{ contact }`; the backend auto-detects whether the value is an email or phone via regex and looks the account up by that value rather than a session). This powers a proper "forgot password" flow from the sign-in page for someone who is locked out and never authenticated. A logged-in user can also trigger it from the Account page by picking Email/Phone, which resolves to that contact's stored value.
- **Note: this specific endpoint does leak account existence** — an unrecognized contact value currently returns **404**, not a generic success. Unlike the rest of this flow (which is enumeration-safe), the frontend should not assume "not found" and "sent" look identical here; consider showing a soft, non-committal message regardless ("If that contact matches an account, a reset link is on its way") rather than surfacing the raw 404 to avoid making the enumeration gap worse in the UI itself.
- Like verification links, only one active reset request can exist at a time; requesting again while one is pending won't issue a second link (still returns success).
- The reset link contains a token; the user submits the token along with their **new password** to complete the reset. The token identifies the account on its own — the reset screen must **not** ask the user to re-enter their email/phone.
- Reset tokens are time-limited; expired tokens show a "link expired" message.
- **Note: the password-reset flow does not re-check password complexity.** The registration rules (8+ chars, upper/lower/number/special) are enforced at registration but **not** re-applied when setting a new password via reset — a user can currently reset to a weak password even when the "simple passwords" bypass flag is off elsewhere. The frontend should still enforce the same complexity rules client-side on the reset form as a matter of good UX/security hygiene, since the backend won't catch a weak password here.
- After a successful password reset, a **confirmation notification** is sent to the user's preferred contact method (this one is genuinely implemented, unlike the account-verification confirmation above). If the user has no preferred contact method set yet, this step throws server-side — an edge case, but means a reset can technically fail cosmetically right after the password was already changed; the frontend should tell the user their password was updated even if a follow-up "no preferred contact" error surfaces.

### Contact Methods & Preferences

- A user can view their current **contact methods** (email and phone number, showing "N/A" for any that aren't set).
- A user can view and set their **preferred contact method** — Email or Phone. **Note: "in-App" is not currently a functional preferred-contact-method option**, even though the backend's `ContactType` enum has a third value (`APP`) — selecting it is rejected by the backend as an unsupported contact type. Don't offer "App" as a selectable preferred-contact choice in a new build; keep it to Email/Phone only until the backend implements it.
- When setting a preferred contact method that the user doesn't have on file yet (e.g. choosing "Phone" but no phone number is saved), the user must supply that contact value at the same time. **Once a channel's value is set, it can't be changed/overwritten through this same endpoint** — if the user already has an email on file, a new `contact` value passed alongside `EMAIL` is silently ignored (the old email is kept). If the product needs "change my email/phone," that's not implemented by this endpoint and would need a separate flow/backend change.
- No format validation is applied server-side to a contact value supplied through this endpoint (no email-shape or phone-shape check) — the frontend should validate the format itself before submitting, since the backend will happily store a malformed value here.
- If a user has not yet set a preferred contact method, actions that depend on it (e.g. sending a notification, completing a password reset) will fail/prompt them to set one first.

---

## Auction

### Creating & Managing Auctions

- A logged-in user can **create an auction** with:
  - A title
  - A start time and an end time
  - One or more **items** to be auctioned (an auction cannot be created with zero items)
  - One or more **categories** describing the auction, chosen from: Electronics, Vehicles, Real Estate, Art & Collectibles, Jewellery & Watches, Fashion & Accessories, Furniture & Home, Sports & Outdoors, Books & Media, Toys & Games, Industrial & Machinery, Antiques, Other
- **Auction start/end time validation (exact current rule):** `startTime` must be strictly before `endTime` — that's the only ordering check; there is **no** requirement that `endTime` (or `startTime`) be in the future. **Backdating is fully allowed today** — you can create an auction whose start and/or end time are entirely in the past, as long as start is before end. (A previous note in this doc said the backend rejects past-dated auctions and that frontend backdating support was slated for removal — that is **not** accurate as of the current backend code; there is no such rejection. Treat backdating as a supported, intentional capability unless backend behavior changes again.)
- **15-minute alignment rule (exact current rule):** `endTime` must **always** land exactly on a 15-minute mark (`:00`, `:15`, `:30`, or `:45`, zero seconds) — this is checked unconditionally. `startTime` must **also** be on a 15-minute mark, but **only when `startTime` is not in the future** (i.e., it's now-or-past). A future-dated `startTime` is never checked for quarter-hour alignment — only its ordering relative to `endTime` matters in that case. The create/edit form should still snap/step both fields to 15-minute increments for consistency, but be aware the backend's enforcement is asymmetric between the two fields depending on whether the start is future-dated.
- The creator of the auction becomes its **owner** (`ownerId`, taken from the `X-App-User-Id` header at creation time).
- An auction can be **edited**: title, start time, end time, categories, and **adding new items**. **Note: the edit endpoint currently performs no ownership check at all** — it doesn't read or require `X-App-User-Id`, so the backend does not verify the caller is the owner. The frontend should still only expose the edit UI to the owner, since the backend won't enforce it. Editing does not let you remove or modify items already in the auction — only append new ones (items are distinguished by having a `null` id in the request).
- Auction status is one of four values:
  - **Upcoming** — created with a future start time, not yet accepting bids (this is the default status for a future-dated auction and was missing from earlier versions of this doc)
  - **Live** — actively accepting bids
  - **Paused** — temporarily not accepting activity
  - **Closed** — auction has ended, no further bidding
- Status transitions are one-way once **Closed**: the backend rejects any attempt to move a closed (or past-its-end-time) auction to Live or Paused ("Auction is CLOSED, cannot perform update"). The frontend hides the status-changer entirely once an auction is closed, and confirms before closing since it's irreversible. **Note: attempting to close an already-closed (or already past-end-time) auction is a silent no-op** (no error, nothing happens) rather than a rejection — safe to allow repeated clicks on "Close" without special-casing it client-side. **Note: like editing, the status-change endpoint has no ownership check** — any caller can change any auction's status today.
- **Auctions also transition automatically in the background, not just via explicit user action.** A scheduled job runs every 15 minutes and: (1) flips any `UPCOMING` auction whose start time has arrived to `LIVE`, and (2) force-closes any `LIVE`/`PAUSED` auction whose end time has passed (running the same bid-finalization logic as a manual close, but **without** notifying the owner — only the auction-closed bidder notifications fire on the automatic path). The frontend should not assume an auction's status only changes when a user clicks something — poll/refetch auction state periodically on any screen showing a countdown to start/end, since the status can flip server-side without any client action.
- **Closing an auction** (`PUT /auction/{auctionId}/status/CLOSED`) is a consequential, one-way action: the backend finalizes the highest bid on every item in the auction and sends each winning bidder a "bid accepted" notification as part of the same request. The frontend should treat clicking "Closed" like a bid confirmation — a deliberate second step, not a bare status toggle. **Caveat: closing an auction where one or more items never received any bid is not handled gracefully server-side today** (the finalization code assumes every item has a winning bid) — if this happens the close request will likely fail with a 500. Until the backend guards this, consider warning the auction owner before they close if any item has zero bids.
- A user can view **"My Auctions"** — a list of all auctions they created, shown as summaries (title, status, categories, item count, start/end time).

### Browsing & Searching Auctions

- Any user can **view full auction details**: title, owner, status, categories, start/end time, and the list of items in it.
- Any user can **view the items within a given auction** (as summaries: title, description, minimum price, sold flag).
- Any user can **search/browse auctions** using any combination of filters:
  - Title keyword search (case-insensitive substring match)
  - Status (Upcoming / Live / Paused / Closed)
  - Starting after a given date/time
  - Ending before a given date/time
- Search results are returned as summaries suitable for a list/grid view (title, status, categories, item count, start/end time). None of the list endpoints (search, my-auctions, items-in-auction) are paginated yet — they return the full result set — so a very large catalog will come back as one array; keep this in mind for perf on the browse screen until the backend adds pagination.

---

## Item

- Each auction contains one or more **items**, each with:
  - A title
  - A description
  - An optional **minimum (reserve) price** — if set, no bid below this amount can be accepted
- Any user can **view an individual item's details**, including:
  - Title, description, minimum price
  - The **current highest bid amount** and which bid it belongs to (live "leading bid" indicator) — sourced from the catalog service's own cached copy of the item, updated whenever bidding-service records a new highest bid.
  - The **final sold price**, once the item has been sold/awarded — **note: this field exists on the item but nothing in the current backend ever actually sets it**, including the auction-close flow. Until the backend wires this up, don't rely on it to show a "sold for $X" figure; it will always read empty/null even for items that were won.
- Item summaries (used in auction listing pages) show title, description, minimum price, and a **sold/unsold flag**. **Note: this flag is derived from the same never-set "sold price" field above, so it will always read as unsold today, even for items that were part of a closed auction and won a bid.** Prefer deriving "sold" status in the frontend from the item's/auction's actual bid data (e.g. does the item have a `WINNER`-status bid?) rather than this flag, until the backend populates it.
- **Caveat: the item's cached "current highest bid" can drift out of sync with bidding-service's bid records.** When a bid is rejected (manually or via auto-expiry), bidding-service promotes the next-highest unexpired bid to `ACTIVE` on its own side, but does **not** push that change back to catalog-service's cached `highestBidId`/`highestBidAmount` on the item. If the frontend needs the true "current leading bid," treat bidding-service's bid-history-for-item endpoint as the source of truth rather than the item's cached fields, especially right after a rejection.
- New items can be added to an existing auction (via the auction edit flow); items already in an auction are not removed or edited through that flow.

---

## Bid

### Placing & Managing Bids

- A logged-in user can **place a bid** on an item by specifying:
  - The auction and item being bid on
  - A bid amount
  - An optional **expiration time** for the bid (after which it's no longer eligible to win if not acted on) — if omitted, the backend defaults it to **7 days from now** (a hardcoded default, not tied to the auction's own end time).
- Bid amount validation:
  - The bid must be **strictly higher** than the current highest bid on that item (if one exists).
  - The bid must be **at or above** the item's minimum price, if a minimum price is set.
  - The auction owner cannot bid on their own auction; the auction must be currently `LIVE`; and the current time must fall within the auction's start/end window.
- **Important correction — placing a bid always returns a success HTTP status, even when the amount is rejected.** `POST /bid` returns `201` with the new bid's ID whether or not the bid actually qualifies as valid — if it fails any of the checks above, the backend creates the bid record anyway with `status: REJECTED` and a `statusDescription` explaining why, and still responds `201`. **The frontend cannot tell whether a bid succeeded from the HTTP status alone** — after placing a bid, immediately check the returned bid's `status` (via a follow-up fetch, e.g. the bid-search-by-id or the item's bid history) before showing a "you're the highest bidder" confirmation. Show the proactive current-highest-bid/minimum-price guardrails on the form as before to minimize this happening, but the confirmation UI must be driven by the bid's actual status, not by the create call not throwing.
- Placing a new highest bid automatically **outbids** the previous highest bidder on that item — the previous bidder's bid flips to an "outbid" state.
- **Correction — "updating" a bid does not modify the original bid record; it creates a brand-new bid.** A bidder can call the update endpoint (`PUT /bid/{bidId}`) to effectively raise their bid, but under the hood this runs the exact same create-a-new-bid flow (same amount/reserve validation, same outbid-the-previous-highest behavior, same "always 201, check status" caveat above) and returns a **new** bid ID — the bid at the original `{bidId}` path is left untouched (unless it happened to be the current highest bid, in which case it gets outbid through the normal mechanism). A user's bid history on an item will show multiple rows over time from "updating," not one row that changes amount in place. Only the original bidder can call this — attempting to update someone else's bid is rejected.
- Placing or updating a bid triggers a **"bid placed" confirmation notification** to the bidder.

### Accepting & Rejecting Bids

- A bid can be **accepted**, marking it as the **Winner**.
  - Only the bid that is currently the active/highest bid can be accepted.
  - Once a bid has been accepted for an item, no other bid on that item can subsequently be accepted (an item can only be sold/awarded once).
  - **Note: the backend does not currently verify the caller is the item/auction owner** — the only check is that the caller is not the bid's own bidder (a bidder can't accept their own bid). Anyone other than the bidder can technically call accept today, including someone with no relationship to the auction. The frontend should still only expose "Accept" to the auction owner in the UI, since the backend won't stop anyone else via a clean error.
  - If the caller **is** the bid's own bidder, the endpoint doesn't return an error — it responds `200` with `data: false` (a soft, non-exceptional rejection). The frontend should treat a `false` payload here the same as a blocked action, not just check for a non-2xx status.
  - **No notification is currently sent when a bid is individually accepted through this endpoint** (marked as a not-yet-implemented TODO in the backend), even though a "your bid was accepted" template exists. The only path that currently does notify winning bidders is **closing the whole auction** (see the Auction section above) — that flow finalizes and notifies for every item's winning bid at once. If a product need exists for notifying on a standalone bid accept (outside of an auction close), that isn't wired up yet.
- A bid can be **rejected** with a required **rejection reason** (free text, e.g. "insufficient funds"), which is stored and shown back to the bidder.
  - A bidder cannot reject their own bid — same "soft rejection" pattern as accept: the endpoint returns `200` with `data: false` rather than an error if the caller is the bid owner.
  - When a bid is rejected, the system automatically **promotes the next-highest, unexpired bid** (status `Active` or `Outbid`) to `Active` for that item — this runs regardless of whether the rejected bid was the currently-active one. The UI should re-fetch the item's leading bid after a rejection. (See the Item section's caveat above — this promotion doesn't automatically sync catalog-service's cached highest-bid fields.)
  - **No notification is currently sent when a bid is rejected**, despite a "bid rejected" template existing — this is marked as a not-yet-implemented TODO in the backend. Don't build UI copy that promises the rejected bidder an email/SMS; only an in-app status change will reflect it (see Notifications below — every send still creates an in-app record regardless, but nothing triggers a send for rejection at all today).
- **Bids also expire automatically in the background.** A job runs roughly every 60 seconds, finds any `Active` bid whose expiration time has passed, and rejects it with the reason "Bid reached expiry date, bid is no longer acceptable for this item" — running through the exact same rejection/promotion logic above (including: no notification sent). A bid's status can flip from Active to Rejected with no user action involved; if the frontend polls or subscribes to bid status, don't assume only human actions change it.

### Bid Visibility & History

- A user can **view a single bid's details** (or a batch, by a list of IDs): amount, status, status description (e.g. rejection reason), when it was placed, and when it expires.
- A user can view **"My Bids"** — every bid they've personally placed, across all items/auctions, with current status, ordered oldest-first.
- Any user can view the **full bid history for an item** — every bid placed on it, useful for a "bid activity" panel on the item detail page.
- Bid status values the frontend should render distinctly (e.g. as colored badges):
  - **Active** — currently the highest/leading bid
  - **Outbid** — was leading, has since been surpassed
  - **Winner** — accepted as the winning bid for the item
  - **Rejected** — explicitly rejected (by the item side, or automatically on expiry), with a reason shown
  - **Pending Validation** — a brief, transient state a newly-placed bid passes through before settling to Active/Rejected; in practice this resolves synchronously within the same request, so the frontend is unlikely to ever observe it, but it exists in the status enum
  - **Withdrawn** — exists as a defined status value, but **there is currently no endpoint or user action that sets it.** Don't build a "withdraw my bid" button pointed at any existing API — it doesn't exist yet. Treat this status as reserved/future, not something the current backend can produce.

---

## Notifications

- The system automatically sends notifications to users for key lifecycle events. **Currently implemented and actually firing:**
  - Welcome message on registration
  - Account verification link sent (email only — see the phone-verification bug noted above)
  - Password reset link sent / password successfully updated
  - Contact-method-not-set-up prompt (sent instead of a real notification if the recipient has no contact method on file at all)
  - Bid placed / bid updated (both use the same "bid placed" notification)
  - Bid accepted — **only** as part of closing an entire auction (finalizes every item's winning bid at once), not from the standalone "accept a bid" action
- **Not currently implemented, despite templates existing for them** — don't promise these in product copy yet: account-verified confirmation, standalone bid-accepted (outside of auction close), bid-rejected (manual or auto-expiry).
- Notifications are delivered via the recipient's chosen/preferred **contact channel** — but with real caveats per channel:
  - **Email** is fully implemented (renders a template, retries up to 3 times on transient failure).
  - **Phone/SMS is not implemented at all** — any attempt to send via Phone currently throws a server error. Don't let a user select "Phone" as their preferred contact method and expect notifications to actually arrive over SMS yet (they'll still get an in-app record — see below — but the phone send itself will fail server-side).
  - **In-App**: every single notification the system sends — regardless of which channel (email/phone) was actually chosen or attempted — **also always creates an in-app record.** This means the in-app notification inbox is a complete history of everything ever sent to the user, not just notifications where "App" was the preferred channel. Build the inbox to show all of a user's notifications, not a channel-filtered subset by default (the channel filter described below is still useful as an optional view, just don't treat "App" as the only source for the inbox).
- A user can **view their notification history**, optionally filtered by channel (Email / Phone / App). **Note: the history endpoint currently returns only a subject line, type, and status per notification — no message body/content is available via the API yet** (marked as a not-yet-implemented TODO server-side). Design the inbox around a subject + status-badge list rather than a full message preview until the backend adds body content.
- A user (or the system) can **update a notification's status**, e.g. marking it as **Opened** once the user has viewed/read it — the frontend should call this when a notification is opened so unread counts stay accurate. (No ownership check is enforced on this endpoint today, but this is a backend-side gap, not something the frontend flow needs to work around.)
- Each notification carries a **status** — `Sent`, `Opened`, or `Failed to Send` — and a **type/severity** — `Action Required`, `Success`, `Info`, `Warning`, or `Error` — both of which the frontend should use to drive iconography/styling. **Note: `Failed to Send` is defined but never actually produced today** — email failures throw rather than being persisted as a failed notification record, so don't build a "failed notifications" filter expecting it to ever populate; and `Error` type is currently unused by any notification kind (nothing maps to it).
- Each notification has a subject line suitable for a notification list/preview. Exact current subject text and severity per event, useful as a reference for badge styling and copy consistency:

| Event                                                                   | Subject                                  | Type            |
| ----------------------------------------------------------------------- | ---------------------------------------- | --------------- |
| Contact method not set up                                               | "Please set up a primary contact method" | Action Required |
| Registration welcome                                                    | "Welcome to Bidder"                      | Info            |
| Account verification link sent                                          | "Verify your account"                    | Action Required |
| Account verified _(not currently sent — see above)_                     | "Your account is verified"               | Success         |
| Password reset link sent                                                | "Reset your password"                    | Action Required |
| Password updated                                                        | "Your password was changed"              | Success         |
| Bid accepted (via auction close)                                        | "Your bid was accepted"                  | Success         |
| Bid rejected _(not currently sent — see above)_                         | "Update on your bid"                     | Warning         |
| Bid updated _(not currently sent — update reuses "bid placed" instead)_ | "Your bid has been updated"              | Info            |
| Bid placed                                                              | "Bid placed successfully"                | Info            |
| Auction closed                                                          | "Your auction has closed"                | Info            |
| Auction went live                                                       | "Your auction is now live"               | Success         |
| Auction paused                                                          | "Your auction has been paused"           | Warning         |

---

## Payments — not yet available

A `payments` service exists in the backend repo, but it currently has **no REST controller, no API-gateway route, and no implemented business logic** — just a bare application scaffold and a single JPA entity (`itemId`, `ownerId`, `accepted`, a 3-day request-expiry field). There is nothing for the frontend to integrate against yet. Do not build any payment-related screens or flows in this rebuild; treat "handle the winning bidder's payment" as entirely out of scope until this service has real endpoints.
