import { Box, Button, HStack, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuBookOpen, LuBrain, LuCalendarCheck, LuFlame, LuGraduationCap, LuTrophy, LuUsers } from "react-icons/lu";
import { Link } from "react-router-dom";
import ActivityPanel from "../components/activity/ActivityPanel";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer, PageHeader, SectionHeading } from "../components/ds/Page";
import { ListSkeleton, StatTilesSkeleton } from "../components/ds/Skeletons";
import StatTile from "../components/ds/StatTile";
import StreakAvatar from "../components/ds/StreakAvatar";
import Surface from "../components/ds/Surface";
import WeekChart from "../components/ds/WeekChart";
import { useMe } from "../hooks/useAuth";
import { useCommunityStats, useMyStats, useTopLessons, useTopTeachers } from "../hooks/useStats";

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const LoadError = () => <EmptyState title="Couldn't load this" description='Check your connection and refresh the page.' />;

const RankRow = ({ rank, children, value, valueLabel }) => (
  <HStack gap='3' py='3' borderTopWidth={rank === 1 ? "0" : "1px"} borderColor='border.muted'>
    <Text w='5' flexShrink={0} fontFamily='heading' fontWeight='600' color='fg.muted' textAlign='center'>
      {rank}
    </Text>
    <Box flex='1' minW='0'>
      {children}
    </Box>
    <Stack gap='0' align='flex-end' flexShrink={0}>
      <Text fontWeight='700'>{value}</Text>
      <Text fontSize='2xs' color='fg.muted'>
        {valueLabel}
      </Text>
    </Stack>
  </HStack>
);

/** Streak hero: current streak with the flame, best streak beside it. */
const StreakPanel = ({ stats }) => {
  const { currentStreak, bestStreak, reviewedToday, dueToday } = stats;
  const nudge =
    currentStreak === 0
      ? "Answer a review to start a streak."
      : reviewedToday
        ? "You've reviewed today. Come back tomorrow to keep it going."
        : dueToday > 0
          ? "Answer a review today to keep your streak."
          : "Nothing due yet today. Remember a lesson so tomorrow has something to review.";
  return (
    <Surface colorPalette='brand'>
      <HStack gap='4' align='center'>
        <Icon boxSize={{ base: "10", md: "12" }} color={currentStreak > 0 ? "streak" : "fg.muted"} flexShrink={0}>
          <LuFlame fill={currentStreak > 0 ? "currentColor" : "none"} />
        </Icon>
        <Stack gap='0' flex='1' minW='0'>
          <Text textStyle='label' color='colorPalette.fg'>
            Current streak
          </Text>
          <Text fontFamily='heading' fontWeight='600' fontSize={{ base: "3xl", md: "4xl" }} lineHeight='1.1'>
            {plural(currentStreak, "day")}
          </Text>
          <Text fontSize='sm' color='fg.muted'>
            {nudge}
          </Text>
        </Stack>
        <Stack gap='0' align='flex-end' flexShrink={0}>
          <Text textStyle='label' color='fg.muted'>
            Best
          </Text>
          <Text fontFamily='heading' fontWeight='600' fontSize='xl'>
            {plural(bestStreak, "day")}
          </Text>
        </Stack>
      </HStack>
    </Surface>
  );
};

const MyProgress = ({ handle }) => {
  const { data: stats, isLoading, isError } = useMyStats();
  if (isLoading)
    return (
      <Stack gap='3'>
        <StatTilesSkeleton count={1} />
        <StatTilesSkeleton count={3} />
      </Stack>
    );
  if (isError) return <LoadError />;
  return (
    <Stack gap='4'>
      <StreakPanel stats={stats} />
      <SimpleGrid columns={{ base: 2, md: 3 }} gap='3'>
        <StatTile label='Mastered' value={stats.mastered} icon={<LuGraduationCap />} palette='plum' hint={`of ${plural(stats.remembered, "lesson")} remembered`} />
        <StatTile
          label='Due today'
          value={stats.dueToday}
          icon={<LuCalendarCheck />}
          palette='honey'
          hint={
            stats.dueToday > 0 ? (
              <Link to='/review'>
                <Text as='span' color='honey.fg' textDecoration='underline'>
                  Review now
                </Text>
              </Link>
            ) : (
              "All caught up"
            )
          }
        />
        <Box gridColumn={{ base: "span 2", md: "auto" }}>
          <StatTile label='This week' value={stats.reviewsThisWeek} icon={<LuBrain />} palette='sage' hint='reviews answered in 7 days' />
        </Box>
      </SimpleGrid>
      {stats.reviewsByDay && (
        <Surface>
          <HStack justify='space-between' mb='4' gap='3'>
            <Text textStyle='title'>Reviews this week</Text>
            <Text fontSize='sm' color='fg.muted'>
              {plural(stats.reviewsThisWeek, "review")}
            </Text>
          </HStack>
          <WeekChart days={stats.reviewsByDay} />
        </Surface>
      )}
      <ActivityPanel handle={handle} />
    </Stack>
  );
};

const SignupNudge = () => (
  <Surface colorPalette='brand' bg='colorPalette.subtle' borderColor='colorPalette.muted'>
    <Stack gap='3' direction={{ base: "column", md: "row" }} align={{ md: "center" }} justify='space-between'>
      <HStack gap='3' align='flex-start' minW='0'>
        <Icon boxSize='6' color='streak' flexShrink={0} mt='0.5'>
          <LuFlame fill='currentColor' />
        </Icon>
        <Stack gap='0.5' minW='0'>
          <Text fontWeight='700'>Track what you remember</Text>
          <Text fontSize='sm' color='fg.muted'>
            Sign up to keep a review streak, see lessons you have mastered and what is due today.
          </Text>
        </Stack>
      </HStack>
      <HStack gap='2' flexShrink={0}>
        <Button asChild rounded='full' size='sm'>
          <Link to='/signup'>Sign up</Link>
        </Button>
        <Button asChild rounded='full' size='sm' variant='ghost' colorPalette='gray'>
          <Link to='/login'>Log in</Link>
        </Button>
      </HStack>
    </Stack>
  </Surface>
);

const TopLessons = () => {
  const { data, isLoading, isError } = useTopLessons();
  if (isLoading) return <ListSkeleton rows={5} />;
  if (isError) return <LoadError />;
  if (data.length === 0)
    return <EmptyState icon={<LuBookOpen />} title='No lessons remembered yet' description='When people tap "Remember this", the favorites show up here.' />;
  return (
    <Surface py='1'>
      {data.map((lesson, i) => (
        <RankRow key={lesson.id} rank={i + 1} value={lesson.rememberCount} valueLabel={lesson.rememberCount === 1 ? "learner" : "learners"}>
          <Link to={`/lesson/${lesson.id}`}>
            <Text fontWeight='600' lineClamp={2} overflowWrap='anywhere' _hover={{ textDecoration: "underline" }}>
              {lesson.title}
            </Text>
          </Link>
          <Text fontSize='xs' color='fg.muted' truncate>
            by {lesson.author.name}
          </Text>
        </RankRow>
      ))}
    </Surface>
  );
};

const TopTeachers = () => {
  const { data, isLoading, isError } = useTopTeachers();
  if (isLoading) return <ListSkeleton rows={5} />;
  if (isError) return <LoadError />;
  if (data.length === 0)
    return <EmptyState icon={<LuTrophy />} title='No teachers yet' description='Authors appear here once someone remembers their lessons.' />;
  return (
    <Surface py='1'>
      {data.map(({ user, learners, remembers, lessons }, i) => (
        <RankRow key={user.id} rank={i + 1} value={learners} valueLabel={learners === 1 ? "learner" : "learners"}>
          <HStack gap='3' minW='0'>
            <StreakAvatar name={user.name} size='sm' />
            <Stack gap='0' minW='0'>
              <Link to={`/u/${user.handle}`}>
                <Text fontWeight='600' truncate _hover={{ textDecoration: "underline" }}>
                  {user.name}
                </Text>
              </Link>
              <Text fontSize='xs' color='fg.muted' truncate>
                @{user.handle} · {plural(lessons, "lesson")} · {plural(remembers, "save")}
              </Text>
            </Stack>
          </HStack>
        </RankRow>
      ))}
    </Surface>
  );
};

const CommunityTotals = () => {
  const { data, isLoading, isError } = useCommunityStats();
  if (isLoading) return <StatTilesSkeleton count={3} />;
  if (isError) return <LoadError />;
  return (
    <SimpleGrid columns={{ base: 2, md: 5 }} gap='3'>
      <StatTile label='Learners' value={data.users} icon={<LuUsers />} palette='gray' />
      <StatTile label='Lessons' value={data.lessons} icon={<LuBookOpen />} palette='gray' />
      <StatTile label='Remembered' value={data.remembers} icon={<LuFlame />} palette='brand' />
      <StatTile label='Reviews done' value={data.reviewsDone} icon={<LuBrain />} palette='sage' />
      <Box gridColumn={{ base: "span 2", md: "auto" }}>
        <StatTile label='Mastered' value={data.mastered} icon={<LuGraduationCap />} palette='plum' />
      </Box>
    </SimpleGrid>
  );
};

const StatsPage = () => {
  const { data: me, isLoading } = useMe();
  return (
    <PageContainer width='wide'>
      <PageHeader eyebrow='Progress' title='Stats' description='What you remember, and who taught it.' />
      <Stack gap='8'>
        {isLoading ? <StatTilesSkeleton count={3} /> : me ? <MyProgress handle={me.handle} /> : <SignupNudge />}

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap='6'>
          <Box minW='0'>
            <SectionHeading>Most remembered lessons</SectionHeading>
            <TopLessons />
          </Box>
          <Box minW='0'>
            <SectionHeading>Top teachers</SectionHeading>
            <TopTeachers />
          </Box>
        </SimpleGrid>

        <Box minW='0'>
          <SectionHeading>Community</SectionHeading>
          <CommunityTotals />
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default StatsPage;
