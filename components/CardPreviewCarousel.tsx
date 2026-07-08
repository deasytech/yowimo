import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LinearGradient = styled(RNLinearGradient);

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 72;
const CARD_HEIGHT = 180;
const CARD_GAP = 14;

export interface PreviewCard {
  id: number;
  kind: "truth" | "dare";
  text: string;
}

interface CardPreviewCarouselProps {
  cards: PreviewCard[];
  colors: [string, string];
  emoji: string;
}

function FlipPreviewCard({
  card,
  colors,
  emoji,
}: {
  card: PreviewCard;
  colors: [string, string];
  emoji: string;
}) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const flip = () => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 0 : 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
    setFlipped((f) => !f);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={flip}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backfaceVisibility: "hidden",
          borderRadius: 24,
          overflow: "hidden",
          opacity: frontOpacity,
          transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
        }}
      >
        <LinearGradient
          colors={colors}
          className="h-full w-full items-center justify-center"
        >
          <Text className="text-4xl">{emoji}</Text>
          <Text className="mt-3 text-xs font-sans-semibold uppercase tracking-widest text-white/85">
            Tap to reveal
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backfaceVisibility: "hidden",
          borderRadius: 24,
          overflow: "hidden",
          opacity: backOpacity,
          transform: [{ perspective: 1200 }, { rotateY: backRotate }],
        }}
      >
        <View className="h-full w-full items-center justify-center border border-white/10 bg-secondary p-5">
          <Text
            className={`text-[10px] font-sans-bold uppercase tracking-widest ${
              card.kind === "truth" ? "text-accent" : "text-primary"
            }`}
          >
            {card.kind}
          </Text>
          <Text className="mt-2 text-center font-sg-bold text-base text-white">
            {card.text}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CardPreviewCarousel({
  cards,
  colors,
  emoji,
}: CardPreviewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP)
    );
    setActiveIndex(index);
  };

  if (cards.length === 0) return null;

  return (
    <View>
      <Animated.ScrollView
        horizontal
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: CARD_GAP }}
      >
        {cards.map((card) => (
          <View key={card.id} style={{ width: CARD_WIDTH }}>
            <FlipPreviewCard card={card} colors={colors} emoji={emoji} />
          </View>
        ))}
      </Animated.ScrollView>

      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        {cards.map((card, index) => (
          <View
            key={card.id}
            className={`h-1.5 rounded-full ${
              index === activeIndex
                ? "w-4 bg-primary"
                : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </View>

      <Text className="mt-1 text-center text-[11px] text-muted-foreground">
        {activeIndex + 1} of {cards.length} · sample cards
      </Text>
    </View>
  );
}
