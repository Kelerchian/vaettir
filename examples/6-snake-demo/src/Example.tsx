import { VaettirReact } from "vaettir-react";
import { Lose, Vec2, Win } from "./snake/logic";
import { SnakeRunner, SnakeRunnerContext } from "./snake/snake-runner";
import { Renderer, mapToCanvasSize } from "./snake/render";
import { useEffect, useState } from "react";

const gameSize: Vec2 = [10, 10];
const canvasSize = mapToCanvasSize(gameSize);

export const Game = () => {
  const snakeRunner = VaettirReact.useOwned(() => SnakeRunner(gameSize));
  return (
    <SnakeRunnerContext.Provider value={snakeRunner}>
      <Canvas />
      <Stats />
    </SnakeRunnerContext.Provider>
  );
};

export const Stats = () => {
  const snakeRunner = SnakeRunnerContext.borrowListen();
  const isPlaying =
    !snakeRunner.api.isGameOver() && snakeRunner.api.isRunning();
  const isPaused =
    !snakeRunner.api.isGameOver() && !snakeRunner.api.isRunning();
  const isWinning = snakeRunner.api.isGameOver() === Win;
  const isLosing = snakeRunner.api.isGameOver() === Lose;
  return (
    <div>
      <dl>
        <dt>Status:</dt>
        {isPlaying && <dd>Playing (Press Esc to Pause)</dd>}
        {isPaused && <dd>Paused (Press Esc to Resume)</dd>}
        {isWinning && <dd>You win the game (Press enter to start over)</dd>}
        {isLosing && <dd>You lost the game (Press enter to start over)</dd>}

        <dt>Control:</dt>
        <dd>Up/Down/Left/Right = Direction</dd>
        <dd>Esc = Pause/Resume</dd>
        <dd>Enter = Startover when game over</dd>
      </dl>
    </div>
  );
};

export const Canvas = () => {
  const [context2D, setContext2D] = useState<CanvasRenderingContext2D>();
  return (
    <>
      <canvas
        ref={(x) => {
          const context = x?.getContext("2d");
          if (!context) return;
          setContext2D(context);
        }}
        width={canvasSize[0]}
        height={canvasSize[1]}
      />
      {context2D && <RendererContainer context2d={context2D} />}
    </>
  );
};

export const RendererContainer = ({
  context2d,
}: {
  context2d: CanvasRenderingContext2D;
}) => {
  const snakeRunner = SnakeRunnerContext.borrow();
  VaettirReact.useOwned(
    () => Renderer(context2d, snakeRunner),
    [context2d, snakeRunner],
  );

  useEffect(() => {
    snakeRunner.api.play();
  }, [snakeRunner.api]);

  return null;
};
