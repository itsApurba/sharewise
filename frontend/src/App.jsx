import { VStack } from "@chakra-ui/react";
import "./App.css";
import Header from "./components/Header";
import UserForm from "./components/UserForm";
import PostForm from "./components/PostForm";

function App() {
  return (
    <>
      <VStack w='100vw' h='100vh'>
        <Header />
        <UserForm/>
      </VStack>
    </>
  );
}

export default App;
