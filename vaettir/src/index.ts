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
  id: symbol;
  channels: Channels;
  api: API;
} & Omit<Destruction, "onDestroy">;

/**
 * Tooling for actor creation and communication
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace Vaettir {
  export type DefaultAPI = TDefaultAPI;
  export type DefaultChannels = TDefaultChannels;

  type AgentBuilder<
    API extends DefaultAPI,
    Channels extends DefaultChannels,
  > = {
    api: <NewAPI extends DefaultAPI>(
      fn: (input: AgentAPIDefinerParam<API, Channels>) => NewAPI
    ) => AgentBuilder<NewAPI, Channels>;
    channels: <NewChannels extends Channels>(
      fn: (channels: Channels) => NewChannels
    ) => AgentBuilder<API, NewChannels>;
    id: (id: string) => AgentBuilder<API, Channels>;
    finish: () => Vaettir<API, Channels>;
  };

  const makeBuilderImpl = <
    API extends DefaultAPI,
    Channels extends DefaultChannels,
  >(
    prototype: AgentPrototype<API, Channels>
  ): AgentBuilder<API, Channels> => {
    const finish = (): Vaettir<API, Channels> => ({
      id: prototype.idCont.lazyGet(),
      api: prototype.api,
      channels: prototype.channels,
      destroy: prototype.destruction.destroy,
      isDestroyed: prototype.destruction.isDestroyed,
      whenDestroyed: prototype.destruction.whenDestroyed,
    });

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
