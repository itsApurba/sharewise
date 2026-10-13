/**
 * The spaced-repetition scheduler: a binary-grade SM-2 variant. Pure functions of
 * (card, grade, now, timeZone), so the HTTP layer, the seed and the tests share it.
 * The rules are documented in backend/API.md ("Spaced repetition").
 */
const { startOfLocalDay } = require("../../lib/time");

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const EASE_STEP_GOT = 0.1;
const EASE_STEP_FORGOT = 0.2;
/** Interval in days after the 1st, 2nd and 3rd successful review in a row. */
const LADDER = [3, 7, 30];
const MASTERED_DAYS = 21;
const GRADES = ["got", "forgot"];

const round2 = (n) => Math.round(n * 100) / 100;

/** Local midnight `interval` days after `now`'s local day. */
const dueAfter = (now, interval, timeZone) => startOfLocalDay(now, timeZone, interval);

/** The scheduling fields for a lesson that was just remembered. */
function newCard(now, timeZone) {
  return { ease: INITIAL_EASE, interval: 1, repetitions: 0, lapses: 0, dueAt: dueAfter(now, 1, timeZone), lastReviewedAt: null };
}

/** The card's next scheduling fields after answering it with `grade` ("got" or "forgot"). */
function schedule(card, grade, now, timeZone) {
  if (!GRADES.includes(grade)) throw new Error(`Unknown grade ${grade}`);
  let { ease, interval, repetitions, lapses } = card;
  if (grade === "got") {
    repetitions += 1;
    interval = repetitions <= LADDER.length ? LADDER[repetitions - 1] : Math.max(interval + 1, Math.round(interval * ease));
    ease = round2(Math.min(MAX_EASE, ease + EASE_STEP_GOT));
  } else {
    repetitions = 0;
    interval = 1;
    lapses += 1;
    ease = round2(Math.max(MIN_EASE, ease - EASE_STEP_FORGOT));
  }
  return { ease, interval, repetitions, lapses, dueAt: dueAfter(now, interval, timeZone), lastReviewedAt: now };
}

const isDue = (card, now) => card.dueAt.getTime() <= now.getTime();
const isMastered = (card) => card.interval >= MASTERED_DAYS;

module.exports = { INITIAL_EASE, MIN_EASE, MAX_EASE, LADDER, MASTERED_DAYS, GRADES, newCard, schedule, isDue, isMastered };
