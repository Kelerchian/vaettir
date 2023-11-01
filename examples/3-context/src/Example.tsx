import * as React from "react";
import { Vaettir, VaettirReact } from "vaettir-react";

// Define agent and context

type AgentType = ReturnType<typeof Agent>;
const Agent = () =>
  Vaettir.build()
    .api(({ channels }) => ({ triggerChange: channels.change.emit }))
    .finish();

const AgentContext = VaettirReact.Context.make<AgentType>();

// Example

const Top = React.memo(() => {
  // Create, own, and subscribe to agent
  const agent = VaettirReact.useOwned(() => Agent());

  // Pass down via context
  return (
    <AgentContext.Provider value={agent}>
      <ColoredBox>
        <p>
          Agents can be passed down via context (created by
          VaettirAgent.Context.make()) which then can be borrowed via
          `context.borrowAndListen()`
        </p>
        <p></p>
        <Mid />
      </ColoredBox>
      <button onClick={() => agent.api.triggerChange()}>
        Trigger agent change
      </button>
    </AgentContext.Provider>
  );
});

const Mid = React.memo(() => {
  const agent = AgentContext.borrow();
  return (
    <ColoredBox>
      <p>
        `.borrow`-ing an agent without listening will not trigger rerender if a
        change is triggered from the agent. (Click the button to see)
      </p>
      <button onClick={() => agent.api.triggerChange()}>
        Trigger agent change
      </button>
      <Bottom />
    </ColoredBox>
  );
});

const Bottom = React.memo(() => {
  // borrow and listen to the agent from context, but do nothing with it
  const _agent = AgentContext.borrowListen();
  return (
    <ColoredBox>
      <p>This component will rerender because it calls `.borrowListen`</p>
    </ColoredBox>
  );
});

// Render different-colored box
const ColoredBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: "2px",
      border: `7rem solid rgba(${Math.round(Math.random() * 255)},${Math.round(
        Math.random() * 255,
      )},${Math.round(Math.random() * 255)})`,
    }}
  >
    {children}
  </div>
);

export default Top;
