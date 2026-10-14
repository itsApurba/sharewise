import { IconButton } from "@chakra-ui/react";
import { LuMoon, LuSun } from "react-icons/lu";
import { useColorMode } from "../ui/color-mode";

const ColorModeButton = (props) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";
  return (
    <IconButton
      variant='ghost'
      colorPalette='gray'
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleColorMode}
      {...props}
    >
      {isDark ? <LuSun /> : <LuMoon />}
    </IconButton>
  );
};

export default ColorModeButton;
