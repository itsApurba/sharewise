import { Badge, Icon } from "@chakra-ui/react";
import { REVIEW_STATES } from "./reviewStates";

const ReviewStateBadge = ({ state, children, ...props }) => {
  const { label, palette, icon: StateIcon } = REVIEW_STATES[state];
  return (
    <Badge colorPalette={palette} variant='subtle' rounded='full' px='2' gap='1' {...props}>
      <Icon boxSize='3'>
        <StateIcon />
      </Icon>
      {children ?? label}
    </Badge>
  );
};

export default ReviewStateBadge;
