/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/jest-globals";
import * as React from "react";
import { sleep } from "systemic-ts-utils/async-utils";
import { it, expect, describe, beforeEach } from "@jest/globals";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { Vaettir, VaettirReact } from "../src/index.js";

describe("VaettirReact.use", () => {
  type Agent = ReturnType<typeof Agent>;
  const Agent = () =>
    Vaettir.build()
      .api(({ channels }) => {
        const data = { counter: 0 };

        return {
          increment: async () => {
            await sleep(10);
            data.counter += 1;
            channels.change.emit();
          },
          value: () => data.counter,
        };
      })
      .finish();

  const TheElement = ({ agent }: { agent: Agent }) => {
    VaettirReact.use(agent);
    return <div data-testid="the-element">{agent.api.value()}</div>;
  };

  it("should work", async () => {
    const agent = Agent();
    render(<TheElement agent={agent} />);
    expect(await screen.findByTestId("the-element")).toHaveTextContent("0");
    await act(async () => agent.api.increment());
    expect(await screen.findByTestId("the-element")).toHaveTextContent("1");
  });
});

describe("VaettirReact.Context", () => {
  type Agent = ReturnType<typeof Agent>;
  const Agent = (sym: symbol) =>
    Vaettir.build()
      .api(({ channels }) => {
        return {
          triggerChange: () => channels.change.emit(),
          sym: () => sym,
        };
      })
      .finish();

  const AgentContext = VaettirReact.Context.make<Agent>();

  const A = React.memo(({ sym }: { sym: symbol }) => {
    render_counts.a += 1;
    const agent = VaettirReact.useOwned(() => Agent(sym));
    return (
      <AgentContext.Provider value={agent}>
        <B />
      </AgentContext.Provider>
    );
  });

  const B = React.memo(() => {
    render_counts.b += 1;
    const agent = AgentContext.borrow();
    return <C />;
  });

  const C = React.memo(() => {
    render_counts.c += 1;
    const agent = AgentContext.borrowListen();
    c_returned_symbol = agent.api.sym();
    return (
      <div>
        <button
          data-testid="the-button"
          onClick={() => agent.api.triggerChange()}
        >
          the button
        </button>
      </div>
    );
  });

  // "global" variables for counting render counts
  let render_counts = { a: 0, b: 0, c: 0 };
  let c_returned_symbol = null as any;

  beforeEach(() => {
    render_counts = { a: 0, b: 0, c: 0 };
  });

  it("should work", async () => {
    const someUniqueSymbol = Symbol();
    render(<A sym={someUniqueSymbol} />);
    expect(c_returned_symbol).toBe(someUniqueSymbol);

    let render_count_snapshot = { ...render_counts };

    await act(() => fireEvent.click(screen.getByTestId("the-button")));
    await sleep(10);

    expect(render_counts.a).toBeGreaterThan(render_count_snapshot.a);
    expect(render_counts.b).toEqual(render_count_snapshot.b);
    expect(render_counts.c).toBeGreaterThan(render_count_snapshot.c);
  });
});
