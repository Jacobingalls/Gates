// Everything on a diagram sits on this grid: parts, pins, wire corners, states and table edges.
// Sizes are whole steps too, so a part's pins stay on it however the part is flipped or turned.
export const GRID = 10

export const snap = (value) => Math.round(value / GRID) * GRID
export const snapPoint = ([x, y]) => [snap(x), snap(y)]

// The size of something that has to be at least this long.
export const gridLength = (length) => Math.ceil(length / GRID) * GRID
