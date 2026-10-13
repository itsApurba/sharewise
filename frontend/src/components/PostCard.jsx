import {
  Button,
  CloseButton,
  ButtonGroup,
  Dialog,
  Field,
  HStack,
  Portal,
  Separator,
  Skeleton,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { getUserByID } from "../../api/userdata";
import { deletePostByID, dislikePost, likePost } from "../../api/postdata";
import { toaster } from "./ui/toaster";
import { updatePostByID } from "../../api/postdata";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PostCard = ({ post }) => {
  const queryClient = useQueryClient()
  const user = useQuery({
    queryKey: ["user", post._id],
    queryFn: () => getUserByID(post.user_id),
  });
  const initialRef = useRef(null);
  const { open, onOpen, onClose } = useDisclosure();
  const [likes, setLikes] = useState(post.likes);
  const [content, setContent] = useState(post.content);

  const likeMutation = useMutation({
    mutationFn: likePost,
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  });
  const dislikeMutation = useMutation({
    mutationFn: dislikePost,
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  });
  const editMutation = useMutation({
    mutationFn: updatePostByID,
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePostByID,
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  })

  const handleLike = () => {
    likeMutation.mutate(post._id, {
      onSuccess: () => {
        setLikes(likes + 1);
      },
    });
  };
  const handleDislike = () => {
    dislikeMutation.mutate(post._id, {
      onSuccess: () => {
        setLikes(likes - 1);
      },
    });
  };
  const handleEdit = () => {
    editMutation.mutate({
      id: post._id,
      content,
    })
  };

  const handleClose = () => {
    onClose();
    setContent(post.content);
  };

  const handleDelete = () => {
    deleteMutation.mutate(post._id,{
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    });
  }

  return (
    <>
      <VStack align={"flex-start"} w={"90vw"} maxW={'container.sm'}>
        <Text>{content}</Text>
        <HStack justify={"space-between"} w={"full"}>
          <Text>Likes: {likes}</Text>
          {user.isLoading ? <Skeleton height='20px' width='100px' /> : <Text>By: {user.data?.name || "DeletedUser"}</Text>}
        </HStack>
        <HStack w='full' justify={"space-between"}>
          <ButtonGroup variant='outline' gap='2'>
            <Button loading={likeMutation.isPending} onClick={handleLike}>
              Like
            </Button>
            <Button loading={dislikeMutation.isPending} onClick={handleDislike}>
              Dislike
            </Button>
          </ButtonGroup>
          <ButtonGroup variant='outline' gap='2'>
            <Button onClick={onOpen}>Edit</Button>
            <Button loading={deleteMutation.isPending} colorPalette='red' onClick={() => handleDelete(post._id)}>
              Delete
            </Button>
          </ButtonGroup>
        </HStack>
      </VStack>
      <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Edit Post</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size='sm' />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <Field.Root>
                  <Field.Label>Content</Field.Label>
                  <Textarea ref={initialRef} placeholder='First name' value={content} onChange={(e) => setContent(e.target.value)} />
                </Field.Root>
              </Dialog.Body>

              <Dialog.Footer>
                <Button colorPalette='blue' mr={3} onClick={handleClose}>
                  Close
                </Button>
                <Button loading={editMutation.isPending} variant='ghost' onClick={handleEdit}>
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Separator w='full' />
    </>
  );
};

export default PostCard;
