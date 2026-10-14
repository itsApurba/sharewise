import { Button, CloseButton, Code, Dialog, Field, HStack, Input, Portal, Stack, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { deleteUserById, updateUserByID } from "../../api/userdata";
import { toaster } from "./ui/toaster";
import { useState } from "react";
import StreakAvatar from "./ds/StreakAvatar";
import Surface from "./ds/Surface";

const errorTitle = (err) => (typeof err.response?.data === "string" && err.response.data) || "Something went wrong";

const UsersCard = ({ data }) => {
  const queryClient = useQueryClient();
  const saved = { name: data.name, bio: data.bio ?? "" };
  const [profile, setProfile] = useState(saved);
  const [formData, setFormData] = useState(saved);
  const { open, onOpen, onClose } = useDisclosure();

  const editMutation = useMutation({
    mutationFn: updateUserByID,
    onSuccess: () => {
      setProfile(formData);
      onClose();
    },
    onError: (err) => toaster.error({ title: errorTitle(err) }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: (err) => toaster.error({ title: errorTitle(err) }),
  });

  const handleClose = () => {
    onClose();
    setFormData(profile);
  };

  return (
    <Surface>
      <Stack gap='3'>
        <HStack gap='3' align='flex-start' minW='0'>
          <StreakAvatar name={profile.name} />
          <Stack gap='0.5' minW='0' flex='1'>
            <Text fontWeight='600' overflowWrap='anywhere'>
              {profile.name}
            </Text>
            <Text fontSize='sm' color='fg.muted' overflowWrap='anywhere'>
              {data.email}
            </Text>
            <Code size='sm' variant='surface' colorPalette='gray' w='fit-content' maxW='full' overflowWrap='anywhere' whiteSpace='normal'>
              {data._id}
            </Code>
          </Stack>
        </HStack>
        {profile.bio && <Text overflowWrap='anywhere'>{profile.bio}</Text>}
        <HStack gap='2' justify='flex-end'>
          <Button size='sm' variant='outline' colorPalette='gray' rounded='full' onClick={onOpen}>
            <LuPencil />
            Edit
          </Button>
          <Button size='sm' variant='subtle' colorPalette='clay' rounded='full' loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(data._id)}>
            <LuTrash2 />
            Delete
          </Button>
        </HStack>
      </Stack>
      <Dialog.Root open={open} onOpenChange={(e) => !e.open && handleClose()} placement='center'>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner px='4'>
            <Dialog.Content rounded='card'>
              <Dialog.Header>
                <Dialog.Title fontFamily='heading'>Edit user</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size='sm' />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <Stack gap='4'>
                  <Field.Root>
                    <Field.Label>Name</Field.Label>
                    <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Bio</Field.Label>
                    <Textarea value={formData.bio} onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant='ghost' colorPalette='gray' onClick={handleClose}>
                  Cancel
                </Button>
                <Button loading={editMutation.isPending} onClick={() => editMutation.mutate({ data, formData })}>
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Surface>
  );
};

export default UsersCard;
