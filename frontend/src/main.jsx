import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme.js";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    {/* <React.StrictMode> */}
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
    {/* </React.StrictMode> */}
  </Router>
);
