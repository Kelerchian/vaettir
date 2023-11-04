import { Obs, Vaettir, VaettirReact } from "vaettir-react";
import { BoolLock } from "systemic-ts-utils/lock";
import { GameData, generateNew, tick } from "./logic";
import { sleep } from "systemic-ts-utils/async-utils";
import { SnakeInput } from "./snake-input";

const frameRate = 1000 / 12; // 8 fps-ish

export const SnakeRunnerContext = VaettirReact.Context.make<SnakeRunner>();

export type SnakeRunner = ReturnType<typeof SnakeRunner>;
export const SnakeRunner = (initialArena: GameData["arena"]) =>
  Vaettir.build()
    .channels((channels) => ({
      ...channels,
      tick: Obs.make<void>(),
    }))
    .api(({ channels, isDestroyed, onDestroy }) => {
      const data = {
        isRunning: false,
        gameData: generateNew(initialArena),
      };
      const criticalSection = BoolLock.make(); // make sure only 1 game instance is running with lock

      // Methods
      // =======

      const isGameOver = () => data.gameData.gameOver;
      const isRunning = () => criticalSection.locked();

      const attemptRunGame = async () => {
        await criticalSection.use(async () => {
          while (!isDestroyed() && data.isRunning && !isGameOver()) {
            tick(data.gameData);
            channels.tick.emit();
            if (isGameOver()) break;
            await sleep(frameRate); // 8 fps-ish
          }
        });
        channels.change.emit();
      };

      const pause = () => {
        data.isRunning = false;
        channels.change.emit();
      };

      const play = () => {
        data.isRunning = true;
        attemptRunGame();
        channels.change.emit();
      };

      const startOver = () => {
        data.gameData = generateNew(initialArena);
        play();
        channels.change.emit();
      };

      // Create input agent
      // ===========

      const inputAgent = SnakeInput();
      // bind lifetime
      onDestroy(inputAgent.destroy);
      // bind events to gameDatav
      onDestroy(
        inputAgent.channels.direction.sub((dir) => {
          console.log("inputAgent.channels.direction");
          if (!isRunning()) return;
          data.gameData.nextDirection.push(dir);
        }),
      );
      onDestroy(
        inputAgent.channels.enter.sub(() => {
          console.log("inputAgent.channels.enter");
          if (isGameOver()) startOver();
        }),
      );
      onDestroy(
        inputAgent.channels.escape.sub(() => {
          console.log("inputAgent.channels.escape");
          if (isRunning()) return pause();
          play();
        }),
      );

      return {
        getGameData: (): Readonly<GameData> => data.gameData,
        pause,
        play,
        startOver,
        isGameOver,
        isRunning,
      };
    })
    .finish();
