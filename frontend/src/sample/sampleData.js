/*
 * Invented sample data for the placeholder screens. Nothing here comes from the API.
 * Each feature slice replaces its use of this file with real queries, then the file goes.
 */

export const SAMPLE_VIEWER = { name: "Sample Learner", handle: "sample-learner", streak: 6, bio: "Placeholder profile. Real profiles arrive with sign-up." };

const authors = {
  ada: { name: "Ada Example", handle: "ada-example", streak: 12 },
  lin: { name: "Lin Placeholder", handle: "lin-placeholder", streak: 3 },
  sam: { name: "Sam Sample", handle: "sam-sample", streak: 0 },
};

export const SAMPLE_LESSONS = [
  {
    id: "sample-1",
    title: "Array.prototype.at() reads from the end",
    body: "Negative indexes count back from the last element, so you no longer need arr[arr.length - 1].",
    code: "const last = [3, 1, 4].at(-1); // 4",
    tags: ["javascript", "arrays"],
    quiz: { question: "What does [3, 1, 4].at(-1) return?", choices: ["3", "4", "undefined"], answerIndex: 1 },
    author: authors.ada,
    createdLabel: "2h ago",
    rememberCount: 42,
  },
  {
    id: "sample-2",
    title: "The 2-minute rule",
    body: "If a task takes less than two minutes, do it now. Writing it down costs more than finishing it.",
    tags: ["productivity"],
    author: authors.lin,
    createdLabel: "5h ago",
    rememberCount: 17,
  },
  {
    id: "sample-3",
    title: "CSS: min-width: 0 fixes flex overflow",
    body: "Flex items default to min-width: auto, so long text or code refuses to shrink and pushes the page sideways. Set min-width: 0 on the item.",
    link: "https://developer.mozilla.org/docs/Web/CSS/min-width",
    tags: ["css", "layout"],
    quiz: { question: "Why does a flex item with long text overflow its container?", choices: ["Its min-width defaults to auto", "Flexbox ignores width", "The text has no font-size"], answerIndex: 0 },
    author: authors.sam,
    createdLabel: "yesterday",
    rememberCount: 8,
  },
  {
    id: "sample-4",
    title: "git switch - jumps back to the last branch",
    body: "Like cd -, the dash means the branch you were on before. Handy for hopping between a feature branch and main.",
    code: "git switch -",
    tags: ["git"],
    quiz: { question: "Which command returns you to the branch you were on before?", answer: "git switch -" },
    author: authors.lin,
    createdLabel: "2 days ago",
    rememberCount: 11,
  },
];

/** Reviews due today, covering each quiz shape and several review states, so every card variant is visible. */
export const SAMPLE_REVIEWS = [
  { lesson: SAMPLE_LESSONS[0], state: "due", stepLabel: "2nd review · after 3 days" },
  { lesson: SAMPLE_LESSONS[1], state: "forgot", stepLabel: "Forgot last time · back after 1 day" },
  { lesson: SAMPLE_LESSONS[2], state: "due", stepLabel: "1st review · after 1 day" },
  { lesson: SAMPLE_LESSONS[3], state: "mastered", stepLabel: "5th review · after 1 month" },
];

export const SAMPLE_STATS = {
  streak: 6,
  mastered: 14,
  dueToday: SAMPLE_REVIEWS.length,
  retention: "86%",
  topLessons: SAMPLE_LESSONS.map(({ id, title, author, rememberCount }) => ({ id, title, author, rememberCount })),
  topAuthors: [
    { ...authors.ada, taught: 128 },
    { ...authors.lin, taught: 64 },
    { ...authors.sam, taught: 23 },
  ],
};
