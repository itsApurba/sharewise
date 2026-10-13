/**
 * Server-side quiz grading. Free-text answers match after normalization: case,
 * surrounding whitespace, repeated inner whitespace and trailing . ! ? are ignored.
 */
const { badRequest } = require("../../lib/errors");

const normalize = (text) => text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim();

/** The quiz's answer as shown once the viewer has answered. */
function revealAnswer(quiz) {
  return quiz.kind === "choice" ? { correctIndex: quiz.correctIndex, answer: quiz.choices[quiz.correctIndex] } : { answer: quiz.answer };
}

/**
 * Grades `{ choice }` (choice quizzes) or `{ answer }` (text quizzes). Returns whether
 * it was correct; throws a 400 when the body does not match the quiz kind.
 */
function gradeQuiz(quiz, body) {
  if (quiz.kind === "choice") {
    const { choice } = body;
    if (!Number.isInteger(choice) || choice < 0 || choice >= quiz.choices.length) {
      throw badRequest("Validation failed", { choice: `choice must be an integer from 0 to ${quiz.choices.length - 1}` });
    }
    return choice === quiz.correctIndex;
  }
  if (typeof body.answer !== "string" || !body.answer.trim()) {
    throw badRequest("Validation failed", { answer: "answer must be a non-empty string" });
  }
  return normalize(body.answer) === normalize(quiz.answer);
}

module.exports = { gradeQuiz, revealAnswer, normalize };
