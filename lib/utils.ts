import dayjs from "dayjs";
import { Href, router } from "expo-router";

import { WalletTransactionType } from "@/lib/api/types";

const WALLET_TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  top_up: "Top-up",
  purchase: "Purchase",
  refund: "Refund",
  bonus: "Bonus",
  adjustment: "Adjustment",
  reward: "Reward",
};

export function walletTransactionTypeLabel(type: WalletTransactionType): string {
  return WALLET_TRANSACTION_LABELS[type] ?? type;
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD'
): string {
  try {
    const num = Number(value ?? 0);
    const curr = (currency ?? 'USD').toUpperCase();
    if (Number.isNaN(num)) return formatFallback(0, curr);

    const localeByCurrency: Record<string, string> = {
      USD: 'en-US',
      NGN: 'en-NG',
      EUR: 'en-IE',
      GBP: 'en-GB',
    };
    const locale = localeByCurrency[curr] ?? 'en-US';

    const fractionDigits = curr === 'NGN' ? 0 : 2;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  } catch (e) {
    return formatFallback(Number(value ?? 0), (currency ?? 'USD').toUpperCase());
  }
}

function formatFallback(num: number, currency: string) {
  if (Number.isNaN(num)) num = 0;
  const fractionDigits = currency?.toUpperCase() === 'NGN' ? 0 : 2;
  let formatted = fractionDigits === 0 ? Math.round(num).toString() : num.toFixed(2);
  // add thousand separators
  formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const symbols: Record<string, string> = {
    USD: '$',
    NGN: '₦',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency?.toUpperCase() ?? ''] ?? null;
  if (symbol) {
    return `${symbol}${formatted}`;
  }

  return `${currency} ${formatted}`;
}

export const navigateHome = (decorateUrl: (url: string) => string) => {
  const url = decorateUrl("/(tabs)");
  if (url.startsWith("http")) {
    if (typeof window !== "undefined" && window.location) {
      window.location.href = url;
    } else {
      router.replace("/(tabs)" as Href);
    }
  } else {
    router.replace(url as Href);
  }
};

/** Short relative time for a single row, e.g. "2h ago", "Yesterday", "May 27". */
export function formatRelativeTime(iso: string): string {
  const date = dayjs(iso);
  const now = dayjs();
  const diffMins = now.diff(date, "minute");
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = now.diff(date, "hour");
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = now.diff(date, "day");
  if (diffDays < 7) return diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;
  return date.format("MMM D");
}

/** Stable per-day bucket label for grouping a list, e.g. "Today", "Yesterday", "May 27". */
export function formatDayLabel(iso: string): string {
  const date = dayjs(iso);
  const now = dayjs();
  if (date.isSame(now, "day")) return "Today";
  if (date.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
  return date.format("MMM D");
}

export const getInitials = (user: any) => {
  if (!user) return "U";
  const first = user.firstName ? user.firstName.charAt(0) : "";
  const last = user.lastName ? user.lastName.charAt(0) : "";
  const fallback = user.emailAddresses?.[0]?.emailAddress?.charAt(0) ?? "U";
  return `${first}${last}`.toUpperCase() || fallback.toUpperCase();
};