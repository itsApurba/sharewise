import { Button, Icon, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuX } from "react-icons/lu";

const letters = "ABCDEFGH";

/**
 * Multiple-choice answers for a one-line quiz. The first pick locks the group,
 * marks the right answer in sage and a wrong pick in clay, then calls onAnswer(correct).
 */
const QuizChoices = ({ choices, answerIndex, onAnswer, disabled = false }) => {
  const [picked, setPicked] = useState(null);
  const locked = disabled || picked !== null;

  const pick = (index) => {
    if (locked) return;
    setPicked(index);
    onAnswer?.(index === answerIndex);
  };

  return (
    <Stack gap='2' role='group' aria-label='Answer choices'>
      {choices.map((choice, index) => {
        const isAnswer = locked && index === answerIndex;
        const isWrongPick = picked === index && index !== answerIndex;
        const palette = isAnswer ? "sage" : isWrongPick ? "clay" : "gray";
        return (
          <Button
            key={choice}
            onClick={() => pick(index)}
            aria-disabled={locked}
            aria-pressed={picked === index}
            variant={isAnswer || isWrongPick ? "subtle" : "outline"}
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
            borderColor={isAnswer ? "review.gotIt.border" : isWrongPick ? "review.forgot.border" : "border"}
            opacity={locked && !isAnswer && !isWrongPick ? 0.6 : 1}
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
              bg={isAnswer || isWrongPick ? "colorPalette.solid" : "bg.muted"}
              color={isAnswer || isWrongPick ? "colorPalette.contrast" : "fg.muted"}
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
            <Text as='span' flex='1' minW='0'>
              {choice}
            </Text>
          </Button>
        );
      })}
    </Stack>
  );
};

export default QuizChoices;
