/**
 * Calendar-day helpers in an IANA time zone. Reviews come due at local midnight
 * and streaks count local days, so both depend on the user's `timezone`.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

const formatters = new Map();
function formatter(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }
  return formatters.get(timeZone);
}

/** Current IANA names that Node 22's ICU only lists under a legacy alias (Asia/Kolkata as Asia/Calcutta). */
const MODERN_ZONES = [
  "Africa/Asmara",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Catamarca",
  "America/Argentina/Cordoba",
  "America/Argentina/Jujuy",
  "America/Argentina/Mendoza",
  "America/Atikokan",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
  "America/Nuuk",
  "Asia/Dhaka",
  "Asia/Ho_Chi_Minh",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Thimphu",
  "Asia/Yangon",
  "Atlantic/Faroe",
  "Europe/Kyiv",
  "Pacific/Chuuk",
  "Pacific/Kanton",
  "Pacific/Pohnpei",
];
const knownZones = new Map([...Intl.supportedValuesOf("timeZone"), ...MODERN_ZONES, "UTC"].map((name) => [name.toLowerCase(), name]));

/**
 * The exact IANA name matching `timeZone` ignoring case ("europe/berlin" -> "Europe/Berlin"), or null for
 * offsets and unknown zones. MongoDB matches zone names case-sensitively, so only listed spellings are stored.
 */
const canonicalTimeZone = (timeZone) => (typeof timeZone === "string" && knownZones.get(timeZone.toLowerCase())) || null;

const isValidTimeZone = (timeZone) => canonicalTimeZone(timeZone) === timeZone;

/** The local calendar fields of `date` in `timeZone`. */
function localParts(date, timeZone) {
  const parts = {};
  for (const { type, value } of formatter(timeZone).formatToParts(date)) parts[type] = Number(value);
  return parts;
}

/** Milliseconds the zone is ahead of UTC at `date`. */
function offsetAt(date, timeZone) {
  const p = localParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant of local midnight on the given local calendar day (month is 1-based; day may overflow). */
function zonedMidnight(year, month, day, timeZone) {
  const wall = Date.UTC(year, month - 1, day);
  // Two passes settle the offset when midnight sits near a DST change.
  let instant = wall - offsetAt(new Date(wall), timeZone);
  instant = wall - offsetAt(new Date(instant), timeZone);
  return new Date(instant);
}

/** Local midnight `days` calendar days after the local day containing `date`. */
function startOfLocalDay(date, timeZone, days = 0) {
  const p = localParts(date, timeZone);
  return zonedMidnight(p.year, p.month, p.day + days, timeZone);
}

/** "YYYY-MM-DD" for the local day containing `date`. */
function localDayKey(date, timeZone) {
  const p = localParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** The day key `days` calendar days after `key`. */
function shiftDayKey(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

module.exports = { DAY_MS, canonicalTimeZone, isValidTimeZone, startOfLocalDay, localDayKey, shiftDayKey };
