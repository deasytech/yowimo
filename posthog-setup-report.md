# PostHog post-wizard report

The wizard has completed a full PostHog analytics integration for the Yowimo Expo app. Changes include: installing `posthog-react-native` and `react-native-svg`, creating `lib/posthog.ts` with a configured client, converting `app.json` to `app.config.js` to pass credentials via `expo-constants` extras, wrapping the root layout with `PostHogProvider` (autocapture + manual screen tracking with `usePathname`), identifying users on sign-in and sign-up via Clerk, calling `posthog.reset()` on sign-out, and adding `posthog.capture()` calls for 14 business events across 8 files.

| Event | Description | File |
|---|---|---|
| `sign_in_completed` | User successfully signs in with email/password | `app/(auth)/sign-in.tsx` |
| `sign_in_failed` | User's sign-in attempt was rejected | `app/(auth)/sign-in.tsx` |
| `sso_sign_in_initiated` | User taps Google or Apple SSO on sign-in screen | `app/(auth)/sign-in.tsx` |
| `mfa_verified` | User completes the MFA email-code challenge | `app/(auth)/sign-in.tsx` |
| `sign_up_completed` | User finishes account creation and verification | `app/(auth)/sign-up.tsx` |
| `sign_up_failed` | User's account-creation attempt failed | `app/(auth)/sign-up.tsx` |
| `sso_sign_up_initiated` | User taps Google or Apple SSO on sign-up screen | `app/(auth)/sign-up.tsx` |
| `email_verified` | User successfully verifies their email during sign-up | `app/(auth)/sign-up.tsx` |
| `sign_out_completed` | User signs out from the profile screen | `app/(tabs)/profile.tsx` |
| `party_created` | User taps 'Create Party' on the hero card | `components/HeroCard.tsx` |
| `quick_action_tapped` | User taps a quick-action shortcut on the home screen | `app/(tabs)/index.tsx` |
| `live_party_tapped` | User taps a live party card in the 'Live now' section | `components/QuickDiscoverCard.tsx` |
| `game_deck_selected` | User taps a game deck card in 'Pick your deck' | `components/QuickDeckCard.tsx` |
| `onboarding_viewed` | User views the onboarding screen | `app/onboarding.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/476903/dashboard/1735043)
- [Sign-ups & Sign-ins over time](https://us.posthog.com/project/476903/insights/zzUAZeq8)
- [Auth conversion funnel: Onboarding → Sign-up](https://us.posthog.com/project/476903/insights/W2ntbsjf)
- [Sign-in method breakdown](https://us.posthog.com/project/476903/insights/dQ7Spx3p)
- [Game engagement](https://us.posthog.com/project/476903/insights/HywRoviE)
- [Sign-outs (churn signal)](https://us.posthog.com/project/476903/insights/GhYuPluF)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs. Currently `identify` is called at sign-in and sign-up; verify Clerk session restoration in `_layout.tsx` also calls `posthog.identify` for already-signed-in users.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
