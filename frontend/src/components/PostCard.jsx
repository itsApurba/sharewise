import { Button, CloseButton, Dialog, Field, HStack, IconButton, Menu, Portal, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { LuEllipsis, LuPencil, LuThumbsDown, LuThumbsUp, LuTrash2 } from "react-icons/lu";
import { getUserByID } from "../legacy-api/userdata";
import { deletePostByID, dislikePost, likePost } from "../legacy-api/postdata";
import { toaster } from "./ui/toaster";
import { updatePostByID } from "../legacy-api/postdata";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LessonCard from "./ds/LessonCard";

const errorTitle = (err) => (typeof err.response?.data === "string" && err.response.data) || "Something went wrong";

const PostCard = ({ post }) => {
  const queryClient = useQueryClient();
  const user = useQuery({
    queryKey: ["user", post.user_id],
    queryFn: () => getUserByID(post.user_id),
  });
  const { open, onOpen, onClose } = useDisclosure();
  const [likes, setLikes] = useState(post.likes);
  const [content, setContent] = useState(post.content);
  const [draft, setDraft] = useState(post.content);

  const onError = (err) => toaster.error({ title: errorTitle(err) });
  const likeMutation = useMutation({ mutationFn: likePost, onError });
  const dislikeMutation = useMutation({ mutationFn: dislikePost, onError });
  const editMutation = useMutation({ mutationFn: updatePostByID, onError });
  const deleteMutation = useMutation({ mutationFn: deletePostByID, onError });

  const handleLike = () => likeMutation.mutate(post._id, { onSuccess: () => setLikes((n) => n + 1) });
  const handleDislike = () => dislikeMutation.mutate(post._id, { onSuccess: () => setLikes((n) => n - 1) });
  const handleEdit = () =>
    editMutation.mutate(
      { id: post._id, content: draft },
      {
        onSuccess: () => {
          setContent(draft);
          onClose();
        },
      },
    );
  const handleClose = () => {
    onClose();
    setDraft(content);
  };
  const handleDelete = () =>
    deleteMutation.mutate(post._id, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
    });

  const author = user.isLoading ? { name: "Loading…" } : { name: user.data?.name || "Deleted user" };
  const createdLabel = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : undefined;

  return (
    <>
      <LessonCard
        lesson={{ body: content, author, createdLabel }}
        headerAction={
          <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Menu.Trigger asChild>
              <IconButton variant='ghost' colorPalette='gray' size='sm' aria-label='Post options' loading={deleteMutation.isPending}>
                <LuEllipsis />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value='edit' onClick={onOpen}>
                    <LuPencil />
                    Edit
                  </Menu.Item>
                  <Menu.Item value='delete' color='fg.error' _hover={{ bg: "bg.error", color: "fg.error" }} onClick={handleDelete}>
                    <LuTrash2 />
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        }
        footer={
          <HStack justify='space-between' pt='1' gap='2'>
            <HStack gap='2'>
              <Button size='sm' variant='outline' rounded='full' loading={likeMutation.isPending} onClick={handleLike}>
                <LuThumbsUp />
                Like
              </Button>
              <IconButton size='sm' variant='ghost' colorPalette='gray' rounded='full' aria-label='Unlike' loading={dislikeMutation.isPending} onClick={handleDislike}>
                <LuThumbsDown />
              </IconButton>
            </HStack>
            <Text fontSize='sm' color='fg.muted'>
              {likes} {likes === 1 ? "like" : "likes"}
            </Text>
          </HStack>
        }
      />
      <Dialog.Root open={open} onOpenChange={(e) => !e.open && handleClose()} placement='center'>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner px='4'>
            <Dialog.Content rounded='card'>
              <Dialog.Header>
                <Dialog.Title fontFamily='heading'>Edit post</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size='sm' />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <Field.Root>
                  <Field.Label>Content</Field.Label>
                  <Textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
                </Field.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant='ghost' colorPalette='gray' onClick={handleClose}>
                  Cancel
                </Button>
                <Button loading={editMutation.isPending} onClick={handleEdit}>
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default PostCard;
