import Avatar from "@/components/shared/Avatar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import GoBack from "@/components/shared/GoBack";
import Toast from "@/components/shared/Toast";
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useFriendRequests,
  useFriends,
  useRejectFriendRequest,
  useRemoveFriend,
} from "@/hooks/api/useFriends";
import { useProfile } from "@/hooks/api/useProfile";
import { useToast } from "@/hooks/useToast";
import { ApiError, FriendRequestResource, FriendResource } from "@/lib/api/types";
import { formatRelativeTime, initialsFromName } from "@/lib/utils";
import { Search } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type Tab = "All" | "Requests" | "Ranking";

type RankedEntry = {
  id: number;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  isYou: boolean;
  rank: number;
};

export default function FriendsListScreen() {
  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [pendingRemove, setPendingRemove] = useState<FriendResource | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();

  const removeFriend = useRemoveFriend();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();

  const friends = friendsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const incoming = requests.filter((r) => r.receiver.id === profile?.id);
  const sent = requests.filter((r) => r.sender.id === profile?.id);

  const query = q.trim().toLowerCase();
  const filteredFriends = friends.filter((f) =>
    !query ||
    (f.friend.username ?? "").toLowerCase().includes(query) ||
    (f.friend.display_name ?? "").toLowerCase().includes(query),
  );
  const filteredIncoming = incoming.filter(
    (r) =>
      !query ||
      (r.sender.username ?? "").toLowerCase().includes(query) ||
      (r.sender.display_name ?? "").toLowerCase().includes(query),
  );
  const filteredSent = sent.filter(
    (r) =>
      !query ||
      (r.receiver.username ?? "").toLowerCase().includes(query) ||
      (r.receiver.display_name ?? "").toLowerCase().includes(query),
  );

  // Friends-by-XP, viewer included — replaces the old global-stranger leaderboard with a
  // ranking that actually matches this app's social loop. Ranked against the full (unfiltered)
  // list first so rank numbers stay stable while searching, then filtered for display.
  const rankedEntries: RankedEntry[] = profile
    ? [
        {
          id: profile.id,
          name: profile.display_name || profile.username,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          xp: profile.xp,
          isYou: true,
        },
        ...friends.map((f) => ({
          id: f.friend.id,
          name: f.friend.display_name || f.friend.username || "Friend",
          username: f.friend.username,
          avatarUrl: f.friend.avatar_url,
          xp: f.friend.xp,
          isYou: false,
        })),
      ]
        .sort((a, b) => b.xp - a.xp)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
    : [];
  const filteredRanked = rankedEntries.filter(
    (r) =>
      !query ||
      (r.username ?? "").toLowerCase().includes(query) ||
      r.name.toLowerCase().includes(query),
  );

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const confirmRemove = async () => {
    const target = pendingRemove;
    if (!target || busyId !== null) return;
    setPendingRemove(null);
    setBusyId(target.friendship_id);
    try {
      await removeFriend.mutateAsync(target.friendship_id);
      notify("Friend removed", "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't remove friend", "error");
    } finally {
      setBusyId(null);
    }
  };

  const respondToRequest = async (
    request: FriendRequestResource,
    action: "accept" | "reject" | "cancel",
  ) => {
    if (busyId !== null) return;
    setBusyId(request.id);
    try {
      if (action === "accept") {
        await acceptRequest.mutateAsync(request.id);
        notify(`You're now friends with ${request.sender.username ?? "them"}`, "success");
      } else if (action === "reject") {
        await rejectRequest.mutateAsync(request.id);
        notify("Request declined", "success");
      } else {
        await cancelRequest.mutateAsync(request.id);
        notify("Request cancelled", "success");
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setBusyId(null);
    }
  };

  const activeQuery = tab === "Requests" ? requestsQuery : friendsQuery;
  // The Requests tab's incoming/sent split filters on profile?.id, and Ranking needs the
  // viewer's own xp to include "You" in the list — both fold profile's own loading/error into
  // this tab's gate too, so neither renders against a still-undefined profile.
  const needsProfile = tab === "Requests" || tab === "Ranking";
  const isActiveLoading = activeQuery.isLoading || (needsProfile && profileQuery.isLoading);
  const isActiveError = activeQuery.isError || (needsProfile && profileQuery.isError);
  const refetchActive = () => {
    activeQuery.refetch();
    if (needsProfile) profileQuery.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast opacity={toast.opacity} isVisible={toast.isVisible} message={toastMessage} bgClass={toastBg} />

      <ConfirmDialog
        visible={pendingRemove !== null}
        title="Remove this friend?"
        message={
          pendingRemove
            ? `You and ${pendingRemove.friend.display_name || pendingRemove.friend.username} will no longer be friends.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />

      <View className="px-5">
        <GoBack title="Friends" />
      </View>

      {/* ── Search ── */}
      <View className="px-5 mt-2 mb-4">
        <View className="relative justify-center">
          <View className="absolute left-4 z-10">
            <Search color="#a3a3ab" size={16} strokeWidth={2} />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search friends"
            placeholderTextColor="#a3a3ab"
            className="h-12 w-full rounded-2xl border border-border bg-secondary/60 pl-11 pr-4 text-foreground text-sm"
          />
        </View>
      </View>

      {/* ── Tabs ── */}
      <View className="flex-row gap-2 px-5">
        {(["All", "Requests", "Ranking"] as Tab[]).map((t) => {
          const active = tab === t;
          const badge = t === "Requests" ? incoming.length : 0;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              activeOpacity={0.85}
              className={`rounded-full px-4 py-2 flex-row items-center ${active ? "bg-primary" : "bg-secondary/60"
                }`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-muted-foreground"}`}>
                {t}
              </Text>
              {badge > 0 && (
                <View className="ml-1 rounded-full bg-orange px-1.5 py-0.5">
                  <Text className="text-white text-[10px] font-bold">{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {isActiveLoading && (
          <View className="items-center py-16">
            <ActivityIndicator color="#B03BFF" />
          </View>
        )}

        {!isActiveLoading && isActiveError && (
          <View className="items-center gap-3 py-16">
            <Text className="text-center text-sm text-muted-foreground">
              Couldn&apos;t load {tab === "Requests" ? "requests" : tab === "Ranking" ? "ranking" : "friends"}.
            </Text>
            <TouchableOpacity onPress={refetchActive} activeOpacity={0.85}>
              <Text className="text-xs font-sans-semibold text-violet-bright">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isActiveLoading && !isActiveError && tab === "All" && (
          filteredFriends.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-sm text-white/40">
                {query ? "No friends match your search." : "No friends yet."}
              </Text>
            </View>
          ) : (
            filteredFriends.map((f) => (
              <View key={f.friendship_id} className="flex-row items-center gap-3 rounded-2xl bg-card p-3">
                <Avatar
                  avatarUrl={f.friend.avatar_url}
                  initials={initialsFromName(f.friend.display_name || f.friend.username)}
                  size={44}
                />

                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                    {f.friend.display_name || f.friend.username}
                  </Text>
                  {f.friend.username && (
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      @{f.friend.username}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={busyId === f.friendship_id}
                  onPress={() => setPendingRemove(f)}
                  className="rounded-xl border border-border px-3 py-1.5"
                >
                  {busyId === f.friendship_id ? (
                    <ActivityIndicator color="#a3a3ab" size="small" />
                  ) : (
                    <Text className="text-muted-foreground text-xs font-semibold">Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )
        )}

        {!isActiveLoading && !isActiveError && tab === "Ranking" && (
          filteredRanked.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-sm text-white/40">No one matches your search.</Text>
            </View>
          ) : (
            filteredRanked.map((r) => (
              <View
                key={r.id}
                className={`flex-row items-center gap-3 rounded-2xl p-3 ${r.isYou ? "bg-violet/20 border border-violet-bright" : "bg-card"
                  }`}
              >
                <Text className="w-6 text-center text-muted-foreground text-base font-bold">
                  {r.rank}
                </Text>
                <Avatar avatarUrl={r.avatarUrl} initials={initialsFromName(r.name)} size={44} />
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                    {r.isYou ? "You" : r.name}
                  </Text>
                  {r.username && (
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      @{r.username}
                    </Text>
                  )}
                </View>
                <Text className="text-orange text-base font-bold">{r.xp.toLocaleString()} XP</Text>
              </View>
            ))
          )
        )}

        {!isActiveLoading && !isActiveError && tab === "Requests" && (
          <>
            <Text className="mb-1 text-[11px] font-sans-bold uppercase text-muted-foreground" style={{ letterSpacing: 0.8 }}>
              Incoming
            </Text>
            {filteredIncoming.length === 0 ? (
              <Text className="mb-4 text-sm text-white/40">No incoming requests.</Text>
            ) : (
              filteredIncoming.map((r) => (
                <View key={r.id} className="mb-2 flex-row items-center gap-3 rounded-2xl bg-card p-3">
                  <Avatar
                    avatarUrl={r.sender.avatar_url}
                    initials={initialsFromName(r.sender.display_name || r.sender.username)}
                    size={44}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {r.sender.display_name || (r.sender.username ? `@${r.sender.username}` : "Someone")}
                    </Text>
                    <Text className="text-muted-foreground text-[11px]">
                      {formatRelativeTime(r.created_at)}
                    </Text>
                  </View>
                  {busyId === r.id ? (
                    <ActivityIndicator color="#a3a3ab" size="small" />
                  ) : (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => respondToRequest(r, "reject")}
                        className="rounded-xl border border-border px-3 py-1.5"
                      >
                        <Text className="text-muted-foreground text-xs font-semibold">Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => respondToRequest(r, "accept")}
                        className="rounded-xl bg-primary px-3 py-1.5"
                      >
                        <Text className="text-white text-xs font-semibold">Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}

            <Text className="mb-1 mt-4 text-[11px] font-sans-bold uppercase text-muted-foreground" style={{ letterSpacing: 0.8 }}>
              Sent
            </Text>
            {filteredSent.length === 0 ? (
              <Text className="text-sm text-white/40">No pending sent requests.</Text>
            ) : (
              filteredSent.map((r) => (
                <View key={r.id} className="mb-2 flex-row items-center gap-3 rounded-2xl bg-card p-3">
                  <Avatar
                    avatarUrl={r.receiver.avatar_url}
                    initials={initialsFromName(r.receiver.display_name || r.receiver.username)}
                    size={44}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {r.receiver.display_name || (r.receiver.username ? `@${r.receiver.username}` : "Someone")}
                    </Text>
                    <Text className="text-muted-foreground text-[11px]">
                      {formatRelativeTime(r.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={busyId === r.id}
                    onPress={() => respondToRequest(r, "cancel")}
                    className="rounded-xl border border-border px-3 py-1.5"
                  >
                    {busyId === r.id ? (
                      <ActivityIndicator color="#a3a3ab" size="small" />
                    ) : (
                      <Text className="text-muted-foreground text-xs font-semibold">Cancel</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
