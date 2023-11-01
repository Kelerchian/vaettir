import { Vaettir, VaettirReact } from "vaettir-react";
import { BoolLock } from "systemic-ts-utils/lock";
import { sleep } from "systemic-ts-utils/async-utils";
import { useEffect } from "react";

type AgentType = ReturnType<typeof Agent>;
const Agent = () =>
  Vaettir.build()
    .api(({ channels, onDestroy, isDestroyed }) => {
      const top = 1000;
      const increment = 5;
      const data = {
        // rotates from 0 -> top
        rot: 0,
      };

      const lock = BoolLock.make();

      // initialization needs to be called separately because it is a
      // side-effect (call to sleep) and due to this
      // https://legacy.reactjs.org/docs/strict-mode.html#ensuring-reusable-state
      const init = () =>
        // Make sure that, when init is accidentally called twice, it doesn't
        // run the loop twice, thus introducing data race with data.rot
        lock.use(async () => {
          // while not destroyed, keep running this loop...
          while (!isDestroyed()) {
            data.rot += increment;
            data.rot = data.rot % top;
            channels.change.emit();
            // ...every 1000/60 milliseconds (roughly 60fps)
            await sleep(Math.round(1000 / 60));
          }
        });

      const getRGB = () => {
        const rRot = (data.rot + 0 * Math.round(top / 3)) % top;
        const gRot = (data.rot + 1 * Math.round(top / 3)) % top;
        const bRot = (data.rot + 2 * Math.round(top / 3)) % top;

        return {
          r: ((Math.cos((Math.PI * 2 * rRot) / top) + 1) / 2) * 255,
          g: ((Math.cos((Math.PI * 2 * gRot) / top) + 1) / 2) * 255,
          b: ((Math.cos((Math.PI * 2 * bRot) / top) + 1) / 2) * 255,
        };
      };

      return {
        init,
        getRGB,
      };
    })
    .finish();

const Parent = () => {
  // Create, own, and subscribe to agent
  const agent = VaettirReact.useOwned(() => Agent());

  useEffect(() => {
    agent.api.init();
    agent.whenDestroyed.then(() => {
      console.log("agent is destroyed");
    });
  }, [agent]);

  return (
    <div>
      <p>Agent can have an internal process.</p>
      <p>
        This color shifting is triggered by a single `useEffect` to `init`,
        which starts an internal process that keeps running until the agent is
        destroyed (click the button below).
      </p>
      <RGB agent={agent} />
      <pre>
        {JSON.stringify(
          {
            ...agent.api.getRGB(),
            destroyed: agent.isDestroyed(),
          },
          null,
          2,
        )}
      </pre>
      <button
        disabled={agent.isDestroyed()}
        onClick={() => {
          agent.destroy();
        }}
      >
        Destroy agent
      </button>
    </div>
  );
};

const RGB = ({ agent }: { agent: AgentType }) => {
  // Subscribe to agent
  // Everytime `channels.change.emit();` is called from within the agent
  // This component re-renders
  VaettirReact.use(agent);

  const { r, g, b } = agent.api.getRGB();

  return (
    <div
      style={{
        width: "100px",
        height: "100px",
        background: `rgb(${r},${g},${b})`,
      }}
    ></div>
  );
};

export default Parent;
