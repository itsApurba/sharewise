import { Box, HStack, Heading, Icon, Stack, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuFlaskConical } from "react-icons/lu";
import { Link } from "react-router-dom";

/**
 * Centers a screen's content. `width="content"` (default) is the reading column;
 * `width="wide"` is for tables and dashboards.
 */
export const PageContainer = ({ width = "content", children, ...props }) => (
  <Box w='full' maxW={width} mx='auto' minW='0' {...props}>
    {children}
  </Box>
);

/** Screen title block: optional back link and eyebrow, a serif title, a description, and actions on the right. */
export const PageHeader = ({ title, description, eyebrow, actions, backTo, backLabel = "Back" }) => (
  <Stack gap='3' mb={{ base: "5", md: "8" }}>
    {backTo && (
      <Link to={backTo}>
        <HStack gap='1' color='fg.muted' fontSize='sm' _hover={{ color: "fg" }} w='fit-content'>
          <Icon boxSize='4'>
            <LuArrowLeft />
          </Icon>
          {backLabel}
        </HStack>
      </Link>
    )}
    <Stack direction={{ base: "column", sm: "row" }} justify='space-between' align={{ base: "stretch", sm: "flex-end" }} gap='3'>
      <Stack gap='1' minW='0'>
        {eyebrow && (
          <Text textStyle='label' color='brand.fg'>
            {eyebrow}
          </Text>
        )}
        <Heading as='h1' textStyle='display' fontSize={{ base: "2xl", md: "3xl" }}>
          {title}
        </Heading>
        {description && (
          <Text color='fg.muted' maxW='prose'>
            {description}
          </Text>
        )}
      </Stack>
      {actions && (
        <HStack gap='2' flexShrink={0} flexWrap='wrap'>
          {actions}
        </HStack>
      )}
    </Stack>
  </Stack>
);

/** Section heading inside a screen. */
export const SectionHeading = ({ children, action }) => (
  <HStack justify='space-between' mb='3' gap='3'>
    <Heading as='h2' textStyle='title'>
      {children}
    </Heading>
    {action}
  </HStack>
);

/** Marks a screen that shows invented sample data until its feature slice lands. */
export const PreviewNotice = ({ children = "Preview with sample data. Real content arrives with this screen's feature work." }) => (
  <HStack
    gap='2'
    px='3'
    py='2'
    mb='5'
    rounded='control'
    bg='honey.subtle'
    color='honey.fg'
    fontSize='sm'
    align='flex-start'
    role='note'
  >
    <Icon boxSize='4' mt='0.5' flexShrink={0}>
      <LuFlaskConical />
    </Icon>
    <Text>{children}</Text>
  </HStack>
);
