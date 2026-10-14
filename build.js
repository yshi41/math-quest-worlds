/* Builds the game from src/ plus the Spelling Worlds palettes, scenes, characters and outfit pieces.
   The Spelling Worlds code is read from that repo's last commit (git show HEAD:index.html) by named
   anchors, never by line number, because that working copy may be mid-edit.
   Output: index.html for GitHub Pages (saves go to the Worker). */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname, SW = path.join(D, '..', 'spelling-worlds');
const WORKER = 'https://math-quest-saves.yshi41.workers.dev';
const BUILD = fs.readFileSync(path.join(D, 'src', 'screens.js'), 'utf8').match(/const BUILD='([^']+)'/)[1];
const src = cp.execSync('git show HEAD:index.html', { cwd: SW, maxBuffer: 1 << 26 }).toString();
const L = src.split(/\r?\n/);
const at = (re, from = 0) => { for (let i = from; i < L.length; i++) if (re.test(L[i])) return i; throw new Error('anchor not found: ' + re); };
const span = (a, b, inclEnd) => { const i = at(a), j = at(b, i + 1); return L.slice(i, inclEnd ? j + 1 : j).join('\n'); };
const css = '/* from Spelling Worlds: world palettes, ambient bubbles, scenes, character moods */\n' + span(/^:root\{/, /^\.axo-name\{/, true);
/* worlds, level lists and SLOTS; the scene drawings; the SVG helpers, face and character lists; every world's
   characters and outfit pieces; the shared accessories. The store, level and extraPieces (Tiny Buddy) logic stays behind. */
const parts = [[/^var RAINBOW=/, /^SLOTS\.feet=/, true], [/^function lagoonTop\(/, /^function buildScene\(/], [/^var axoCount=0/, /^function axoSVG\(/],
  [/^DRAW\.axolotl=/, /^var SHARED_ACC=/], [/^var SHARED_ACC=/, /^function extraPieces\(/], [/^function oceanPieces\(/, /^function bwBow\(/],
  [/^function bwBow\(/, /^function bbPearls\(/], [/^function bbPearls\(/, /^function birdSVG\(/], [/^function birdSVG\(/, /^function cheerPieces\(/], [/^function cheerPieces\(/, /^function burstHearts\(/]];
const js = '/* from Spelling Worlds: worlds, scenes, characters and outfit pieces */\nvar CUR_WORLD=\'lagoon\';function world(){return CUR_WORLD;}\n' + parts.map(p => { const s = span(p[0], p[1], p[2]); new Function(s); return s; }).join('\n');
const game = ['data', 'math', 'world', 'art', 'core', 'engine', 'overlays', 'screens'].map(n => fs.readFileSync(path.join(D, 'src', n + '.js'), 'utf8')).join('\n');
let body = fs.readFileSync(path.join(D, 'src', 'template.html'), 'utf8');
body = body.replace('/*@@SW_CSS@@*/', () => css).replace('/*@@SW_JS@@*/', () => js).replace('/*@@GAME_JS@@*/', () => game);
for (const m of body.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
if (/localStorage|sessionStorage|indexedDB/.test(body)) throw new Error('browser storage must never be used: progress lives only on the save service');
const title = (body.match(/<title>.*?<\/title>/) || [''])[0];
const pagesBody = body.replace(title + '\n', '');
const icon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2E5F6E"/><path d="M18 46 L40 18 L46 24 L24 52 Z" fill="#7CD4FF"/><path d="M14 40 L26 52" stroke="#F2C94C" stroke-width="6" stroke-linecap="round"/><circle cx="46" cy="18" r="5" fill="#FFE24A"/></svg>');
const pages = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + title + '\n<meta name="theme-color" content="#2E5F6E">\n<link rel="icon" href="' + icon + '">\n'
  + '<script>window.MQ_CLOUD=window.MQ_CLOUD||\'' + WORKER + '\';</script>\n'
  + '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#CFF0F1;color:#173A42}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n' + pagesBody + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(D, 'index.html'), pages);
console.log('index.html', pages.length, 'bytes, build', BUILD);
