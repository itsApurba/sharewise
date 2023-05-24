import { Box, Button, Center, FormControl, FormLabel, Input, Stack, Textarea, useColorModeValue } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { createPost, updatePostByID } from "../../api/postdata";
import { useMutation } from "@tanstack/react-query";

const PostForm = () => {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    userid: "",
    postid: "",
    content: ""
  });

  const createPostMutation = useMutation({
    mutationFn: createPost,
  });
  const updatePostMutation = useMutation({
    mutationFn: updatePostByID,
  });

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };
  const handleCreatePost = () => {
    createPostMutation.mutate(formData, {
      onSuccess: () => {
        formRef.current.reset();
      },
    });
  };

  const handleUpdatePost = () => {
    updatePostMutation.mutate(formData, {
      onSuccess: () => {
        formRef.current.reset();
      },
    });
  };
  return (
    <Center w={"full"} h={"100vh"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={8}>
        <form ref={formRef} onChange={handleFormChange}>
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
                isLoading={createPostMutation.isLoading}
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
                isLoading={updatePostMutation.isLoading}
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
