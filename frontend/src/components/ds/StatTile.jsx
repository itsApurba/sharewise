import { HStack, Icon, Text } from "@chakra-ui/react";
import Surface from "./Surface";

/** One number with a label, e.g. a streak or a count of lessons mastered. */
const StatTile = ({ label, value, icon, palette = "brand", hint }) => (
  <Surface p='4' colorPalette={palette}>
    <HStack gap='2' color='colorPalette.fg' mb='1'>
      {icon && <Icon boxSize='4'>{icon}</Icon>}
      <Text textStyle='label'>{label}</Text>
    </HStack>
    <Text fontFamily='heading' fontWeight='600' fontSize={{ base: "2xl", md: "3xl" }} lineHeight='1.1'>
      {value}
    </Text>
    {hint && (
      <Text fontSize='xs' color='fg.muted' mt='1'>
        {hint}
      </Text>
    )}
  </Surface>
);

export default StatTile;
