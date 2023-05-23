import { VStack } from "@chakra-ui/react";
import "./App.css";
import Header from "./components/Header";

function App() {
  return (
    <>
      <VStack w='100vw' h='100vh'>
        <Header />
      </VStack>
    </>
  );
}

export default App;
