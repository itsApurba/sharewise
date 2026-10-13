import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Chakra 3 dropped the container.* sizes; the layouts here still size against Chakra 2's values.
const config = defineConfig({
  theme: {
    tokens: {
      sizes: {
        container: {
          sm: { value: "640px" },
          md: { value: "768px" },
          lg: { value: "1024px" },
          xl: { value: "1280px" },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export default system;
