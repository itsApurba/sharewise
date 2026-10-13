import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import system from "../../theme";
import AppToaster from "./AppToaster";

const Provider = ({ children }) => {
  return (
    <ChakraProvider value={system}>
      {/* The inline theme script never runs in a client-rendered app; a data-block type stops React 19 warning about it. */}
      <ThemeProvider attribute='class' defaultTheme='system' disableTransitionOnChange scriptProps={{ type: "application/json" }}>
        {children}
        <AppToaster />
      </ThemeProvider>
    </ChakraProvider>
  );
};

export default Provider;
