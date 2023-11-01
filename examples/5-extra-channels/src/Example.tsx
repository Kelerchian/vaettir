import * as React from "react";
import { Vaettir, VaettirReact, Obs } from "vaettir-react";
import { sleep } from "systemic-ts-utils/async-utils";

// Define agent and context
type MultiChannel = ReturnType<typeof MultiChannel>;
const MultiChannel = () =>
  Vaettir.build()
    .channels((channels) => ({
      ...channels, // channels
      channel1: Obs.make<void>(),
      channel2: Obs.make<string>(),
      channel3: Obs.make<unknown>(),
    }))
    .api(({ channels, isDestroyed }) => {
      // while running, update channel3 regularly
      (async () => {
        while (!isDestroyed()) {
          channels.channel3.emit({});
          await sleep(1000);
        }
      })();

      return {
        triggerChange: () => channels.change.emit(),
        triggerChannel1: () => channels.channel1.emit(), // void doesn't require parameter
        triggerChannel2: () =>
          channels.channel2.emit(
            new Array(5)
              .fill(undefined)
              .map(() =>
                String.fromCharCode(Math.round(Math.random() * 25) + 97),
              )
              .join(""),
          ), // parameter must be string
      };
    })
    .finish();

// Example

const Root = React.memo(() => {
  const agent = VaettirReact.useOwned(MultiChannel);

  return (
    <>
      <ColoredBox>
        <button onClick={() => agent.api.triggerChange()}>
          Trigger Default Channel "Change"
        </button>
        <button onClick={() => agent.api.triggerChannel1()}>
          Trigger Channel 1
        </button>
        <button onClick={() => agent.api.triggerChannel2()}>
          Trigger Channel 2
        </button>
        <p>An agent can have channels other than the default one </p>
        <p>
          Here you can trigger signals via different channels and see which
          components re-renders.
        </p>
        <p>
          Channels can carries payload of a certain type. For example, channel 2
          carries string, which is captured by the component that listens to it.
        </p>
        <p>
          Channel 3 is internally triggered by an async loop as long as the
          agent is alive
        </p>
      </ColoredBox>
      <Channel1 agent={agent} />
      <Channel2 agent={agent} />
      <Channel3 agent={agent} />
    </>
  );
});

const Channel1 = React.memo(({ agent }: { agent: MultiChannel }) => {
  VaettirReact.useObs(agent.channels.channel1);
  return <ColoredBox>channel1</ColoredBox>;
});

const Channel2 = React.memo(({ agent }: { agent: MultiChannel }) => {
  const [state, setState] = React.useState<string>("");
  React.useEffect(() => {
    // manually subscribe to a channel
    const unsub = agent.channels.channel2.sub(setState);
    return () => {
      unsub();
    };
  }, [agent.channels.channel2]);
  return <ColoredBox>channel2: {state}</ColoredBox>;
});

const Channel3 = React.memo(({ agent }: { agent: MultiChannel }) => {
  const [state, setState] = React.useState<unknown>("");
  React.useEffect(() => {
    // manually subscribe to a channel
    const unsub = agent.channels.channel3.sub(setState);
    return () => {
      unsub();
    };
  }, [agent.channels.channel3]);
  return <ColoredBox>channel3: {JSON.stringify(state)}</ColoredBox>;
});

const ColoredBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: "2px",
      border: `2rem solid rgba(${Math.round(Math.random() * 255)},${Math.round(
        Math.random() * 255,
      )},${Math.round(Math.random() * 255)})`,
    }}
  >
    {children}
  </div>
);

export default Root;
