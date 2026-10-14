# Math Quest Worlds

A top-down math adventure for the kids, across the eight Spelling Worlds worlds. Live at https://yshi41.github.io/math-quest-worlds/

Pick a hero (any Spelling Worlds character, each with its own melee swing and ranged shot) and explore eight
regions on the world map. Each region is a little Zelda-style world of rooms. Monsters are fought in real time
and drop coins, hearts, ammo and gear. **Weapons are numbers**: a Number Slime loses your weapon's number each
hit and pops on exactly 0; a Factor Beetle only takes hits from a number that divides it. Puzzle rooms put the
math in the floor: stones that add up, doors that follow a rule, targets to shoot, blocks to push onto plates,
tiles to munch, counting paths, torches in times-table order, dial locks. Bosses are beaten with the math too
(shield on exactly 0, divide the Factor Boss to 1, feed the Minion Boss the right minions, stand on the next
number for the Pattern Boss) and drop special weapons. Numbers follow the kid's grade (Riley 3rd, Charlie and
the test player Yan 4th) and the region's tier, and are rolled fresh on every visit. `docs/DESIGN.md` has the
design and its sources. Graphics are deliberately one simple set while the mechanics are tuned.
Progress saves online only, through the Worker in `worker/`; nothing is ever kept in the browser.

## Layout

- `index.html` is the built page that GitHub Pages serves. Do not edit it by hand.
- `src/` holds the sources: `template.html` (page and CSS), `data.js` (players, attacks, weapons, loot),
  `math.js` (puzzle and boss generators), `world.js` (region builder), `art.js` (canvas drawing),
  `core.js` (sound, saves, hero stats), `engine.js` (movement, combat, puzzles, bosses), `overlays.js`,
  `screens.js` (menu, camp with the backpack, map, characters, clear).
  `node build.js` rebuilds `index.html`; it copies the palettes, scenes and character portraits from the
  sibling `spelling-worlds` repo's last commit. Bump `BUILD` in `src/screens.js` on every release.
- `worker/` is the save service (Cloudflare Worker + D1, tables `mq_saves` and `mq_history` in the
  Spelling Worlds database). Deploy from `worker/` with wrangler and `CLOUDFLARE_API_TOKEN` set.
- `test/`: `node math.test.js` (generators and rooms), `node logic.test.js` (merge rules), and the headless
  Chrome suite `node test.js ../index.html` (after `npm install` in `test/`), which plays through six regions,
  every puzzle kind and all four bosses against an in-memory stand-in for the save service and never touches
  the real saves. `node probe.js ../index.html` takes screenshots.
