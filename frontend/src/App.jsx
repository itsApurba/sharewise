import { VStack } from "@chakra-ui/react";
import "./App.css";
import Header from "./components/Header";
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
      <VStack minH='100vh'>
        <Header />
        <AllRoutes />
      </VStack>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right"/>
    </QueryClientProvider>
  );
}

export default App;
