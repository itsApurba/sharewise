import {
  Button,
  ButtonGroup,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { getUserByID } from "../../api/userdata";
import { deletePostByID, dislikePost, likePost } from "../../api/postdata";
import { toast } from "react-toastify";
import { updatePostByID } from "../../api/postdata";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PostCard = ({ post, isLoadingDelete }) => {
  const queryClient = useQueryClient()
  const user = useQuery({
    queryKey: ["user", post._id],
    queryFn: () => getUserByID(post.user_id),
  });
  const initialRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [likes, setLikes] = useState(post.likes);
  const [content, setContent] = useState(post.content);

  const likeMutation = useMutation(likePost, {
    onError: (err) => {
      toast.error(err.response.data);
    },
  });
  const dislikeMutation = useMutation(dislikePost, {
    onError: (err) => {
      toast.error(err.response.data);
    },
  });
  const editMutation = useMutation(updatePostByID, {
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      toast.error(err.response.data);
    },
  })

  const deleteMutation = useMutation(deletePostByID, {
    onError: (err) => {
      toast.error(err.response.data);
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
          {user.isLoading ? <Skeleton height='20px' width='100px' /> : <Text>By: {user.data?.name}</Text>}
        </HStack>
        <HStack w='full' justify={"space-between"}>
          <ButtonGroup variant='outline' spacing='2'>
            <Button isLoading={likeMutation.isLoading} onClick={handleLike}>
              Like
            </Button>
            <Button isLoading={dislikeMutation.isLoading} onClick={handleDislike}>
              Dislike
            </Button>
          </ButtonGroup>
          <ButtonGroup variant='outline' spacing='2'>
            <Button onClick={onOpen}>Edit</Button>
            <Button isLoading={deleteMutation.isLoading} colorScheme='red' onClick={() => handleDelete(post._id)}>
              Delete
            </Button>
          </ButtonGroup>
        </HStack>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Content</FormLabel>
              <Textarea ref={initialRef} placeholder='First name' value={content} onChange={(e) => setContent(e.target.value)} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={handleClose}>
              Close
            </Button>
            <Button isLoading={editMutation.isLoading} variant='ghost' onClick={handleEdit}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Divider />
    </>
  );
};

export default PostCard;
