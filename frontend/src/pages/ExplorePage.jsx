import { HStack, Skeleton, Stack, Tag, Wrap } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { useSearchParams } from "react-router-dom";
import { PageContainer, PageHeader } from "../components/ds/Page";
import ExploreList from "../components/lessons/ExploreList";
import { useTags } from "../hooks/useLessons";

const TOPIC_COUNT = 12;

/** Tag chips that filter the list; the active tag lives in ?tag= so it can be linked. */
const TagFilter = ({ active, onSelect }) => {
  const { data: tags, isPending } = useTags();
  if (isPending) {
    return (
      <HStack gap='2' aria-hidden>
        {[16, 12, 20, 14].map((w) => (
          <Skeleton key={w} h='8' w={w} rounded='full' />
        ))}
      </HStack>
    );
  }
  const shown = (tags ?? []).slice(0, TOPIC_COUNT);
  if (active && !shown.some((t) => t.tag === active)) shown.unshift({ tag: active, lessons: null });
  return (
    <Wrap gap='2' role='group' aria-label='Filter by tag'>
      {shown.map(({ tag, lessons }) => {
        const selected = tag === active;
        return (
          <Tag.Root
            key={tag}
            asChild
            size='lg'
            variant={selected ? "solid" : "outline"}
            colorPalette={selected ? "brand" : "gray"}
            rounded='full'
            cursor='pointer'
          >
            <button type='button' aria-pressed={selected} onClick={() => onSelect(selected ? null : tag)}>
              <Tag.Label>#{tag}</Tag.Label>
              {selected ? (
                <Tag.EndElement>
                  <LuX />
                </Tag.EndElement>
              ) : (
                lessons !== null && <Tag.EndElement color='fg.muted' fontSize='xs'>{lessons}</Tag.EndElement>
              )}
            </button>
          </Tag.Root>
        );
      })}
    </Wrap>
  );
};

const ExplorePage = () => {
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag") || null;
  const select = (next) => setParams(next ? { tag: next } : {}, { replace: true });

  return (
    <PageContainer>
      <PageHeader eyebrow='Discover' title='Explore' description={tag ? `Lessons tagged #${tag}, newest first.` : "Every lesson in the community, newest first."} />
      <Stack gap='5'>
        <TagFilter active={tag} onSelect={select} />
        <ExploreList key={tag ?? "all"} tag={tag} />
      </Stack>
    </PageContainer>
  );
};

export default ExplorePage;
