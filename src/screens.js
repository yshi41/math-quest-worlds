/* ---------- screens: players, camp (with the backpack), world map, characters, region clear ---------- */
const BUILD='2026-10-14.3';
let LAST_RUN={name:'',coins:0,xp:0,kills:0,solved:0,found:[]};
function heroHTML(id,mood){const k=charWorld(id||player),c=charIdOf(id||player);return heroSVG(k,c,mood||'neutral')}

function renderMenu(){applyWorld('lagoon',3);const box=$('#kids');box.innerHTML='';
  KIDS.forEach(k=>{const r=recView(k.id);
    const b=document.createElement('button');b.type='button';b.className='profile-card';b.disabled=!ready;b.style.background=WGRAD[k.theme];b.setAttribute('data-id',k.id);
    b.innerHTML=`${heroHTML(k.id)}<span class="pc-name">${k.name}</span><span class="pc-world">${RNAME[k.theme]}</span><span class="pc-meta"><span>Lv ${levelOf(r.xp)}</span><span>${starSvg(true)} ${clearsOf(r)}/8</span></span>`;
    b.onclick=()=>{Snd.init();Snd.click();player=k.id;if(!P().cur)P().cur=curKey(k.id);openHub()};box.append(b)})}

function openHub(){show('hub');renderHub();
  const lines=[`Ready for a quest, ${kid(player).name}?`,`Number Slimes pop on exactly 0.`,`A beetle only fears a weapon that divides it.`,`Read every sign: the rule is on it.`,`Bosses drop special weapons.`,`Wrong tiles wake the Troggles!`];
  const b=$('#hubLine');b.textContent=pickOne(lines);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function renderHub(){const r=REC(),k=charWorld(),c=charIdOf(),st=heroStats(r,k,c),lv=levelOf(r.xp),nx=xpNext(r.xp);applyWorld(k,1+clearsOf(r));
  $('#hubBrand').textContent=`${kid(player).name}'s Camp`;
  $('#statCoins').innerHTML=`${CUR_ICON[k]} ${r.coins}`;$('#statLv').innerHTML=`${starSvg(true)} ${clearsOf(r)}/8`;
  $('#hubHero').innerHTML=heroHTML(player,'happy');$('#hubName').textContent=charName(k,c);
  $('#lvTitle').textContent=`Level ${lv}`;
  if(nx){const prev=LV_XP[lv-1];$('#lvBar').style.width=clamp((r.xp-prev)/(nx-prev)*100,0,100)+'%';$('#lvNext').textContent=`${r.xp} XP · next level at ${nx}`}else{$('#lvBar').style.width='100%';$('#lvNext').textContent='Top level!'}
  $('#gearLine').innerHTML=[`<span class="gear-chip">${swordSvg} ${st.theme.melee} · ${st.M}</span>`,`<span class="gear-chip">${bowSvg} ${st.theme.ranged} · ${st.R}</span>`,`<span class="gear-chip">${heartSvg} ${st.maxHearts} hearts</span>`,st.block?`<span class="gear-chip">${shieldSvg} blocks ${st.block}</span>`:''].join('');
  const next=nextRegion(r,player);$('#mapSub').textContent=next?`Next up: ${RNAME[next]} (tier ${tierOf(next,player)})`:'Every region is cleared!';
  renderPack()}
/* the backpack: every weapon and armour piece found, with the number each one carries */
function renderPack(){const r=REC(),box=$('#pack');box.innerHTML='';
  const sec=(title,kind,note)=>{const g=document.createElement('div');g.className='sgroup';g.innerHTML=`<h3>${title}<span class="note">${note}</span></h3><div class="items"></div>`;const items=g.querySelector('.items');
    const list=r.inv[kind].slice().sort((a,b)=>(ITEM_BY_ID[a].v||ITEM_BY_ID[a].block)-(ITEM_BY_ID[b].v||ITEM_BY_ID[b].block));
    if(!list.length){items.innerHTML='<p class="res-sub">Nothing yet. Bosses and secret rooms drop these.</p>'}
    list.forEach(id=>{const it=ITEM_BY_ID[id],on=r.equip[kind]===id;const d=document.createElement('div');d.className='item'+(on?' on':'');
      d.innerHTML=`${itemIcon(it)}<div class="item-name">${it.name}</div><div class="item-blurb">${kind==='armor'?'blocks '+it.block+' per hit':'the number '+it.v}</div>`;
      const b=document.createElement('button');b.type='button';b.className='btn btn-sm '+(on?'btn-ghost':'btn-good');b.textContent=on?'Equipped':'Equip';b.disabled=on;
      b.onclick=()=>{Snd.init();Snd.tick();r.equip[kind]=id;persist();renderHub()};d.append(b);items.append(d)});
    if(kind==='armor'&&r.equip.armor){const b=document.createElement('button');b.type='button';b.className='btn btn-sm btn-ghost';b.textContent='Take armour off';b.style.marginTop='8px';b.onclick=()=>{r.equip.armor=null;persist();renderHub()};g.append(b)}
    box.append(g)};
  sec('Melee weapons','melee','hit for this number');sec('Ranged weapons','ranged','shoot this number');sec('Armour','armor','blocks damage');
  const lost=[];for(const k of RING)if(r.clears[k])lost.push(k);
  $('#packNote').textContent=`Weapon numbers matter: Number Slimes pop on exactly 0, Factor Beetles only take divisors. You own the numbers ${heroStats(r,charWorld(),charIdOf()).divs.join(', ')}.`}

/* ---------- world map ---------- */
const MAP_POS=[[120,120],[330,80],[540,130],[760,80],[880,250],[690,330],[470,290],[250,320]];
function openMap(){show('map');renderMap()}
function renderMap(){const r=REC(),k=charWorld(),order=orderFor(player),next=nextRegion(r,player);applyWorld(k,1+clearsOf(r));
  $('#mapCoins').innerHTML=`${CUR_ICON[k]} ${r.coins}`;$('#mapStars').innerHTML=`${starSvg(true)} ${clearsOf(r)}/8`;
  let s='<svg viewBox="0 0 1000 450" aria-label="World map">';
  s+='<defs><pattern id="mpWater" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 q10 -8 20 0 t20 0" stroke="#9FD3E6" stroke-width="3" fill="none"/></pattern></defs><rect width="1000" height="450" rx="18" fill="#BDE3F0"/><rect width="1000" height="450" rx="18" fill="url(#mpWater)" opacity=".7"/>';
  const pts=order.map(key=>MAP_POS[RING.indexOf(key)]);
  s+='<path d="'+pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+'" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8" stroke-dasharray="2 18"/>';
  order.forEach((key,i)=>{const [x,y]=MAP_POS[RING.indexOf(key)],done=!!r.clears[key],open=unlocked(r,key,player),isNext=key===next;const boss=['Shield Boss','Factor Boss','Minion Boss','Pattern Boss'][i%4];
    s+=`<g class="mp-node${open?'':' locked'}${isNext?' next':''}" data-k="${key}" transform="translate(${x} ${y})">`;
    s+=`<circle class="mp-ring" r="64"/><ellipse cx="4" cy="8" rx="60" ry="48" fill="rgba(0,0,0,.12)"/><ellipse rx="60" ry="48" fill="${open?TILES1.ground:'#C9CFD3'}" stroke="${open?TILES1.wall:'#8E979D'}" stroke-width="5"/>`;
    s+=`<ellipse cx="-18" cy="6" rx="14" ry="11" fill="${open?TILES1.plant:'#A3ABB1'}"/><ellipse cx="14" cy="-4" rx="12" ry="9" fill="${open?TILES1.plantDk:'#A3ABB1'}"/><circle cx="26" cy="16" r="7" fill="${open?TILES1.bloom:'#B8BFC4'}"/>`;
    if(!open)s+='<g transform="translate(-14 -22)"><rect x="4" y="16" width="20" height="16" rx="4" fill="#5A636B"/><path d="M8 16 v-5 a6 6 0 0 1 12 0 v5" stroke="#5A636B" stroke-width="4" fill="none"/></g>';
    if(done)s+='<path transform="translate(-22 -40) scale(1.7)" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#EFBF3A" stroke="#fff" stroke-width="1.5"/>';
    s+=`<text class="mp-name" y="72" text-anchor="middle">${RNAME[key]}</text><text class="mp-sub" y="92" text-anchor="middle">${done?'Cleared · tier '+(i+1):open?'Tier '+(i+1)+' · '+boss:'Locked'}</text></g>`});
  s+='</svg>';$('#mapBox').innerHTML=s;
  $('#mapBox').querySelectorAll('.mp-node').forEach(n=>{n.addEventListener('click',()=>{const key=n.getAttribute('data-k');if(!unlocked(r,key,player)){Snd.wrong();toast('Clear the region before it to unlock this one.');return}Snd.click();Game.start(key)})});
  $('#mapHint').textContent=next?`Next: ${RNAME[next]}. Tap a region to enter it. Cleared regions can be played again for more loot.`:'Every region is cleared! Play any of them again for more loot.'}

/* ---------- characters ---------- */
function openChars(){show('chars');renderChars()}
function renderChars(){const p=P(),grid=$('#charsGrid');grid.innerHTML='';const curK=curKey(player);
  RING.forEach(w=>{const g=document.createElement('div');g.className='sgroup';g.innerHTML=`<h3><span class="wband" style="background:${WGRAD[w]}">${CUR_ICON[w]}</span> ${RNAME[w]}<span class="note">characters</span></h3><div class="items"></div>`;const box=g.querySelector('.items');
    charListFor(w).forEach(c=>{const key=w+':'+c[0],rec=p.chars[key],on=key===curK,th=themeOf(w,c[0]);const d=document.createElement('div');d.className='item'+(on?' on':'');
      d.innerHTML=`${heroSVG(w,c[0],on?'happy':'neutral')}<div class="item-name">${c[1]}</div><div class="item-blurb">${th.melee} · ${th.ranged}<br>${rec?`Level ${levelOf(rec.xp)} · ${clearsOf(rec)}/8 cleared`:'New hero, starts fresh'}</div>`;
      const b=document.createElement('button');b.type='button';b.className='btn btn-sm '+(on?'btn-ghost':'btn-good');b.textContent=on?'Playing':'Play as';b.disabled=on;
      b.onclick=()=>{Snd.init();p.cur=key;if(!p.chars[key])p.chars[key]=blankRec();persist();Snd.glow();renderChars();toast(`${c[1]} is your hero now!`)};d.append(b);box.append(d)});grid.append(g)})}

/* ---------- region clear ---------- */
function openClear(){const r=REC(),k=charWorld();show('clear');applyWorld(k,1+clearsOf(r));
  $('#clearHero').innerHTML=heroHTML(player,'happy');
  const G=LAST_RUN;$('#clearTitle').textContent=`${G.name} cleared!`;$('#clearSub').textContent=`${clearsOf(r)} of 8 regions cleared · Level ${levelOf(r.xp)}`;
  $('#cCoins').textContent=G.coins;$('#cCoinsL').textContent=cap(curName(k));$('#cXp').textContent=G.xp;$('#cKills').textContent=G.kills;$('#cSolved').textContent=G.solved;
  const next=nextRegion(r,player);const found=G.found.map(id=>ITEM_BY_ID[id]).filter(Boolean).map(it=>it.name);
  $('#clearNote').textContent=(found.length?'Found: '+found.join(', ')+'. ':'')+(next?`${RNAME[next]} is open on the map now.`:'You have cleared every region. Legend!')}

/* ---------- buttons and boot ---------- */
$('#switchBtn').onclick=()=>{Snd.click();show('menu');renderMenu()};
$('#mapBtn').onclick=()=>{Snd.init();Snd.click();openMap()};
$('#charsBtn').onclick=()=>{Snd.init();Snd.click();openChars()};
$('#mapBack').onclick=$('#charsBack').onclick=()=>{Snd.click();openHub()};
$('#clearMap').onclick=()=>{Snd.click();openMap()};$('#clearHub').onclick=()=>{Snd.click();openHub()};
function tog(id,get,set){const b=$(id);b.onclick=()=>{Snd.init();set(!get());b.setAttribute('aria-pressed',String(get()));Snd.click()}}
tog('#tSound',()=>Snd.on,v=>Snd.on=v);tog('#tMusic',()=>Snd.musicOn,v=>Snd.musicOn=v);
$('#saveRetry').onclick=()=>{Snd.init();Snd.click();saveMode='loading';renderSaveNote();Net.retry()};
window.__mq={get G(){return Game.G},saves,net:Net,Game,Ov,MQMath,MQWorld,REC,P:()=>P(),player:()=>player,heroStats,ITEM_BY_ID,setPlayer(id){player=id;if(!P().cur)P().cur=curKey(id)},openHub,openMap,renderChars,BUILD,get lastRun(){return LAST_RUN}};
renderMenu();
if(CLOUD)Net.refresh();else setReady('off');
/* phones and home-screen apps can run a stale copy: fetch the live page and reload when the build changed */
if(location.protocol.startsWith('http'))setTimeout(()=>{fetch(location.pathname,{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=t.match(/const BUILD='([^']+)'/);if(m&&m[1]!==BUILD&&!location.search.includes('v='+m[1]))location.replace(location.pathname+'?v='+m[1])}).catch(()=>{})},1500);
