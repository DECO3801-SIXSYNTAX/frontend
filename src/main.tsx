import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { DashboardProvider } from "./contexts/DashboardContext";
import { ThemeProvider } from "./contexts/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DashboardProvider>
          <App />
        </DashboardProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
