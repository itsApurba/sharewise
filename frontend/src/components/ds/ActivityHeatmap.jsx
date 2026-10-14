import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

const CELL = "16px";
const GAP = "3px";
const ROW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/** Cell fills from empty to deepest ember, each with a light and a dark value. */
const LEVELS = [
  { _light: "gray.200", _dark: "gray.800" },
  { _light: "brand.200", _dark: "brand.900" },
  { _light: "brand.300", _dark: "brand.700" },
  { _light: "brand.500", _dark: "brand.500" },
  { _light: "brand.700", _dark: "brand.300" },
];

const utc = (date) => new Date(`${date}T00:00:00Z`);
const longDate = (date) => utc(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const month = (date) => utc(date).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
const reviews = (n) => `${n} ${n === 1 ? "review" : "reviews"}`;

/** 0 for no reviews, then 1-4 by quarter of the busiest day. */
const level = (count, max) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));

/** Splits oldest-first days into Sunday-first weeks; days before the first and after today are null. */
function toWeeks(days) {
  const cells = [...Array(utc(days[0].date).getUTCDay()).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** A month name over each week that starts a new month, skipped when too close to the previous label. */
function monthLabels(weeks) {
  let last = -3;
  let shown = null;
  return weeks.map((week, i) => {
    const name = month(week.find(Boolean).date);
    if (name === shown || i - last < 3) return "";
    last = i;
    shown = name;
    return name;
  });
}

/**
 * GitHub-style grid of reviews per day: one column per week (Sunday on top), one cell per day.
 * `days` is `[{ date, count }]`, oldest first, today last. Hover, focus or tap a cell to read its
 * date and count in the line below; the grid scrolls sideways inside its card on narrow screens.
 */
const ActivityHeatmap = ({ days }) => {
  const today = days[days.length - 1];
  const [picked, setPicked] = useState(null);
  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks = toWeeks(days);
  const months = monthLabels(weeks);
  const shown = picked || today;

  return (
    <Stack gap='3'>
      <Box overflowX='auto' pb='1' onMouseLeave={() => setPicked(null)}>
        <HStack gap={GAP} align='flex-start' w='max-content' role='group' aria-label='Reviews per day'>
          <Stack gap={GAP} aria-hidden pt={`calc(${CELL} + ${GAP})`} pr='1'>
            {ROW_LABELS.map((label, i) => (
              <Text key={i} h={CELL} fontSize='2xs' lineHeight={CELL} color='fg.muted'>
                {label}
              </Text>
            ))}
          </Stack>
          {weeks.map((week, w) => (
            <Stack key={w} gap={GAP}>
              <Text aria-hidden h={CELL} fontSize='2xs' lineHeight={CELL} color='fg.muted' whiteSpace='nowrap' w={CELL} overflow='visible'>
                {months[w]}
              </Text>
              {week.map((day, d) =>
                day ? (
                  <Box
                    key={day.date}
                    as='button'
                    type='button'
                    boxSize={CELL}
                    rounded='3px'
                    bg={LEVELS[level(day.count, max)]}
                    outline={day === shown ? "2px solid" : undefined}
                    outlineColor='fg'
                    outlineOffset='1px'
                    cursor='pointer'
                    aria-label={`${longDate(day.date)}: ${reviews(day.count)}`}
                    title={`${longDate(day.date)}: ${reviews(day.count)}`}
                    onMouseEnter={() => setPicked(day)}
                    onFocus={() => setPicked(day)}
                    onClick={() => setPicked(day)}
                    _focusVisible={{ outline: "2px solid", outlineColor: "brand.focusRing" }}
                  />
                ) : (
                  <Box key={`empty-${d}`} boxSize={CELL} aria-hidden />
                )
              )}
            </Stack>
          ))}
        </HStack>
      </Box>
      <HStack justify='space-between' gap='3' wrap='wrap'>
        <Text fontSize='sm' aria-live='polite'>
          <Text as='span' fontWeight='700'>
            {reviews(shown.count)}
          </Text>{" "}
          <Text as='span' color='fg.muted'>
            {shown === today ? "today" : `on ${longDate(shown.date)}`}
          </Text>
        </Text>
        <HStack gap='1' aria-hidden fontSize='2xs' color='fg.muted'>
          <Text>Less</Text>
          {LEVELS.map((bg, i) => (
            <Box key={i} boxSize='10px' rounded='2px' bg={bg} />
          ))}
          <Text>More</Text>
        </HStack>
      </HStack>
    </Stack>
  );
};

export default ActivityHeatmap;
