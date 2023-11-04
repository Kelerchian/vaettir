import * as ReactDOM from "react-dom/client";
import { Game } from "./Example";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<Game />);
