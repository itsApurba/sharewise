import {
  Avatar,
  Button,
  ButtonGroup,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUserById, updateUserByID } from "../../api/userdata";
import { toast } from "react-toastify";
import { useRef, useState } from "react";

const UsersCard = ({ data }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: data.name,
    bio: data.bio,
  });

  const initialRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const editMutation = useMutation(updateUserByID, {
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      toast.error(err.response.data);
    },
  });
  console.log(data._id);

  const deleteMutation = useMutation(deleteUserById, {
    onError: (err) => {
      toast.error(err.response.data);
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
          <Avatar size={"md"} />
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
            <Divider />
          </VStack>
        </HStack>
        <ButtonGroup>
          <Button onClick={onOpen}>Edit</Button>
          <Button isLoading={deleteMutation.isLoading} onClick={handleDelete} colorScheme='red'>
            Delete
          </Button>
        </ButtonGroup>
      </HStack>
      <Text alignSelf={"flex-start"} px={6}>
        BIO: {formData.bio}
      </Text>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Name</FormLabel>
              <Input ref={initialRef} placeholder='' value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel>BIO</FormLabel>
              <Textarea ref={initialRef} placeholder='' value={formData.bio} onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} />
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
    </VStack>
  );
};

export default UsersCard;
