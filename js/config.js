/* ============================================================
 *  config.js — TILE / IMAGE SETS  (swap & add sets here)
 * ============================================================
 *
 *  Tiles are organised into named SETS (themes). The player can
 *  switch between them with the "图案" dropdown in the game.
 *
 *  To add a new set, use the  /add-image-set  skill, or do it by
 *  hand in three steps:
 *    1. Put square images (128×128 px, png/jpg/svg/webp) in a
 *       subfolder, e.g.  images/cats/
 *    2. Register the set in IMAGE_SETS below.
 *    3. Reload — the set appears in the dropdown automatically.
 *
 *  A set needs at least as many distinct images as the hardest
 *  difficulty you want to play with it (15 covers everything).
 *  If a set has too few for the chosen difficulty, the game falls
 *  back to the built-in emoji set so it always stays playable.
 * ============================================================ */

const IMAGE_SETS = {
  /* Built-in fallback — always available, needs no image files. */
  emoji: {
    label: "Emoji（默认）",
    kind: "emoji",
    faces: [
      "🍎","🍌","🍇","🍉","🍓","🍑","🍒","🍍",
      "🥝","🥑","🌶","🥕","🌽","🍄","🌻","🌸",
      "🐶","🐱","🦊","🐼","🐨","🐯","🦁","🐸",
      "🐵","🦄","🐙","🦋","🐝","🐞","🐢","🐳",
    ],
  },

  /* ---- Example image set (uncomment once you add the files) ----
  cats: {
    label: "猫咪",
    kind: "image",
    dir: "images/cats/",
    files: [
      "cat1.png", "cat2.png", "cat3.png", "cat4.png", "cat5.png",
      "cat6.png", "cat7.png", "cat8.png", "cat9.png", "cat10.png",
      "cat11.png", "cat12.png", "cat13.png", "cat14.png", "cat15.png",
    ],
  },
  ---------------------------------------------------------------- */

  poodle: {
    label: "贵宾犬运动会 🐩",
    kind: "image",
    cover: "images/poodle/cover.png", // shown on the home-screen picker card
    dir: "images/poodle/",
    files: [
      "01-american-football.png", "02-soccer.png", "03-basketball.png",
      "04-tennis.png", "05-baseball.png", "06-volleyball.png",
      "07-swimming.png", "08-surfing.png", "09-skateboarding.png",
      "10-gymnastics.png", "11-cycling.png", "12-running.png",
      "13-golf.png", "14-ice-hockey.png", "15-boxing.png",
      "16-skiing.png", "17-snowboarding.png", "18-cheerleading.png",
      "19-pickleball.png", "20-roller-skating.png",
    ],
  },

  /* >>> The /add-image-set skill appends new sets below this line <<< */
};

const DEFAULT_SET = "poodle";

/** Resolve a set by name, falling back to the default. */
function getImageSet(name) {
  return IMAGE_SETS[name] || IMAGE_SETS[DEFAULT_SET];
}

/** Does this set have enough distinct faces for the given difficulty? */
function setHasEnough(set, count) {
  const n = set.kind === "emoji" ? set.faces.length : set.files.length;
  return n >= count;
}

/**
 * pickImageSet(count, setName) — choose `count` distinct tile faces.
 *
 * Returns tile descriptors: { id, kind: "image" | "emoji", value }
 * where `value` is an image URL or an emoji string. The rest of the
 * game only compares tiles by `id`, so both kinds behave identically.
 */
function pickImageSet(count, setName) {
  let set = getImageSet(setName);
  if (!setHasEnough(set, count)) set = IMAGE_SETS[DEFAULT_SET]; // safety net

  const pool =
    set.kind === "emoji"
      ? set.faces.map((e) => ({ kind: "emoji", value: e }))
      : set.files.map((f) => ({ kind: "image", value: (set.dir || "") + f }));

  // Shuffle so a large set shows a fresh subset each game.
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map((face, idx) => ({ id: idx, ...face }));
}

/** List of { value, label } for populating the set dropdown. */
function listImageSets() {
  return Object.entries(IMAGE_SETS).map(([value, s]) => ({ value, label: s.label }));
}

/** A few sample faces from a set, for the home-screen preview cards. */
function getSetPreview(name, n = 5) {
  const set = getImageSet(name);
  const faces =
    set.kind === "emoji"
      ? set.faces.map((e) => ({ kind: "emoji", value: e }))
      : set.files.map((f) => ({ kind: "image", value: (set.dir || "") + f }));
  return faces.slice(0, n);
}

/** How many distinct faces a set actually has (for the home-screen badge). */
function setSize(name) {
  const set = getImageSet(name);
  return set.kind === "emoji" ? set.faces.length : set.files.length;
}

/** HTML for a single tile face (image or emoji). */
function renderTileFace(face) {
  if (face.kind === "image") {
    return `<img src="${face.value}" alt="tile ${face.id}" draggable="false" />`;
  }
  return `<span class="glyph">${face.value}</span>`;
}
