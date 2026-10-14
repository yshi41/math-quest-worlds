/* Merge rules: node logic.test.js */
const assert = require('assert');
(async () => {
  const { mergeState, lowersProgress } = await import('../worker/src/logic.mjs');
  const rec = o => Object.assign({ coins: 0, xp: 0, clears: {}, inv: { melee: ['m2'], ranged: ['r3'], armor: [] }, equip: { melee: 'm2', ranged: 'r3', armor: null }, hearts: 5, runs: 0, wins: 0, kills: 0, own: [], wear: [], pets: [], pet: null, petOwn: [], petWear: [], petTag: null }, o);
  const base = { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec({ coins: 100, xp: 50, clears: { lagoon: 1 }, runs: 1 }) } };
  const mine = { cur: 'candy:bear', chars: { 'lagoon:axolotl': rec({ coins: 40, xp: 80, clears: { lagoon: 1, candy: 1 }, inv: { melee: ['m2', 'm3'], ranged: ['r3'], armor: ['a1'] }, equip: { melee: 'm3', ranged: 'r3', armor: 'a1' }, hearts: 6, runs: 2, kills: 9 }), 'candy:bear': rec({ coins: 5, xp: 10 }) } };
  const theirs = { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec({ coins: 250, xp: 70, clears: { lagoon: 1 }, inv: { melee: ['m2'], ranged: ['r3', 'r5'], armor: [] }, equip: { melee: 'm2', ranged: 'r5', armor: null }, hearts: 5, runs: 3, kills: 4 }), 'ocean:octopus': rec({ coins: 9 }) } };
  const out = mergeState(mine, theirs, base);
  const a = out.chars['lagoon:axolotl'];
  assert.strictEqual(a.coins, 190, 'coins move by this page\'s delta (250 - 60)');
  assert.strictEqual(a.xp, 100, 'xp adds the non-negative delta (70 + 30)');
  assert.strictEqual(a.runs, 4); assert.strictEqual(a.kills, 13);
  assert.strictEqual(a.hearts, 6, 'hearts keep the higher value');
  assert.deepStrictEqual(a.clears, { lagoon: 1, candy: 1 }, 'cleared regions are kept from both');
  assert.deepStrictEqual(a.inv.melee.sort(), ['m2', 'm3']); assert.deepStrictEqual(a.inv.ranged.sort(), ['r3', 'r5']); assert.deepStrictEqual(a.inv.armor, ['a1'], 'found gear is the union');
  assert.deepStrictEqual(a.equip, { melee: 'm3', ranged: 'r3', armor: 'a1' }, 'what is equipped follows this page');
  assert.strictEqual(out.cur, 'candy:bear', 'the playing character follows this page');
  assert.ok(out.chars['candy:bear'] && out.chars['candy:bear'].coins === 5, 'a character new on this page is added');
  assert.ok(out.chars['ocean:octopus'] && out.chars['ocean:octopus'].coins === 9, 'a character only on the other device is kept');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ xp: 5 }) } }, { chars: { k: rec({ xp: 10 }) } }), true, 'lower xp is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ clears: {} }) } }, { chars: { k: rec({ clears: { lagoon: 1 } }) } }), true, 'a lost clear is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ inv: { melee: ['m2'], ranged: ['r3'], armor: [] } }) } }, { chars: { k: rec({ inv: { melee: ['m2', 'm4'], ranged: ['r3'], armor: [] } }) } }), true, 'a lost weapon is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ hearts: 5 }) } }, { chars: { k: rec({ hearts: 6 }) } }), true, 'lost hearts are refused');
  assert.strictEqual(lowersProgress({ chars: {} }, { chars: { k: rec({}) } }), true, 'a lost character is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ xp: 12, coins: 0 }) } }, { chars: { k: rec({ xp: 10, coins: 500 }) } }), false, 'spending coins is fine');
  console.log('merge rules: all checks passed');
})().catch(e => { console.error(e); process.exit(1); });
