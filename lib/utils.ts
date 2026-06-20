import { Href, router } from "expo-router";

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

export const getInitials = (user: any) => {
  if (!user) return "";
  const first = user.firstName ? user.firstName.charAt(0) : "";
  const last = user.lastName ? user.lastName.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};