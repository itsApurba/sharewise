import { Avatar, Float, HStack, Icon, Text } from "@chakra-ui/react";
import { LuFlame } from "react-icons/lu";

/**
 * Avatar with the owner's retention streak as a flame badge.
 * A streak of 0 (or none) shows the plain avatar.
 */
const StreakAvatar = ({ name, src, streak = 0, size = "md" }) => {
  const showFlame = streak > 0;
  return (
    <Avatar.Root
      size={size}
      colorPalette='brand'
      variant='subtle'
      flexShrink={0}
      aria-label={showFlame ? `${name}, ${streak}-day streak` : name}
    >
      <Avatar.Fallback name={name} />
      {src && <Avatar.Image src={src} alt='' />}
      {showFlame && (
        <Float placement='bottom-end' offsetX='1' offsetY='1'>
          <HStack
            gap='0.5'
            px='1'
            h='4'
            rounded='full'
            bg='bg.panel'
            borderWidth='1px'
            borderColor='border'
            color='streak'
            boxShadow='card'
            aria-hidden
          >
            <Icon boxSize='2.5'>
              <LuFlame fill='currentColor' />
            </Icon>
            <Text fontSize='2xs' fontWeight='700' lineHeight='1' color='fg'>
              {streak}
            </Text>
          </HStack>
        </Float>
      )}
    </Avatar.Root>
  );
};

export default StreakAvatar;
