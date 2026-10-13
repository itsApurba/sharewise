import { Box, Button, Flex, HStack, Heading, Stack } from "@chakra-ui/react";
import { LuMoon, LuSun } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";
import { useColorMode } from "./ui/color-mode";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <>
      <Box bg={{ base: "gray.100", _dark: "gray.900" }} px={4} w='full'>
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
              <Stack direction={"row"} gap={5}>
                <Button variant='subtle' aria-label='Toggle color mode' onClick={toggleColorMode}>
                  {colorMode === "light" ? <LuMoon /> : <LuSun />}
                </Button>
              </Stack>
            </Flex>
          </HStack>
        </Flex>
      </Box>
    </>
  );
};

export default Header;
