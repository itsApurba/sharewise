import { Button, Field, Heading, Input, Stack, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../../api/userdata";
import { toaster } from "./ui/toaster";
import Surface from "./ds/Surface";

const emptyUser = { name: "", email: "", bio: "" };

const UserForm = () => {
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState(emptyUser);

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toaster.success({ title: "User created successfully" });
      setUserData(emptyUser);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      const message = typeof err.response?.data === "string" ? err.response.data : err.response?.data?.message;
      toaster.error({ title: "Could not create the user", description: message || "Check the name and email and try again." });
    },
  });

  const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value });
  const handleCreateUser = (e) => {
    e.preventDefault();
    createUserMutation.mutate(userData);
  };

  return (
    <Surface as='form' onSubmit={handleCreateUser}>
      <Heading as='h2' textStyle='title' mb='4'>
        Create user
      </Heading>
      <Stack gap='4'>
        <Field.Root required>
          <Field.Label>
            Name <Field.RequiredIndicator />
          </Field.Label>
          <Input name='name' value={userData.name} onChange={handleChange} autoComplete='name' />
        </Field.Root>
        <Field.Root required>
          <Field.Label>
            Email <Field.RequiredIndicator />
          </Field.Label>
          <Input name='email' type='email' value={userData.email} onChange={handleChange} autoComplete='email' />
        </Field.Root>
        <Field.Root>
          <Field.Label>Bio</Field.Label>
          <Textarea name='bio' value={userData.bio} onChange={handleChange} resize='none' rows={3} />
        </Field.Root>
        <Button type='submit' rounded='full' loading={createUserMutation.isPending}>
          Create user
        </Button>
      </Stack>
    </Surface>
  );
};

export default UserForm;
