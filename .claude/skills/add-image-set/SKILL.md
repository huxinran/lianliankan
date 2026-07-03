---
name: add-image-set
description: Add a new themed tile image set to the 连连看 (Lianliankan) game — e.g. a "cats" or "poodles" set. Use when the user wants to add, register, or wire up a new set/theme of tile images, or drops image files into images/ and wants them usable in the game.
---

# Add a new image set to 连连看

This skill wires a new **themed image set** (e.g. `cats`, `poodles`, `fruits`)
into the game so it shows up in the in-game **图案** dropdown and is guaranteed
playable. The game reads sets from `IMAGE_SETS` in [`js/config.js`](../../../js/config.js).

## Inputs to gather first

Ask the user (or infer from what they said) for:

1. **Set id** — a short lowercase slug, letters/numbers/hyphens only
   (e.g. `cats`, `poodles`, `sea-life`). This becomes the folder name and the
   `IMAGE_SETS` key.
2. **Display label** — the human-readable name for the dropdown (e.g. `猫咪`,
   `贵宾犬`, `Cats`). Chinese labels are fine and fit the game's style.
3. **The images themselves** — where they are. They may already be in
   `images/<id>/`, sitting in another folder, or the user may point to files to
   copy in. If the user has NOT provided images yet, tell them the requirement
   (below) and stop — do not invent or download images unless they ask.

## Requirements for the images

- Put them in **`images/<id>/`** (create the folder).
- **Square** images look best; **128×128 px** is the sweet spot.
- Formats: `png`, `jpg`, `svg`, `webp`. Transparent PNGs look best on the tile.
- A set needs **at least 15 distinct images** to be usable on every difficulty
  (easy needs 6, normal 10, hard 15). Fewer than the chosen difficulty and the
  game auto-falls back to the emoji set — so aim for 15+.

## Steps

1. **Create the folder** `images/<id>/` and place/copy the image files there.
   - If the user gave a source folder, copy the files in.
   - Verify the count with a directory listing (need ≥ the difficulty target;
     prefer ≥15). If short, warn the user which difficulties won't use the set.

2. **Collect the file names** actually present in `images/<id>/` (do not
   hand-type from memory — list the directory so the array matches reality).

3. **Register the set** in [`js/config.js`](../../../js/config.js). Insert a new
   entry into the `IMAGE_SETS` object, right before the line
   `/* >>> The /add-image-set skill appends new sets below this line <<< */`.
   Follow this exact shape:

   ```js
   <id>: {
     label: "<display label>",
     kind: "image",
     dir: "images/<id>/",
     files: [
       "file1.png", "file2.png", /* …all files, comma-separated… */
     ],
   },
   ```

   - `kind` is always `"image"` for photo/art sets.
   - `dir` MUST end with a trailing slash.
   - List every file present in the folder.

4. **(Optional) make it the default** — if the user wants this set selected on
   load, set `const DEFAULT_SET = "<id>";` in `config.js`. The game selects the
   first dropdown option by default, so also ensure the set is desired first, or
   just leave `DEFAULT_SET` and let the user pick it in the 图案 dropdown.

5. **Verify** — start the local preview (`preview_start`, config name
   `lianliankan`), open the page, and confirm:
   - the new label appears in the **图案** dropdown,
   - selecting it renders the images as tiles (no broken-image icons — check the
     browser console / network panel for 404s on `images/<id>/…`),
   - a match still draws the red connection line.
   Fix any 404s (usually a filename typo or missing trailing slash in `dir`).

6. **Commit & deploy** — the game is served from GitHub Pages on `main`:
   ```
   git add -A
   git commit -m "Add <id> image set"
   git push
   ```
   Pages redeploys automatically; the set is live at
   https://huxinran.github.io/lianliankan/ within ~1 minute.

## Notes

- Never remove or reorder the `emoji` set — it is the always-available fallback.
- Keep the JSON-ish formatting consistent with existing entries so the file
  stays readable.
- If the user only has a few images and wants a *small* board, that's fine —
  just make sure the count meets the difficulty they intend to play.
