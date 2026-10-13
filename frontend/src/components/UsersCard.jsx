import {
  Avatar,
  Button,
  ButtonGroup,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Heading,
  Input,
  Portal,
  Separator,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUserById, updateUserByID } from "../../api/userdata";
import { toaster } from "./ui/toaster";
import { useRef, useState } from "react";

const UsersCard = ({ data }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: data.name,
    bio: data.bio,
  });

  const initialRef = useRef(null);
  const { open, onOpen, onClose } = useDisclosure();

  const editMutation = useMutation({
    mutationFn: updateUserByID,
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  });
  console.log(data._id);

  const deleteMutation = useMutation({
    mutationFn: deleteUserById,
    onError: (err) => {
      toaster.error({ title: err.response.data });
    },
  });

  const handleEdit = () => {
    editMutation.mutate({ data, formData });
  };

  const handleDelete = () => {
    deleteMutation.mutate(data._id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: data.name,
      bio: data.bio,
    });
  };

  return (
    <VStack className="usercard outer" w={"max-content"} width={"full"}>
      <HStack w={"full"} justify={"space-between"}>
        <HStack>
          <Avatar.Root size={"md"}>
            <Avatar.Fallback />
          </Avatar.Root>
          <VStack px={2} align={"flex-start"}>
            <Heading fontSize={"lg"} fontWeight={"normal"}>
              Name : {formData.name}
            </Heading>
            <Heading fontSize={"lg"} fontWeight={"normal"}>
              ID : {data._id}
            </Heading>
            <Heading fontSize={"lg"} fontWeight={"normal"}>
              Email : {data.email}
            </Heading>
            <Separator w='full' />
          </VStack>
        </HStack>
        <ButtonGroup>
          <Button onClick={onOpen}>Edit</Button>
          <Button loading={deleteMutation.isPending} onClick={handleDelete} colorPalette='red'>
            Delete
          </Button>
        </ButtonGroup>
      </HStack>
      <Text alignSelf={"flex-start"} px={6}>
        BIO: {formData.bio}
      </Text>
      <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Edit User</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size='sm' />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <Field.Root mb={3}>
                  <Field.Label>Name</Field.Label>
                  <Input ref={initialRef} placeholder='' value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>BIO</Field.Label>
                  <Textarea ref={initialRef} placeholder='' value={formData.bio} onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} />
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
    </VStack>
  );
};

export default UsersCard;
