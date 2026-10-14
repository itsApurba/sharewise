import { EmptyState as ChakraEmptyState, VStack } from "@chakra-ui/react";
import { LuInbox } from "react-icons/lu";

/** Friendly placeholder for an empty list. Pass an icon, a title, a line of guidance and an optional action. */
const EmptyState = ({ icon = <LuInbox />, title, description, action, ...props }) => (
  <ChakraEmptyState.Root
    size='md'
    rounded='card'
    borderWidth='1px'
    borderStyle='dashed'
    borderColor='border.emphasized'
    bg='bg.panel'
    {...props}
  >
    <ChakraEmptyState.Content>
      <ChakraEmptyState.Indicator color='brand.fg'>{icon}</ChakraEmptyState.Indicator>
      <VStack textAlign='center' gap='1'>
        <ChakraEmptyState.Title fontFamily='heading' fontSize='lg'>
          {title}
        </ChakraEmptyState.Title>
        {description && <ChakraEmptyState.Description maxW='sm'>{description}</ChakraEmptyState.Description>}
      </VStack>
      {action}
    </ChakraEmptyState.Content>
  </ChakraEmptyState.Root>
);

export default EmptyState;
