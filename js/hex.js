// Hex grid math: pointy-top hexes, "odd-r" offset coordinates (odd rows shifted right).
(function (root) {
  const BH = (root.BH = root.BH || {});

  const COLS = 15;
  const ROWS = 11;
  const SQRT3 = Math.sqrt(3);

  const EVEN_ROW_DIRS = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  const ODD_ROW_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];

  function key(col, row) {
    return col + ',' + row;
  }

  function parseKey(k) {
    const [c, r] = k.split(',').map(Number);
    return { col: c, row: r };
  }

  function inBounds(col, row) {
    return col >= 0 && col < COLS && row >= 0 && row < ROWS;
  }

  function neighbors(col, row) {
    const dirs = row & 1 ? ODD_ROW_DIRS : EVEN_ROW_DIRS;
    const out = [];
    for (const [dc, dr] of dirs) {
      const c = col + dc;
      const r = row + dr;
      if (inBounds(c, r)) out.push({ col: c, row: r });
    }
    return out;
  }

  function toCube(col, row) {
    const x = col - (row - (row & 1)) / 2;
    const z = row;
    return { x, y: -x - z, z };
  }

  function distance(a, b) {
    const ca = toCube(a.col, a.row);
    const cb = toCube(b.col, b.row);
    return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y), Math.abs(ca.z - cb.z));
  }

  function isAdjacent(a, b) {
    return distance(a, b) === 1;
  }

  // Layout describes pixel geometry: hex "size" is the center-to-corner radius.
  function makeLayout(size, originX, originY) {
    return { size, width: SQRT3 * size, originX, originY };
  }

  function hexToPixel(layout, col, row) {
    return {
      x: layout.originX + layout.width * (col + 0.5 * (row & 1)) + layout.width / 2,
      y: layout.originY + 1.5 * layout.size * row + layout.size,
    };
  }

  function pixelToHex(layout, x, y) {
    let best = null;
    let bestD = Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = hexToPixel(layout, c, r);
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = { col: c, row: r };
        }
      }
    }
    return bestD <= layout.size * layout.size ? best : null;
  }

  function corners(layout, col, row) {
    const c = hexToPixel(layout, col, row);
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      pts.push({ x: c.x + layout.size * Math.cos(a), y: c.y + layout.size * Math.sin(a) });
    }
    return pts;
  }

  function allHexes() {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) out.push({ col: c, row: r });
    return out;
  }

  BH.Hex = {
    COLS, ROWS, key, parseKey, inBounds, neighbors, distance, isAdjacent,
    makeLayout, hexToPixel, pixelToHex, corners, allHexes,
  };
})(typeof window !== 'undefined' ? window : globalThis);
