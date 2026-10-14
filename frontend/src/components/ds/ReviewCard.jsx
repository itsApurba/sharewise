import { Box, Button, HStack, Heading, Icon, Input, Kbd, Skeleton, SkeletonText, Stack, Text } from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { LuArrowRight, LuCalendarClock, LuCheck, LuEye, LuRotateCcw } from "react-icons/lu";
import { Link } from "react-router-dom";
import { errorMessage } from "../../api/client";
import { usePrefersReducedMotion, useReviewKeys, useSwipe } from "../../hooks/useReviewGestures";
import { nextReviewSentence } from "../../lib/format";
import CodeSnippet from "./CodeSnippet";
import { AuthorLine } from "./LessonCard";
import Markdown from "./Markdown";
import QuizChoices from "./QuizChoices";
import ReviewStateBadge from "./ReviewStateBadge";
import Surface from "./Surface";

/** How long a swiped card takes to leave, ms. */
const FLY_MS = 220;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Touch screens get the swipe hint; screens with a hovering pointer get the key hints.
const TOUCH = "@media (hover: none) and (pointer: coarse)";
const showOnTouch = { display: "none", [TOUCH]: { display: "block" } };
const hideOnTouch = { [TOUCH]: { display: "none" } };

/** A short row of key hints: `[[keys, label], ...]`, where keys is a list of key caps. */
const KeyHints = ({ hints }) => (
  <HStack gap='3' rowGap='1' wrap='wrap' justify='center' fontSize='xs' color='fg.muted' css={hideOnTouch} aria-hidden>
    {hints.map(([keys, label]) => (
      <HStack key={label} gap='1'>
        {keys.map((key, i) => (
          <Fragment key={key}>
            {i > 0 && <Text as='span'>/</Text>}
            <Kbd size='sm' colorPalette='gray'>{key}</Kbd>
          </Fragment>
        ))}
        <Text as='span'>{label}</Text>
      </HStack>
    ))}
  </HStack>
);

/**
 * A colored edge and label that fade in as a card is dragged toward a grade. They sit on
 * the trailing side (left for a right swipe), which stays on screen as the card moves.
 */
const SwipeEdge = ({ toward, strength }) => {
  const state = toward === "right" ? "gotIt" : "forgot";
  const side = toward === "right" ? "left" : "right";
  return (
    <Box position='absolute' insetY='0' {...{ [side]: 0 }} w='45%' zIndex='1' pointerEvents='none' opacity={strength} aria-hidden>
      <Box position='absolute' insetY='0' {...{ [side]: 0 }} w='1.5' bg={`review.${state}.solid`} />
      <Text
        position='absolute'
        top='40%'
        boxShadow='raised'
        {...{ [side]: "4" }}
        px='3'
        py='1'
        rounded='full'
        fontSize='sm'
        fontWeight='700'
        bg={`review.${state}.subtle`}
        color={`review.${state}.fg`}
        borderWidth='1px'
        borderColor={`review.${state}.border`}
      >
        {toward === "right" ? "Got it" : "Forgot"}
      </Text>
    </Box>
  );
};

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
 * adds a button after the result. `shortcuts` turns on keys for a focused session, with a
 * hint row: Space shows the lesson, 1 / ← / F forgot, 2 / → / G got it, A-D pick a choice,
 * Enter continues. `swipeable` lets a touch reader grade a revealed lesson by swiping it
 * right (got it) or left (forgot); the card flies off and `onContinue` runs straight away.
 * The buttons stay as the fallback either way.
 */
const ReviewCard = ({ review, stepLabel, onAnswer, onContinue, continueLabel = "Next", timeZone, shortcuts = false, swipeable = false }) => {
  const { lesson } = review;
  const { title, body, code, quiz, author } = lesson;
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [flying, setFlying] = useState(null);
  const reducedMotion = usePrefersReducedMotion();
  const state = stateOf(outcome);
  const answered = outcome !== null;

  /** Sends one answer; resolves to whether it went through. */
  const submit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      setOutcome(await onAnswer(payload));
      setRevealed(true);
      return true;
    } catch (err) {
      setPicked(null);
      setError(errorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const grade = (value) => submit({ grade: value });

  const pick = (index) => {
    setPicked(index);
    submit({ choice: index });
  };

  const checkTyped = (event) => {
    event.preventDefault();
    if (typed.trim()) submit({ answer: typed.trim() });
  };

  const correctAnswer = outcome?.result.correctAnswer;

  useReviewKeys(shortcuts, (key, event) => {
    if (flying) return;
    if (answered) {
      if ((key === "enter" || key === " ") && onContinue) {
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
      } else if (revealed && ["1", "arrowleft", "f"].includes(key)) {
        event.preventDefault();
        grade("forgot");
      } else if (revealed && ["2", "arrowright", "g"].includes(key)) {
        event.preventDefault();
        grade("got");
      }
    }
  });

  // A swipe grades, flies the card off and moves on; on an error the card springs back.
  const swipe = async (direction) => {
    setFlying(direction);
    const [sent] = await Promise.all([grade(direction === "right" ? "got" : "forgot"), wait(reducedMotion ? 0 : FLY_MS)]);
    if (sent && onContinue) onContinue();
    else setFlying(null);
  };
  const canSwipe = swipeable && !quiz && revealed && !answered && !submitting && !flying;
  const { bind, dx, progress, dragging } = useSwipe({ enabled: canSwipe, onSwipe: swipe });

  // Reduced motion keeps the card under the finger but drops the tilt and the fly-off.
  const flyX = flying === "right" ? "120%" : "-120%";
  const motion = flying
    ? {
        transform: reducedMotion ? "none" : `translateX(${flyX}) rotate(${flying === "right" ? 12 : -12}deg)`,
        opacity: 0,
        transition: reducedMotion ? "opacity 120ms linear" : `transform ${FLY_MS}ms ease-in, opacity ${FLY_MS}ms ease-in`,
      }
    : {
        transform: dx ? `translateX(${dx}px)${reducedMotion ? "" : ` rotate(${dx * 0.04}deg)`}` : "none",
        transition: dragging || reducedMotion ? "none" : "transform 200ms ease-out",
      };

  const keyHints = answered
    ? onContinue && [[["Enter"], continueLabel.toLowerCase()]]
    : quiz?.kind === "choice"
      ? [[["A", "B", "C", "D"].slice(0, quiz.choices.length), "pick an answer"]]
      : quiz
        ? null
        : !revealed
          ? [[["Space"], "show the lesson"]]
          : [
              [["1", "←"], "forgot"],
              [["2", "→"], "got it"],
            ];

  return (
    <Surface
      as='article'
      position='relative'
      overflow='hidden'
      borderTopWidth='4px'
      borderTopColor={`review.${state}.solid`}
      aria-live='polite'
      touchAction={canSwipe ? "pan-y" : undefined}
      userSelect={dragging ? "none" : undefined}
      willChange={swipeable ? "transform" : undefined}
      {...motion}
      {...bind}
    >
      {canSwipe && (
        <>
          <SwipeEdge toward='left' strength={Math.max(0, -progress)} />
          <SwipeEdge toward='right' strength={Math.max(0, progress)} />
        </>
      )}
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
              <Markdown source={body} />
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
              <Button flex='1' colorPalette='clay' variant='subtle' rounded='full' onClick={() => grade("forgot")} disabled={submitting}>
                <LuRotateCcw />
                Forgot
              </Button>
              <Button flex='1' colorPalette='sage' rounded='full' onClick={() => grade("got")} loading={submitting}>
                <LuCheck />
                Got it
              </Button>
            </HStack>
          ))
        )}

        {canSwipe && (
          <Text fontSize='xs' color='fg.muted' textAlign='center' css={showOnTouch}>
            Swipe right for Got it, left for Forgot
          </Text>
        )}
        {shortcuts && keyHints && <KeyHints hints={keyHints} />}
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
