import { Button, Progress, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuPartyPopper } from "react-icons/lu";
import { Link } from "react-router-dom";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer, PageHeader, PreviewNotice } from "../components/ds/Page";
import ReviewCard from "../components/ds/ReviewCard";
import { toaster } from "../components/ui/toaster";
import { SAMPLE_REVIEWS } from "../sample/sampleData";

const ReviewPage = () => {
  const [queue, setQueue] = useState(SAMPLE_REVIEWS);
  const done = SAMPLE_REVIEWS.length - queue.length;

  const grade = (id, result) => {
    setQueue((current) => current.filter((review) => review.lesson.id !== id));
    if (result === "gotIt") toaster.success({ title: "Got it", description: "Next review in about a week." });
    else toaster.warning({ title: "No worries", description: "It comes back tomorrow." });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow='Today' title='Review' description='Lessons you saved, back right before you would forget them.' />
      <PreviewNotice />
      <Stack gap='2' mb='5'>
        <Text fontSize='sm' color='fg.muted'>
          {done} of {SAMPLE_REVIEWS.length} reviewed
        </Text>
        <Progress.Root value={(done / SAMPLE_REVIEWS.length) * 100} size='sm' colorPalette='sage' rounded='full'>
          <Progress.Track rounded='full'>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Stack>
      <Stack gap='4'>
        {queue.length === 0 ? (
          <EmptyState
            icon={<LuPartyPopper />}
            title='All caught up'
            description='Nothing else is due today. Save a few lessons from the feed to keep your streak going.'
            action={
              <Button asChild rounded='full'>
                <Link to='/'>Back to the feed</Link>
              </Button>
            }
          />
        ) : (
          queue.map((review) => <ReviewCard key={review.lesson.id} {...review} onGrade={(result) => grade(review.lesson.id, result)} />)
        )}
      </Stack>
    </PageContainer>
  );
};

export default ReviewPage;
