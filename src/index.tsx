import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./app";

import "./index.css";
import { SpellClass } from "./pages";


const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:className" element={<SpellClass />} />
      </Routes>     
      </BrowserRouter>
    </StrictMode>
  );
}
