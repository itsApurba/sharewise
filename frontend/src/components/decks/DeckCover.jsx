import { Center } from "@chakra-ui/react";
import { deckPalette } from "./deckStyle";

/** The deck's emoji on its cover colour. `size` is the box size token; the emoji scales with it. */
const DeckCover = ({ emoji, color, size = "14", fontSize = "2xl", ...props }) => (
  <Center
    colorPalette={deckPalette(color)}
    bg='colorPalette.subtle'
    borderWidth='1px'
    borderColor='colorPalette.muted'
    rounded='control'
    boxSize={size}
    flexShrink={0}
    fontSize={fontSize}
    lineHeight='1'
    aria-hidden
    {...props}
  >
    {emoji}
  </Center>
);

export default DeckCover;
