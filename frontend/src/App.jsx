import AllRoutes from "./AllRoutes";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  return (
    <QueryClientProvider client={queryClient}>
      <AllRoutes />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right"/>
    </QueryClientProvider>
  );
}

export default App;
