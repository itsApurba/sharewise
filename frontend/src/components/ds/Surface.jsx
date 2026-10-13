import { Box } from "@chakra-ui/react";

/** The card surface every lesson, review and panel sits on. */
const Surface = ({ children, ...props }) => (
  <Box bg='bg.panel' rounded='card' borderWidth='1px' borderColor='border.muted' boxShadow='card' p={{ base: "4", md: "5" }} minW='0' {...props}>
    {children}
  </Box>
);

export default Surface;
