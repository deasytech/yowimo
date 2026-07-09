# Yowimo Backend Architecture & Screen-by-Screen API Requirements

This document maps every screen currently running on mock data to the Laravel API endpoints, data models, and realtime events it will need. It also covers the two open architecture questions: realtime transport and video/group-call infrastructure.

---

## 1. Auth model: Clerk stays the identity provider

Clerk already issues sessions/JWTs to the app. Laravel should **not** re-implement auth — it should **verify Clerk JWTs** on every API request and mirror user identity into its own `users` table.

- Add Clerk middleware to Laravel: verify the `Authorization: Bearer <clerk_jwt>` against Clerk's JWKS endpoint (networkless verification — cache the JWKS, no round-trip per request). Any JWT library (`firebase/php-jwt` or `web-token/jwt-framework`) works; there's no official Clerk PHP SDK, so this is a small hand-rolled middleware (~50 lines).
- On first-seen `clerk_user_id`, upsert a local `users` row. Better: register a **Clerk webhook** (`user.created`, `user.updated`, `user.deleted`) pointed at a Laravel endpoint (`POST /webhooks/clerk`) so `users` stays in sync without relying on request-time upserts (verify the Svix signature Clerk signs webhooks with).
- `users` table holds everything Clerk doesn't: bio, interests, privacy toggles, stats, wallet balance, etc. — i.e. all of `profile/edit.tsx`'s fields.
- Every other Laravel resource (`parties`, `messages`, `wallet_transactions`, ...) references `users.id` (your internal id), not the Clerk id directly, so nothing else in the schema needs to know Clerk exists.

---

## 2. Realtime transport: Laravel Reverb

**Recommendation: Laravel Reverb**, using Laravel's standard broadcasting abstraction (`event()->broadcast()`, `ShouldBroadcast`) with **Laravel Echo** + `@laravel-echo` client in the RN app (`pusher-js` compatible transport, works fine in RN with a WebSocket polyfill — no extra native module needed).

Why over alternatives:
- **Pusher/Ably (hosted)**: no ops burden, but per-connection/message billing scales badly for a party app where every screen in a live session is a connection (lobby, chat, game, video-adjacent state) — cost grows with your best outcome (viral parties).
- **Soketi**: also Pusher-protocol, community-maintained, viable, but Reverb is now the first-party Laravel option with tighter framework integration and Horizon-style observability coming from Laravel core, so default to it unless you hit a scaling wall Reverb can't handle (it can be horizontally scaled behind Redis pub/sub when needed).

### Channel design

| Channel | Type | Used by |
|---|---|---|
| `presence-party.{id}` | Presence | Lobby roster, waiting room, video room participant list, "who's online in this party" |
| `private-party.{id}.chat` | Private | Chat messages, typing indicators |
| `private-party.{id}.game` | Private | Turn state, current card, timer, reactions, seating/teams changes |
| `presence-friends.{userId}` | Presence | Home "Crew online" rail, friends list online/in-party status |
| `private-user.{id}` | Private | Personal notifications feed, wallet balance changes, achievement unlocks |

### The timer rule (apply everywhere a countdown exists)

Every mock countdown today (`waiting-room.tsx`, `game.tsx`, `challenge.tsx`, `active-player.tsx`) runs an independent client-side `setInterval` — meaning every device sees a different time remaining. Fix: the server computes and broadcasts an **absolute UTC timestamp** (`round_ends_at`), never a duration. Clients compute `ends_at - now()` locally for display but all resync to the same wall-clock target. Round transitions (advancing the card, ending a turn) are triggered server-side by a **delayed queued job** dispatched when the round starts (`RoundJob::dispatch($party)->delay($endsAt)`), not by whichever client's local timer hits zero first — this also closes the obvious cheat vector of a client just not enforcing its own timer.

---

## 3. Video/group call: LiveKit, not Zoom SDK

`video-room.tsx` needs a fully custom tile grid (host badge, per-tile mic state, reaction overlays) — this is "programmable video," not "embed a meeting." Zoom Video SDK can technically be embedded, but:
- It's priced and licensed around meeting minutes, not lightweight casual party sessions.
- Customizing tile UI, overlays, and mixing it with your own game-state UI fights the SDK's opinions.
- No natural story for the `connect-tv.tsx` cast/mirror flow.

**Recommendation: LiveKit** (open-source SFU, self-hostable or LiveKit Cloud, first-class `@livekit/react-native` SDK).
- Laravel's only responsibility: generate short-lived **room access tokens** (a signed JWT using your LiveKit API key/secret — trivial with any JWT library, no LiveKit PHP SDK required) via `POST /parties/{id}/video-token`, and track room lifecycle (`video_rooms` table: party_id, livekit_room_name, started_at, ended_at).
- Participant list, mic/cam state, and join/leave are **native to LiveKit** (it already broadcasts this over its own data channel) — don't duplicate that state in Reverb. Only mirror host-designation and any app-specific overlay data (reactions, "open game" trigger) through Reverb since LiveKit's participant metadata isn't meant for your game-state.
- `connect-tv.tsx`'s device discovery (Chromecast/AirPlay/FireTV) is a **native SDK concern on-device**, not a Laravel one — Laravel's role there is just issuing a `tv_pairing_code` (`GET /parties/{id}/tv-pairing-code`) that a paired TV/receiver app subscribes to on `private-party.{id}.game` to receive pushed game state.
- If ops overhead of self-hosting LiveKit is unwanted early on, start on **LiveKit Cloud** (usage-based, generous free tier) and self-host later without changing client code — the SDK is identical either way.

---

## 4. Core data model (entities every screen maps back to)

```
users                 (mirrors Clerk identity + profile fields)
parties                (id, room_code, host_id, game_type_id, mode[online|in_person|hybrid],
                        visibility[public|private], status[draft|lobby|active|ended],
                        ai_host_enabled, starts_at, ended_at)
party_players          (party_id, user_id nullable, guest_name, guest_emoji, join_mode[local|remote],
                        team_id nullable, seat_position nullable, is_ready, is_host)
game_types             (id, name, emoji, tagline, audience, intensity, cost_tokens, image_url)
packs                  (id, name, category, price_tokens, description, image_url)
pack_cards             (pack_id, kind[truth|dare], text)
user_owned_packs       (user_id, pack_id, purchased_at)
wallet_transactions     (user_id, type[in|out], source[purchase|gift|earn|spend|sponsor], amount, meta, created_at)
token_bundles           (id, name, tokens, price_usd, badge)
messages                (party_id, sender_id, type[text|audio|emoji], body, audio_url, created_at)
friendships             (user_id, friend_id, status[pending|accepted])
achievements            (id, name, emoji, total, reward_tokens)
user_achievements       (user_id, achievement_id, progress, unlocked_at)
leaderboard_scores      (user_id, scope[global|party|friends], party_id nullable, score, period)
notifications           (user_id, type, payload, read_at, created_at)
referrals               (referrer_id, referred_id, milestone_reached, created_at)
sponsors                (user_id, company_name)
sponsor_coverage        (sponsor_id, party_id or user_id, tokens_spent, status)
party_rounds            (party_id, round_number, card_id, active_player_id, ends_at, status)
party_events            ("top moments" log: party_id, user_id, type, text, media_url, created_at)
video_rooms             (party_id, livekit_room_name, started_at, ended_at)
```

---

## 5. Screen-by-screen endpoint map

Grouped in the phased order I'd recommend building/wiring them in (see §6). Realtime items are marked ⚡.

### Phase 1 — Static catalogs + party creation shell
Unlocks: Home (partial), Play/create-party, Marketplace browsing, Discover (read-only)

- `GET /game-types` — deck catalog (`play.tsx` picker, Home recommended rail)
- `GET /packs?category=` , `GET /packs/{id}`, `GET /packs/featured` — marketplace catalog + detail modal
- `GET /token-bundles` — wallet top-up grid
- `POST /parties` `{game_type_id, mode, visibility, ai_host_enabled}` — "Launch party" / "Save draft" (`play.tsx`)
- `GET /parties/{id}` — party detail (lobby, hybrid, in-person all read this)
- `GET /parties?filter=live|tonight|couples|family|teams|sponsored|wild&q=&cursor=` — Discover feed, Home "live now" rail, `public.tsx` browser (server-side search/filter/pagination replaces the current client-side array filtering)
- `POST /parties/{id}/like`, `DELETE /parties/{id}/like` — Discover heart action

### Phase 2 — Wallet & purchases
Unlocks: Wallet tab, buy-token, transactions, marketplace purchase, pack ownership

- `GET /wallet/balance` — single source of truth (currently hardcoded differently on 4 different screens — this alone fixes that bug)
- `GET /wallet/transactions?type=in|out&sponsored=&q=&cursor=` — transactions screen, wallet home preview
- `GET /payment-methods`, `POST /payment-methods` — buy-token saved cards
- `POST /wallet/purchase` `{bundle_id, payment_method_id}` — real IAP/Stripe charge → credits wallet, records transaction (buy-token currently just navigates away with no call at all — biggest gap in the app)
- `POST /wallet/gift` `{recipient_id, amount}` — wallet "Gift" button
- `POST /packs/{id}/purchase` — marketplace buy, validates + debits balance server-side (currently client-simulated with a fake 15% failure rate)
- `GET /users/me/owned-packs` — marketplace "owned" badge

### Phase 3 — Party join + lobby realtime ⚡
Unlocks: Lobby, QR-join, Invite, Waiting-room, In-person/local-register, Hybrid

- `POST /parties/join` `{code}` — QR/manual code join (`qr-join.tsx`; validates against real `room_code`, not a hardcoded string)
- `POST /parties/{id}/players` `{guest_name?, guest_emoji?, join_mode}` — join as authed user or local/pass-and-play guest (`local-register.tsx`, `in-person.tsx`)
- `POST /parties/{id}/invites` — generates a real expiring deep link (`invite.tsx`'s `inviteLink` is currently a hardcoded string)
- `POST /parties/{id}/invites/send` `{friend_ids}` — actually notify invited friends (currently a no-op navigate)
- `POST /parties/{id}/schedule` `{starts_at, reminders}` — `schedule.tsx`, plus a queued reminder-notification job
- ⚡ `presence-party.{id}` — lobby roster join/leave/ready state (`lobby/[slug].tsx`, `waiting-room.tsx`); replaces the fake `FRIENDS.slice(0,7)` roster and independent per-device countdown
- `PATCH /parties/{id}/players/{playerId}` `{is_ready}` — "I'm Ready" button

### Phase 4 — Chat ⚡
Unlocks: `chat/[slug].tsx`, replaces `ChatContext`'s `setInterval` simulation entirely

- `GET /parties/{id}/messages?cursor=` — message history
- `POST /parties/{id}/messages` `{type, body}` — text/emoji send
- `POST /parties/{id}/messages/voice` (multipart) — upload voice note to S3-backed storage, returns `audio_url` (fixes the current bug where voice notes are local `file://` URIs that only play on the sender's device)
- `POST /users/{id}/report`, `POST /users/{id}/block` — currently client-only no-ops in `chat/[slug].tsx`
- ⚡ `private-party.{id}.chat` — `message.created` events for live delivery + unread badge counts (used by `PartyCard`'s chat icon badge)

### Phase 5 — Game engine ⚡
Unlocks: `game.tsx`, `card-reveal.tsx`, `challenge.tsx`, `active-player.tsx`, `seating.tsx`, `teams.tsx`

- `PUT /parties/{id}/teams` `{assignments: {player_id: team_id}}` — currently only local tap-to-assign state
- `PUT /parties/{id}/seating` `{order: [player_id...]}` — turn order (the "drag to reorder" UI is unbuilt; backend contract can exist before the drag interaction does)
- `POST /parties/{id}/rounds/start` — deals the card, sets `active_player_id`, computes `ends_at`, dispatches the delayed `RoundJob`
- `POST /parties/{id}/rounds/{round}/reactions` `{emoji}` — broadcasts to all players (currently self-only ephemeral taps)
- `POST /parties/{id}/rounds/{round}/skip` — token-costed skip (`SKIP_COST` in `challenge.tsx`), debits wallet server-side
- `POST /parties/{id}/rounds/{round}/complete` — "I did it / Done" action, advances turn
- ⚡ `private-party.{id}.game` — current card/prompt, whose turn, round number, `ends_at`, live reactions, seating/team changes — this is the channel every in-game screen subscribes to

### Phase 6 — Video ⚡ (see §3)
Unlocks: `video-room.tsx`, `hybrid.tsx`, `connect-tv.tsx`

- `POST /parties/{id}/video-token` — LiveKit room access token
- `GET /parties/{id}/tv-pairing-code` — TV cast/mirror pairing
- Participant list/mic/cam state: native LiveKit, not a Laravel endpoint (see §3)

### Phase 7 — Results & summary
Unlocks: `results.tsx`, `end-party-summary.tsx`, `mvp-awards.tsx`, `results/highlights.tsx` (currently an empty stub — no data contract exists yet, flagged as an open design question, likely needs media capture during play)

- `GET /parties/{id}/results` — MVP, standings, tokens awarded
- `GET /parties/{id}/summary` — rounds/cards/dares stats, "top moments" feed (fed by `POST /parties/{id}/events` logged during gameplay)
- `GET /parties/{id}/awards` — award categories (implies a voting/tallying mechanism during play — open design question, not just a display screen)
- `GET /parties/{id}/highlights` — once the capture pipeline exists

### Phase 8 — Social layer
Unlocks: friends, achievements, referrals, leaderboard, notifications, sponsor management, profile

- `GET/PATCH /users/me`, `POST /users/me/avatar` — profile edit
- `GET /friends?status=online|in_game&q=&cursor=`, `POST /friends/requests`, `POST /friends/requests/{id}/accept|decline` — friends screen (the "Requests" tab exists as dead code in the UI already — backend should support it)
- `POST /users/{hostId}/follow`, `DELETE /users/{hostId}/follow`
- `GET /users/me/achievements`, `POST /achievements/{id}/claim`
- `GET /referrals/summary`, `GET /referrals/milestones`
- `GET /leaderboard?scope=global|party|friends&cursor=`, `GET /leaderboard/me` — top-N + pinned "me" row shape the UI already expects
- `GET /notifications?cursor=`, `PATCH /notifications/{id}/read`, push token registration — ⚡ `private-user.{id}` for live delivery
- `GET /sponsors/me`, `GET /sponsors/me/covered-players`, `POST /sponsors/me/topup`

---

## 6. Suggested build order (screen-by-screen)

Since you're implementing dynamically screen by screen, this order minimizes rework — each phase's endpoints are consumed by the next phase's screens, and nothing later depends on something earlier being wrong:

1. **Auth bridge** (Clerk JWT middleware + webhook sync) — nothing else works without this
2. **Phase 1**: catalogs + party shell → wire `play.tsx`, Marketplace browsing, Discover (read-only)
3. **Phase 2**: wallet → wire Wallet tab, buy-token, marketplace purchases (this alone fixes the balance-inconsistency bug across 4 screens)
4. **Phase 3**: join/lobby realtime → wire Lobby, QR-join, Invite, Waiting-room
5. **Phase 4**: chat → wire `chat/[slug].tsx`
6. **Phase 5**: game engine → wire Game, Card Reveal, Challenge, Active Player, Seating, Teams
7. **Phase 6**: video → wire Video Room, Hybrid, Connect TV
8. **Phase 7**: results → wire Results, End-Party Summary, MVP Awards (Highlights blocked on a media-capture design decision)
9. **Phase 8**: social layer → wire Friends, Achievements, Referrals, Leaderboard, Notifications, Sponsor Management, Profile Edit

---

## 7. Suggested Laravel package stack

- `laravel/reverb` — WebSocket server (broadcasting)
- Clerk JWT verification — hand-rolled middleware using `firebase/php-jwt` against Clerk's JWKS (no official Clerk PHP SDK exists)
- `laravel/horizon` — queue monitoring (round timers, reminder jobs, achievement/notification dispatch)
- `spatie/laravel-medialibrary` — pack card images, voice note storage, highlight clips (S3-backed)
- `laravel/scout` + Meilisearch — only if/when Discover's free-text search needs to scale past a simple `WHERE LIKE` query
- LiveKit: no PHP SDK needed — room tokens are just signed JWTs (`api key/secret` → sign with `firebase/php-jwt`), a 20-line service class covers it

---

## 8. Bugs/inconsistencies found in the current mock data worth fixing during this work

These aren't blocking, but each is exactly the kind of thing that becomes a real bug once wired to a shared backend instead of screen-local mock state:

- **Wallet balance is hardcoded to 4 different numbers** across `wallet.tsx` (142), `market-place.tsx` (180), `wallet/buy-token.tsx` (245), and Home's hero banner (300) — Phase 2 collapses these to one `GET /wallet/balance` call.
- **`buy-token.tsx`'s "Pay" button doesn't call any purchase logic** — it just navigates back to `/wallet`. This needs the real `POST /wallet/purchase` wired, not just a UI polish pass.
- **`CrewOnline.tsx`'s online indicator is hardcoded on** — it never reads `friend.online`. Worth fixing alongside wiring real presence.
- **`friends.tsx` has dead code referencing a "Requests" tab** that isn't in the visible `TABS` array — confirms a friend-requests flow was intended; Phase 8 should build it.
- **`seating.tsx` and `teams.tsx`'s copy describes drag-and-drop** ("Drag the table to reorder turns") that isn't actually implemented — decide whether to build the gesture UI or update the copy when wiring Phase 5.
- **`results/highlights.tsx` is a 0-byte empty file** despite being linked from two other screens — needs a product decision (what "highlights" even are — auto-captured moments? manual clips?) before it can get an API contract.
