import { Button, Icon, Stack, Text } from "@chakra-ui/react";
import { LuCheck, LuX } from "react-icons/lu";

const letters = "ABCDEFGH";

/**
 * Multiple-choice answers for a one-line quiz, graded by the caller (usually the server).
 * `picked` is the reader's choice (null until they pick) and `correctIndex` the right one
 * (null until known). Once picked the group locks; once graded it marks the right answer
 * in sage and a wrong pick in clay. onPick(index) fires on the first pick.
 */
const QuizChoices = ({ choices, picked = null, correctIndex = null, onPick, disabled = false }) => {
  const locked = disabled || picked !== null || correctIndex !== null;

  return (
    <Stack gap='2' role='group' aria-label='Answer choices'>
      {choices.map((choice, index) => {
        const isAnswer = correctIndex !== null && index === correctIndex;
        const isWrongPick = correctIndex !== null && picked === index && index !== correctIndex;
        const isPending = correctIndex === null && picked === index;
        const palette = isAnswer ? "sage" : isWrongPick ? "clay" : isPending ? "plum" : "gray";
        const marked = isAnswer || isWrongPick || isPending;
        return (
          <Button
            key={choice}
            onClick={() => !locked && onPick?.(index)}
            aria-disabled={locked}
            aria-pressed={picked === index}
            variant={marked ? "subtle" : "outline"}
            colorPalette={palette}
            justifyContent='flex-start'
            h='auto'
            minH='12'
            py='2.5'
            px='3'
            gap='3'
            rounded='control'
            whiteSpace='normal'
            textAlign='start'
            fontWeight='normal'
            borderWidth='1px'
            borderColor={isAnswer ? "review.gotIt.border" : isWrongPick ? "review.forgot.border" : isPending ? "plum.border" : "border"}
            opacity={locked && !marked ? 0.6 : 1}
            cursor={locked ? "default" : "pointer"}
          >
            <Text
              as='span'
              display='inline-flex'
              alignItems='center'
              justifyContent='center'
              boxSize='6'
              flexShrink={0}
              rounded='full'
              bg={marked ? "colorPalette.solid" : "bg.muted"}
              color={marked ? "colorPalette.contrast" : "fg.muted"}
              fontSize='xs'
              fontWeight='700'
            >
              {isAnswer ? (
                <Icon boxSize='3.5'>
                  <LuCheck />
                </Icon>
              ) : isWrongPick ? (
                <Icon boxSize='3.5'>
                  <LuX />
                </Icon>
              ) : (
                letters[index]
              )}
            </Text>
            <Text as='span' flex='1' minW='0' overflowWrap='anywhere'>
              {choice}
            </Text>
          </Button>
        );
      })}
    </Stack>
  );
};

export default QuizChoices;
