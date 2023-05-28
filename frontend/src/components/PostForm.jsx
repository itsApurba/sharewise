import { Box, Button, Center, Divider, FormControl, FormLabel, Heading, Input, Stack, Textarea, useColorModeValue } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { createPost, updatePostByID } from "../../api/postdata";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

const PostForm = () => {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    userid: "",
    postid: "",
    content: ""
  });

  const createPostMutation = useMutation({
    mutationFn: createPost,
  }, {
    onSuccess: () => {
      
    },
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
        toast.success("Post created successfully");
        formRef.current.reset();
      },
      onError: (err) => {
        toast.error("Something went wrong");
      }
    });
  };

  // const handleUpdatePost = () => {
  //   updatePostMutation.mutate(formData, {
  //     onSuccess: () => {
  //       formRef.current.reset();
  //     },
  //   });
  // };
  return (
    <Center w={"full"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={8}>
        <form ref={formRef} onChange={handleFormChange}>
          <Heading fontSize={"2xl"}>Create / Update Posts</Heading>
          <Divider py={2} />
          <Stack spacing={4}>
            {/* <FormControl id='post_id'>
              <FormLabel>Post ID</FormLabel>
              <Input type='text' required />
            </FormControl> */}
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
              {/* <Button
                variant='outline'
                color={useColorModeValue("blackAlpha.900", "white")}
                _hover={{
                  bg: "blue.400",
                }}
                onClick={handleUpdatePost}
                isLoading={updatePostMutation.isLoading}
              >
                Update Post
              </Button> */}
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
};

export default PostForm;
