import { Box, HStack, Text } from "@chakra-ui/react";
import ActivityHeatmap from "../ds/ActivityHeatmap";
import Surface from "../ds/Surface";
import { useActivity } from "../../hooks/useActivity";

const DAYS = 84;

/** The twelve-week review heatmap for a handle, in a card with totals. */
const ActivityPanel = ({ handle, title = "Review activity" }) => {
  const { data, isPending, isError } = useActivity(handle, DAYS);
  return (
    <Surface>
      <HStack justify='space-between' align='baseline' mb='4' gap='3' wrap='wrap'>
        <Text textStyle='title'>{title}</Text>
        {data && (
          <Text fontSize='sm' color='fg.muted'>
            {data.total} {data.total === 1 ? "review" : "reviews"} · {data.activeDays} active {data.activeDays === 1 ? "day" : "days"} in 12 weeks
          </Text>
        )}
      </HStack>
      {isPending ? (
        <Box h='136px' rounded='control' bg='bg.muted' aria-busy='true' aria-label='Loading activity' />
      ) : isError ? (
        <Text fontSize='sm' color='fg.muted'>
          Couldn&apos;t load activity. Check your connection and refresh the page.
        </Text>
      ) : (
        <ActivityHeatmap days={data.days} />
      )}
    </Surface>
  );
};

export default ActivityPanel;
