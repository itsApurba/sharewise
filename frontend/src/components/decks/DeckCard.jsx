import { Box, HStack, Heading, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import { LuBookmarkCheck, LuLayers } from "react-icons/lu";
import { Link } from "react-router-dom";
import Surface from "../ds/Surface";
import DeckCover from "./DeckCover";
import { deckPalette } from "./deckStyle";

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** A deck as a link tile: cover band, title, owner and counts. */
const DeckCard = ({ deck, showOwner = true, ...props }) => {
  const done = deck.viewer && deck.lessonCount > 0 && deck.viewer.toRemember === 0 && deck.viewer.remembered > 0;
  return (
    <Surface asChild p='0' overflow='hidden' _hover={{ borderColor: "border.emphasized" }} transition='border-color 150ms' {...props}>
      <Link to={`/deck/${deck.id}`}>
        <Box colorPalette={deckPalette(deck.color)} bg='colorPalette.subtle' h='16' position='relative'>
          <DeckCover emoji={deck.emoji} color={deck.color} size='12' fontSize='2xl' bg='bg.panel' position='absolute' left='4' bottom='-5' boxShadow='card' />
        </Box>
        <Stack gap='1' p='4' pt='7' minW='0'>
          <Heading as='h3' textStyle='title' fontSize='md' lineClamp={2} overflowWrap='anywhere'>
            {deck.title}
          </Heading>
          {showOwner && (
            <Text fontSize='xs' color='fg.muted' truncate>
              by {deck.owner.name}
            </Text>
          )}
          <HStack gap='3' fontSize='xs' color='fg.muted' pt='1' flexWrap='wrap'>
            <HStack gap='1'>
              <Icon boxSize='3.5'>
                <LuLayers />
              </Icon>
              {plural(deck.lessonCount, "lesson")}
            </HStack>
            <Text>{deck.rememberCount} remembering</Text>
            {done && (
              <HStack gap='1' color='review.gotIt.fg'>
                <Icon boxSize='3.5'>
                  <LuBookmarkCheck />
                </Icon>
                All yours
              </HStack>
            )}
          </HStack>
        </Stack>
      </Link>
    </Surface>
  );
};

export const DeckCardSkeleton = (props) => (
  <Surface p='0' overflow='hidden' aria-hidden {...props}>
    <Skeleton h='16' rounded='0' />
    <Stack gap='2' p='4' pt='6'>
      <Skeleton h='4' w='70%' />
      <Skeleton h='3' w='40%' />
      <Skeleton h='3' w='55%' />
    </Stack>
  </Surface>
);

/**
 * Decks in one row that scrolls sideways inside its own box (the page never does).
 * Pass `decks`, or `loading` for placeholders.
 */
export const DeckRow = ({ decks, loading = false, showOwner = true, label = "Decks" }) => (
  <Box
    as='ul'
    role='list'
    aria-label={label}
    display='flex'
    gap='3'
    overflowX='auto'
    scrollSnapType='x mandatory'
    pb='2'
    minW='0'
    listStyleType='none'
    css={{ scrollbarWidth: "thin" }}
  >
    {(loading ? [0, 1, 2] : decks).map((deck, i) => (
      <Box as='li' key={loading ? i : deck.id} flexShrink={0} w={{ base: "64%", sm: "15rem" }} scrollSnapAlign='start' display='flex'>
        {loading ? <DeckCardSkeleton w='full' /> : <DeckCard deck={deck} showOwner={showOwner} w='full' />}
      </Box>
    ))}
  </Box>
);

export default DeckCard;
