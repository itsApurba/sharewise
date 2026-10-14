import { Box, Button, HStack, Heading, Icon, Input, Skeleton, SkeletonText, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { LuArrowRight, LuCalendarClock, LuCheck, LuEye, LuRotateCcw } from "react-icons/lu";
import { Link } from "react-router-dom";
import { errorMessage } from "../../api/client";
import { nextReviewSentence } from "../../lib/format";
import { AuthorLine, CodeSnippet } from "./LessonCard";
import QuizChoices from "./QuizChoices";
import ReviewStateBadge from "./ReviewStateBadge";
import Surface from "./Surface";

const stateOf = (outcome) => {
  if (!outcome) return "due";
  if (outcome.result.grade === "forgot") return "forgot";
  return outcome.review.mastered ? "mastered" : "gotIt";
};

/**
 * A saved lesson coming back for review (an API Review with its lesson).
 * A choice quiz is answered by picking, a text quiz by typing, and a lesson without a quiz
 * by revealing it and grading "Got it" or "Forgot". Every answer goes to `onAnswer(body)`,
 * which resolves to the API's `{ review, result }`; the card then reveals the lesson, the
 * right answer and when it comes back (dated in `timeZone`, the user's zone). `onContinue`
 * adds a button after the result. `shortcuts` turns on keys for a focused session:
 * Space shows the lesson, F / G grade forgot / got it, A-D pick a choice, Enter continues.
 */
const ReviewCard = ({ review, stepLabel, onAnswer, onContinue, continueLabel = "Next", timeZone, shortcuts = false }) => {
  const { lesson } = review;
  const { title, body, code, quiz, author } = lesson;
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const state = stateOf(outcome);
  const answered = outcome !== null;

  const submit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      setOutcome(await onAnswer(payload));
      setRevealed(true);
    } catch (err) {
      setPicked(null);
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const pick = (index) => {
    setPicked(index);
    submit({ choice: index });
  };

  const checkTyped = (event) => {
    event.preventDefault();
    if (typed.trim()) submit({ answer: typed.trim() });
  };

  const correctAnswer = outcome?.result.correctAnswer;

  // The latest handlers for the key listener, so it is attached once per card.
  const keys = useRef(null);
  useEffect(() => {
    keys.current = (event) => {
      if (event.target.closest?.("input, textarea, select, [contenteditable=true]") || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (answered) {
        if (key === "enter" && onContinue) {
          event.preventDefault();
          onContinue();
        }
        return;
      }
      if (submitting) return;
      if (quiz?.kind === "choice") {
        const index = "abcd".indexOf(key) >= 0 ? "abcd".indexOf(key) : "1234".indexOf(key);
        if (index >= 0 && index < quiz.choices.length) pick(index);
      } else if (!quiz) {
        if (!revealed && (key === " " || key === "enter")) {
          event.preventDefault();
          setRevealed(true);
        } else if (revealed && key === "f") submit({ grade: "forgot" });
        else if (revealed && key === "g") submit({ grade: "got" });
      }
    };
  });
  useEffect(() => {
    if (!shortcuts) return undefined;
    const onKey = (event) => keys.current?.(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts]);

  return (
    <Surface as='article' borderTopWidth='4px' borderTopColor={`review.${state}.solid`} aria-live='polite'>
      <Stack gap='4'>
        <HStack justify='space-between' gap='2' wrap='wrap'>
          <ReviewStateBadge state={state} />
          {stepLabel && (
            <Text fontSize='xs' color='fg.muted'>
              {stepLabel}
            </Text>
          )}
        </HStack>

        <Stack gap='2'>
          <Text textStyle='label' color='fg.muted'>
            {quiz ? "Quick check" : "Do you remember?"}
          </Text>
          <Heading as='h3' textStyle='title' fontSize='xl' overflowWrap='anywhere'>
            {quiz ? quiz.prompt : title}
          </Heading>
        </Stack>

        {quiz?.kind === "choice" && (
          <QuizChoices
            choices={quiz.choices}
            picked={picked}
            correctIndex={correctAnswer?.correctIndex ?? null}
            onPick={pick}
            disabled={submitting || answered}
          />
        )}

        {quiz?.kind === "text" && !answered && (
          <Stack as='form' gap='3' onSubmit={checkTyped}>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder='Type your answer'
              aria-label='Your answer'
              maxLength={100}
              autoComplete='off'
              disabled={submitting}
            />
            <HStack gap='3'>
              <Button flex='1' variant='outline' colorPalette='gray' rounded='full' onClick={() => submit({ grade: "forgot" })} disabled={submitting}>
                <LuEye />
                Show answer
              </Button>
              <Button flex='1' type='submit' colorPalette='plum' rounded='full' loading={submitting} disabled={!typed.trim()}>
                <LuCheck />
                Check
              </Button>
            </HStack>
          </Stack>
        )}

        {revealed && (
          <Box bg='bg.subtle' rounded='control' p='3'>
            <Stack gap='3'>
              {quiz?.kind === "text" && correctAnswer && (
                <Stack gap='1'>
                  <Text textStyle='label' color='fg.muted'>
                    Answer
                  </Text>
                  <Text fontWeight='600' whiteSpace='pre-wrap' overflowWrap='anywhere'>
                    {correctAnswer.answer}
                  </Text>
                  {outcome.result.correct === false && typed.trim() && (
                    <Text fontSize='sm' color='review.forgot.fg' overflowWrap='anywhere'>
                      You wrote: {typed.trim()}
                    </Text>
                  )}
                </Stack>
              )}
              {quiz && (
                <Link to={`/lesson/${lesson.id}`}>
                  <Text fontWeight='600' _hover={{ textDecoration: "underline" }} overflowWrap='anywhere'>
                    {title}
                  </Text>
                </Link>
              )}
              <Text textStyle='lesson' whiteSpace='pre-wrap' overflowWrap='anywhere'>
                {body}
              </Text>
              {code && <CodeSnippet code={code} />}
              {author && <AuthorLine author={author} meta='taught this' />}
            </Stack>
          </Box>
        )}

        {error && (
          <Text fontSize='sm' color='review.forgot.fg' role='alert'>
            {error}
          </Text>
        )}

        {answered ? (
          <Stack gap='3'>
            <HStack gap='2' align='flex-start' color='fg.muted' fontSize='sm'>
              <Icon boxSize='4' mt='0.5' flexShrink={0}>
                <LuCalendarClock />
              </Icon>
              <Text>{nextReviewSentence(outcome.review, timeZone)}</Text>
            </HStack>
            {onContinue && (
              <Button colorPalette={state === "forgot" ? "clay" : "sage"} rounded='full' onClick={onContinue}>
                {continueLabel}
                <LuArrowRight />
              </Button>
            )}
          </Stack>
        ) : (
          !quiz &&
          (!revealed ? (
            <Button variant='outline' colorPalette='gray' rounded='full' onClick={() => setRevealed(true)}>
              <LuEye />
              Show the lesson
            </Button>
          ) : (
            <HStack gap='3'>
              <Button flex='1' colorPalette='clay' variant='subtle' rounded='full' onClick={() => submit({ grade: "forgot" })} disabled={submitting}>
                <LuRotateCcw />
                Forgot
              </Button>
              <Button flex='1' colorPalette='sage' rounded='full' onClick={() => submit({ grade: "got" })} loading={submitting}>
                <LuCheck />
                Got it
              </Button>
            </HStack>
          ))
        )}
      </Stack>
    </Surface>
  );
};

/** Loading placeholder with the same footprint as a ReviewCard. */
export const ReviewCardSkeleton = () => (
  <Surface aria-hidden borderTopWidth='4px' borderTopColor='border.emphasized'>
    <Stack gap='4'>
      <HStack justify='space-between'>
        <Skeleton h='5' w='24' rounded='full' />
        <Skeleton h='3' w='20' />
      </HStack>
      <Skeleton h='3' w='24' />
      <SkeletonText noOfLines={2} gap='2' />
      <Skeleton h='10' rounded='full' />
    </Stack>
  </Surface>
);

export default ReviewCard;
