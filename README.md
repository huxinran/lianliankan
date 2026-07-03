# 连连看 · Lianliankan

A classic Chinese tile-matching game — clear the board by connecting matching
pairs with a path that has **at most two turns**. Pure HTML/CSS/JS, no build
step, deployable straight to GitHub Pages.

## Play

Open `index.html`, or play the deployed version on GitHub Pages.

## Features

- **Classic connection rule** — pairs link through empty cells (and around the
  board edge) with ≤ 2 turns.
- **Connection feedback** — a red line animates along the path on a successful
  match; a shake + message explains *why* an invalid pick failed
  (different picture, or path too long).
- **Always solvable** — the board is generated with even tile counts and the
  game auto-reshuffles whenever no legal move remains, so it can always be
  finished. Manual **提示 (hint)** and **洗牌 (shuffle)** are also provided.
- **Difficulty levels** — 6×6, 8×6, 10×8.
- **Swappable images** — drop your own artwork into `images/` and list it in
  `js/config.js`; until then it uses built-in emoji tiles.

## Use your own images

1. Put image files in [`images/`](images/).
2. List the file names in [`js/config.js`](js/config.js) under `IMAGE_FILES`.
3. Reload. See [`images/README.md`](images/README.md) for details.

## Project structure

```
index.html          # markup + HUD
css/style.css       # styling
js/config.js        # image-set selection (swap images here)
js/pathfinder.js    # ≤2-turn connection rule
js/game.js          # game logic, rendering, solvability
images/             # drop tile artwork here
```
