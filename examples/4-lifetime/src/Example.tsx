import * as React from "react";
import { Vaettir, VaettirReact } from "vaettir-react";

// Define agent and context

const idGenerator = (function* () {
  let x = 0;
  while (true) {
    yield String(x);
    x++;
  }
})();

const MouseTracker = (id: string) =>
  Vaettir.build()
    .api(({ channels, onDestroy }) => {
      const data = { coord: [0, 0] };

      const listener = (e: MouseEvent) => {
        data.coord = [e.x, e.y];
        channels.change.emit();
      };

      window.addEventListener("mousemove", listener);
      // remove event listener to prevent zombie listeners
      onDestroy(() => window.removeEventListener("mousemove", listener));
      onDestroy(() => {
        console.log("MouseTracker destroyed:", id);
      });

      // log on creation
      console.log("MouseTracker created:", id);

      return {
        getCoord: () => data.coord,
      };
    })
    .finish();

// Example

const RecursiveMouseTracker = React.memo(() => {
  const id = React.useMemo(() => idGenerator.next().value, []);
  const [hasChild, setHasChild] = React.useState(false);
  const agent = VaettirReact.useOwned(() => MouseTracker(id));

  return (
    <div>
      <div>
        {id}: {JSON.stringify(agent.api.getCoord(), null, 2)}
      </div>
      <button onClick={() => setHasChild((x) => !x)}>toggle</button>
      {hasChild && <RecursiveMouseTracker />}
    </div>
  );
});

export default () => (
  <div>
    <p>
      Open and watch the devtools console, play around with the toggle. Agent
      owned by component is destroyed if the component is unmounted.{" "}
    </p>
    <p>
      Use `onDestroy` API from inside the agent to do clean-up tasks on
      destruction, such as removing previously-registered event listeners
    </p>
    <RecursiveMouseTracker />
  </div>
);
