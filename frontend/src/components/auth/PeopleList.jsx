import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { LuUsers } from "react-icons/lu";
import { Link } from "react-router-dom";
import EmptyState from "../ds/EmptyState";
import { ListSkeleton } from "../ds/Skeletons";
import StreakAvatar from "../ds/StreakAvatar";
import Surface from "../ds/Surface";

/** A paged list of PublicUsers from an infinite query (followers or following). */
const PeopleList = ({ query, emptyTitle, emptyDescription }) => {
  const { data, isPending, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = query;
  if (isPending) return <ListSkeleton rows={3} />;
  if (isError) {
    return (
      <EmptyState
        title='Could not load people'
        description='Check your connection and try again.'
        action={
          <Button size='sm' rounded='full' variant='outline' colorPalette='gray' onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  const people = data.pages.flatMap((page) => page.items);
  if (people.length === 0) return <EmptyState icon={<LuUsers />} title={emptyTitle} description={emptyDescription} />;

  return (
    <Stack gap='3'>
      <Surface p='1'>
        {people.map((person) => (
          <Link key={person.id} to={`/u/${person.handle}`}>
            <HStack gap='3' px='3' py='3' rounded='control' _hover={{ bg: "bg.muted" }}>
              <StreakAvatar name={person.name} />
              <Stack gap='0' flex='1' minW='0'>
                <Text fontWeight='600' truncate>
                  {person.name}
                </Text>
                <Text fontSize='xs' color='fg.muted' truncate>
                  @{person.handle}
                  {person.bio ? ` · ${person.bio}` : ""}
                </Text>
              </Stack>
            </HStack>
          </Link>
        ))}
      </Surface>
      {hasNextPage && (
        <Button alignSelf='center' size='sm' rounded='full' variant='outline' colorPalette='gray' loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
          Show more
        </Button>
      )}
    </Stack>
  );
};

export default PeopleList;
