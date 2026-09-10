import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import {LiveProvider} from "./context/LiveContext.jsx";
import App from "./App.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <PreferencesProvider>
          <AuthProvider>
            <LiveProvider><App /></LiveProvider>
          </AuthProvider>
        </PreferencesProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
