import { HStack, Skeleton, SkeletonCircle, Stack } from "@chakra-ui/react";
import { LessonCardSkeleton } from "./LessonCard";
import Surface from "./Surface";

/** A column of lesson-card placeholders for a loading feed. */
export const FeedSkeleton = ({ count = 3 }) => (
  <Stack gap='4' aria-busy='true' aria-label='Loading'>
    {Array.from({ length: count }, (_, i) => (
      <LessonCardSkeleton key={i} />
    ))}
  </Stack>
);

/** Rows of avatar + two lines, for people lists and leaderboards. */
export const ListSkeleton = ({ rows = 4 }) => (
  <Surface aria-busy='true' aria-label='Loading'>
    <Stack gap='4'>
      {Array.from({ length: rows }, (_, i) => (
        <HStack key={i} gap='3'>
          <SkeletonCircle size='10' />
          <Stack gap='1.5' flex='1'>
            <Skeleton h='3' w='40%' />
            <Skeleton h='2.5' w='60%' />
          </Stack>
          <Skeleton h='4' w='8' />
        </HStack>
      ))}
    </Stack>
  </Surface>
);

/** Placeholder for a row of stat tiles. */
export const StatTilesSkeleton = ({ count = 3 }) => (
  <HStack gap='3' aria-busy='true' aria-label='Loading'>
    {Array.from({ length: count }, (_, i) => (
      <Surface key={i} flex='1'>
        <Skeleton h='3' w='60%' mb='3' />
        <Skeleton h='7' w='40%' />
      </Surface>
    ))}
  </HStack>
);
