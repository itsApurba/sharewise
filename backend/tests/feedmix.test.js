const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { mixFeed } = require("../src/api/services/feed");
const { normalize, gradeQuiz } = require("../src/api/services/quiz");

const order = (feed) => feed.map((item) => item.ref);

describe("feed mixing rule", () => {
  it("matches the documented example", () => {
    const feed = mixFeed({ followed: ["F1", "F2", "F3"], discovery: ["D1", "D2"], reviews: ["R1", "R2"] });
    assert.deepEqual(order(feed), ["R1", "F1", "F2", "R2", "D1", "F3", "D2"]);
    assert.deepEqual(
      feed.map((item) => item.type),
      ["review", "lesson", "lesson", "review", "lesson", "lesson", "lesson"]
    );
  });

  it("falls back to discovery when following nobody", () => {
    assert.deepEqual(order(mixFeed({ followed: [], discovery: ["D1", "D2", "D3"], reviews: [] })), ["D1", "D2", "D3"]);
  });

  it("appends leftover reviews once lessons run out", () => {
    const feed = mixFeed({ followed: ["F1"], discovery: ["D1"], reviews: ["R1", "R2", "R3", "R4"] });
    assert.deepEqual(order(feed), ["R1", "F1", "D1", "R2", "R3", "R4"]);
  });

  it("appends leftover followed lessons once discovery runs out", () => {
    const feed = mixFeed({ followed: ["F1", "F2", "F3", "F4", "F5"], discovery: ["D1"], reviews: [] });
    assert.deepEqual(order(feed), ["F1", "F2", "D1", "F3", "F4", "F5"]);
  });

  it("is empty when everything is empty", () => {
    assert.deepEqual(mixFeed({ followed: [], discovery: [], reviews: [] }), []);
  });
});

describe("quiz grading", () => {
  it("normalizes free-text answers", () => {
    assert.equal(normalize("  Debounce!  "), "debounce");
    assert.equal(normalize("log   N."), "log n");
    assert.equal(gradeQuiz({ kind: "text", answer: "--force-with-lease" }, { answer: " --FORCE-with-lease " }), true);
    assert.equal(gradeQuiz({ kind: "text", answer: "Action" }, { answer: "Actions" }), false);
  });

  it("grades choices by index and rejects out-of-range ones", () => {
    const quiz = { kind: "choice", choices: ["a", "b"], correctIndex: 1 };
    assert.equal(gradeQuiz(quiz, { choice: 1 }), true);
    assert.equal(gradeQuiz(quiz, { choice: 0 }), false);
    assert.throws(() => gradeQuiz(quiz, { choice: 2 }), (err) => err.status === 400 && /choice/.test(err.fields.choice));
    assert.throws(() => gradeQuiz(quiz, { answer: "b" }), (err) => err.status === 400);
  });
});
