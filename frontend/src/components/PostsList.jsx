import { Box, Center, Heading, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getAllPosts } from "../../api/postdata";
import PostCard from "./PostCard";

const PostsList = () => {
  const [postsData, setPostsData] = useState([]);

  useEffect(() => {
    getAllPosts().then((res) => {
      setPostsData(res);
    });
  }, []);

  return (
    <Center maxW={'container.sm'}>
      <VStack>
        <Heading>Posts</Heading>
            <VStack>
              {postsData.map((post, i) => (
                <PostCard key={i} post={post} />
              ))}
            </VStack>
      </VStack>
    </Center>
  );
};

export default PostsList;
