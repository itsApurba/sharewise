import { Box, Button, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuSearchX } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/ds/EmptyState";
import LessonCard from "../components/ds/LessonCard";
import { PageContainer, PageHeader, PreviewNotice, SectionHeading } from "../components/ds/Page";
import QuizChoices from "../components/ds/QuizChoices";
import Surface from "../components/ds/Surface";
import { SAMPLE_LESSONS } from "../sample/sampleData";

const LessonPage = () => {
  const { id } = useParams();
  const lesson = SAMPLE_LESSONS.find((item) => item.id === id);
  const [remembered, setRemembered] = useState(false);
  const [result, setResult] = useState(null);

  return (
    <PageContainer>
      <PageHeader title='Lesson' backTo='/explore' backLabel='Explore' />
      <PreviewNotice />
      {!lesson ? (
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
        <>
          <LessonCard lesson={lesson} remembered={remembered} onRemember={() => setRemembered(!remembered)} />
          {lesson.quiz && (
            <Box mt='6'>
              <SectionHeading>Try the quiz</SectionHeading>
              <Surface>
                <Text fontWeight='600' mb='3'>
                  {lesson.quiz.question}
                </Text>
                <QuizChoices choices={lesson.quiz.choices} answerIndex={lesson.quiz.answerIndex} onAnswer={setResult} />
                {result !== null && (
                  <Text mt='3' fontSize='sm' color={result ? "review.gotIt.fg" : "review.forgot.fg"}>
                    {result ? "Correct. Save it to keep it that way." : "Not quite. Save it and it will come back for review."}
                  </Text>
                )}
              </Surface>
            </Box>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default LessonPage;
