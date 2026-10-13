import { Box, Button, Center, Field, Heading, Input, Separator, Stack, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { createUser } from "../../api/userdata";
import { toaster } from "./ui/toaster";

const UserForm = () => {
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    bio: "",
    isCreating: false,
    isUpdating: false,
    error: "",
  });

  const handleFormChange = (e) => {
    setUserData({
      ...userData,
      [e.target.id]: e.target.value,
    });
  };

  const handleCreateUser = () => {
    setUserData({
      ...userData,
      isCreating: true,
    });
    createUser(userData)
      .then(() => {
        setUserData({
          ...userData,
        });
        toaster.success({ title: "User created successfully" });
      })
      .finally(() => {
        setUserData({
          ...userData,
          isCreating: false,
        });
      });
  };

  return (
    <Center w={"full"} bg={{ base: "gray.50", _dark: "gray.800" }}>
      <Box rounded={"lg"} bg={{ base: "gray.100", _dark: "gray.900" }} boxShadow={"lg"} p={8}>
        <Heading fontSize={"2xl"}>Create / Update user</Heading>
        <Separator py={2} />
        <form onChange={handleFormChange}>
          <Stack gap={4}>
            <Field.Root id="name">
              <Field.Label>Name</Field.Label>
              <Input type='text' />
            </Field.Root>
            <Field.Root id="email">
              <Field.Label>Email</Field.Label>
              <Input type='email' />
            </Field.Root>
            <Field.Root id="bio">
              <Field.Label>Bio</Field.Label>
              <Textarea resize={"none"} rounded={"lg"} />
            </Field.Root>
            <Stack>
              <Button
                loading={userData.isCreating}
                bg={"blue.400"}
                color={"white"}
                _hover={{
                  bg: "blue.500",
                }}
                onClick={handleCreateUser}
              >
                Create User
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
};

export default UserForm;
