import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { store } from "./app/store";
import { ThemeProvider } from "./context/ThemeContext";

// Inject store into axios — must happen AFTER store is created
// to avoid circular import: store → authSlice → axios → store
import { injectStore } from "./api/axios";
import { logout, setAccessToken } from "./features/auth/authSlice";
injectStore(store, { logout, setAccessToken });

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#161b22",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "13px",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#4ade80", secondary: "#0d1117" } },
              error:   { iconTheme: { primary: "#f87171", secondary: "#0d1117" } },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
