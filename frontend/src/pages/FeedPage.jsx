import { Button, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import { LuBrain, LuCompass, LuRefreshCw, LuSparkles } from "react-icons/lu";
import { Link } from "react-router-dom";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer, PageHeader } from "../components/ds/Page";
import { FeedSkeleton } from "../components/ds/Skeletons";
import Surface from "../components/ds/Surface";
import ExploreList from "../components/lessons/ExploreList";
import FeedReviewItem from "../components/lessons/FeedReviewItem";
import LessonItem from "../components/lessons/LessonItem";
import LoadMore from "../components/lessons/LoadMore";
import { useMe } from "../hooks/useAuth";
import { useFeed } from "../hooks/useLessons";

const itemKey = (item) => (item.type === "review" ? `r-${item.review.id}` : `l-${item.lesson.id}`);

/** Honey strip pointing at the review queue when cards are due. */
const DueBanner = ({ count }) => (
  <Surface bg='review.due.subtle' borderColor='review.due.border' py='3'>
    <HStack justify='space-between' gap='3' wrap='wrap'>
      <HStack gap='2' color='review.due.fg' minW='0'>
        <Icon boxSize='5'>
          <LuBrain />
        </Icon>
        <Text fontWeight='600'>
          {count} {count === 1 ? "review" : "reviews"} due today
        </Text>
      </HStack>
      <Button asChild size='sm' rounded='full' colorPalette='honey'>
        <Link to='/review'>Review now</Link>
      </Button>
    </HStack>
  </Surface>
);

/** What logged-out visitors see at /: a short pitch, then the newest lessons. */
const Welcome = () => (
  <PageContainer>
    <Surface mb='6' bg='brand.subtle' borderColor='brand.muted'>
      <Stack gap='3'>
        <HStack gap='2' color='brand.fg'>
          <Icon boxSize='5'>
            <LuSparkles />
          </Icon>
          <Text textStyle='label'>The feed that makes you remember</Text>
        </HStack>
        <Text textStyle='display' fontSize={{ base: "2xl", md: "3xl" }}>
          Learn one small thing. Keep it for good.
        </Text>
        <Text color='fg.muted'>
          Every post is a bite-size lesson. Tap “Remember this” and it comes back as a quick review right before you would forget it.
        </Text>
        <HStack gap='2' wrap='wrap'>
          <Button asChild rounded='full'>
            <Link to='/signup'>Create an account</Link>
          </Button>
          <Button asChild rounded='full' variant='outline' colorPalette='gray'>
            <Link to='/login'>Log in</Link>
          </Button>
        </HStack>
      </Stack>
    </Surface>
    <Text textStyle='label' color='fg.muted' mb='3'>
      Newest lessons
    </Text>
    <ExploreList />
  </PageContainer>
);

const Feed = () => {
  const query = useFeed();
  const pages = query.data?.pages ?? [];
  const seen = new Set();
  const items = pages
    .flatMap((page) => page.items)
    .filter((item) => {
      const key = itemKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const dueCount = pages[0]?.dueCount ?? 0;

  return (
    <PageContainer>
      <PageHeader eyebrow='Your feed' title='Feed' description='New lessons from people you follow, mixed with reviews that are due.' />
      {query.isPending ? (
        <FeedSkeleton />
      ) : query.isError ? (
        <EmptyState
          icon={<LuRefreshCw />}
          title='Could not load the feed'
          description='The server did not answer. Check your connection and try again.'
          action={
            <Button rounded='full' variant='outline' colorPalette='gray' onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LuCompass />}
          title='Your feed is quiet'
          description='You have seen every lesson and nothing is due. Explore by tag, follow a few teachers, or write a lesson of your own.'
          action={
            <HStack gap='2' wrap='wrap' justify='center'>
              <Button asChild rounded='full'>
                <Link to='/explore'>Explore</Link>
              </Button>
              <Button asChild rounded='full' variant='outline' colorPalette='gray'>
                <Link to='/new'>Write a lesson</Link>
              </Button>
            </HStack>
          }
        />
      ) : (
        <Stack gap='4'>
          {dueCount > 1 && <DueBanner count={dueCount} />}
          {items.map((item) =>
            item.type === "review" ? <FeedReviewItem key={itemKey(item)} review={item.review} /> : <LessonItem key={itemKey(item)} lesson={item.lesson} />
          )}
          <LoadMore query={query} endLabel='You are all caught up. Explore for more.' />
        </Stack>
      )}
    </PageContainer>
  );
};

const FeedPage = () => {
  const { data: me, isPending } = useMe();
  if (isPending) {
    return (
      <PageContainer>
        <FeedSkeleton />
      </PageContainer>
    );
  }
  return me ? <Feed /> : <Welcome />;
};

export default FeedPage;
