import { Vaettir } from "vaettir-react";
import { GameData, Vec2 } from "./logic";
import { SnakeRunner } from "./snake-runner";

// GRID system: 1 grid = 14 pixel with 1 margin collapsed
// |..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|
const boxSize = 20;
export const mapToCanvasSize = (coord: Vec2): Vec2 => [
  coord[0] * boxSize + 1,
  coord[1] * boxSize + 1,
];

//    v start
// |..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|..xx.cccc.xx..|
//             ^ ultimate
export const outerSizing = (coord: Vec2): Vec2 => [
  coord[0] * boxSize + outerMargin,
  coord[1] * boxSize + outerMargin,
];
export const outerMargin = 2;
export const outerWidth = 1;
export const outerSize = boxSize - outerMargin * 2;

export const innerMargin = 5;
export const innerSize = boxSize - innerMargin * 2;
export const innerSizing = (coord: Vec2): Vec2 => [
  coord[0] * boxSize + innerMargin,
  coord[1] * boxSize + innerMargin,
];

export const drawBox = (ctx: CanvasRenderingContext2D, coord: Vec2) => {
  // draw outer box
  const outCoord = outerSizing(coord);
  const inCoord = innerSizing(coord);

  // top
  ctx.beginPath();
  ctx.fillRect(inCoord[0], inCoord[1], innerSize, innerSize);
  ctx.fillRect(outCoord[0], outCoord[1], outerSize, outerWidth);
  ctx.fillRect(
    boxSize * (coord[0] + 1) - outerMargin - outerWidth,
    outCoord[1],
    outerWidth,
    outerSize,
  );
  ctx.fillRect(
    outCoord[0],
    boxSize * (coord[1] + 1) - outerMargin - outerWidth,
    outerSize,
    outerWidth,
  );
  ctx.fillRect(outCoord[0], outCoord[1], outerWidth, outerSize);
};

export const renderMargin = (
  ctx: CanvasRenderingContext2D,
  arena: Vec2,
  canvasSize: Vec2,
) => {
  ctx.strokeStyle = lightgray;
  // horizontal lines
  const ultimateX = canvasSize[0] - 1;
  const ultimateY = canvasSize[1] - 1;
  for (let row = 0; row < arena[1]; row++) {
    ctx.beginPath();
    const y = row * boxSize;
    ctx.moveTo(0, y);
    ctx.lineTo(ultimateX, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, ultimateY);
  ctx.lineTo(ultimateX, ultimateY);
  ctx.stroke();

  // horizontal
  for (let column = 0; column < arena[0]; column++) {
    ctx.beginPath();
    const x = column * boxSize;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ultimateY);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(ultimateX, 0);
  ctx.lineTo(ultimateX, ultimateY);
  ctx.stroke();
};

export const renderBackground = (
  ctx: CanvasRenderingContext2D,
  canvasSize: Vec2,
) => {
  const gradient = ctx.createLinearGradient(0, 0, canvasSize[0], canvasSize[1]);
  gradient.addColorStop(0, back0);
  gradient.addColorStop(0.33, back1);
  gradient.addColorStop(0.67, back1);
  gradient.addColorStop(1, back0);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.fillRect(0, 0, canvasSize[0], canvasSize[1]);
};

export const renderApple = (
  ctx: CanvasRenderingContext2D,
  coord: GameData["apple"],
) => {
  ctx.fillStyle = apple;
  drawBox(ctx, coord);
};

export const renderSnake = (
  ctx: CanvasRenderingContext2D,
  snake: GameData["snake"],
) => {
  for (const [i, coord] of snake.entries()) {
    if (i === 0) {
      ctx.fillStyle = head;
    } else if (i === 1) {
      ctx.fillStyle = tail;
    }
    drawBox(ctx, coord);
  }
};

export const render = (
  ctx: CanvasRenderingContext2D,
  gameData: GameData,
  canvasSize: Vec2,
) => {
  ctx.moveTo(0, 0);
  ctx.clearRect(0, 0, canvasSize[0], canvasSize[1]);
  renderBackground(ctx, canvasSize);
  ctx.fillStyle = "black";
  renderApple(ctx, gameData.apple);
  renderSnake(ctx, gameData.snake);
  renderMargin(ctx, gameData["arena"], canvasSize);
};

// const grid = "#959c99";
const lightgray = "#BCC7C2";
const back0 = "#A1A7A0";
const back1 = "#ADB9B5";
const tail = "#607376";
const apple = "#233B45";
const head = "#233B45";

export const Renderer = (
  ctx: CanvasRenderingContext2D,
  snakeRunner: SnakeRunner,
) =>
  Vaettir.build()
    .api(({ onDestroy }) => {
      const canvasSize = mapToCanvasSize(snakeRunner.api.getGameData().arena);

      const implRender = () =>
        render(ctx, snakeRunner.api.getGameData(), canvasSize);

      onDestroy(snakeRunner.channels.tick.sub(implRender));
      onDestroy(snakeRunner.channels.change.sub(implRender));
      return { manualRender: implRender };
    })
    .finish();
