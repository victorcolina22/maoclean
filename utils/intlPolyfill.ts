// Hermes exposes constructors like Intl.DateTimeFormat/Intl.PluralRules as
// "present" but with broken/incomplete underlying data (e.g. named timezone
// offsets always resolve to UTC). The regular /polyfill.js entry points do
// feature-detection (shouldPolyfill) and skip replacing anything Hermes
// already "has" — which is exactly what's broken here. Use the /polyfill-force
// variants (FormatJS's documented recommendation for React Native/Hermes) so
// they always take effect regardless of what Hermes claims to support.
//
// These are bare side-effect imports, not function calls, so there's nothing
// to guard against re-entrancy: the module registry only evaluates a module's
// top-level code once per process (Metro doesn't clear it on Fast Refresh
// unless this exact file changes, and this file has no React component to
// trigger that).
import "@formatjs/intl-getcanonicallocales/polyfill-force";
import "@formatjs/intl-locale/polyfill-force";
import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-pluralrules/locale-data/en";
import "@formatjs/intl-pluralrules/locale-data/es";
import "@formatjs/intl-numberformat/polyfill-force";
import "@formatjs/intl-numberformat/locale-data/en";
import "@formatjs/intl-numberformat/locale-data/es";
import "@formatjs/intl-numberformat/locale-data/es-CL";
import "@formatjs/intl-datetimeformat/polyfill-force";
import "@formatjs/intl-datetimeformat/locale-data/en";
import "@formatjs/intl-datetimeformat/add-all-tz";

// dayjs's `.tz()` INSTANCE method (dayjs(date).tz(zone), used all over the
// calendar code) doesn't call Intl.DateTimeFormat at all — it calls the
// native Date.prototype.toLocaleString(locale, {timeZone}) and diffs the
// result. Hermes's native toLocaleString ignores/mishandles the `timeZone`
// option, so it's still broken even though Intl.DateTimeFormat itself now
// works. Patch toLocaleString to delegate to the (working) polyfilled
// Intl.DateTimeFormat — but ONLY for the exact "en-US" + sole-timeZone-option
// shape dayjs's plugin actually calls (see node_modules/dayjs/plugin/timezone.js:
// `a.toLocaleString("en-US",{timeZone:t})`). Any other caller passing extra
// display options (weekday, month:'long', a different locale, etc.) alongside
// timeZone falls through to the native implementation untouched, so this
// doesn't silently corrupt unrelated toLocaleString usage elsewhere in the
// app or in third-party libraries.
const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    zonedFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function isDayjsTzShape(
  locales: string | string[] | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
): options is { timeZone: string } {
  return (
    (locales === undefined || locales === "en-US") &&
    !!options?.timeZone &&
    Object.keys(options).length === 1
  );
}

if (!(Date.prototype as unknown as { __tzPatched?: boolean }).__tzPatched) {
  const nativeToLocaleString = Date.prototype.toLocaleString;
  Date.prototype.toLocaleString = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
  ) {
    if (isDayjsTzShape(locales, options)) {
      // Don't hand dayjs a locale-formatted string ("7/16/2026, 8:07:00 PM")
      // — Hermes's native `new Date(string)` parser only reliably supports
      // ISO 8601. Build a zone-less "YYYY-MM-DDTHH:mm:ss" string by hand from
      // formatToParts() so `new Date(u)` / dayjs(u) parse it deterministically
      // as local time (the spec-mandated behavior for that exact shape).
      const parts = getZonedFormatter(options.timeZone).formatToParts(this);
      const get = (type: string): string => {
        const part = parts.find((p) => p.type === type);
        if (!part) {
          throw new Error(
            `[intlPolyfill] Intl.DateTimeFormat.formatToParts() didn't return a "${type}" part for timeZone "${options.timeZone}" — the polyfill's timezone data may be incomplete.`,
          );
        }
        return part.value;
      };
      const hour = get("hour") === "24" ? "00" : get("hour");
      return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}`;
    }
    return nativeToLocaleString.call(this, locales, options);
  };
  (Date.prototype as unknown as { __tzPatched: boolean }).__tzPatched = true;
}
