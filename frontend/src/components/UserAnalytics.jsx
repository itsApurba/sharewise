import { Box, SimpleGrid } from "@chakra-ui/react";
import { LuUsers } from "react-icons/lu";
import { getTopUsers, getTotalUsers } from "../legacy-api/userdata";
import { useQuery } from "@tanstack/react-query";
import AnalyticsTable from "./AnalyticsTable";
import { PageContainer, PageHeader, SectionHeading } from "./ds/Page";
import StatTile from "./ds/StatTile";

const UserAnalytics = () => {
  const totalUsers = useQuery({
    queryKey: ["total-users"],
    queryFn: getTotalUsers,
  });

  const topUsers = useQuery({
    queryKey: ["top-users"],
    queryFn: getTopUsers,
  });

  return (
    <PageContainer>
      <PageHeader eyebrow='Classic' title='User analytics' />
      <SimpleGrid columns={{ base: 2, md: 3 }} gap='3' mb='8'>
        <StatTile label='Total users' value={totalUsers.data?.userCount ?? "–"} icon={<LuUsers />} />
      </SimpleGrid>
      <Box>
        <SectionHeading>Top 5 users by posts</SectionHeading>
        <AnalyticsTable query={topUsers} rowKey='user_id' nameLabel='Name' idKey='user_id' valueKey='post_count' valueLabel='Posts' />
      </Box>
    </PageContainer>
  );
};

export default UserAnalytics;
