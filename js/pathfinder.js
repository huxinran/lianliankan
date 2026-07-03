/* ============================================================
 *  pathfinder.js — classic 连连看 connection rule
 * ============================================================
 *  Two tiles can be linked if a path connects them that:
 *    - travels only through EMPTY cells (the two tiles are the
 *      only occupied endpoints),
 *    - is made of horizontal/vertical segments,
 *    - has AT MOST 2 turns (i.e. at most 3 straight segments).
 *
 *  The board uses an extended grid with a 1-cell empty border
 *  all around, so paths may leave the tile area and travel around
 *  the outside — exactly like the classic game.
 *
 *  `grid` is a 2-D array over the EXTENDED coordinate space:
 *    grid[gr][gc] === null            -> empty / passable
 *    grid[gr][gc] === <tile object>   -> occupied
 *  Extended rows: 0 .. rows+1 , cols: 0 .. cols+1.
 * ============================================================ */

const DIRS = [
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

/**
 * findLinkPath(grid, H, W, a, b)
 *   a, b: { gr, gc } extended-grid coordinates of the two tiles.
 * Returns an array of {gr,gc} waypoints (from a to b inclusive)
 * describing the connecting route, or null if none exists.
 */
function findLinkPath(grid, H, W, a, b) {
  // A cell is passable if it is empty, or if it is the destination b.
  const passable = (r, c) =>
    r >= 0 && r < H && c >= 0 && c < W &&
    (grid[r][c] === null || (r === b.gr && c === b.gc));

  // 0-1 BFS over states (r, c, dir): cost = number of turns so far.
  // Moving in the same direction costs 0, changing direction costs 1.
  // best[r][c][dir] = minimum turns to arrive here heading `dir`.
  const best = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => [Infinity, Infinity, Infinity, Infinity])
  );
  const parent = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => [null, null, null, null])
  );

  const deque = []; // simple deque via array; push front/back
  // Seed: step out of `a` in every direction (first segment, 0 turns).
  for (let d = 0; d < 4; d++) {
    const nr = a.gr + DIRS[d][0];
    const nc = a.gc + DIRS[d][1];
    if (!passable(nr, nc)) continue;
    if (best[nr][nc][d] > 0) {
      best[nr][nc][d] = 0;
      parent[nr][nc][d] = { r: a.gr, c: a.gc, dir: -1 };
      deque.push({ r: nr, c: nc, dir: d, turns: 0 });
    }
  }

  let endDir = -1;
  while (deque.length) {
    // pick the state with the fewest turns (0-1 BFS: front is smallest)
    const cur = deque.shift();
    if (cur.turns > best[cur.r][cur.c][cur.dir]) continue;

    if (cur.r === b.gr && cur.c === b.gc) {
      endDir = cur.dir;
      break;
    }

    for (let d = 0; d < 4; d++) {
      const nr = cur.r + DIRS[d][0];
      const nc = cur.c + DIRS[d][1];
      if (!passable(nr, nc)) continue;
      const turns = cur.turns + (d === cur.dir ? 0 : 1);
      if (turns > 2) continue; // classic rule: at most 2 turns
      if (turns < best[nr][nc][d]) {
        best[nr][nc][d] = turns;
        parent[nr][nc][d] = { r: cur.r, c: cur.c, dir: cur.dir };
        if (d === cur.dir) deque.unshift({ r: nr, c: nc, dir: d, turns });
        else deque.push({ r: nr, c: nc, dir: d, turns });
      }
    }
  }

  if (endDir === -1) return null;

  // Reconstruct the path from b back to a.
  const path = [];
  let node = { r: b.gr, c: b.gc, dir: endDir };
  while (node && node.dir !== -1) {
    path.push({ gr: node.r, gc: node.c });
    node = parent[node.r][node.c][node.dir];
  }
  path.push({ gr: a.gr, gc: a.gc });
  path.reverse();
  return simplifyPath(path);
}

/** Collapse consecutive collinear points into corner-only waypoints. */
function simplifyPath(path) {
  if (path.length <= 2) return path;
  const out = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = path[i];
    const next = path[i + 1];
    const turn =
      Math.sign(cur.gr - prev.gr) !== Math.sign(next.gr - cur.gr) ||
      Math.sign(cur.gc - prev.gc) !== Math.sign(next.gc - cur.gc);
    if (turn) out.push(cur);
  }
  out.push(path[path.length - 1]);
  return out;
}
