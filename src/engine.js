/* ---------- the region: a top-down world of rooms, walked one screen at a time ---------- */
const Game=(()=>{
  const Wd=MQWorld,TT=Wd.T,RW=Wd.W,RH=Wd.H;
  const stage=$('#stage'),cv=$('#cv'),cx=cv.getContext('2d'),heroEl=$('#heroEl'),petEl=$('#petEl');
  let G=null,T=40,raf=null,last=0,keys={},held={},bumpLock=null,lastTile=null;
  const HERO_W=.36,HERO_H=.3,SPD=4.4;

  function tier(){return G.t}
  function rec(){return REC()}
  function ts(){return TILESET[G.key]}
  function room(){return G.room}
  function solidAt(x,y){if(x<0||y<0||x>=RW||y>=RH)return true;return Wd.SOLID.has(G.room.grid[Math.floor(y)*RW+Math.floor(x)])}
  function objAt(x,y){return G.room.obj[Math.floor(y)*RW+Math.floor(x)]}
  function tileAt(x,y){return G.room.grid[Math.floor(y)*RW+Math.floor(x)]}
  function setTile(x,y,v){G.room.grid[y*RW+x]=v}
  function blocked(x,y){return solidAt(x-HERO_W,y-HERO_H)||solidAt(x+HERO_W,y-HERO_H)||solidAt(x-HERO_W,y+HERO_H)||solidAt(x+HERO_W,y+HERO_H)}
  /* an interactive tile the hero is pressing into */
  function facing(x,y,dx,dy){const px=x+dx*(HERO_W+.2),py=y+dy*(HERO_H+.2);if(px<0||py<0||px>=RW||py>=RH)return null;return objAt(px,py)||null}

  function start(k){Snd.init();const r=rec(),g=kid(player).grade,t=tierOf(k,player),st=heroStats(r);
    const region=Wd.makeRegion(k,g,t,{cur:curName(k),name:RNAME[k],pet:r.pet?PET_WORDS[r.pet]:null});
    G={key:k,g,t,region,room:null,hero:{x:region.start.x,y:region.start.y,dir:'down',inv:0,moving:false},enemies:[],keys:0,hearts:st.maxHearts,maxHearts:st.maxHearts,st,
      flags:{riddle:false,toll:false,fork:false,revived:false,missLeft:st.miss,trail:[]},stones:{active:false,sum:0,set:new Set()},coins:0,xp:0,battles:0,perfect:0,t0:0,time:0,paused:false,trans:null,fx:[],floats:[],dead:{},opened:{},cleared:false};
    applyWorld(k,1+clearsOf(r));
    enterRoom(region.byTag.entrance.rx,2,null);
    show('game');$('#pageScene').hidden=true;
    heroEl.innerHTML=heroSVG(charWorld(),charIdOf(),r.wear,'neutral',{gear:gearSVG(r.gear)});
    petEl.innerHTML=r.pet?petSVG(r.pet,r.petWear,r.petTag):'';petEl.hidden=!r.pet;
    G.petPos={x:G.hero.x-.9,y:G.hero.y+.1};
    resize();renderHUD();Snd.startMusic('calm');
    if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}
    banner(RNAME[k],'Tier '+t+' · find the two keys');
    r.runs=(r.runs|0)+1;persist()}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=null;Snd.stopMusic();G=null;keys={};held={}}

  function enterRoom(rx,ry,from){const rm=G.region.rooms[Wd.key(rx,ry)];if(!rm)return;const prev=G.room;G.room=rm;
    /* monsters wake up when the room is entered, except the ones already beaten this visit */
    G.enemies=rm.enemies.map((e,i)=>{const k=rm.tag+':'+i;if(G.dead[k])return null;const info=monsterInfo(!!e.boss,i);return {x:e.x+.5,y:e.y+.5,r:e.boss?.6:.42,spd:e.boss?1.1:.85,boss:!!e.boss,idx:i,key:k,name:info[0],col:info[1],shape:info[2],wt:0,dx:0,dy:0,hurt:0}}).filter(Boolean);
    G.stones={active:false,sum:0,set:new Set()};Object.values(rm.obj).forEach(o=>{if(o.type==='stone'){o.hit=false}});
    if(prev&&from)G.trans={dir:from,t:0,prev};
    renderHUD()}
  function monsterInfo(boss,i){const m=MONSTERS[G.key];return boss?[m.boss[0],m.boss[1],1]:m.mon[i%m.mon.length]}

  /* ---------- the loop ---------- */
  function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(!G)return;G.time+=dt;
    if(!G.paused&&!Ov.isOpen()){if(G.trans)stepTrans(dt);else{moveHero(dt);moveEnemies(dt);checkEnemies()}}
    G.hero.inv=Math.max(0,G.hero.inv-dt);render()}
  function stepTrans(dt){G.trans.t+=dt/.38;if(G.trans.t>=1)G.trans=null}
  function inputDir(){let dx=0,dy=0;if(keys.ArrowLeft||keys.a||keys.A||held.left)dx-=1;if(keys.ArrowRight||keys.d||keys.D||held.right)dx+=1;if(keys.ArrowUp||keys.w||keys.W||held.up)dy-=1;if(keys.ArrowDown||keys.s||keys.S||held.down)dy+=1;
    if(dx&&dy){dx*=.72;dy*=.72}return [dx,dy]}
  function moveHero(dt){const h=G.hero,[dx,dy]=inputDir();h.moving=!!(dx||dy);if(!h.moving){bumpLock=null;return}
    if(Math.abs(dx)>=Math.abs(dy))h.dir=dx<0?'left':'right';else h.dir=dy<0?'up':'down';
    let nx=h.x+dx*SPD*dt,ny=h.y+dy*SPD*dt,hitX=null,hitY=null;const slide=SPD*dt*.8;
    if(dx){if(!blocked(nx,h.y))h.x=nx;else if(!dy&&!blocked(nx,h.y-.4)&&!blocked(h.x,h.y-slide))h.y-=slide;else if(!dy&&!blocked(nx,h.y+.4)&&!blocked(h.x,h.y+slide))h.y+=slide;else{hitX=facing(h.x,h.y,Math.sign(dx),0)}}
    if(dy){if(!blocked(h.x,ny))h.y=ny;else if(!dx&&!blocked(h.x-.4,ny)&&!blocked(h.x-slide,h.y))h.x-=slide;else if(!dx&&!blocked(h.x+.4,ny)&&!blocked(h.x+slide,h.y))h.x+=slide;else{hitY=facing(h.x,h.y,0,Math.sign(dy))}}
    const hit=hitX||hitY;if(hit){const id=hit.y*RW+hit.x;if(bumpLock!==id){bumpLock=id;interact(hit)}}
    /* room edges */
    const rm=G.room,op=rm.openings;
    if(h.x<.55&&op.left.includes(Math.floor(h.y))){goRoom(-1,0,'left');return}
    if(h.x>RW-.55&&op.right.includes(Math.floor(h.y))){goRoom(1,0,'right');return}
    if(h.y<.55&&op.top.includes(Math.floor(h.x))){goRoom(0,-1,'up');return}
    if(h.y>RH-.55&&op.bottom.includes(Math.floor(h.x))){if(rm.exit){leaveAsk();h.y=RH-.6}else goRoom(0,1,'down');return}
    h.x=clamp(h.x,HERO_W,RW-HERO_W);h.y=clamp(h.y,HERO_H,RH-HERO_H);
    const tx=Math.floor(h.x),ty=Math.floor(h.y);if(!lastTile||lastTile.x!==tx||lastTile.y!==ty){const was=lastTile;lastTile={x:tx,y:ty};onTile(tx,ty,was)}}
  function goRoom(dx,dy,dir){const h=G.hero,rx=G.room.rx+dx,ry=G.room.ry+dy;if(!G.region.rooms[Wd.key(rx,ry)]){return}
    enterRoom(rx,ry,dir);if(dx<0)h.x=RW-.7;if(dx>0)h.x=.7;if(dy<0)h.y=RH-.7;if(dy>0)h.y=.7;lastTile=null;bumpLock=null;G.petPos={x:h.x-dx*.9,y:h.y-dy*.9}}

  /* ---------- the stepping stones, checked when the hero steps on a new tile ---------- */
  function onTile(x,y,was){const rm=G.room;if(rm.tag!=='stones')return;const v=tileAt(x+.5,y+.5),st=G.stones,puz=G.region.puz.stones;
    if(v===TT.STONE){const o=objAt(x+.5,y+.5);if(!st.active){if(was&&was.y>=6){st.active=true;st.sum=0;st.set=new Set()}else return}
      if(!st.set.has(o)){st.set.add(o);st.sum+=o.v;o.hit=true;Snd.tick();float('+'+o.v,x+.5,y)}
      if(st.sum>puz.target){sink();return}}
    else if(y<=2&&st.active){if(st.sum===puz.target){st.active=false;openGate();}else{Ov.message(`The gate wants exactly <b>${puz.target}</b>. Your stones made <b>${st.sum}</b>. Walk back and try another way.`,{title:'Not quite'});st.active=false}}
    else if(y>=6&&st.active){st.active=false;Object.values(rm.obj).forEach(o=>{if(o.type==='stone')o.hit=false})}
    else if(y>=6){Object.values(rm.obj).forEach(o=>{if(o.type==='stone')o.hit=false})}}
  function sink(){const h=G.hero,rm=G.room,puz=G.region.puz.stones;Snd.splash();splashFx(h.x,h.y);G.stones.active=false;
    Object.values(rm.obj).forEach(o=>{if(o.type==='stone')o.hit=false});
    h.x=Math.max(1.5,Math.min(RW-1.5,h.x));h.y=7.5;lastTile=null;
    const free=useMiss();if(hurt(free?0:1,'stones'))return;
    Ov.message(`Splash! That was more than <b>${puz.target}</b>, so the stones sank.${free?' Your lucky gear kept your heart.':''}`,{title:'Too much!'})}
  function openGate(){const rm=G.room;Object.keys(rm.obj).forEach(i=>{const o=rm.obj[i];if(o.type==='gate'){setTile(o.x,o.y,TT.OPEN);delete rm.obj[i]}});Snd.unlock();FX.burst(innerWidth/2,innerHeight*.35,40);
    banner('Exactly '+G.region.puz.stones.target+'!','The gate opens');addCoins(12+3*G.t);addXp(8)}

  /* ---------- enemies ---------- */
  function enemyBlocked(e,x,y){const r=e.r*.8;return solidAt(x-r,y-r)||solidAt(x+r,y-r)||solidAt(x-r,y+r)||solidAt(x+r,y+r)}
  function moveEnemies(dt){const h=G.hero;for(const e of G.enemies){e.hurt=Math.max(0,e.hurt-dt);const dx=h.x-e.x,dy=h.y-e.y,d=Math.hypot(dx,dy);
      let vx,vy;if(d<5.5&&d>.1){vx=dx/d*e.spd;vy=dy/d*e.spd}else{e.wt-=dt;if(e.wt<=0){e.wt=rand(.8,2);const a=rand(0,TAU);e.dx=Math.cos(a)*.5;e.dy=Math.sin(a)*.5;if(Math.random()<.3){e.dx=0;e.dy=0}}vx=e.dx;vy=e.dy}
      const nx=e.x+vx*dt,ny=e.y+vy*dt;if(!enemyBlocked(e,nx,e.y))e.x=nx;else e.wt=0;if(!enemyBlocked(e,e.x,ny))e.y=ny;else e.wt=0;
      e.x=clamp(e.x,1+e.r,RW-1-e.r);e.y=clamp(e.y,1+e.r,RH-1-e.r)}}
  function checkEnemies(){const h=G.hero;if(h.inv>0)return;for(const e of G.enemies){if(Math.hypot(h.x-e.x,h.y-e.y)<e.r+.45){startBattle(e);return}}}
  function startBattle(e){const hp=MQMath.battleHP(G.g,G.t,G.st.moves,{boss:e.boss}),power=MQMath.monsterPower(G.g,G.t,e.boss);
    if(e.boss)Snd.startMusic('boss');else Snd.stopMusic();
    Battle.start(e,{name:e.name,col:e.col,shape:e.shape,boss:e.boss,hp:hp.hp,power,allowDouble:hp.double,moves:G.st.moves,st:G.st,hearts:G.hearts,maxHearts:G.maxHearts},onBattleEnd)}
  function onBattleEnd(res){if(!G)return;const h=G.hero,e=res.enemy;Snd.stopMusic();G.hearts=res.hearts;
    if(res.won){G.dead[e.key]=true;G.enemies=G.enemies.filter(x=>x!==e);G.battles++;if(res.perfect)G.perfect++;const r=rec();r.wins=(r.wins|0)+1;
      let loot=(8+3*G.t)*(e.boss?4:1);if(res.perfect)loot*=2;else if(res.overkill)loot=Math.max(4,Math.round(loot/2));if(G.st.bell)loot+=5;
      addCoins(loot);addXp((e.boss?40:10)+(res.perfect?5:0));if(G.st.snack&&G.hearts<G.maxHearts){G.hearts++;renderHUD()}
      popFx(e.x,e.y);h.inv=1.2;
      if(e.boss){clearRegion();return}
      Snd.startMusic('calm');
      if(G.room.tag==='den'&&!G.enemies.length)toast('The den is quiet. The chest can open now!')}
    else{if(res.fainted){faint();return}h.inv=1.5;Snd.startMusic('calm')}
    renderHUD();persist()}

  /* ---------- hearts, coins, xp ---------- */
  function useMiss(){if(G.flags.missLeft>0){G.flags.missLeft--;return true}return false}
  function hurt(n,why){if(n<=0)return false;G.hearts=Math.max(0,G.hearts-n);heroEl.classList.remove('hurt');void heroEl.offsetWidth;heroEl.classList.add('hurt');Snd.wrong();renderHUD();if(G.hearts<=0){faint();return true}return false}
  function faint(){if(G.st.revive&&!G.flags.revived){G.flags.revived=true;G.hearts=3;renderHUD();Ov.message('The Phoenix Feather glows and you get back up with 3 hearts!',{title:'Phoenix!'});Snd.glow();return}
    Snd.lose();const h=G.hero;Ov.message('You fainted! Your friends carry you back to the entrance. The monsters are back, but what you solved stays solved.',{title:'Oh no',onClose:()=>{G.dead={};G.hearts=G.maxHearts;enterRoom(G.region.byTag.entrance.rx,2,null);h.x=G.region.start.x;h.y=G.region.start.y;lastTile=null;G.petPos={x:h.x-.9,y:h.y};renderHUD()}})}
  function addCoins(n,silent){if(n<=0)return;const r=rec();r.coins+=n;G.coins+=n;if(!silent){Snd.coin();float('+'+n,G.hero.x,G.hero.y-1,'#FFE24A')}renderHUD()}
  function addXp(n){const r=rec(),before=levelOf(r.xp);r.xp+=n;G.xp+=n;if(levelOf(r.xp)>before){banner('Level '+levelOf(r.xp)+'!','Your hero grows stronger');Snd.glow()}}

  /* ---------- bumping into things ---------- */
  function interact(o){const rm=G.room,puz=G.region.puz,cur=curName(G.key);Snd.click();
    switch(o.type){
      case 'sign':Ov.message(o.text,{title:'Sign'});break;
      case 'gate':Ov.message(`The gate only opens for the exact total. Hop across on stones that add up to <b>${puz.stones.target}</b>.`,{title:'Locked gate'});break;
      case 'door':{if(o.ok){setTile(o.x,o.y,TT.OPEN);delete rm.obj[o.y*RW+o.x];Snd.unlock();banner('Click!','The right door opens');addCoins(10+3*G.t);addXp(6)}
        else{o.bit=true;setTimeout(()=>{o.bit=false},600);const free=useMiss();if(hurt(free?0:1,'door'))break;Ov.message(`Ouch! <b>${o.n}</b> is not ${puz.doors.label}. That door bites.${free?' Your lucky gear kept your heart.':''}`,{title:'Wrong door'})}break}
      case 'chest':{if(o.open)break;
        if(o.locked==='den'&&G.enemies.length){Ov.message('The chest rattles. Beat every monster in the den first!',{title:'Locked chest'});break}
        if(o.locked==='riddle'&&!G.flags.riddle){Ov.message('The chest is sealed by the elder\'s riddle. Talk to the elder.',{title:'Sealed chest'});break}
        o.open=true;Snd.coin();
        if(o.content==='key'){G.keys++;Snd.key();banner('A key!',G.keys>=2?'Both keys found, the boss door awaits':'One more to find');addXp(10)}
        else if(o.content==='coins'){let n=o.amount;if(G.st.nose)n=Math.round(n*1.25);addCoins(n);Ov.message(`The chest holds <b>${n} ${cur}</b>!${G.st.nose?' Your pet sniffed out extra.':''}`,{title:'Treasure!'})}
        else if(o.content==='heart'){G.hearts=G.maxHearts;Snd.glow();Ov.message('A heart potion! Your hearts are full again.',{title:'Refreshing!'})}
        renderHUD();persist();break}
      case 'bossdoor':{if(G.keys>=2){Object.keys(rm.obj).forEach(i=>{const x=rm.obj[i];if(x.type==='bossdoor'){setTile(x.x,x.y,TT.OPEN);delete rm.obj[i]}});Snd.unlock();G.hearts=G.maxHearts;renderHUD();banner('The boss door opens!','A warm glow fills your hearts. Go up!')}
        else Ov.message(`Locked tight. It needs <b>2 keys</b> and you have <b>${G.keys}</b>. One is behind the elder's riddle, the other in the monster den.`,{title:'Boss door'});break}
      case 'cave':{if(G.flags.fork){Ov.message(o.sealed?'This cave is sealed now.':'You already explored the caves.',{title:'Cave'});break}
        Ov.confirm(`Enter this cave? The sign says it holds <b>${o.text}</b>.`,{title:'Cave',yes:'Go in',no:'Not yet',onYes:()=>{G.flags.fork=true;const best=puz.fork.best===o.i;
          Object.values(rm.obj).forEach(x=>{if(x.type==='cave'&&x!==o)x.sealed=true});addCoins(o.value+(best?10:0));
          const other=puz.fork.options.filter((_,j)=>j!==o.i).map(x=>x.value);
          Ov.message(`You gather <b>${o.value} ${cur}</b>.${best?' <b>Sharp eyes!</b> That was the richest cave, so you get 10 extra.':` The other cave${other.length>1?'s':''} held ${other.join(' and ')}.`}`,{title:best?'Best choice!':'Treasure'});addXp(best?8:4);persist()}});break}
      case 'npc':npcTalk(o);break;
      case 'post':{const troll=Object.values(rm.obj).find(x=>x.kind==='troll');if(troll)npcTalk(troll);break}
      default:break}}
  function npcTalk(o){const puz=G.region.puz,cur=curName(G.key),who=o.kind;
    if(o.done){Ov.message(o.doneText||'Thanks for your help, friend!',{title:o.name,who});return}
    const key=o.puzzle;let q=puz[key];
    const titles={riddle:'The Elder',toll:'Bridge Troll',trader:'Trader',brew:'Alchemist',share:'Friends'};
    const verbs={riddle:'Tell the elder',toll:'Pay',trader:'Ask',brew:'Brew',share:'Answer'};
    Ov.pad({title:titles[key]||o.name,who,text:q.text,verb:verbs[key]||'Answer',check:n=>{
      if(n===q.answer){o.done=true;return {ok:true,msg:reward(key,q,o),done:true}}
      o.misses=(o.misses|0)+1;
      if(o.misses>=3){o.misses=0;const ctx={cur,pet:rec().pet?PET_WORDS[rec().pet]:null};puz[key]=q=MQMath[key](G.g,G.t,ctx);return {ok:false,msg:'Not that. Let\'s try different numbers.',text:q.text}}
      return {ok:false,msg:n<q.answer?'Hmm, it\'s more than that.':'Hmm, it\'s less than that.'}}})}
  function reward(key,q,o){const cur=curName(G.key);
    switch(key){
      case 'riddle':G.flags.riddle=true;Snd.unlock();addXp(10);o.doneText='Well reasoned! The chest beside me is open now.';return 'Correct! The key chest unlocks.';
      case 'toll':{const rm=G.room;Object.keys(rm.obj).forEach(i=>{const x=rm.obj[i];if(x.type==='post'||x===o){setTile(x.x,x.y,TT.BRIDGE);delete rm.obj[i]}});Snd.unlock();addCoins(10+2*G.t);addXp(8);return 'Exactly right. The troll lets you cross, and tips you for counting so well.'}
      case 'trader':addCoins(q.answer);addXp(8);o.doneText='Pleasure doing business!';return `A fair deal! Here are your ${q.answer} ${cur}.`;
      case 'brew':{G.hearts=G.maxHearts;addCoins(q.answer*6);addXp(8);renderHUD();o.doneText='The cauldron is empty now. Come back another day!';return `${q.answer} bottles of ${q.potion}! You drink one and your hearts are full, and the rest sell for ${q.answer*6} ${cur}.`}
      case 'share':addCoins(q.answer*3+10);addXp(8);o.doneText='Thanks for sharing fairly!';return `Fair and square! Your share is worth ${q.answer*3+10} ${cur}.`}
    return 'Thank you!'}

  /* ---------- leaving, clearing ---------- */
  function leaveAsk(){Ov.confirm('Leave this region? Keys stay behind, but your coins and anything you cleared are kept.',{title:'Leave?',yes:'Leave',no:'Stay',onYes:()=>leave(),onNo:()=>{G.hero.y=RH-1.2}})}
  function leave(){stop();persist();openMap()}
  function clearRegion(){const r=rec(),k=G.key;G.cleared=true;const first=!r.clears[k];r.clears[k]=1;const bonus=60+20*G.t;addCoins(bonus,true);addXp(60+20*G.t);persist();
    Snd.win();FX.rain(160);LAST_RUN={name:RNAME[k],coins:G.coins,xp:G.xp,battles:G.battles,perfect:G.perfect};
    Ov.clear({name:RNAME[k],bonus,first},()=>{stop();openClear()})}

  /* ---------- rendering ---------- */
  function resize(){const w=stage.clientWidth||600;T=w/RW;const d=DPR();cv.width=Math.round(RW*T*d);cv.height=Math.round(RH*T*d);cx.setTransform(d,0,0,d,0,0);
    heroEl.style.width=(T*1.75)+'px';petEl.style.width=(T*1.05)+'px'}
  function render(){if(!G)return;const t=G.time,tset=ts(),ink=G.ink||(G.ink=cssVar('--ink','#22333B'));cx.clearRect(0,0,RW*T,RH*T);
    let ox=0,oy=0;
    if(G.trans){const k=1-Math.pow(1-G.trans.t,3),d=G.trans.dir,W=RW*T,H=RH*T;const sx=d==='left'?-1:d==='right'?1:0,sy=d==='up'?-1:d==='down'?1:0;
      drawRoom(cx,G.trans.prev,T,tset,t,-sx*W*k,-sy*H*k,ink);ox=sx*W*(1-k);oy=sy*H*(1-k)}
    drawRoom(cx,G.room,T,tset,t,ox,oy,ink);
    cx.save();cx.translate(ox,oy);
    for(const e of G.enemies)drawMonster(cx,e.x*T,e.y*T,e.r*T,e.col,e.shape,t,e.boss,e.hurt>0);
    for(const f of G.fx){f.life-=.016;cx.globalAlpha=clamp(f.life,0,1);cx.fillStyle=f.col;cx.beginPath();cx.arc(f.x*T+f.vx*(1-f.life)*T,f.y*T+f.vy*(1-f.life)*T,f.r*T,0,TAU);cx.fill()}cx.globalAlpha=1;G.fx=G.fx.filter(f=>f.life>0);
    for(const f of G.floats){f.life-=.016;cx.globalAlpha=clamp(f.life*1.5,0,1);label(cx,f.text,f.x*T,(f.y-(1-f.life)*1.2)*T,T*.5,f.col)}cx.globalAlpha=1;G.floats=G.floats.filter(f=>f.life>0);
    cx.restore();
    const h=G.hero,hw=T*1.75,hh=hw*270/290;
    heroEl.style.transform=`translate(${(h.x*T-hw/2+ox).toFixed(1)}px,${(h.y*T-hh*.84+oy).toFixed(1)}px)`;
    heroEl.classList.toggle('walking',h.moving&&!G.trans&&!Ov.isOpen());heroEl.style.opacity=h.inv>0&&Math.floor(t*12)%2?'.5':'1';
    if(!petEl.hidden){const p=G.petPos,dx=h.x-p.x,dy=h.y-p.y,d=Math.hypot(dx,dy);if(d>1.1){p.x+=dx/d*Math.min(d-1,SPD*.9*.016);p.y+=dy/d*Math.min(d-1,SPD*.9*.016)}
      const pw=T*1.05;petEl.style.transform=`translate(${(p.x*T-pw/2+ox).toFixed(1)}px,${(p.y*T-pw*.95+oy).toFixed(1)}px)`}}
  function float(text,x,y,col){G.floats.push({text,x,y,col:col||'#fff',life:1})}
  function splashFx(x,y){for(let i=0;i<14;i++){const a=rand(0,TAU);G.fx.push({x,y,vx:Math.cos(a)*1.4,vy:Math.sin(a)*1.4-.8,r:rand(.06,.14),col:ts().waterHi,life:1})}}
  function popFx(x,y){for(let i=0;i<16;i++){const a=rand(0,TAU);G.fx.push({x,y,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.6,r:rand(.06,.14),col:pickOne(WORLDS[G.key].confetti||RAINBOW),life:1})}}
  function banner(text,sub){const el=$('#banner');el.innerHTML=`<span>${text}</span>${sub?`<br><small>${sub}</small>`:''}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
  function renderHUD(){if(!G)return;$('#hudHearts').innerHTML=Array.from({length:G.maxHearts},(_,i)=>heartSvg.replace('class="heart"','class="heart'+(i<G.hearts?'':' lost')+'"')).join('');
    $('#hudCoins').innerHTML=CUR_ICON[G.key]+' '+rec().coins;$('#hudKeys').innerHTML=keySvg+' '+G.keys+'/2';
    const names={entrance:'Entrance',hall:'Hall',stones:'Stone River',riddle:'Elder\'s Hut',doors:'Door Wall',den:'Monster Den',grove:'Hidden Grove',share:'Share Cave',bossgate:'Boss Gate',boss:'Boss Lair',fork:'Fork Caves',trader:'Trading Post',alchemist:'Alchemist\'s'};
    const rn=names[G.room.tag]||G.room.tag;$('#hudRoom').textContent=rn;
    $('#gameHint').textContent=rn+' · '+(document.body.classList.contains('touch')?'hold the pad to walk · walk into things to use them':'arrow keys or W A S D to walk · walk into things to use them · Esc to pause')}

  /* ---------- input ---------- */
  addEventListener('keydown',e=>{if(screen!=='game')return;if(Ov.isOpen()){if(Ov.key(e))e.preventDefault();return}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){Ov.pause();return}keys[e.key]=true});
  addEventListener('keyup',e=>{keys[e.key]=false});
  addEventListener('blur',()=>{keys={};held={}});
  document.querySelectorAll('#dpad .dp').forEach(b=>{const d=b.getAttribute('data-d');const on=e=>{e.preventDefault();held[d]=true;b.classList.add('held');document.body.classList.add('touch');Snd.init()};const off=()=>{held[d]=false;b.classList.remove('held')};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);b.addEventListener('contextmenu',e=>e.preventDefault())});
  $('#pauseBtn').onclick=()=>{if(G&&!Ov.isOpen())Ov.pause()};
  addEventListener('resize',()=>{if(G)resize()});
  addEventListener('touchstart',()=>document.body.classList.add('touch'),{passive:true,once:true});

  return {start,stop,leave,get G(){return G},rec,resize,renderHUD,hurt,addCoins,
    /* test hooks */
    teleport(tag,x,y){const rm=G.region.byTag[tag];enterRoom(rm.rx,rm.ry,null);G.hero.x=x;G.hero.y=y;lastTile=null;bumpLock=null;G.petPos={x:x-.9,y}},
    press(k,v){keys[k]=v},interact,startBattle,clearRegion,enemies:()=>G.enemies,setKeys(n){G.keys=n;renderHUD()},room:()=>G.room,puz:()=>G.region.puz}
})();
