import { Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuUserPlus } from "react-icons/lu";
import { Link } from "react-router-dom";
import { apiError } from "../api/client";
import { useNextPath } from "../lib/nextPath";
import EmptyState from "../components/ds/EmptyState";
import { ListSkeleton } from "../components/ds/Skeletons";
import StreakAvatar from "../components/ds/StreakAvatar";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";
import { useMe } from "../hooks/useAuth";
import { useTopTeachers } from "../hooks/useStats";
import { useFollow, useUnfollow } from "../hooks/useUsers";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The step right after sign-up: follow a few people so the feed has something in it. */
const WelcomePage = () => {
  const next = useNextPath();
  const { data: me } = useMe();
  const { data: teachers, isPending, isError } = useTopTeachers();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const [followed, setFollowed] = useState({});
  const [busy, setBusy] = useState(null);

  const suggestions = (teachers ?? []).filter((t) => t.user.handle !== me?.handle);
  const followCount = Object.values(followed).filter(Boolean).length;

  const toggle = (handle) => {
    const isFollowing = !!followed[handle];
    setBusy(handle);
    (isFollowing ? unfollow : follow).mutate(handle, {
      onSuccess: () => setFollowed((prev) => ({ ...prev, [handle]: !isFollowing })),
      onError: (error) => toaster.error({ title: "Could not update follow", description: apiError(error).message }),
      onSettled: () => setBusy(null),
    });
  };

  return (
    <Stack gap='6'>
      <Stack gap='1' textAlign='center'>
        <Text textStyle='label' color='brand.fg'>
          Welcome{me ? `, ${me.name.split(" ")[0]}` : ""}
        </Text>
        <Heading as='h1' textStyle='display'>
          Follow a few teachers
        </Heading>
        <Text color='fg.muted'>Their new lessons land in your feed. Tap “Remember this” on any lesson and it comes back for review.</Text>
      </Stack>

      {isPending ? (
        <ListSkeleton rows={4} />
      ) : isError || suggestions.length === 0 ? (
        <EmptyState title='No suggestions yet' description='Explore lessons and follow the people whose ideas stick.' />
      ) : (
        <Surface p='2'>
          <Stack gap='0'>
            {suggestions.map(({ user, learners, lessons }) => {
              const isFollowing = !!followed[user.handle];
              return (
                <HStack key={user.id} gap='3' px='2' py='3'>
                  <StreakAvatar name={user.name} />
                  <Stack gap='0' flex='1' minW='0'>
                    <Text fontWeight='600' truncate>
                      {user.name}
                    </Text>
                    <Text fontSize='xs' color='fg.muted' truncate>
                      @{user.handle} · {plural(lessons, "lesson")} · taught {plural(learners, "learner")}
                    </Text>
                    {user.bio && (
                      <Text fontSize='sm' color='fg.muted' lineClamp={2} overflowWrap='anywhere'>
                        {user.bio}
                      </Text>
                    )}
                  </Stack>
                  <Button
                    size='sm'
                    rounded='full'
                    flexShrink={0}
                    variant={isFollowing ? "subtle" : "solid"}
                    loading={busy === user.handle}
                    onClick={() => toggle(user.handle)}
                    aria-pressed={isFollowing}
                    aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${user.name}`}
                  >
                    {isFollowing ? <LuCheck /> : <LuUserPlus />}
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </HStack>
              );
            })}
          </Stack>
        </Surface>
      )}

      <Stack gap='2'>
        <Button asChild rounded='full' size='lg'>
          <Link to={next}>{followCount > 0 ? "Go to my feed" : "Continue"}</Link>
        </Button>
        {followCount === 0 && (
          <Text textAlign='center' fontSize='sm' color='fg.muted'>
            You can follow people later from any profile.
          </Text>
        )}
      </Stack>
    </Stack>
  );
};

export default WelcomePage;
