import {
  Flame,
  Trophy,
  Users,
  Zap,
} from "lucide-react-native";

import deckCharades from "@/assets/images/deck-charades.jpg";
import deckCorporate from "@/assets/images/deck-corporate.jpg";
import deckCouple from "@/assets/images/deck-couple.jpg";
import deckFamily from "@/assets/images/deck-family.jpg";
import deckGuessMovie from "@/assets/images/deck-guess-movie.jpg";
import deckGuessSong from "@/assets/images/deck-guess-song.jpg";
import deckHotSeat from "@/assets/images/deck-hot-seat.jpg";
import deckMostLikely from "@/assets/images/deck-most-likely.jpg";
import deckNeverHaveI from "@/assets/images/deck-never-have-i.jpg";
import deckParty from "@/assets/images/deck-party.jpg";
import deckRapidFire from "@/assets/images/deck-rapid-fire.jpg";
import deckTruthDare from "@/assets/images/deck-truth-dare.jpg";
import deckTwoTruths from "@/assets/images/deck-two-truths.jpg";
import deckWild from "@/assets/images/deck-wild.jpg";
import deckWouldRather from "@/assets/images/deck-would-rather.jpg";

import partyP1 from "@/assets/images/party-p1.jpg";
import partyP2 from "@/assets/images/party-p2.jpg";
import partyP3 from "@/assets/images/party-p3.jpg";
import partyP4 from "@/assets/images/party-p4.jpg";
import partyP5 from "@/assets/images/party-p5.jpg";

// ─── Palette ─────────────────────────────────────────────────────────────────
// Named stops that match the Tailwind custom colors in the web app.
// Use these anywhere you need a consistent brand color in RN.
export const COLORS = {
  violet: "#7A1EFF",
  violetBright: "#A855F7",
  magenta: "#D84CFF",
  orange: "#FF8A2A",
  indigoDark: "#312E81",
  ink: "#0D0D12",
} as const;

// Pre-built gradient pairs for LinearGradient (start → end).
// Replaces the Tailwind "from-X to-Y" gradient class strings.
export const GRADIENTS = {
  "violet-magenta": [COLORS.violet, COLORS.magenta] as const,
  "magenta-orange": [COLORS.magenta, COLORS.orange] as const,
  "indigo-violet": [COLORS.indigoDark, COLORS.violet] as const,
  "violet-bright-indigo": [COLORS.violetBright, COLORS.indigoDark] as const,
  "orange-magenta": [COLORS.orange, COLORS.magenta] as const,
  "orange-violet": [COLORS.orange, COLORS.violet] as const,
  "violet-orange": [COLORS.violet, COLORS.orange] as const,
  "orange-violet-bright": [COLORS.orange, COLORS.violetBright] as const,
  "magenta-violet": [COLORS.magenta, COLORS.violet] as const,
  "indigo-magenta": [COLORS.indigoDark, COLORS.magenta] as const,
  "magenta-orange-2": [COLORS.magenta, COLORS.orange] as const,
  "violet-indigo": [COLORS.violet, COLORS.indigoDark] as const,
  "indigo-violet-bright": [COLORS.indigoDark, COLORS.violetBright] as const,
  "magenta-violet-bright": [COLORS.magenta, COLORS.violetBright] as const,
} as const;

export type GradientKey = keyof typeof GRADIENTS;

export const GAME_TYPES: GameTypeProps[] = [
  { id: "truth-dare", name: "Truth or Dare", emoji: "🎭", tagline: "Spill or risk it.", audience: "Friends", intensity: "Wild", gradient: GRADIENTS["violet-magenta"], cost: 0, image: deckTruthDare },
  { id: "never-have-i", name: "Never Have I Ever", emoji: "🙊", tagline: "Confess in style.", audience: "Friends", intensity: "Medium", gradient: GRADIENTS["magenta-orange"], cost: 0, image: deckNeverHaveI },
  { id: "most-likely", name: "Most Likely To", emoji: "👉", tagline: "Point. Laugh. Repeat.", audience: "Friends", intensity: "Medium", gradient: GRADIENTS["indigo-violet"], cost: 0, image: deckMostLikely },
  { id: "would-rather", name: "Would You Rather", emoji: "🤔", tagline: "Impossible choices.", audience: "All", intensity: "Chill", gradient: GRADIENTS["violet-bright-indigo"], cost: 0, image: deckWouldRather },
  { id: "two-truths", name: "Two Truths & a Lie", emoji: "🕵️", tagline: "Spot the fake.", audience: "Teams", intensity: "Chill", gradient: GRADIENTS["orange-magenta"], cost: 0, image: deckTwoTruths },
  { id: "rapid-fire", name: "Rapid Fire", emoji: "⚡", tagline: "60 seconds. Go.", audience: "All", intensity: "Wild", gradient: GRADIENTS["orange-violet"], cost: 5, image: deckRapidFire },
  { id: "charades", name: "Charades", emoji: "🎬", tagline: "Act it out.", audience: "Family", intensity: "Medium", gradient: GRADIENTS["violet-orange"], cost: 0, image: deckCharades },
  { id: "hot-seat", name: "Hot Seat", emoji: "🔥", tagline: "All eyes on you.", audience: "Friends", intensity: "Wild", gradient: GRADIENTS["orange-violet-bright"], cost: 10, image: deckHotSeat },
  { id: "guess-song", name: "Guess the Song", emoji: "🎵", tagline: "Name that tune.", audience: "All", intensity: "Chill", gradient: GRADIENTS["magenta-violet"], cost: 5, image: deckGuessSong },
  { id: "guess-movie", name: "Guess the Movie", emoji: "🍿", tagline: "Lights, camera, guess.", audience: "All", intensity: "Chill", gradient: GRADIENTS["indigo-magenta"], cost: 5, image: deckGuessMovie },
  { id: "couple", name: "Couple Challenge", emoji: "💞", tagline: "How well do you know?", audience: "Couples", intensity: "Medium", gradient: GRADIENTS["magenta-orange"], cost: 10, image: deckCouple },
  { id: "family", name: "Family Challenge", emoji: "🏡", tagline: "Bonding without cringe.", audience: "Family", intensity: "Chill", gradient: GRADIENTS["violet-indigo"], cost: 0, image: deckFamily },
  { id: "corporate", name: "Corporate Challenge", emoji: "💼", tagline: "Team building, leveled up.", audience: "Teams", intensity: "Medium", gradient: GRADIENTS["indigo-violet-bright"], cost: 15, image: deckCorporate },
  { id: "party", name: "Party Challenge", emoji: "🎉", tagline: "Pure unfiltered chaos.", audience: "All", intensity: "Wild", gradient: GRADIENTS["violet-orange"], cost: 0, image: deckParty },
  { id: "wild", name: "Wild Challenge", emoji: "🃏", tagline: "Anything goes.", audience: "Adults", intensity: "Wild", gradient: GRADIENTS["magenta-violet-bright"], cost: 20, image: deckWild },
];

export const PARTIES: PartyProps[] = [
  {
    id: "p1",
    title: "Friday Night Chaos 🔥",
    host: "Maya R.",
    hostAvatar: "MR",
    players: 7,
    maxPlayers: 12,
    type: "Truth or Dare",
    mode: "Online",
    startsIn: "Live now",
    cover: [COLORS.violet, COLORS.orange],
    image: partyP1,
    tags: ["18+", "Spicy", "Voice"],
    isLive: true,
    isPublic: true,
  },
  {
    id: "p2",
    title: "Couples Game Night",
    host: "Jordan & Sam",
    hostAvatar: "JS",
    players: 4,
    maxPlayers: 8,
    type: "Couple Challenge",
    mode: "Hybrid",
    startsIn: "in 12m",
    cover: [COLORS.magenta, COLORS.violet],
    image: partyP2,
    tags: ["Couples", "Cozy"],
    isPublic: true,
  },
  {
    id: "p3",
    title: "Acme Team Quarterly",
    host: "Acme Co.",
    hostAvatar: "AC",
    players: 22,
    maxPlayers: 50,
    type: "Corporate Challenge",
    mode: "Hybrid",
    startsIn: "in 1h",
    cover: [COLORS.indigoDark, COLORS.magenta],
    image: partyP3,
    tags: ["Sponsored", "Teams"],
    sponsored: "Acme",
    isPublic: false,
  },
  {
    id: "p4",
    title: "Dorm 4B vs The World",
    host: "Leo K.",
    hostAvatar: "LK",
    players: 9,
    maxPlayers: 16,
    type: "Rapid Fire",
    mode: "In-person",
    startsIn: "Live now",
    cover: [COLORS.orange, COLORS.violet],
    image: partyP4,
    tags: ["Uni", "Fast"],
    isLive: true,
    isPublic: true,
  },
  {
    id: "p5",
    title: "Sunday Brunch Vibes",
    host: "Priya N.",
    hostAvatar: "PN",
    players: 3,
    maxPlayers: 6,
    type: "Would You Rather",
    mode: "Online",
    startsIn: "Tomorrow 11am",
    cover: [COLORS.violetBright, COLORS.magenta],
    image: partyP5,
    tags: ["Chill", "Brunch"],
    isPublic: true,
  },
];

export const FRIENDS: FriendProps[] = [
  { id: "f1", name: "Maya Rivera", handle: "@mayarvr", initials: "MR", online: true, inParty: "Friday Night Chaos", level: 24 },
  { id: "f2", name: "Jordan Kim", handle: "@jordkm", initials: "JK", online: true, level: 18 },
  { id: "f3", name: "Leo Park", handle: "@leop", initials: "LP", online: true, inParty: "Dorm 4B", level: 31 },
  { id: "f4", name: "Priya Nair", handle: "@priyan", initials: "PN", online: false, level: 12 },
  { id: "f5", name: "Sam Wright", handle: "@samw", initials: "SW", online: true, level: 22 },
  { id: "f6", name: "Aiden Cole", handle: "@aiden", initials: "AC", online: false, level: 8 },
];

export const QUICK_ACTIONS = [
  { icon: Zap, label: "Quick Match", href: "/lobby/quick", colors: ["#FF8A2A", "#D84CFF"] as const },
  { icon: Users, label: "Friends", href: "/friends", colors: ["#7A1EFF", "#A855F7"] as const },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard", colors: ["#D84CFF", "#FF8A2A"] as const },
  { icon: Flame, label: "Trending", href: "/public", colors: ["#312E81", "#7A1EFF"] as const },
];