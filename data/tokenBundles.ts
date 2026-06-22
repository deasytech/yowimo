export const TOKEN_BUNDLES = [
  {
    id: "starter",
    name: "Starter",
    tokens: 100,
    price: 1.99,
    badge: null,
    colors: ["#7A1EFF", "#2D2A8F"] as const,
  },
  {
    id: "party",
    name: "Party",
    tokens: 500,
    price: 7.99,
    badge: "Popular",
    colors: ["#D84CFF", "#7A1EFF"] as const,
  },
  {
    id: "legend",
    name: "Legend",
    tokens: 1500,
    price: 19.99,
    badge: "Best value",
    colors: ["#FF8A2A", "#D84CFF"] as const,
  },
  {
    id: "whale",
    name: "Whale",
    tokens: 5000,
    price: 49.99,
    badge: null,
    colors: ["#B03BFF", "#FF8A2A"] as const,
  },
] as const;

export type TokenBundleId = (typeof TOKEN_BUNDLES)[number]["id"];

