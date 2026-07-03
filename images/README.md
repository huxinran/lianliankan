# Tile images

Drop your tile artwork into **this folder**, then list the file names in
[`../js/config.js`](../js/config.js) under `IMAGE_FILES`.

```js
const IMAGE_FILES = [
  "cat.png", "dog.png", "fish.png", "bird.png",
  "panda.png", "fox.png", "owl.png", "frog.png",
  "duck.png", "bee.png", "star.png", "moon.png",
  "sun.png", "leaf.png", "heart.png"
];
```

## How many do I need?

| Difficulty | Distinct images needed |
|------------|------------------------|
| 简单 easy   | 6  |
| 普通 normal | 10 |
| 困难 hard   | 15 |

Supply at least as many as the highest difficulty you want to play (15 covers
everything). If you list **fewer than the difficulty requires**, the game
automatically falls back to the built-in emoji tiles, so it always stays
playable while you collect artwork.

## Tips

- Square images look best (tiles are square). ~128×128 px is plenty.
- `png`, `jpg`, `svg`, and `webp` all work.
- Transparent PNGs sit nicely on the tile background.
- No code changes needed beyond the `IMAGE_FILES` list — reload and play.
