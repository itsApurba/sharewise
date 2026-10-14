import { Box, Button, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuBookmarkPlus, LuCheck, LuCircleCheck, LuCircleX, LuRefreshCw, LuSearchX, LuShare2 } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import EmptyState from "../components/ds/EmptyState";
import { LessonCardSkeleton } from "../components/ds/LessonCard";
import { PageContainer, PageHeader, SectionHeading } from "../components/ds/Page";
import QuizChoices from "../components/ds/QuizChoices";
import Surface from "../components/ds/Surface";
import LessonItem from "../components/lessons/LessonItem";
import useRememberToggle from "../components/lessons/useRememberToggle";
import { toaster } from "../components/ui/toaster";
import { useAnswerQuiz, useLesson } from "../hooks/useLessons";

/** The verdict line under an answered quiz, with a nudge to remember the lesson. */
const Verdict = ({ correct, lesson }) => {
  const { remembered, toggle, busy } = useRememberToggle(lesson);
  const canRemember = !lesson.viewer?.isAuthor && !remembered;
  return (
    <Stack gap='3' mt='4'>
      <HStack gap='2' color={correct ? "review.gotIt.fg" : "review.forgot.fg"} fontWeight='600'>
        {correct ? <LuCircleCheck /> : <LuCircleX />}
        <Text>{correct ? "Correct." : "Not quite."}</Text>
      </HStack>
      <Text fontSize='sm' color='fg.muted'>
        {remembered
          ? "You are remembering this one, so it comes back on its own schedule."
          : correct
            ? "Remember it to keep it that way: it comes back right before you would forget."
            : "Remember it and it comes back tomorrow for another try."}
      </Text>
      {canRemember && (
        <Button alignSelf='flex-start' size='sm' rounded='full' onClick={toggle} loading={busy}>
          <LuBookmarkPlus />
          Remember this
        </Button>
      )}
    </Stack>
  );
};

/** The quiz under a lesson. The answer is revealed only after the reader answers (or to the author). */
const LessonQuiz = ({ lesson }) => {
  const { quiz, viewer } = lesson;
  const answerQuiz = useAnswerQuiz();
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);

  const submit = (body) =>
    answerQuiz.mutate(
      { id: lesson.id, ...body },
      {
        onSuccess: setResult,
        onError: () => setPicked(null),
      }
    );

  const isAuthor = Boolean(viewer?.isAuthor);
  const knownEarlier = !result && (isAuthor || viewer?.quizAnswered);
  const correctIndex = result?.correctAnswer.correctIndex ?? (knownEarlier ? quiz.correctIndex : null) ?? null;
  const answerText = result?.correctAnswer.answer ?? (knownEarlier ? quiz.answer : null);

  return (
    <Box mt='6'>
      <SectionHeading>{isAuthor ? "Your quiz" : "Try the quiz"}</SectionHeading>
      <Surface>
        <Text fontWeight='600' mb='3' overflowWrap='anywhere'>
          {quiz.prompt}
        </Text>
        {quiz.kind === "choice" ? (
          <QuizChoices
            choices={quiz.choices}
            picked={picked}
            correctIndex={correctIndex}
            disabled={answerQuiz.isPending || Boolean(knownEarlier)}
            onPick={(index) => {
              setPicked(index);
              submit({ choice: index });
            }}
          />
        ) : answerText ? (
          <Stack gap='2'>
            <Box bg='bg.subtle' rounded='control' p='3'>
              <Text textStyle='label' color='fg.muted' mb='1'>
                Answer
              </Text>
              <Text fontWeight='600' whiteSpace='pre-wrap' overflowWrap='anywhere'>
                {answerText}
              </Text>
            </Box>
            {result && !result.correct && (
              <Text fontSize='sm' color='review.forgot.fg' overflowWrap='anywhere'>
                You wrote: {typed.trim()}
              </Text>
            )}
          </Stack>
        ) : (
          <Stack
            as='form'
            gap='3'
            onSubmit={(event) => {
              event.preventDefault();
              if (typed.trim()) submit({ answer: typed.trim() });
            }}
          >
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder='Type your answer' aria-label='Your answer' maxLength={100} autoComplete='off' />
            <Button type='submit' alignSelf='flex-start' rounded='full' colorPalette='plum' loading={answerQuiz.isPending} disabled={!typed.trim()}>
              <LuCheck />
              Check
            </Button>
          </Stack>
        )}
        {answerQuiz.isError && (
          <Text mt='3' fontSize='sm' color='review.forgot.fg' role='alert'>
            {errorMessage(answerQuiz.error)}
          </Text>
        )}
        {result ? (
          <Verdict correct={result.correct} lesson={lesson} />
        ) : isAuthor ? (
          <Text mt='3' fontSize='sm' color='fg.muted'>
            Only you see the answer here. Readers see it after they answer.
          </Text>
        ) : (
          viewer?.quizAnswered && <Verdict correct={viewer.quizCorrect} lesson={lesson} />
        )}
      </Surface>
    </Box>
  );
};

/** Native share sheet where there is one (phones), otherwise copy the link. */
const ShareButton = ({ lesson }) => {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: lesson.title, text: `${lesson.title} · a lesson on Sharewise`, url });
      } catch {
        // Dismissed share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toaster.success({ title: "Link copied", description: "Send it to someone who should remember this too." });
    } catch {
      toaster.error({ title: "Could not copy the link", description: url });
    }
  };
  return (
    <Button size='sm' variant='outline' colorPalette='gray' rounded='full' onClick={share}>
      <LuShare2 />
      Share
    </Button>
  );
};

const LessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lesson, isPending, isError, error, refetch } = useLesson(id);
  const notFound = error?.response?.status === 404;

  return (
    <PageContainer>
      <PageHeader title='Lesson' backTo='/explore' backLabel='Explore' actions={lesson && <ShareButton lesson={lesson} />} />
      {isPending ? (
        <LessonCardSkeleton />
      ) : isError ? (
        notFound ? (
          <EmptyState
            icon={<LuSearchX />}
            title='Lesson not found'
            description='It may have been deleted, or the link is mistyped.'
            action={
              <Button asChild rounded='full'>
                <Link to='/explore'>Explore lessons</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<LuRefreshCw />}
            title='Could not load the lesson'
            description={errorMessage(error)}
            action={
              <Button rounded='full' variant='outline' colorPalette='gray' onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )
      ) : (
        <>
          <LessonItem lesson={lesson} linkToDetail={false} onDeleted={() => navigate("/", { replace: true })} />
          {lesson.quiz && <LessonQuiz key={`${lesson.id}-${lesson.updatedAt}`} lesson={lesson} />}
        </>
      )}
    </PageContainer>
  );
};

export default LessonPage;
