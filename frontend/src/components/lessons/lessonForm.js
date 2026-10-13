// Form state, validation and payloads for the lesson composer. Rules mirror backend/API.md "Lesson input".

export const LIMITS = { title: [3, 120], body: [1, 1000], code: 2000, link: 500, tags: 5, prompt: [3, 200], answer: 100 };

export const LANGUAGES = ["js", "ts", "jsx", "tsx", "python", "css", "html", "bash", "sql", "json", "go", "rust", "java", "c", "cpp", "text"];

const LANGUAGE_RE = /^[a-z0-9+#.-]{1,20}$/;
const TAG_RE = /^[a-z0-9][a-z0-9+#.-]{0,23}$/;
const LINK_RE = /^https?:\/\/[^\s]+$/i;

export const emptyForm = () => ({
  title: "",
  body: "",
  hasCode: false,
  language: "js",
  source: "",
  link: "",
  tags: "",
  hasQuiz: false,
  quizKind: "choice",
  prompt: "",
  answer: "",
  choices: ["", ""],
  correctIndex: 0,
});

/** Form state for editing an existing lesson (the author sees its quiz answer). */
export const formFromLesson = (lesson) => {
  const { quiz, code } = lesson;
  return {
    ...emptyForm(),
    title: lesson.title,
    body: lesson.body,
    hasCode: Boolean(code),
    language: code?.language ?? "js",
    source: code?.source ?? "",
    link: lesson.link ?? "",
    tags: lesson.tags.join(", "),
    hasQuiz: Boolean(quiz),
    quizKind: quiz?.kind ?? "choice",
    prompt: quiz?.prompt ?? "",
    answer: quiz?.kind === "text" ? (quiz.answer ?? "") : "",
    choices: quiz?.kind === "choice" ? [...quiz.choices] : ["", ""],
    correctIndex: quiz?.kind === "choice" ? (quiz.correctIndex ?? 0) : 0,
  };
};

/** "#JS, css  git" → ["js", "css", "git"], the way the server normalizes them. */
export const parseTags = (text) => {
  const tags = text
    .split(/[,\s]+/)
    .map((tag) => tag.trim().toLowerCase().replace(/^#+/, ""))
    .filter(Boolean);
  return [...new Set(tags)];
};

const between = (value, [min, max]) => value.length >= min && value.length <= max;

/** Field name → message, using the API's field names (`quiz.prompt`, `code.source`, ...). */
export const validate = (form) => {
  const errors = {};
  const title = form.title.trim();
  if (!between(title, LIMITS.title)) errors.title = `Give it a title of ${LIMITS.title[0]}-${LIMITS.title[1]} characters.`;
  const body = form.body.trim();
  if (!between(body, LIMITS.body)) errors.body = body ? `Keep the lesson under ${LIMITS.body[1]} characters.` : "Write the lesson itself.";

  if (form.hasCode) {
    const source = form.source.trimEnd();
    if (!source.trim()) errors["code.source"] = "Add the code, or turn the snippet off.";
    else if (source.length > LIMITS.code) errors["code.source"] = `Keep the snippet under ${LIMITS.code} characters.`;
    if (!LANGUAGE_RE.test(form.language)) errors["code.language"] = "Use a short lowercase language name, such as js.";
  }

  const link = form.link.trim();
  if (link && (!LINK_RE.test(link) || link.length > LIMITS.link)) errors.link = "Use a full http(s):// address.";

  const tags = parseTags(form.tags);
  if (tags.length > LIMITS.tags) errors.tags = `Up to ${LIMITS.tags} tags.`;
  else {
    const bad = tags.find((tag) => !TAG_RE.test(tag));
    if (bad) errors.tags = `“${bad}” is not a valid tag: use letters, digits, + # . - (up to 24).`;
  }

  if (form.hasQuiz) {
    if (!between(form.prompt.trim(), LIMITS.prompt)) errors["quiz.prompt"] = `Ask a question of ${LIMITS.prompt[0]}-${LIMITS.prompt[1]} characters.`;
    if (form.quizKind === "text") {
      const answer = form.answer.trim();
      if (!answer || answer.length > LIMITS.answer) errors["quiz.answer"] = `Give the answer (up to ${LIMITS.answer} characters).`;
    } else {
      const choices = form.choices.map((choice) => choice.trim());
      if (choices.some((choice) => !choice)) errors["quiz.choices"] = "Fill in every choice, or remove the empty one.";
      else if (choices.some((choice) => choice.length > LIMITS.answer)) errors["quiz.choices"] = `Keep each choice under ${LIMITS.answer} characters.`;
      else if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) errors["quiz.choices"] = "Each choice must be different.";
    }
  }
  return errors;
};

/** The API's lesson input for the whole form (`null` clears code, link and quiz). */
export const toPayload = (form) => {
  let quiz = null;
  if (form.hasQuiz) {
    quiz =
      form.quizKind === "text"
        ? { prompt: form.prompt.trim(), answer: form.answer.trim() }
        : { prompt: form.prompt.trim(), choices: form.choices.map((c) => c.trim()), correctIndex: form.correctIndex };
  }
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    code: form.hasCode ? { language: form.language, source: form.source.trimEnd() } : null,
    link: form.link.trim() || null,
    tags: parseTags(form.tags),
    quiz,
  };
};

/** Only the fields that differ from `before`, for PATCH (so an untouched quiz keeps its answers). */
export const changedFields = (before, after) =>
  Object.fromEntries(Object.entries(after).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key])));

/** A lesson-shaped object for the live preview card. */
export const previewLesson = (form, author) => {
  const payload = toPayload(form);
  return {
    ...payload,
    title: payload.title || "Your title",
    body: payload.body || "Your lesson appears here.",
    quiz: payload.quiz && { ...payload.quiz, kind: form.quizKind },
    code: payload.code?.source.trim() ? payload.code : null,
    tags: payload.tags.slice(0, LIMITS.tags),
    author,
    createdLabel: "just now",
  };
};
