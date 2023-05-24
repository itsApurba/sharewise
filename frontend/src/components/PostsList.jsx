import { Center, Divider, Heading, Spinner, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { deletePostByID, getAllPosts } from "../../api/postdata";
import PostCard from "./PostCard";
import { useQuery } from "@tanstack/react-query";

const PostsList = () => {

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getAllPosts
  })

  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  useEffect(() => {
    // getAllPosts().then((res) => {
      // setPostsData(res);
    // });
  }, []);

  const handleDelete = (id) => {
    // console.log(id)
    // setIsLoadingDelete(true);
    // deletePostByID(id).then((res) => {
    //   setPostsData(postsData.filter((post) => post._id !== id));
    // }).catch((err) => {
    //   toast.error(err.response.data);
    // }).finally(() => {
    //   setIsLoadingDelete(false);
    // })
  }

  return (
    <Center maxW={"container.sm"}>
      <VStack>
        <Heading>Posts</Heading>
        <Divider />

        {isLoading ? (
          <Spinner />
        ): (
          postsData?.map((post) => (
            <PostCard key={post._id} post={post} handleDelete={handleDelete} isLoadingDelete={isLoadingDelete} />
          ))
        )}
        
        {/* {postsData?.length <= 0 ? (
          <Spinner />
        ) : (
          <VStack>
            {postsData?.map((post, i) => (
              <PostCard key={i} post={post} handleDelete={handleDelete} isLoadingDelete={isLoadingDelete} />
            ))}
          </VStack>
        )} */}
      </VStack>
    </Center>
  );
};

export default PostsList;
