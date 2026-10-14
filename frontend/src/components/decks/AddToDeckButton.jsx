import { Button, CloseButton, Dialog, HStack, Icon, Portal, Spinner, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuLayers, LuPlus } from "react-icons/lu";
import { errorMessage } from "../../api/client";
import { useMe } from "../../hooks/useAuth";
import { useAddToDeck, useRemoveFromDeck, useUserDecks } from "../../hooks/useDecks";
import { toaster } from "../ui/toaster";
import DeckCover from "./DeckCover";
import DeckFormDialog from "./DeckFormDialog";

/** One of my decks with an in/out toggle for `lesson`. */
const DeckToggle = ({ deck, lesson }) => {
  const add = useAddToDeck();
  const remove = useRemoveFromDeck();
  const inDeck = deck.lessonIds.includes(lesson.id);
  const busy = add.isPending || remove.isPending;
  const toggle = () =>
    (inDeck ? remove : add).mutate(
      { deckId: deck.id, lessonId: lesson.id },
      {
        onSuccess: () => toaster.success({ title: inDeck ? `Removed from ${deck.title}` : `Added to ${deck.title}` }),
        onError: (error) => toaster.error({ title: "Could not update the deck", description: errorMessage(error) }),
      }
    );
  return (
    <HStack
      as='button'
      type='button'
      onClick={toggle}
      disabled={busy}
      aria-pressed={inDeck}
      gap='3'
      p='2'
      rounded='control'
      textAlign='start'
      cursor='pointer'
      _hover={{ bg: "bg.muted" }}
      transition='background 150ms'
    >
      <DeckCover emoji={deck.emoji} color={deck.color} size='10' fontSize='xl' />
      <Stack gap='0' flex='1' minW='0'>
        <Text fontWeight='600' fontSize='sm' truncate>
          {deck.title}
        </Text>
        <Text fontSize='xs' color='fg.muted'>
          {deck.lessonCount} {deck.lessonCount === 1 ? "lesson" : "lessons"}
        </Text>
      </Stack>
      {busy ? (
        <Spinner size='sm' color='fg.muted' />
      ) : (
        <Icon boxSize='5' color={inDeck ? "review.gotIt.fg" : "fg.muted"}>
          {inDeck ? <LuCheck /> : <LuPlus />}
        </Icon>
      )}
    </HStack>
  );
};

const MyDecks = ({ handle, lesson, onNew }) => {
  const query = useUserDecks(handle);
  if (query.isPending) return <Spinner alignSelf='center' color='brand.fg' />;
  if (query.isError) return <Text color='fg.muted'>Could not load your decks. Close this and try again.</Text>;
  const decks = query.data.pages.flatMap((p) => p.items);
  return (
    <Stack gap='1'>
      {decks.length === 0 && (
        <Text fontSize='sm' color='fg.muted' mb='2'>
          Decks group lessons so anyone can remember them all in one tap. Start your first one with this lesson.
        </Text>
      )}
      {decks.map((deck) => (
        <DeckToggle key={deck.id} deck={deck} lesson={lesson} />
      ))}
      <Button alignSelf='flex-start' mt='2' size='sm' rounded='full' variant='outline' colorPalette='gray' onClick={onNew}>
        <LuPlus />
        New deck
      </Button>
    </Stack>
  );
};

/** "Add to deck": pick which of my decks hold this lesson, or start a new deck with it. */
const AddToDeckButton = ({ lesson }) => {
  const { data: me } = useMe();
  const add = useAddToDeck();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  if (!me) return null;

  const addToNew = (deck) =>
    add.mutate(
      { deckId: deck.id, lessonId: lesson.id },
      {
        onSuccess: () => toaster.success({ title: `Added to ${deck.title}` }),
        onError: (error) => toaster.error({ title: "Could not add the lesson", description: errorMessage(error) }),
      }
    );

  return (
    <>
      <Button size='sm' variant='outline' colorPalette='gray' rounded='full' onClick={() => setOpen(true)}>
        <LuLayers />
        Add to deck
      </Button>
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement='center' size={{ base: "xs", sm: "sm" }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner px='4'>
            <Dialog.Content rounded='card'>
              <Dialog.Header>
                <Dialog.Title fontFamily='heading'>Add to deck</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pb='6'>
                {open && (
                  <MyDecks
                    handle={me.handle}
                    lesson={lesson}
                    onNew={() => {
                      setOpen(false);
                      setCreating(true);
                    }}
                  />
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger asChild>
                <CloseButton size='sm' colorPalette='gray' />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <DeckFormDialog open={creating} onOpenChange={setCreating} onSaved={addToNew} />
    </>
  );
};

export default AddToDeckButton;
