/* ---------- core: helpers, sound, saves (online only), worlds and character stats ---------- */
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const ri=n=>Math.floor(Math.random()*n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pickOne=a=>a[ri(a.length)];
const DPR=()=>Math.min(2,window.devicePixelRatio||1);
const TAU=Math.PI*2;
const BUILD_AT=Date.now();
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const curName=k=>WORLDS[k].cur;
const starSvg=on=>`<svg viewBox="0 0 24 24" class="st${on?' on':''}" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`;
const heartSvg='<svg viewBox="0 0 24 22" class="heart" aria-hidden="true"><path d="M12 21s-9-5.6-9-12.2C3 5.4 5.5 3 8.4 3c1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2C18.5 3 21 5.4 21 8.8 21 15.4 12 21 12 21z" fill="#FF5C8A" stroke="#fff" stroke-width="1.5"/></svg>';
const keySvg='<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="#E0A000" stroke-width="2.6"/><path d="M10 10l7 7M14 14l2-2M16.5 16.5l2-2" stroke="#E0A000" stroke-width="2.6" stroke-linecap="round"/></svg>';

/* ---------- sound ---------- */
const Snd={ctx:null,on:true,musicOn:true,timer:null,mode:'calm',bpm:108,
  init(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.out=this.ctx.createGain();this.out.gain.value=.55;const comp=this.ctx.createDynamicsCompressor();this.out.connect(comp);comp.connect(this.ctx.destination);this.mus=this.ctx.createGain();this.mus.gain.value=.14;this.mus.connect(this.out)}if(this.ctx.state==='suspended')this.ctx.resume()}catch(e){}},
  f(m){return 440*Math.pow(2,(m-69)/12)},
  tone(freq,dur,o={}){const c=this.ctx;if(!c)return;const dest=o.dest||this.out;if(dest===this.out&&!this.on)return;
    const when=o.when!=null?o.when:c.currentTime+(o.delay||0);const osc=c.createOscillator(),g=c.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(freq,when);
    if(o.slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,o.slide),when+dur);
    const v=o.vol!=null?o.vol:.25;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(v,when+(o.attack||.008));g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    osc.connect(g);if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;g.connect(fl);fl.connect(dest)}else g.connect(dest);
    osc.start(when);osc.stop(when+dur+.05)},
  noise(dur,o={}){const c=this.ctx;if(!c||!this.on)return;const n=Math.floor(c.sampleRate*dur);const b=c.createBuffer(1,n,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp||2000;const g=c.createGain();g.gain.value=o.vol||.2;s.connect(fl);fl.connect(g);g.connect(this.out);s.start(c.currentTime+(o.delay||0))},
  click(){this.tone(660,.06,{type:'triangle',vol:.1})},
  swish(){this.noise(.12,{vol:.1,lp:1800});this.tone(400,.1,{type:'triangle',vol:.05,slide:700})},
  pop(combo){this.noise(.07,{vol:.25,lp:4500});const sc=[0,2,4,7,9,12,14,16,19,21,24];const r=67+sc[Math.min(Math.max(combo||1,1)-1,10)];[0,4,7,12].forEach((d,i)=>this.tone(this.f(r+d),.17,{type:'triangle',vol:.18,delay:i*.055}))},
  wrong(){this.tone(196,.34,{type:'sawtooth',vol:.14,slide:98,lp:900});this.tone(207,.34,{type:'square',vol:.06,slide:104,lp:700});this.noise(.14,{vol:.12,lp:600})},
  tick(){this.tone(1200,.03,{type:'square',vol:.04,lp:3000})},
  glow(){[72,76,79,84,88,91,96].forEach((m,i)=>this.tone(this.f(m),.14,{type:'triangle',vol:.15,delay:i*.05}))},
  bossHit(){this.noise(.4,{vol:.4,lp:800});this.tone(130,.45,{vol:.4,slide:45})},
  hit(){this.noise(.18,{vol:.3,lp:1200});this.tone(220,.2,{vol:.25,slide:90})},
  special(){for(let i=0;i<6;i++)this.tone(300+i*120,.12,{vol:.12,slide:1600,delay:i*.09});this.noise(.6,{vol:.3,lp:1500,delay:.5})},
  thunder(){this.noise(.9,{vol:.5,lp:400});this.tone(90,.8,{type:'sawtooth',vol:.14,slide:35,lp:500});this.tone(1800,.08,{type:'square',vol:.06,lp:4000})},
  splash(){this.noise(.5,{vol:.35,lp:900});this.tone(500,.3,{type:'sine',vol:.1,slide:120})},
  unlock(){[79,84,88,91].forEach((m,i)=>this.tone(this.f(m),.22,{type:'triangle',vol:.18,delay:i*.09}))},
  win(){[[72,0,.14],[76,.12,.14],[79,.24,.14],[84,.36,.3],[79,.62,.12],[84,.74,.7]].forEach(([m,d,l])=>{this.tone(this.f(m),l,{type:'triangle',vol:.2,delay:d});this.tone(this.f(m-12),l,{vol:.1,delay:d})})},
  lose(){[[67,0,.3],[66,.32,.3],[65,.64,.3],[64,.96,.9]].forEach(([m,d,l])=>this.tone(this.f(m),l,{type:'triangle',vol:.18,delay:d}))},
  coin(){this.tone(988,.09,{type:'square',vol:.07});this.tone(1319,.32,{type:'square',vol:.07,delay:.08})},
  key(){[84,88,91,96].forEach((m,i)=>this.tone(this.f(m),.3,{type:'sine',vol:.16,delay:i*.07}))},
  startMusic(mode){this.mode=mode;this.bpm=mode==='boss'?126:104;if(!this.ctx||this.timer)return;this.step=0;this.next=this.ctx.currentTime+.08;this.timer=setInterval(()=>this.sched(),60)},
  stopMusic(){clearInterval(this.timer);this.timer=null},
  sched(){const c=this.ctx;if(!c)return;while(this.next<c.currentTime+.25){this.play(this.step,this.next);this.next+=60/this.bpm/2;this.step++}},
  play(i,t){if(!this.musicOn)return;const boss=this.mode==='boss';
    const prog=boss?[[57,60,64],[53,57,60],[55,59,62],[56,59,64]]:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
    const ch=prog[Math.floor(i/8)%4],s=i%8;
    if(s===0||s===4||(boss&&s%2===0))this.tone(this.f(ch[0]-24),.32,{type:'triangle',vol:.5,when:t,dest:this.mus});
    const pat=[0,1,2,1,2,1,0,2];this.tone(this.f(ch[pat[s]]+12),.16,{type:boss?'square':'sine',vol:boss?.1:.2,when:t,dest:this.mus,lp:boss?1600:0});
    if(!boss&&s===6&&Math.random()<.5)this.tone(this.f(ch[2]+24),.3,{vol:.12,when:t,dest:this.mus})}
};

/* ---------- worlds on the page ---------- */
let DISP='Fredoka';
function buildScene(){const k=world();let seed={lagoon:7,candy:11,canopy:5,ocean:13,bows:17,boba:19,birds:23,cheer:29}[k]||7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
  const tops={lagoon:lagoonTop,candy:candyTop,canopy:canopyTop,ocean:oceanTop,bows:bowsTop,boba:bobaTop,birds:birdsTop,cheer:cheerTop},bots={lagoon:lagoonBottom,candy:candyBottom,canopy:canopyBottom,ocean:oceanBottom,bows:bowsBottom,boba:bobaBottom,birds:birdsBottom,cheer:cheerBottom};
  return '<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">'+tops[k](rnd)+bots[k](rnd)+extraScene(rnd)+'</svg><div class="flash"></div>'}
function setSceneLevel(root,lv){root.querySelectorAll('[data-lv]').forEach(e=>e.classList.toggle('on',+e.getAttribute('data-lv')<=lv))}
function ambient(){const b=$('#bubbles');b.innerHTML='';for(let i=0;i<14;i++){const s=document.createElement('span');const z=8+Math.random()*22;
  s.style.cssText=`left:${(Math.random()*100).toFixed(1)}%;width:${z.toFixed(0)}px;height:${z.toFixed(0)}px;animation-duration:${(10+Math.random()*12).toFixed(1)}s;animation-delay:-${(Math.random()*20).toFixed(1)}s;--c:${RAINBOW[i%6]}`;b.append(s)}}
let shownWorld=null;
function applyWorld(k,lv){CUR_WORLD=k;document.documentElement.setAttribute('data-world',k);
  if(shownWorld!==k){shownWorld=k;$('#pageScene').innerHTML=buildScene();ambient()}
  setSceneLevel($('#pageScene'),lv||1);
  DISP=(getComputedStyle(document.documentElement).getPropertyValue('--display')||'Fredoka').trim()||'Fredoka'}
function cssVar(name,fallback){const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();return v||fallback}
function charName(k,id){const L=charListFor(k);for(const c of L)if(c[0]===id)return c[1];return L[0][1]}
function charId(){return CUR_CHAR}
let CUR_CHAR='axolotl';
/* outfit slots: which levels share a slot (SLOTS comes from Spelling Worlds) */
function slotsOfLv(lv){const o=[];Object.keys(SLOTS).forEach(s=>{if(SLOTS[s].indexOf(lv)>=0)o.push(s)});return o}

/* ---------- saves (online only) ---------- */
let screen='menu';
let ready=false,saveMode='loading';
const saves={};let player=null;
function blankRec(){return {coins:0,xp:0,clears:{},own:[],wear:[],gear:{weapon:null,shield:null,charm:null,boots:null},pets:[],pet:null,petOwn:[],petWear:[],petTag:null,runs:0,wins:0}}
function blank(){return {cur:null,chars:{}}}
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
function normRec(r){const b=Object.assign(blankRec(),isObj(r)?r:{});b.coins=Math.max(0,b.coins|0);b.xp=Math.max(0,b.xp|0);b.runs=b.runs|0;b.wins=b.wins|0;
  b.clears=isObj(b.clears)?b.clears:{};b.own=Array.isArray(b.own)?b.own.filter(x=>typeof x==='string'):[];b.wear=Array.isArray(b.wear)?b.wear.map(Number).filter(x=>x>0):[];
  b.gear=Object.assign({weapon:null,shield:null,charm:null,boots:null},isObj(b.gear)?b.gear:{});for(const s in b.gear){if(b.gear[s]&&(!GEAR_BY_ID[b.gear[s]]||GEAR_BY_ID[b.gear[s]].slot!==s))b.gear[s]=null}
  b.pets=Array.isArray(b.pets)?b.pets.filter(x=>PET_BY_ID[x]):[];b.pet=b.pet&&b.pets.includes(b.pet)?b.pet:null;b.petOwn=Array.isArray(b.petOwn)?b.petOwn.filter(x=>PET_BY_ID[x]):[];
  b.petWear=Array.isArray(b.petWear)?b.petWear.filter(x=>b.petOwn.includes(x)):[];b.petTag=b.petTag&&b.petOwn.includes(b.petTag)?b.petTag:null;return b}
function normalize(d){const o=isObj(d)?d:{};const b=blank();b.cur=typeof o.cur==='string'&&validChar(o.cur)?o.cur:null;b.chars={};if(isObj(o.chars))for(const k in o.chars)if(validChar(k))b.chars[k]=normRec(o.chars[k]);return b}
function validChar(key){const [w,c]=String(key).split(':');return !!(WORLDS[w]&&charListFor(w).some(x=>x[0]===c))}
function P(){return saves[player]||(saves[player]=blank())}
function kid(id){return KIDS.find(k=>k.id===id)||KIDS[0]}
function curKey(id){const p=saves[id],k=kid(id);return p&&p.cur?p.cur:k.theme+':'+charListFor(k.theme)[0][0]}
function REC(id){id=id||player;const p=saves[id]||(saves[id]=blank());const key=curKey(id);return p.chars[key]||(p.chars[key]=blankRec())}
function charWorld(id){return curKey(id||player).split(':')[0]}
function charIdOf(id){return curKey(id||player).split(':')[1]}
function recView(id){const p=saves[id];const key=curKey(id);return (p&&p.chars[key])||blankRec()}
function levelOf(xp){let l=0;for(const t of LV_XP)if(xp>=t)l++;return Math.max(1,l)}
function xpNext(xp){const l=levelOf(xp);return l<LV_XP.length?LV_XP[l]:null}
function clearsOf(r){return Object.keys(r.clears||{}).filter(k=>r.clears[k]).length}
/* the hero's numbers from the gear it wears */
function heroStats(r){const w=r.gear.weapon&&GEAR_BY_ID[r.gear.weapon]||WEAPONS[0],sh=r.gear.shield&&GEAR_BY_ID[r.gear.shield],ch=r.gear.charm&&GEAR_BY_ID[r.gear.charm],bt=r.gear.boots&&GEAR_BY_ID[r.gear.boots];
  const tag=r.pet&&r.petTag?r.petTag:null;
  return {moves:w.moves,weapon:w,block:sh?sh.block:0,maxHearts:5+(ch?ch.hearts:0),revive:!!(ch&&ch.revive),miss:(bt&&bt.miss?1:0)+(tag==='t4'?1:0),dodge:!!(bt&&bt.dodge),tag,bell:tag==='t1',nose:tag==='t2',snack:tag==='t3',guard:tag==='t5'}}
/* the order a kid meets the regions: home first, then around the ring */
function orderFor(id){const home=kid(id).theme,i=RING.indexOf(home);return RING.slice(i).concat(RING.slice(0,i))}
function tierOf(k,id){return orderFor(id).indexOf(k)+1}
function unlocked(r,k,id){const o=orderFor(id),i=o.indexOf(k);return i===0||!!(r.clears&&r.clears[o[i-1]])}
function nextRegion(r,id){const o=orderFor(id);for(const k of o)if(!(r.clears&&r.clears[k]))return k;return null}

/* the save service: the Worker named by window.MQ_CLOUD. Progress lives only there; nothing is kept in the browser.
   Each save names the revision it started from plus the copy it started from (base), so the service merges saves from two devices itself. */
const CLOUD=(typeof window.MQ_CLOUD==='string')?window.MQ_CLOUD:null;
const Net=(()=>{
  const REV={},BASE={},DIRTY={},SENDING={},TIMERS={};let LOADED=false,fails=0,retryT=null,warned=false;
  const snap=o=>JSON.parse(JSON.stringify(o));
  async function call(method,path,body){const o={method,cache:'no-store'};if(body){o.body=JSON.stringify(body);o.headers={'Content-Type':'text/plain'};o.keepalive=o.body.length<60000}
    const r=await fetch(CLOUD+path,o);if(r.status!==200)throw new Error('HTTP '+r.status);return r.json()}
  function adopt(id,rev,state){REV[id]=rev;if(state){saves[id]=normalize(state);BASE[id]=snap(saves[id])}else{delete saves[id];BASE[id]=null}
    if(screen==='menu')renderMenu();else if(screen==='hub'&&player===id)renderHub()}
  function failed(){fails++;clearTimeout(retryT);retryT=setTimeout(retry,Math.min(30000,3000*fails));
    if(!LOADED)setReady('error');else if(!warned){warned=true;toast('Can’t reach the save server. Progress is not saved until it reconnects.')}}
  function retry(){if(!LOADED)return refresh();let any=false;for(const id in DIRTY)if(DIRTY[id]){any=true;push(id)}if(!any)refresh()}
  async function refresh(){if(!CLOUD)return;try{const r=await call('GET','/saves');fails=0;warned=false;const ps=r.players||{};
      for(const k of KIDS){const id=k.id;if(SENDING[id]||DIRTY[id]||TIMERS[id])continue;const x=ps[id];
        if(!x){if(REV[id]==null){REV[id]=0;BASE[id]=null}continue}if(REV[id]!==x.rev)adopt(id,x.rev,x.state)}
      if(!LOADED){LOADED=true;setReady('on')}else if(screen==='menu')renderMenu()}catch(e){failed()}}
  async function push(id){clearTimeout(TIMERS[id]);TIMERS[id]=null;if(SENDING[id]||!saves[id])return;
    const st=snap(saves[id]);st.updated=Date.now();const body={rev:REV[id]||0,state:st,base:BASE[id]||blank()};SENDING[id]=true;DIRTY[id]=false;
    try{const r=await call('POST','/saves/'+encodeURIComponent(id),body);SENDING[id]=false;fails=0;warned=false;
      if(r.conflict)adopt(id,r.rev,r.state);
      else{REV[id]=r.rev;if(r.state){const was=DIRTY[id];adopt(id,r.rev,r.state);DIRTY[id]=was}else BASE[id]=st}
      if(DIRTY[id])push(id)}
    catch(e){SENDING[id]=false;DIRTY[id]=true;failed()}}
  function schedule(id){if(!id||!saves[id])return;DIRTY[id]=true;clearTimeout(TIMERS[id]);TIMERS[id]=setTimeout(()=>push(id),400)}
  function flush(){for(const id in TIMERS)if(TIMERS[id])push(id)}
  document.addEventListener('visibilitychange',()=>{if(!CLOUD)return;if(document.hidden)flush();else if(LOADED&&screen==='menu')refresh()});
  window.addEventListener('pagehide',()=>{if(CLOUD)flush()});
  window.addEventListener('online',()=>{if(CLOUD)retry()});
  return {refresh,schedule,retry,flush,idle:()=>{for(const id in SENDING)if(SENDING[id])return false;for(const id in TIMERS)if(TIMERS[id])return false;return true},rev:id=>REV[id]||0}
})();
function persist(){if(player&&CLOUD)Net.schedule(player)}
function renderSaveNote(){const n=$('#saveNote');
  n.textContent=saveMode==='loading'?'Loading saves…':saveMode==='on'?'Coins, gear, pets and cleared regions save online for every player.':saveMode==='error'?'Can’t reach the save server. Check the connection and try again.':'No save service on this copy, so nothing is kept.';
  $('#saveRetry').hidden=saveMode!=='error'}
function setReady(mode){saveMode=mode;ready=mode==='on';renderSaveNote();if(screen==='menu')renderMenu()}

/* ---------- screens, toasts, confetti ---------- */
function show(id){document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);screen=id;$('#pageScene').hidden=id==='game';window.scrollTo(0,0)}
let toastT=null;
function toast(msg){document.querySelectorAll('.toast2').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast2';t.textContent=msg;document.body.append(t);clearTimeout(toastT);toastT=setTimeout(()=>t.remove(),2600)}
const FX=(()=>{const cv=$('#fx'),c=cv.getContext('2d');let parts=[],raf=null,last=0;
  function size(){const d=DPR();cv.width=innerWidth*d;cv.height=innerHeight*d;c.setTransform(d,0,0,d,0,0)}
  addEventListener('resize',size);size();
  function burst(x,y,n,cols){cols=cols||(WORLDS[world()]||WORLDS.lagoon).confetti||RAINBOW;for(let i=0;i<n;i++){const a=rand(0,TAU),sp=rand(120,420);parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,life:rand(.8,1.5),r:rand(4,8),col:pickOne(cols),rot:rand(0,6),vr:rand(-8,8)})}if(!raf){last=performance.now();raf=requestAnimationFrame(step)}}
  function rain(n){const cols=(WORLDS[world()]||WORLDS.lagoon).confetti||RAINBOW;for(let i=0;i<n;i++)parts.push({x:rand(0,innerWidth),y:rand(-80,-10),vx:rand(-60,60),vy:rand(80,240),life:rand(2,3.5),r:rand(4,8),col:pickOne(cols),rot:rand(0,6),vr:rand(-8,8)});if(!raf){last=performance.now();raf=requestAnimationFrame(step)}}
  function step(now){const dt=Math.min(.05,(now-last)/1000);last=now;c.clearRect(0,0,innerWidth,innerHeight);parts=parts.filter(p=>p.life>0);
    for(const p of parts){p.life-=dt;p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=clamp(p.life,0,1);c.fillStyle=p.col;c.fillRect(-p.r/2,-p.r/2,p.r,p.r*.6);c.restore()}
    if(parts.length)raf=requestAnimationFrame(step);else{raf=null;c.clearRect(0,0,innerWidth,innerHeight)}}
  return {burst,rain}})();
