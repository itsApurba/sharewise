const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { canonicalTimeZone, isValidTimeZone, startOfLocalDay, localDayKey, shiftDayKey } = require("../src/lib/time");
const { streaks } = require("../src/api/services/stats");

describe("time zones", () => {
  it("validates IANA names", () => {
    assert.equal(isValidTimeZone("America/New_York"), true);
    assert.equal(isValidTimeZone("UTC"), true);
    assert.equal(isValidTimeZone("Mars/Base"), false);
    assert.equal(isValidTimeZone(""), false);
    assert.equal(isValidTimeZone(42), false);
    assert.equal(isValidTimeZone("+01:00"), false);
    assert.equal(isValidTimeZone("Asia/Kolkata"), true);
    assert.equal(isValidTimeZone("europe/berlin"), false);
  });

  it("canonicalizes IANA names and rejects offsets", () => {
    assert.equal(canonicalTimeZone("europe/berlin"), "Europe/Berlin");
    assert.equal(canonicalTimeZone("utc"), "UTC");
    assert.equal(canonicalTimeZone("Asia/Kolkata"), "Asia/Kolkata");
    assert.equal(canonicalTimeZone("asia/kolkata"), "Asia/Kolkata");
    assert.equal(canonicalTimeZone("Europe/Kyiv"), "Europe/Kyiv");
    assert.equal(canonicalTimeZone("america/argentina/buenos_aires"), "America/Argentina/Buenos_Aires");
    assert.equal(canonicalTimeZone("US/Eastern"), "US/Eastern");
    assert.equal(canonicalTimeZone("us/eastern"), null);
    assert.equal(canonicalTimeZone("+01:00"), null);
    assert.equal(canonicalTimeZone("-0500"), null);
    assert.equal(canonicalTimeZone("Mars/Base"), null);
  });

  it("finds local midnight and day keys", () => {
    const instant = new Date("2026-07-01T02:00:00Z"); // still June 30th in New York (UTC-4)
    assert.equal(localDayKey(instant, "America/New_York"), "2026-06-30");
    assert.equal(startOfLocalDay(instant, "America/New_York").toISOString(), "2026-06-30T04:00:00.000Z");
    assert.equal(startOfLocalDay(instant, "America/New_York", 1).toISOString(), "2026-07-01T04:00:00.000Z");
    assert.equal(localDayKey(instant, "Asia/Kolkata"), "2026-07-01");
  });

  it("handles days across a DST change", () => {
    // Berlin switches from UTC+1 to UTC+2 on 2026-03-29.
    const before = new Date("2026-03-28T12:00:00Z");
    assert.equal(startOfLocalDay(before, "Europe/Berlin").toISOString(), "2026-03-27T23:00:00.000Z");
    assert.equal(startOfLocalDay(before, "Europe/Berlin", 2).toISOString(), "2026-03-29T22:00:00.000Z");
  });

  it("shifts day keys across month ends", () => {
    assert.equal(shiftDayKey("2026-03-01", -1), "2026-02-28");
    assert.equal(shiftDayKey("2026-12-31", 1), "2027-01-01");
  });
});

describe("streaks", () => {
  it("counts back from today", () => {
    assert.deepEqual(streaks(["2026-01-03", "2026-01-04", "2026-01-05"], "2026-01-05"), { current: 3, best: 3 });
  });

  it("stays alive until today ends", () => {
    assert.deepEqual(streaks(["2026-01-03", "2026-01-04"], "2026-01-05"), { current: 2, best: 2 });
  });

  it("breaks after a missed day and keeps the best run", () => {
    assert.deepEqual(streaks(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-05"], "2026-01-07"), { current: 0, best: 3 });
    assert.deepEqual(streaks(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-06"], "2026-01-06"), { current: 1, best: 3 });
  });

  it("is zero without reviews", () => {
    assert.deepEqual(streaks([], "2026-01-01"), { current: 0, best: 0 });
  });
});
