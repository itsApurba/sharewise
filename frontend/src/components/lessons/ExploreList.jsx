import { Button, Stack } from "@chakra-ui/react";
import { LuNotebookPen, LuRefreshCw } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useExplore } from "../../hooks/useLessons";
import EmptyState from "../ds/EmptyState";
import { FeedSkeleton } from "../ds/Skeletons";
import LessonItem from "./LessonItem";
import LoadMore from "./LoadMore";

/** Everyone's lessons, newest first, optionally for one tag, with infinite scroll. */
const ExploreList = ({ tag }) => {
  const query = useExplore(tag);
  const lessons = query.data?.pages.flatMap((page) => page.items) ?? [];
  const unique = lessons.filter((lesson, index) => lessons.findIndex((other) => other.id === lesson.id) === index);

  if (query.isPending) return <FeedSkeleton />;
  if (query.isError) {
    return (
      <EmptyState
        icon={<LuRefreshCw />}
        title='Could not load lessons'
        description='The server did not answer. Check your connection and try again.'
        action={
          <Button rounded='full' variant='outline' colorPalette='gray' onClick={() => query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }
  if (unique.length === 0) {
    return (
      <EmptyState
        icon={<LuNotebookPen />}
        title={tag ? `No lessons tagged #${tag} yet` : "No lessons yet"}
        description='Be the first to teach something small and useful.'
        action={
          <Button asChild rounded='full'>
            <Link to='/new'>Write a lesson</Link>
          </Button>
        }
      />
    );
  }
  return (
    <Stack gap='4'>
      {unique.map((lesson) => (
        <LessonItem key={lesson.id} lesson={lesson} />
      ))}
      <LoadMore query={query} endLabel="That's every lesson so far." />
    </Stack>
  );
};

export default ExploreList;
