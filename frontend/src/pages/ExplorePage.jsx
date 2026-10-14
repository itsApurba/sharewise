import { Input, InputGroup, Stack, Tag, Wrap } from "@chakra-ui/react";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import LessonCard from "../components/ds/LessonCard";
import { PageContainer, PageHeader, PreviewNotice } from "../components/ds/Page";
import { toaster } from "../components/ui/toaster";
import { SAMPLE_LESSONS } from "../sample/sampleData";

const topics = ["javascript", "css", "productivity", "arrays", "layout"];

const ExplorePage = () => {
  const [remembered, setRemembered] = useState({});
  const toggle = (id) => {
    const next = !remembered[id];
    setRemembered({ ...remembered, [id]: next });
    if (next) toaster.success({ title: "Saved to remember", description: "It comes back for review tomorrow." });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow='Discover' title='Explore' description='Lessons from people you do not follow yet.' />
      <PreviewNotice />
      <Stack gap='4'>
        <InputGroup startElement={<LuSearch />}>
          <Input placeholder='Search lessons and tags' rounded='full' bg='bg.panel' aria-label='Search lessons' />
        </InputGroup>
        <Wrap gap='2'>
          {topics.map((topic) => (
            <Tag.Root key={topic} size='lg' variant='outline' colorPalette='gray' rounded='full'>
              <Tag.Label>#{topic}</Tag.Label>
            </Tag.Root>
          ))}
        </Wrap>
        {SAMPLE_LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} to={`/lesson/${lesson.id}`} remembered={!!remembered[lesson.id]} onRemember={() => toggle(lesson.id)} />
        ))}
      </Stack>
    </PageContainer>
  );
};

export default ExplorePage;
