import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Heart, MessageCircle, Plus, Share2, Users } from 'lucide-react-native';
import { styled } from 'nativewind';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const LinearGradient = styled(RNLinearGradient);

const PartyCard = ({
  party,
  height,
  statusTop,
  active,
  liked,
  onLike,
}: {
  party: PartyProps;
  height: number;
  statusTop: number;
  active: boolean;
  liked: boolean;
  onLike: () => void;
}) => {
  const compact = height > 0 && height < 720;

  return (
    <View style={{ height: height || "100%", width: "100%" }} className="relative overflow-hidden">
      {/* Background gradient + image */}
      <LinearGradient
        colors={party.cover ?? ["#7A1EFF", "#D84CFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {party.image && (
        <Image
          source={party.image}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      )}

      {/* Ambient glow blobs — only on the active card */}
      {active && (
        <>
          <View
            className="absolute rounded-full bg-white/10"
            style={{ top: -64, left: -64, width: 288, height: 288 }}
          />
          <View
            className="absolute rounded-full bg-magenta/30"
            style={{ bottom: 96, right: -80, width: 320, height: 320 }}
          />
        </>
      )}

      {/* Bottom scrim */}
      <LinearGradient
        colors={["transparent", "rgba(16,16,21,0.70)", "#101015"]}
        className="absolute inset-x-0 bottom-0"
        style={{ height: "66%" }}
      />
      {/* Top scrim */}
      <LinearGradient
        colors={["rgba(16,16,21,0.60)", "transparent"]}
        className="absolute inset-x-0 top-0"
        style={{ height: 160 }}
      />

      {/* ── Live badge / sponsored ── */}
      <View
        className="absolute left-4 right-4 z-10 flex-row flex-wrap items-center gap-2"
        style={{ top: Math.max(statusTop, compact ? 132 : 148) }}
      >
        {party.isLive ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1">
            <View className="h-1.5 w-1.5 rounded-full bg-white" />
            <Text
              className="text-white text-[10px] font-bold uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Live · {party.players}
            </Text>
          </View>
        ) : (
          <View className="rounded-full bg-ink/80 px-2.5 py-1">
            <Text className="text-white text-[10px] font-semibold">
              {party.startsIn}
            </Text>
          </View>
        )}

        {party.sponsored && (
          <LinearGradient
            colors={["#FFD66B", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-full px-2.5 py-1"
          >
            <Text className="text-ink text-[10px] font-bold">
              ⭐ {party.sponsored}
            </Text>
          </LinearGradient>
        )}

        <View className="rounded-full bg-white/15 px-2.5 py-1">
          <Text className="text-white text-[10px] font-semibold">{party.mode}</Text>
        </View>
      </View>

      {/* ── Right-side action rail ── */}
      <View
        className="absolute right-3 z-20 items-center"
        style={{ bottom: compact ? 164 : 176, gap: compact ? 12 : 20 }}
      >
        <TouchableOpacity onPress={onLike} activeOpacity={0.85} className="items-center">
          <View
            className={`${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-full ${liked ? "bg-red-500/90" : "bg-white/15"
              }`}
          >
            <Heart
              color="#fff"
              fill={liked ? "#fff" : "transparent"}
              size={compact ? 21 : 24}
              strokeWidth={2}
            />
          </View>
          <Text className="mt-1 text-white text-[11px] font-semibold">
            {(party.players * 13 + (liked ? 1 : 0)).toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} className="items-center">
          <View className={`${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-full bg-white/15`}>
            <MessageCircle color="#fff" size={compact ? 21 : 24} strokeWidth={2} />
          </View>
          <Text className="mt-1 text-white text-[11px] font-semibold">
            {party.players * 3}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} className="items-center">
          <View className={`${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-full bg-white/15`}>
            <Share2 color="#fff" size={compact ? 21 : 24} strokeWidth={2} />
          </View>
          <Text className="mt-1 text-white text-[11px] font-semibold">Share</Text>
        </TouchableOpacity>

        <View className="relative">
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-full`}
            style={{ borderWidth: 2, borderColor: "#fff" }}
          >
            <Text className="text-white text-sm font-bold">{party.hostAvatar}</Text>
          </LinearGradient>
          <TouchableOpacity
            activeOpacity={0.85}
            className="absolute h-5 w-5 items-center justify-center rounded-full bg-orange"
            style={{ bottom: -4, left: "50%", marginLeft: -10 }}
          >
            <Plus color="#fff" size={12} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom content ── */}
      <View
        className="absolute inset-x-0 z-10 px-5"
        style={{ bottom: compact ? 96 : 112, paddingRight: compact ? 68 : 80 }}
      >
        <Text
          className="text-magenta text-xs font-bold uppercase"
          style={{ letterSpacing: 2 }}
        >
          {party.type}
        </Text>
        <Text
          className={`${compact ? "mt-1 text-xl" : "mt-1.5 text-2xl"} text-white font-extrabold leading-tight`}
          numberOfLines={2}
        >
          {party.title}
        </Text>
        <Text className="mt-1.5 text-white/80 text-sm">
          Hosted by <Text className="text-white font-semibold">{party.host}</Text>
        </Text>

        <View className={`${compact ? "mt-2" : "mt-3"} flex-row flex-wrap gap-1.5`}>
          {party.tags.map((t) => (
            <View key={t} className="rounded-full bg-white/15 px-2.5 py-1">
              <Text className="text-white text-[11px] font-semibold">
                #{t.toLowerCase().replace(/\s+/g, "")}
              </Text>
            </View>
          ))}
        </View>

        <View className={`${compact ? "mt-3" : "mt-4"} flex-row items-center gap-3`}>
          <Link href={`/lobby/${party.id}`} asChild>
            <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }}>
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`rounded-2xl ${compact ? "py-3" : "py-3.5"} items-center`}
              >
                <Text className="text-white text-sm font-bold">
                  {party.isLive ? "Jump in" : "Join party"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          <View className="flex-row items-center gap-1.5 rounded-2xl bg-white/10 border border-white/10 px-3 py-3">
            <Users color="#fff" size={16} strokeWidth={2} />
            <Text className="text-white text-xs font-semibold">
              {party.players}/{party.maxPlayers}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PartyCard
