import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";
import {
  useCancelParty,
  useHostedParties,
  useJoinedParties,
  myPartiesBucket,
} from "@/hooks/api/useParties";
import { useToast } from "@/hooks/useToast";
import { ApiError, PartyDetail, PartyMembershipStatus } from "@/lib/api/types";
import { formatRelativeTime, formatStartsIn, partyModeLabel, titleCaseSlug } from "@/lib/utils";
import { Image } from "expo-image";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Crown, Sparkles, Users, X } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

const LinearGradient = styled(RNLinearGradient);

type Bucket = "upcoming" | "past" | "canceled";

const TABS: { id: Bucket; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "canceled", label: "Canceled" },
];

interface MyPartyItem {
  key: string;
  party: PartyDetail;
  role: "hosted" | "joined";
  membershipStatus?: PartyMembershipStatus;
  leftAt?: string | null;
}

export default function MyPartiesView({ topInset }: { topInset: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<Bucket>("upcoming");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [pendingCancel, setPendingCancel] = useState<PartyDetail | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const hosted = useHostedParties();
  const joined = useJoinedParties();
  const cancelParty = useCancelParty();

  const items = useMemo<MyPartyItem[]>(() => {
    const hostedItems: MyPartyItem[] = hosted.parties.map((party) => ({
      key: `hosted-${party.id}`,
      party,
      role: "hosted",
    }));
    const joinedItems: MyPartyItem[] = joined.memberships.map((m) => ({
      key: `joined-${m.party.id}`,
      party: m.party,
      role: "joined",
      membershipStatus: m.membership_status,
      leftAt: m.left_at,
    }));
    return [...hostedItems, ...joinedItems];
  }, [hosted.parties, joined.memberships]);

  const visible = useMemo(() => {
    const filtered = items.filter(
      (item) => myPartiesBucket(item.party.status, item.membershipStatus) === tab,
    );
    const sortKey = (item: MyPartyItem) =>
      tab === "upcoming"
        ? (item.party.starts_at ?? item.party.created_at)
        : (item.leftAt ?? item.party.updated_at);
    return filtered.sort((a, b) => {
      const cmp = sortKey(a).localeCompare(sortKey(b));
      return tab === "upcoming" ? cmp : -cmp;
    });
  }, [items, tab]);

  const isLoading = hosted.isLoading || joined.isLoading;
  const isError = hosted.isError || joined.isError;
  const hasNextPage = Boolean(hosted.hasNextPage || joined.hasNextPage);
  const isFetchingNextPage = hosted.isFetchingNextPage || joined.isFetchingNextPage;

  const loadMore = () => {
    if (hosted.hasNextPage && !hosted.isFetchingNextPage) hosted.fetchNextPage();
    if (joined.hasNextPage && !joined.isFetchingNextPage) joined.fetchNextPage();
  };

  // Both sources page independently and the active bucket only shows a slice of whichever's
  // loaded so far — if that slice is empty but either source has more, keep paging instead of
  // telling the user there's nothing here.
  useEffect(() => {
    if (!isLoading && !isError && visible.length === 0 && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, hasNextPage, isFetchingNextPage, isLoading, isError]);

  const retry = () => {
    hosted.refetch();
    joined.refetch();
  };

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const confirmCancel = async () => {
    const party = pendingCancel;
    if (!party) return;
    setPendingCancel(null);
    setCancelingId(party.id);
    try {
      await cancelParty.mutateAsync(party.id);
      notify("Party canceled", "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't cancel — please try again", "error");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />

      <ConfirmDialog
        visible={pendingCancel !== null}
        title="Cancel this party?"
        message={
          pendingCancel
            ? `"${pendingCancel.title}" will be marked canceled — this can't be undone.`
            : ""
        }
        confirmLabel="Cancel party"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />

      <View className="flex-row gap-2 px-4 pb-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              activeOpacity={0.8}
              className={`h-8 flex-1 items-center justify-center rounded-full ${
                active ? "bg-white" : "bg-white/10 border border-white/10"
              }`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-ink" : "text-white/70"}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B03BFF" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-muted-foreground text-sm text-center">
            Couldn&apos;t load your parties.
          </Text>
          <TouchableOpacity onPress={retry} activeOpacity={0.8}>
            <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : visible.length === 0 && hasNextPage ? (
        // Still paging through hosted/joined looking for a match against the active bucket.
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B03BFF" />
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Sparkles color="#D84CFF" size={40} strokeWidth={2} />
          <Text className="mt-3 text-foreground text-xl font-bold text-center">
            {tab === "upcoming"
              ? "Nothing on the calendar"
              : tab === "past"
                ? "No past parties yet"
                : "Nothing canceled"}
          </Text>
          <Text className="mt-1 text-muted-foreground text-sm text-center">
            {tab === "upcoming"
              ? "Parties you host or join will show up here."
              : "They'll show up here once they happen."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) loadMore();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#B03BFF" style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => {
            const { party } = item;
            const canCancel =
              item.role === "hosted" &&
              (party.status === "draft" || party.status === "scheduled");

            return (
              <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <TouchableOpacity
                  onPress={() => router.push(`/lobby/${party.id}`)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${party.title}`}
                  className="flex-1 flex-row items-center gap-3"
                >
                  <View className="h-14 w-14 overflow-hidden rounded-xl">
                    {party.cover_image_url ? (
                      <Image
                        source={{ uri: party.cover_image_url }}
                        contentFit="cover"
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <LinearGradient
                        colors={party.gradient ?? ["#7A1EFF", "#D84CFF"]}
                        style={{ width: "100%", height: "100%" }}
                      />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-foreground text-sm font-semibold"
                      numberOfLines={1}
                    >
                      {party.title}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      {item.role === "hosted" ? (
                        <Crown color="#FFD166" size={12} strokeWidth={2} />
                      ) : (
                        <Users color="rgba(255,255,255,0.6)" size={12} strokeWidth={2} />
                      )}
                      <Text className="text-muted-foreground text-[11px]" numberOfLines={1}>
                        {item.role === "hosted" ? "Hosting" : "Joined"} ·{" "}
                        {party.game_type ? titleCaseSlug(party.game_type.slug) : partyModeLabel(party.mode)}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-muted-foreground text-[11px]">
                      {tab === "upcoming"
                        ? party.starts_at
                          ? formatStartsIn(party.starts_at)
                          : "No date set"
                        : formatRelativeTime(item.leftAt ?? party.updated_at)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {canCancel &&
                  (cancelingId === party.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setPendingCancel(party)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Cancel ${party.title}`}
                      className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                    >
                      <X color="rgba(255,255,255,0.7)" size={14} strokeWidth={2} />
                    </TouchableOpacity>
                  ))}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
