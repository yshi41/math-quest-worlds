/* ---------- the region: a top-down world of rooms with real-time combat and puzzles in the floor ---------- */
const Game=(()=>{
  const Wd=MQWorld,TT=Wd.T,RW=Wd.W,RH=Wd.H;
  const stage=$('#stage'),cv=$('#cv'),cx=cv.getContext('2d');
  let G=null,T=40,raf=null,last=0,keys={},held={},bumpLock=null,lastTile=null;
  const HW=.36,HH=.3,SPD=4.6;
  const WALK=new Set([TT.FLOOR,TT.PATH,TT.STONE,TT.BRIDGE,TT.DECOR,TT.OPEN,TT.PLATE,TT.NUMTILE,TT.ISLAND,TT.RESET]);
  const KIND={slime:{r:.4,spd:1.4,col:'#8BD16B',dmg:1},spiker:{r:.4,spd:2.3,col:'#E86A5A',dmg:1},shooter:{r:.4,spd:1.2,col:'#7B4BD6',dmg:1},numslime:{r:.46,spd:.9,col:'#F2C94C',dmg:1},beetle:{r:.44,spd:1.0,col:'#5A8FBF',dmg:1},troggle:{r:.34,spd:2.7,col:'#C2552B',dmg:1},minion:{r:.34,spd:1.3,col:'#B48CF0',dmg:1}};

  const rec=()=>REC();
  const tileAt=(x,y)=>(x<0||y<0||x>=RW||y>=RH)?TT.WALL:G.room.grid[Math.floor(y)*RW+Math.floor(x)];
  const objAt=(x,y)=>G.room.obj[Math.floor(y)*RW+Math.floor(x)];
  const setTile=(x,y,v)=>{G.room.grid[y*RW+x]=v};
  const solidAt=(x,y)=>!WALK.has(tileAt(x,y));
  const blocked=(x,y,hw,hh)=>{hw=hw||HW;hh=hh||HH;return solidAt(x-hw,y-hh)||solidAt(x+hw,y-hh)||solidAt(x-hw,y+hh)||solidAt(x+hw,y+hh)};
  const DIR={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  function start(k){Snd.init();const r=rec(),g=kid(player).grade,t=tierOf(k,player),st=heroStats(r,charWorld(),charIdOf());
    const region=Wd.makeRegion(k,g,t,{cur:curName(k),name:RNAME[k],M:st.M,R:st.R,divs:st.divs,secretItem:SECRET_LOOT[k]});
    G={key:k,g,t,region,room:null,hero:{x:region.start.x,y:region.start.y,dir:'up',walkT:0,moving:false,inv:0,swing:0,cd:0,rcd:0,pushCd:0,kb:null},enemies:[],shots:[],eshots:[],drops:[],fx:[],floats:[],
      keys:0,hearts:st.maxHearts,maxHearts:st.maxHearts,st,ammo:8,ammoMax:8,ammoT:0,flags:{fork:false,missLeft:st.miss,guard:st.guard},coins:0,xp:0,kills:0,solved:0,found:[],time:0,paused:false,trans:null,dead:{},boss:null,cleared:false};
    applyWorld(k,1+clearsOf(r));
    enterRoom(region.byTag.entrance.rx,2,null);
    show('game');$('#pageScene').hidden=true;resize();renderHUD();Snd.startMusic('calm');
    if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}
    banner(RNAME[k],'Tier '+t+' · find the three keys');
    r.runs=(r.runs|0)+1;persist()}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=null;Snd.stopMusic();G=null;keys={};held={}}

  function enterRoom(rx,ry,from){const rm=G.region.rooms[Wd.key(rx,ry)];if(!rm)return;const prev=G.room;G.room=rm;G.shots=[];G.eshots=[];
    /* loot left on the floor comes along; keys and gear are never lost */
    G.drops.forEach(d=>{if(d.kind==='gear'||d.kind==='key'||d.kind==='coin')pickup(d)});G.drops=[];
    G.enemies=rm.enemies.map((e,i)=>{const key=rm.tag+':'+i;if(G.dead[key])return null;return spawn(e.kind,e.x+.5,e.y+.5,{key,n:e.n})}).filter(Boolean);
    if(rm.boss&&!G.dead['boss']){G.boss=Boss.make(rm);G.enemies.push(G.boss);Snd.stopMusic();Snd.startMusic('boss')}else G.boss=null;
    if(rm.puzzle&&rm.puzzle.type==='stones'){rm.puzzle.active=false;Object.values(rm.obj).forEach(o=>{if(o.type==='stone')o.hit=false})}
    G.flags.guardLeft=G.flags.guard?1:0;
    if(prev&&from)G.trans={dir:from,t:0,prev};
    renderHUD()}
  function spawn(kind,x,y,o){o=o||{};const d=KIND[kind]||KIND.slime;const hp=kind==='troggle'?2:kind==='minion'?1:MQMath.monsterHP(G.g,G.t,kind);
    return Object.assign({kind,x,y,r:d.r,spd:d.spd,col:d.col,dmg:d.dmg+(G.t>=5?1:0),hp,hpMax:hp,n:o.n!=null?o.n:null,n0:o.n!=null?o.n:null,hurt:0,wt:0,dx:0,dy:0,cd:rand(1,2.4),life:kind==='troggle'?16:kind==='minion'?14:Infinity,ok:o.ok,key:o.key||null,fx:1,fy:0},o)}

  /* ---------- the loop ---------- */
  function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(!G)return;G.time+=dt;
    if(!G.paused&&!Ov.isOpen()){if(G.trans){G.trans.t+=dt/.38;if(G.trans.t>=1)G.trans=null}else update(dt)}
    render()}
  function update(dt){const h=G.hero;h.inv=Math.max(0,h.inv-dt);h.cd=Math.max(0,h.cd-dt);h.rcd=Math.max(0,h.rcd-dt);h.swing=Math.max(0,h.swing-dt);h.pushCd=Math.max(0,h.pushCd-dt);
    if(G.ammo<G.ammoMax){G.ammoT+=dt;if(G.ammoT>=3){G.ammoT=0;G.ammo++;renderHUD()}}
    moveHero(dt);updateShots(dt);updateEnemies(dt);updateDrops(dt);
    if(G.boss)Boss.update(G.boss,dt);
    G.fx.forEach(f=>{f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt});G.fx=G.fx.filter(f=>f.life>0);G.floats.forEach(f=>{f.life-=dt});G.floats=G.floats.filter(f=>f.life>0)}
  function inputDir(){let dx=0,dy=0;if(keys.ArrowLeft||keys.a||keys.A||held.left)dx-=1;if(keys.ArrowRight||keys.d||keys.D||held.right)dx+=1;if(keys.ArrowUp||keys.w||keys.W||held.up)dy-=1;if(keys.ArrowDown||keys.s||keys.S||held.down)dy+=1;
    if(dx&&dy){dx*=.72;dy*=.72}return [dx,dy]}
  function moveHero(dt){const h=G.hero;
    if(h.kb){h.x=clamp(h.x+h.kb.x*dt,HW,RW-HW);h.y=clamp(h.y+h.kb.y*dt,HH,RH-HH);if(blocked(h.x,h.y)){h.x-=h.kb.x*dt;h.y-=h.kb.y*dt}h.kb.t-=dt;if(h.kb.t<=0)h.kb=null;return}
    const [dx,dy]=inputDir();h.moving=!!(dx||dy);if(!h.moving){bumpLock=null;return}h.walkT+=dt;
    if(Math.abs(dx)>=Math.abs(dy))h.dir=dx<0?'left':'right';else h.dir=dy<0?'up':'down';
    let nx=h.x+dx*SPD*dt,ny=h.y+dy*SPD*dt,hit=null;const slide=SPD*dt*.8;
    if(dx){if(!blocked(nx,h.y))h.x=nx;else if(!dy&&!blocked(nx,h.y-.4)&&!blocked(h.x,h.y-slide))h.y-=slide;else if(!dy&&!blocked(nx,h.y+.4)&&!blocked(h.x,h.y+slide))h.y+=slide;else hit=facing(Math.sign(dx),0)}
    if(dy){if(!blocked(h.x,ny))h.y=ny;else if(!dx&&!blocked(h.x-.4,ny)&&!blocked(h.x-slide,h.y))h.x-=slide;else if(!dx&&!blocked(h.x+.4,ny)&&!blocked(h.x+slide,h.y))h.x+=slide;else hit=hit||facing(0,Math.sign(dy))}
    if(hit){const o=hit.obj,id=hit.ty*RW+hit.tx;
      if(hit.tile===TT.BLOCK&&o&&h.pushCd<=0){pushBlock(o,hit.dx,hit.dy)}
      else if(o&&bumpLock!==id){bumpLock=id;interact(o)}}
    const rm=G.room,op=rm.openings;
    if(h.x<.55&&op.left.includes(Math.floor(h.y))){goRoom(-1,0,'left');return}
    if(h.x>RW-.55&&op.right.includes(Math.floor(h.y))){goRoom(1,0,'right');return}
    if(h.y<.55&&op.top.includes(Math.floor(h.x))){goRoom(0,-1,'up');return}
    if(h.y>RH-.55&&op.bottom.includes(Math.floor(h.x))){if(rm.exit){leaveAsk();h.y=RH-.6}else goRoom(0,1,'down');return}
    h.x=clamp(h.x,HW,RW-HW);h.y=clamp(h.y,HH,RH-HH);
    const tx=Math.floor(h.x),ty=Math.floor(h.y);if(!lastTile||lastTile.x!==tx||lastTile.y!==ty){const was=lastTile;lastTile={x:tx,y:ty};Puz.onTile(tx,ty,was)}}
  /* the tile the hero is pressing into */
  function facing(dx,dy){const h=G.hero,px=h.x+dx*(HW+.2),py=h.y+dy*(HH+.2);if(px<0||py<0||px>=RW||py>=RH)return null;const tx=Math.floor(px),ty=Math.floor(py);return {tx,ty,dx,dy,tile:tileAt(px,py),obj:objAt(px,py)||null}}
  function goRoom(dx,dy,dir){const h=G.hero,rx=G.room.rx+dx,ry=G.room.ry+dy;if(!G.region.rooms[Wd.key(rx,ry)])return;
    enterRoom(rx,ry,dir);if(dx<0)h.x=RW-.7;if(dx>0)h.x=.7;if(dy<0)h.y=RH-.7;if(dy>0)h.y=.7;lastTile=null;bumpLock=null}

  /* ---------- attacks ---------- */
  function melee(){const h=G.hero;if(!G||G.trans||Ov.isOpen()||h.cd>0)return;h.cd=.38;h.swing=.25;Snd.swish();const [dx,dy]=DIR[h.dir],cxp=h.x+dx*.85,cyp=h.y+dy*.85,v=G.st.M;
    let any=false;for(const e of G.enemies.slice()){if(Math.hypot(e.x-cxp,e.y-cyp)<e.r+.55){hitEnemy(e,v,'melee');any=true}}
    const o=objAt(cxp,cyp);if(o&&o.type==='dial')Puz.onMelee(o);
    if(!any)G.fx.push({x:cxp,y:cyp,vx:0,vy:0,r:.1,col:G.st.theme.col,life:.15})}
  function ranged(){const h=G.hero;if(!G||G.trans||Ov.isOpen()||h.rcd>0)return;if(G.ammo<=0){float('no ammo',h.x,h.y-1,'#E86A5A');Snd.tick();return}h.rcd=.3;G.ammo--;renderHUD();Snd.shoot();const [dx,dy]=DIR[h.dir];
    G.shots.push({x:h.x+dx*.5,y:h.y-.15+dy*.5,vx:dx*9,vy:dy*9,v:G.st.R,life:1.5,shape:G.st.theme.shape,col:G.st.theme.col,showV:true})}
  function updateShots(dt){const h=G.hero;
    for(const s of G.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.life<=0)continue;
      const tile=tileAt(s.x,s.y);if(!WALK.has(tile)){s.life=0;const o=objAt(s.x,s.y);if(o&&(o.type==='target'||o.type==='torch'))Puz.onShot(o);else G.fx.push({x:s.x,y:s.y,vx:0,vy:0,r:.12,col:s.col,life:.2});continue}
      for(const e of G.enemies){if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+.2){s.life=0;hitEnemy(e,s.v,'ranged');break}}}
    G.shots=G.shots.filter(s=>s.life>0);
    for(const s of G.eshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(!WALK.has(tileAt(s.x,s.y)))s.life=0;
      else if(h.inv<=0&&Math.hypot(h.x-s.x,h.y-s.y)<.5){s.life=0;hurt(s.dmg||1,s);knock(h,s.vx,s.vy,.25)}}
    G.eshots=G.eshots.filter(s=>s.life>0)}
  function hitEnemy(e,v,kind){const h=G.hero;e.hurt=.3;
    if(e.kind==='boss'){Boss.hit(e,v,kind);return}
    if(e.kind==='numslime'){e.n-=v;if(e.n===0){float('exactly 0!',e.x,e.y-1,'#1F9C72');die(e,{double:true})}else if(e.n<0){float('too much! back to '+e.n0,e.x,e.y-1,'#E86A5A');e.n=e.n0;Snd.wrong();knock(h,h.x-e.x,h.y-e.y,.3);e.x+=0}else{float('−'+v,e.x,e.y-1);Snd.hit();knock(e,e.x-h.x,e.y-h.y,.15)}return}
    if(e.kind==='beetle'){if(e.n%v===0){e.n/=v;float('÷'+v,e.x,e.y-1,'#1F9C72');Snd.hit();if(e.n===1){die(e,{double:true})}else knock(e,e.x-h.x,e.y-h.y,.15)}else{float(v+' doesn\'t go into '+e.n,e.x,e.y-1,'#E86A5A');Snd.wrong();knock(h,h.x-e.x,h.y-e.y,.3)}return}
    e.hp-=v;Snd.hit();knock(e,e.x-h.x,e.y-h.y,.18);float('−'+v,e.x,e.y-1);if(e.hp<=0)die(e)}
  function knock(who,dx,dy,t){const d=Math.hypot(dx,dy)||1;who.kb={x:dx/d*7,y:dy/d*7,t:t||.2}}
  function die(e,o){o=o||{};G.enemies=G.enemies.filter(x=>x!==e);if(e.key)G.dead[e.key]=true;const r=rec();r.kills=(r.kills|0)+1;G.kills++;
    popFx(e.x,e.y,e.col);Snd.pop(o.double?4:2);
    const st=G.st;let coins=1+ri(3)+(o.double?4+G.t:0);if(e.kind==='minion')coins=0;
    if(coins)drop(e.x,e.y,'coin',coins);
    if(Math.random()<(st.snack?.24:.12))drop(e.x+.3,e.y,'heart',1);
    if(Math.random()<.4)drop(e.x-.3,e.y+.2,'ammo',3);
    if(e.kind!=='troggle'&&e.kind!=='minion'&&Math.random()<(o.double?.12:.03)){const id=unownedItem();if(id)drop(e.x,e.y-.3,'gear',id)}
    addXp(e.kind==='troggle'?1:o.double?6:3,true);
    Puz.onEnemyDied(e)}
  function unownedItem(){const r=rec();const pool=MELEE_W.concat(RANGED_W).filter(it=>!r.inv[ITEM_BY_ID[it.id].kind].includes(it.id)).map(it=>it.id);return pool.length?pickOne(pool):null}
  function drop(x,y,kind,val){const a=rand(0,TAU);G.drops.push({x:clamp(x+Math.cos(a)*.3,1,RW-1),y:clamp(y+Math.sin(a)*.3,1,RH-1),kind,val,life:kind==='gear'||kind==='key'?Infinity:14})}
  function updateDrops(dt){const h=G.hero;for(const d of G.drops){d.life-=dt;if(solidAt(d.x,d.y)){d.x=h.x;d.y=h.y}
      if(Math.hypot(h.x-d.x,h.y-d.y)<.6){d.life=0;pickup(d)}}G.drops=G.drops.filter(d=>d.life>0)}
  function pickup(d){const r=rec();
    if(d.kind==='coin'){addCoins(d.val)}
    else if(d.kind==='heart'){if(G.hearts<G.maxHearts){G.hearts=Math.min(G.maxHearts,G.hearts+d.val);Snd.glow();float('+♥',G.hero.x,G.hero.y-1,'#FF5C8A')}else addCoins(2)}
    else if(d.kind==='ammo'){G.ammo=Math.min(G.ammoMax,G.ammo+d.val);Snd.tick();float('+'+d.val+' ammo',G.hero.x,G.hero.y-1,'#2FAFC4')}
    else if(d.kind==='key'){G.keys++;Snd.key();banner('A key!',G.keys>=3?'All three! The boss door awaits':(3-G.keys)+' more to find')}
    else if(d.kind==='gear'){foundItem(d.val)}
    renderHUD();persist()}
  function foundItem(id){const r=rec(),it=ITEM_BY_ID[id];if(!it)return;const isNew=giveItem(r,id);G.found.push(id);Snd.unlock();FX.burst(innerWidth/2,innerHeight*.4,50);
    if(it.kind==='heart'){G.maxHearts=r.hearts;G.hearts=G.maxHearts;Ov.item(it,'A Heart Container! Your hearts grow to '+r.hearts+'.')}
    else if(!isNew)Ov.item(it,'You already carry one of these, so it turns into coins.',()=>addCoins(30));
    else Ov.item(it,it.kind==='armor'?'Armour blocks '+it.block+' from every hit. It is on now.':(it.kind==='melee'?'A melee weapon with the number '+it.v+'. Press Q or the swap button to cycle melee weapons.':'A ranged weapon with the number '+it.v+'. Press E or the swap button to cycle ranged weapons.'),()=>{if(it.kind==='armor')r.equip.armor=id;else r.equip[it.kind]=id;refreshStats()});
    persist()}
  function refreshStats(){const r=rec(),st=heroStats(r,charWorld(),charIdOf());G.st=st;G.maxHearts=st.maxHearts;G.hearts=Math.min(G.hearts,G.maxHearts);renderHUD()}
  function cycle(kind){const r=rec(),list=r.inv[kind].slice().sort((a,b)=>ITEM_BY_ID[a].v-ITEM_BY_ID[b].v);if(list.length<2){float('only one '+kind+' weapon',G.hero.x,G.hero.y-1);return}
    const i=(list.indexOf(r.equip[kind])+1)%list.length;r.equip[kind]=list[i];refreshStats();Snd.tick();const it=ITEM_BY_ID[list[i]];float(it.name+' ('+it.v+')',G.hero.x,G.hero.y-1,'#2FAFC4');persist()}

  /* ---------- monsters ---------- */
  function enemyBlocked(e,x,y){const r=e.r*.8;return solidAt(x-r,y-r)||solidAt(x+r,y-r)||solidAt(x-r,y+r)||solidAt(x+r,y+r)}
  function updateEnemies(dt){const h=G.hero;
    for(const e of G.enemies){e.hurt=Math.max(0,e.hurt-dt);e.life-=dt;if(e.life<=0){G.enemies=G.enemies.filter(x=>x!==e);continue}
      if(e.kind==='boss')continue;
      if(e.kb){e.x+=e.kb.x*dt;e.y+=e.kb.y*dt;if(enemyBlocked(e,e.x,e.y)){e.x-=e.kb.x*dt;e.y-=e.kb.y*dt}e.kb.t-=dt;if(e.kb.t<=0)e.kb=null;continue}
      const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy);let vx=0,vy=0;
      if(e.kind==='spiker'){if(!e.dx&&!e.dy){const a=rand(0,TAU);e.dx=Math.cos(a);e.dy=Math.sin(a)}vx=e.dx*e.spd;vy=e.dy*e.spd;
        if(enemyBlocked(e,e.x+vx*dt,e.y)){e.dx=-e.dx;vx=-vx}if(enemyBlocked(e,e.x,e.y+vy*dt)){e.dy=-e.dy;vy=-vy}}
      else if(e.kind==='shooter'){e.fx=dx/(d||1);e.fy=dy/(d||1);if(d<3){vx=-dx/d*e.spd;vy=-dy/d*e.spd}else if(d>5.5){vx=dx/d*e.spd;vy=dy/d*e.spd}else{e.wt-=dt;if(e.wt<=0){e.wt=rand(.6,1.4);const a=rand(0,TAU);e.dx=Math.cos(a)*.7;e.dy=Math.sin(a)*.7}vx=e.dx;vy=e.dy}
        e.cd-=dt;if(e.cd<=0&&d<7){e.cd=2.2;G.eshots.push({x:e.x,y:e.y,vx:dx/d*4.5,vy:dy/d*4.5,life:3,dmg:e.dmg,col:e.col});Snd.tick()}}
      else{const chase=e.kind==='troggle'?12:e.kind==='minion'?9:6;if(d<chase&&d>.1){vx=dx/d*e.spd;vy=dy/d*e.spd}else{e.wt-=dt;if(e.wt<=0){e.wt=rand(.8,2);const a=rand(0,TAU);e.dx=Math.cos(a)*.5;e.dy=Math.sin(a)*.5;if(Math.random()<.3){e.dx=0;e.dy=0}}vx=e.dx;vy=e.dy}}
      const nx=e.x+vx*dt,ny=e.y+vy*dt;if(!enemyBlocked(e,nx,e.y))e.x=nx;else e.wt=0;if(!enemyBlocked(e,e.x,ny))e.y=ny;else e.wt=0;
      e.x=clamp(e.x,1+e.r,RW-1-e.r);e.y=clamp(e.y,1+e.r,RH-1-e.r);
      if(h.inv<=0&&d<e.r+.42)contact(e)}}
  function contact(e){const h=G.hero;if(G.flags.guardLeft>0){G.flags.guardLeft--;float('pet blocks it!',h.x,h.y-1,'#1F9C72');h.inv=1;return}
    const dmg=Math.max(0,e.dmg-G.st.block);knock(h,h.x-e.x,h.y-e.y,.22);h.inv=1;if(dmg>0)hurt(dmg,e);else{float('blocked',h.x,h.y-1,'#3B66E6');Snd.tick()}}
  function hurt(n,why){if(n<=0)return false;G.hearts=Math.max(0,G.hearts-n);Snd.hurt();G.hero.shake=.4;renderHUD();if(G.hearts<=0){faint();return true}return false}
  function faint(){Snd.lose();const h=G.hero;Ov.message('You fainted! Your friends carry you back to the entrance. The monsters are back, but what you solved stays solved.',{title:'Oh no',onClose:()=>{G.dead={};G.hearts=G.maxHearts;G.boss=null;enterRoom(G.region.byTag.entrance.rx,2,null);h.x=G.region.start.x;h.y=G.region.start.y;lastTile=null;renderHUD()}})}
  function addCoins(n){if(n<=0)return;const r=rec();r.coins+=n;G.coins+=n;Snd.coin();float('+'+n,G.hero.x,G.hero.y-1,'#FFE24A');renderHUD()}
  function addXp(n,quiet){const r=rec(),before=levelOf(r.xp);r.xp+=n;G.xp+=n;if(levelOf(r.xp)>before){banner('Level '+levelOf(r.xp)+'!','Your hero grows stronger');Snd.glow()}}
  function useMiss(){if(G.flags.missLeft>0){G.flags.missLeft--;return true}return false}

  /* ---------- blocks ---------- */
  function pushBlock(o,dx,dy){if(o.locked)return;const nx=o.x+dx,ny=o.y+dy;const t=tileAt(nx+.5,ny+.5);if(t!==TT.FLOOR&&t!==TT.PLATE)return;if(G.enemies.some(e=>Math.abs(e.x-nx-.5)<.8&&Math.abs(e.y-ny-.5)<.8))return;
    const rm=G.room;delete rm.obj[o.y*RW+o.x];setTile(o.x,o.y,o.under||TT.FLOOR);o.under=t;o.x=nx;o.y=ny;rm.obj[ny*RW+nx]=o;setTile(nx,ny,TT.BLOCK);G.hero.pushCd=.22;Snd.tick();Puz.onBlocks()}
  function resetBlocks(){const rm=G.room;Object.values(rm.obj).filter(o=>o.type==='block').forEach(o=>{delete rm.obj[o.y*RW+o.x];setTile(o.x,o.y,o.under||TT.FLOOR);o.x=o.home[0];o.y=o.home[1];o.under=TT.FLOOR;rm.obj[o.y*RW+o.x]=o;setTile(o.x,o.y,TT.BLOCK)});(rm.plates||[]).forEach(p=>{p.on=false;p.n=null});Snd.swish()}

  /* ---------- the puzzles in the floor ---------- */
  const Puz={
    onTile(x,y,was){const rm=G.room,p=rm.puzzle,v=tileAt(x+.5,y+.5),o=objAt(x+.5,y+.5);
      if(v===TT.RESET){resetBlocks();return}
      if(!p)return;
      if(p.type==='stones')this.stones(x,y,was,v,o);
      else if(p.type==='muncher'&&v===TT.NUMTILE&&o&&!p.done)this.munch(o);
      else if(p.type==='skip'&&v===TT.NUMTILE&&o&&!p.done)this.skip(o);},
    stones(x,y,was,v,o){const p=G.room.puzzle,d=p.data;const bank=yy=>yy<=1?'north':yy>=5?'south':null;const clearHits=()=>Object.values(G.room.obj).forEach(s=>{if(s.type==='stone')s.hit=false});
      if(v===TT.STONE){if(!p.active){if(!was||!bank(was.y))return;p.active=true;p.from=bank(was.y);p.sum=0;p.idx=0;p.set=[];p.start={x:was.x+.5,y:was.y+.5};clearHits()}
        if(p.set.includes(o))return;p.set.push(o);o.hit=true;Snd.tick();
        if(d.variant==='sum'){p.sum+=o.v;float('+'+o.v,x+.5,y);if(p.sum>d.target){sink('That makes more than '+d.target+'!');return}}
        else if(d.variant==='rule'){if(!d.rule.test(o.v)){sink(o.v+' is not '+d.rule.label+'.');return}}
        else{const expected=p.from==='south'?d.start+p.idx*d.k:d.start+(2-p.idx)*d.k;if(o.v!==expected){sink('After '+(p.idx?p.set[p.idx-1].v:'the start')+' comes '+expected+', not '+o.v+'.');return}p.idx++}
        return}
      const b=bank(y);if(!b||!p.active)return;
      p.active=false;clearHits();if(b===p.from)return;
      const right=p.set.length>0&&p.set[0].col===d.answer&&(d.variant!=='sum'||p.sum===d.target);
      if(p.done)return;
      if(right)solve('Across!');else Ov.message(d.variant==='sum'?`The chest wants stones that make exactly <b>${d.target}</b>. Yours made <b>${p.sum}</b>. Cross back and try another way.`:'Not that column. Cross back and try another.',{title:'Not quite'})},
    munch(o){const p=G.room.puzzle;if(o.done)return;if(o.ok){o.done=true;p.got++;Snd.pop(Math.min(6,p.got));float('yes!',o.x+.5,o.y,'#1F9C72');if(p.got>=p.need)solve('All munched!')}
      else{if(o.bad)return;o.bad=true;Snd.wrong();float('not '+(p.data.variant==='equal'?p.data.target:p.data.rule.label.replace(/^an? /,'')),o.x+.5,o.y,'#E86A5A');const e=spawn('troggle',o.x+.5,o.y+.5);G.enemies.push(e);banner('Troggle!','A wrong tile woke one')}},
    skip(o){const p=G.room.puzzle,seq=p.data.seq;if(o.done)return;
      if(o.v===seq[p.idx]){o.done=true;p.idx++;Snd.tick();float('✓',o.x+.5,o.y,'#1F9C72');if(p.idx>=seq.length)solve('Counted all the way!')}
      else if(o.v===seq[0]){Object.values(G.room.obj).forEach(t=>{if(t.type==='numtile')t.done=false});o.done=true;p.idx=1}
      else{Snd.wrong();o.bad=true;setTimeout(()=>{o.bad=false},600);float('after '+(p.idx?seq[p.idx-1]:'the start')+' comes '+seq[p.idx],o.x+.5,o.y,'#E86A5A');Object.values(G.room.obj).forEach(t=>{if(t.type==='numtile')t.done=false});p.idx=0}},
    onShot(o){const rm=G.room,p=rm.puzzle;if(!p||p.done)return;
      if(p.type==='targets'&&o.type==='target'){if(o.ok){if(o.lit)return;o.lit=true;Snd.pop(3);float('hit!',o.x+.5,o.y+1,'#1F9C72');const all=Object.values(rm.obj).filter(t=>t.type==='target');if(all.every(t=>!t.ok||t.lit))solve('Every target hit!')}
        else{Snd.wrong();float('not that one',o.x+.5,o.y+1,'#E86A5A');Object.values(rm.obj).forEach(t=>{if(t.type==='target')t.lit=false});const h=G.hero,dx=h.x-(o.x+.5),dy=h.y-(o.y+.5),d=Math.hypot(dx,dy)||1;G.eshots.push({x:o.x+.5,y:o.y+1,vx:dx/d*5,vy:dy/d*5,life:3,dmg:1,col:'#E86A5A'})}}
      else if(p.type==='torches'&&o.type==='torch'){const seq=p.data.seq;if(o.v===seq[p.idx]){o.lit=true;p.idx++;Snd.pop(p.idx);if(p.idx>=seq.length)solve('All lit in order!')}
        else{Snd.wrong();float('not yet: '+seq[p.idx]+' is next',o.x+.5,o.y+1,'#E86A5A');Object.values(rm.obj).forEach(t=>{if(t.type==='torch')t.lit=false});p.idx=0}}},
    onMelee(o){const p=G.room.puzzle;if(!p||p.type!=='dials'||p.done)return;o.d=(o.d+1)%10;Snd.tick();const ds=Object.values(G.room.obj).filter(t=>t.type==='dial').sort((a,b)=>a.i-b.i).map(t=>t.d);
      if(ds.join('')===p.data.digits.join('')){Object.values(G.room.obj).forEach(t=>{if(t.type==='dial')t.locked=true});solve('Click! '+p.data.v)}},
    onBlocks(){const rm=G.room,p=rm.puzzle;if(!p||p.type!=='blocks'||p.done)return;const plates=rm.plates||[];
      plates.forEach(pl=>{const o=rm.obj[pl.y*RW+pl.x];pl.on=!!(o&&o.type==='block');pl.n=pl.on?o.v:null});
      if(!plates.every(pl=>pl.on))return;const d=p.data;let ok;
      if(d.variant==='balance'){const L=plates.filter(pl=>pl.side==='L').reduce((a,pl)=>a+pl.n,0),R=plates.filter(pl=>pl.side==='R').reduce((a,pl)=>a+pl.n,0);ok=L===R;if(!ok)float(L+' vs '+R+': not balanced',8,5,'#E86A5A')}
      else{const s=plates.reduce((a,pl)=>a+pl.n,0);ok=s===d.target;if(!ok)float(s+', not '+d.target,8,5,'#E86A5A')}
      if(ok){Object.values(rm.obj).forEach(o=>{if(o.type==='block')o.locked=true});solve(d.variant==='balance'?'Balanced!':'Exactly '+d.target+'!')}else Snd.wrong()},
    onEnemyDied(e){const rm=G.room;if(e.kind==='minion'&&G.boss){Boss.minionDied(G.boss,e);return}
      if(!G.enemies.some(x=>x.kind!=='boss')){Object.values(rm.obj).forEach(o=>{if(o.type==='chest'&&o.locked==='enemies'){o.locked=null;Snd.unlock();toast('The room is clear. The chest can open now!')}})}}
  };
  function solve(text){const rm=G.room,p=rm.puzzle;p.done=true;G.solved++;Snd.unlock();FX.burst(innerWidth/2,innerHeight*.35,40);banner(text,'The chest unlocks');addXp(10);Object.values(rm.obj).forEach(o=>{if(o.type==='chest'&&o.locked==='puzzle')o.locked=null})}
  function sink(why){const h=G.hero,p=G.room.puzzle;Snd.splash();splashFx(h.x,h.y);p.active=false;Object.values(G.room.obj).forEach(s=>{if(s.type==='stone')s.hit=false});
    h.x=p.start.x;h.y=p.start.y;lastTile=null;const free=useMiss();if(hurt(free?0:1,'stones'))return;
    Ov.message('Splash! '+why+(free?' Your lucky gear kept your heart.':''),{title:'Into the water'})}

  /* ---------- bumping into things ---------- */
  function interact(o){const rm=G.room,cur=curName(G.key);
    switch(o.type){
      case 'sign':Snd.click();Ov.message(o.text,{title:'Sign'});break;
      case 'door':{const p=rm.puzzle;if(o.ok){setTile(o.x,o.y,TT.OPEN);delete rm.obj[o.y*RW+o.x];solve('Click!')}
        else{o.bit=true;setTimeout(()=>{o.bit=false},600);const free=useMiss();if(hurt(free?0:1,'door'))break;Ov.message(`Ouch! <b>${o.n}</b> is not ${p.data.rule.label}. That door bites.${free?' Your lucky gear kept your heart.':''}`,{title:'Wrong door'})}break}
      case 'chest':{if(o.open)break;
        if(o.locked==='enemies'){Snd.tick();Ov.message('The chest rattles. Clear every monster in the room first!',{title:'Locked chest'});break}
        if(o.locked==='puzzle'){Snd.tick();Ov.message('Locked. Solve this room\'s puzzle: read the sign.',{title:'Locked chest'});break}
        o.open=true;Snd.coin();
        if(o.content==='key'){drop(o.x+.5,o.y+1,'key',1);addXp(8)}
        else if(o.content==='item'&&o.item){drop(o.x+.5,o.y+1,'gear',o.item)}
        else if(o.content==='gear'){const id=unownedItem();if(id)drop(o.x+.5,o.y+1,'gear',id);else drop(o.x+.5,o.y+1,'coin',o.amount||30)}
        else{let n=o.amount||20;if(G.st.nose)n=Math.round(n*1.25);drop(o.x+.5,o.y+1,'coin',n);if(Math.random()<.5)drop(o.x+.5,o.y+1,'ammo',4)}
        persist();break}
      case 'bossdoor':{if(G.keys>=3){Object.keys(rm.obj).forEach(i=>{const x=rm.obj[i];if(x.type==='bossdoor'){setTile(x.x,x.y,TT.OPEN);delete rm.obj[i]}});Snd.unlock();G.hearts=G.maxHearts;G.ammo=G.ammoMax;renderHUD();banner('The boss door opens!','Hearts and ammo refilled. Go up!')}
        else{Snd.tick();Ov.message(`Locked tight. It needs <b>3 keys</b> and you have <b>${G.keys}</b>. Two keys sit in the puzzle rooms, one in the arena.`,{title:'Boss door'})}break}
      case 'cave':{if(G.flags.fork){Ov.message(o.sealed?'This cave is sealed now.':'You already explored the caves.',{title:'Cave'});break}
        Ov.confirm(`Enter this cave? The sign says it holds <b>${o.text}</b>.`,{title:'Cave',yes:'Go in',no:'Not yet',onYes:()=>{G.flags.fork=true;const best=rm.fork.best===o.i;
          Object.values(rm.obj).forEach(x=>{if(x.type==='cave'&&x!==o)x.sealed=true});addCoins(o.value+(best?10:0));
          const other=rm.fork.options.filter((_,j)=>j!==o.i).map(x=>x.value);
          Ov.message(`You gather <b>${o.value} ${cur}</b>.${best?' <b>Sharp eyes!</b> That was the richest cave, so you get 10 extra.':` The other cave${other.length>1?'s':''} held ${other.join(' and ')}.`}`,{title:best?'Best choice!':'Treasure'});addXp(best?8:4);persist()}});break}
      default:break}}

  /* ---------- bosses: the math is in how you hit them ---------- */
  const Boss={
    make(rm){const b=rm.boss,col=BOSS_COL[G.key]||'#D9453A';const e={kind:'boss',x:b.x+.5,y:b.y+.5,r:.95,spd:.9,col,dmg:2+(G.t>=5?1:0),hurt:0,wt:0,dx:0,dy:0,cd:2,type:b.type,data:b.data,phase:0,n:null,tag:'',stun:0,hp:0,need:0,life:Infinity,key:'boss',name:BOSS_NAMES[G.key]};
      if(b.type==='shield'){e.n=b.data.phases[0];e.tag='Shield: hit exactly 0'}
      else if(b.type==='factor'){e.n=b.data.phases[0];e.tag='Only divisors hurt it'}
      else if(b.type==='minions'){e.need=b.data.need;e.hp=0;e.tag=b.data.label;e.n=e.need}
      else{e.round=0;e.tag=this.patternTag(e);e.n=null;this.setPlates(e);e.stand=0;e.standOn=null}
      return e},
    patternTag(e){const r=e.data.rounds[e.round];return r.shown.join(', ')+', ?'},
    setPlates(e){const r=e.data.rounds[e.round],rm=G.room;(rm.plates||[]).forEach((pl,i)=>{pl.n=r.opts[i];pl.on=false})},
    hit(e,v,kind){const h=G.hero;
      if(e.type==='shield'){if(e.stun>0){this.phaseUp(e);return}e.n-=v;if(e.n===0){e.stun=4;e.tag='Shield down! Hit it!';float('exactly 0!',e.x,e.y-1.3,'#1F9C72');Snd.special?Snd.special():Snd.glow()}
        else if(e.n<0){e.n=e.data.phases[e.phase];float('too much! shield back to '+e.n,e.x,e.y-1.3,'#E86A5A');Snd.wrong();knock(h,h.x-e.x,h.y-e.y,.35);hurt(Math.max(0,1-G.st.block),e)}else{float('−'+v,e.x,e.y-1.3);Snd.hit()}return}
      if(e.type==='factor'){if(e.n%v===0){e.n/=v;float('÷'+v,e.x,e.y-1.3,'#1F9C72');Snd.hit();if(e.n===1)this.phaseUp(e)}else{float(v+' doesn\'t go into '+e.n,e.x,e.y-1.3,'#E86A5A');Snd.wrong();knock(h,h.x-e.x,h.y-e.y,.3);if(G.enemies.length<4&&Math.random()<.5)G.enemies.push(spawn('beetle',e.x+rand(-1,1),e.y+1.5,{n:pickOne(e.data.divs)*pickOne(e.data.divs)}))}return}
      if(e.type==='minions'){float('only its minions can hurt it',e.x,e.y-1.3,'#E86A5A');Snd.tick();return}
      float('stand on the next number!',e.x,e.y-1.3,'#E86A5A');Snd.tick()},
    phaseUp(e){e.phase++;Snd.bossHit();popFx(e.x,e.y,e.col);knock(e,e.x-G.hero.x,e.y-G.hero.y,.3);
      if(e.phase>=3){this.die(e);return}
      if(e.type==='shield'){e.n=e.data.phases[e.phase];e.stun=0;e.tag='Shield: hit exactly 0';banner('Shield broken!','A bigger one grows: '+e.n)}
      else{e.n=e.data.phases[e.phase];banner('Shrunk to 1!','It grows again: '+e.n)}},
    minionDied(e,m){if(m.ok){e.hp++;e.n=e.need-e.hp;float('that one fed it! −1',e.x,e.y-1.3,'#1F9C72');Snd.bossHit();knock(e,rand(-1,1),rand(-1,1),.2);if(e.hp>=e.need)this.die(e)}
      else{e.hp=Math.max(0,e.hp-1);e.n=e.need-e.hp;float('wrong one! it heals',e.x,e.y-1.3,'#E86A5A');Snd.wrong();const h=G.hero,dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;G.eshots.push({x:e.x,y:e.y,vx:dx/d*5,vy:dy/d*5,life:3,dmg:1,col:e.col})}},
    update(e,dt){const h=G.hero;e.hurt=Math.max(0,e.hurt-dt);
      if(e.stun>0){e.stun-=dt;if(e.stun<=0){e.stun=0;e.n=e.data.phases[e.phase];e.tag='Shield: hit exactly 0';float('the shield is back',e.x,e.y-1.3)}return}
      if(e.kb){e.x+=e.kb.x*dt;e.y+=e.kb.y*dt;e.kb.t-=dt;if(e.kb.t<=0)e.kb=null}
      else{const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy)||1;const spd=e.type==='pattern'?.6:e.spd;if(d>1.2){const nx=e.x+dx/d*spd*dt,ny=e.y+dy/d*spd*dt;if(!enemyBlocked(e,nx,e.y))e.x=nx;if(!enemyBlocked(e,e.x,ny))e.y=ny}
        if(h.inv<=0&&d<e.r+.42)contact(e)}
      e.x=clamp(e.x,1.2,RW-1.2);e.y=clamp(e.y,1.2,RH-1.2);
      if(e.type==='minions'){e.cd-=dt;if(e.cd<=0&&G.enemies.filter(x=>x.kind==='minion').length<4){e.cd=2.4;const n=MQMath.minionNumber(e.data.rule);const m=spawn('minion',clamp(e.x+rand(-2,2),1.5,RW-1.5),clamp(e.y+rand(1,2),1.5,RH-1.5),{n,ok:e.data.rule.test(n)});G.enemies.push(m)}}
      if(e.type==='pattern'){const rm=G.room,pl=(rm.plates||[]).find(p=>Math.abs(h.x-p.x-.5)<.5&&Math.abs(h.y-p.y-.5)<.5);const r=e.data.rounds[e.round];
        if(pl&&pl===e.standOn){e.stand+=dt;if(e.stand>=.8){e.stand=0;e.standOn=null;if(pl.n===r.answer){e.round++;Snd.bossHit();popFx(e.x,e.y,e.col);float('zap! '+r.answer+' it is',e.x,e.y-1.3,'#1F9C72');if(e.round>=e.data.rounds.length){this.die(e);return}e.tag=this.patternTag(e);this.setPlates(e)}
            else{float(pl.n+'? the slam lands!',e.x,e.y-1.3,'#E86A5A');Snd.wrong();hurt(Math.max(0,1-G.st.block),e);knock(h,h.x-e.x,h.y-e.y,.3)}}}
        else{e.standOn=pl||null;e.stand=0}
        (rm.plates||[]).forEach(p=>{p.on=p===pl})}},
    die(e){G.enemies=G.enemies.filter(x=>x!==e);G.dead.boss=true;G.boss=null;popFx(e.x,e.y,e.col);Snd.win();G.enemies=G.enemies.filter(x=>x.kind!=='minion'&&x.kind!=='beetle');
      const r=rec(),k=G.key,list=BOSS_LOOT[k]||[],nth=clearsOf(r)>=1&&r.clears[k]?1:0;const id=list[Math.min(nth,list.length-1)];
      drop(e.x,e.y,'coin',40+10*G.t);if(id&&!r.inv[ITEM_BY_ID[id].kind].includes(id))drop(e.x,e.y+.6,'gear',id);else drop(e.x,e.y+.6,'coin',40);
      G.bossDone=true;banner(e.name+' is beaten!','Grab the loot');setTimeout(()=>{if(G&&G.bossDone)clearRegion()},2600)}
  };

  /* ---------- leaving, clearing ---------- */
  function leaveAsk(){Ov.confirm('Leave this region? Keys stay behind, but your coins, gear and anything you cleared are kept.',{title:'Leave?',yes:'Leave',no:'Stay',onYes:()=>leave(),onNo:()=>{G.hero.y=RH-1.2}})}
  function leave(){stop();persist();openMap()}
  function clearRegion(){if(!G||G.cleared)return;const r=rec(),k=G.key;G.cleared=true;const first=!r.clears[k];r.clears[k]=1;r.wins=(r.wins|0)+1;const bonus=60+20*G.t;r.coins+=bonus;G.coins+=bonus;addXp(60+20*G.t);persist();
    /* loot still lying on the floor comes along */
    G.drops.forEach(d=>{if(d.kind==='gear')giveItem(r,d.val);else if(d.kind==='coin'){r.coins+=d.val;G.coins+=d.val}});G.drops=[];
    FX.rain(160);LAST_RUN={name:RNAME[k],coins:G.coins,xp:G.xp,kills:G.kills,solved:G.solved,found:G.found.slice()};
    Ov.clear({name:RNAME[k],bonus,first},()=>{stop();openClear()})}

  /* ---------- rendering ---------- */
  function resize(){const w=stage.clientWidth||600;T=w/RW;const d=DPR();cv.width=Math.round(RW*T*d);cv.height=Math.round(RH*T*d);cx.setTransform(d,0,0,d,0,0)}
  function render(){if(!G)return;const t=G.time,tset=TILES1,ink='#22333B';cx.clearRect(0,0,RW*T,RH*T);
    let ox=0,oy=0;
    if(G.trans){const k=1-Math.pow(1-G.trans.t,3),d=G.trans.dir,W=RW*T,H=RH*T;const sx=d==='left'?-1:d==='right'?1:0,sy=d==='up'?-1:d==='down'?1:0;drawRoom(cx,G.trans.prev,T,tset,t,-sx*W*k,-sy*H*k,ink);ox=sx*W*(1-k);oy=sy*H*(1-k)}
    drawRoom(cx,G.room,T,tset,t,ox,oy,ink);
    cx.save();cx.translate(ox,oy);
    for(const d of G.drops)drawDrop(cx,d,T,t);
    for(const e of G.enemies)drawMonster(cx,e,T,t);
    const h=G.hero;if(!(h.inv>0&&Math.floor(t*12)%2))drawHero(cx,h,T,t,G.st.theme,h.swing);
    for(const s of G.shots)drawShot(cx,s,T,G.st.theme);
    for(const s of G.eshots){cx.fillStyle=s.col||'#E86A5A';cx.beginPath();cx.arc(s.x*T,s.y*T,T*.16,0,TAU);cx.fill();cx.strokeStyle='rgba(0,0,0,.3)';cx.lineWidth=1.5;cx.stroke()}
    for(const f of G.fx){cx.globalAlpha=clamp(f.life*3,0,1);cx.fillStyle=f.col;cx.beginPath();cx.arc(f.x*T,f.y*T,f.r*T,0,TAU);cx.fill()}cx.globalAlpha=1;
    for(const f of G.floats){cx.globalAlpha=clamp(f.life*1.5,0,1);label(cx,f.text,f.x*T,(f.y-(1.4-f.life)*.9)*T,T*.42,f.col)}cx.globalAlpha=1;
    cx.restore()}
  function float(text,x,y,col){G.floats.push({text,x:clamp(x,1.5,RW-1.5),y,col:col||'#fff',life:1.4})}
  function splashFx(x,y){for(let i=0;i<14;i++){const a=rand(0,TAU);G.fx.push({x,y,vx:Math.cos(a)*1.4,vy:Math.sin(a)*1.4-.8,r:rand(.06,.14),col:TILES1.waterHi,life:.5})}}
  function popFx(x,y,col){for(let i=0;i<14;i++){const a=rand(0,TAU);G.fx.push({x,y,vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.8,r:rand(.06,.14),col:col||'#fff',life:.4})}}
  function banner(text,sub){const el=$('#banner');el.innerHTML=`<span>${text}</span>${sub?`<br><small>${sub}</small>`:''}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
  function renderHUD(){if(!G)return;const st=G.st;$('#hudHearts').innerHTML=Array.from({length:G.maxHearts},(_,i)=>heartSvg.replace('class="heart"','class="heart'+(i<G.hearts?'':' lost')+'"')).join('');
    $('#hudCoins').innerHTML=CUR_ICON[G.key]+' '+rec().coins;$('#hudKeys').innerHTML=keySvg+' '+G.keys+'/3';$('#hudAmmo').innerHTML=ammoSvg+' '+G.ammo;
    $('#hudM').innerHTML=swordSvg+' '+st.M;$('#hudM').title=st.melee.name+' · '+st.theme.melee;$('#hudR').innerHTML=bowSvg+' '+st.R;$('#hudR').title=st.ranged.name+' · '+st.theme.ranged;
    $('#hudBlock').innerHTML=st.block?shieldSvg+' '+st.block:'';$('#hudBlock').hidden=!st.block;
    const names={entrance:'Entrance',hall:'Hall',pA:'Puzzle room',pB:'Puzzle room',pC:'Puzzle room',pD:'Puzzle room',pE:'Puzzle room',secret:'Secret room',arena:'Arena',nest:'Monster nest',bossgate:'Boss gate',boss:'Boss lair',fork:'Fork caves'};
    const rn=names[G.room.tag]||G.room.tag;$('#hudRoom').textContent=rn;
    $('#gameHint').textContent=rn+' · '+(document.body.classList.contains('touch')?'pad to walk · A melee · B ranged · swap buttons change weapons':'arrows/WASD walk · Z or Space melee · X ranged · Q/E swap weapons · Esc pause')}

  /* ---------- input ---------- */
  addEventListener('keydown',e=>{if(screen!=='game')return;if(Ov.isOpen()){if(Ov.key(e))e.preventDefault();return}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){Ov.pause();return}
    if(!e.repeat){if(e.key==='z'||e.key==='Z'||e.key==='j'||e.key==='J'||e.key===' ')melee();else if(e.key==='x'||e.key==='X'||e.key==='k'||e.key==='K')ranged();else if(e.key==='q'||e.key==='Q')cycle('melee');else if(e.key==='e'||e.key==='E')cycle('ranged')}
    keys[e.key]=true});
  addEventListener('keyup',e=>{keys[e.key]=false});
  addEventListener('blur',()=>{keys={};held={}});
  document.querySelectorAll('#dpad .dp').forEach(b=>{const d=b.getAttribute('data-d');const on=e=>{e.preventDefault();held[d]=true;b.classList.add('held');document.body.classList.add('touch');Snd.init()};const off=()=>{held[d]=false;b.classList.remove('held')};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);b.addEventListener('contextmenu',e=>e.preventDefault())});
  const tb=(id,fn)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();document.body.classList.add('touch');Snd.init();fn()});b.addEventListener('contextmenu',e=>e.preventDefault())};
  tb('#btnA',melee);tb('#btnB',ranged);tb('#btnQ',()=>G&&cycle('melee'));tb('#btnE',()=>G&&cycle('ranged'));
  $('#pauseBtn').onclick=()=>{if(G&&!Ov.isOpen())Ov.pause()};
  addEventListener('resize',()=>{if(G)resize()});
  addEventListener('touchstart',()=>document.body.classList.add('touch'),{passive:true,once:true});

  return {start,stop,leave,get G(){return G},rec,resize,renderHUD,hurt,addCoins,melee,ranged,cycle,refreshStats,
    /* test hooks */
    teleport(tag,x,y,dir){const rm=G.region.byTag[tag];enterRoom(rm.rx,rm.ry,null);G.hero.x=x;G.hero.y=y;if(dir)G.hero.dir=dir;lastTile=null;bumpLock=null;G.hero.kb=null},
    face(d){G.hero.dir=d},press(k,v){keys[k]=v},interact,enemies:()=>G.enemies,setKeys(n){G.keys=n;renderHUD()},room:()=>G.room,puzzle:()=>G.room.puzzle,shoot(o){Puz.onShot(o)},tile(x,y,was){Puz.onTile(x,y,was)},push:pushBlock,hitEnemy,Boss,spawn:(k,x,y,o)=>{const e=spawn(k,x,y,o);G.enemies.push(e);return e},drops:()=>G.drops,clearRegion,
    placeBlock(o,x,y){const rm=G.room;delete rm.obj[o.y*RW+o.x];setTile(o.x,o.y,o.under||TT.FLOOR);o.under=tileAt(x+.5,y+.5);o.x=x;o.y=y;rm.obj[y*RW+x]=o;setTile(x,y,TT.BLOCK);Puz.onBlocks()}}
})();
