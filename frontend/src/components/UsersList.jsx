import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../api/userdata";
import { Center, Heading, Separator, Spinner, VStack } from "@chakra-ui/react";
import UsersCard from "./UsersCard";

const UsersList = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });
  return (
    <Center maxW={"container.lg"}>
      <VStack w={"60vw"} className='userlist_vstack'>
        <Heading size={{ base: "3xl", lg: "4xl" }}>Users</Heading>
        <Separator w='full' />

        {isLoading ? <Spinner /> : users?.map((user) => <UsersCard key={user._id} data={user} />)}
      </VStack>
    </Center>
  );
};

export default UsersList;
