import { Box, Button, Dialog, HStack, Heading, Icon, IconButton, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuBookmarkCheck, LuBrainCircuit, LuEllipsis, LuLayers, LuPencil, LuRefreshCw, LuSearchX, LuTrash2, LuX } from "react-icons/lu";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { AuthorLine } from "../components/ds/LessonCard";
import EmptyState from "../components/ds/EmptyState";
import { PageContainer, PageHeader } from "../components/ds/Page";
import { FeedSkeleton } from "../components/ds/Skeletons";
import Surface from "../components/ds/Surface";
import DeckCover from "../components/decks/DeckCover";
import DeckFormDialog from "../components/decks/DeckFormDialog";
import { deckPalette } from "../components/decks/deckStyle";
import LessonItem from "../components/lessons/LessonItem";
import { toaster } from "../components/ui/toaster";
import { useMe } from "../hooks/useAuth";
import { useDeck, useDeleteDeck, useRememberDeck, useRemoveFromDeck } from "../hooks/useDecks";

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The one-tap action: remember every lesson in the deck the viewer does not have yet. */
const RememberAll = ({ deck }) => {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const rememberDeck = useRememberDeck();
  const viewer = deck.viewer;

  if (!me) {
    return (
      <Button
        rounded='full'
        size='lg'
        onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname)}`)}
      >
        <LuBrainCircuit />
        Log in to remember all
      </Button>
    );
  }
  if (!viewer || deck.lessonCount === 0) return null;
  if (viewer.toRemember === 0) {
    return (
      <HStack gap='2' color='review.gotIt.fg' fontWeight='600' fontSize='sm'>
        <Icon boxSize='5'>
          <LuBookmarkCheck />
        </Icon>
        {viewer.remembered > 0 ? `You remember ${viewer.remembered === deck.lessonCount ? "every lesson" : plural(viewer.remembered, "lesson")} here` : "These are all your own lessons"}
      </HStack>
    );
  }
  const remember = () =>
    rememberDeck.mutate(deck.id, {
      onSuccess: ({ remembered }) =>
        toaster.success({
          title: `Remembering ${plural(remembered, "new lesson")}`,
          description: "They come back for a quick review tomorrow, then right before you would forget.",
        }),
      onError: (error) => toaster.error({ title: "Could not remember the deck", description: errorMessage(error) }),
    });
  return (
    <Button rounded='full' size='lg' onClick={remember} loading={rememberDeck.isPending}>
      <LuBrainCircuit />
      {viewer.remembered > 0 ? `Remember the other ${viewer.toRemember}` : `Remember all ${viewer.toRemember}`}
    </Button>
  );
};

const DeckOwnerMenu = ({ deck }) => {
  const navigate = useNavigate();
  const deleteDeck = useDeleteDeck();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const remove = () =>
    deleteDeck.mutate(deck.id, {
      onSuccess: () => {
        toaster.success({ title: "Deck deleted", description: "Its lessons are still there." });
        navigate(deck.owner.handle ? `/u/${deck.owner.handle}` : "/explore", { replace: true });
      },
      onError: (error) => toaster.error({ title: "Could not delete the deck", description: errorMessage(error) }),
    });
  return (
    <>
      <Menu.Root positioning={{ placement: "bottom-end" }}>
        <Menu.Trigger asChild>
          <IconButton variant='outline' colorPalette='gray' size='sm' rounded='full' aria-label='Deck actions'>
            <LuEllipsis />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW='40'>
              <Menu.Item value='edit' onSelect={() => setEditing(true)}>
                <LuPencil />
                Edit deck
              </Menu.Item>
              <Menu.Item value='delete' color='fg.error' _hover={{ bg: "bg.error", color: "fg.error" }} onSelect={() => setConfirming(true)}>
                <LuTrash2 />
                Delete deck
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <DeckFormDialog open={editing} onOpenChange={setEditing} deck={deck} />
      <Dialog.Root open={confirming} onOpenChange={(e) => setConfirming(e.open)} role='alertdialog' placement='center' size={{ base: "xs", sm: "sm" }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner px='4'>
            <Dialog.Content rounded='card'>
              <Dialog.Header>
                <Dialog.Title fontFamily='heading'>Delete this deck?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color='fg.muted'>“{deck.title}” goes away. The lessons in it stay, and so does everyone's progress on them.</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant='ghost' colorPalette='gray' rounded='full'>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorPalette='clay' rounded='full' onClick={remove} loading={deleteDeck.isPending}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

/** The owner's "take it out of this deck" control above each lesson. */
const RemoveFromDeck = ({ deck, lesson }) => {
  const removeFromDeck = useRemoveFromDeck();
  return (
    <Button
      size='xs'
      variant='ghost'
      colorPalette='gray'
      rounded='full'
      loading={removeFromDeck.isPending}
      onClick={() =>
        removeFromDeck.mutate(
          { deckId: deck.id, lessonId: lesson.id },
          {
            onSuccess: () => toaster.info({ title: "Removed from the deck" }),
            onError: (error) => toaster.error({ title: "Could not remove it", description: errorMessage(error) }),
          }
        )
      }
    >
      <LuX />
      Remove from deck
    </Button>
  );
};

const DeckHeader = ({ deck }) => (
  <Surface p='0' overflow='hidden'>
    <Box colorPalette={deckPalette(deck.color)} bg='colorPalette.subtle' h={{ base: "20", md: "24" }} />
    <Stack gap='4' px={{ base: "4", md: "5" }} pb={{ base: "4", md: "5" }} mt={{ base: "-10", md: "-12" }}>
      <HStack justify='space-between' align='flex-end' gap='3'>
        <DeckCover emoji={deck.emoji} color={deck.color} size={{ base: "20", md: "24" }} fontSize={{ base: "4xl", md: "5xl" }} bg='bg.panel' boxShadow='card' />
        {deck.viewer?.isOwner && <DeckOwnerMenu deck={deck} />}
      </HStack>
      <Stack gap='2' minW='0'>
        <Heading as='h1' textStyle='display' fontSize={{ base: "2xl", md: "3xl" }} overflowWrap='anywhere'>
          {deck.title}
        </Heading>
        {deck.description && (
          <Text textStyle='lesson' color='fg.muted' whiteSpace='pre-wrap' overflowWrap='anywhere'>
            {deck.description}
          </Text>
        )}
      </Stack>
      <HStack justify='space-between' gap='3' flexWrap='wrap'>
        <AuthorLine author={deck.owner} meta={`${plural(deck.lessonCount, "lesson")} · ${deck.rememberCount} remembering`} />
      </HStack>
      <Box>
        <RememberAll deck={deck} />
      </Box>
    </Stack>
  </Surface>
);

const DeckPage = () => {
  const { id } = useParams();
  const { data, isPending, isError, error, refetch } = useDeck(id);
  const notFound = error?.response?.status === 404;

  return (
    <PageContainer>
      <PageHeader title='Deck' backTo='/explore' backLabel='Explore' />
      {isPending ? (
        <FeedSkeleton count={2} />
      ) : isError ? (
        notFound ? (
          <EmptyState
            icon={<LuSearchX />}
            title='Deck not found'
            description='It may have been deleted, or the link is mistyped.'
            action={
              <Button asChild rounded='full'>
                <Link to='/explore'>Explore decks</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<LuRefreshCw />}
            title='Could not load the deck'
            description={errorMessage(error)}
            action={
              <Button rounded='full' variant='outline' colorPalette='gray' onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )
      ) : (
        <Stack gap='6'>
          <DeckHeader deck={data.deck} />
          {data.lessons.length === 0 ? (
            <EmptyState
              icon={<LuLayers />}
              title='No lessons in this deck yet'
              description={data.deck.viewer?.isOwner ? "Open any lesson and use “Add to deck” to put it here." : "Check back once the owner adds some."}
              action={
                data.deck.viewer?.isOwner && (
                  <Button asChild rounded='full'>
                    <Link to='/explore'>Find lessons</Link>
                  </Button>
                )
              }
            />
          ) : (
            <Stack gap='4'>
              {data.lessons.map((lesson, index) => (
                <Stack key={lesson.id} gap='1.5'>
                  <HStack justify='space-between' px='1'>
                    <Text textStyle='label' color='fg.muted'>
                      {index + 1} of {data.lessons.length}
                    </Text>
                    {data.deck.viewer?.isOwner && <RemoveFromDeck deck={data.deck} lesson={lesson} />}
                  </HStack>
                  <LessonItem lesson={lesson} />
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </PageContainer>
  );
};

export default DeckPage;
