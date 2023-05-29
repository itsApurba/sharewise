import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../api/userdata";
import { Center, Divider, Heading, Spinner, VStack } from "@chakra-ui/react";
import UsersCard from "./UsersCard";

const UsersList = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });
  return (
    <Center maxW={"container.lg"}>
      <VStack w={"60vw"} className='userlist_vstack'>
        <Heading>Users</Heading>
        <Divider />

        {isLoading ? <Spinner /> : users?.map((user) => <UsersCard key={user._id} data={user} />)}
      </VStack>
    </Center>
  );
};

export default UsersList;
