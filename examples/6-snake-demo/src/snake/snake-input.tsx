import { Obs, Vaettir } from "vaettir-react";
import { Direction, Up, Down, Left, Right } from "./logic";

export const SnakeInput = () =>
  Vaettir.build()
    .channels((channels) => ({
      ...channels,
      direction: Obs.make<Direction>(),
      escape: Obs.make<void>(),
      enter: Obs.make<void>(),
    }))
    .api(({ channels, onDestroy }) => {
      const listener = (e: KeyboardEvent) => {
        if (e.repeat) return;
        switch (e.code) {
          case "ArrowRight":
            return channels.direction.emit(Right);
          case "ArrowLeft":
            return channels.direction.emit(Left);
          case "ArrowUp":
            return channels.direction.emit(Up);
          case "ArrowDown":
            return channels.direction.emit(Down);
          case "Escape":
            return channels.escape.emit();
          case "Enter":
            return channels.enter.emit();
        }
      };

      window.addEventListener("keydown", listener);
      onDestroy(() => window.removeEventListener("keydown", listener));

      return {};
    })
    .finish();
