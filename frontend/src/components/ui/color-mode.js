import { useTheme } from "next-themes";

/** Chakra 3 leaves color mode to next-themes; this keeps Chakra 2's hook shape. */
export const useColorMode = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleColorMode = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  return { colorMode: resolvedTheme, toggleColorMode };
};
