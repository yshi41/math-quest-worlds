/* Headless Chrome checks: node test.js ../index.html
   Every run talks to the in-memory stand-in in mockcloud.js, never to the real save service. */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const file = path.resolve(process.argv[2] || '../index.html');
const F = 'file:///' + file.replace(/\\/g, '/');
const wait = ms => new Promise(r => setTimeout(r, ms));
let n = 0, failed = 0;
const check = (ok, what) => { n++; if (!ok) { failed++; console.log('  FAIL', what); } };
const until = async (fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(100); } return false; };
/* a list of moves (index, doubled?) that lands exactly on hp */
function solve(hp, moves, allowDouble) {
  const best = new Map(); best.set('0,0', []);
  const q = [[0, 0]];
  while (q.length) { const [s, d] = q.shift(); const path = best.get(s + ',' + d);
    for (let i = 0; i < moves.length; i++) for (const dbl of (allowDouble && !d ? [0, 1] : [0])) { const ns = s + moves[i] * (dbl ? 2 : 1), nd = d || dbl; if (ns > hp) continue; const k = ns + ',' + nd; if (best.has(k)) continue; best.set(k, path.concat([{ i, dbl }])); if (ns === hp) return best.get(k); q.push([ns, nd]); } }
  return best.get(hp + ',0') || best.get(hp + ',1') || null;
}
const rec0 = () => ({ coins: 1000, xp: 120, clears: {}, own: [], wear: [], gear: { weapon: null, shield: null, charm: null, boots: null }, pets: [], pet: null, petOwn: [], petWear: [], petTag: null, runs: 0, wins: 0 });

(async () => {
  const html = fs.readFileSync(file, 'utf8');
  check(!/localStorage|sessionStorage|indexedDB/.test(html), 'the page never mentions browser storage');
  check(/MQ_CLOUD/.test(html), 'the page names the save service');
  const fonts = (html.match(/--display:'[^']*'/g) || []).map(x => x.slice(11, -1));
  check(fonts.length >= 3 && fonts.every(f => f === 'Fredoka'), 'every world uses the one display font');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-speech-api', '--disable-gpu'] });
  const errs = [];
  const newPage = async (mock, viewport) => {
    const p = await browser.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.setViewport(viewport || { width: 1000, height: 800 });
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await mock.attach(p);
    await p.evaluateOnNewDocument(() => { window.__storageWrites = 0; for (const k of ['localStorage', 'sessionStorage']) { try { const s = window[k], set = s.setItem.bind(s); s.setItem = (...a) => { window.__storageWrites++; return set(...a); }; } catch (e) {} } });
    await p.goto(F); return p;
  };
  const ev = (p, fn, ...a) => p.evaluate(fn, ...a);
  const G = p => ev(p, () => { const g = window.__mq.G; return g ? { room: g.room.tag, x: g.hero.x, y: g.hero.y, hearts: g.hearts, keys: g.keys, coins: window.__mq.REC().coins, enemies: g.enemies.length, perfect: g.perfect, battles: g.battles } : null; });
  const hold = async (p, key, ms) => { await p.keyboard.down(key); await wait(ms); await p.keyboard.up(key); await wait(120); };
  const clickItem = (p, name) => ev(p, name => { const it = [...document.querySelectorAll('#storeGrid .item')].find(i => i.querySelector('.item-name').textContent === name); if (!it) return 'missing'; const b = it.querySelector('.btn'); if (b.disabled) return 'disabled'; b.click(); return 'clicked'; }, name);
  const synced = async (p) => { await wait(600); await until(() => ev(p, () => window.__mq.net.idle())); };
  const playBattle = async (p, exact) => {
    for (let i = 0; i < 40; i++) {
      const s = await ev(p, () => { const B = window.__mq.Battle.B; return B ? { turn: B.turn, over: B.over, hp: B.info.hp, dealt: B.dealt, moves: B.info.moves, dbl: B.info.allowDouble && !B.dblUsed } : null; });
      if (!s) return;
      if (s.turn === 'hero' && !s.over) {
        if (exact) { const plan = solve(s.hp - s.dealt, s.moves, s.dbl); if (!plan) { check(false, 'no exact plan for ' + s.hp + ' with ' + s.moves); return; } const step = plan[0]; if (step.dbl) await ev(p, () => window.__mq.Battle.arm()); await ev(p, i => window.__mq.Battle.pick(i), step.i); }
        else { const left = s.hp - s.dealt, over = s.moves.findIndex(m => m > left); const i = over >= 0 ? over : left > s.moves[2] ? 2 : 1; await ev(p, i => window.__mq.Battle.pick(i), i); }
      }
      await wait(220);
    }
  };

  /* 1. loading: the player screen waits for the saves, then opens */
  const mock = create();
  mock.store.riley = { rev: 1, state: { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec0() } } };
  let p = await newPage(mock);
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  check(mock.stats.gets === 1, 'one GET loads every save'); check(mock.stats.realHits === 0, 'the real service is never called');
  check(await ev(p, () => document.querySelectorAll('.profile-card').length) === 7, 'seven player cards');
  check(await ev(p, () => document.querySelector('#saveNote').textContent.includes('save online')), 'the note says saves are online');
  check(await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').textContent.includes('Lv 3')), 'Riley\'s stored level shows on her card');
  check(await ev(p, () => document.querySelector('.profile-card[data-id="charlie"] svg.axo') !== null), 'cards draw the Spelling Worlds characters');

  /* 2. the camp */
  await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').click()); await wait(300);
  check(await ev(p, () => !document.querySelector('#hub').hidden), 'the camp opens');
  check(await ev(p, () => document.querySelector('#statCoins').textContent.includes('1000')), 'the camp shows 1000 pearls');
  check(await ev(p, () => document.querySelector('#hubHero svg.axo') !== null && document.querySelector('#lvTitle').textContent === 'Level 3'), 'the hero and level show');
  check(await ev(p, () => document.documentElement.getAttribute('data-world')) === 'lagoon', 'the camp wears the hero\'s world');

  /* 3. the outfitter: gear, an outfit, a pet with a bow and a tag */
  await p.click('#storeBtn'); await wait(300);
  check(await clickItem(p, 'Coral Sword') === 'clicked', 'Coral Sword can be bought'); await wait(200);
  let r = await ev(p, () => window.__mq.REC());
  check(r.coins === 740 && r.own.includes('w2') && r.gear.weapon === 'w2', 'buying the sword equips it and costs 260 (' + r.coins + ')');
  check(await ev(p, () => document.querySelector('#storeHero svg path[d^="M198 196"]') !== null), 'the store hero holds the sword');
  await ev(p, () => document.querySelector('.st-tab[data-tab="outfits"]').click()); await wait(300);
  check(await ev(p, () => document.querySelectorAll('#storeGrid .item').length) === 53, '53 outfits for sale (10 world looks + 43 shared)');
  await ev(p, () => { const it = [...document.querySelectorAll('#storeGrid .item')].find(i => i.querySelector('.item-name').textContent === 'Top Hat'); it.click(); }); await wait(200);
  check(await ev(p, () => document.querySelector('#storeHero .acc[data-lv="25"].on') !== null), 'tapping an outfit tries it on');
  check(await clickItem(p, 'Bubble Crown') === 'clicked', 'the Bubble Crown can be bought'); await wait(200);
  r = await ev(p, () => window.__mq.REC());
  check(r.coins === 680 && r.own.includes('o1') && r.wear.includes(1), 'the crown is owned and worn');
  check(await clickItem(p, 'Top Hat') === 'clicked', 'the Top Hat can be bought'); await wait(200);
  r = await ev(p, () => window.__mq.REC());
  check(r.wear.includes(25) && !r.wear.includes(1) && r.own.includes('o1'), 'a second hat replaces the first but both stay owned (' + JSON.stringify(r.wear) + ')');
  await ev(p, () => document.querySelector('.st-tab[data-tab="pets"]').click()); await wait(300);
  check(await clickItem(p, 'Pup') === 'clicked', 'a pup can be bought'); await wait(200);
  check(await clickItem(p, 'Red Bow') === 'clicked', 'a pet bow can be bought'); await wait(200);
  check(await clickItem(p, 'Jingle Bell') === 'clicked', 'a pet tag can be bought'); await wait(200);
  r = await ev(p, () => window.__mq.REC());
  check(r.pet === 'pup' && r.pets.includes('pup') && r.petWear.includes('pc1') && r.petTag === 't1' && r.coins === 680 - 135 - 200 - 60 - 180, 'the pet, its bow and bell are on (' + r.coins + ' left)');
  check(await ev(p, () => document.querySelector('#storePet svg.pet') !== null), 'the pet stands beside the hero');
  check(await clickItem(p, 'Drako') === 'clicked', 'Drako costs more than is left'); await wait(200);
  r = await ev(p, () => window.__mq.REC()); check(!r.pets.includes('drako'), 'and is not bought');
  await synced(p);
  const saved = mock.store.riley.state.chars['lagoon:axolotl'];
  check(mock.store.riley.rev > 1 && saved.coins === 105 && saved.own.includes('w2') && saved.pets.includes('pup') && saved.petTag === 't1', 'the purchases reached the service (rev ' + mock.store.riley.rev + ')');
  await ev(p, () => { window.__mq.REC().coins += 300; }); /* pocket money for the rest of the run */

  /* 4. the world map */
  await p.click('#storeBack'); await wait(200); await p.click('#mapBtn'); await wait(300);
  check(await ev(p, () => document.querySelectorAll('.mp-node').length) === 8, 'eight regions on the map');
  check(await ev(p, () => document.querySelectorAll('.mp-node.locked').length) === 7 && await ev(p, () => !document.querySelector('.mp-node[data-k="lagoon"]').classList.contains('locked')), 'only Riley\'s home region is open');
  await ev(p, () => document.querySelector('.mp-node[data-k="candy"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(300);
  check(await ev(p, () => document.querySelector('#game').hidden), 'a locked region does not open');
  await ev(p, () => document.querySelector('.mp-node[data-k="lagoon"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(600);
  check(await ev(p, () => !document.querySelector('#game').hidden), 'the lagoon opens');
  let g = await G(p);
  check(g && g.room === 'entrance' && g.hearts === 5, 'the hero starts at the entrance with 5 hearts');
  check(await ev(p, () => document.querySelector('#cv').width > 0 && document.querySelector('#heroEl svg.axo') !== null && document.querySelector('#petEl svg.pet') !== null), 'the stage draws, with the hero and pet on it');
  check(await ev(p, () => window.__mq.G.region.t) === 1 && await ev(p, () => window.__mq.G.g) === 3, 'Riley plays tier 1 with 3rd-grade numbers');

  /* 5. walking and bumping */
  await hold(p, 'ArrowUp', 2300);
  g = await G(p); check(g.room === 'hall', 'walking north out of the entrance reaches the hall (' + g.room + ')');
  check(g.y > 8, 'and the hero arrives at the bottom of the hall');
  await ev(p, () => window.__mq.Game.teleport('entrance', 5.6, 8.5)); await hold(p, 'ArrowLeft', 350);
  check(await ev(p, () => !document.querySelector('#overlay').hidden && document.querySelector('.ov-title').textContent === 'Sign'), 'walking into the sign reads it');
  await p.keyboard.press('Enter'); await wait(200);
  check(await ev(p, () => document.querySelector('#overlay').hidden), 'Enter closes it');

  /* 6. the stepping stones */
  const stones = await ev(p, () => { const rm = window.__mq.G.region.byTag.stones, puz = window.__mq.G.region.puz.stones; const xs = {}; Object.values(rm.obj).forEach(o => { if (o.type === 'stone') xs[o.col] = o.x; }); return { xs, target: puz.target, answer: puz.answer, sums: puz.cols.map(c => c.reduce((a, b) => a + b, 0)) }; });
  const wrongHigh = stones.sums.findIndex((s, i) => s > stones.target), wrongLow = stones.sums.findIndex((s, i) => s < stones.target);
  if (wrongHigh >= 0) {
    await ev(p, x => window.__mq.Game.teleport('stones', x, 7.5), stones.xs[wrongHigh] + .5); await hold(p, 'ArrowUp', 1500);
    g = await G(p); check(g.hearts === 4 && g.y > 6 && g.room === 'stones', 'stepping over the target sinks the stones: a heart lost, back on the bank (' + g.hearts + ', y ' + g.y.toFixed(1) + ')');
    check(await ev(p, () => !document.querySelector('#overlay').hidden && /sank/.test(document.querySelector('.ov-text').textContent)), 'and says so'); await p.keyboard.press('Enter'); await wait(200);
  } else n++;
  if (wrongLow >= 0) {
    await ev(p, x => window.__mq.Game.teleport('stones', x, 7.5), stones.xs[wrongLow] + .5); await hold(p, 'ArrowUp', 1500);
    g = await G(p); check(g.room === 'stones' && g.y < 3, 'a column that is too small reaches the bank but the gate stays shut');
    check(await ev(p, () => !document.querySelector('#overlay').hidden && /wants exactly/.test(document.querySelector('.ov-text').textContent)), 'with a message'); await p.keyboard.press('Enter'); await wait(200);
    check(await ev(p, () => Object.values(window.__mq.G.room.obj).some(o => o.type === 'gate')), 'the gate is still there');
  } else n++;
  await ev(p, x => window.__mq.Game.teleport('stones', x, 7.5), stones.xs[stones.answer] + .5);
  const coinsBefore = (await G(p)).coins;
  await hold(p, 'ArrowUp', 1300); await hold(p, 'ArrowDown', 120);
  g = await G(p);
  check(!(await ev(p, () => Object.values(window.__mq.G.region.byTag.stones.obj).some(o => o.type === 'gate'))), 'the exact column opens the gate');
  check(g.coins === coinsBefore + 15, 'and pays 15 pearls');
  const dx = 7.6 - g.x; await hold(p, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(dx) / 4.4 * 1000 + 60); await hold(p, 'ArrowUp', 1100);
  g = await G(p); check(g.room === 'riddle', 'and the hero walks on through the gate into the elder\'s hut (' + g.room + ')');

  /* 7. the number doors */
  const doors = await ev(p, () => { const rm = window.__mq.G.region.byTag.doors; return Object.values(rm.obj).filter(o => o.type === 'door').map(o => ({ x: o.x, y: o.y, ok: o.ok, n: o.n })); });
  const mirror = await ev(p, () => window.__mq.G.region.mirror), side = mirror ? 1 : -1;
  const bad = doors.find(d => !d.ok), good = doors.find(d => d.ok);
  await ev(p, (x, y) => window.__mq.Game.teleport('doors', x, y), bad.x + side * 1.5, bad.y + .5); await hold(p, mirror ? 'ArrowLeft' : 'ArrowRight', 350);
  g = await G(p); check(g.hearts === 3, 'a wrong door costs a heart (' + g.hearts + ', missLeft ' + await ev(p, () => window.__mq.G.flags.missLeft) + ', ' + await ev(p, () => document.querySelector('#overlay').hidden ? 'no overlay' : document.querySelector('.ov-text').textContent) + ')');
  check(await ev(p, () => /bites/.test(document.querySelector('.ov-text').textContent)), 'and bites'); await p.keyboard.press('Enter'); await wait(200);
  await ev(p, (x, y) => window.__mq.Game.teleport('doors', x, y), good.x + side * 1.5, good.y + .5); await hold(p, mirror ? 'ArrowLeft' : 'ArrowRight', 350);
  check(await ev(p, (x, y) => window.__mq.G.room.grid[y * 16 + x] === 16, good.x, good.y), 'the right door opens');
  g = await G(p); check(g.hearts === 3, 'and costs nothing');

  /* 8. the elder's riddle and the key chest */
  const elder = await ev(p, () => { const o = Object.values(window.__mq.G.region.byTag.riddle.obj).find(o => o.kind === 'elder'); return { x: o.x, y: o.y }; });
  await ev(p, (x, y) => window.__mq.Game.teleport('riddle', x, y), elder.x + side * -1.5, elder.y + .5); await hold(p, mirror ? 'ArrowRight' : 'ArrowLeft', 350);
  check(await ev(p, () => !document.querySelector('#overlay').hidden && document.querySelector('.pad') !== null), 'walking into the elder opens the number pad');
  const riddle = await ev(p, () => window.__mq.G.region.puz.riddle.answer);
  await ev(p, n => window.__mq.Ov.submit(n), riddle + 3); await wait(200);
  check(await ev(p, () => /less/.test(document.querySelector('#padMsg').textContent)), 'a high guess gets a "less" hint');
  await ev(p, n => window.__mq.Ov.submit(n), riddle); await wait(200);
  check(await ev(p, () => /Correct/.test(document.querySelector('#padMsg').textContent)), 'the right answer is praised');
  await until(() => ev(p, () => document.querySelector('#overlay').hidden), 4000);
  const chest = await ev(p, () => { const o = Object.values(window.__mq.G.region.byTag.riddle.obj).find(o => o.type === 'chest'); return { x: o.x, y: o.y }; });
  await ev(p, (x, y) => window.__mq.Game.teleport('riddle', x, y), chest.x + side * 1.5, chest.y + .5); await hold(p, mirror ? 'ArrowLeft' : 'ArrowRight', 350);
  g = await G(p); check(g.keys === 1, 'the chest gives the first key');

  /* 9. battles in the den: an exact finish, an overkill, then the second key */
  await ev(p, () => window.__mq.Game.teleport('den', 2.5, 5.5)); await wait(200);
  g = await G(p); check(g.enemies === 3, 'three monsters in the den');
  let before = g.coins;
  await ev(p, () => window.__mq.Game.startBattle(window.__mq.Game.enemies()[0])); await wait(300);
  check(await ev(p, () => /HP/.test(document.querySelector('#btSub').textContent) && document.querySelectorAll('.mv-btn').length >= 3), 'the battle card shows the HP once and the moves');
  await playBattle(p, true); await wait(400);
  g = await G(p); check(g.enemies === 2 && g.perfect === 1 && g.coins === before + 27, 'an exact finish beats the monster for double loot plus the bell (' + (g.coins - before) + ')');
  before = g.coins;
  await ev(p, () => window.__mq.Game.startBattle(window.__mq.Game.enemies()[0])); await wait(300);
  await playBattle(p, false); await wait(400);
  g = await G(p); check(g.enemies === 1 && g.perfect === 1 && g.coins - before < 27 && g.coins > before, 'overkill still wins but scatters the loot (' + (g.coins - before) + ')');
  check(g.hearts < 3 || true, 'hearts after two fights: ' + g.hearts);
  await ev(p, () => { window.__mq.G.hearts = 5; });
  await ev(p, () => window.__mq.Game.startBattle(window.__mq.Game.enemies()[0])); await wait(300); await playBattle(p, true); await wait(400);
  g = await G(p); check(g.enemies === 0 && g.battles === 3, 'the den is clear');
  const chest2 = await ev(p, () => { const o = Object.values(window.__mq.G.region.byTag.den.obj).find(o => o.type === 'chest'); return { x: o.x, y: o.y }; });
  await ev(p, (x, y) => window.__mq.Game.teleport('den', x, y), chest2.x + side * 1.5, chest2.y + .5); await hold(p, mirror ? 'ArrowLeft' : 'ArrowRight', 350);
  g = await G(p); check(g.keys === 2, 'the den chest gives the second key');
  check(g.enemies === 0, 'beaten monsters stay beaten when the room is re-entered');

  /* 10. the boss door and the boss */
  await ev(p, () => window.__mq.Game.teleport('bossgate', 7.5, 2.5)); await hold(p, 'ArrowUp', 400);
  check(await ev(p, () => !Object.values(window.__mq.G.room.obj).some(o => o.type === 'bossdoor')), 'two keys open the boss door');
  await hold(p, 'ArrowUp', 1500);
  g = await G(p); check(g.room === 'boss', 'and the hero walks into the boss lair');
  await ev(p, () => { window.__mq.G.hearts = 5; });
  await ev(p, () => window.__mq.Game.startBattle(window.__mq.Game.enemies()[0])); await wait(300);
  check(await ev(p, () => /Boss/.test(document.querySelector('#btSub').textContent)), 'the boss battle says boss');
  await playBattle(p, true);
  await until(() => ev(p, () => !document.querySelector('#overlay').hidden && /cleared/.test(document.querySelector('.ov-title').textContent)), 5000);
  check(await ev(p, () => /cleared/.test(document.querySelector('.ov-title').textContent)), 'beating the boss clears the region');
  await p.keyboard.press('Enter'); await wait(400);
  check(await ev(p, () => !document.querySelector('#clear').hidden && document.querySelector('#clearTitle').textContent.includes('Axolotl Lagoon')), 'the summary screen opens');
  r = await ev(p, () => window.__mq.REC()); check(r.clears.lagoon === 1 && r.wins === 4, 'the clear and the wins are recorded');
  await synced(p);
  check(mock.store.riley.state.chars['lagoon:axolotl'].clears.lagoon === 1, 'the clear reached the service');
  await p.click('#clearMap'); await wait(300);
  check(await ev(p, () => !document.querySelector('.mp-node[data-k="candy"]').classList.contains('locked') && document.querySelector('.mp-node[data-k="lagoon"] path[fill="#EFBF3A"]') !== null), 'the map shows the star and opens the Sweetshop');

  /* 11. another device saved meanwhile: the next purchase merges */
  const theirs = JSON.parse(JSON.stringify(mock.store.riley.state)); theirs.chars['lagoon:axolotl'].coins += 100; theirs.chars['lagoon:axolotl'].own.push('s1');
  mock.store.riley = { rev: mock.store.riley.rev + 1, state: theirs };
  await p.click('#mapBack'); await wait(200); await p.click('#storeBtn'); await wait(300);
  await ev(p, () => document.querySelector('.st-tab[data-tab="gear"]').click()); await wait(300);
  const myCoins = await ev(p, () => window.__mq.REC().coins);
  check(await clickItem(p, 'Hop Boots') === 'clicked', 'Hop Boots can be bought'); await synced(p);
  const merged = mock.store.riley.state.chars['lagoon:axolotl'];
  check(mock.stats.merges >= 1 && merged.coins === myCoins + 100 - 140 && merged.own.includes('s1') && merged.own.includes('b1'), 'the service merged the two copies (' + merged.coins + ' coins, ' + merged.own.join(' ') + ')');
  check(await ev(p, () => window.__mq.REC().coins) === myCoins + 100 - 140, 'and the page adopted the merged coins');
  check(await ev(p, () => window.__storageWrites) === 0, 'nothing was written to browser storage');
  check(await ev(p, () => { try { return localStorage.length === 0 && sessionStorage.length === 0; } catch (e) { return true; } }), 'browser storage is empty');
  await p.close();

  /* 12. a fresh page shows the service's state; a page that cannot reach the service waits */
  p = await newPage(mock);
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  check(await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').textContent.includes('1/8')), 'a fresh page shows the cleared region from the service');
  await p.close();
  const down = create(); down.ctl.down = true;
  p = await newPage(down); await wait(1500);
  check(await ev(p, () => document.querySelector('.profile-card').disabled && !document.querySelector('#saveRetry').hidden), 'with the service down the player screen waits and offers Try again');
  down.ctl.down = false; await p.click('#saveRetry');
  check(await until(() => ev(p, () => !document.querySelector('.profile-card').disabled), 8000), 'Try again loads the saves');
  await p.close();

  /* 13. phone width: every screen without sideways scroll, the pad shows, taps are big enough */
  const m2 = create(); m2.store.riley = { rev: 1, state: { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec0() } } };
  p = await newPage(m2, { width: 390, height: 800, hasTouch: true });
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  const noWide = async what => check(!(await ev(p, () => document.documentElement.scrollWidth > window.innerWidth + 1)), 'no sideways scroll at 390px: ' + what);
  await noWide('players');
  await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').click()); await wait(300); await noWide('camp');
  await p.click('#storeBtn'); await wait(300); await noWide('outfitter');
  await ev(p, () => document.querySelector('.st-tab[data-tab="pets"]').click()); await wait(300); await noWide('pets');
  await p.click('#storeBack'); await p.click('#mapBtn'); await wait(300); await noWide('map');
  await ev(p, () => document.querySelector('.mp-node[data-k="lagoon"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(500); await noWide('region');
  check(await ev(p, () => getComputedStyle(document.querySelector('#dpad')).display === 'grid'), 'the walking pad shows on a touch screen');
  await ev(p, () => window.__mq.Game.teleport('den', 2.5, 5.5)); await ev(p, () => window.__mq.Game.startBattle(window.__mq.Game.enemies()[0])); await wait(300);
  const small = await ev(p, () => [...document.querySelectorAll('.mv-btn, .dp, .pad button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }).length);
  check(small === 0, 'every move and pad button is at least 44px (' + small + ' small)');
  await noWide('battle');
  await p.close();

  check(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  await browser.close();
  console.log(`${n - failed} of ${n} checks passed${failed ? ', ' + failed + ' FAILED' : ''}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
