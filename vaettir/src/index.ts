import { Destruction } from "systemic-ts-utils/destruction";
import { Obs } from "systemic-ts-utils/obs";

export { Destruction };
export { Obs };

// eslint-disable-next-line @typescript-eslint/ban-types
type TDefaultAPI = {};
type TDefaultChannels = { change: Obs<void> };

type IdCont = {
  set: (id: string) => void;
  lazyGet: () => symbol;
};

namespace IdCont {
  export const make = () => {
    let stringIdentifier = "";
    let cachedSymbol: symbol | null = null;
    return {
      set: (id: string) => {
        if (cachedSymbol !== null) {
          throw new Error("id() cannot be called when already used");
        }
        stringIdentifier = id;
      },
      lazyGet: () => {
        const returned = cachedSymbol || Symbol(stringIdentifier);
        cachedSymbol = returned;
        return returned;
      },
    };
  };
}

export type Vaettir<
  API extends TDefaultAPI,
  Channels extends TDefaultChannels,
> = {
  /**
   * Symbolic representation of predefined ID
   */
  id: symbol;
  /**
   * Contains predefined event emitters
   */
  channels: Channels;
  /**
   * User's exposed API
   */
  api: API;
  /**
   * Destroys the agent
   */
  destroy: Destruction["destroy"];
  /**
   * @returns `true` if the agent is destroyed
   */
  isDestroyed: Destruction["isDestroyed"];
  /**
   * Promise that resolves when the agent is destroyed
   */
  whenDestroyed: Destruction["whenDestroyed"];
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace Vaettir {
  export type DefaultAPI = TDefaultAPI;
  export type DefaultChannels = TDefaultChannels;

  type AgentBuilder<
    API extends DefaultAPI,
    Channels extends DefaultChannels,
  > = {
    /**
     * Define internal data and external API
     * @example
     * Vaettir
     *  .build()
     *  .api(() => {
     *    const internalData = {}
     *    const internalFn = () => {}
     *    const externalFn = () => {}
     *    return { externalFn }
     *  })
     */
    api: <NewAPI extends DefaultAPI>(
      fn: (input: AgentAPIDefinerParam<API, Channels>) => NewAPI,
    ) => AgentBuilder<NewAPI, Channels>;
    /**
     * Define extra channels for specific purposes
     * @example
     * import { Vaettir, Obs } from "vaettir-react"
     *
     * Vaettir
     *  .build()
     *  .channels(channels => ({
     *    ...channels, // must be done to copy the default change channel
     *    onNameChange: Obs.make<string>()
     *  }))
     */
    channels: <NewChannels extends Channels>(
      fn: (channels: Channels) => NewChannels,
    ) => AgentBuilder<API, NewChannels>;
    /**
     * Provide a string to be wrapped into the Agent's Symbolic ID.
     * This is usually used for debugging purpose.
     */
    id: (id: string) => AgentBuilder<API, Channels>;
    /**
     * Finalize the build process
     * @example
     * import { Vaettir, Obs } from "vaettir-react"
     *
     * Vaettir
     *  .build()
     *  .api(() => ({
     *    // some api definitions
     *  }))
     *  .finish()
     */
    finish: () => Vaettir<API, Channels>;
  };

  const makeBuilderImpl = <
    API extends DefaultAPI,
    Channels extends DefaultChannels,
  >(
    prototype: AgentPrototype<API, Channels>,
  ): AgentBuilder<API, Channels> => {
    const finish = (): Vaettir<API, Channels> => {
      prototype.destruction.onDestroy(prototype.channels.change.emit);
      return {
        id: prototype.idCont.lazyGet(),
        api: prototype.api,
        channels: prototype.channels,
        destroy: prototype.destruction.destroy,
        isDestroyed: prototype.destruction.isDestroyed,
        whenDestroyed: prototype.destruction.whenDestroyed,
      };
    };

    const channels: AgentBuilder<API, Channels>["channels"] = (fn) =>
      makeBuilderImpl({
        ...prototype,
        channels: fn(prototype.channels),
      });

    const api: AgentBuilder<API, Channels>["api"] = (fn) =>
      makeBuilderImpl({
        ...prototype,
        api: fn({
          prev: prototype.api,
          channels: prototype.channels,
          onDestroy: prototype.destruction.onDestroy,
          isDestroyed: prototype.destruction.isDestroyed,
          id: prototype.idCont.lazyGet,
        }),
      });

    const id: AgentBuilder<API, Channels>["id"] = (id) => {
      prototype.idCont.set(id);
      return makeBuilderImpl(prototype);
    };

    return {
      id,
      finish,
      channels,
      api,
    };
  };

  /**
   * Starts a Vaettir agent's build process.
   *
   * @example
   *
   * const agent = Vaettir
   *  .build()
   *  .api(({
   *    prev,
   *    channels,
   *    onDestroy, // register
   *    isDestroyed,  // returns true
   *  }) => {
   *      // define variables internally
   *      const internalData = {};
   *
   *      // define methods
   *      const get = () => {}
   *      const set = (input: unknown) => {
   *        channels.change.emit() // signal change to external subscribers
   *      }
   *
   *      cosnt unsubscribe = globals.events.subscribeToSomething((x) => set(x));
   *      onDestroy(() => unsubscribe())  // register functions to be called when the agent is destroyed
   *
   *      (async () => {
   *        while(!isDestroyed()) {  // run perpetual work until the agent is destroyed
   *          await sleep(1000)
   *        }
   *      })();
   *
   *      // expose methods
   *      return { get, set }
   *  })
   *  .finish()
   */
  export const build = () =>
    makeBuilderImpl<DefaultAPI, DefaultChannels>({
      api: {},
      channels: { change: Obs.make() },
      idCont: IdCont.make(),
      destruction: Destruction.make(),
    });
}

type AgentAPIDefinerParam<
  API extends TDefaultAPI,
  Channels extends TDefaultChannels,
> = {
  prev: API;
  channels: Readonly<Channels>;
  onDestroy: Destruction["onDestroy"];
  isDestroyed: Destruction["isDestroyed"];
  id: () => symbol;
};

type AgentPrototype<
  API extends TDefaultAPI,
  Channels extends TDefaultChannels,
> = Pick<Vaettir<API, Channels>, "channels" | "api"> & {
  destruction: Destruction;
  idCont: IdCont;
};
