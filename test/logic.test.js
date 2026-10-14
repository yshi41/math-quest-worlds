/* Merge rules: node logic.test.js */
const assert = require('assert');
(async () => {
  const { mergeState, lowersProgress } = await import('../worker/src/logic.mjs');
  const rec = o => Object.assign({ coins: 0, xp: 0, clears: {}, own: [], wear: [], gear: { weapon: null, shield: null, charm: null, boots: null }, pets: [], pet: null, petOwn: [], petWear: [], petTag: null, runs: 0, wins: 0 }, o);
  const base = { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec({ coins: 100, xp: 50, clears: { lagoon: 1 }, own: ['w1'], runs: 1 }) } };
  const mine = { cur: 'candy:bear', chars: { 'lagoon:axolotl': rec({ coins: 40, xp: 80, clears: { lagoon: 1, candy: 1 }, own: ['w1', 'o24'], wear: [24], gear: { weapon: 'w1', shield: null, charm: null, boots: null }, pets: ['pup'], pet: 'pup', petOwn: ['t1'], petTag: 't1', runs: 2 }), 'candy:bear': rec({ coins: 5, xp: 10 }) } };
  const theirs = { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec({ coins: 250, xp: 70, clears: { lagoon: 1 }, own: ['w1', 's1'], wear: [], gear: { weapon: null, shield: 's1', charm: null, boots: null }, pets: ['kit'], pet: 'kit', runs: 3 }), 'ocean:octopus': rec({ coins: 9 }) } };
  const out = mergeState(mine, theirs, base);
  const a = out.chars['lagoon:axolotl'];
  assert.strictEqual(a.coins, 190, 'coins move by this page\'s delta (250 - 60)');
  assert.strictEqual(a.xp, 100, 'xp adds the non-negative delta (70 + 30)');
  assert.strictEqual(a.runs, 4, 'runs add the delta');
  assert.deepStrictEqual(a.clears, { lagoon: 1, candy: 1 }, 'cleared regions are kept from both');
  assert.deepStrictEqual(a.own.sort(), ['o24', 's1', 'w1'], 'owned things are the union');
  assert.deepStrictEqual(a.pets.sort(), ['kit', 'pup'], 'pets are the union');
  assert.deepStrictEqual(a.wear, [24], 'what is worn follows this page');
  assert.strictEqual(a.gear.shield, null, 'gear follows this page');
  assert.strictEqual(a.pet, 'pup', 'the pet out follows this page');
  assert.strictEqual(a.petTag, 't1');
  assert.strictEqual(out.cur, 'candy:bear', 'the playing character follows this page');
  assert.ok(out.chars['candy:bear'] && out.chars['candy:bear'].coins === 5, 'a character new on this page is added');
  assert.ok(out.chars['ocean:octopus'] && out.chars['ocean:octopus'].coins === 9, 'a character only on the other device is kept');
  /* a purchase on this page (coins down, own up) survives a merge */
  const bought = mergeState({ chars: { k: rec({ coins: 0, own: ['w2'] }) } }, { chars: { k: rec({ coins: 90 }) } }, { chars: { k: rec({ coins: 40 }) } });
  assert.strictEqual(bought.chars.k.coins, 50); assert.deepStrictEqual(bought.chars.k.own, ['w2']);
  assert.strictEqual(lowersProgress({ chars: { k: rec({ xp: 5 }) } }, { chars: { k: rec({ xp: 10 }) } }), true, 'lower xp is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ xp: 10, clears: {} }) } }, { chars: { k: rec({ xp: 10, clears: { lagoon: 1 } }) } }), true, 'a lost clear is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ own: [] }) } }, { chars: { k: rec({ own: ['w1'] }) } }), true, 'a lost item is refused');
  assert.strictEqual(lowersProgress({ chars: {} }, { chars: { k: rec({}) } }), true, 'a lost character is refused');
  assert.strictEqual(lowersProgress({ chars: { k: rec({ xp: 12, coins: 0 }) } }, { chars: { k: rec({ xp: 10, coins: 500 }) } }), false, 'spending coins is fine');
  console.log('merge rules: all checks passed');
})().catch(e => { console.error(e); process.exit(1); });
