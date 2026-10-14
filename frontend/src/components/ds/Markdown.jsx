import { Box, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import { Fragment, useMemo } from "react";
import { parseMarkdown } from "../../lib/markdown";
import CodeSnippet from "./CodeSnippet";

const Inline = ({ nodes }) =>
  nodes.map((node, index) => {
    if (typeof node === "string") return <Fragment key={index}>{node}</Fragment>;
    if (node.type === "code")
      return (
        <Box key={index} as='code' fontFamily='mono' fontSize='0.875em' bg='bg.muted' borderWidth='1px' borderColor='border.muted' px='1' rounded='sm'>
          {node.text}
        </Box>
      );
    if (node.type === "strong")
      return (
        <Text key={index} as='strong' fontWeight='600'>
          <Inline nodes={node.children} />
        </Text>
      );
    if (node.type === "em")
      return (
        <Text key={index} as='em' fontStyle='italic'>
          <Inline nodes={node.children} />
        </Text>
      );
    return (
      <ChakraLink key={index} href={node.href} target='_blank' rel='noopener noreferrer nofollow' color='brand.fg' textDecoration='underline' textUnderlineOffset='2px'>
        <Inline nodes={node.children} />
      </ChakraLink>
    );
  });

/**
 * A lesson body rendered as safe markdown (see lib/markdown). With `limit` it shows a short
 * preview, and `more` (for example a "Read more" link) is added when something was cut.
 */
const Markdown = ({ source, limit, more, ...props }) => {
  const { blocks, truncated } = useMemo(() => parseMarkdown(source, { limit }), [source, limit]);
  return (
    <Stack gap='3' textStyle='lesson' overflowWrap='anywhere' minW='0' {...props}>
      {blocks.map((block, index) => {
        if (block.type === "code") return <CodeSnippet key={index} code={block} />;
        if (block.type === "list")
          return (
            <Box key={index} as={block.ordered ? "ol" : "ul"} start={block.ordered && block.start !== 1 ? block.start : undefined} ps='5' listStyleType={block.ordered ? "decimal" : "disc"}>
              {block.items.map((item, i) => (
                <Box key={i} as='li' whiteSpace='pre-wrap' ps='1' _marker={{ color: "fg.muted" }} _notFirst={{ mt: "1" }}>
                  <Inline nodes={item} />
                </Box>
              ))}
            </Box>
          );
        return (
          <Text key={index} whiteSpace='pre-wrap'>
            <Inline nodes={block.children} />
          </Text>
        );
      })}
      {truncated && more}
    </Stack>
  );
};

export default Markdown;
