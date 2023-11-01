import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Parent from "./Example";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Parent />
  </React.StrictMode>,
);
