import { Box, Button, Dialog, Field, HStack, Input, Portal, Stack, Text, Textarea, Wrap } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";
import { apiError } from "../../api/client";
import { useCreateDeck, useUpdateDeck } from "../../hooks/useDecks";
import { toaster } from "../ui/toaster";
import DeckCover from "./DeckCover";
import { DECK_COLORS, DECK_DESCRIPTION_MAX, DECK_EMOJIS, DECK_TITLE } from "./deckStyle";

const graphemes = (text) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;

function validate({ title, description, emoji }) {
  const errors = {};
  const t = title.trim();
  if (t.length < DECK_TITLE[0] || t.length > DECK_TITLE[1]) errors.title = `Give it a title of ${DECK_TITLE.join("-")} characters.`;
  if (description.trim().length > DECK_DESCRIPTION_MAX) errors.description = `At most ${DECK_DESCRIPTION_MAX} characters.`;
  const e = emoji.trim();
  if (!e || /\s/.test(e) || graphemes(e) !== 1) errors.emoji = "Pick one emoji.";
  return errors;
}

/** The form body; mounted fresh each time the dialog opens so it starts from `deck`. */
const DeckForm = ({ deck, onDone }) => {
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const [values, setValues] = useState({
    title: deck?.title ?? "",
    description: deck?.description ?? "",
    emoji: deck?.emoji ?? DECK_EMOJIS[0],
    color: deck?.color ?? DECK_COLORS[0].value,
  });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));
  const pending = createDeck.isPending || updateDeck.isPending;

  const submit = (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = { title: values.title.trim(), description: values.description.trim(), emoji: values.emoji.trim(), color: values.color };
    const options = {
      onSuccess: (saved) => {
        toaster.success({ title: deck ? "Deck updated" : "Deck created", description: deck ? undefined : "Add lessons to it from any lesson page." });
        onDone(saved);
      },
      onError: (error) => {
        const { message, fields } = apiError(error);
        setErrors(fields);
        if (!Object.keys(fields).length) toaster.error({ title: "Could not save the deck", description: message });
      },
    };
    if (deck) updateDeck.mutate({ id: deck.id, ...body }, options);
    else createDeck.mutate(body, options);
  };

  return (
    <form onSubmit={submit} noValidate>
      <Dialog.Body>
        <Stack gap='4'>
          <HStack gap='3'>
            <DeckCover emoji={values.emoji.trim() || "?"} color={values.color} size='14' fontSize='3xl' />
            <Text fontSize='sm' color='fg.muted' minW='0' overflowWrap='anywhere'>
              {values.title.trim() || "Your deck"}
            </Text>
          </HStack>
          <Field.Root required invalid={Boolean(errors.title)}>
            <Field.Label>Title</Field.Label>
            <Input value={values.title} onChange={(e) => set("title")(e.target.value)} maxLength={DECK_TITLE[1]} placeholder='Git rescue kit' autoFocus />
            <Field.ErrorText>{errors.title}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.description)}>
            <Field.Label>Description</Field.Label>
            <Textarea
              value={values.description}
              onChange={(e) => set("description")(e.target.value)}
              maxLength={DECK_DESCRIPTION_MAX}
              rows={2}
              placeholder='What will someone remember after this deck?'
            />
            <Field.HelperText>
              {values.description.trim().length}/{DECK_DESCRIPTION_MAX}
            </Field.HelperText>
            <Field.ErrorText>{errors.description}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={Boolean(errors.emoji)}>
            <Field.Label>Emoji</Field.Label>
            <Wrap gap='1.5' role='group' aria-label='Pick an emoji'>
              {DECK_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  type='button'
                  size='sm'
                  variant={values.emoji === emoji ? "subtle" : "ghost"}
                  colorPalette={values.emoji === emoji ? "brand" : "gray"}
                  rounded='control'
                  fontSize='lg'
                  px='0'
                  aria-pressed={values.emoji === emoji}
                  aria-label={emoji}
                  onClick={() => set("emoji")(emoji)}
                >
                  {emoji}
                </Button>
              ))}
              <Input
                value={DECK_EMOJIS.includes(values.emoji) ? "" : values.emoji}
                onChange={(e) => set("emoji")(e.target.value)}
                placeholder='Other'
                aria-label='Type any emoji'
                size='sm'
                w='20'
                rounded='control'
              />
            </Wrap>
            <Field.ErrorText>{errors.emoji}</Field.ErrorText>
          </Field.Root>
          <Field.Root>
            <Field.Label>Cover colour</Field.Label>
            <HStack gap='2' role='radiogroup' aria-label='Cover colour' flexWrap='wrap'>
              {DECK_COLORS.map(({ value, palette, label }) => {
                const selected = values.color === value;
                return (
                  <Box
                    as='button'
                    type='button'
                    key={value}
                    role='radio'
                    aria-checked={selected}
                    aria-label={label}
                    title={label}
                    colorPalette={palette}
                    bg='colorPalette.solid'
                    color='colorPalette.contrast'
                    boxSize='8'
                    rounded='full'
                    display='grid'
                    placeItems='center'
                    outline={selected ? "2px solid" : "none"}
                    outlineColor='colorPalette.solid'
                    outlineOffset='2px'
                    cursor='pointer'
                    onClick={() => set("color")(value)}
                  >
                    {selected && <LuCheck />}
                  </Box>
                );
              })}
            </HStack>
          </Field.Root>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant='ghost' colorPalette='gray' rounded='full'>
            Cancel
          </Button>
        </Dialog.ActionTrigger>
        <Button type='submit' rounded='full' loading={pending}>
          {deck ? "Save" : "Create deck"}
        </Button>
      </Dialog.Footer>
    </form>
  );
};

/** Create (no `deck`) or edit a deck. `onSaved(deck)` runs after a successful save, then the dialog closes. */
const DeckFormDialog = ({ open, onOpenChange, deck, onSaved }) => (
  <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} placement='center' size={{ base: "xs", sm: "md" }}>
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner px='4'>
        <Dialog.Content rounded='card'>
          <Dialog.Header>
            <Dialog.Title fontFamily='heading'>{deck ? "Edit deck" : "New deck"}</Dialog.Title>
          </Dialog.Header>
          {open && (
            <DeckForm
              deck={deck}
              onDone={(saved) => {
                onOpenChange(false);
                onSaved?.(saved);
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

export default DeckFormDialog;
