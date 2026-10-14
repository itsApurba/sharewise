/**
 * Validates and normalizes deck create/update bodies. Limits are documented in API.md.
 */
const { assertValid } = require("../../lib/errors");
const { str } = require("../../lib/validate");

const LIMITS = { title: [3, 60], description: 200, lessons: 50 };
const COLORS = ["ember", "honey", "sage", "clay", "plum", "ink"];
const DEFAULTS = { description: "", emoji: "📚", color: "ember" };

const graphemes = (text) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].length;

/** Returns the fields to save; on create, missing optional fields get their defaults. Throws a 400 listing every bad field. */
function parseDeckInput(body, { partial = false } = {}) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const fields = {};
  const out = {};

  if (input.title !== undefined || !partial) {
    const title = str(input.title);
    if (title === undefined) fields.title = "title must be a string";
    else if (title.length < LIMITS.title[0] || title.length > LIMITS.title[1]) fields.title = `title must be ${LIMITS.title.join("-")} characters`;
    else out.title = title;
  }
  if (input.description !== undefined && input.description !== null) {
    const description = str(input.description);
    if (description === undefined) fields.description = "description must be a string";
    else if (description.length > LIMITS.description) fields.description = `description must be at most ${LIMITS.description} characters`;
    else out.description = description;
  } else if (input.description === null) out.description = "";
  if (input.emoji !== undefined) {
    const emoji = str(input.emoji);
    if (!emoji || /\s/.test(emoji) || graphemes(emoji) !== 1 || emoji.length > 16) fields.emoji = "emoji must be a single emoji or character";
    else out.emoji = emoji;
  }
  if (input.color !== undefined && !COLORS.includes(input.color)) fields.color = `color must be one of ${COLORS.join(", ")}`;
  else if (input.color !== undefined) out.color = input.color;

  if (partial && !Object.keys(out).length && !Object.keys(fields).length) fields.body = "Send at least one of title, description, emoji, color";
  assertValid(fields);
  return partial ? out : { ...DEFAULTS, ...out };
}

module.exports = { parseDeckInput, COLORS, LIMITS };
