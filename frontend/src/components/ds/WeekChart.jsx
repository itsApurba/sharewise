import { Box, HStack, Stack, Table, Text, VisuallyHidden } from "@chakra-ui/react";

const weekday = (day, style) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: style, timeZone: "UTC" });

const label = ({ day, count }) => `${weekday(day, "long")}: ${count} ${count === 1 ? "review" : "reviews"}`;

/**
 * Reviews answered per day over the last seven days, oldest first, today last.
 * `days` is `[{ day: "YYYY-MM-DD", count }]`. One series, so no legend: the section title names it.
 * Values sit on the column caps; the hidden table carries the same numbers for screen readers.
 */
const WeekChart = ({ days, height = 120 }) => {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <Box>
      <HStack aria-hidden gap='0' align='stretch' h={`${height + 20}px`} borderBottomWidth='1px' borderColor='border'>
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          return (
            <Stack key={d.day} flex='1' minW='0' gap='1' justify='flex-end' align='center' title={label(d)} cursor='default' role='presentation'>
              <Text fontSize='xs' fontWeight={isToday ? "700" : "500"} color={d.count ? "fg" : "fg.muted"} lineHeight='1'>
                {d.count}
              </Text>
              <Box
                w='full'
                maxW='24px'
                h={d.count ? `${Math.max(4, (d.count / max) * height)}px` : "0"}
                bg='streak'
                borderTopRadius='4px'
                transition='background 0.2s'
              />
            </Stack>
          );
        })}
      </HStack>
      <HStack aria-hidden gap='0' mt='1.5'>
        {days.map((d, i) => (
          <Text
            key={d.day}
            flex='1'
            minW='0'
            textAlign='center'
            fontSize='2xs'
            color={i === days.length - 1 ? "fg" : "fg.muted"}
            fontWeight={i === days.length - 1 ? "700" : "500"}
          >
            {i === days.length - 1 ? "Today" : weekday(d.day, "short")}
          </Text>
        ))}
      </HStack>
      <VisuallyHidden>
        <Table.Root>
          <Table.Caption>Reviews answered per day, last seven days</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Day</Table.ColumnHeader>
              <Table.ColumnHeader>Reviews</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {days.map((d) => (
              <Table.Row key={d.day}>
                <Table.Cell>{weekday(d.day, "long")}</Table.Cell>
                <Table.Cell>{d.count}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </VisuallyHidden>
    </Box>
  );
};

export default WeekChart;
