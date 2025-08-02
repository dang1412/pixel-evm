import { PixelArea } from "./types"

export const PIXEL_SIZE = 30
export const MAP_W = 100
export const MAP_H = 100

const MAP_W10 = MAP_W * 10

export function positionToXY(p: number, w = MAP_W): {x: number, y: number} {
  const x = p % w
  const y = (p - x) / w

  return {x, y}
}

export function xyToPosition(x: number, y: number, w = MAP_W): number {
  return y * w + x
}

export function position10ToXY(p: number): {x: number, y: number} {
  const x = p % MAP_W10
  const y = (p - x) / MAP_W10

  return { x: x/10, y: y/10 }
}

export function xyToPosition10(x: number, y: number): number {
  return Math.round((y * 10)) * MAP_W10 + Math.round(x * 10)
}

export function getAreaPixels({x, y, w, h}: PixelArea): number[] {
  const pixels: number[] = []

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      pixels.push(xyToPosition(x + i, y + j))
    }
  }

  return pixels
}

// export function gridLine(x1: number, y1: number, x2: number, y2: number): [number, number][] {
//   const result: [number, number][] = [];

//   // Điểm bắt đầu và kết thúc (tọa độ trung tâm của ô)
//   let x = x1 + 0.5;
//   let y = y1 + 0.5;
//   const endX = x2 + 0.5;
//   const endY = y2 + 0.5;

//   const dx = endX - x;
//   const dy = endY - y;

//   const stepX = Math.sign(dx);
//   const stepY = Math.sign(dy);

//   const tDeltaX = Math.abs(1 / dx);
//   const tDeltaY = Math.abs(1 / dy);

//   let ix = Math.floor(x);
//   let iy = Math.floor(y);
//   result.push([ix, iy]);

//   let tMaxX = tDeltaX * ((stepX > 0 ? (ix + 1 - x) : (x - ix)));
//   let tMaxY = tDeltaY * ((stepY > 0 ? (iy + 1 - y) : (y - iy)));

//   while (ix !== x2 || iy !== y2) {
//     if (tMaxX < tMaxY) {
//       tMaxX += tDeltaX;
//       ix += stepX;
//     } else {
//       tMaxY += tDeltaY;
//       iy += stepY;
//     }
//     result.push([ix, iy]);
//   }

//   return result;
// }

// export function gridLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
//   const result: [number, number][] = [];

//   const dx = Math.abs(x1 - x0);
//   const dy = Math.abs(y1 - y0);
//   const sx = x0 < x1 ? 1 : -1;
//   const sy = y0 < y1 ? 1 : -1;

//   let err = dx - dy;

//   while (true) {
//     result.push([x0, y0]);

//     if (x0 === x1 && y0 === y1) break;

//     const e2 = 2 * err;

//     if (e2 > -dy) {
//       err -= dy;
//       x0 += sx;
//     }

//     if (e2 < dx) {
//       err += dx;
//       y0 += sy;
//     }
//   }

//   return result;
// }

// ChatGPT
// Bresenham's line algorithm to generate a list of points between two grid coordinates
export function gridLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];

  // Move to center of cell
  let x = x0 + 0.5;
  let y = y0 + 0.5;
  const endX = x1 + 0.5;
  const endY = y1 + 0.5;

  const dx = endX - x;
  const dy = endY - y;

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  const tDeltaX = Math.abs(1 / dx);
  const tDeltaY = Math.abs(1 / dy);

  let ix = x0;
  let iy = y0;

  let tMaxX = tDeltaX * ((stepX > 0 ? (ix + 1 - x) : (x - ix)));
  let tMaxY = tDeltaY * ((stepY > 0 ? (iy + 1 - y) : (y - iy)));

  points.push([ix, iy]);

  while (ix !== x1 || iy !== y1) {
    const compare = tMaxX < tMaxY ? 1 : tMaxX === tMaxY ? 0 : -1;
    if (compare >= 0) {
      tMaxX += tDeltaX;
      ix += stepX;
    }
    if (compare <= 0) {
      tMaxY += tDeltaY;
      iy += stepY;
    }
    points.push([ix, iy]);
  }

  return points;
}

// Self implemented Bresenham's line algorithm to get pixels from a line
export function getPixelsFromLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const rateYX = Math.abs(dy / dx);

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  let ix = x0;
  let iy = y0;

  const movex = () => {
    nextX += 1;
    ix += stepX;
  }

  const movey = () => {
    nextY += 1;
    iy += stepY;
  }

  let nextX = 0.5;
  let nextY = 0.5;

  const rs = [[ix, iy]] as [number, number][];

  while (ix !== x1 || iy !== y1) {
    const nextXY = nextX * rateYX;
    if (nextXY < nextY) {
      movex();
    } else if (nextXY > nextY) {
      movey();
    } else {
      movex();
      movey();
    }
    rs.push([ix, iy]);
  }

  return rs
}
