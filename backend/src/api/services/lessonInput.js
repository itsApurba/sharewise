/**
 * Validates and normalizes lesson create/update bodies. Limits are documented in API.md.
 */
const { assertValid } = require("../../lib/errors");
const { str } = require("../../lib/validate");

const LIMITS = { title: [3, 120], body: [1, 2000], source: 2000, language: 20, link: 500, tags: 5, tag: 24, prompt: [3, 200], answer: 100 };
const TAG = /^[a-z0-9][a-z0-9+#.-]*$/;
const LANGUAGE = /^[a-z0-9+#.-]+$/;

const has = (body, key) => Object.prototype.hasOwnProperty.call(body, key);

function textField(fields, name, value, [min, max]) {
  const text = str(value);
  if (text === undefined) fields[name] = `${name} must be a string`;
  else if (text.length < min || text.length > max) fields[name] = `${name} must be ${min}-${max} characters`;
  return text;
}

function parseCode(fields, value) {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    fields.code = "code must be an object { language, source } or null";
    return undefined;
  }
  const source = typeof value.source === "string" ? value.source.replace(/\s+$/, "") : undefined;
  const language = value.language === undefined || value.language === null ? "text" : str(value.language)?.toLowerCase();
  if (!source) fields["code.source"] = "code.source must be a non-empty string";
  else if (source.length > LIMITS.source) fields["code.source"] = `code.source must be at most ${LIMITS.source} characters`;
  if (!language || language.length > LIMITS.language || !LANGUAGE.test(language)) {
    fields["code.language"] = "code.language must be a short lowercase name such as js or css";
  }
  return { language, source };
}

function parseLink(fields, value) {
  if (value === null || value === "") return null;
  const link = str(value);
  let ok = false;
  if (link && link.length <= LIMITS.link) {
    try {
      ok = ["http:", "https:"].includes(new URL(link).protocol);
    } catch {
      ok = false;
    }
  }
  if (!ok) fields.link = "link must be an http(s) URL of at most 500 characters";
  return link;
}

function parseTags(fields, value) {
  if (!Array.isArray(value) || !value.every((t) => typeof t === "string")) {
    fields.tags = "tags must be an array of strings";
    return undefined;
  }
  const tags = [...new Set(value.map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))];
  if (tags.length > LIMITS.tags) fields.tags = `At most ${LIMITS.tags} tags`;
  else if (tags.some((t) => t.length > LIMITS.tag || !TAG.test(t))) {
    fields.tags = `Each tag must be 1-${LIMITS.tag} characters: lowercase letters, digits, + # . or -`;
  }
  return tags;
}

function parseQuiz(fields, value) {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    fields.quiz = "quiz must be an object or null";
    return undefined;
  }
  const quiz = {};
  const prompt = str(value.prompt);
  if (!prompt || prompt.length < LIMITS.prompt[0] || prompt.length > LIMITS.prompt[1]) {
    fields["quiz.prompt"] = `quiz.prompt must be ${LIMITS.prompt[0]}-${LIMITS.prompt[1]} characters`;
  }
  quiz.prompt = prompt;
  const hasAnswer = value.answer !== undefined;
  const hasChoices = value.choices !== undefined;
  if (hasAnswer === hasChoices) {
    fields.quiz = "quiz needs either answer (free text) or choices with correctIndex, not both";
    return quiz;
  }
  if (hasAnswer) {
    const answer = str(value.answer);
    if (!answer || answer.length > LIMITS.answer) fields["quiz.answer"] = `quiz.answer must be 1-${LIMITS.answer} characters`;
    return { ...quiz, kind: "text", answer };
  }
  const choices = Array.isArray(value.choices) ? value.choices.map(str) : null;
  if (!choices || choices.length < 2 || choices.length > 4 || choices.some((c) => !c || c.length > LIMITS.answer)) {
    fields["quiz.choices"] = `quiz.choices must be 2-4 strings of 1-${LIMITS.answer} characters`;
  } else if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) {
    fields["quiz.choices"] = "quiz.choices must be distinct";
  }
  const correctIndex = value.correctIndex;
  if (!Number.isInteger(correctIndex) || !choices || correctIndex < 0 || correctIndex >= choices.length) {
    fields["quiz.correctIndex"] = "quiz.correctIndex must be the index of one of the choices";
  }
  return { ...quiz, kind: "choice", choices, correctIndex };
}

/**
 * Returns the normalized fields to store. With `partial`, only the keys present in
 * `body` are validated and returned (PATCH); otherwise title and body are required.
 */
function parseLessonInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) assertValid({ body: "Request body must be a JSON object" });
  const fields = {};
  const out = {};
  if (!partial || has(body, "title")) out.title = textField(fields, "title", body.title, LIMITS.title);
  if (!partial || has(body, "body")) out.body = textField(fields, "body", body.body, LIMITS.body);
  if (has(body, "code")) out.code = parseCode(fields, body.code);
  if (has(body, "link")) out.link = parseLink(fields, body.link);
  if (has(body, "tags")) out.tags = parseTags(fields, body.tags);
  if (has(body, "quiz")) out.quiz = parseQuiz(fields, body.quiz);
  if (partial && !Object.keys(out).length) fields.body = "Send at least one of title, body, code, link, tags, quiz";
  assertValid(fields);
  return out;
}

module.exports = { parseLessonInput, LIMITS };
