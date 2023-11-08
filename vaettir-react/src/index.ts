/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState, useContext, createContext, useMemo } from "react";
import { Vaettir, Obs } from "vaettir";
export { Vaettir, Obs, Destruction } from "vaettir";

export namespace VaettirReact {
  const DEFAULT_SYMBOL = Symbol();

  export class VaettirReactContextError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "VaettirReactContextError";
    }
  }

  export namespace Context {
    export const VaettirReactContextError =
      VaettirReact.VaettirReactContextError;

    type VaettirContext<V extends Vaettir<any, any>> = {
      /**
       * React.Provider for Vaettir agent `V`
       * @example
       * const agent = VaettirReact.useOwned(() => Agent());
       * return (
       *   <ActyxContext.Provider value={agent}>
       *     <App />
       *   </ActyxContext.Provider>
       * )
       */
      Provider: React.Provider<V>;
      /**
       * Borrows an agent from Context.
       * @throws `VaettirReactContextError` if no agent is provided via the context
       * @example
       * const agent = AgentContext.borrow();
       */
      borrow: () => V;
      /**
       * Borrows an agent from Context.
       * @throws `VaettirReactContextError` if no agent is provided via the context
       * @example
       * const agent = AgentContext.borrowListen();
       * // equivalent to
       * const agent = AgentContext.borrow();
       * VaettirReact.use(agent);
       */
      borrowListen: () => V;
    };

    /**
     * Create Context wrapper for a particular type of Vaettir agent.
     *
     * @example
     * // In an agent-specific module
     * const AgentContext = VaettirReact.Context.make<AgentType>()
     * // At root component
     * const SomeRootComponent = () => {
     *   const agent = VaettirReact.useOwned(() => Agent());
     *   return (
     *      <AgentContext.Provider agent={agent}>
     *        <App />
     *      </AgentContext.Provider>
     *   )
     * }
     * // At some sub-component
     * const SomeSubComponent = () => {
     *    const agent = AgentContext.use();
     *    return (
     *      <div>{agent.someMethod()}</div>
     *    )
     * }
     */
    export const make = <V extends Vaettir<any, any>>(): VaettirContext<V> => {
      const CurrentContext = createContext<V | null>(null);
      const borrow = () => {
        const item = useContext(CurrentContext);
        if (!item) throw new VaettirReactContextError("");
        return item;
      };
      const borrowListen = () => {
        const item = borrow();
        VaettirReact.use(item);
        return item;
      };
      return {
        Provider: CurrentContext.Provider as React.Provider<V>,
        borrow,
        borrowListen,
      };
    };
  }

  /**
   * Listens to a specific Vaettir channel
   * @example
   * VaettirReact.useObs(agent.channels.onListChange)
   */
  export const useObs = <T extends unknown>(obs: Obs<T>) => {
    const [_, set] = useState(Symbol());
    useEffect(() => {
      const unsub = obs.sub(() => {
        set(Symbol());
      });
      return () => {
        unsub();
      };
    }, [obs]);
  };

  /**
   * Create an owned Vaettir agent and listens to its change.
   * Owned Vaettir agent is destroyed when the owning component is unmounted or some of the dependency changes.
   * @example
   * const SomeComponent = () => {
   *   const agent = VaettirReact.useOwned(() => Agent());
   *   return (
   *     <>
   *       ...
   *     </>
   *   )
   * }
   * @example
   * const agent = VaettirReact.useOwned(() => Agent(inputs), [inputs])
   */
  export const useOwned = <
    API extends Vaettir.DefaultAPI,
    Channels extends Vaettir.DefaultChannels,
    Deps extends readonly any[],
  >(
    factoryFn: () => Vaettir<API, Channels>,
    deps?: Deps,
  ) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const memo = useMemo(() => {
      let theVaettir = factoryFn();
      let firstTime = true;
      return {
        change: () => {
          if (firstTime) {
            firstTime = false;
          } else {
            theVaettir = factoryFn();
          }
        },
        get: () => theVaettir,
      };
    }, []);

    const vaettir = memo.get();

    useEffect(() => {
      memo.change();
    }, deps || []);

    // destroy when parent is destroyed
    useEffect(() => {
      return () => {
        vaettir.destroy();
      };
    }, [vaettir.id]);

    // subscribe
    use(vaettir);

    return vaettir;
  };

  /**
   * Listen to changes to an unowned agent.
   * Component that listens to an agent will re-render if `agent.channels.change` is emitted.
   * @example
   * const SomeComponent = ({agent}: {agent: Agent}) => {
   *   Vaettir.use(agent);
   *   return (
   *     <>
   *       ...
   *     </>
   *   )
   * }
   * @example
   * Vaettir.use(agent, [some, other, dependencies]) // behave like useEffect's dependency list
   */
  export const use = <
    API extends Vaettir.DefaultAPI,
    Channels extends Vaettir.DefaultChannels,
    Deps extends readonly any[],
  >(
    Vaettir: Vaettir<API, Channels>,
    deps?: Deps,
  ) => {
    const [_, setKey] = useState<Symbol>(DEFAULT_SYMBOL);
    useEffect(() => {
      const unsub = Vaettir.channels.change.sub(() => {
        setKey(Symbol());
      });

      return () => {
        unsub();
      };
    }, [Vaettir.id, ...(deps || [])]);

    return Vaettir;
  };
}
