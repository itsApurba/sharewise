import { Box, Button, Center, FormControl, FormLabel, Input, Stack, Textarea, useColorModeValue } from "@chakra-ui/react";
import React, { useState } from "react";
import { createPost, updatePostByID } from "../../api/postdata";

const PostForm = () => {
  const [postData, setPostData] = useState({
    userid: "",
    postid: "",
    content: "",
    isCreating: false,
    isUpdating: false,
  });

  const handleFormChange = (e) => {
    setPostData({
      ...postData,
      [e.target.id]: e.target.value,
    });
  };
  const handleCreatePost = () => {
    setPostData({
      ...postData,
      isCreating: true,
    });
    createPost(postData)
      .then((res) => {
        setPostData({
          ...postData,
        });
      })
      .finally(() => {
        setPostData({
          ...postData,
          isCreating: false,
        });
      });
  };

  const handleUpdatePost = () => {
    setPostData({
      ...postData,
      isUpdating: true,
    });
    updatePostByID(postData)
      .then((res) => {
        setPostData({
          ...postData,
        });
      })
      .finally(() => {
        setPostData({
          ...postData,
          isUpdating: false,
        });
      });
  };
  return (
    <Center w={"full"} h={"100vh"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={8}>
        <form onChange={handleFormChange}>
          <Stack spacing={4}>
            <FormControl id='post_id'>
              <FormLabel>Post ID</FormLabel>
              <Input type='text' required />
            </FormControl>
            <FormControl id='user_id'>
              <FormLabel>User ID</FormLabel>
              <Input type='text' required />
            </FormControl>
            <FormControl id='content'>
              <FormLabel>Content</FormLabel>
              <Textarea resize={"none"} rounded={"lg"} />
            </FormControl>
            <Stack>
              <Button
                bg={"blue.400"}
                color={"white"}
                _hover={{
                  bg: "blue.500",
                }}
                onClick={handleCreatePost}
                isLoading={postData.isCreating}
              >
                Create Post
              </Button>
              <Button
                variant='outline'
                color={useColorModeValue("blackAlpha.900", "white")}
                _hover={{
                  bg: "blue.400",
                }}
                onClick={handleUpdatePost}
                isLoading={postData.isUpdating}
              >
                Update Post
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
};

export default PostForm;
