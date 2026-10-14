import { Box, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuBrain, LuCalendarCheck, LuFlame, LuGraduationCap } from "react-icons/lu";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader, PreviewNotice, SectionHeading } from "../components/ds/Page";
import ReviewStateBadge from "../components/ds/ReviewStateBadge";
import StatTile from "../components/ds/StatTile";
import StreakAvatar from "../components/ds/StreakAvatar";
import Surface from "../components/ds/Surface";
import { SAMPLE_STATS } from "../sample/sampleData";

const RankRow = ({ rank, children, value, valueLabel }) => (
  <HStack gap='3' py='3' borderTopWidth={rank === 1 ? "0" : "1px"} borderColor='border.muted'>
    <Text w='5' flexShrink={0} fontFamily='heading' fontWeight='600' color='fg.muted' textAlign='center'>
      {rank}
    </Text>
    <Box flex='1' minW='0'>
      {children}
    </Box>
    <Stack gap='0' align='flex-end' flexShrink={0}>
      <Text fontWeight='700'>{value}</Text>
      <Text fontSize='2xs' color='fg.muted'>
        {valueLabel}
      </Text>
    </Stack>
  </HStack>
);

const StatsPage = () => {
  const stats = SAMPLE_STATS;
  return (
    <PageContainer width='wide'>
      <PageHeader eyebrow='Progress' title='Stats' description='What you remember, and who taught it.' />
      <PreviewNotice />
      <Stack gap='8'>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap='3'>
          <StatTile label='Streak' value={`${stats.streak} days`} icon={<LuFlame />} palette='brand' />
          <StatTile label='Mastered' value={stats.mastered} icon={<LuGraduationCap />} palette='plum' />
          <StatTile label='Due today' value={stats.dueToday} icon={<LuCalendarCheck />} palette='honey' />
          <StatTile label='Retention' value={stats.retention} icon={<LuBrain />} palette='sage' hint='Reviews answered "Got it"' />
        </SimpleGrid>

        <HStack gap='2' wrap='wrap'>
          <ReviewStateBadge state='due'>3 due</ReviewStateBadge>
          <ReviewStateBadge state='gotIt'>21 got it</ReviewStateBadge>
          <ReviewStateBadge state='forgot'>4 forgot</ReviewStateBadge>
          <ReviewStateBadge state='mastered'>14 mastered</ReviewStateBadge>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap='6'>
          <Box minW='0'>
            <SectionHeading>Most remembered lessons</SectionHeading>
            <Surface py='1'>
              {stats.topLessons.map((lesson, i) => (
                <RankRow key={lesson.id} rank={i + 1} value={lesson.rememberCount} valueLabel='saves'>
                  <Link to={`/lesson/${lesson.id}`}>
                    <Text fontWeight='600' lineClamp={2} _hover={{ textDecoration: "underline" }}>
                      {lesson.title}
                    </Text>
                  </Link>
                  <Text fontSize='xs' color='fg.muted' truncate>
                    by {lesson.author.name}
                  </Text>
                </RankRow>
              ))}
            </Surface>
          </Box>
          <Box minW='0'>
            <SectionHeading>Authors who taught the most</SectionHeading>
            <Surface py='1'>
              {stats.topAuthors.map((author, i) => (
                <RankRow key={author.handle} rank={i + 1} value={author.taught} valueLabel='learners'>
                  <HStack gap='3' minW='0'>
                    <StreakAvatar name={author.name} streak={author.streak} size='sm' />
                    <Link to={`/u/${author.handle}`}>
                      <Text fontWeight='600' truncate _hover={{ textDecoration: "underline" }}>
                        {author.name}
                      </Text>
                    </Link>
                  </HStack>
                </RankRow>
              ))}
            </Surface>
          </Box>
        </SimpleGrid>

        <Text fontSize='sm' color='fg.muted'>
          Looking for the original numbers? See{" "}
          <Link to='/user-analytics'>
            <Text as='span' color='brand.fg' textDecoration='underline'>
              user analytics
            </Text>
          </Link>{" "}
          and{" "}
          <Link to='/post-analytics'>
            <Text as='span' color='brand.fg' textDecoration='underline'>
              post analytics
            </Text>
          </Link>
          .
        </Text>
      </Stack>
    </PageContainer>
  );
};

export default StatsPage;
