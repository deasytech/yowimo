import GoBack from "@/components/shared/GoBack";
import { usePlayers } from "@/context/PlayersContext";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Crown
} from "lucide-react-native";
import { styled } from "nativewind";
import { useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const TABLE_SIZE = 320;
const PLAYER_SIZE = 48;
const RADIUS = 140;

export default function SeatingScreen() {
  const { players: playersParam } = useLocalSearchParams<{ players: string }>();
  const { players: contextPlayers } = usePlayers();

  const players = useMemo<string[]>(() => {
    if (playersParam) {
      try {
        return JSON.parse(playersParam) as string[];
      } catch {
        // fall through to context
      }
    }
    return contextPlayers.map((p) => p.name);
  }, [playersParam, contextPlayers]);

  const positions = useMemo(() => {
    return players.map((_, index) => {
      const angle =
        (index / players.length) *
        2 *
        Math.PI -
        Math.PI / 2;

      return {
        left:
          TABLE_SIZE / 2 +
          RADIUS * Math.cos(angle) -
          PLAYER_SIZE / 2,

        top:
          TABLE_SIZE / 2 +
          RADIUS * Math.sin(angle) -
          PLAYER_SIZE / 2,
      };
    });
  }, [players]);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Seating" />

        <Text className="mt-3 text-sm text-muted-foreground">
          Drag the table to reorder turns.
          Tap a seat to swap.
        </Text>

        {/* Table */}
        <View className="mt-8 items-center">
          <View
            style={{
              width: TABLE_SIZE,
              height: TABLE_SIZE,
            }}
            className="relative"
          >
            {/* Center Table */}
            <LinearGradient
              colors={[
                "#7A1EFF",
                "#D84CFF",
              ]}
              className="absolute inset-12 items-center justify-center rounded-full"
            >
              <Crown
                size={28}
                color="#FFFFFF"
              />

              <Text className="mt-2 font-sg-extrabold text-2xl text-white">
                Yowimo
              </Text>

              <Text className="text-[11px] uppercase tracking-wider text-white/80">
                Round 1
              </Text>
            </LinearGradient>

            {/* Players */}
            {players.map(
              (player, index) => (
                <View
                  key={player}
                  style={{
                    position: "absolute",
                    left:
                      positions[index]
                        .left,
                    top:
                      positions[index]
                        .top,
                  }}
                  className="items-center"
                >
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-2xl ${index === 0
                      ? "border-2 border-white bg-accent"
                      : "bg-card"
                      }`}
                  >
                    <Text className="font-sg-bold text-white">
                      {player[0]}
                    </Text>
                  </View>

                  <Text className="mt-1 text-[10px] text-white">
                    {player}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Turn Order */}
        <View className="mt-8 rounded-3xl border border-white/10 bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white">
              Turn Order
            </Text>

            <Text className="text-sm font-sans-semibold text-accent">
              {players[0]} starts
            </Text>
          </View>

          <View className="mt-3 flex-row flex-wrap">
            {players.map(
              (player, index) => (
                <View
                  key={player}
                  className="mb-2 mr-2 rounded-full bg-secondary px-3 py-1"
                >
                  <Text className="text-xs text-white">
                    {index + 1}. {player}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* CTA */}
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/play/game")
          }
          className="mt-6"
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
              "#FF8A2A",
            ]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Start The Game 🎴
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}