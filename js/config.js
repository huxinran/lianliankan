/* ============================================================
 *  config.js — TILE / IMAGE SET SELECTION  (swap images here)
 * ============================================================
 *
 *  HOW TO USE YOUR OWN IMAGES
 *  --------------------------
 *  1. Drop your image files into the  images/  folder.
 *     (png / jpg / svg / webp all work). Square images look best.
 *  2. List their file names in IMAGE_FILES below, e.g.
 *
 *        const IMAGE_FILES = [
 *          "cat.png", "dog.png", "fish.png", "bird.png",
 *          "panda.png", "fox.png", "owl.png", "frog.png"
 *        ];
 *
 *  3. Reload the page. That's it — the game auto-picks the set.
 *
 *  You need at least as many distinct images as the difficulty
 *  requires (easy 6, normal 10, hard 15). If you supply fewer,
 *  the game automatically falls back to the built-in emoji tiles,
 *  so it always stays playable while you gather artwork.
 * ============================================================ */

/* Folder that holds your images. */
const IMAGE_DIR = "images/";

/* >>> ADD YOUR IMAGE FILE NAMES HERE <<< */
const IMAGE_FILES = [
  // "tile1.png",
  // "tile2.png",
  // ...
];

/* Built-in fallback tiles (used until you supply enough images). */
const EMOJI_TILES = [
  "🍎","🍌","🍇","🍉","🍓","🍑","🍒","🍍",
  "🥝","🥑","🌶","🥕","🌽","🍄","🌻","🌸",
  "🐶","🐱","🦊","🐼","🐨","🐯","🦁","🐸",
  "🐵","🦄","🐙","🦋","🐝","🐞","🐢","🐳"
];

/**
 * pickImageSet(count) — choose `count` distinct tile faces for a game.
 *
 * Returns an array of tile descriptors:
 *   { id, kind: "image" | "emoji", value }
 * where `value` is an image URL (kind="image") or an emoji string.
 *
 * The game only ever compares tiles by `id`, so images and emojis
 * are handled uniformly by the rest of the code.
 */
function pickImageSet(count) {
  const useImages = IMAGE_FILES.length >= count;
  const pool = useImages
    ? IMAGE_FILES.map((f) => ({ kind: "image", value: IMAGE_DIR + f }))
    : EMOJI_TILES.map((e) => ({ kind: "emoji", value: e }));

  // Shuffle the pool and take the first `count` faces so each new game
  // uses a fresh-looking subset when the library is larger than needed.
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map((face, idx) => ({ id: idx, ...face }));
}

/**
 * renderTileFace(face) — HTML for a single tile face (image or emoji).
 */
function renderTileFace(face) {
  if (face.kind === "image") {
    return `<img src="${face.value}" alt="tile ${face.id}" draggable="false" />`;
  }
  return `<span class="glyph">${face.value}</span>`;
}
