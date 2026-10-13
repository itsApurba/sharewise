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

function isValidTimeZone(timeZone) {
  if (typeof timeZone !== "string" || !timeZone) return false;
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

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

module.exports = { DAY_MS, isValidTimeZone, startOfLocalDay, localDayKey, shiftDayKey };
