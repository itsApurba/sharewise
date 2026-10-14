import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { useCopy, useHighlightedCode } from "../../hooks/useRichText";
import { toaster } from "../ui/toaster";

// highlight.js class names mapped to the theme's syntax tokens, so light and dark both work.
const syntaxColors = {
  "& .hljs-keyword, & .hljs-built_in, & .hljs-type, & .hljs-selector-tag, & .hljs-doctag, & .hljs-meta .hljs-keyword": { color: "syntax.keyword" },
  "& .hljs-string, & .hljs-regexp, & .hljs-template-tag, & .hljs-addition, & .hljs-meta .hljs-string": { color: "syntax.string" },
  "& .hljs-number, & .hljs-literal, & .hljs-symbol, & .hljs-variable.language_, & .hljs-bullet": { color: "syntax.number" },
  "& .hljs-title, & .hljs-section, & .hljs-selector-id, & .hljs-selector-class, & .hljs-name": { color: "syntax.title" },
  "& .hljs-attr, & .hljs-attribute, & .hljs-property, & .hljs-params, & .hljs-selector-attr, & .hljs-selector-pseudo, & .hljs-deletion": { color: "syntax.attr" },
  "& .hljs-comment, & .hljs-quote, & .hljs-meta": { color: "syntax.comment", fontStyle: "italic" },
  "& .hljs-emphasis": { fontStyle: "italic" },
  "& .hljs-strong": { fontWeight: "700" },
};

/**
 * A code snippet that scrolls inside its own box, never the page, with syntax highlighting
 * (loaded lazily) and a copy button. `code` is a string or the API's `{ language, source }`.
 */
const CodeSnippet = ({ code }) => {
  const source = typeof code === "string" ? code : code.source;
  const language = typeof code === "string" ? null : code.language;
  const named = language && language !== "text";
  const html = useHighlightedCode(source, language);
  const { copied, copy } = useCopy();

  const onCopy = () =>
    copy(source).catch(() => toaster.error({ title: "Could not copy the code", description: "Select it and copy it by hand." }));

  return (
    <Box position='relative' minW='0'>
      <HStack position='absolute' top='1' right='1' gap='1' zIndex='1'>
        {named && (
          <Text fontFamily='mono' fontSize='2xs' color='fg.muted' textTransform='uppercase' pointerEvents='none'>
            {language}
          </Text>
        )}
        <IconButton size='2xs' variant='ghost' colorPalette='gray' rounded='full' onClick={onCopy} aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
          {copied ? <LuCheck /> : <LuCopy />}
        </IconButton>
      </HStack>
      <Box
        as='pre'
        fontFamily='mono'
        fontSize='sm'
        lineHeight='1.6'
        bg='bg.muted'
        borderWidth='1px'
        borderColor='border'
        rounded='control'
        px='3'
        pt='7'
        pb='2.5'
        overflowX='auto'
        maxW='full'
        tabIndex={0}
        aria-label={named ? `${language} code` : "Code"}
        css={syntaxColors}
      >
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{source}</code>}
      </Box>
    </Box>
  );
};

export default CodeSnippet;
