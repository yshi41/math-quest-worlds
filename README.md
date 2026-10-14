# Math Quest Worlds

A top-down math adventure for the kids, in the Spelling Worlds worlds. Live at https://yshi41.github.io/math-quest-worlds/

Pick a hero (any Spelling Worlds character), dress it up, bring a pet, and explore eight regions on the world
map. Each region is a little Zelda-style world of rooms: cross the river on stones that add up to the sign's
number, open the door that follows the rule, pay the troll the right toll, answer the elder for a key, beat the
monsters (a monster shows its HP once, you keep the running total in your head) and the boss. Numbers follow the
kid's grade (Riley and Addie 3rd, the others 4th) and the region's tier, and are rolled fresh on every visit.
Progress saves online only, through the Worker in `worker/`; nothing is ever kept in the browser.

## Layout

- `index.html` is the built page that GitHub Pages serves. Do not edit it by hand.
- `src/` holds the sources: `template.html` (page and CSS), `data.js`, `math.js` (puzzle generators),
  `world.js` (region builder), `art.js`, `core.js` (sound, saves, worlds), `engine.js` (the top-down game),
  `overlays.js` (battles and dialogs), `screens.js` (menu, camp, map, outfitter, characters).
  `node build.js` rebuilds `index.html`; it copies the palettes, scenes, characters and outfit pieces from the
  sibling `spelling-worlds` repo's last commit. Bump `BUILD` in `src/screens.js` on every release.
- `worker/` is the save service (Cloudflare Worker + D1, tables `mq_saves` and `mq_history` in the
  Spelling Worlds database). Deploy from `worker/` with wrangler and `CLOUDFLARE_API_TOKEN` set.
- `test/`: `node math.test.js` (generators and rooms), `node logic.test.js` (merge rules), and the headless
  Chrome suite `node test.js ../index.html` (after `npm install` in `test/`), which plays through a region
  against an in-memory stand-in for the save service and never touches the real saves.
