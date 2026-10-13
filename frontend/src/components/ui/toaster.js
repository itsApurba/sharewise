import { createToaster } from "@chakra-ui/react";

// Top of the screen so toasts never sit under the mobile bottom nav.
export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});
