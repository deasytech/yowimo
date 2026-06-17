import { ImageSourcePropType } from "react-native";

declare global {
  interface ListHeadingProps {
    title: string;
    actionText: string;
    iconSet?: boolean;
  }

  interface GameTypeProps {
    id: string;
    name: string;
    emoji: string;
    tagline: string;
    audience: string;
    intensity: "Chill" | "Medium" | "Wild";
    gradient: readonly [string, string];
    cost: number;
    image?: ImageSourcePropType;
  }

  interface GameCardProps {
    game: GameTypeProps;
    width: number;
    height: number;
    onPress?: () => void;
  }

  interface PartyProps {
    id: string;
    title: string;
    host: string;
    hostAvatar: string;
    players: number;
    maxPlayers: number;
    type: string;
    mode: "Online" | "In-person" | "Hybrid";
    startsIn: string;
    cover: readonly [string, string];
    image?: ImageSourcePropType;
    tags: string[];
    isLive?: boolean;
    isPublic?: boolean;
    sponsored?: string;
  }

  interface FriendProps {
    id: string;
    name: string;
    handle: string;
    initials: string;
    online: boolean;
    inParty?: string;
    level: number;
  }

  interface AppHeaderProps {
    tokens?: number;
    title?: string;
    showLogo?: boolean;
  }
}

export { };
