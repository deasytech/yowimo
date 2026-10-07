import dayjs from "dayjs";
import { Href, router } from "expo-router";

import { PartyMode, UserResource, WalletTransactionType } from "@/lib/api/types";

/** Floor for Android's bottom safe-area inset when computing clearance from the floating tab
 * bar (app/(tabs)/_layout.tsx) or a screen's own bottom padding (e.g. app/(tabs)/play.tsx).
 * useSafeAreaInsets().bottom has a known unresolved bug on some Android devices where it
 * reports 0 even though a real system gesture/nav bar is present — see
 * https://github.com/AppAndFlow/react-native-safe-area-context/issues/663. Used as a floor via
 * Math.max(insets.bottom, ANDROID_MIN_BOTTOM_INSET) so a device hitting that bug still gets real
 * clearance instead of silently falling back to whatever the broken 0 implies.
 *
 * Deliberately generous (not just a typical ~24dp gesture-nav height): the Play tab's "+" icon
 * floats 30px above the tab bar itself by design (PulsingPlusIcon's marginTop: -30, meant to
 * look like a floating action button), so clearing the tab bar alone isn't enough — this also
 * has to clear that icon's own footprint on top of it. */
export const ANDROID_MIN_BOTTOM_INSET = 64;

const WALLET_TRANSACTION_LABELS: Record<WalletTransactionType, string> = {
  top_up: "Top-up",
  purchase: "Purchase",
  refund: "Refund",
  bonus: "Bonus",
  adjustment: "Adjustment",
  reward: "Reward",
  party_entry: "Party entry",
};

export function walletTransactionTypeLabel(type: WalletTransactionType): string {
  return WALLET_TRANSACTION_LABELS[type] ?? type;
}

const PARTY_MODE_LABELS: Record<PartyMode, string> = {
  online: "Online",
  hybrid: "Hybrid",
  in_person: "In-person",
};

export function partyModeLabel(mode: PartyMode): string {
  return PARTY_MODE_LABELS[mode] ?? mode;
}

/** "two-truths" -> "Two Truths" — a reasonable display fallback when a game/pack's own
 * human-readable name isn't loaded, only its slug. */
export function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
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

// Groups the digits of an integer string with commas, e.g. "1234567" -> "1,234,567". Avoids the
// classic `\B(?=(\d{3})+(?!\d))` regex, whose nested quantifier is superlinear on long input.
function groupThousands(intPart: string): string {
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += ',';
    grouped += digits[i];
  }
  return (negative ? '-' : '') + grouped;
}

function formatFallback(num: number, currency: string) {
  if (Number.isNaN(num)) num = 0;
  const fractionDigits = currency?.toUpperCase() === 'NGN' ? 0 : 2;
  const raw = fractionDigits === 0 ? Math.round(num).toString() : num.toFixed(2);
  const [intPart, frac] = raw.split('.');
  const formatted = groupThousands(intPart) + (frac !== undefined ? `.${frac}` : '');

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

/** Forward-looking countdown for a future starts_at, e.g. "in 30m", "in 2h", "Sat 6:00 PM". */
export function formatStartsIn(iso: string): string {
  const date = dayjs(iso);
  const now = dayjs();
  const diffMins = date.diff(now, "minute");
  if (diffMins <= 0) return "Starting now";
  if (diffMins < 60) return `in ${diffMins}m`;
  const diffHours = date.diff(now, "hour");
  if (diffHours < 24) return `in ${diffHours}h`;
  const diffDays = date.diff(now, "day");
  if (diffDays < 7) return date.format("ddd h:mm A");
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

/** 999 -> "999", 1000 -> "1k+", 45900 -> "45k+", 2500000 -> "2m+". */
export function formatTokenAmount(value: number): string {
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}m+`;
  if (value >= 1_000) return `${Math.floor(value / 1_000)}k+`;
  return value.toLocaleString();
}

/** "Maya Rivera" -> "MR", "leop" -> "LE" — a display/host name, not a Clerk user object
 * (see getInitials below for that). Accepts null/undefined despite API types claiming
 * `username` is always a string — it isn't always true at runtime (nullable in the DB, never
 * backfilled for an account provisioned without one), so this is a real boundary, not padding. */
export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? "").slice(0, 2).toUpperCase() || "?";
}

/** Lightweight "looks like an email" check for sign-in/sign-up form validation — not full RFC
 * 5322 validation. Deliberately avoids a single regex like `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`: the
 * middle group's character class overlaps with the literal '.' that follows it, so a long pasted
 * string with many dots forces catastrophic backtracking (verified: a few thousand characters
 * hangs the JS thread for minutes). This does the same shape check with no backtracking. */
export function isValidEmailFormat(value: string): boolean {
  if (value.length > 254) return false;
  const at = value.indexOf("@");
  if (at <= 0 || value.indexOf("@", at + 1) !== -1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (/\s/.test(local) || /\s/.test(domain)) return false;
  const lastDot = domain.lastIndexOf(".");
  return lastDot > 0 && lastDot < domain.length - 1;
}

/** Gates access to the main app — a brand-new account (just provisioned from its Clerk claims)
 * has display_name pre-filled but date_of_birth/country_code/interests are always empty, so
 * this is really checking "has the user ever been through onboarding," not individual fields
 * going missing later (editing them blank afterward doesn't re-trigger this). */
export function isProfileSetupComplete(profile: Pick<UserResource, 'display_name' | 'date_of_birth' | 'country_code' | 'interests'>): boolean {
  return Boolean(
    profile.display_name?.trim() &&
    profile.date_of_birth &&
    profile.country_code &&
    (profile.interests?.length ?? 0) > 0,
  );
}

export const getInitials = (user: any) => {
  if (!user) return "U";
  const first = user.firstName ? user.firstName.charAt(0) : "";
  const last = user.lastName ? user.lastName.charAt(0) : "";
  const fallback = user.emailAddresses?.[0]?.emailAddress?.charAt(0) ?? "U";
  return `${first}${last}`.toUpperCase() || fallback.toUpperCase();
};