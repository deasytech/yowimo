import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/api/useNotifications";
import { NotificationResource } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function ItemSeparator() {
  return <View className="h-2" />;
}

/** Extracted out of the FlatList's ListEmptyComponent prop — was a 3-way nested ternary. */
function NotificationsEmptyState({
  isLoading,
  isError,
  error,
  onRetry,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}>) {
  if (isLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color="#B03BFF" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center gap-3 py-16">
        <Text className="text-center text-sm text-muted-foreground">
          Couldn&apos;t load notifications.
        </Text>
        <Text className="text-center text-xs text-muted-foreground/70">
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.85}>
          <Text className="text-xs font-sans-semibold text-violet-bright">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="items-center py-16">
      <Text className="text-3xl">🔔</Text>
      <Text className="mt-4 font-sans-semibold text-sm text-white">You&apos;re all caught up</Text>
      <Text className="mt-1 text-center text-xs text-muted-foreground">
        Nothing new right now — check back later.
      </Text>
    </View>
  );
}

// `type` is an opaque string, not an enum (the docs list these as the values seen so far, not
// an exhaustive set) — fall back to a generic bell for anything not in this map.
const TYPE_ICON: Record<string, string> = {
  "wallet.credited": "🪙",
  "wallet.debited": "💸",
  "party.started": "🎉",
  "party.member_joined": "👋",
  "party.member.left": "🚪",
  "game.completed": "🏆",
  "purchase.completed": "🛍️",
  "round.completed": "🔥",
  "friend.request.sent": "🤝",
  "friend.request.accepted": "🎊",
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const {
    notifications,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = notifications.some((n) => !n.read_at);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const onPressNotification = (item: NotificationResource) => {
    if (!item.read_at && !markRead.isPending) markRead.mutate(item.id);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B03BFF" />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListHeaderComponent={
          <View className="mt-16 mb-5 flex-row items-center justify-between">
            <Text className="text-foreground text-3xl font-bold tracking-tight">
              Notifications
            </Text>
            {hasUnread && (
              <TouchableOpacity
                onPress={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                activeOpacity={0.7}
              >
                <Text className="text-xs font-sans-semibold text-violet-bright">
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#B03BFF" />
            </View>
          ) : null
        }
        ItemSeparatorComponent={ItemSeparator}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressNotification(item)}
            className={`flex-row items-start gap-3 rounded-2xl border p-4 ${
              item.read_at
                ? "bg-white/5 border-white/10"
                : "bg-primary/10 border-primary/30"
            }`}
          >
            <Text className="text-2xl">{TYPE_ICON[item.type] ?? "🔔"}</Text>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium leading-snug">
                {item.title}
              </Text>
              <Text className="mt-0.5 text-muted-foreground text-xs leading-snug">
                {item.body}
              </Text>
              <Text className="mt-1 text-muted-foreground text-[11px]">
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>
            {!item.read_at && (
              <View className="mt-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <NotificationsEmptyState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
          />
        }
      />
    </SafeAreaView>
  );
}
