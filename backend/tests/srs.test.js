const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { newCard, schedule, isDue, isMastered } = require("../src/api/services/srs");

const at = (iso) => new Date(iso);
const days = (from, to) => (to.getTime() - from.getTime()) / 86400000;

describe("SM-2 scheduler", () => {
  it("schedules a new card for local midnight the next day", () => {
    const card = newCard(at("2026-03-10T15:30:00Z"), "UTC");
    assert.deepEqual(card, { ease: 2.5, interval: 1, repetitions: 0, lapses: 0, dueAt: at("2026-03-11T00:00:00Z"), lastReviewedAt: null });
  });

  it("uses the user's time zone for the due midnight", () => {
    // 23:30 UTC on the 10th is already 05:00 on the 11th in Kolkata (UTC+5:30).
    const card = newCard(at("2026-03-10T23:30:00Z"), "Asia/Kolkata");
    assert.equal(card.dueAt.toISOString(), "2026-03-11T18:30:00.000Z"); // midnight of the 12th, Kolkata
  });

  it("climbs 1, 3, 7, 30 days, then multiplies by ease", () => {
    let now = at("2026-01-01T12:00:00Z");
    let card = newCard(now, "UTC");
    const intervals = [card.interval];
    const eases = [card.ease];
    for (let i = 0; i < 5; i += 1) {
      now = card.dueAt;
      card = schedule(card, "got", now, "UTC");
      intervals.push(card.interval);
      eases.push(card.ease);
      assert.equal(days(now, card.dueAt), card.interval);
      assert.equal(card.lastReviewedAt, now);
    }
    assert.deepEqual(intervals, [1, 3, 7, 30, 84, 244]); // 30 * 2.8 = 84, 84 * 2.9 = 243.6
    assert.deepEqual(eases, [2.5, 2.6, 2.7, 2.8, 2.9, 3]);
    assert.equal(card.repetitions, 5);
  });

  it("caps ease at 3.0", () => {
    const card = schedule({ ease: 3, interval: 300, repetitions: 9, lapses: 0 }, "got", at("2026-01-01T00:00:00Z"), "UTC");
    assert.equal(card.ease, 3);
    assert.equal(card.interval, 900);
  });

  it("always grows the interval by at least a day", () => {
    const card = schedule({ ease: 1.3, interval: 2, repetitions: 5, lapses: 3 }, "got", at("2026-01-01T00:00:00Z"), "UTC");
    assert.equal(card.interval, 3); // round(2 * 1.3) = 3
    const tiny = schedule({ ease: 1.3, interval: 1, repetitions: 5, lapses: 3 }, "got", at("2026-01-01T00:00:00Z"), "UTC");
    assert.equal(tiny.interval, 2); // round(1 * 1.3) = 1, so interval + 1
  });

  it("resets on forgot and lowers ease, never below 1.3", () => {
    const now = at("2026-02-01T08:00:00Z");
    const card = schedule({ ease: 2.5, interval: 30, repetitions: 3, lapses: 0 }, "forgot", now, "UTC");
    assert.deepEqual(card, { ease: 2.3, interval: 1, repetitions: 0, lapses: 1, dueAt: at("2026-02-02T00:00:00Z"), lastReviewedAt: now });
    const floor = schedule({ ease: 1.4, interval: 1, repetitions: 0, lapses: 4 }, "forgot", now, "UTC");
    assert.equal(floor.ease, 1.3);
    assert.equal(floor.lapses, 5);
  });

  it("restarts the ladder after a lapse", () => {
    const now = at("2026-02-01T08:00:00Z");
    const lapsed = schedule({ ease: 2.5, interval: 30, repetitions: 3, lapses: 0 }, "forgot", now, "UTC");
    const next = schedule(lapsed, "got", lapsed.dueAt, "UTC");
    assert.equal(next.interval, 3);
    assert.equal(next.ease, 2.4);
  });

  it("rejects unknown grades", () => {
    assert.throws(() => schedule(newCard(new Date(), "UTC"), "maybe", new Date(), "UTC"), /Unknown grade/);
  });

  it("is due from dueAt on, and mastered at 21 days", () => {
    const card = { dueAt: at("2026-01-02T00:00:00Z"), interval: 21 };
    assert.equal(isDue(card, at("2026-01-01T23:59:59Z")), false);
    assert.equal(isDue(card, at("2026-01-02T00:00:00Z")), true);
    assert.equal(isMastered(card), true);
    assert.equal(isMastered({ interval: 20 }), false);
  });

  it("is deterministic", () => {
    const now = at("2026-05-05T05:05:05Z");
    assert.deepEqual(schedule(newCard(now, "Europe/Berlin"), "got", now, "Europe/Berlin"), schedule(newCard(now, "Europe/Berlin"), "got", now, "Europe/Berlin"));
  });
});
