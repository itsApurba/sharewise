import { Badge, Box, Button, HStack, Heading, Icon, SimpleGrid, Stack, Text, Wrap } from "@chakra-ui/react";
import { LuBookOpen, LuCalendar, LuCheck, LuFlame, LuPencil, LuPlus, LuTrophy, LuUserMinus, LuUserPlus } from "react-icons/lu";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { apiError } from "../api/client";
import PeopleList from "../components/auth/PeopleList";
import EmptyState from "../components/ds/EmptyState";
import LessonCard from "../components/ds/LessonCard";
import { PageContainer } from "../components/ds/Page";
import { FeedSkeleton, StatTilesSkeleton } from "../components/ds/Skeletons";
import StreakAvatar from "../components/ds/StreakAvatar";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";
import { monthYear, relativeTime } from "../lib/relativeTime";
import { useFollow, useFollowers, useFollowing, useProfile, useUnfollow, useUserLessons } from "../hooks/useUsers";

const TABS = ["lessons", "followers", "following"];

const FollowButton = ({ handle, name, isFollowing }) => {
  const follow = useFollow();
  const unfollow = useUnfollow();
  const pending = follow.isPending || unfollow.isPending;
  const onClick = () =>
    (isFollowing ? unfollow : follow).mutate(handle, {
      onSuccess: () => !isFollowing && toaster.success({ title: `Following ${name}`, description: "Their new lessons will show up in your feed." }),
      onError: (error) => toaster.error({ title: "Could not update follow", description: apiError(error).message }),
    });
  return (
    <Button rounded='full' variant={isFollowing ? "outline" : "solid"} colorPalette={isFollowing ? "gray" : "brand"} loading={pending} onClick={onClick} aria-pressed={isFollowing}>
      {isFollowing ? <LuUserMinus /> : <LuUserPlus />}
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

/** One clickable count: lessons, followers or following. Selects its tab. */
const CountTile = ({ label, value, active, onClick }) => (
  <Surface
    as='button'
    type='button'
    onClick={onClick}
    p='3'
    textAlign='start'
    cursor='pointer'
    borderColor={active ? "brand.solid" : "border.muted"}
    _hover={{ bg: "bg.muted" }}
    transition='background 150ms, border-color 150ms'
    aria-pressed={active}
  >
    <Text fontFamily='heading' fontWeight='600' fontSize={{ base: "xl", md: "2xl" }} lineHeight='1.1'>
      {value}
    </Text>
    <Text fontSize='xs' color='fg.muted' truncate>
      {label}
    </Text>
  </Surface>
);

const ProfileLessons = ({ handle, isSelf, name }) => {
  const query = useUserLessons(handle);
  const { data, isPending, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = query;
  if (isPending) return <FeedSkeleton count={2} />;
  if (isError) {
    return (
      <EmptyState
        title='Could not load lessons'
        description='Check your connection and try again.'
        action={
          <Button size='sm' rounded='full' variant='outline' colorPalette='gray' onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  const lessons = data.pages.flatMap((page) => page.items);
  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={<LuBookOpen />}
        title={isSelf ? "Teach your first lesson" : "No lessons yet"}
        description={isSelf ? "Share one thing you learned today. Short is good." : `${name} has not shared a lesson yet.`}
        action={
          isSelf && (
            <Button asChild rounded='full'>
              <Link to='/new'>
                <LuPlus />
                New lesson
              </Link>
            </Button>
          )
        }
      />
    );
  }
  return (
    <Stack gap='4'>
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={{ ...lesson, code: lesson.code?.source, createdLabel: relativeTime(lesson.createdAt) }}
          to={`/lesson/${lesson.id}`}
          footer={
            <HStack justify='space-between' pt='1' gap='2'>
              <Text fontSize='sm' color='fg.muted'>
                {lesson.rememberCount} remembering
              </Text>
              <Button asChild size='sm' variant='ghost' colorPalette='gray' rounded='full'>
                <Link to={`/lesson/${lesson.id}`}>Open lesson</Link>
              </Button>
            </HStack>
          }
        />
      ))}
      {hasNextPage && (
        <Button alignSelf='center' size='sm' rounded='full' variant='outline' colorPalette='gray' loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
          Show more lessons
        </Button>
      )}
    </Stack>
  );
};

const ProfileSkeleton = () => (
  <Stack gap='6' aria-busy='true' aria-label='Loading'>
    <HStack gap='4'>
      <Box boxSize='16' rounded='full' bg='bg.muted' />
      <Stack gap='2' flex='1'>
        <Box h='6' w='50%' rounded='control' bg='bg.muted' />
        <Box h='3' w='30%' rounded='control' bg='bg.muted' />
      </Stack>
    </HStack>
    <StatTilesSkeleton />
    <FeedSkeleton count={2} />
  </Stack>
);

const ProfilePage = () => {
  const { handle } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "lessons";
  const setTab = (next) => setParams(next === "lessons" ? {} : { tab: next }, { replace: true });

  const profile = useProfile(handle);
  const followers = useFollowers(tab === "followers" ? handle : null);
  const following = useFollowing(tab === "following" ? handle : null);

  if (profile.isPending) {
    return (
      <PageContainer>
        <ProfileSkeleton />
      </PageContainer>
    );
  }
  if (profile.isError) {
    const notFound = profile.error.response?.status === 404;
    return (
      <PageContainer>
        <EmptyState
          title={notFound ? `No one is called @${handle}` : "Could not load this profile"}
          description={notFound ? "Check the handle, or find people on Explore." : "Check your connection and try again."}
          action={
            notFound ? (
              <Button asChild rounded='full'>
                <Link to='/explore'>Explore lessons</Link>
              </Button>
            ) : (
              <Button rounded='full' onClick={() => profile.refetch()}>
                Retry
              </Button>
            )
          }
        />
      </PageContainer>
    );
  }

  const { user, counts, stats, viewer } = profile.data;
  const isSelf = !!viewer?.isSelf;

  return (
    <PageContainer>
      <Stack gap='6'>
        <Stack direction={{ base: "column", sm: "row" }} gap='4' align={{ base: "flex-start", sm: "center" }}>
          <StreakAvatar name={user.name} streak={stats.currentStreak} size='2xl' />
          <Stack gap='1' flex='1' minW='0'>
            <Heading as='h1' textStyle='display' fontSize={{ base: "2xl", md: "3xl" }} overflowWrap='anywhere'>
              {user.name}
            </Heading>
            <Text color='fg.muted' overflowWrap='anywhere'>
              @{user.handle}
            </Text>
          </Stack>
          {isSelf ? (
            <Button asChild rounded='full' variant='outline' colorPalette='gray'>
              <Link to='/settings/profile'>
                <LuPencil />
                Edit profile
              </Link>
            </Button>
          ) : (
            viewer && <FollowButton handle={user.handle} name={user.name} isFollowing={viewer.isFollowing} />
          )}
        </Stack>

        <Stack gap='3'>
          {user.bio && (
            <Text textStyle='lesson' whiteSpace='pre-wrap' overflowWrap='anywhere'>
              {user.bio}
            </Text>
          )}
          <Wrap gap='2'>
            <Badge size='lg' rounded='full' variant='subtle' colorPalette={stats.currentStreak > 0 ? "brand" : "gray"}>
              <Icon boxSize='3.5' color={stats.currentStreak > 0 ? "streak" : undefined}>
                <LuFlame fill={stats.currentStreak > 0 ? "currentColor" : "none"} />
              </Icon>
              {stats.currentStreak}-day streak
              {stats.bestStreak > stats.currentStreak && ` · best ${stats.bestStreak}`}
            </Badge>
            <Badge size='lg' rounded='full' variant='subtle' colorPalette='plum'>
              <Icon boxSize='3.5'>
                <LuTrophy />
              </Icon>
              {stats.mastered} mastered
            </Badge>
            {viewer?.isFollowing && (
              <Badge size='lg' rounded='full' variant='subtle' colorPalette='sage'>
                <Icon boxSize='3.5'>
                  <LuCheck />
                </Icon>
                You follow
              </Badge>
            )}
            <Badge size='lg' rounded='full' variant='outline' colorPalette='gray'>
              <Icon boxSize='3.5'>
                <LuCalendar />
              </Icon>
              Joined {monthYear(user.createdAt)}
            </Badge>
          </Wrap>
        </Stack>

        <SimpleGrid columns={3} gap='3' role='group' aria-label='Show lessons, followers or following'>
          <CountTile label='Lessons' value={counts.lessons} active={tab === "lessons"} onClick={() => setTab("lessons")} />
          <CountTile label='Followers' value={counts.followers} active={tab === "followers"} onClick={() => setTab("followers")} />
          <CountTile label='Following' value={counts.following} active={tab === "following"} onClick={() => setTab("following")} />
        </SimpleGrid>

        <Box>
          {tab === "lessons" && <ProfileLessons handle={user.handle} isSelf={isSelf} name={user.name} />}
          {tab === "followers" && (
            <PeopleList
              query={followers}
              emptyTitle='No followers yet'
              emptyDescription={isSelf ? "Share a lesson people want to remember and they will come." : `Be the first to follow ${user.name}.`}
            />
          )}
          {tab === "following" && (
            <PeopleList
              query={following}
              emptyTitle='Not following anyone yet'
              emptyDescription={isSelf ? "Follow people from their profiles to fill your feed." : `${user.name} does not follow anyone yet.`}
            />
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default ProfilePage;
