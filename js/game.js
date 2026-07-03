/* ============================================================
 *  game.js — 连连看 game logic, rendering & interaction
 * ============================================================ */

const DIFFICULTY = {
  easy:   { rows: 6, cols: 6,  types: 6,  cell: 124, hints: 5, shuffles: 3 },
  normal: { rows: 6, cols: 8,  types: 10, cell: 116, hints: 5, shuffles: 3 },
  hard:   { rows: 8, cols: 10, types: 15, cell: 100, hints: 5, shuffles: 3 },
};

// Tile aspect ratio (height / width) — matches the poodle art (1024×1536).
const TILE_ASPECT = 1.5;

const el = {
  board: document.getElementById("board"),
  wrap: document.getElementById("boardWrap"),
  linkLayer: document.getElementById("linkLayer"),
  message: document.getElementById("message"),
  time: document.getElementById("time"),
  remaining: document.getElementById("remaining"),
  hints: document.getElementById("hints"),
  shuffles: document.getElementById("shuffles"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlaySub: document.getElementById("overlaySub"),
  // screens + home controls
  home: document.getElementById("home"),
  game: document.getElementById("game"),
  setGrid: document.getElementById("setGrid"),
  diffSelect: document.getElementById("diffSelect"),
  gameTitle: document.getElementById("gameTitle"),
};

const state = {
  cfg: null,
  setName: DEFAULT_SET,   // chosen on the home screen
  difficulty: "normal",   // chosen on the home screen
  rows: 0,
  cols: 0,
  cellW: 56,
  cellH: 84,
  grid: [],          // extended grid: (rows+2) x (cols+2), null or tile
  tiles: new Map(),  // tileKey -> { id, face, gr, gc, node }
  selected: null,    // currently selected tile object
  remaining: 0,
  hints: 0,
  shuffles: 0,
  busy: false,
  startTime: 0,
  timer: null,
};

/* ---------- helpers ---------- */
const keyOf = (gr, gc) => `${gr},${gc}`;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------- board generation ---------- */
function newGame() {
  const cfg = DIFFICULTY[state.difficulty];
  state.cfg = cfg;
  state.rows = cfg.rows;
  state.cols = cfg.cols;
  state.cellW = cfg.cell;
  state.cellH = Math.round(cfg.cell * TILE_ASPECT);
  state.hints = cfg.hints;
  state.shuffles = cfg.shuffles;
  state.selected = null;
  state.busy = false;

  document.documentElement.style.setProperty("--cell-w", state.cellW + "px");
  document.documentElement.style.setProperty("--cell-h", state.cellH + "px");

  const total = cfg.rows * cfg.cols; // guaranteed even (see DIFFICULTY)
  const pairCount = total / 2;

  // Pick faces and build a pool where every face appears an even number
  // of times — this guarantees the board can be fully cleared.
  const faces = pickImageSet(cfg.types, state.setName);
  const facePool = [];
  for (let i = 0; i < pairCount; i++) {
    facePool.push(faces[i % faces.length]);
  }
  const cellFaces = shuffleArray([...facePool, ...facePool]); // each face even count

  // Build extended grid with empty border ring.
  const H = cfg.rows + 2;
  const W = cfg.cols + 2;
  state.grid = Array.from({ length: H }, () => Array(W).fill(null));
  state.tiles.clear();

  let idx = 0;
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const gr = r + 1;
      const gc = c + 1;
      const tile = { face: cellFaces[idx++], gr, gc, node: null };
      state.grid[gr][gc] = tile;
      state.tiles.set(keyOf(gr, gc), tile);
    }
  }

  state.remaining = total;

  // Guarantee at least one legal move exists on the starting board.
  ensureSolvable();

  render();
  startTimer();
  hideOverlay();
  updateHud();
}

/* ---------- rendering ---------- */
function render() {
  const H = state.rows + 2;
  const W = state.cols + 2;
  const cw = state.cellW;
  const ch = state.cellH;
  el.board.style.width = W * cw + "px";
  el.board.style.height = H * ch + "px";
  el.linkLayer.setAttribute("width", W * cw);
  el.linkLayer.setAttribute("height", H * ch);
  el.linkLayer.style.width = W * cw + "px";
  el.linkLayer.style.height = H * ch + "px";

  el.board.innerHTML = "";
  for (const tile of state.tiles.values()) {
    const node = document.createElement("div");
    node.className = "tile";
    node.style.left = tile.gc * cw + "px";
    node.style.top = tile.gr * ch + "px";
    node.innerHTML = renderTileFace(tile.face);
    node.addEventListener("click", () => onTileClick(tile));
    tile.node = node;
    el.board.appendChild(node);
  }
}

/* ---------- interaction ---------- */
function onTileClick(tile) {
  if (state.busy) return;
  if (!state.tiles.has(keyOf(tile.gr, tile.gc))) return;

  if (state.selected === tile) {
    tile.node.classList.remove("selected");
    state.selected = null;
    return;
  }

  if (!state.selected) {
    state.selected = tile;
    tile.node.classList.add("selected");
    return;
  }

  const a = state.selected;
  const b = tile;

  if (a.face.id !== b.face.id) {
    // different pictures
    feedbackBad(a, b, "图案不同，无法消除");
    switchSelection(b);
    return;
  }

  const H = state.rows + 2;
  const W = state.cols + 2;
  const path = findLinkPath(state.grid, H, W,
    { gr: a.gr, gc: a.gc }, { gr: b.gr, gc: b.gc });

  if (!path) {
    feedbackBad(a, b, "路径超过两个拐弯，连不上");
    switchSelection(b);
    return;
  }

  // success!
  matchTiles(a, b, path);
}

function switchSelection(b) {
  if (state.selected) state.selected.node.classList.remove("selected");
  state.selected = b;
  b.node.classList.add("selected");
}

function feedbackBad(a, b, msg) {
  showMessage(msg);
  [a, b].forEach((t) => {
    t.node.classList.add("bad");
    setTimeout(() => t.node.classList.remove("bad"), 350);
  });
}

function matchTiles(a, b, path) {
  state.busy = true;
  a.node.classList.remove("selected");
  b.node.classList.remove("selected");
  state.selected = null;

  drawLink(path);

  setTimeout(() => {
    for (const t of [a, b]) {
      t.node.classList.add("clearing");
      state.grid[t.gr][t.gc] = null;
      state.tiles.delete(keyOf(t.gr, t.gc));
    }
    setTimeout(() => {
      a.node.remove();
      b.node.remove();
    }, 200);

    clearLink();
    state.remaining -= 2;
    updateHud();

    if (state.remaining === 0) {
      win();
      state.busy = false;
      return;
    }

    // Keep the board solvable: if no move remains, reshuffle.
    if (!hasAnyMove()) {
      showMessage("无可消除，自动洗牌…");
      reshuffle(/*silent*/ true);
    }
    state.busy = false;
  }, 260);
}

/* ---------- connection line drawing ---------- */
function drawLink(path) {
  const cw = state.cellW;
  const ch = state.cellH;
  const pts = path
    .map((p) => `${p.gc * cw + cw / 2},${p.gr * ch + ch / 2}`)
    .join(" ");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", pts);
  el.linkLayer.appendChild(poly);
}
function clearLink() {
  el.linkLayer.innerHTML = "";
}

/* ---------- solvability ---------- */
// Returns [tileA, tileB, path] of the first legal move found, or null.
function findAnyMove() {
  const H = state.rows + 2;
  const W = state.cols + 2;
  const byFace = new Map();
  for (const t of state.tiles.values()) {
    if (!byFace.has(t.face.id)) byFace.set(t.face.id, []);
    byFace.get(t.face.id).push(t);
  }
  for (const group of byFace.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        const path = findLinkPath(state.grid, H, W,
          { gr: a.gr, gc: a.gc }, { gr: b.gr, gc: b.gc });
        if (path) return [a, b, path];
      }
    }
  }
  return null;
}

function hasAnyMove() {
  return findAnyMove() !== null;
}

// Reshuffle remaining tiles into their existing positions until the board
// has at least one legal move. Because face counts stay even, a solvable
// arrangement always exists, so this terminates.
function reshuffle(silent) {
  const positions = [...state.tiles.keys()].map((k) => {
    const [gr, gc] = k.split(",").map(Number);
    return { gr, gc };
  });
  const faces = [...state.tiles.values()].map((t) => t.face);

  for (let attempt = 0; attempt < 200; attempt++) {
    shuffleArray(faces);
    // rebuild grid + tiles
    const H = state.rows + 2, W = state.cols + 2;
    state.grid = Array.from({ length: H }, () => Array(W).fill(null));
    state.tiles.clear();
    positions.forEach((pos, i) => {
      const tile = { face: faces[i], gr: pos.gr, gc: pos.gc, node: null };
      state.grid[pos.gr][pos.gc] = tile;
      state.tiles.set(keyOf(pos.gr, pos.gc), tile);
    });
    if (hasAnyMove()) break;
  }

  state.selected = null;
  render();
  if (!silent) updateHud();
}

// Used only at game start: reshuffle in place until a move exists.
function ensureSolvable() {
  if (hasAnyMove()) return;
  reshuffleFacesInPlace();
}
function reshuffleFacesInPlace() {
  const positions = [...state.tiles.keys()];
  const faces = [...state.tiles.values()].map((t) => t.face);
  for (let attempt = 0; attempt < 200; attempt++) {
    shuffleArray(faces);
    positions.forEach((k, i) => {
      state.tiles.get(k).face = faces[i];
    });
    if (hasAnyMove()) return;
  }
}

/* ---------- hint / shuffle buttons ---------- */
function useHint() {
  if (state.busy || state.hints <= 0) return;
  const move = findAnyMove();
  if (!move) return;
  const [a, b] = move;
  state.hints--;
  updateHud();
  [a, b].forEach((t) => {
    t.node.classList.add("hint");
    setTimeout(() => t.node.classList.remove("hint"), 2100);
  });
}

function useShuffle() {
  if (state.busy || state.shuffles <= 0) return;
  state.shuffles--;
  reshuffle(false);
  showMessage("已洗牌");
}

/* ---------- HUD / timer ---------- */
function updateHud() {
  el.remaining.textContent = state.remaining;
  el.hints.textContent = state.hints;
  el.shuffles.textContent = state.shuffles;
}

function startTimer() {
  clearInterval(state.timer);
  state.startTime = Date.now();
  el.time.textContent = "00:00";
  state.timer = setInterval(() => {
    const s = Math.floor((Date.now() - state.startTime) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    el.time.textContent = `${mm}:${ss}`;
  }, 500);
}

let msgTimer = null;
function showMessage(text) {
  el.message.textContent = text;
  el.message.classList.add("show");
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.message.classList.remove("show"), 1400);
}

/* ---------- win / overlay ---------- */
function win() {
  clearInterval(state.timer);
  el.overlayTitle.textContent = "🎉 通关！";
  el.overlaySub.textContent = `用时 ${el.time.textContent}`;
  el.overlay.classList.remove("hidden");
}
function hideOverlay() {
  el.overlay.classList.add("hidden");
}

/* ---------- home screen ---------- */
const DIFF_LABEL = { easy: "简单", normal: "普通", hard: "困难" };

// Build the selectable image-set cards on the home screen.
function buildHome() {
  el.setGrid.innerHTML = "";
  for (const { value, label } of listImageSets()) {
    const card = document.createElement("button");
    card.className = "set-card" + (value === state.setName ? " active" : "");
    card.dataset.set = value;

    const cover = getImageSet(value).cover;
    card.title = label; // tooltip only; no on-screen text
    card.innerHTML = cover
      ? `<div class="set-cover"><img src="${cover}" alt="${label}" draggable="false" /></div>`
      : `<div class="set-preview">${getSetPreview(value, 5)
          .map((f) => `<span class="set-face">${renderTileFace(f)}</span>`)
          .join("")}</div>`;

    // The icon IS the start button: pick this set and launch immediately.
    card.addEventListener("click", () => {
      state.setName = value;
      startGame();
    });
    el.setGrid.appendChild(card);
  }
}

function showHome() {
  clearInterval(state.timer);
  hideOverlay();
  buildHome();
  el.game.classList.add("hidden");
  el.home.classList.remove("hidden");
}

function startGame() {
  el.gameTitle.textContent =
    getImageSet(state.setName).label + " · " + DIFF_LABEL[state.difficulty];
  el.home.classList.add("hidden");
  el.game.classList.remove("hidden");
  newGame();
}

/* ---------- wire up ---------- */
document.getElementById("newGame").addEventListener("click", newGame);
document.getElementById("hintBtn").addEventListener("click", useHint);
document.getElementById("shuffleBtn").addEventListener("click", useShuffle);
document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("overlayAgain").addEventListener("click", () => {
  hideOverlay();
  newGame();
});
document.getElementById("overlayHome").addEventListener("click", showHome);

// Difficulty dropdown on the home screen.
state.difficulty = el.diffSelect.value;
el.diffSelect.addEventListener("change", () => {
  state.difficulty = el.diffSelect.value;
});

showHome();
