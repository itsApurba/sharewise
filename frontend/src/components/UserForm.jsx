import { Box, Button, Center, Checkbox, Divider, FormControl, FormLabel, Heading, Input, Link, Stack, Textarea, useColorModeValue } from "@chakra-ui/react";
import React, { useState } from "react";
import { createUser, updateUserByID } from "../../api/userdata";
import { toast } from "react-toastify";

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
      .then((res) => {
        setUserData({
          ...userData,
        });
        toast.success("User created successfully");
      })
      .finally(() => {
        setUserData({
          ...userData,
          isCreating: false,
        });
      });
  };

  const handleUpdateUser = () => {
    setUserData({
      ...userData,
      isUpdating: true,
    });
    updateUserByID(userData)
      .then((res) => {
        setUserData({
          ...userData,
        });
      })
      .finally(() => {
        setUserData({
          ...userData,
          isUpdating: false,
        });
      });
  };

  return (
    <Center w={"full"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Box rounded={"lg"} bg={useColorModeValue("gray.100", "gray.900")} boxShadow={"lg"} p={8}>
        <Heading fontSize={"2xl"}>Create / Update user</Heading>
        <Divider py={2} />
        <form onChange={handleFormChange}>
          <Stack spacing={4}>
            {/* <FormControl id='id'>
              <FormLabel>ID</FormLabel>
              <Input type='text' />
            </FormControl> */}
            <FormControl id='name'>
              <FormLabel>Name</FormLabel>
              <Input type='text' />
            </FormControl>
            <FormControl id='email'>
              <FormLabel>Email</FormLabel>
              <Input type='email' />
            </FormControl>
            <FormControl id='bio'>
              <FormLabel>Bio</FormLabel>
              <Textarea resize={"none"} rounded={"lg"} />
            </FormControl>
            <Stack>
              <Button
                isLoading={userData.isCreating}
                bg={"blue.400"}
                color={"white"}
                _hover={{
                  bg: "blue.500",
                }}
                onClick={handleCreateUser}
              >
                Create User
              </Button>
              {/* <Button
                isLoading={userData.isUpdating}
                variant='outline'
                color={"white"}
                _hover={{
                  bg: "blue.400",
                }}
                onClick={handleUpdateUser}
              >
                Update User
              </Button> */}
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
};

export default UserForm;
