import { useRouter } from "expo-router";
import {
  Heart,
  Laugh,
  Mic,
  MicOff,
  MoreVertical,
  Sparkles,
  ThumbsUp,
  X,
} from "lucide-react-native";
import { styled } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

const SafeAreaView = styled(RNSafeAreaView);

const { width } = Dimensions.get("window");

type Player = {
  id: number;
  name: string;
  initials: string;
  online: boolean;
};

type GameCard = {
  game: string;
  prompt: string;
  level: string;
};

const CARDS: GameCard[] = [
  {
    game: "Truth or Dare",
    prompt: "Show your camera roll's most embarrassing screenshot.",
    level: "Spicy",
  },
  {
    game: "Never Have I Ever",
    prompt: "...sent a risky text and immediately regretted it.",
    level: "Spicy",
  },
  {
    game: "Most Likely To",
    prompt: "...become internet famous for the wrong reason.",
    level: "Wild",
  },
];

const PLAYERS: Player[] = [
  {
    id: 1,
    name: "Desmond",
    initials: "DA",
    online: true,
  },
  {
    id: 2,
    name: "Sarah",
    initials: "SA",
    online: true,
  },
  {
    id: 3,
    name: "Michael",
    initials: "MK",
    online: true,
  },
  {
    id: 4,
    name: "Amaka",
    initials: "AO",
    online: false,
  },
  {
    id: 5,
    name: "David",
    initials: "DO",
    online: true,
  },
  {
    id: 6,
    name: "Jessica",
    initials: "JA",
    online: true,
  },
];

const SHORTCUTS = [
  {
    route: "/play/card-reveal",
    label: "Reveal",
  },
  {
    route: "/play/challenge",
    label: "Challenge",
  },
  {
    route: "/play/active-player",
    label: "Active",
  },
  {
    route: "/play/video-room",
    label: "Video",
  },
  {
    route: "/lobby/ai-host",
    label: "AI Host",
  },
  {
    route: "/results/highlights",
    label: "Highlights",
  },
];

const TIMER_DURATION = 45;
const CIRCLE_RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export default function GameRoom() {
  const router = useRouter();

  const [cardIndex, setCardIndex] = useState(0);
  const [seconds, setSeconds] = useState(TIMER_DURATION);
  const [muted, setMuted] = useState(false);
  const [selectedReaction, setSelectedReaction] =
    useState<number | null>(null);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    };
  }, []);

  const card = CARDS[cardIndex % CARDS.length];

  const currentPlayer =
    PLAYERS[cardIndex % PLAYERS.length];

  const round = cardIndex + 1;

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  const timerOffset = useMemo(() => {
    const progress = seconds / TIMER_DURATION;

    return CIRCUMFERENCE * (1 - progress);
  }, [seconds]);

  const handleNextCard = () => {
    setCardIndex((current) => current + 1);
    setSeconds(TIMER_DURATION);
    setSelectedReaction(null);
  };

  const handleReaction = (index: number) => {
    setSelectedReaction(index);

    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    reactionTimeoutRef.current = setTimeout(() => {
      setSelectedReaction(null);
      reactionTimeoutRef.current = null;
    }, 500);
  };

  const handleEndGame = () => {
    Alert.alert(
      "End Game?",
      "Are you sure you want to leave this game?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Game",
          style: "destructive",
          onPress: () => router.push("/results"),
        },
      ]
    );
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#100B2E]">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#100B2E"
      />

      <View className="flex-1">
        {/* HEADER */}

        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            onPress={goBack}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>

          <View className="items-center">
            <Text className="text-[10px] font-medium uppercase tracking-[2px] text-white/50">
              Round {round} of 10
            </Text>

            <Text className="mt-1 text-sm font-bold text-white">
              {card.game}
            </Text>
          </View>

          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <MoreVertical
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 140,
          }}
        >
          {/* PLAYERS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 10,
            }}
          >
            {PLAYERS.map((player, index) => {
              const isActive =
                player.id === currentPlayer.id;

              return (
                <View
                  key={player.id}
                  className={`
                    relative h-20 w-20 overflow-hidden rounded-2xl
                    ${isActive
                      ? "border-2 border-[#FF8A00] bg-[#FF4D8D]"
                      : "bg-[#4D2A9A]"
                    }
                  `}
                >
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-lg font-black text-white">
                      {player.initials}
                    </Text>
                  </View>

                  {isActive && (
                    <View className="absolute bottom-1 left-1 rounded-full bg-[#FF8A00] px-2 py-0.5">
                      <Text className="text-[8px] font-black text-[#171122]">
                        ON
                      </Text>
                    </View>
                  )}

                  {!player.online && (
                    <View className="absolute inset-0 items-center justify-center bg-black/60">
                      <Text className="text-[8px] font-bold uppercase text-white/60">
                        Offline
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* MAIN CONTENT */}

          <View className="items-center px-5 pt-8">
            {/* TIMER */}

            <View className="mb-6 h-20 w-20 items-center justify-center">
              <Svg
                width={80}
                height={80}
                viewBox="0 0 80 80"
                style={{
                  position: "absolute",
                  transform: [
                    {
                      rotate: "-90deg",
                    },
                  ],
                }}
              >
                <Circle
                  cx="40"
                  cy="40"
                  r={CIRCLE_RADIUS}
                  stroke="#2A2354"
                  strokeWidth="6"
                  fill="none"
                />

                <Circle
                  cx="40"
                  cy="40"
                  r={CIRCLE_RADIUS}
                  stroke="url(#timerGradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={timerOffset}
                />

                <Defs>
                  <LinearGradient
                    id="timerGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <Stop
                      offset="0"
                      stopColor="#9B5CFF"
                    />

                    <Stop
                      offset="1"
                      stopColor="#FF8A00"
                    />
                  </LinearGradient>
                </Defs>
              </Svg>

              <Text className="text-2xl font-black text-white">
                {seconds}
              </Text>
            </View>

            {/* GAME CARD */}

            <View
              style={{
                width: Math.min(width - 40, 360),
              }}
              className="relative"
            >
              {/* BACK CARD 1 */}

              <View
                style={{
                  transform: [
                    {
                      rotate: "-3deg",
                    },
                  ],
                }}
                className="absolute inset-0 rounded-4xl bg-[#6F3AFF]/40"
              />

              {/* BACK CARD 2 */}

              <View
                style={{
                  transform: [
                    {
                      rotate: "3deg",
                    },
                  ],
                }}
                className="absolute inset-0 rounded-4xl bg-[#FF4D8D]/40"
              />

              {/* FRONT CARD */}

              <View
                style={{
                  minHeight: 300,
                }}
                className="overflow-hidden rounded-4xl bg-[#6D35D9] p-6"
              >
                {/* DECORATIONS */}

                <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

                <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />

                <View className="flex-1">
                  {/* CARD HEADER */}

                  <View className="flex-row items-center justify-between">
                    <View className="rounded-full bg-white/20 px-3 py-1.5">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                        {card.level}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
                      <Sparkles
                        size={12}
                        color="#FFFFFF"
                      />

                      <Text className="text-[10px] font-bold text-white">
                        AI
                      </Text>
                    </View>
                  </View>

                  {/* PROMPT */}

                  <View className="flex-1 justify-center py-8">
                    <Text className="text-2xl font-black leading-8 text-white">
                      {card.prompt}
                    </Text>
                  </View>

                  {/* ACTIVE PLAYER */}

                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <Text className="font-black text-white">
                        {currentPlayer.initials}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-xs text-white/60">
                        {"It's your turn"}
                      </Text>

                      <Text className="mt-0.5 text-sm font-bold text-white">
                        {currentPlayer.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* REACTIONS */}

            <View className="mt-7 flex-row gap-3">
              <ReactionButton
                active={selectedReaction === 0}
                onPress={() => handleReaction(0)}
              >
                <Heart
                  size={21}
                  color="#FF4D8D"
                  fill="#FF4D8D"
                />
              </ReactionButton>

              <ReactionButton
                active={selectedReaction === 1}
                onPress={() => handleReaction(1)}
              >
                <Laugh
                  size={21}
                  color="#FF8A00"
                />
              </ReactionButton>

              <ReactionButton
                active={selectedReaction === 2}
                onPress={() => handleReaction(2)}
              >
                <ThumbsUp
                  size={21}
                  color="#9B5CFF"
                  fill="#9B5CFF"
                />
              </ReactionButton>

              <ReactionButton
                active={selectedReaction === 3}
                onPress={() => handleReaction(3)}
              >
                <Sparkles
                  size={21}
                  color="#FF8A00"
                  fill="#FF8A00"
                />
              </ReactionButton>
            </View>

            {/* SHORTCUTS */}

            <View className="mt-6 flex-row flex-wrap justify-center gap-2 px-2">
              {SHORTCUTS.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() =>
                    router.push(item.route as never)
                  }
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2"
                >
                  <Text className="text-[11px] font-bold text-white">
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM CONTROLS */}

        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-3">
          <View className="mx-auto w-full max-w-md flex-row items-center gap-3 rounded-[28px] border border-white/10 bg-[#211A46]/95 p-3">
            {/* MIC */}

            <Pressable
              onPress={() =>
                setMuted((current) => !current)
              }
              className={`
                h-12 w-12 items-center justify-center rounded-2xl
                ${muted
                  ? "bg-red-500/20"
                  : "bg-white/10"
                }
              `}
            >
              {muted ? (
                <MicOff
                  size={21}
                  color="#EF4444"
                />
              ) : (
                <Mic
                  size={21}
                  color="#FFFFFF"
                />
              )}
            </Pressable>

            {/* NEXT */}

            <Pressable
              onPress={handleNextCard}
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#7438E8]"
            >
              <Text className="text-sm font-bold text-white">
                Next card →
              </Text>
            </Pressable>

            {/* END */}

            <Pressable
              onPress={handleEndGame}
              className="h-12 items-center justify-center rounded-2xl bg-white/10 px-4"
            >
              <Text className="text-xs font-bold text-white">
                End
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type ReactionButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
};

function ReactionButton({
  children,
  active,
  onPress,
}: ReactionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        h-12 w-12 items-center justify-center rounded-full
        border border-white/10
        ${active
          ? "scale-125 bg-white/20"
          : "bg-white/10"
        }
      `}
    >
      {children}
    </Pressable>
  );
}