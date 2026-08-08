- When making UI changes, always refer to these feature lists. _Always_ have these features included. New features will be added here.

# App Features

This document describes the user-facing features of the bidding application, derived from the backend services (identity/auth, catalog, bidding, notification). It is organized by domain/category and is meant to drive frontend screen and flow design. Each bullet is a discrete, specific capability the frontend should support.

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

### Password Management

- A logged-in user can request a **password reset link** be sent to one of their contact methods (email or phone).
- Like verification links, only one active reset request can exist at a time; requesting again while one is pending won't issue a second link.
- The reset link contains a token; the user submits the token along with their **new password** to complete the reset.
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
- Auction start/end time validation: the start time must be before the end time, unless both start and end are already in the past (which allows backdating/importing historical auctions); the UI should validate this before submit and surface a clear "invalid auction timing" error otherwise.
- The creator of the auction becomes its **owner**.
- The owner (or an admin flow) can **edit an auction**: update its title, start time, end time, and categories, and **add new items** to it.
- The owner can **change the auction's status** between:
  - **Open** — actively accepting bids
  - **Paused** — temporarily not accepting activity
  - **Closed** — auction has ended, no further bidding
- A user can view **"My Auctions"** — a list of all auctions they created, shown as summaries (title, status, categories, item count, start/end time).

### Browsing & Searching Auctions

- Any user can **view full auction details**: title, owner, status, categories, start/end time, and the list of items in it.
- Any user can **view the items within a given auction**.
- Any user can **search/browse auctions** using any combination of filters:
  - Title keyword search
  - Status (Open / Paused / Closed)
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
