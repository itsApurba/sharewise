import { Box, Button, Center, Field, Heading, Input, Separator, Stack, Textarea } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { createPost } from "../../api/postdata";
import { useMutation } from "@tanstack/react-query";
import { toaster } from "./ui/toaster";

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

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };
  const handleCreatePost = () => {
    createPostMutation.mutate(formData, {
      onSuccess: () => {
        toaster.success({ title: "Post created successfully" });
        formRef.current.reset();
      },
      onError: () => {
        toaster.error({ title: "Something went wrong" });
      }
    });
  };

  return (
    <Center w={"full"} bg={{ base: "gray.50", _dark: "gray.800" }}>
      <Box rounded={"lg"} bg={{ base: "gray.100", _dark: "gray.900" }} boxShadow={"lg"} p={8}>
        <form ref={formRef} onChange={handleFormChange}>
          <Heading fontSize={"2xl"}>Create / Update Posts</Heading>
          <Separator py={2} />
          <Stack gap={4}>
            <Field.Root id="user_id">
              <Field.Label>User ID</Field.Label>
              <Input type='text' required />
            </Field.Root>
            <Field.Root id="content">
              <Field.Label>Content</Field.Label>
              <Textarea resize={"none"} rounded={"lg"} />
            </Field.Root>
            <Stack>
              <Button
                bg={"blue.400"}
                color={"white"}
                _hover={{
                  bg: "blue.500",
                }}
                onClick={handleCreatePost}
                loading={createPostMutation.isPending}
              >
                Create Post
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
};

export default PostForm;
