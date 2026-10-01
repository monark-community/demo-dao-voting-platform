import { intlLocale, type Locale } from "@/i18n/config"

export function fmtNumber(locale: Locale, n: number, maxFraction = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: maxFraction }).format(n)
}

/** "73.7%" / "73,7 %" from a 0–1 share. */
export function fmtPct(locale: Locale, share: number, digits = 1): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(share)
}

/** Percentage number only (no sign), e.g. 68 or 68,4. */
export function fmtPctNumber(locale: Locale, share: number, digits = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(share * 100)
}

export function fmtDate(locale: Locale, at: number, withTime = false): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(at)
}

/** "in 2 days", "3 hours ago", localized. */
export function fmtRelative(locale: Locale, at: number, now: number): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto" })
  const diff = at - now
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (abs < minute) return rtf.format(0, "second")
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute")
  if (abs < 2 * day) return rtf.format(Math.round(diff / hour), "hour")
  if (abs < 30 * day) return rtf.format(Math.round(diff / day), "day")
  return rtf.format(Math.round(diff / (30 * day)), "month")
}

/** "Amara and Julien", "Amara, Julien et Priya". */
export function fmtList(locale: Locale, items: string[]): string {
  return new Intl.ListFormat(intlLocale[locale], { type: "conjunction" }).format(items)
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
