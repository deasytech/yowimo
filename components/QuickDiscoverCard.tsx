import { PartyDetail } from "@/lib/api/types";
import { formatStartsIn, partyModeLabel, titleCaseSlug } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import { Image } from "expo-image";
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { styled } from 'nativewind';
import { Text, TouchableOpacity, View } from 'react-native';

const LinearGradient = styled(RNLinearGradient);

const QuickDiscoverCard = ({ data }: { data: PartyDetail }) => {
  const isLive = data.status === "live";

  return (
    <Link
      href={{
        pathname: "/lobby/[slug]",
        params: { slug: String(data.id) },
      }}
      asChild
    >
      <TouchableOpacity
        activeOpacity={0.85}
        className='w-72 mr-4 overflow-hidden bg-[#1C1C26] rounded-3xl'
        onPress={() => posthog.capture('live_party_tapped', { party_id: data.id, party_title: data.title, is_live: isLive, mode: data.mode })}
        testID="live-party-card"
      >
        <View className='h-44 overflow-hidden'>
          {data.cover_image_url ? (
            <Image source={{ uri: data.cover_image_url }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <LinearGradient colors={data.gradient ?? ["#7A1EFF", "#D84CFF"]} className='flex-1' />
          )}
          <LinearGradient
            colors={["transparent", "rgba(13,13,18,0.60)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
          />
          <View className='absolute top-4 left-4 right-4 flex-row items-center justify-between'>
            <View className='rounded-full px-2.5 py-1.5 bg-background/70'>
              <Text className='text-white text-xs font-sans-bold uppercase tracking-wide'>
                {isLive ? "🔴 Live" : data.starts_at ? formatStartsIn(data.starts_at) : "Scheduled"}
              </Text>
            </View>
            <View className="rounded-full border border-white/10 bg-white/15 px-3 py-1">
              <Text className="text-xs font-sans-semibold uppercase tracking-wide text-white">
                {partyModeLabel(data.mode)}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-card p-4">
          <Text className="text-sm font-medium text-muted-foreground">
            {data.game_type ? titleCaseSlug(data.game_type.slug) : "Party"}
          </Text>

          <Text className="mt-0.5 text-base font-bold leading-5 text-foreground" numberOfLines={1}>
            {data.title}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
              Hosted by {data.host.display_name || data.host.username}
            </Text>

            <Text className="text-xs font-medium text-muted-foreground">
              {data.players_count}/{data.max_players}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

export default QuickDiscoverCard
