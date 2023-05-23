import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4} w='full'>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"} maxW={'container.lg'} m={'auto'} w='full' position={'sticky'}>
          <Heading fontFamily={'cursive'} fontSize={'2xl'}>ShareWise</Heading>

          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={5}>
              <Button onClick={toggleColorMode}>{colorMode === "light" ? <MoonIcon /> : <SunIcon />}</Button>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};

export default Header;
