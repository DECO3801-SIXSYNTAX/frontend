import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind directives
import SignIn from "./pages/SignIn";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <SignIn />
  </React.StrictMode>
);
