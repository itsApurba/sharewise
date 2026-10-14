import { Box, Button, HStack, Heading, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuChevronRight, LuUserPlus } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";
import { CLASSIC_NAV } from "../components/ds/navItems";
import LessonCard from "../components/ds/LessonCard";
import { PageContainer, PreviewNotice, SectionHeading } from "../components/ds/Page";
import StatTile from "../components/ds/StatTile";
import StreakAvatar from "../components/ds/StreakAvatar";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";
import { SAMPLE_LESSONS, SAMPLE_VIEWER } from "../sample/sampleData";

const ProfilePage = () => {
  const { handle } = useParams();
  const sampleAuthor = SAMPLE_LESSONS.find((lesson) => lesson.author.handle === handle)?.author;
  const person = sampleAuthor ?? { ...SAMPLE_VIEWER, handle };
  const isViewer = handle === SAMPLE_VIEWER.handle;
  const lessons = SAMPLE_LESSONS.filter((lesson) => isViewer || lesson.author.handle === handle);

  return (
    <PageContainer>
      <PreviewNotice />
      <Stack gap='8'>
        <Stack direction={{ base: "column", sm: "row" }} gap='4' align={{ base: "flex-start", sm: "center" }}>
          <StreakAvatar name={person.name} streak={person.streak} size='2xl' />
          <Stack gap='1' flex='1' minW='0'>
            <Heading as='h1' textStyle='display' fontSize={{ base: "2xl", md: "3xl" }} overflowWrap='anywhere'>
              {person.name}
            </Heading>
            <Text color='fg.muted' overflowWrap='anywhere'>
              @{person.handle}
            </Text>
            {person.bio && <Text pt='1'>{person.bio}</Text>}
          </Stack>
          {!isViewer && (
            <Button rounded='full' onClick={() => toaster.info({ title: "Follows are coming soon" })}>
              <LuUserPlus />
              Follow
            </Button>
          )}
        </Stack>

        <SimpleGrid columns={3} gap='3'>
          <StatTile label='Lessons' value={lessons.length} />
          <StatTile label='Followers' value='24' palette='plum' />
          <StatTile label='Taught' value='128' palette='sage' />
        </SimpleGrid>

        <Box>
          <SectionHeading>Lessons</SectionHeading>
          <Stack gap='4'>
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} to={`/lesson/${lesson.id}`} />
            ))}
          </Stack>
        </Box>

        {isViewer && (
          <Box>
            <SectionHeading>Classic Sharewise</SectionHeading>
            <Surface p='1'>
              {CLASSIC_NAV.map((item) => (
                <Link key={item.to} to={item.to}>
                  <HStack gap='3' px='3' py='3' rounded='control' _hover={{ bg: "bg.muted" }}>
                    <Icon boxSize='5' color='fg.muted'>
                      <item.icon />
                    </Icon>
                    <Text flex='1'>{item.label}</Text>
                    <Icon boxSize='4' color='fg.muted'>
                      <LuChevronRight />
                    </Icon>
                  </HStack>
                </Link>
              ))}
            </Surface>
          </Box>
        )}
      </Stack>
    </PageContainer>
  );
};

export default ProfilePage;
