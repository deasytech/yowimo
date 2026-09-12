# Yowimo

Yowimo is an Expo-based React Native app for hosting and playing social party card games with friends. The product is designed for in-person, remote, and hybrid sessions, with party lobbies, chat, game rounds, leaderboards, rewards, and a token-powered marketplace.

## What the app does

- Create or join live party-game sessions.
- Support multiple play modes: in-person, video-room, hybrid, and public play.
- Let players move through lobby, team setup, game rounds, and end-of-party results.
- Offer a marketplace and wallet flow for token-based deck and pack purchases.
- Track engagement with PostHog analytics and manage authentication with Clerk.

## Current product surface

The app currently includes screens and flows for:

- Onboarding and authentication
- Home, discover, play, marketplace, wallet, notifications, and profile tabs
- Party lobby, QR join, invites, waiting room, AI host mode, and chat
- Active gameplay flows such as challenge, card reveal, seating, teams, and TV connect
- Results, MVP awards, highlights, achievements, referrals, and leaderboard views

Much of the product structure is already mapped, while some flows are still powered by mock data as the backend is being defined.

## Tech stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- expo-router for file-based routing
- NativeWind for styling
- Clerk for authentication
- PostHog for analytics

## Project structure

```text
app/                  Main application routes and screens
components/           Reusable UI components
context/              Shared React context providers
data/                 Mock data and static bundle definitions
hooks/                Custom hooks
lib/                  Shared utilities and integrations
assets/               Fonts, images, and icons
```

Key route groups:

- `app/(auth)` for sign-in and sign-up flows
- `app/(tabs)` for the main authenticated tab experience
- `app/(general)` for deeper feature flows such as lobby, chat, play, profile, results, and wallet screens

## Getting started

### Prerequisites

- Node.js 20+ recommended
- npm
- Xcode for iOS simulation
- Android Studio for Android simulation
- Expo CLI via `npx`

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root and add:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
POSTHOG_PROJECT_TOKEN=your_posthog_project_token
POSTHOG_HOST=https://us.i.posthog.com
```

Notes:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is required at startup.
- PostHog is optional for local development, but analytics stays disabled until the token is configured.
- PostHog values are read through `app.config.js` and exposed via Expo config extras.

### Run the app

```bash
npm run start
```

You can then open the project in:

- an iOS simulator
- an Android emulator
- Expo Go
- the web preview

Platform-specific commands:

```bash
npm run ios
npm run android
npm run web
```

## Available scripts

```bash
npm run start
npm run ios
npm run android
npm run web
npm run lint
```

## Authentication and analytics

- Clerk powers email/password and SSO authentication.
- PostHog tracks screen views and product events across onboarding, auth, discovery, and gameplay entry points.
- The root layout wires up fonts, splash-screen handling, auth, analytics, and global providers.

## Architecture notes

- The frontend is built as a mobile-first Expo app with typed file-based routing.
- Styling uses Tailwind-style utility classes through NativeWind.
- Shared state currently lives in React context for areas like players and chat.
- Backend direction is documented separately and currently targets Laravel, Clerk-verified auth, realtime party updates, wallet flows, and video support.

## Supporting docs

- `OVERVIEW.md`: product and codebase overview
- `BACKEND_ARCHITECTURE.md`: backend model, API plan, and realtime architecture
- `posthog-setup-report.md`: analytics integration notes

## Repository status

This repository is the client application for Yowimo. It already contains the main screen architecture, navigation structure, authentication integration, analytics setup, and UI building blocks for the social party-game experience. The next major layer is wiring the existing flows to production backend services and realtime gameplay infrastructure.
