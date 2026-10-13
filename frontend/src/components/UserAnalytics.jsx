import { Box, Center, Flex, Heading, Separator, Spinner, Table, Text, VStack } from "@chakra-ui/react";
import { getTopUsers, getTotalUsers } from "../../api/userdata";
import { useQuery } from "@tanstack/react-query";

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
    <Center maxW={"container.sm"}>
      <VStack>
        <Heading size={{ base: "3xl", lg: "4xl" }}>User Analytics</Heading>
        <Text>Total Users: {totalUsers.data?.userCount || 0}</Text>

        <Separator w='full' />
        <Box rounded={"lg"} bg={{ base: "gray.100", _dark: "gray.900" }} boxShadow={"lg"} p={4} maxW={"container.sm"} w={"900vh"} m={"auto"}>
          <Heading textAlign={"center"} fontSize={"2xl"} fontWeight={"light"}>
            Top 5 Users
          </Heading>
          {topUsers?.isLoading ? (
            <Flex w={"full"} justify={"center"} align={"center"}>
              <Spinner />
            </Flex>
          ) : (
            <Center w={"full"}>
              <Table.ScrollArea w={"full"}>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Name</Table.ColumnHeader>
                      <Table.ColumnHeader>ID</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign='end'>Total Posts</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {topUsers?.data.map((user) => (
                      <Table.Row key={user._id}>
                        <Table.Cell>{user.name}</Table.Cell>
                        <Table.Cell>{user.user_id}</Table.Cell>
                        <Table.Cell textAlign='end'>{user.post_count}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
            </Center>
          )}
        </Box>
      </VStack>
    </Center>
  );
};

export default UserAnalytics;
