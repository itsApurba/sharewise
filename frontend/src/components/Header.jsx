import { Avatar, Box, Button, Center, Flex, HStack, Heading, Stack, useColorMode, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Link, NavLink } from "react-router-dom";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4} w='full'>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"} maxW={"container.lg"} m={"auto"} w='full' position={"sticky"}>
          <Link to={"/"}>
            <Heading fontFamily={"cursive"} fontSize={"2xl"}>
              ShareWise
            </Heading>
          </Link>
          <HStack gap={2}>
            <HStack gap={2}>
              <NavLink to='/create'>Create</NavLink>
              <NavLink to='/users'>Users</NavLink>
              <NavLink to='/user-analytics'>User Analytics</NavLink>
              <NavLink to='/post-analytics'>Post Analytics</NavLink>
            </HStack>
            <Flex alignItems={"center"}>
              <Stack direction={"row"} spacing={5}>
                <Button onClick={toggleColorMode}>{colorMode === "light" ? <MoonIcon /> : <SunIcon />}</Button>
              </Stack>
            </Flex>
          </HStack>
        </Flex>
      </Box>
    </>
  );
};

export default Header;
