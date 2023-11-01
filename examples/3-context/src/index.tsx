import * as ReactDOM from "react-dom/client";
import Top from "./Example";
import { StrictMode } from "react";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <StrictMode>
    <Top />
  </StrictMode>,
);
