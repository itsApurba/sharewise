import { Box, HStack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

/** The mark: an ember card with a folded corner, like a bookmarked page. */
export const LogoMark = ({ size = "8" }) => (
  <Box boxSize={size} flexShrink={0} aria-hidden>
    <svg viewBox='0 0 32 32' width='100%' height='100%'>
      <rect x='3' y='3' width='26' height='26' rx='7' fill='var(--chakra-colors-brand-solid)' />
      <path d='M12 9h8v14l-4-3-4 3z' fill='var(--chakra-colors-brand-contrast)' />
    </svg>
  </Box>
);

/** Logo linking home. `compact` shows only the mark. */
const Logo = ({ compact = false }) => (
  <Link to='/' aria-label='Sharewise home'>
    <HStack gap='2'>
      <LogoMark />
      {!compact && (
        <Text fontFamily='heading' fontWeight='600' fontSize='xl' letterSpacing='-0.01em'>
          Sharewise
        </Text>
      )}
    </HStack>
  </Link>
);

export default Logo;
