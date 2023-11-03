# Vaettir-React

A turing-complete agent that manage your state.

## Philosophy

The existing passive state management in the React ecosystem is simple until it explodes in complexity compared to the application's complexity.
Passive state management relies on the fact that it reacts to an input or a signal--e.g. a dispatch, a method call.
Most passive state management APIs are modelled after a sub turing-complete language constructs (e.g. state machine, actor model), making it hard to use to model turing-complete processes.
Moreover, because of its passiveness, it is very hard to manage concurrent asynchronous operations acted upon it without modifying the state structure.

An agent is a turing-complete and concurrent construct--a self executing object.
It can both react to inputs and act without.
Managing concurrent control flow from external parties is simpler.
Think of a mini server running inside your application.

Vaettir-React provides API to design agents that:

- can be linked to React's component lifetime
- can flexibly signal changes to trigger React's component re-render

This results in a loose-coupling with React component without extra hassle, making both the agent and the components easy to refactor.

## Basics

Imagine an imaginary scenario: a react component that updates periodically.
It is easily written in Vaettir as an agent containing an async loop.

```tsx
import { VaettirReact } from "vaettir-react";

type AutomaticDataUpdater = ReturnType<typeof AutomaticDataUpdater>;
const AutomaticDataUpdater = (url: string) =>
  Vaettir.build()
    .api(({ channels, isDestroyed }) => {
      const data = {
        posts: [] as Post[],
      };

      (async () => {
        // Update post every 10 seconds
        // Until this agent is destroyed
        while (!isDestroyed()) {
          await updatePosts();
          await sleep(10000);
        }
      })();

      const updatePosts = () => {
        const latestPosts = fetchPosts(url);
        if (deepEqual(data.posts, latestPosts)) return;
        data.posts = latestPosts;
        // signal change to external subscriber
        channels.change.emit();
      };

      return {
        getPosts: () => [...data.posts],
      };
    })
    .finish();
```

The agent has an internal async loop which updates every 10 seconds until the agent is destroyed.
It also exposes a function to view its internal `data.posts` simply via the `return` keyword.
This is simply just a typed [closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures).

From the React Component's side, we can control how long an agent lives.
A React component can "own" an agent; when the component is mounted and unmounted, it will respectively create and destroy the agent.
An owning component automatically re-render when detecting changes from the agent, signaled by the call to `channels.change.emit()`.

```tsx
import * as React from "react";

const SomeComponent = ({ url }: { url: string }) => {
  const agent = VaettirReact.useOwned(() => AutomaticDataUpdater(url), [url]); // [url] is a dependency array similar to useEffect's dependency array, except that it defaults to []

  return <SomeOtherComponentThatRendersPost posts={agent.getPosts()} />;
};
```

React components can receive an agent from its props--an unowned agent.
Calling `VaettirReact.use(agent)` will make the React component re-render when the agent signals a change.

```tsx
import * as React from "react";

const PostCount = ({ agent }: { agent: AutomaticDataUpdater }) => {
  // The component listens to the agent's changes and re-renders with it
  VaettirReact.use(agent);
  return <div>Number of posts = {agent.getPosts().length}</div>;
};
```

Sharing agents between React components effectively shares its exposed APIs.
This allows components to communicate between each other through the agent.

## Context

Vaettir-React comes with toolings to distribute agents via React context.
The context works exactly like React context with a similar but more precise API.

```tsx
// defined in a separate module
export const AutomaticDataUpdater = (url: string) =>
  Vaettir.build()
    .api(() => {
      // internal implementation
      return {};
    })
    .finish();
export const AutomaticDataUpdaterContext =
  VaettirReact.Context.make<AutomaticDataUpdater>();
```

Agents are injected into the context by passing it through `<Context.Provide value={agent}>`;

```tsx
import { AutomaticDataUpdaterContext } from "some/path";

export const RootComponent = () => {
  const agent = VaettirReact.useOwned(() =>
    AutomaticDataUpdater(SOME_URL),
  );

  return (
    <AutomaticDataUpdateContext.Provide value={agent}>
      <App>
    </AutomaticDataUpdateContext.Provide>
  );
};
```

Under the provided context, any components can use the agent by calling `Context.use()`.

```tsx
import { AutomaticDataUpdaterContext } from "some/path";

export const SubComponent = () => {
  // uses an agent and listen to its changes
  const agent = AutomaticDataUpdaterContext.borrowListen();
  // AutomaticDataUpdaterContext.borrow() can be used to avoid listening to changes

  return (
    <button
      onClick={() => {
        agent.doStuffs();
      }}
    >
      Some action
    </button>
  );
};
```
