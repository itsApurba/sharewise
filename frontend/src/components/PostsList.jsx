import { Button, Stack } from "@chakra-ui/react";
import { LuNotebookPen } from "react-icons/lu";
import { Link } from "react-router-dom";
import { getAllPosts } from "../../api/postdata";
import PostCard from "./PostCard";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "./ds/EmptyState";
import { PageContainer, PageHeader } from "./ds/Page";
import { FeedSkeleton } from "./ds/Skeletons";

const PostsList = () => {
  const { data: postsData, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: getAllPosts,
  });

  return (
    <PageContainer>
      <PageHeader eyebrow='Your feed' title='Feed' description='New lessons from the community, newest first.' />
      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <EmptyState title='Could not load the feed' description='The server did not answer. Check your connection and try again.' />
      ) : postsData?.length ? (
        <Stack gap='4'>
          {postsData.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon={<LuNotebookPen />}
          title='No posts yet'
          description='Be the first to share something you learned.'
          action={
            <Button asChild rounded='full'>
              <Link to='/create'>Write the first post</Link>
            </Button>
          }
        />
      )}
    </PageContainer>
  );
};

export default PostsList;
