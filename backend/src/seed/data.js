/**
 * Demo content for `npm run seed`. Users are matched by email and lessons by
 * (author, title), so editing a lesson here and re-seeding updates it in place.
 * `ago` is how many days before the seed run the lesson was posted.
 */
const PASSWORD = "sharewise123";

// `active` lists the local days (0 = today, -1 = yesterday) on which the user answers every due card.
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const users = [
  {
    name: "Maya Chen",
    handle: "maya",
    email: "maya@sharewise.dev",
    bio: "Frontend engineer. I post the JavaScript I wish I had known sooner.",
    timezone: "America/New_York",
    follows: ["omar", "priya", "sam"],
    active: [...range(-21, -16), ...range(-14, -1)],
  },
  {
    name: "Omar Haddad",
    handle: "omar",
    email: "omar@sharewise.dev",
    bio: "Platform engineer. Git, tooling and the habits that keep teams shipping.",
    timezone: "Europe/Berlin",
    follows: ["maya", "lena"],
    active: [...range(-21, -12), ...range(-5, -1)],
  },
  {
    name: "Priya Nair",
    handle: "priya",
    email: "priya@sharewise.dev",
    bio: "Algorithms nerd. Interview prep one pattern at a time.",
    timezone: "Asia/Kolkata",
    follows: ["maya", "sam", "lena"],
    active: range(-21, -1),
  },
  {
    name: "Sam Okafor",
    handle: "sam",
    email: "sam@sharewise.dev",
    bio: "CSS is a programming language and I will die on this hill.",
    timezone: "UTC",
    follows: ["maya", "priya"],
    active: range(-9, -3),
  },
  {
    name: "Lena Vogel",
    handle: "lena",
    email: "lena@sharewise.dev",
    bio: "Engineering manager. Notes on careers, reviews and asking for help.",
    timezone: "America/Los_Angeles",
    follows: ["omar", "priya"],
    active: [...range(-12, -8), ...range(-3, -1)],
  },
];

const lessons = [
  // JavaScript (maya)
  {
    author: "maya",
    ago: 38,
    title: "Optional chaining stops at the first nullish link",
    body: "`a?.b?.c` returns undefined as soon as a link is null or undefined, instead of throwing a TypeError. It only guards against null and undefined, not other falsy values like 0 or ''. Pair it with ?? to supply a default.",
    code: { language: "js", source: 'const city = user?.address?.city ?? "Unknown";' },
    tags: ["js", "es2020"],
    quiz: { prompt: "What does `null?.name` evaluate to?", choices: ["null", "undefined", "It throws a TypeError"], correctIndex: 1 },
  },
  {
    author: "maya",
    ago: 35,
    title: "?? is not ||",
    body: "`||` falls back on any falsy value: 0, '', false, NaN. `??` falls back only on null or undefined, so a deliberate 0 or empty string survives. Use ?? for defaults of numbers and strings.",
    code: { language: "js", source: "const retries = options.retries ?? 3; // 0 stays 0\nconst label = options.label || \"Untitled\"; // '' becomes Untitled" },
    tags: ["js", "es2020"],
    quiz: { prompt: "What is the value of `0 ?? 5`?", answer: "0" },
  },
  {
    author: "maya",
    ago: 30,
    title: "Array.prototype.at() reads from the end",
    body: "`arr.at(-1)` is the last element; no more `arr[arr.length - 1]`. Negative indexes count back from the end, and it works on strings and typed arrays too.",
    code: { language: "js", source: '["a", "b", "c"].at(-1); // "c"\n"hello".at(-2); // "l"' },
    tags: ["js"],
  },
  {
    author: "maya",
    ago: 24,
    title: "structuredClone makes real deep copies",
    body: "JSON.parse(JSON.stringify(x)) silently turns Dates into strings and drops Maps, Sets and undefined. structuredClone keeps them and even handles circular references. It cannot clone functions or DOM nodes.",
    code: { language: "js", source: "const copy = structuredClone({ when: new Date(), tags: new Set([\"a\"]) });" },
    link: "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone",
    tags: ["js", "web-apis"],
    quiz: { prompt: "Which of these can structuredClone NOT copy?", choices: ["A Map", "A Date", "A function"], correctIndex: 2 },
  },
  {
    author: "maya",
    ago: 9,
    title: "Promise.allSettled never rejects",
    body: "Promise.all rejects as soon as one promise fails and you lose the other results. Promise.allSettled waits for all of them and gives each a { status, value } or { status, reason }, which suits independent requests where partial success is fine.",
    code: {
      language: "js",
      source: 'const results = await Promise.allSettled(urls.map((u) => fetch(u)));\nconst ok = results.filter((r) => r.status === "fulfilled");',
    },
    tags: ["js", "async"],
  },
  {
    author: "maya",
    ago: 2,
    title: "Debounce search inputs",
    body: "Debouncing runs a handler only after events stop for a while, so a search box sends one request when the user pauses instead of one per keystroke. Throttling is different: it runs at most once per interval while events keep coming.",
    code: {
      language: "js",
      source: "function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}",
    },
    tags: ["js", "performance"],
    quiz: { prompt: "Debounce or throttle: which one waits for a pause in events?", answer: "debounce" },
  },

  // CSS (sam)
  {
    author: "sam",
    ago: 37,
    title: "gap works in flexbox",
    body: "Stop adding margins to children and then undoing them on the last one. `gap` puts space only between flex items, never before the first or after the last, and it works in every current browser.",
    code: { language: "css", source: ".toolbar {\n  display: flex;\n  gap: 0.5rem;\n}" },
    tags: ["css", "flexbox"],
    quiz: { prompt: "Does `gap` add space before the first flex item?", choices: ["Yes", "No"], correctIndex: 1 },
  },
  {
    author: "sam",
    ago: 33,
    title: "clamp() gives fluid sizes with limits",
    body: "`clamp(min, preferred, max)` lets a size grow with the viewport but never below the minimum or above the maximum. One line of fluid type often replaces three media queries.",
    code: { language: "css", source: "h1 {\n  font-size: clamp(1.5rem, 4vw + 1rem, 3rem);\n}" },
    tags: ["css", "responsive"],
    quiz: { prompt: "How many values does clamp() take?", choices: ["2", "3", "4"], correctIndex: 1 },
  },
  {
    author: "sam",
    ago: 27,
    title: "Center anything with grid",
    body: "Two declarations center a child on both axes, whatever its size. place-items is shorthand for align-items plus justify-items.",
    code: { language: "css", source: ".center {\n  display: grid;\n  place-items: center;\n}" },
    tags: ["css", "grid"],
  },
  {
    author: "sam",
    ago: 20,
    title: "Mobile-first means min-width media queries",
    body: "Write the base styles for the smallest screen, then add layout for bigger screens with @media (min-width: …). Phones then parse only the styles they use, and you rarely need to undo anything.",
    code: { language: "css", source: ".cards { display: grid; gap: 1rem; }\n\n@media (min-width: 48rem) {\n  .cards { grid-template-columns: repeat(3, 1fr); }\n}" },
    tags: ["css", "responsive", "mobile"],
    quiz: { prompt: "Which media feature do mobile-first breakpoints use?", choices: ["max-width", "min-width"], correctIndex: 1 },
  },
  {
    author: "sam",
    ago: 4,
    title: "aspect-ratio stops layout shift",
    body: "Reserve an image's space before it loads with aspect-ratio (or width and height attributes). The page no longer jumps when the image arrives, which improves Cumulative Layout Shift.",
    code: { language: "css", source: "img.cover {\n  width: 100%;\n  aspect-ratio: 16 / 9;\n  object-fit: cover;\n}" },
    link: "https://web.dev/articles/cls",
    tags: ["css", "performance"],
  },

  // Git (omar)
  {
    author: "omar",
    ago: 36,
    title: "git switch and git restore split up checkout",
    body: "git checkout does two unrelated jobs. git switch changes branches (-c creates one) and git restore discards changes to files. The names say what they do, so you are less likely to throw work away by accident.",
    code: { language: "bash", source: "git switch -c feature/login   # new branch\ngit restore src/app.js        # drop local edits" },
    tags: ["git"],
    quiz: { prompt: "Which command discards uncommitted edits to a file?", choices: ["git switch <file>", "git restore <file>"], correctIndex: 1 },
  },
  {
    author: "omar",
    ago: 31,
    title: "Amend your last commit, not a shared one",
    body: "git commit --amend replaces the last commit, which is perfect for a typo or a forgotten file before you push. Once others have pulled the commit, amending rewrites history under them; add a new commit instead.",
    code: { language: "bash", source: "git add forgotten-file.js\ngit commit --amend --no-edit" },
    tags: ["git"],
  },
  {
    author: "omar",
    ago: 26,
    title: "Find the commit that broke it with git bisect",
    body: "Mark a known good and a known bad commit and git binary-searches the history between them. You test about log2(n) commits, so 1000 commits take around 10 steps. git bisect run automates it with a test script.",
    code: { language: "bash", source: "git bisect start\ngit bisect bad              # current commit is broken\ngit bisect good v1.4.0      # this tag worked\n# test, then: git bisect good | git bisect bad\ngit bisect reset" },
    tags: ["git", "debugging"],
    quiz: { prompt: "About how many steps does bisect need to search 1000 commits?", choices: ["10", "100", "500"], correctIndex: 0 },
  },
  {
    author: "omar",
    ago: 18,
    title: "Push with --force-with-lease, never plain --force",
    body: "After a rebase you have to force-push. --force-with-lease refuses if the remote branch moved since you last fetched, so you cannot silently erase a teammate's commits. --force overwrites whatever is there.",
    code: { language: "bash", source: "git push --force-with-lease" },
    tags: ["git"],
    quiz: { prompt: "Which flag is the safe alternative to `git push --force`?", answer: "--force-with-lease" },
  },
  {
    author: "omar",
    ago: 6,
    title: "git reflog is your undo history",
    body: "Lost commits after a bad reset or rebase are almost never gone. git reflog lists every place HEAD has pointed recently; find the entry before the mistake and branch from it.",
    code: { language: "bash", source: "git reflog\ngit switch -c rescue HEAD@{3}" },
    tags: ["git", "debugging"],
  },
  {
    author: "omar",
    ago: 1,
    title: "Ask for feedback on something specific",
    body: "\"Any feedback?\" gets \"looks good\". \"Was the rollback plan clear enough for whoever is on call?\" gets a real answer. Name the part you are unsure about and people can actually help.",
    tags: ["career", "communication"],
  },

  // DSA (priya)
  {
    author: "priya",
    ago: 39,
    title: "Two pointers on a sorted array",
    body: "To find a pair that sums to a target in a sorted array, start one pointer at each end. If the sum is too small move the left pointer right, if too big move the right pointer left. O(n) time and O(1) space instead of O(n²).",
    code: {
      language: "js",
      source: "function pairSum(nums, target) {\n  let i = 0, j = nums.length - 1;\n  while (i < j) {\n    const sum = nums[i] + nums[j];\n    if (sum === target) return [i, j];\n    sum < target ? i++ : j--;\n  }\n  return null;\n}",
    },
    tags: ["dsa", "arrays"],
    quiz: { prompt: "What is the time complexity of two-pointer pair sum on a sorted array?", choices: ["O(n)", "O(n log n)", "O(n²)"], correctIndex: 0 },
  },
  {
    author: "priya",
    ago: 34,
    title: "A hash map turns 'seen before?' into O(1)",
    body: "When a loop keeps asking whether you have seen a value, store values in a Set or Map as you go. Two-sum on unsorted input becomes one pass: before inserting x, check whether target - x is already there.",
    code: {
      language: "js",
      source: "function twoSum(nums, target) {\n  const seen = new Map();\n  for (const [i, x] of nums.entries()) {\n    if (seen.has(target - x)) return [seen.get(target - x), i];\n    seen.set(x, i);\n  }\n}",
    },
    tags: ["dsa", "hashing"],
  },
  {
    author: "priya",
    ago: 28,
    title: "Binary search works on answers, not just arrays",
    body: "Binary search halves the range each step, so it is O(log n). It works on any monotonic yes/no question: 'what is the smallest speed that finishes in time?' can be searched over speeds, because once a speed works every faster one does too.",
    tags: ["dsa", "binary-search"],
    quiz: { prompt: "What is the time complexity of binary search?", choices: ["O(n)", "O(log n)", "O(1)"], correctIndex: 1 },
  },
  {
    author: "priya",
    ago: 22,
    title: "BFS finds shortest paths in unweighted graphs",
    body: "Breadth-first search explores level by level with a queue, so the first time it reaches a node is along a shortest path (counted in edges). Once edges have different weights, switch to Dijkstra.",
    tags: ["dsa", "graphs"],
    quiz: { prompt: "Which data structure drives BFS?", choices: ["Stack", "Queue", "Heap"], correctIndex: 1 },
  },
  {
    author: "priya",
    ago: 3,
    title: "Sliding window for contiguous subarrays",
    body: "For 'longest or shortest contiguous subarray with property X', grow the window on the right and shrink it from the left while it is invalid. Every element enters and leaves the window once, so the whole scan is O(n).",
    code: {
      language: "js",
      source: "function longestUnique(s) {\n  const last = new Map();\n  let start = 0, best = 0;\n  for (let i = 0; i < s.length; i++) {\n    if (last.get(s[i]) >= start) start = last.get(s[i]) + 1;\n    last.set(s[i], i);\n    best = Math.max(best, i - start + 1);\n  }\n  return best;\n}",
    },
    tags: ["dsa", "arrays"],
  },

  // Career (lena)
  {
    author: "lena",
    ago: 32,
    title: "Write the PR description for your reviewer",
    body: "Say what changed, why, and how you tested it. Link the issue and point at the risky part. Your reviewer then spends their attention on the code instead of reverse-engineering your intent.",
    tags: ["career", "code-review"],
  },
  {
    author: "lena",
    ago: 25,
    title: "STAR keeps interview answers tight",
    body: "Situation, Task, Action, Result. Keep the setup short, spend most of the time on the Action (what you did, not the team), and finish with a result you can measure.",
    tags: ["career", "interviews"],
    quiz: { prompt: "In the STAR method, what does the A stand for?", answer: "Action" },
  },
  {
    author: "lena",
    ago: 14,
    title: "Keep a brag document",
    body: "Each Friday, note what you shipped, the incidents you handled and the people you helped. At review time you have evidence instead of a vague memory, and your manager can argue for you with specifics.",
    tags: ["career"],
  },
  {
    author: "lena",
    ago: 0,
    title: "Timebox being stuck",
    body: "Give a problem a fixed time, say 30 minutes. When it runs out, write down what you tried and what you expected, then ask. You save hours, and that write-up makes the question easy to answer.",
    tags: ["career", "communication"],
    quiz: {
      prompt: "When you ask for help after a timebox, what should you share?",
      choices: ["Just the error message", "What you tried and what you expected", "Nothing; wait a bit longer"],
      correctIndex: 1,
    },
  },
];

module.exports = { PASSWORD, users, lessons };
