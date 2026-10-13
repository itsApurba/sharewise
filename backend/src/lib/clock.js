/**
 * The single source of "now" for scheduling, feeds and stats, so tests (and the
 * seed) can pin time. Production code calls `now()`; tests call `set()`/`reset()`.
 */
let fixed = null;

module.exports = {
  now: () => (fixed ? new Date(fixed) : new Date()),
  set: (date) => {
    fixed = new Date(date).getTime();
  },
  reset: () => {
    fixed = null;
  },
};
