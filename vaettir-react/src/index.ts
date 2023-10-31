/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState, useContext, createContext, useMemo } from "react";
import { Vaettir, Obs } from "vaettir";
export { Vaettir, Obs } from "vaettir";

export namespace VaettirReact {
  const DEFAULT_SYMBOL = Symbol();

  export class VaettirReactContextError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "VaettirReactContextError";
    }
  }

  export namespace Context {
    export const make = <V extends Vaettir<any, any>>() => {
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
        Provider: CurrentContext.Provider,
        borrow,
        borrowListen,
      };
    };
  }

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

  export const useOwned = <
    API extends Vaettir.DefaultAPI,
    Channels extends Vaettir.DefaultChannels,
    Deps extends readonly any[],
  >(
    factoryFn: () => Vaettir<API, Channels>,
    deps?: Deps
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

    const Vaettir = memo.get();

    useEffect(() => {
      memo.change();
    }, deps || []);

    // destroy when parent is destroyed
    useEffect(() => {
      return () => {
        Vaettir.destroy();
      };
    }, [Vaettir.id]);

    // subscribe
    use(Vaettir);

    return Vaettir;
  };

  export const use = <
    API extends Vaettir.DefaultAPI,
    Channels extends Vaettir.DefaultChannels,
    Deps extends readonly any[],
  >(
    Vaettir: Vaettir<API, Channels>,
    deps?: Deps
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
