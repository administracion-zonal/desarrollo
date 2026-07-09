import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
import "./index.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/layout-shell.css";
import "./styles/menu.css";
import "./styles/profile.css";
import "./styles/reservations.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
