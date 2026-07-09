# Yowimo

Yowimo is a React Native (Expo) mobile app for hosting and playing social party card games — think Jackbox/Cards Against Humanity-style sessions, played either in-person, over video, or a hybrid of both. Users form "crews," start a "party," pick a game deck, and play through hosted rounds with friends, earning tokens and leaderboard standing along the way.

- **Platform**: Expo SDK 54 (React Native 0.81, React 19), file-based routing via `expo-router`
- **Auth**: Clerk (`@clerk/expo`) — email/password with email-code verification, plus Google/Apple SSO
- **Styling**: NativeWind (Tailwind for React Native)
- **Analytics**: PostHog (screen views, custom events)
- **Bundle IDs**: `com.deasytech.yowimo` (iOS & Android)

## Core concepts

- **Party** — a play session a user hosts or joins, with a live/scheduled state, a list of players, and a game deck.
- **Deck / Game type** — the card-based game content played during a party (categories, packs).
- **Lobby** — the pre-game waiting area where players join, get seated into teams, and the host configures the session (including an AI host mode).
- **Play modes** — in-person, video-room, hybrid (mixed in-person + remote), and public (open/joinable) sessions.
- **Wallet / Tokens** — an in-app currency used to buy decks/packs from the marketplace; tracked via transactions.
- **Leaderboard / Results** — post-party summaries, MVP awards, and highlights; feeds into an overall leaderboard.

## Directory structure

```text
app/                          Screens (expo-router file-based routing)
├── _layout.tsx                Root layout: ClerkProvider, PostHog, fonts, splash screen
├── onboarding.tsx              First-run onboarding flow
├── (auth)/                     Unauthenticated stack
│   ├── sign-in.tsx               Email/password + SSO sign-in, email-code verification
│   └── sign-up.tsx               Registration flow
├── (tabs)/                     Main authenticated tab bar
│   ├── index.tsx                  Home feed (quick actions, live parties, friends online)
│   ├── discover.tsx               Discover new decks/games
│   ├── play.tsx                   Entry point into starting/joining a party
│   ├── market-place.tsx           Deck/pack marketplace
│   ├── wallet.tsx                 Token balance and wallet home
│   ├── notifications.tsx          Notifications feed
│   └── profile.tsx                User profile home
└── (general)/                  Secondary/deep-linked screens outside the tab bar
    ├── leaderboard.tsx             Global/crew leaderboard
    ├── chat/[slug].tsx             Party chat
    ├── lobby/                      Pre-game lobby
    │   ├── [slug].tsx                 Lobby for a specific party
    │   ├── ai-host.tsx                AI-hosted lobby mode
    │   └── waiting-room.tsx           Waiting for players before start
    ├── play/                        In-game screens
    │   ├── game.tsx                   Main gameplay screen
    │   ├── card-reveal.tsx            Card reveal animation/interaction
    │   ├── challenge.tsx              Challenge/round screen
    │   ├── in-person.tsx              In-person play mode
    │   ├── hybrid.tsx                 Hybrid (in-person + remote) mode
    │   ├── video-room.tsx             Fully remote video play mode
    │   ├── connect-tv.tsx             Cast/connect to TV
    │   ├── public.tsx                 Public/open session browsing
    │   ├── invite.tsx                 Invite players to a party
    │   ├── qr-join.tsx                Join a party via QR code
    │   ├── local-register.tsx         Register local (same-room) players
    │   ├── party-type.tsx             Choose party type/mode
    │   ├── schedule.tsx               Schedule a future party
    │   ├── seating.tsx                Seating arrangement
    │   └── teams.tsx                  Team assignment
    ├── results/                     Post-party screens
    │   ├── end-party-summary.tsx      Summary after a party ends
    │   ├── mvp-awards.tsx             MVP/awards screen
    │   └── highlights.tsx             Highlight reel
    ├── profile/                     Profile-related screens
    │   ├── edit.tsx                   Edit profile
    │   ├── friends.tsx                Friends list
    │   ├── achievements.tsx           Achievements/badges
    │   ├── referrals.tsx              Referral program
    │   ├── settings.tsx               App settings
    │   ├── help.tsx                   Help/support
    │   └── sponsor-management.tsx     Sponsor/brand management (sponsored content?)
    └── wallet/                      Wallet-related screens
        ├── buy-token.tsx              Purchase tokens
        └── transactions.tsx           Transaction history

components/                   Reusable UI components
├── brand/                       Brand elements (logo, gradient text, token badge)
├── shared/                      Generic shared inputs/buttons (AuthInput, SocialBtn, Toast, GoBack)
├── screens/profile/              Screen-specific components (ProfileCover)
└── *.tsx                        Feature components (PartyCard, HeroCard, MarketPlaceCard,
                                  QuickDeckCard, QuickDiscoverCard, CrewOnline, CardPreviewCarousel,
                                  PackDetailModal, Header, TokenBadge, MarketplaceCardSkeleton)

context/                      React context providers
├── ChatContext.tsx              Party chat state
└── PlayersContext.tsx           Players-in-party state

hooks/                         Custom hooks (e.g. useToast)
lib/                            Shared utilities
├── posthog.ts                    PostHog client setup
└── utils.ts                      General helpers

data/                          Static/mock data
├── mock.ts                       Mock parties, friends, game types, quick actions, colors/gradients
└── tokenBundles.ts               Token purchase bundle definitions

assets/                        Fonts, images, icons
```

## Key integration points

- **Clerk** (`app/_layout.tsx`, `app/(auth)/*`): all auth flows go through `useSignIn`/`useSignUp` from `@clerk/expo`. Email-code verification is handled as either a first-factor (new/unverified accounts) or second-factor/MFA challenge depending on `signIn.status`.
- **PostHog** (`lib/posthog.ts`, `app/_layout.tsx`): screen views are auto-tracked on route change (with an allowlist of safe query params), plus manual `posthog.capture(...)` events sprinkled through key interactions (quick actions, sign-in/sign-up, SSO).
- **NativeWind**: styling is Tailwind-based via `className` props; see `global.css` and `tailwind.config` for theme tokens (colors, gradients also mirrored in `data/mock.ts`).
