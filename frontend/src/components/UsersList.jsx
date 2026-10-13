import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../api/userdata";
import { Stack } from "@chakra-ui/react";
import { LuUsers } from "react-icons/lu";
import UsersCard from "./UsersCard";
import EmptyState from "./ds/EmptyState";
import { PageContainer, PageHeader } from "./ds/Page";
import { ListSkeleton } from "./ds/Skeletons";

const UsersList = () => {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });
  return (
    <PageContainer>
      <PageHeader eyebrow='Classic' title='Users' description='Everyone on Sharewise. Copy a user ID to post as them.' />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState title='Could not load users' description='The server did not answer. Try again in a moment.' />
      ) : users?.length ? (
        <Stack gap='3'>
          {users.map((user) => (
            <UsersCard key={user._id} data={user} />
          ))}
        </Stack>
      ) : (
        <EmptyState icon={<LuUsers />} title='No users yet' description='Create one from the Create page.' />
      )}
    </PageContainer>
  );
};

export default UsersList;
