/* ---------- screens: players, camp, world map, outfitter, characters, region clear ---------- */
const BUILD='2026-10-14.1';
function heroHTML(id,mood,plain){const r=recView(id||player),k=charWorld(id||player),c=charIdOf(id||player);return heroSVG(k,c,plain?[]:r.wear,mood||'neutral',{gear:plain?'':gearSVG(r.gear),plain})}
function petHTML(r){return r.pet?petSVG(r.pet,r.petWear,r.petTag):''}

function renderMenu(){applyWorld('lagoon',3);const box=$('#kids');box.innerHTML='';
  KIDS.forEach(k=>{const r=recView(k.id),w=charWorld(k.id);
    const b=document.createElement('button');b.type='button';b.className='profile-card';b.disabled=!ready;b.style.background=WGRAD[k.theme];b.setAttribute('data-id',k.id);
    b.innerHTML=`${heroHTML(k.id,'neutral',true)}<span class="pc-name">${k.name}</span><span class="pc-world">${RNAME[k.theme]}</span><span class="pc-meta"><span>Lv ${levelOf(r.xp)}</span><span>${starSvg(true)} ${clearsOf(r)}/8</span></span>`;
    b.onclick=()=>{Snd.init();Snd.click();player=k.id;if(!P().cur)P().cur=curKey(k.id);openHub()};box.append(b)})}

function openHub(){show('hub');renderHub();const r=REC(),k=charWorld();
  const lines=[`Ready for a quest, ${kid(player).name}?`,`Exact finishes mean double loot!`,`The elder's riddle hides a key.`,`Count the legs before you pay the troll!`,`New gear makes bigger moves.`,`A pet with a Jingle Bell finds extra coins.`];
  const b=$('#hubLine');b.textContent=pickOne(lines);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function renderHub(){const r=REC(),k=charWorld(),c=charIdOf(),st=heroStats(r),lv=levelOf(r.xp),nx=xpNext(r.xp);applyWorld(k,1+clearsOf(r));
  $('#hubBrand').textContent=`${kid(player).name}'s Camp`;
  $('#statCoins').innerHTML=`${CUR_ICON[k]} ${r.coins}`;$('#statLv').innerHTML=`${starSvg(true)} ${clearsOf(r)}/8`;
  $('#hubHero').innerHTML=heroHTML(player,'happy');$('#hubPet').innerHTML=petHTML(r);$('#hubName').textContent=`${charName(k,c)}${r.pet?' & '+PET_BY_ID[r.pet].name:''}`;
  $('#lvTitle').textContent=`Level ${lv}`;
  if(nx){const prev=LV_XP[lv-1];$('#lvBar').style.width=clamp((r.xp-prev)/(nx-prev)*100,0,100)+'%';$('#lvNext').textContent=`${r.xp} XP · next level at ${nx}`}else{$('#lvBar').style.width='100%';$('#lvNext').textContent='Top level!'}
  $('#gearLine').innerHTML=[`<span class="gear-chip">${gearIcon(Object.assign({slot:'weapon'},st.weapon))} ${st.weapon.moves.join(' · ')}</span>`,`<span class="gear-chip">${heartSvg} ${st.maxHearts} hearts</span>`,st.block?`<span class="gear-chip">${gearIcon(GEAR_BY_ID[r.gear.shield])} blocks ${st.block}</span>`:'',r.gear.boots?`<span class="gear-chip">${gearIcon(GEAR_BY_ID[r.gear.boots])} ${GEAR_BY_ID[r.gear.boots].name}</span>`:'',st.tag?`<span class="gear-chip">${PET_BY_ID[st.tag].name}</span>`:''].join('');
  const next=nextRegion(r,player);$('#mapSub').textContent=next?`Next up: ${RNAME[next]} (tier ${tierOf(next,player)})`:'Every region is cleared!'}

/* ---------- world map ---------- */
const MAP_POS=[[120,120],[330,80],[540,130],[760,80],[880,250],[690,330],[470,290],[250,320]];
function openMap(){show('map');renderMap()}
function renderMap(){const r=REC(),k=charWorld(),order=orderFor(player),next=nextRegion(r,player);applyWorld(k,1+clearsOf(r));
  $('#mapCoins').innerHTML=`${CUR_ICON[k]} ${r.coins}`;$('#mapStars').innerHTML=`${starSvg(true)} ${clearsOf(r)}/8`;
  let s='<svg viewBox="0 0 1000 450" aria-label="World map">';
  s+='<defs><pattern id="mpWater" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 q10 -8 20 0 t20 0" stroke="#9FD3E6" stroke-width="3" fill="none"/></pattern></defs><rect width="1000" height="450" rx="18" fill="#BDE3F0"/><rect width="1000" height="450" rx="18" fill="url(#mpWater)" opacity=".7"/>';
  /* the path between regions in the kid's order */
  const pts=order.map(key=>MAP_POS[RING.indexOf(key)]);
  s+='<path d="'+pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+'" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8" stroke-dasharray="2 18"/>';
  order.forEach((key,i)=>{const [x,y]=MAP_POS[RING.indexOf(key)],tsx=TILESET[key],done=!!r.clears[key],open=unlocked(r,key,player),isNext=key===next;
    s+=`<g class="mp-node${open?'':' locked'}${isNext?' next':''}" data-k="${key}" transform="translate(${x} ${y})">`;
    s+=`<circle class="mp-ring" r="64"/><ellipse cx="4" cy="8" rx="60" ry="48" fill="rgba(0,0,0,.12)"/><ellipse rx="60" ry="48" fill="${open?tsx.ground:'#C9CFD3'}" stroke="${open?tsx.wall:'#8E979D'}" stroke-width="5"/>`;
    s+=`<ellipse cx="-18" cy="6" rx="14" ry="11" fill="${open?tsx.plant:'#A3ABB1'}"/><ellipse cx="14" cy="-4" rx="12" ry="9" fill="${open?tsx.plantDk:'#A3ABB1'}"/><circle cx="26" cy="16" r="7" fill="${open?tsx.bloom:'#B8BFC4'}"/>`;
    if(!open)s+='<g transform="translate(-14 -22)"><rect x="4" y="16" width="20" height="16" rx="4" fill="#5A636B"/><path d="M8 16 v-5 a6 6 0 0 1 12 0 v5" stroke="#5A636B" stroke-width="4" fill="none"/></g>';
    if(done)s+='<path transform="translate(-22 -40) scale(1.7)" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#EFBF3A" stroke="#fff" stroke-width="1.5"/>';
    s+=`<text class="mp-name" y="72" text-anchor="middle">${RNAME[key]}</text><text class="mp-sub" y="92" text-anchor="middle">${done?'Cleared · tier '+(i+1):open?'Tier '+(i+1):'Locked'}</text></g>`});
  s+='</svg>';$('#mapBox').innerHTML=s;
  $('#mapBox').querySelectorAll('.mp-node').forEach(n=>{n.addEventListener('click',()=>{const key=n.getAttribute('data-k');if(!unlocked(r,key,player)){Snd.wrong();toast('Clear the region before it to unlock this one.');return}Snd.click();Game.start(key)})});
  $('#mapHint').textContent=next?`Next: ${RNAME[next]}. Tap a region to enter it. Cleared regions can be played again for more coins.`:'Every region is cleared! Play any of them again for more coins.'}

/* ---------- outfitter ---------- */
let STORE_TAB='gear',STORE_TRY=null;
function openStore(){show('store');renderStore()}
function storeHero(){const r=REC(),k=charWorld(),c=charIdOf();let wear=r.wear.slice();if(STORE_TRY!=null&&STORE_TAB==='outfits'){const slots=slotsOfLv(STORE_TRY);wear=wear.filter(lv=>!slotsOfLv(lv).some(s=>slots.includes(s)));wear.push(STORE_TRY)}
  $('#storeHero').innerHTML=heroSVG(k,c,wear,'happy',{gear:gearSVG(r.gear)});$('#storePet').innerHTML=petHTML(r)}
function buy(price){const r=REC();if(r.coins<price){Snd.wrong();toast(`${price-r.coins} more ${curName(charWorld())} needed.`);return false}r.coins-=price;Snd.coin();FX.burst(innerWidth/2,innerHeight*.3,40);return true}
function card(o){const d=document.createElement('div');d.className='item'+(o.on?' on':'');d.innerHTML=`${o.art||''}<div class="item-name">${o.name}</div><div class="item-blurb">${o.blurb||''}</div>`;
  if(o.owned)d.insertAdjacentHTML('beforeend','<div class="own">Owned</div>');
  const b=document.createElement('button');b.type='button';b.className='btn btn-sm '+(o.cls||'');b.innerHTML=o.btn;b.disabled=!!o.disabled;b.onclick=()=>{Snd.init();o.onclick()};d.append(b);
  if(o.onTry)d.addEventListener('click',e=>{if(e.target!==b)o.onTry()});return d}
function group(title,note){const g=document.createElement('div');g.className='sgroup';g.innerHTML=`<h3>${title}${note?`<span class="note">${note}</span>`:''}</h3><div class="items"></div>`;return g}
function renderStore(){const r=REC(),k=charWorld(),cur=curName(k);applyWorld(k,1+clearsOf(r));$('#storeCoins').innerHTML=`${CUR_ICON[k]} ${r.coins}`;storeHero();
  document.querySelectorAll('#storeTabs .st-tab').forEach(t=>{const on=t.getAttribute('data-tab')===STORE_TAB;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on))});
  const grid=$('#storeGrid');grid.innerHTML='';
  if(STORE_TAB==='gear'){
    Object.keys(GEAR).forEach(slot=>{const g=group(GEAR_NAMES[slot],'one at a time'),box=g.querySelector('.items');
      GEAR[slot].forEach(it=>{const owned=it.price===0||r.own.includes(it.id),on=r.gear[slot]===it.id||(slot==='weapon'&&!r.gear.weapon&&it.id==='w0');
        box.append(card({art:gearIcon(Object.assign({slot},it)),name:it.name,blurb:it.blurb,owned:owned&&it.price>0,on,btn:on?'Equipped':owned?'Equip':`${CUR_ICON[k]} ${it.price}`,cls:on?'btn-ghost':owned?'btn-good':'',disabled:on,
          onclick:()=>{if(!owned){if(!buy(it.price))return;r.own.push(it.id);toast(`${it.name} is yours!`)}r.gear[slot]=it.id==='w0'?null:it.id;persist();renderStore()}}))});grid.append(g)})}
  else if(STORE_TAB==='outfits'){
    const groups={};const add=(name,item)=>{(groups[name]=groups[name]||[]).push(item)};
    const SLOT_NAMES={hat:'Hats',eyes:'Glasses',face:'Face',neck:'Necklaces',cape:'Capes',wings:'Wings',shoulders:'Shoulders',wand:'Wands',feet:'Shoes',aura:'Glow',halo:'Halo'};
    WORLDS[k].levels.slice(0,10).forEach((lv,i)=>{const slots=slotsOfLv(i+1);add(slots.length>1?'Sets':SLOT_NAMES[slots[0]]||'Looks',{lv:i+1,name:lv.o,price:OUTFIT_PRICES[i]})});
    SHARED_ACC.forEach(a=>add(SLOT_NAMES[a.slot]||'Looks',{lv:a.lv,name:a.name,price:a.price}));
    const order=['Sets','Hats','Glasses','Face','Necklaces','Capes','Wings','Shoulders','Wands','Shoes','Glow','Halo','Looks'];
    order.filter(n=>groups[n]).forEach(n=>{const g=group(n,n==='Sets'?'a set fills more than one spot':'pick one'),box=g.querySelector('.items');
      groups[n].forEach(it=>{const owned=r.own.includes('o'+it.lv),on=r.wear.includes(it.lv);
        box.append(card({name:it.name,blurb:owned?'':'tap to try it on',owned,on,btn:on?'Take off':owned?'Wear it':`${CUR_ICON[k]} ${it.price}`,cls:on?'btn-ghost':owned?'btn-good':'',
          onTry:()=>{STORE_TRY=it.lv;storeHero()},
          onclick:()=>{if(on){r.wear=r.wear.filter(x=>x!==it.lv)}else{if(!owned){if(!buy(it.price))return;r.own.push('o'+it.lv);toast(`${it.name} is yours!`)}const slots=slotsOfLv(it.lv);r.wear=r.wear.filter(lv=>!slotsOfLv(lv).some(s=>slots.includes(s)));r.wear.push(it.lv)}STORE_TRY=null;persist();renderStore()}}))});grid.append(g)})}
  else{
    let g=group('Pets','one comes along at a time'),box=g.querySelector('.items');
    PETS.forEach(p=>{const owned=r.pets.includes(p.id),on=r.pet===p.id;
      box.append(card({art:petSVG(p.id,on?r.petWear:[],on?r.petTag:null),name:p.name,blurb:p.blurb,owned,on,btn:on?'Stay home':owned?'Come along':`${CUR_ICON[k]} ${p.price}`,cls:on?'btn-ghost':owned?'btn-good':'',
        onclick:()=>{if(on){r.pet=null}else{if(!owned){if(!buy(p.price))return;r.pets.push(p.id);toast(`${p.name} joins you!`)}r.pet=p.id}persist();renderStore();renderHub()}}))});grid.append(g);
    const petId=r.pet||r.pets[0]||'pup';
    g=group('Pet accessories','one per spot, for looks');box=g.querySelector('.items');
    PET_COS.forEach(a=>{const owned=r.petOwn.includes(a.id),on=r.petWear.includes(a.id);
      box.append(card({art:petSVG(petId,[a.id]),name:a.name,blurb:'',owned,on,btn:on?'Take off':owned?'Wear it':`${CUR_ICON[k]} ${a.price}`,cls:on?'btn-ghost':owned?'btn-good':'',disabled:!r.pets.length,
        onclick:()=>{if(on)r.petWear=r.petWear.filter(x=>x!==a.id);else{if(!owned){if(!buy(a.price))return;r.petOwn.push(a.id)}r.petWear=r.petWear.filter(x=>PET_BY_ID[x].slot!==a.slot);r.petWear.push(a.id)}persist();renderStore()}}))});grid.append(g);
    g=group('Pet tags','one at a time, each one helps on the road');box=g.querySelector('.items');
    PET_TAGS.forEach(a=>{const owned=r.petOwn.includes(a.id),on=r.petTag===a.id;
      box.append(card({art:petSVG(petId,[],a.id),name:a.name,blurb:a.blurb,owned,on,btn:on?'Unclip':owned?'Clip on':`${CUR_ICON[k]} ${a.price}`,cls:on?'btn-ghost':owned?'btn-good':'',disabled:!r.pets.length,
        onclick:()=>{if(on)r.petTag=null;else{if(!owned){if(!buy(a.price))return;r.petOwn.push(a.id)}r.petTag=a.id}persist();renderStore()}}))});grid.append(g);
    if(!r.pets.length){const n=document.createElement('p');n.className='res-sub';n.textContent='Buy a pet first, then dress it up and clip on a tag.';grid.append(n)}}}
$('#storeTabs').addEventListener('click',e=>{const t=e.target.closest('.st-tab');if(!t)return;Snd.click();STORE_TAB=t.getAttribute('data-tab');STORE_TRY=null;renderStore()});

/* ---------- characters ---------- */
function openChars(){show('chars');renderChars()}
function renderChars(){const p=P(),grid=$('#charsGrid');grid.innerHTML='';const curK=curKey(player);
  RING.forEach(w=>{const g=group(RNAME[w],'characters');g.querySelector('h3').insertAdjacentHTML('afterbegin',`<span class="wband" style="background:${WGRAD[w]}">${CUR_ICON[w]}</span> `);const box=g.querySelector('.items');
    charListFor(w).forEach(c=>{const key=w+':'+c[0],rec=p.chars[key],on=key===curK,plain=!(rec&&(rec.wear.length||rec.gear.weapon||rec.gear.shield));
      box.append(card({art:heroSVG(w,c[0],rec?rec.wear:[],on?'happy':'neutral',{gear:rec?gearSVG(rec.gear):'',plain}),name:c[1],blurb:rec?`Level ${levelOf(rec.xp)} · ${clearsOf(rec)}/8 cleared`:'New hero, starts fresh',on,btn:on?'Playing':'Play as',cls:on?'btn-ghost':'btn-good',disabled:on,
        onclick:()=>{p.cur=key;if(!p.chars[key])p.chars[key]=blankRec();persist();Snd.glow();renderChars();toast(`${c[1]} is your hero now!`)}}))});grid.append(g)})}

/* ---------- region clear ---------- */
function openClear(s){const r=REC(),k=charWorld();show('clear');applyWorld(k,1+clearsOf(r));
  $('#clearHero').innerHTML=heroHTML(player,'happy');$('#clearPet').innerHTML=petHTML(r);
  const G=LAST_RUN;$('#clearTitle').textContent=`${G.name} cleared!`;$('#clearSub').textContent=`${clearsOf(r)} of 8 regions cleared · Level ${levelOf(r.xp)}`;
  $('#cCoins').textContent=G.coins;$('#cCoinsL').textContent=cap(curName(k));$('#cXp').textContent=G.xp;$('#cBattles').textContent=G.battles;$('#cPerfect').textContent=G.perfect;
  const next=nextRegion(r,player);$('#clearNote').textContent=next?`${RNAME[next]} is open on the map now.`:'You have cleared every region. Legend!'}
let LAST_RUN={name:'',coins:0,xp:0,battles:0,perfect:0};

/* ---------- buttons and boot ---------- */
$('#switchBtn').onclick=()=>{Snd.click();show('menu');renderMenu()};
$('#mapBtn').onclick=()=>{Snd.init();Snd.click();openMap()};
$('#storeBtn').onclick=()=>{Snd.init();Snd.click();STORE_TRY=null;openStore()};
$('#charsBtn').onclick=()=>{Snd.init();Snd.click();openChars()};
$('#mapBack').onclick=$('#storeBack').onclick=$('#charsBack').onclick=()=>{Snd.click();openHub()};
$('#clearMap').onclick=()=>{Snd.click();openMap()};$('#clearStore').onclick=()=>{Snd.click();STORE_TRY=null;openStore()};
function tog(id,get,set){const b=$(id);b.onclick=()=>{Snd.init();set(!get());b.setAttribute('aria-pressed',String(get()));Snd.click()}}
tog('#tSound',()=>Snd.on,v=>Snd.on=v);tog('#tMusic',()=>Snd.musicOn,v=>Snd.musicOn=v);
$('#saveRetry').onclick=()=>{Snd.init();Snd.click();saveMode='loading';renderSaveNote();Net.retry()};
window.__mq={get G(){return Game.G},saves,net:Net,Game,Battle,Ov,MQMath,MQWorld,REC,P:()=>P(),player:()=>player,heroStats,setPlayer(id){player=id;if(!P().cur)P().cur=curKey(id)},openHub,openMap,openStore,renderStore,renderChars,BUILD,get lastRun(){return LAST_RUN}};
renderMenu();
if(CLOUD)Net.refresh();else setReady('off');
/* phones and home-screen apps can run a stale copy: fetch the live page and reload when the build changed */
if(location.protocol.startsWith('http'))setTimeout(()=>{fetch(location.pathname,{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=t.match(/const BUILD='([^']+)'/);if(m&&m[1]!==BUILD&&!location.search.includes('v='+m[1]))location.replace(location.pathname+'?v='+m[1])}).catch(()=>{})},1500);
