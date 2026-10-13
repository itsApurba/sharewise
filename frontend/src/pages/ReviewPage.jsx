import { Button, HStack, Progress, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuBrain, LuFlame, LuLogIn, LuPartyPopper, LuRefreshCw } from "react-icons/lu";
import { Link } from "react-router-dom";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer, PageHeader } from "../components/ds/Page";
import ReviewCard, { ReviewCardSkeleton } from "../components/ds/ReviewCard";
import StatTile from "../components/ds/StatTile";
import { useMe } from "../hooks/useAuth";
import { useAnswerReview, useDueReviews } from "../hooks/useReviews";
import { useMyStats } from "../hooks/useStats";

/** The end of a session: how it went, the streak, and a way back in if more came due. */
const SessionDone = ({ tally, remaining, onMore }) => {
  const { data: stats } = useMyStats();
  const reviewed = tally.got + tally.forgot;
  return (
    <Stack gap='4'>
      <EmptyState
        icon={<LuPartyPopper />}
        title={reviewed ? "Session done" : "All caught up"}
        description={
          reviewed
            ? `You reviewed ${reviewed} ${reviewed === 1 ? "lesson" : "lessons"}. The ones you got come back later; the ones you forgot come back tomorrow.`
            : "Nothing is due right now. Remember a few lessons from the feed and they will show up here."
        }
        action={
          remaining > 0 ? (
            <Button rounded='full' onClick={onMore}>
              Review {remaining} more
            </Button>
          ) : (
            <Button asChild rounded='full'>
              <Link to='/'>Back to the feed</Link>
            </Button>
          )
        }
      />
      {reviewed > 0 && (
        <SimpleGrid columns={stats ? 3 : 2} gap='3'>
          <StatTile label='Got it' value={tally.got} palette='sage' />
          <StatTile label='Forgot' value={tally.forgot} palette='clay' />
          {stats && (
            <StatTile
              label='Streak'
              value={stats.currentStreak}
              hint={stats.currentStreak === 1 ? "day in a row" : "days in a row"}
              icon={<LuFlame />}
              palette='brand'
            />
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
};

/** One pass over the cards that were due when it started, one card at a time. */
const ReviewSession = ({ dueItems, remaining, onMore }) => {
  const answerReview = useAnswerReview();
  const { data: me } = useMe();
  const [items] = useState(dueItems);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ got: 0, forgot: 0 });
  const total = items.length;
  const current = items[index];

  const answer = async (body) => {
    const outcome = await answerReview.mutateAsync({ id: current.id, ...body });
    setTally((t) => ({ ...t, [outcome.result.grade]: t[outcome.result.grade] + 1 }));
    return outcome;
  };

  return (
    <>
      {total > 0 && (
        <Stack gap='2' mb='5'>
          <HStack justify='space-between' fontSize='sm' color='fg.muted'>
            <Text>
              {Math.min(index, total)} of {total} reviewed
            </Text>
            {tally.got + tally.forgot > 0 && (
              <Text>
                {tally.got} got · {tally.forgot} forgot
              </Text>
            )}
          </HStack>
          <Progress.Root value={(Math.min(index, total) / total) * 100} size='sm' colorPalette='sage' rounded='full' aria-label='Review progress'>
            <Progress.Track rounded='full'>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Text fontSize='xs' color='fg.muted' display={{ base: "none", md: "block" }}>
            Keys: Space shows the lesson · G got it · F forgot · A-D pick a choice · Enter next
          </Text>
        </Stack>
      )}
      {current ? (
        <ReviewCard
          key={current.id}
          review={current}
          stepLabel={`Card ${index + 1} of ${total}`}
          onAnswer={answer}
          timeZone={me?.timezone}
          shortcuts
          onContinue={() => setIndex(index + 1)}
          continueLabel={index + 1 < total ? "Next card" : "Finish"}
        />
      ) : (
        <SessionDone tally={tally} remaining={remaining} onMore={onMore} />
      )}
    </>
  );
};

const ReviewQueue = () => {
  const { data, isPending, isError, refetch } = useDueReviews();
  const [session, setSession] = useState(0);

  if (isPending) return <ReviewCardSkeleton />;
  if (isError) {
    return (
      <EmptyState
        icon={<LuRefreshCw />}
        title='Could not load your reviews'
        description='The server did not answer. Check your connection and try again.'
        action={
          <Button rounded='full' variant='outline' colorPalette='gray' onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );
  }
  // The session keeps the cards it started with; answering refreshes the due list underneath it.
  return <ReviewSession key={session} dueItems={data.items} remaining={data.total} onMore={() => setSession(session + 1)} />;
};

const ReviewPage = () => {
  const { data: me, isPending } = useMe();
  return (
    <PageContainer>
      <PageHeader eyebrow='Today' title='Review' description='Lessons you saved, back right before you would forget them.' />
      {isPending ? (
        <ReviewCardSkeleton />
      ) : me ? (
        <ReviewQueue />
      ) : (
        <EmptyState
          icon={<LuBrain />}
          title='Log in to review'
          description='Lessons you remember come back here on a spaced schedule: tomorrow, in 3 days, a week, then a month.'
          action={
            <Button asChild rounded='full'>
              <Link to='/login' state={{ from: "/review" }}>
                <LuLogIn />
                Log in
              </Link>
            </Button>
          }
        />
      )}
    </PageContainer>
  );
};

export default ReviewPage;
