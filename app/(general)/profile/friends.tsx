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

type Tab = "All" | "Requests";

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
    (r) => !query || (r.sender.username ?? "").toLowerCase().includes(query),
  );
  const filteredSent = sent.filter(
    (r) => !query || (r.receiver.username ?? "").toLowerCase().includes(query),
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

  const activeQuery = tab === "All" ? friendsQuery : requestsQuery;
  // The Requests tab's incoming/sent split filters on profile?.id — if requests resolve before
  // the profile query does, both filters compare against undefined and everything looks empty
  // even though requests exist. Fold profile's own loading/error into this tab's gate too.
  const isActiveLoading = activeQuery.isLoading || (tab === "Requests" && profileQuery.isLoading);
  const isActiveError = activeQuery.isError || (tab === "Requests" && profileQuery.isError);
  const refetchActive = () => {
    activeQuery.refetch();
    if (tab === "Requests") profileQuery.refetch();
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
        {(["All", "Requests"] as Tab[]).map((t) => {
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
              Couldn&apos;t load {tab === "All" ? "friends" : "requests"}.
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
                  <Avatar initials={initialsFromName(r.sender.username)} size={44} />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {r.sender.username ? `@${r.sender.username}` : "Someone"}
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
                  <Avatar initials={initialsFromName(r.receiver.username)} size={44} />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {r.receiver.username ? `@${r.receiver.username}` : "Someone"}
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
