import { Box, Button, HStack, Heading, Icon, Link as ChakraLink, Skeleton, SkeletonCircle, SkeletonText, Stack, Tag, Text, Wrap } from "@chakra-ui/react";
import { LuBookmarkCheck, LuBookmarkPlus, LuCircleHelp, LuExternalLink } from "react-icons/lu";
import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/format";
import CodeSnippet from "./CodeSnippet";
import Markdown from "./Markdown";
import StreakAvatar from "./StreakAvatar";
import Surface from "./Surface";

/** Author line shared by lesson and review cards. */
export const AuthorLine = ({ author, meta }) => {
  const name = (
    <Text fontWeight='600' fontSize='sm' truncate>
      {author.name}
    </Text>
  );
  return (
    <HStack gap='3' minW='0'>
      <StreakAvatar name={author.name} src={author.avatarUrl} streak={author.streak} size='sm' />
      <Stack gap='0' minW='0'>
        {author.handle ? (
          <Link to={`/u/${author.handle}`}>
            <Box _hover={{ textDecoration: "underline" }}>{name}</Box>
          </Link>
        ) : (
          name
        )}
        <Text fontSize='xs' color='fg.muted' truncate>
          {[author.handle && `@${author.handle}`, meta].filter(Boolean).join(" · ")}
        </Text>
      </Stack>
    </HStack>
  );
};

/** Characters of body a card shows before "Read more" (the lesson page shows it all). */
const CARD_PREVIEW_LIMIT = 280;

/**
 * A bite-size lesson: author, optional title, markdown body, optional code and link, tags.
 * With `to` (a link to the lesson page) the body is a short preview with "Read more".
 * The footer defaults to the "Remember this" action; pass `footer` to replace it.
 */
const LessonCard = ({ lesson, to, remembered = false, rememberBusy = false, onRemember, footer, headerAction }) => {
  const { title, body, code, link, tags = [], quiz, author, createdAt, rememberCount } = lesson;
  const createdLabel = lesson.createdLabel ?? timeAgo(createdAt);
  const titleNode = title && (
    <Heading as='h3' textStyle='title'>
      {title}
    </Heading>
  );
  return (
    <Surface as='article'>
      <Stack gap='3'>
        <HStack justify='space-between' align='flex-start' gap='2'>
          {author ? <AuthorLine author={author} meta={createdLabel} /> : <span />}
          {headerAction}
        </HStack>
        {titleNode && (to ? <Link to={to}>{titleNode}</Link> : titleNode)}
        {body && (
          <Markdown
            source={body}
            limit={to ? CARD_PREVIEW_LIMIT : undefined}
            more={
              <Text asChild fontSize='sm' fontWeight='600' color='brand.fg' alignSelf='flex-start' _hover={{ textDecoration: "underline" }}>
                <Link to={to}>Read more</Link>
              </Text>
            }
          />
        )}
        {code && <CodeSnippet code={code} />}
        {link && (
          <ChakraLink href={link} target='_blank' rel='noreferrer' color='brand.fg' fontSize='sm' overflowWrap='anywhere'>
            <Icon boxSize='3.5'>
              <LuExternalLink />
            </Icon>
            {link.replace(/^https?:\/\//, "")}
          </ChakraLink>
        )}
        {(tags.length > 0 || quiz) && (
          <Wrap gap='1.5'>
            {quiz && (
              <Tag.Root size='sm' colorPalette='plum' variant='subtle' rounded='full'>
                <Tag.StartElement>
                  <LuCircleHelp />
                </Tag.StartElement>
                <Tag.Label>Quiz</Tag.Label>
              </Tag.Root>
            )}
            {tags.map((tag) => (
              <Tag.Root key={tag} size='sm' colorPalette='gray' variant='subtle' rounded='full' asChild>
                <Link to={`/explore?tag=${encodeURIComponent(tag)}`}>
                  <Tag.Label>#{tag}</Tag.Label>
                </Link>
              </Tag.Root>
            ))}
          </Wrap>
        )}
        {footer !== undefined ? (
          footer
        ) : (
          <HStack justify='space-between' pt='1' gap='2'>
            <Button
              size='sm'
              variant={remembered ? "subtle" : "outline"}
              colorPalette='brand'
              rounded='full'
              onClick={onRemember}
              loading={rememberBusy}
              aria-pressed={remembered}
            >
              {remembered ? <LuBookmarkCheck /> : <LuBookmarkPlus />}
              {remembered ? "Remembering" : "Remember this"}
            </Button>
            {rememberCount !== undefined && (
              <Text fontSize='sm' color='fg.muted'>
                {rememberCount} remembering
              </Text>
            )}
          </HStack>
        )}
      </Stack>
    </Surface>
  );
};

/** Loading placeholder with the same footprint as a LessonCard. */
export const LessonCardSkeleton = () => (
  <Surface aria-hidden>
    <Stack gap='4'>
      <HStack gap='3'>
        <SkeletonCircle size='8' />
        <Stack gap='1.5' flex='1'>
          <Skeleton h='3' w='32' />
          <Skeleton h='2.5' w='20' />
        </Stack>
      </HStack>
      <Skeleton h='5' w='70%' />
      <SkeletonText noOfLines={3} gap='2' />
      <HStack justify='space-between'>
        <Skeleton h='8' w='36' rounded='full' />
        <Skeleton h='3' w='20' />
      </HStack>
    </Stack>
  </Surface>
);

export default LessonCard;
