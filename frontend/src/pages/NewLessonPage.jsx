import { Button, Field, Input, Stack, Switch, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader, PreviewNotice } from "../components/ds/Page";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";

const BODY_LIMIT = 280;

const NewLessonPage = () => {
  const [body, setBody] = useState("");
  const [withQuiz, setWithQuiz] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    toaster.info({ title: "Publishing is coming soon", description: "This composer is a layout preview." });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow='Teach something' title='New lesson' description='One idea, small enough to remember.' backTo='/' backLabel='Feed' />
      <PreviewNotice>Layout preview. Publishing arrives with the lesson composer. Need the original form? Use <Link to='/create'><Text as='span' textDecoration='underline'>Create user / post</Text></Link>.</PreviewNotice>
      <Surface as='form' onSubmit={submit}>
        <Stack gap='5'>
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input placeholder='e.g. Array.at() reads from the end' />
          </Field.Root>
          <Field.Root>
            <Field.Label>Lesson</Field.Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, BODY_LIMIT))} rows={4} placeholder='Explain it in a few sentences.' />
            <Field.HelperText alignSelf='flex-end'>
              {body.length}/{BODY_LIMIT}
            </Field.HelperText>
          </Field.Root>
          <Field.Root>
            <Field.Label>
              Code snippet <Text as='span' color='fg.muted' fontWeight='normal'>(optional)</Text>
            </Field.Label>
            <Textarea fontFamily='mono' fontSize='sm' rows={3} placeholder='const last = arr.at(-1);' />
          </Field.Root>
          <Field.Root>
            <Field.Label>
              Link <Text as='span' color='fg.muted' fontWeight='normal'>(optional)</Text>
            </Field.Label>
            <Input type='url' placeholder='https://' />
          </Field.Root>
          <Field.Root>
            <Field.Label>Tags</Field.Label>
            <Input placeholder='javascript, arrays' />
            <Field.HelperText>Comma separated, up to 3.</Field.HelperText>
          </Field.Root>
          <Switch.Root checked={withQuiz} onCheckedChange={(e) => setWithQuiz(e.checked)} colorPalette='plum'>
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label>Add a one-line quiz</Switch.Label>
          </Switch.Root>
          {withQuiz && (
            <Stack gap='3' p='3' rounded='control' bg='plum.subtle'>
              <Field.Root>
                <Field.Label>Question</Field.Label>
                <Input bg='bg.panel' placeholder='What does [3, 1, 4].at(-1) return?' />
              </Field.Root>
              <Field.Root>
                <Field.Label>Correct answer</Field.Label>
                <Input bg='bg.panel' placeholder='4' />
              </Field.Root>
              <Field.Root>
                <Field.Label>Wrong answers</Field.Label>
                <Input bg='bg.panel' placeholder='3, undefined' />
              </Field.Root>
            </Stack>
          )}
          <Button type='submit' rounded='full' size='lg'>
            Publish lesson
          </Button>
        </Stack>
      </Surface>
    </PageContainer>
  );
};

export default NewLessonPage;
