/* Quick look at the v2 engine: node probe.js ../index.html [w h touch]  (screenshots in test/, console errors printed) */
const puppeteer = require('puppeteer-core');
const path = require('path');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const file = path.resolve(process.argv[2] || '../index.html');
const F = 'file:///' + file.split(path.sep).join('/');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-speech-api', '--disable-gpu'] });
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.setViewport({ width: +(process.argv[3] || 1000), height: +(process.argv[4] || 800), hasTouch: !!process.argv[5] });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  const mock = create(); await mock.attach(p);
  mock.store.riley = { rev: 1, state: { cur: 'lagoon:axolotl', chars: { 'lagoon:axolotl': { coins: 120, xp: 60, clears: {}, inv: { melee: ['m2', 'm3'], ranged: ['r3', 'r5'], armor: ['a1'] }, equip: { melee: 'm2', ranged: 'r3', armor: 'a1' }, hearts: 6, runs: 0, wins: 0, kills: 0, own: [], wear: [], pets: [], pet: null, petOwn: [], petWear: [], petTag: null } } } };
  await p.goto(F); await wait(800);
  const shot = n => p.screenshot({ path: 'probe-' + n + '.png' });
  await shot('menu');
  await p.evaluate(() => document.querySelector('.profile-card[data-id="riley"]').click()); await wait(400); await shot('hub');
  await p.click('#mapBtn'); await wait(400); await shot('map');
  await p.evaluate(() => document.querySelector('.mp-node[data-k="lagoon"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(700); await shot('entrance');
  const kinds = await p.evaluate(() => window.__mq.G.region.kinds); console.log('puzzle kinds', kinds, 'boss', await p.evaluate(() => window.__mq.G.region.byTag.boss.bossType));
  await p.keyboard.down('ArrowLeft'); await wait(300); await p.keyboard.up('ArrowLeft'); await shot('face-left');
  await p.keyboard.down('ArrowUp'); await wait(2300); await p.keyboard.up('ArrowUp'); await wait(300); await shot('hall');
  console.log('room after walking up:', await p.evaluate(() => window.__mq.G.room.tag));
  await p.keyboard.press('z'); await wait(80); await shot('swing');
  await p.keyboard.press('x'); await wait(120); await shot('shot');
  for (const tag of ['pA', 'pB', 'pC', 'pD', 'pE', 'secret', 'arena', 'nest', 'bossgate', 'boss']) { await p.evaluate(t => window.__mq.Game.teleport(t, 7.5, 8.5), tag); await wait(250); await shot(tag + '-' + (await p.evaluate(t => window.__mq.G.region.byTag[t].kind || window.__mq.G.region.byTag[t].bossType || '', tag))); }
  await p.evaluate(() => window.__mq.Game.teleport('arena', 7.5, 8.5)); await wait(100);
  await p.evaluate(() => { const e = window.__mq.Game.enemies()[0]; window.__mq.Game.hitEnemy(e, 2, 'melee'); }); await wait(200); await shot('arena-hit');
  await p.keyboard.press('Escape'); await wait(300); await shot('pause');
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
