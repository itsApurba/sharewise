import { VStack } from "@chakra-ui/react";
import "./App.css";
import Header from "./components/Header";
import AllRoutes from "./AllRoutes";
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.min.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      cacheTime: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VStack minH='100vh'>
        <Header />
        <AllRoutes />
        <ToastContainer position="bottom-right"/>
      </VStack>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right"/>
    </QueryClientProvider>
  );
}

export default App;
