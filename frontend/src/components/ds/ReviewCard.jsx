import { Box, Button, HStack, Heading, Skeleton, SkeletonText, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuEye, LuRotateCcw } from "react-icons/lu";
import { AuthorLine, CodeSnippet } from "./LessonCard";
import QuizChoices from "./QuizChoices";
import ReviewStateBadge from "./ReviewStateBadge";
import Surface from "./Surface";

/**
 * A saved lesson coming back for review. With a multiple-choice quiz, the pick grades it;
 * with a free-answer quiz or none, the reader reveals the answer or lesson and grades themselves.
 * onGrade receives "gotIt" or "forgot". `state` colors the card edge and badge.
 */
const ReviewCard = ({ lesson, state = "due", stepLabel, onGrade }) => {
  const [revealed, setRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const { title, body, code, quiz, author } = lesson;
  const hasChoices = Boolean(quiz?.choices);

  const answerQuiz = (correct) => {
    setQuizResult(correct ? "gotIt" : "forgot");
    setRevealed(true);
  };

  return (
    <Surface as='article' borderTopWidth='4px' borderTopColor={`review.${state}.solid`}>
      <Stack gap='4'>
        <HStack justify='space-between' gap='2' wrap='wrap'>
          <ReviewStateBadge state={quizResult ?? state} />
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
          <Heading as='h3' textStyle='title' fontSize='xl'>
            {quiz ? quiz.question : title}
          </Heading>
        </Stack>

        {hasChoices && <QuizChoices choices={quiz.choices} answerIndex={quiz.answerIndex} onAnswer={answerQuiz} />}

        {revealed && (
          <Box bg='bg.subtle' rounded='control' p='3'>
            <Stack gap='3'>
              {quiz && !hasChoices && (
                <Stack gap='1'>
                  <Text textStyle='label' color='fg.muted'>
                    Answer
                  </Text>
                  <Text fontWeight='600' whiteSpace='pre-wrap' overflowWrap='anywhere'>
                    {quiz.answer}
                  </Text>
                </Stack>
              )}
              {quiz && title && <Text fontWeight='600'>{title}</Text>}
              <Text textStyle='lesson' whiteSpace='pre-wrap' overflowWrap='anywhere'>
                {body}
              </Text>
              {code && <CodeSnippet code={code} />}
              {author && <AuthorLine author={author} meta='taught this' />}
            </Stack>
          </Box>
        )}

        {hasChoices ? (
          quizResult && (
            <Button colorPalette={quizResult === "gotIt" ? "sage" : "clay"} rounded='full' onClick={() => onGrade?.(quizResult)}>
              {quizResult === "gotIt" ? "Nice, next review" : "Okay, show it again sooner"}
            </Button>
          )
        ) : !revealed ? (
          <Button variant='outline' colorPalette='gray' rounded='full' onClick={() => setRevealed(true)}>
            <LuEye />
            {quiz ? "Show answer" : "Show the lesson"}
          </Button>
        ) : (
          <HStack gap='3'>
            <Button flex='1' colorPalette='clay' variant='subtle' rounded='full' onClick={() => onGrade?.("forgot")}>
              <LuRotateCcw />
              Forgot
            </Button>
            <Button flex='1' colorPalette='sage' rounded='full' onClick={() => onGrade?.("gotIt")}>
              <LuCheck />
              Got it
            </Button>
          </HStack>
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
