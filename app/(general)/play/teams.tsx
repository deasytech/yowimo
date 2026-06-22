import GoBack from "@/components/shared/GoBack";
import { usePlayers } from "@/context/PlayersContext";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Shuffle
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

interface TeamPlayer {
  id: string;
  name: string;
}

const TEAMS = [
  {
    id: "red",
    name: "Red Comets",
    colors: ["#FF8A2A", "#D84CFF"],
  },
  {
    id: "blue",
    name: "Blue Bolts",
    colors: ["#7A1EFF", "#2D2A8F"],
  },
];

export default function TeamSelectionScreen() {
  const { players: registeredPlayers } = usePlayers();
  const [pool, setPool] = useState<TeamPlayer[]>([]);
  const [assign, setAssign] = useState<Record<string, string>>({});

  useEffect(() => {
    if (registeredPlayers.length > 0) {
      setPool(
        registeredPlayers.map((player, index) => ({
          id: String(index),
          name: player.name,
        }))
      );
    }
  }, [registeredPlayers]);

  const teamOf = (id: string) => assign[id];

  const moveTo = (
    playerId: string,
    teamId: string
  ) => {
    setAssign((prev) => ({
      ...prev,
      [playerId]: teamId,
    }));
  };

  const shuffleTeams = () => {
    const result: Record<string, string> = {};

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach((player, index) => {
      result[player.id] =
        TEAMS[index % TEAMS.length].id;
    });

    setAssign(result);
  };

  const removeFromTeam = (
    playerId: string
  ) => {
    setAssign((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  };

  const unassigned = pool.filter(
    (player) => !teamOf(player.id)
  );

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
        <GoBack title="Pick Your Teams" rightIcon={Shuffle} rightAction={shuffleTeams} />

        {/* Unassigned */}
        <View className="mt-5 rounded-3xl border border-white/10 bg-card p-4">
          <Text className="mb-3 font-sans-semibold text-sm text-white">
            Unassigned ({unassigned.length})
          </Text>

          <View className="flex-row flex-wrap">
            {unassigned.map((player) => (
              <View
                key={player.id}
                className="mb-2 mr-2 flex-row items-center rounded-full bg-secondary px-3 py-1.5"
              >
                <LinearGradient
                  colors={[
                    "#7A1EFF",
                    "#D84CFF",
                  ]}
                  className="h-7 w-7 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">
                    {player.name[0]}
                  </Text>
                </LinearGradient>

                <Text className="mx-2 text-sm text-white">
                  {player.name}
                </Text>

                <View className="ml-1 flex-row">
                  {TEAMS.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      onPress={() =>
                        moveTo(
                          player.id,
                          team.id
                        )
                      }
                    >
                      <LinearGradient
                        colors={
                          team.colors as [
                            string,
                            string
                          ]
                        }
                        className="ml-1 h-6 w-6 items-center justify-center rounded-full"
                      >
                        <Text className="text-[10px] font-bold text-white">
                          {team.name[0]}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {unassigned.length === 0 && (
              <Text className="text-xs text-muted-foreground">
                All players placed ✨
              </Text>
            )}
          </View>
        </View>

        {/* Teams */}
        <View className="mt-4">
          {TEAMS.map((team) => {
            const members =
              pool.filter(
                (player) =>
                  teamOf(player.id) ===
                  team.id
              );

            return (
              <LinearGradient
                key={team.id}
                colors={
                  team.colors as [
                    string,
                    string
                  ]
                }
                className="mb-4 overflow-hidden rounded-3xl p-5"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-sg-bold text-lg text-white">
                    {team.name}
                  </Text>

                  <View className="rounded-full bg-black/30 px-3 py-1">
                    <Text className="text-xs font-bold text-white">
                      {members.length}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row flex-wrap">
                  {members.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() =>
                        removeFromTeam(
                          member.id
                        )
                      }
                      className="mb-2 mr-2 flex-row items-center rounded-full bg-white/20 px-3 py-1"
                    >
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                        <Text className="text-[10px] font-bold text-background">
                          {member.name[0]}
                        </Text>
                      </View>

                      <Text className="ml-2 text-sm text-white">
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {members.length === 0 && (
                    <Text className="text-xs text-white/80">
                      Tap a player above to add them here
                    </Text>
                  )}
                </View>
              </LinearGradient>
            );
          })}
        </View>

      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-4">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/play/seating")
          }
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
            ]}
            className="h-14 items-center justify-center rounded-2xl"
          >
            <Text className="font-sans-bold text-base text-white">
              Confirm Teams
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}