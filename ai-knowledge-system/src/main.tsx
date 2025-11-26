import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Accessibility testing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
import "./styles/tokens.css"; // Import design system tokens

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
