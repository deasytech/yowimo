# Yowimo Backend Integration Plan

Source of truth: `http://api-yowimo.test/docs` (Yowimo API v1, verified against the running
backend 2026-08-28). This plan wires the app to **only the endpoints that actually exist**
in that doc — not the earlier aspirational `BACKEND_ARCHITECTURE.md` (which describes chat,
video/LiveKit, results, referrals, sponsor management, and realtime presence that the live
backend doesn't implement yet). Treat `BACKEND_ARCHITECTURE.md` as a future roadmap, not
current scope.

## How we're working

- One phase = one review checkpoint. I implement it, you test it in the running app, and on
  your approval I commit and push to `dev`.
- Data fetching: **TanStack Query** (`@tanstack/react-query`), added in Phase 0.
- Commits per phase only touch files that phase changed — the pre-existing uncommitted
  changes on this branch (`README.md`, `app.json`, `sign-in.tsx`, `eas.json`, `package.json`/
  lock, deleted `CLAUDE.md`) are left alone unless a phase's own work naturally touches them
  (e.g. Phase 0 touches `package.json` to add the new dependency).
- `EXPO_PUBLIC_API_URL` is the new env var for the API base (local: `http://api-yowimo.test/api/v1`,
  prod: `https://api.yowimo.com/api/v1`).

## Foundation (built alongside Phase 1, not its own review step)

- `lib/api/types.ts` — `ApiResponse<T>`, `ApiError`, `CursorMeta`, resource types
  (`UserResource`, `GameTypeResource`, `PackResource`, `TokenBundleResource`,
  `WalletResource`, `WalletTransactionResource`, `BadgeResource`, `PartyResource`,
  `GameSessionResource`, `NotificationResource`, `FriendResource`, `FriendRequestResource`)
  matching the doc's response shapes exactly.
- `lib/api/client.ts` — fetch wrapper: base URL + bearer token + envelope unwrap, throws
  `ApiError` (status, message, `errors`) on failure/non-2xx.
- `lib/api/queryClient.ts` — `QueryClient` (no retry on 4xx; 429/5xx get limited retry).
- `hooks/api/useApi.ts` — binds Clerk's `useAuth().getToken()` to the client for use inside
  query/mutation hooks.
- `QueryClientProvider` added to `app/_layout.tsx`.
- Idempotency-Key helper (`expo-crypto`'s `randomUUID`) for purchase mutations.
- Reuse the existing `useToast`/`Toast` for surfacing mutation errors (already used in
  `market-place.tsx`) instead of introducing a new pattern.
- Images: API resources return remote URLs (`image_url`, `cover_image_url`) — switch those
  surfaces to `expo-image` with a gradient+emoji fallback when the URL is absent, instead of
  requiring bundled local assets. Bundled deck/pack images stay as decorative fallback only.

## Phases

### Phase 1 — Profile
`GET /users/me`, `PATCH /users/me`
- `app/(tabs)/profile.tsx` — real `display_name`/`avatar_url`/`bio` header. Stats row
  (Parties/MVPs/Friends/Streak) has no backing endpoint yet — stays mock, marked with a
  `// TODO(api): no stats endpoint yet` note.
- `app/(general)/profile/edit.tsx` — rewired to the fields the API actually accepts
  (`username`, `avatar_url`, `first_name`/`last_name`/`display_name`, `bio`, `date_of_birth`,
  `country_code`, `interests`, `privacy_settings`). Fields with no server counterpart
  (pronouns, phone, freeform location, language, party type) are removed from the form rather
  than kept as dead UI.

### Phase 2 — Game Types
`GET /game-types`
- `app/(tabs)/play.tsx` — game picker driven by the API list.
- `app/(tabs)/index.tsx` — "Pick your deck" rail.
- `data/mock.ts`'s `GAME_TYPES` stops being the source of truth for these two screens (stays
  for anything still unwired).

### Phase 3 — Packs / Marketplace
`GET /packs`, `GET /packs/featured`, `GET /packs/{id}`, `POST /packs/{id}/purchase`
- `app/(tabs)/market-place.tsx`, `components/MarketPlaceCard.tsx`,
  `components/PackDetailModal.tsx` — real catalog, real `owned_by_me`/`preview_cards`
  semantics per the doc's caveats, real purchase with a generated `Idempotency-Key`.
- Removes `simulatePurchase()`'s fake 15%-failure simulation and the hardcoded
  `STARTING_TOKEN_BALANCE` — token balance comes from `GET /wallet` (read-only usage here;
  the Wallet screen itself is Phase 4).

### Phase 4 — Token Bundles + Wallet
`GET /token-bundles`, `POST /token-bundles/{id}/purchase`, `GET /wallet`, `GET /wallet/transactions`
- `app/(tabs)/wallet.tsx`, `app/(general)/wallet/buy-token.tsx`,
  `app/(general)/wallet/transactions.tsx` — collapses the 4 previously-hardcoded balances
  (142 / 180 / 245 / 300) into the one real `GET /wallet` value, and wires the "Pay" button
  in `buy-token.tsx` to a real purchase (currently a no-op navigate — the biggest gap noted
  in the old architecture doc).

### Phase 5 — Badges
`GET /badges`, `GET /users/me/badges`
- `app/(general)/profile/achievements.tsx` — real badge catalog + earned state/progress.
  Note: the API only gives earned/not-earned + `earned_at`, not the granular progress
  counters (`24/25`) the mock UI shows — progress bars either drop to a binary
  locked/unlocked state or need a product call on what "progress" means server-side.
- `app/(tabs)/profile.tsx` achievements preview section.

### Phase 6a — Discover feed (read-only)
`GET /parties`
- `app/(tabs)/discover.tsx` — server-side `mode`/`game_type_id`/`search` filters replace the
  client-side array filtering. Note the doc's caveat: this feed is hardcoded to
  `public` + `scheduled`/`live` — no "my parties" view exists server-side.
- `app/(tabs)/index.tsx` "Live now" rail.

### Phase 6b — Party create/detail/actions
`POST /parties`, `GET /parties/{id}`, like/unlike, join/leave, start/end
- `app/(tabs)/play.tsx` create flow — real field set (`title`, `mode`, `visibility`,
  `max_players`, `game_type_id`/`pack_id`, `starts_at`, `save_as_draft`, `location` when
  hybrid/in-person). Folds `schedule.tsx`'s intent (`starts_at`) into this form since there's
  no separate schedule endpoint.
- `app/(general)/lobby/[slug].tsx` — real party detail + like/join/leave/start/end actions.
  Deeper lobby realtime (roster presence, ready-state, waiting-room countdown) has no
  backing endpoint — stays out of scope (see Backlog).
- Party's `room_code` (visible to host/public parties) powers a basic share-via-QR affordance
  in place of `invite.tsx`'s hardcoded link, since there's no dedicated invite endpoint.

### Phase 7 — Game Sessions (host-only, best-effort)
`POST /parties/{party}/game/start`, `POST /game/{id}/next-turn`
- **Known gap to flag when we get here**: both endpoints are host-only, and there's no
  `GET /game/{id}` to let non-host players fetch current turn state — the doc's realtime
  channels for this aren't live yet either. So only the host's own client can meaningfully
  reflect session state from these calls; other players in `game.tsx`/`challenge.tsx` have
  nothing to poll. We'll decide the exact scope (host-only demo vs. skipping until a
  read endpoint or Reverb channel exists) when we reach this phase.

### Phase 8 — Push Tokens
`POST /push-tokens`, `DELETE /push-tokens`
- Requires adding `expo-notifications` (not currently a dependency) and native config in
  `app.json`, which likely means this needs a custom dev build rather than Expo Go. Flagged
  for a decision before starting this phase specifically.

### Phase 9 — Notifications
`GET /notifications`, `PATCH /notifications/read`, `PATCH /notifications/read-all`
- `app/(tabs)/notifications.tsx` — real feed, mark-read on tap, mark-all-read action. Client-
  side unread filtering only (API has no `unread` filter param).

### Phase 10 — Friends
`GET /friends`, `DELETE /friends/{id}`, `GET/POST /friend-requests`, accept/reject/cancel
- `app/(general)/profile/friends.tsx` — real friends list + a real "Requests" tab (currently
  dead code in `TABS`).
- `app/(tabs)/index.tsx` "Crew online" rail: no presence data exists server-side, so
  `CrewOnline`'s hardcoded-on online dot gets removed/reworked rather than wired to nothing.

## Backlog — screens with no backend support yet (stay on mock data)

Chat (`chat/[slug].tsx`), Video (`video-room.tsx`, `hybrid.tsx`, `connect-tv.tsx`), Results
(`results.tsx`, `end-party-summary.tsx`, `mvp-awards.tsx`, `highlights.tsx`),
`leaderboard.tsx`, `profile/referrals.tsx`, `profile/sponsor-management.tsx`, drag-reorder in
`seating.tsx`/`teams.tsx`, `play/qr-join.tsx` (no join-by-room-code lookup endpoint, only
join-by-party-id), `play/local-register.tsx`/`in-person.tsx` guest/pass-and-play join (no
guest-join endpoint, only authenticated-user join), `play/ai-host.tsx`,
`play/waiting-room.tsx` roster. Revisit once matching endpoints ship.
