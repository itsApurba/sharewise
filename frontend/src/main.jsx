import ReactDOM from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import App from "./App.jsx";
import "./index.css";
import Provider from "./components/ui/Provider";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    {/* <React.StrictMode> */}
    <Provider>
      <App />
    </Provider>
    {/* </React.StrictMode> */}
  </Router>
);
