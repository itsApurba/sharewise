import { Toaster, Portal, Stack, Toast } from "@chakra-ui/react";
import { toaster } from "./toaster";

const paletteByType = { success: "sage", error: "clay", warning: "honey", info: "brand", loading: "gray" };

const AppToaster = () => {
  return (
    <Portal>
      <Toaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }} colorPalette={paletteByType[toast.type] ?? "gray"}>
            <Toast.Indicator />
            <Stack gap='1' flex='1' maxWidth='100%'>
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
            </Stack>
            {toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
};

export default AppToaster;
