import { Box, Button, Field, HStack, IconButton, Input, NativeSelect, Stack, Switch, Tag, Text, Textarea, Wrap } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuCheck, LuEye, LuEyeOff, LuPencil, LuPlus, LuX } from "react-icons/lu";
import LessonCard from "../ds/LessonCard";
import Markdown from "../ds/Markdown";
import Surface from "../ds/Surface";
import { LANGUAGES, LIMITS, clearDraft, emptyForm, loadDraft, parseTags, previewLesson, saveDraft, validate } from "./lessonForm";

const Optional = () => (
  <Text as='span' color='fg.muted' fontWeight='normal'>
    (optional)
  </Text>
);

const Counter = ({ value, max }) => (
  <Field.HelperText alignSelf='flex-end' color={value > max ? "fg.error" : "fg.muted"}>
    {value}/{max}
  </Field.HelperText>
);

/**
 * The lesson form: title, markdown body (with a Write/Preview toggle), optional code snippet, link and tags, and an optional quiz
 * (free-text answer or 2-4 choices with one marked correct). Errors show after the first
 * submit and then update live. `serverErrors` are the API's `fields`, keyed the same way.
 * With `draftKey`, the unsent form is kept in this browser and restored on the next visit.
 */
const LessonComposer = ({ initial, author, submitLabel, submitting, serverErrors = {}, onSubmit, onCancel, draftKey }) => {
  const [restored] = useState(() => (draftKey ? loadDraft(draftKey) : null));
  const [form, setForm] = useState(restored ?? initial);
  const [showRestored, setShowRestored] = useState(Boolean(restored));

  useEffect(() => {
    if (draftKey) saveDraft(draftKey, form);
  }, [draftKey, form]);

  const discardDraft = () => {
    clearDraft(draftKey);
    setForm(emptyForm());
    setShowRestored(false);
  };
  const [attempted, setAttempted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bodyMode, setBodyMode] = useState("write");
  const [dirtySinceServer, setDirtySinceServer] = useState({});

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirtySinceServer((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((k) => [k, true])) }));
  };

  const clientErrors = attempted ? validate(form) : {};
  // A server error stays until the field it names is edited.
  const visibleServer = Object.fromEntries(
    Object.entries(serverErrors).filter(([key]) => {
      const field = { "code.source": "source", "code.language": "language", code: "source", "quiz.prompt": "prompt", "quiz.answer": "answer" }[key] ?? key;
      return !(field in dirtySinceServer) && !(key.startsWith("quiz.choices") && "choices" in dirtySinceServer);
    })
  );
  const errorFor = (key) => clientErrors[key] ?? visibleServer[key] ?? Object.entries(visibleServer).find(([k]) => k.startsWith(`${key}.`))?.[1];

  const submit = (event) => {
    event.preventDefault();
    setAttempted(true);
    setDirtySinceServer({});
    if (Object.keys(validate(form)).length === 0) onSubmit(form);
  };

  const tags = parseTags(form.tags);
  const setChoice = (index, value) => set({ choices: form.choices.map((choice, i) => (i === index ? value : choice)) });
  const removeChoice = (index) =>
    set({
      choices: form.choices.filter((_, i) => i !== index),
      correctIndex: form.correctIndex === index ? 0 : form.correctIndex > index ? form.correctIndex - 1 : form.correctIndex,
    });

  return (
    <Stack gap='5'>
      <Surface as='form' onSubmit={submit} noValidate>
        <Stack gap='5'>
          {showRestored && (
            <HStack justify='space-between' gap='3' px='3' py='2' rounded='control' bg='bg.subtle' fontSize='sm' wrap='wrap'>
              <Text color='fg.muted'>Your unsent draft is back.</Text>
              <Button size='xs' variant='ghost' colorPalette='gray' rounded='full' onClick={discardDraft}>
                Start over
              </Button>
            </HStack>
          )}
          <Field.Root invalid={Boolean(errorFor("title"))} required>
            <Field.Label>Title</Field.Label>
            <Input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={LIMITS.title[1]} placeholder='e.g. Array.at() reads from the end' />
            <Field.ErrorText>{errorFor("title")}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={Boolean(errorFor("body"))} required>
            <HStack justify='space-between' w='full' gap='2'>
              <Field.Label>Lesson</Field.Label>
              <HStack gap='1' role='group' aria-label='Lesson editor mode'>
                {[
                  ["write", "Write", <LuPencil key='i' />],
                  ["preview", "Preview", <LuEye key='i' />],
                ].map(([mode, label, icon]) => (
                  <Button
                    key={mode}
                    size='xs'
                    rounded='full'
                    variant={bodyMode === mode ? "subtle" : "ghost"}
                    colorPalette='gray'
                    aria-pressed={bodyMode === mode}
                    onClick={() => setBodyMode(mode)}
                  >
                    {icon}
                    {label}
                  </Button>
                ))}
              </HStack>
            </HStack>
            {bodyMode === "write" ? (
              <Textarea value={form.body} onChange={(e) => set({ body: e.target.value })} rows={5} placeholder='Explain one idea in a few sentences.' autoresize maxH='20lh' />
            ) : (
              <Box w='full' minH='7.5rem' px='3' py='2' rounded='control' borderWidth='1px' borderColor='border' bg='bg.panel'>
                {form.body.trim() ? (
                  <Markdown source={form.body} />
                ) : (
                  <Text color='fg.muted' textStyle='lesson'>
                    Nothing to preview yet.
                  </Text>
                )}
              </Box>
            )}
            {errorFor("body") ? (
              <Field.ErrorText>{errorFor("body")}</Field.ErrorText>
            ) : (
              <HStack justify='space-between' align='flex-start' w='full' gap='3'>
                <Field.HelperText>
                  Markdown works: **bold**, *italic*, `code`, - lists, [links](https://…) and ``` code blocks.
                </Field.HelperText>
                <Counter value={form.body.trim().length} max={LIMITS.body[1]} />
              </HStack>
            )}
          </Field.Root>

          <Stack gap='3'>
            <Switch.Root checked={form.hasCode} onCheckedChange={(e) => set({ hasCode: e.checked })}>
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Add a code snippet</Switch.Label>
            </Switch.Root>
            {form.hasCode && (
              <Stack gap='3' p='3' rounded='control' bg='bg.subtle'>
                <Field.Root invalid={Boolean(errorFor("code.language"))} maxW='48'>
                  <Field.Label>Language</Field.Label>
                  <NativeSelect.Root size='sm'>
                    <NativeSelect.Field value={form.language} onChange={(e) => set({ language: e.target.value })} bg='bg.panel'>
                      {(LANGUAGES.includes(form.language) ? LANGUAGES : [form.language, ...LANGUAGES]).map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Field.ErrorText>{errorFor("code.language")}</Field.ErrorText>
                </Field.Root>
                <Field.Root invalid={Boolean(errorFor("code.source") ?? errorFor("code"))}>
                  <Field.Label>Code</Field.Label>
                  <Textarea
                    value={form.source}
                    onChange={(e) => set({ source: e.target.value })}
                    fontFamily='mono'
                    fontSize='sm'
                    rows={4}
                    bg='bg.panel'
                    placeholder='const last = arr.at(-1);'
                    spellCheck={false}
                    wrap='off'
                  />
                  {errorFor("code.source") ?? errorFor("code") ? (
                    <Field.ErrorText>{errorFor("code.source") ?? errorFor("code")}</Field.ErrorText>
                  ) : (
                    <Counter value={form.source.trimEnd().length} max={LIMITS.code} />
                  )}
                </Field.Root>
              </Stack>
            )}
          </Stack>

          <Field.Root invalid={Boolean(errorFor("link"))}>
            <Field.Label>
              Link <Optional />
            </Field.Label>
            <Input type='url' inputMode='url' value={form.link} onChange={(e) => set({ link: e.target.value })} placeholder='https://' />
            <Field.ErrorText>{errorFor("link")}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={Boolean(errorFor("tags"))}>
            <Field.Label>
              Tags <Optional />
            </Field.Label>
            <Input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder='js, arrays' autoCapitalize='none' />
            {errorFor("tags") ? <Field.ErrorText>{errorFor("tags")}</Field.ErrorText> : <Field.HelperText>Comma or space separated, up to {LIMITS.tags}.</Field.HelperText>}
            {tags.length > 0 && (
              <Wrap gap='1.5' mt='1'>
                {tags.map((tag) => (
                  <Tag.Root key={tag} size='sm' variant='subtle' colorPalette='gray' rounded='full'>
                    <Tag.Label>#{tag}</Tag.Label>
                  </Tag.Root>
                ))}
              </Wrap>
            )}
          </Field.Root>

          <Stack gap='3'>
            <Switch.Root checked={form.hasQuiz} onCheckedChange={(e) => set({ hasQuiz: e.checked })} colorPalette='plum'>
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Add a one-line quiz</Switch.Label>
            </Switch.Root>
            {form.hasQuiz && (
              <Stack gap='4' p='3' rounded='control' bg='plum.subtle'>
                <HStack gap='2' role='group' aria-label='Quiz type'>
                  {[
                    ["choice", "Multiple choice"],
                    ["text", "Free answer"],
                  ].map(([kind, label]) => (
                    <Button
                      key={kind}
                      size='sm'
                      rounded='full'
                      colorPalette='plum'
                      variant={form.quizKind === kind ? "solid" : "outline"}
                      bg={form.quizKind === kind ? undefined : "bg.panel"}
                      aria-pressed={form.quizKind === kind}
                      onClick={() => set({ quizKind: kind })}
                    >
                      {label}
                    </Button>
                  ))}
                </HStack>

                <Field.Root invalid={Boolean(errorFor("quiz.prompt"))}>
                  <Field.Label>Question</Field.Label>
                  <Input bg='bg.panel' value={form.prompt} onChange={(e) => set({ prompt: e.target.value })} maxLength={LIMITS.prompt[1]} placeholder='What does [3, 1, 4].at(-1) return?' />
                  <Field.ErrorText>{errorFor("quiz.prompt")}</Field.ErrorText>
                </Field.Root>

                {form.quizKind === "text" ? (
                  <Field.Root invalid={Boolean(errorFor("quiz.answer"))}>
                    <Field.Label>Answer</Field.Label>
                    <Input bg='bg.panel' value={form.answer} onChange={(e) => set({ answer: e.target.value })} maxLength={LIMITS.answer} placeholder='4' />
                    {errorFor("quiz.answer") ? (
                      <Field.ErrorText>{errorFor("quiz.answer")}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>Checked ignoring case, extra spaces and a trailing period.</Field.HelperText>
                    )}
                  </Field.Root>
                ) : (
                  <Field.Root invalid={Boolean(errorFor("quiz.choices") ?? errorFor("quiz.correctIndex"))}>
                    <Field.Label>Choices</Field.Label>
                    <Stack gap='2' w='full'>
                      {form.choices.map((choice, index) => {
                        const correct = form.correctIndex === index;
                        return (
                          <HStack key={index} gap='2'>
                            <IconButton
                              size='sm'
                              rounded='full'
                              variant={correct ? "solid" : "outline"}
                              colorPalette={correct ? "sage" : "gray"}
                              bg={correct ? undefined : "bg.panel"}
                              aria-label={`Mark choice ${index + 1} as correct`}
                              aria-pressed={correct}
                              onClick={() => set({ correctIndex: index })}
                            >
                              {correct ? <LuCheck /> : <Text fontSize='xs'>{"ABCD"[index]}</Text>}
                            </IconButton>
                            <Input
                              flex='1'
                              minW='0'
                              bg='bg.panel'
                              value={choice}
                              onChange={(e) => setChoice(index, e.target.value)}
                              maxLength={LIMITS.answer}
                              placeholder={index === 0 ? "4" : index === 1 ? "3" : "Another choice"}
                              aria-label={`Choice ${index + 1}${correct ? ", correct" : ""}`}
                            />
                            {form.choices.length > 2 && (
                              <IconButton size='sm' variant='ghost' colorPalette='gray' rounded='full' aria-label={`Remove choice ${index + 1}`} onClick={() => removeChoice(index)}>
                                <LuX />
                              </IconButton>
                            )}
                          </HStack>
                        );
                      })}
                    </Stack>
                    {errorFor("quiz.choices") ?? errorFor("quiz.correctIndex") ? (
                      <Field.ErrorText>{errorFor("quiz.choices") ?? errorFor("quiz.correctIndex")}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>Tap the letter to mark the right answer.</Field.HelperText>
                    )}
                    {form.choices.length < 4 && (
                      <Button size='sm' variant='ghost' colorPalette='plum' rounded='full' mt='1' onClick={() => set({ choices: [...form.choices, ""] })}>
                        <LuPlus />
                        Add a choice
                      </Button>
                    )}
                  </Field.Root>
                )}
              </Stack>
            )}
          </Stack>

          {visibleServer.quiz && (
            <Text color='fg.error' fontSize='sm'>
              {visibleServer.quiz}
            </Text>
          )}

          <Stack direction={{ base: "column-reverse", sm: "row" }} gap='3' justify='flex-end'>
            <Button variant='ghost' colorPalette='gray' rounded='full' onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <LuEyeOff /> : <LuEye />}
              {showPreview ? "Hide card preview" : "Preview card"}
            </Button>
            {onCancel && (
              <Button variant='outline' colorPalette='gray' rounded='full' onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type='submit' rounded='full' loading={submitting}>
              {submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Surface>

      {showPreview && (
        <Box>
          <Text textStyle='label' color='fg.muted' mb='2'>
            Preview
          </Text>
          <LessonCard lesson={previewLesson(form, author)} footer={null} />
        </Box>
      )}
    </Stack>
  );
};

export default LessonComposer;
