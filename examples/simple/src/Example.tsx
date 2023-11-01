import { Vaettir, VaettirReact } from "vaettir-react";

type AgentType = ReturnType<typeof Agent>;
const Agent = () =>
  Vaettir.build()
    .api(({ channels }) => {
      const data = { value: "" };

      return {
        get: () => data.value,
        set: (value: string) => {
          data.value = value; // mutate internal data
          channels.change.emit(); // signal change to external subscriber
        },
        clear: () => {
          data.value = ""; // mutate internal data
          channels.change.emit(); // signal change to external subscriber
        },
      };
    })
    .finish();

const Parent = () => {
  // Create, own, and subscribe to agent
  const agent = VaettirReact.useOwned(() => Agent());

  return (
    <div>
      <p>
        Agents can be lent to children components to share state (e.g. get())
        and procedures (e.g. set())
      </p>
      <input
        type="text"
        value={agent.api.get()}
        onChange={(e) => agent.api.set(e.target.value || "")}
      ></input>
      <View agent={agent} />
      <ViewMangled agent={agent} />
      <ClearButton agent={agent} />
    </div>
  );
};

const View = ({ agent }: { agent: AgentType }) => {
  // Subscribe to agent
  VaettirReact.use(agent);
  return <div>{agent.api.get()}</div>;
};

const ViewMangled = ({ agent }: { agent: AgentType }) => {
  // Subscribe to agent
  VaettirReact.use(agent);
  return (
    <div>
      {agent.api
        .get()
        .split("")
        .filter((_, i) => i % 2 === 0)
        .join("")}
    </div>
  );
};

const ClearButton = ({ agent }: { agent: AgentType }) => {
  VaettirReact.use(agent);
  return (
    <>
      {agent.api.get().length > 0 && (
        <button onClick={() => agent.api.clear()}>Clear</button>
      )}
    </>
  );
};

export default Parent;
