type X = number;
type Y = number;
export type Vec2 = [X, Y];
export const Up: unique symbol = Symbol();
export const Down: unique symbol = Symbol();
export const Left: unique symbol = Symbol();
export const Right: unique symbol = Symbol();
export type Direction = typeof Up | typeof Down | typeof Left | typeof Right;
export const Win: unique symbol = Symbol();
export const Lose: unique symbol = Symbol();
export type GameOver = typeof Win | typeof Lose;

export type GameData = {
  arena: Vec2;
  snake: Vec2[]; // head = index 0
  snakeMapOnArena: boolean[]; // size = arena[0] * arena[1]
  direction: Direction;
  nextDirection: Direction[];
  apple: Vec2;
  gameOver: GameOver | null;
};

export const vec2Eq = (a: Vec2, b: Vec2) => a[0] === b[0] && a[1] === b[1];

export const snakeMapCoord = (arena: GameData["arena"], c: Vec2) =>
  arena[0] * c[1] + c[0];

export const reverseSnakeMapCoord = (
  arena: GameData["arena"],
  c: number,
): Vec2 => [c % arena[0], Math.floor(c / arena[0])];

export const nextHead = (
  arena: GameData["arena"],
  snake: GameData["snake"],
  direction: GameData["direction"],
): Vec2 => {
  const head = snake[0];
  if (!head) throw new Error("head missing");
  switch (direction) {
    case Up:
      return [head[0], (head[1] - 1 + arena[1]) % arena[1]];
    case Down:
      return [head[0], (head[1] + 1) % arena[1]];
    case Left:
      return [(head[0] - 1 + arena[0]) % arena[0], head[1]];
    case Right:
      return [(head[0] + 1) % arena[0], head[1]];
  }
};

export const isOppositeDirection = (a: Direction, b: Direction) =>
  (a === Up && b === Down) ||
  (a === Down && b === Up) ||
  (a === Left && b === Right) ||
  (a === Right && b === Left);

export const snakeFillAllArena = (d: GameData) =>
  d.snake.length === d.arena[0] * d.arena[1];

export const isColliding = (
  arena: GameData["arena"],
  snakeMapOnArena: GameData["snakeMapOnArena"],
  newHead: Vec2,
) => snakeMapOnArena[snakeMapCoord(arena, newHead)] === true;

export const getNewAppleCoord = (
  arena: GameData["arena"],
  snakeMapOnArena: GameData["snakeMapOnArena"],
) => {
  const availableBufferCoords = snakeMapOnArena
    .map((occupied, index) => [occupied, index] as const)
    .filter(([occupied, _]) => !occupied)
    .map(([_, index]) => index);

  const randomIndex = Math.round(
    Math.random() * availableBufferCoords.length - 1,
  );

  return reverseSnakeMapCoord(arena, availableBufferCoords[randomIndex]);
};

export const tick = (d: GameData) => {
  if (d.gameOver) return;

  const newHead = nextHead(d.arena, d.snake, d.direction);

  console.log(d.nextDirection.length);
  while (true) {
    const nextDirection = d.nextDirection.shift();
    if (!nextDirection) break;
    if (!isOppositeDirection(d.direction, nextDirection)) {
      d.direction = nextDirection;
      break;
    }
  }

  d.snake.unshift(newHead);
  if (isColliding(d.arena, d.snakeMapOnArena, newHead)) {
    d.gameOver = Lose;
    d.snakeMapOnArena[snakeMapCoord(d.arena, newHead)] = true;
    return;
  } else {
    d.snakeMapOnArena[snakeMapCoord(d.arena, newHead)] = true;
  }
  const appleEaten = vec2Eq(d.apple, newHead);

  // trim tail
  if (!appleEaten) {
    const tailTip = d.snake.pop();
    if (tailTip) {
      d.snakeMapOnArena[snakeMapCoord(d.arena, tailTip)] = false;
    }
  }

  if (appleEaten) {
    if (snakeFillAllArena(d)) {
      d.gameOver = Win;
      return;
    }
    d.apple = getNewAppleCoord(d.arena, d.snakeMapOnArena);
  }
};

export const generateNew = (arena: Vec2): GameData => {
  const direction = ((): Direction => {
    const r = Math.random();
    if (r < 1 / 4) return Up;
    if (r < 2 / 4) return Down;
    if (r < 3 / 4) return Left;
    return Right;
  })();

  const snake = (() => {
    const init: Vec2[] = [
      [
        Math.round(Math.random() * (arena[0] - 1)),
        Math.round(Math.random() * (arena[1] - 1)),
      ],
    ];
    new Array(4)
      .fill(null)
      .forEach(() => init.unshift(nextHead(arena, init, direction)));
    return init;
  })();

  const snakeMapOnArena = (() => {
    const initial: GameData["snakeMapOnArena"] = new Array(
      arena[0] * arena[1],
    ).fill(false);
    snake.forEach((coord) => {
      initial[snakeMapCoord(arena, coord)] = true;
    });
    return initial;
  })();

  const apple = getNewAppleCoord(arena, snakeMapOnArena);

  const gameData: GameData = {
    arena,
    direction,
    nextDirection: [],
    gameOver: null,
    snake,
    snakeMapOnArena,
    apple,
  };

  return gameData;
};
