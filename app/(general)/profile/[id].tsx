import Avatar from "@/components/shared/Avatar";
import GoBack from "@/components/shared/GoBack";
import { COUNTRIES } from "@/data/countries";
import { useGameTypes } from "@/hooks/api/useGameTypes";
import { usePublicUser } from "@/hooks/api/useUsers";
import { initialsFromName } from "@/lib/utils";
import { useLocalSearchParams } from "expo-router";
import { styled } from "nativewind";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function StatTile({ value, label, isFirst }: Readonly<{ value: number; label: string; isFirst: boolean }>) {
  return (
    <View
      className="flex-1 items-center py-3"
      style={!isFirst ? { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.10)" } : undefined}
    >
      <Text className="text-foreground text-xl font-extrabold leading-none">{value}</Text>
      <Text className="mt-1.5 text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const validId = Number.isFinite(userId);

  const { data: user, isLoading, isError, refetch } = usePublicUser(validId ? userId : null);
  // Only fetched to resolve interest slugs into a name/emoji — already cached app-wide, so this
  // never costs its own request if anything else has loaded it first.
  const { data: gameTypes } = useGameTypes();

  const name = user?.display_name || user?.username || "Friend";
  const country = COUNTRIES.find((c) => c.code === user?.country_code);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5">
        <GoBack title={name} showTitle={false} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B03BFF" />
        </View>
      ) : isError || !user ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-muted-foreground text-sm text-center">
            Couldn&apos;t load this profile.
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
            <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center gap-3">
            <Avatar avatarUrl={user.avatar_url} initials={initialsFromName(name)} size={96} />
            <View className="items-center">
              <Text className="text-foreground text-xl font-bold">{name}</Text>
              {user.username && (
                <Text className="text-muted-foreground text-sm">@{user.username}</Text>
              )}
              {country && (
                <Text className="mt-1 text-muted-foreground text-sm">{country.name}</Text>
              )}
            </View>
          </View>

          {user.stats && (
            <View className="mt-6 flex-row rounded-2xl overflow-hidden border border-white/10 bg-white/10">
              <StatTile value={user.stats.friends_count} label="Friends" isFirst />
              <StatTile value={user.stats.parties_joined_count} label="Joined" isFirst={false} />
              <StatTile value={user.stats.parties_created_count} label="Created" isFirst={false} />
            </View>
          )}

          {user.bio && (
            <View className="mt-6">
              <Text className="mb-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                About
              </Text>
              <Text className="text-foreground text-sm leading-relaxed">{user.bio}</Text>
            </View>
          )}

          {user.interests && user.interests.length > 0 && (
            <View className="mt-6">
              <Text className="mb-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {user.interests.map((slug) => {
                  const gameType = gameTypes?.find((g) => g.slug === slug);
                  return (
                    <View
                      key={slug}
                      className="flex-row items-center gap-1 rounded-full border border-border bg-secondary/40 px-3 py-1.5"
                    >
                      {gameType?.emoji && <Text className="text-xs">{gameType.emoji}</Text>}
                      <Text className="text-xs font-semibold text-foreground">
                        {gameType?.name ?? slug}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
