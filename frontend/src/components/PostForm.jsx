import { Button, Field, Heading, Input, Stack, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { createPost } from "../../api/postdata";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "./ui/toaster";
import Surface from "./ds/Surface";

const emptyPost = { user_id: "", content: "" };

const PostForm = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyPost);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      toaster.success({ title: "Post created successfully" });
      setFormData(emptyPost);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      toaster.error({ title: "Could not create the post", description: "Check the user ID and content and try again." });
    },
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCreatePost = (e) => {
    e.preventDefault();
    createPostMutation.mutate({ user_id: formData.user_id.trim(), content: formData.content });
  };

  return (
    <Surface as='form' onSubmit={handleCreatePost}>
      <Heading as='h2' textStyle='title' mb='4'>
        Create post
      </Heading>
      <Stack gap='4'>
        <Field.Root required>
          <Field.Label>
            User ID <Field.RequiredIndicator />
          </Field.Label>
          <Input name='user_id' value={formData.user_id} onChange={handleChange} fontFamily='mono' fontSize='sm' />
        </Field.Root>
        <Field.Root required>
          <Field.Label>
            Content <Field.RequiredIndicator />
          </Field.Label>
          <Textarea name='content' value={formData.content} onChange={handleChange} resize='none' rows={4} maxLength={300} />
        </Field.Root>
        <Button type='submit' rounded='full' loading={createPostMutation.isPending}>
          Create post
        </Button>
      </Stack>
    </Surface>
  );
};

export default PostForm;
