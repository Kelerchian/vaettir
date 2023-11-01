# Vaettir-React

A turing-complete agent that manage your state.

## Philosophy

State management in React has always been passive, such as state machine or actor model.
Passive object is a simple concept but it doesn't scale with complexity.
As software grows in complexity, the required active computations take the form of business logic and control flow scattered across the codebase, making a single flow hard to track.
In addition to that, this scattered business logic will eventually coincide with React component lifecycle management, making both hard to synchronize.

On the other hand, Agent object can create output in absence of input and can receive input without outputting.
Think of a mini server running inside your application.

Vaettir provides TypeScript API to easily create agents, manage its lifetime, and link it to React components.
This allows authoring complex business logic that is decoupled from React lifecycle management.

## Basics

Imagine a component that needs a periodical update.
With Vaettir, it can be easily written as an agent with an async loop that stops on the agent's destruction.

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

Internal data is exposed to external party, which allows the agent to have total control of its own data encapsulation.

In the React component, instantiate, "use", and "own" the agent.
"Using" an agent means that whenever it emits a change event (from calling `channels.change.emit()`), the React component will re-render.
"Owning" an agent means binding its lifetime to the component's--the agent will be destroyed when the component is unmounted or if there's a change in the dependency array (similar to `useEffect`).

```tsx
import * as React from "react";

const SomeComponent = ({ url }: { url: string }) => {
  const agent = VaettirReact.useOwned(() => AutomaticDataUpdater(url), [url]); // [url] is a dependency array similar to useEffect's dependency array, except that it defaults to []

  return <SomeOtherComponentThatRendersPost posts={agent.getPosts()} />;
};
```

React components can receive unowned agents and subscribe to its changes by calling `VaettirReact.use`--effectively sharing exposed APis with the agent's owner.

```tsx
import * as React from "react";

const PostCount = ({ agent }: { agent: AutomaticDataUpdater }) => {
  // The component listens to the agent's changes and re-renders with it
  VaettirReact.use(agent);
  return <div>Number of posts = {agent.getPosts().length}</div>;
};
```

## Context

Vaettir-React also comes with context toolings to easily distributed Vaettir agents within a scope.

```tsx
export const AutomaticDataUpdaterContext =
  VaettirReact.Context.make<AutomaticDataUpdater>();
```

The context works exactly like React context with a similar but more precise API.

```tsx
import { AutomaticDataUpdaterContext } from "some/path";

export const RootComponent = () => {
  const agent = VaettirReact.useOwned(() =>
    AutomaticDataUpdate(SOME_URL),
  );

  return (
    <AutomaticDataUpdateContext.Provide value={agent}>
      <App>
    </AutomaticDataUpdateContext.Provide>
  );
};
```

Underneath the provided context, any components can use the agent like so:

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
