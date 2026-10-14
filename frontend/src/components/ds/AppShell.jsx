import { Badge, Box, Button, Flex, Float, HStack, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import { LuLogIn, LuPlus } from "react-icons/lu";
import { Link, NavLink, Outlet } from "react-router-dom";
import ColorModeButton from "./ColorModeButton";
import Logo from "./Logo";
import { CLASSIC_NAV, PRIMARY_NAV } from "./navItems";

/*
 * Layout by breakpoint:
 *   base (< 768px):  top bar + fixed bottom nav (Feed / Explore / Review / Stats / Profile)
 *   md (768-1023px): icon rail on the left
 *   lg (>= 1024px):  full sidebar with labels
 */

const NavIcon = ({ icon: ItemIcon, count }) => (
  <Box position='relative' display='inline-flex'>
    <Icon boxSize='5'>
      <ItemIcon />
    </Icon>
    {count > 0 && (
      <Float placement='top-end' offset='0.5'>
        <Badge size='xs' variant='solid' colorPalette='honey' rounded='full' minW='4' h='4' px='1' justifyContent='center' fontSize='2xs'>
          {count > 99 ? "99+" : count}
        </Badge>
      </Float>
    )}
  </Box>
);

const badgeLabel = (label, count) => (count > 0 ? `${label}, ${count} due` : label);

/** One sidebar entry: icon-only on the md rail, icon + label from lg. */
const SidebarLink = ({ item, count }) => (
  <NavLink to={item.to} end={item.end} aria-label={badgeLabel(item.label, count)} title={item.label}>
    {({ isActive }) => (
      <HStack
        gap='3'
        h='10'
        px={{ md: "0", lg: "3" }}
        justify={{ md: "center", lg: "flex-start" }}
        rounded='control'
        color={isActive ? "brand.fg" : "fg.muted"}
        bg={isActive ? "brand.subtle" : "transparent"}
        fontWeight={isActive ? "600" : "500"}
        _hover={{ bg: isActive ? "brand.subtle" : "bg.muted", color: isActive ? "brand.fg" : "fg" }}
        transition='background 150ms, color 150ms'
      >
        <NavIcon icon={item.icon} count={count} />
        <Text display={{ md: "none", lg: "block" }} fontSize='sm' truncate>
          {item.label}
        </Text>
      </HStack>
    )}
  </NavLink>
);

const Sidebar = ({ badges }) => (
  <Flex
    as='nav'
    aria-label='Main'
    display={{ base: "none", md: "flex" }}
    direction='column'
    position='sticky'
    top='0'
    h='100dvh'
    w={{ md: "rail", lg: "sidebar" }}
    flexShrink={0}
    borderEndWidth='1px'
    borderColor='border.muted'
    bg='bg.subtle'
    px={{ md: "2", lg: "4" }}
    py='5'
    gap='6'
    overflowY='auto'
  >
    <Box px={{ lg: "2" }} display='flex' justifyContent={{ md: "center", lg: "flex-start" }}>
      <Box display={{ md: "block", lg: "none" }}>
        <Logo compact />
      </Box>
      <Box display={{ md: "none", lg: "block" }}>
        <Logo />
      </Box>
    </Box>

    <Button asChild rounded='full' size='md' px={{ md: "0", lg: "4" }}>
      <Link to='/new' aria-label='New lesson'>
        <LuPlus />
        <Box as='span' display={{ md: "none", lg: "inline" }}>
          New lesson
        </Box>
      </Link>
    </Button>

    <Stack gap='1'>
      {PRIMARY_NAV.map((item) => (
        <SidebarLink key={item.to} item={item} count={item.badge ? badges[item.badge] : 0} />
      ))}
    </Stack>

    <Stack gap='1'>
      <Text textStyle='label' color='fg.muted' px='3' mb='1' display={{ md: "none", lg: "block" }}>
        Classic
      </Text>
      {CLASSIC_NAV.map((item) => (
        <SidebarLink key={item.to} item={item} />
      ))}
    </Stack>

    <Stack mt='auto' gap='1' align={{ md: "center", lg: "stretch" }}>
      <HStack justify={{ md: "center", lg: "space-between" }} flexDirection={{ md: "column", lg: "row" }} gap='2'>
        <Button asChild variant='ghost' colorPalette='gray' size='sm' px={{ md: "2", lg: "3" }}>
          <Link to='/login' aria-label='Log in'>
            <LuLogIn />
            <Box as='span' display={{ md: "none", lg: "inline" }}>
              Log in
            </Box>
          </Link>
        </Button>
        <ColorModeButton size='sm' />
      </HStack>
    </Stack>
  </Flex>
);

const TopBar = () => (
  <HStack
    as='header'
    display={{ base: "flex", md: "none" }}
    position='sticky'
    top='0'
    zIndex='sticky'
    h='topBar'
    px='4'
    justify='space-between'
    bg='bg/90'
    backdropFilter='blur(10px)'
    borderBottomWidth='1px'
    borderColor='border.muted'
  >
    <Logo />
    <HStack gap='1'>
      <ColorModeButton size='sm' />
      <IconButton asChild size='sm' rounded='full' aria-label='New lesson'>
        <Link to='/new'>
          <LuPlus />
        </Link>
      </IconButton>
    </HStack>
  </HStack>
);

const BottomNav = ({ badges }) => (
  <Box
    as='nav'
    aria-label='Main'
    display={{ base: "block", md: "none" }}
    position='fixed'
    insetX='0'
    bottom='0'
    zIndex='sticky'
    bg='bg.panel'
    boxShadow='nav'
    pb='env(safe-area-inset-bottom)'
  >
    <Flex h='bottomNav' align='stretch'>
      {PRIMARY_NAV.map((item) => {
        const count = item.badge ? badges[item.badge] : 0;
        return (
          <Box key={item.to} flex='1' minW='0' asChild>
            <NavLink to={item.to} end={item.end} aria-label={badgeLabel(item.label, count)}>
              {({ isActive }) => (
                <Flex direction='column' align='center' justify='center' gap='1' h='full' color={isActive ? "brand.fg" : "fg.muted"}>
                  <Flex
                    align='center'
                    justify='center'
                    h='7'
                    w='12'
                    rounded='full'
                    bg={isActive ? "brand.subtle" : "transparent"}
                    transition='background 150ms'
                  >
                    <NavIcon icon={item.icon} count={count} />
                  </Flex>
                  <Text fontSize='2xs' fontWeight={isActive ? "700" : "500"} lineHeight='1'>
                    {item.label}
                  </Text>
                </Flex>
              )}
            </NavLink>
          </Box>
        );
      })}
    </Flex>
  </Box>
);

/**
 * The app frame every in-app screen renders inside (via <Outlet />).
 * `badges.review` is the due-count slot on the Review tab.
 */
const AppShell = ({ badges = {} }) => (
  <Flex minH='100dvh' w='full'>
    <Sidebar badges={badges} />
    <Flex direction='column' flex='1' minW='0'>
      <TopBar />
      <Box
        as='main'
        flex='1'
        w='full'
        px={{ base: "4", md: "6", lg: "10" }}
        pt={{ base: "5", md: "8", lg: "10" }}
        pb={{ base: "calc(var(--chakra-sizes-bottom-nav) + env(safe-area-inset-bottom) + 1.5rem)", md: "10" }}
      >
        <Outlet />
      </Box>
    </Flex>
    <BottomNav badges={badges} />
  </Flex>
);

export default AppShell;
