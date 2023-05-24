import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  Spinner,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopUsers, getTotalUsers } from "../../api/userdata";

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
        <Heading>User Analytics</Heading>
        <Text>Total Users: {totalUsers.data?.userCount || 0}</Text>

        <Divider />
        <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={4} maxW={"container.sm"} w={"900vh"} m={"auto"}>
          <Heading textAlign={"center"} fontSize={"2xl"} fontWeight={"light"}>
            Top 5 Users
          </Heading>
          {topUsers?.isLoading ? (
            <Flex w={"full"} justify={"center"} align={"center"}>
              <Spinner />
            </Flex>
          ) : (
            <Center w={"full"}>
              <TableContainer w={"full"}>
                <Table variant='simple'>
                  {/* <TableCaption>Top {topUsers?.data.length} Users Based on posts count</TableCaption> */}
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>ID</Th>
                      <Th isNumeric>Total Posts</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {topUsers?.data.map((user) => (
                      <Tr key={user._id}>
                        <Td>{user.name}</Td>
                        <Td>{user.user_id}</Td>
                        <Td isNumeric>{user.post_count}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Center>
          )}
        </Box>
      </VStack>
    </Center>
  );
};

export default UserAnalytics;
