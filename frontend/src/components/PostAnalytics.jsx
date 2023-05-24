import { Box, Center, Divider, Flex, Heading, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, useColorModeValue } from '@chakra-ui/react';
import React from 'react'
import { getTopPosts, getTotalPosts } from '../../api/postdata';
import { useQuery } from '@tanstack/react-query';
import { getUserByID } from '../../api/userdata';

const PostAnalytics = () => {

    const totalPosts = useQuery({
        queryKey: ["total-posts"],
        queryFn: getTotalPosts,
    })

    const topPosts = useQuery({
        queryKey: ["top-posts"],
        queryFn: getTopPosts
    })
    
    
  return (
    <Center maxW={"container.sm"}>
      <VStack>
        <Heading>Post Analytics</Heading>
        <Text>Total Posts: {totalPosts.data?.total_posts || 0}</Text>

        <Divider />
        <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={4} maxW={"container.sm"} w={"900vh"} m={"auto"}>
          <Heading textAlign={"center"} fontSize={"2xl"} fontWeight={"light"}>
            Top 5 Posts
          </Heading>
          {topPosts?.isLoading ? (
            <Flex w={"full"} justify={"center"} align={"center"}>
              <Spinner />
            </Flex>
          ) : (
            <Center w={"full"}>
              <TableContainer w={"full"}>
                <Table variant='simple'>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>ID</Th>
                      <Th isNumeric>Total Likes</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {topPosts?.data.map((post) => (
                      <Tr key={post._id}>
                        <Td>{post.name}</Td>
                        <Td>{post.post_id}</Td>
                        <Td isNumeric>{post.likes}</Td>
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
}

export default PostAnalytics