import { Center, Heading, Separator, Spinner, VStack } from "@chakra-ui/react";
import { getAllPosts } from "../../api/postdata";
import PostCard from "./PostCard";
import { useQuery } from "@tanstack/react-query";

const PostsList = () => {

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getAllPosts
  })


  return (
    <Center maxW={"container.sm"}>
      <VStack>
        <Heading size={{ base: "3xl", lg: "4xl" }}>Posts</Heading>
        <Separator w='full' />

        {isLoading ? (
          <Spinner />
        ): (
          postsData?.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </VStack>
    </Center>
  );
};

export default PostsList;
