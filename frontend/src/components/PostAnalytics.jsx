import { Box, SimpleGrid } from "@chakra-ui/react";
import { LuNotebookPen } from "react-icons/lu";
import { getTopPosts, getTotalPosts } from "../../api/postdata";
import { useQuery } from "@tanstack/react-query";
import AnalyticsTable from "./AnalyticsTable";
import { PageContainer, PageHeader, SectionHeading } from "./ds/Page";
import StatTile from "./ds/StatTile";

const PostAnalytics = () => {
  const totalPosts = useQuery({
    queryKey: ["total-posts"],
    queryFn: getTotalPosts,
  });

  const topPosts = useQuery({
    queryKey: ["top-posts"],
    queryFn: getTopPosts,
  });

  return (
    <PageContainer>
      <PageHeader eyebrow='Classic' title='Post analytics' />
      <SimpleGrid columns={{ base: 2, md: 3 }} gap='3' mb='8'>
        <StatTile label='Total posts' value={totalPosts.data?.total_posts ?? "–"} icon={<LuNotebookPen />} />
      </SimpleGrid>
      <Box>
        <SectionHeading>Top 5 posts by likes</SectionHeading>
        <AnalyticsTable query={topPosts} rowKey='post_id' nameLabel='Author' idKey='post_id' valueKey='likes' valueLabel='Likes' />
      </Box>
    </PageContainer>
  );
};

export default PostAnalytics;
