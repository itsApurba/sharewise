import { Box, Center, Flex, Heading, Separator, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { getTopPosts, getTotalPosts } from '../../api/postdata';
import { useQuery } from '@tanstack/react-query';

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
        <Heading size={{ base: "3xl", lg: "4xl" }}>Post Analytics</Heading>
        <Text>Total Posts: {totalPosts.data?.total_posts || 0}</Text>

        <Separator w='full' />
        <Box rounded={"lg"} bg={{ base: "gray.100", _dark: "gray.900" }} boxShadow={"lg"} p={4} maxW={"container.sm"} w={"900vh"} m={"auto"}>
          <Heading textAlign={"center"} fontSize={"2xl"} fontWeight={"light"}>
            Top 5 Posts
          </Heading>
          {topPosts?.isLoading ? (
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
                      <Table.ColumnHeader textAlign='end'>Total Likes</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {topPosts?.data.map((post) => (
                      <Table.Row key={post._id}>
                        <Table.Cell>{post.name}</Table.Cell>
                        <Table.Cell>{post.post_id}</Table.Cell>
                        <Table.Cell textAlign='end'>{post.likes}</Table.Cell>
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
}

export default PostAnalytics
