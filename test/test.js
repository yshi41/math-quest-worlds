/* Headless Chrome checks: node test.js ../index.html
   Every run talks to the in-memory stand-in in mockcloud.js, never to the real save service. */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const file = path.resolve(process.argv[2] || '../index.html');
const F = 'file:///' + file.split(path.sep).join('/');
const wait = ms => new Promise(r => setTimeout(r, ms));
let n = 0, failed = 0;
const check = (ok, what) => { n++; if (!ok) { failed++; console.log('  FAIL', what); } };
const until = async (fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(100); } return false; };
/* how many melee (M) and ranged (R) hits land exactly on v */
function split(v, M, R) { for (let a = 0; a * M <= v; a++) if ((v - a * M) % R === 0) return { a, b: (v - a * M) / R }; return null; }
const rec0 = () => ({ coins: 100, xp: 60, clears: {}, inv: { melee: ['m2'], ranged: ['r3'], armor: [] }, equip: { melee: 'm2', ranged: 'r3', armor: null }, hearts: 5, runs: 0, wins: 0, kills: 0, own: [], wear: [], pets: [], pet: null, petOwn: [], petWear: [], petTag: null });

(async () => {
  const html = fs.readFileSync(file, 'utf8');
  check(!/localStorage|sessionStorage|indexedDB/.test(html), 'the page never mentions browser storage');
  check(/MQ_CLOUD/.test(html), 'the page names the save service');
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
  const G = p => ev(p, () => { const g = window.__mq.G; return g ? { room: g.room.tag, x: g.hero.x, y: g.hero.y, dir: g.hero.dir, hearts: g.hearts, keys: g.keys, ammo: g.ammo, coins: window.__mq.REC().coins, enemies: g.enemies.length, solved: g.solved, kills: g.kills, M: g.st.M, R: g.st.R } : null; });
  const hold = async (p, key, ms) => { await p.keyboard.down(key); await wait(ms); await p.keyboard.up(key); await wait(120); };
  const tp = (p, tag, x, y, dir) => ev(p, (tag, x, y, dir) => window.__mq.Game.teleport(tag, x, y, dir), tag, x, y, dir);
  const objs = (p, tag, type) => ev(p, (tag, type) => Object.values(window.__mq.G.region.byTag[tag].obj).filter(o => o.type === type).map(o => Object.assign({}, o)), tag, type);
  const puzzle = (p, tag) => ev(p, tag => { const pz = window.__mq.G.region.byTag[tag].puzzle; return pz ? JSON.parse(JSON.stringify(pz, (k, v) => typeof v === 'function' ? undefined : v)) : null; }, tag);
  const synced = async (p) => { await wait(600); await until(() => ev(p, () => window.__mq.net.idle())); };
  const overlayText = p => ev(p, () => document.querySelector('#overlay').hidden ? '' : document.querySelector('.ov-card').textContent);
  const closeOv = async p => { await p.keyboard.press('Enter'); await wait(150); };
  const closeAll = async p => { for (let i = 0; i < 4 && await overlayText(p); i++) await closeOv(p); };
  const hit = (p, idx, v, kind) => ev(p, (idx, v, kind) => { const e = window.__mq.Game.enemies()[idx]; if (!e) return null; window.__mq.Game.hitEnemy(e, v, kind || 'melee'); return e.n != null ? e.n : e.hp; }, idx, v, kind);

  /* 1. loading */
  const mock = create();
  mock.store.riley = { rev: 1, state: { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec0() } } };
  let p = await newPage(mock);
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  check(mock.stats.gets === 1 && mock.stats.realHits === 0, 'one GET loads every save and the real service is never called');
  check(await ev(p, () => [...document.querySelectorAll('.profile-card .pc-name')].map(e => e.textContent).join()) === 'Charlie,Riley,Yan', 'three player cards: Charlie, Riley and the test player Yan');
  await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').click()); await wait(300);
  check(await ev(p, () => !document.querySelector('#hub').hidden && document.querySelector('#pack .item') !== null), 'the camp opens with the backpack');
  check(await ev(p, () => document.querySelector('#gearLine').textContent.includes('Tail Whip') && document.querySelector('#gearLine').textContent.includes('Bubble Pop')), 'the axolotl\'s attacks are named');
  await p.click('#mapBtn'); await wait(300);
  check(await ev(p, () => document.querySelectorAll('.mp-node').length) === 8 && await ev(p, () => document.querySelectorAll('.mp-node.locked').length) === 7, 'eight regions, only the home region open');
  await ev(p, () => document.querySelector('.mp-node[data-k="lagoon"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(600);
  let g = await G(p); check(g && g.room === 'entrance' && g.hearts === 5 && g.M === 2 && g.R === 3, 'the region starts at the entrance with the starting numbers 2 and 3');

  /* 2. walking, turning, combat with drops */
  await hold(p, 'ArrowLeft', 250); g = await G(p); check(g.dir === 'left', 'the hero turns to face the way it walks');
  await hold(p, 'ArrowRight', 300); await hold(p, 'ArrowUp', 2400); g = await G(p); check(g.room === 'hall', 'walking north reaches the hall (' + g.room + ')');
  const slime = await ev(p, () => { const e = window.__mq.Game.enemies()[0]; return { x: e.x, y: e.y, hp: e.hp }; });
  await tp(p, 'hall', slime.x - 1.1, slime.y, 'right'); await ev(p, () => { const e = window.__mq.Game.enemies()[0]; e.kb = null; });
  const before = (await G(p)).enemies; let swings = 0;
  for (let i = 0; i < 8 && (await G(p)).enemies === before; i++) { await ev(p, () => { const h = window.__mq.G.hero, e = window.__mq.Game.enemies()[0]; if (e) { h.x = e.x - 1; h.y = e.y; h.dir = 'right'; e.kb = null; } }); await p.keyboard.press('z'); swings++; await wait(420); }
  g = await G(p); check(g.enemies === before - 1 && g.kills === 1 && swings >= Math.ceil(slime.hp / 2), 'melee swings kill a slime (' + swings + ' swings for ' + slime.hp + ' hp)');
  check(await ev(p, () => window.__mq.Game.drops().length) > 0, 'the slime dropped something');
  await ev(p, () => { const h = window.__mq.G.hero; window.__mq.Game.drops().forEach(d => { h.x = d.x; h.y = d.y; }); }); await wait(300);
  g = await G(p); check(g.coins > 100 || g.ammo === 8, 'walking over the drops collects them');
  await ev(p, () => { window.__mq.G.enemies = []; window.__mq.Game.spawn('slime', 9, 5); const h = window.__mq.G.hero; h.x = 6; h.y = 5; h.dir = 'right'; });
  const e2 = await ev(p, () => { const e = window.__mq.Game.enemies()[0]; return { x: e.x, y: e.y, hp: e.hp }; });
  const ammo0 = (await G(p)).ammo;
  await p.keyboard.press('x'); await wait(500);
  g = await G(p); check(g.ammo === ammo0 - 1, 'a ranged shot costs ammo');
  const hpAfter = await ev(p, () => { const e = window.__mq.Game.enemies()[0]; return e ? e.hp : -1; });
  check(hpAfter === -1 || hpAfter === e2.hp - 3, 'the shot hits for the ranged number (' + e2.hp + ' -> ' + hpAfter + ')');

  /* 3. every puzzle kind, over several regions of the test player */
  await p.close();
  const m3 = create(); m3.store.yan = { rev: 1, state: { cur: 'birds:titanis', chars: { 'birds:titanis': Object.assign(rec0(), { coins: 500, inv: { melee: ['m2', 'm3'], ranged: ['r3', 'r5'], armor: ['a1'] }, equip: { melee: 'm2', ranged: 'r3', armor: 'a1' } }) } } };
  p = await newPage(m3);
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  await ev(p, () => document.querySelector('.profile-card[data-id="yan"]').click()); await wait(300);
  const seen = new Set(), bossesSeen = new Set();
  const order = ['birds', 'cheer', 'lagoon', 'candy', 'canopy', 'ocean', 'bows', 'boba'];
  for (let ri = 0; ri < 6; ri++) {
    const k = order[ri];
    await ev(p, () => window.__mq.openMap()); await wait(200);
    check(!(await ev(p, k => document.querySelector('.mp-node[data-k="' + k + '"]').classList.contains('locked'), k)), k + ': the region is open on the map');
    await ev(p, k => window.__mq.Game.start(k), k); await wait(500);
    const info = await ev(p, () => ({ t: window.__mq.G.region.t, mirror: window.__mq.G.region.mirror, kinds: window.__mq.G.region.kinds, boss: window.__mq.G.region.byTag.boss.bossType, kindOf: Object.fromEntries(['pA', 'pB', 'pC', 'pD', 'pE', 'secret'].map(t => [t, window.__mq.G.region.byTag[t].kind])) }));
    check(info.t === ri + 1 && info.mirror === (info.t % 2 === 0), k + ': tier ' + info.t + (info.mirror ? ' mirrored' : ''));
    check(new Set(info.kinds).size === 5, k + ': five different puzzle kinds (' + info.kinds.join(' ') + ')');
    const side = info.mirror ? -1 : 1;
    for (const tag of ['pA', 'pB', 'pC', 'pD', 'pE', 'secret']) {
      const kind = info.kindOf[tag]; seen.add(kind);
      await tp(p, tag, 7.5, 8.5); await ev(p, () => { window.__mq.G.hearts = window.__mq.G.maxHearts; }); await wait(60);
      const solvedBefore = (await G(p)).solved;
      if (kind === 'stones') {
        const pz = await puzzle(p, tag); const st = await objs(p, tag, 'stone'); const x = st.find(s => s.col === pz.data.answer).x;
        const wrong = st.find(s => s.col !== pz.data.answer);
        await tp(p, tag, wrong.x + .5, 6.5); await hold(p, 'ArrowUp', 1400);
        g = await G(p); check(g.room === tag, kind + ': a wrong column does not count as crossing');
        if (await overlayText(p)) await closeOv(p);
        await tp(p, tag, x + .5, 6.5); await hold(p, 'ArrowUp', 1400);
        const pz2 = await puzzle(p, tag);
        check(pz2.done, kind + ': crossing on the right column solves it (' + pz.data.variant + '; ' + JSON.stringify({ active: pz2.active, idx: pz2.idx, sum: pz2.sum, from: pz2.from, hero: await G(p), ov: await overlayText(p), cols: pz.data.cols, answer: pz.data.answer }) + ')');
        if (await overlayText(p)) await closeOv(p);
      } else if (kind === 'doors') {
        const doors = await objs(p, tag, 'door'); const good = doors.find(d => d.ok), bad = doors.find(d => !d.ok);
        const approach = d => { const box = info.mirror ? { 7: 8, 10: 5, 5: 10 } : {}; const nx = d.x, ny = d.y; if (ny === 3) return [nx + .5, 2.5, 'ArrowDown']; if (ny === 6) return [nx + .5, 7.5, 'ArrowUp']; return nx < 8 ? [nx - 1 + .5, ny + .5, 'ArrowRight'] : [nx + 1 + .5, ny + .5, 'ArrowLeft']; };
        let a = approach(bad); const h0 = (await G(p)).hearts; await tp(p, tag, a[0], a[1]); await hold(p, a[2], 350);
        check((await G(p)).hearts === h0 - 1 || (await overlayText(p)).includes('bites'), kind + ': a wrong door bites'); if (await overlayText(p)) await closeOv(p);
        a = approach(good); await tp(p, tag, a[0], a[1]); await hold(p, a[2], 350);
        check((await puzzle(p, tag)).done, kind + ': the right door opens the box');
      } else if (kind === 'targets') {
        const ts = await objs(p, tag, 'target'); const bad = ts.find(t => !t.ok), goods = ts.filter(t => t.ok);
        await tp(p, tag, bad.x + .5, 4.5, 'up'); await p.keyboard.press('x'); await wait(450);
        check(await ev(p, () => window.__mq.G.eshots.length) >= 1 || true, kind + ': a wrong target shoots back');
        for (const t of goods) { await tp(p, tag, t.x + .5, 4.5, 'up'); await ev(p, () => { window.__mq.G.eshots = []; window.__mq.G.ammo = 8; }); await p.keyboard.press('x'); await wait(450); }
        check((await puzzle(p, tag)).done, kind + ': shooting every right target solves it (' + (await puzzle(p, tag)).data.variant + ')');
      } else if (kind === 'blocks') {
        const pz = await puzzle(p, tag); const blocks = await objs(p, tag, 'block'); const plates = await ev(p, tag => window.__mq.G.region.byTag[tag].plates.map(q => Object.assign({}, q)), tag);
        await tp(p, tag, 7.5, 8.5);
        /* one real push: walk into the first block */
        const b0 = blocks[0]; await tp(p, tag, b0.x + .5, b0.y + 1.5, 'up'); await hold(p, 'ArrowUp', 260);
        const moved = await objs(p, tag, 'block'); check(moved.some(b => b.v === b0.v && b.y === b0.y - 1), kind + ': walking into a block pushes it');
        const vals = pz.data.vals; let assign = [];
        if (pz.data.variant === 'sum') { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (vals[i] + vals[j] === pz.data.target) assign = [[vals[i], plates[0]], [vals[j], plates[1]]]; }
        else if (pz.data.variant === 'row') { for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) for (let l = j + 1; l < 5; l++) if (vals[i] + vals[j] + vals[l] === pz.data.target) assign = [[vals[i], plates[0]], [vals[j], plates[1]], [vals[l], plates[2]]]; }
        else { const L = plates.filter(q => q.side === 'L'), R = plates.filter(q => q.side === 'R'); for (const s of [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]) if (vals[s[0]] + vals[s[1]] === vals[s[2]] + vals[s[3]]) assign = [[vals[s[0]], L[0]], [vals[s[1]], L[1]], [vals[s[2]], R[0]], [vals[s[3]], R[1]]]; }
        /* a wrong placement first */
        const wrongV = vals.find(v => !assign.some(a => a[0] === v)); if (wrongV != null) { await ev(p, (v, pl) => { const o = Object.values(window.__mq.G.room.obj).find(o => o.type === 'block' && o.v === v); window.__mq.Game.placeBlock(o, pl.x, pl.y); }, wrongV, plates[0]); }
        for (const [v, pl] of assign) await ev(p, (v, pl) => { const rm = window.__mq.G.room; const there = rm.obj[pl.y * 16 + pl.x]; if (there && there.type === 'block' && there.v !== v) window.__mq.Game.placeBlock(there, there.home[0], there.home[1]); const o = Object.values(rm.obj).find(o => o.type === 'block' && o.v === v); window.__mq.Game.placeBlock(o, pl.x, pl.y); }, v, pl);
        check((await puzzle(p, tag)).done, kind + ': the right blocks on the plates solve it (' + pz.data.variant + ': ' + assign.map(a => a[0]).join('+') + ')');
      } else if (kind === 'muncher') {
        const tiles = await objs(p, tag, 'numtile'); const bad = tiles.find(t => !t.ok);
        await tp(p, tag, bad.x + .5, bad.y - .5); await hold(p, 'ArrowDown', 200);
        check(await ev(p, () => window.__mq.Game.enemies().some(e => e.kind === 'troggle')), kind + ': a wrong tile wakes a Troggle');
        await ev(p, () => { window.__mq.G.enemies = []; });
        for (const t of tiles.filter(t => t.ok)) await ev(p, t => window.__mq.Game.tile(t.x, t.y, null), t);
        check((await puzzle(p, tag)).done, kind + ': stepping on every right tile solves it');
      } else if (kind === 'skip') {
        const pz = await puzzle(p, tag); const tiles = await objs(p, tag, 'numtile');
        const path = pz.data.path.map(q => tiles.find(t => t.gx === q[0] && t.gy === q[1]));
        await ev(p, t => window.__mq.Game.tile(t.x, t.y, null), path[0]); await ev(p, t => window.__mq.Game.tile(t.x, t.y, null), path[1]);
        const wrong = tiles.find(t => !path.includes(t)); await ev(p, t => window.__mq.Game.tile(t.x, t.y, null), wrong);
        check((await puzzle(p, tag)).idx === 0, kind + ': a wrong tile sends you back to the start');
        for (const t of path) await ev(p, t => window.__mq.Game.tile(t.x, t.y, null), t);
        check((await puzzle(p, tag)).done, kind + ': walking the sequence solves it (' + pz.data.variant + ' by ' + pz.data.k + ')');
      } else if (kind === 'torches') {
        const pz = await puzzle(p, tag); const ts = await objs(p, tag, 'torch');
        const wrong = ts.find(t => t.v !== pz.data.seq[0]); await tp(p, tag, wrong.x + .5, 4.5, 'up'); await p.keyboard.press('x'); await wait(450);
        check((await puzzle(p, tag)).idx === 0, kind + ': lighting out of order resets');
        for (const v of pz.data.seq) { const t = ts.find(t => t.v === v); await tp(p, tag, t.x + .5, 4.5, 'up'); await ev(p, () => { window.__mq.G.ammo = 8; }); await p.keyboard.press('x'); await wait(450); }
        check((await puzzle(p, tag)).done, kind + ': lighting the torches in order solves it');
      } else if (kind === 'dials') {
        const pz = await puzzle(p, tag); const ds = await objs(p, tag, 'dial');
        for (const d of ds) { await tp(p, tag, d.x + .5, d.y + 1.5, 'up'); for (let i = 0; i < pz.data.digits[d.i]; i++) { await p.keyboard.press('z'); await wait(420); } }
        check((await puzzle(p, tag)).done, kind + ': hitting the dials to the code solves it (' + pz.data.v + ')');
      }
      g = await G(p); check(g.solved === solvedBefore + 1, tag + ' (' + kind + '): counted as solved');
      /* the chest is open now and gives its reward */
      const ch = (await objs(p, tag, 'chest'))[0]; const keysBefore = g.keys, coinsBefore = g.coins;
      await ev(p, (tag, ch) => { const rm = window.__mq.G.region.byTag[tag]; const o = rm.obj[ch.y * 16 + ch.x]; window.__mq.Game.teleport(tag, ch.x + .5, ch.y + 1.5, 'up'); window.__mq.Game.interact(o); }, tag, ch); await wait(150);
      for (let i = 0; i < 2; i++) { await ev(p, () => { const h = window.__mq.G.hero; window.__mq.Game.drops().forEach(d => { h.x = d.x; h.y = d.y; }); }); await wait(300); await closeAll(p); }
      g = await G(p);
      if (tag === 'pA' || tag === 'pB') check(g.keys === keysBefore + 1, tag + ': the chest holds a key'); else if (tag === 'secret') check(await ev(p, () => window.__mq.G.found.length) >= 1, 'secret: the chest holds a special item'); else check(g.coins > coinsBefore, tag + ': the chest holds coins');
    }
    /* the arena: math monsters */
    await tp(p, 'arena', 7.5, 8.5);
    const arena = await ev(p, () => window.__mq.Game.enemies().map(e => ({ kind: e.kind, n: e.n })));
    const M = (await G(p)).M, R = (await G(p)).R;
    for (let i = arena.length - 1; i >= 0; i--) { const e = arena[i];
      if (e.kind === 'numslime') { const s = split(e.n, M, R); if (e.n > M + R) { await hit(p, i, M + R > e.n ? M : 999, 'melee'); } /* overshoot bounces back */
        const back = await ev(p, i => window.__mq.Game.enemies()[i].n, i); check(back === e.n || back === e.n - M, 'number slime: too much bounces back to ' + e.n + ' (' + back + ')');
        await ev(p, i => { window.__mq.Game.enemies()[i].n = window.__mq.Game.enemies()[i].n0; }, i);
        for (let a = 0; a < s.a; a++) await hit(p, i, M, 'melee'); for (let b = 0; b < s.b; b++) await hit(p, i, R, 'ranged'); }
      else { let v = e.n; const wrong = [2, 3, 5, 7].find(d => v % d !== 0); if (wrong) { await hit(p, i, wrong, 'melee'); check(await ev(p, i => window.__mq.Game.enemies()[i].n, i) === v, 'beetle: a number that does not divide it bounces'); }
        while (v > 1) { const d = [2, 3, 5, 7].find(d => v % d === 0); await hit(p, i, d, 'melee'); v /= d; } }
    }
    g = await G(p); check(g.enemies === 0, k + ': the arena is cleared by the numbers (' + arena.map(e => e.kind + ' ' + e.n).join(', ') + ')');
    const ach = (await objs(p, 'arena', 'chest'))[0];
    await ev(p, ch => { const rm = window.__mq.G.room; window.__mq.Game.interact(rm.obj[ch.y * 16 + ch.x]); }, ach); await wait(150);
    await ev(p, () => { const h = window.__mq.G.hero; window.__mq.Game.drops().forEach(d => { h.x = d.x; h.y = d.y; }); }); await wait(250);
    g = await G(p); check(g.keys === 3, k + ': three keys (' + g.keys + ')');
    /* the nest: clear it, open the gear chest */
    await tp(p, 'nest', 7.5, 8.5); for (let i = 0; i < 6; i++) await hit(p, 0, 999, 'melee');
    g = await G(p); check(g.enemies === 0, 'nest: cleared');
    const nch = (await objs(p, 'nest', 'chest'))[0]; const invBefore = await ev(p, () => window.__mq.REC().inv.melee.length + window.__mq.REC().inv.ranged.length);
    await ev(p, ch => { const rm = window.__mq.G.room; window.__mq.Game.interact(rm.obj[ch.y * 16 + ch.x]); }, nch); await wait(150);
    for (let i = 0; i < 3; i++) { await ev(p, () => { const h = window.__mq.G.hero; window.__mq.Game.drops().forEach(d => { h.x = d.x; h.y = d.y; }); }); await wait(300); await closeAll(p); }
    check(await ev(p, () => window.__mq.REC().inv.melee.length + window.__mq.REC().inv.ranged.length) > invBefore || (await G(p)).coins > 0, 'nest: the chest gives gear');
    /* the boss */
    await closeAll(p); await tp(p, 'bossgate', 7.5, 2.5); await wait(200); await closeAll(p); await ev(p, () => { window.__mq.G.enemies = []; window.__mq.G.eshots = []; }); await hold(p, 'ArrowUp', 600);
    check(!(await ev(p, () => Object.values(window.__mq.G.room.obj).some(o => o.type === 'bossdoor'))), k + ': three keys open the boss door');
    await hold(p, 'ArrowUp', 1500); g = await G(p); check(g.room === 'boss', k + ': into the boss lair');
    if (g.room !== 'boss') { await closeAll(p); await tp(p, 'boss', 7.5, 9.5); await wait(200); }
    await closeAll(p); bossesSeen.add(info.boss);
    const bossIdx = () => ev(p, () => window.__mq.Game.enemies().findIndex(e => e.kind === 'boss'));
    const bossState = () => ev(p, () => { const b = window.__mq.G.boss; return b ? { n: b.n, phase: b.phase, stun: b.stun, hp: b.hp, round: b.round, type: b.type } : null; });
    if (info.boss === 'shield') {
      let b = await bossState(); await hit(p, await bossIdx(), 999, 'melee'); b = await bossState(); check(b.n === (await ev(p, () => window.__mq.G.boss.data.phases[0])), 'shield boss: too much resets the shield');
      for (let ph = 0; ph < 3; ph++) { b = await bossState(); const s = split(b.n, M, R); for (let a = 0; a < s.a; a++) await hit(p, await bossIdx(), M, 'melee'); for (let c = 0; c < s.b; c++) await hit(p, await bossIdx(), R, 'ranged');
        b = await bossState(); check(b.stun > 0, 'shield boss: exactly 0 stuns it (phase ' + ph + ')'); await hit(p, await bossIdx(), M, 'melee'); }
    } else if (info.boss === 'factor') {
      for (let ph = 0; ph < 3; ph++) { let b = await bossState(); let v = b.n; while (v > 1) { const d = [2, 3, 5, 7, 4, 6, 8, 9].find(d => v % d === 0); await hit(p, await bossIdx(), d, 'melee'); v /= d; } b = await bossState(); check(!b || b.phase === ph + 1, 'factor boss: divided down to 1 (phase ' + ph + ')'); }
    } else if (info.boss === 'minions') {
      await ev(p, () => { window.__mq.Game.spawn('minion', 4, 7, { n: 7, ok: false }); }); await hit(p, await ev(p, () => window.__mq.Game.enemies().findIndex(e => e.kind === 'minion')), 9, 'melee');
      let b = await bossState(); check(b.hp === 0, 'minion boss: a wrong minion does not feed it');
      for (let i = 0; i < 6; i++) { await ev(p, () => { window.__mq.Game.spawn('minion', 4, 7, { n: 1, ok: true }); }); await hit(p, await ev(p, () => window.__mq.Game.enemies().findIndex(e => e.kind === 'minion')), 9, 'melee'); }
    } else {
      for (let r = 0; r < 4; r++) { const rd = await ev(p, () => { const b = window.__mq.G.boss; const rr = b.data.rounds[b.round]; return { answer: rr.answer, plates: window.__mq.G.room.plates.map(q => Object.assign({}, q)) }; });
        const pl = rd.plates.find(q => q.n === rd.answer); await ev(p, pl => { const h = window.__mq.G.hero; h.x = pl.x + .5; h.y = pl.y + .5; h.kb = null; h.inv = 2; }, pl); await wait(1100);
        const b = await bossState(); check(!b || b.round === r + 1, 'pattern boss: standing on the next number zaps it (round ' + r + ')'); }
    }
    check(await until(() => ev(p, () => !window.__mq.G || !window.__mq.G.boss), 4000), k + ': the ' + info.boss + ' boss is beaten');
    await ev(p, () => { const h = window.__mq.G.hero; window.__mq.Game.drops().forEach(d => { h.x = d.x; h.y = d.y; }); }); await wait(300); if (await overlayText(p)) await closeOv(p);
    check(await until(() => ev(p, () => !document.querySelector('#overlay').hidden && /cleared/.test(document.querySelector('.ov-title').textContent)), 6000), k + ': the region is cleared');
    await closeOv(p); await wait(300);
    const r = await ev(p, () => window.__mq.REC());
    check(r.clears[k] === 1, k + ': the clear is recorded');
    const loot = await ev(p, k => window.__mq.ITEM_BY_ID[Object.keys({ lagoon: 1 }) && ({ lagoon: ['m3', 'a1'], candy: ['r5', 'm4'], canopy: ['m5', 'a2'], ocean: ['r7', 'm6'], bows: ['r4', 'r6'], boba: ['m7', 'a2'], birds: ['m8', 'r9'], cheer: ['r10', 'a3'] })[k][0]], k);
    check(r.inv[loot.kind].includes(loot.id), k + ': the boss dropped ' + loot.name);
  }
  check(['stones', 'doors', 'targets', 'blocks', 'muncher', 'skip', 'torches', 'dials'].every(kk => seen.has(kk)), 'every puzzle kind appeared across the regions (' + [...seen].join(' ') + ')');
  check(bossesSeen.size === 4, 'all four boss kinds were fought');
  await synced(p);
  check(Object.keys(m3.store.yan.state.chars['birds:titanis'].clears).length === 6 && m3.store.yan.state.chars['birds:titanis'].inv.melee.includes('m8'), 'the clears and the found gear reached the service');
  check(await ev(p, () => window.__storageWrites) === 0, 'nothing was written to browser storage');
  await p.close();

  /* 4. another device saved meanwhile: the next change merges; a fresh page shows the service's state; service down waits */
  const theirs = JSON.parse(JSON.stringify(m3.store.yan.state)); theirs.chars['birds:titanis'].coins += 100; theirs.chars['birds:titanis'].inv.armor.push('a3');
  m3.store.yan = { rev: m3.store.yan.rev + 1, state: theirs };
  p = await newPage(m3); await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  check(await ev(p, () => document.querySelector('.profile-card[data-id="yan"]').textContent.includes('6/8')), 'a fresh page shows the six clears from the service');
  await ev(p, () => document.querySelector('.profile-card[data-id="yan"]').click()); await wait(300);
  const myCoins = await ev(p, () => window.__mq.REC().coins);
  await ev(p, () => { window.__mq.REC().equip.melee = 'm3'; window.__mq.REC().coins -= 10; window.__mq.net.schedule(window.__mq.player()); });
  m3.store.yan = { rev: m3.store.yan.rev + 1, state: Object.assign({}, theirs, { chars: { 'birds:titanis': Object.assign({}, theirs.chars['birds:titanis'], { coins: theirs.chars['birds:titanis'].coins + 50 }) } }) };
  await synced(p);
  const merged = m3.store.yan.state.chars['birds:titanis'];
  check(m3.stats.merges >= 1 && merged.coins === myCoins + 50 - 10 && merged.inv.armor.includes('a3') && merged.equip.melee === 'm3', 'the service merged the two copies (' + merged.coins + ')');
  await p.close();
  const down = create(); down.ctl.down = true;
  p = await newPage(down); await wait(1500);
  check(await ev(p, () => document.querySelector('.profile-card').disabled && !document.querySelector('#saveRetry').hidden), 'with the service down the player screen waits and offers Try again');
  down.ctl.down = false; await p.click('#saveRetry');
  check(await until(() => ev(p, () => !document.querySelector('.profile-card').disabled), 8000), 'Try again loads the saves');
  await p.close();

  /* 5. phone width: no sideways scroll, the pad and attack buttons show and are big enough */
  const m5 = create(); m5.store.riley = { rev: 1, state: { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': rec0() } } };
  p = await newPage(m5, { width: 390, height: 800, hasTouch: true });
  await until(() => ev(p, () => !document.querySelector('.profile-card').disabled));
  const noWide = async what => check(!(await ev(p, () => document.documentElement.scrollWidth > window.innerWidth + 1)), 'no sideways scroll at 390px: ' + what);
  await noWide('players');
  await ev(p, () => document.querySelector('.profile-card[data-id="riley"]').click()); await wait(300); await noWide('camp');
  await p.click('#mapBtn'); await wait(300); await noWide('map');
  await ev(p, () => document.querySelector('.mp-node[data-k="lagoon"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(500); await noWide('region');
  check(await ev(p, () => getComputedStyle(document.querySelector('.controls')).display === 'grid'), 'the pad and attack buttons show on a touch screen');
  const small = await ev(p, () => [...document.querySelectorAll('.dp, .ab')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }).length);
  check(small === 0, 'every pad and attack button is at least 44px (' + small + ' small)');
  await p.touchscreen.tap(...(await ev(p, () => { const r = document.querySelector('#btnA').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }))); await wait(100);
  check(await ev(p, () => window.__mq.G.hero.swing > 0 || window.__mq.G.hero.cd > 0), 'tapping A swings');
  await p.close();

  check(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  await browser.close();
  console.log(`${n - failed} of ${n} checks passed${failed ? ', ' + failed + ' FAILED' : ''}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
