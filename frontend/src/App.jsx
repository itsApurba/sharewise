import AllRoutes from "./AllRoutes";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from "react";
import { onUnauthorized } from "./api/client";
import { resetSession } from "./hooks/useAuth";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 0,
    },
  },
});

function App() {
  // A rejected token (expired or revoked) logs the user out; the route guard then sends them to /login.
  useEffect(
    () =>
      onUnauthorized(() => resetSession(queryClient, null)),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AllRoutes />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left"/>
    </QueryClientProvider>
  );
}

export default App;
