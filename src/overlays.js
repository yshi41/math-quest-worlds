/* ---------- overlays on the stage: messages, the number pad, choices, pause, battles, region clear ---------- */
const Ov=(()=>{
  const box=$('#overlay');let cur=null,keyFn=null;
  function open(html,cls){box.innerHTML='<div class="ov-card'+(cls?' '+cls:'')+'">'+html+'</div>';box.hidden=false;cur={};keyFn=null;return box.firstElementChild}
  function close(){box.hidden=true;box.innerHTML='';const c=cur;cur=null;keyFn=null;if(c&&c.onClose)c.onClose()}
  function isOpen(){return !box.hidden}
  function whoCanvas(kind){const c=document.createElement('canvas');c.width=160;c.height=160;const x=c.getContext('2d');drawNPC(x,80,86,120,kind,1);return c}
  function message(text,o){o=o||{};const card=open(`<div class="ov-title">${o.title||''}</div>${o.who?'<div class="pd-who"></div>':''}<div class="ov-text">${text}</div><div class="ov-row"><button class="btn btn-good" type="button" id="ovOk">${o.btn||'Okay'}</button></div>`);
    if(o.who)card.querySelector('.pd-who').append(whoCanvas(o.who));cur.onClose=o.onClose;const b=card.querySelector('#ovOk');b.focus();b.onclick=()=>{Snd.click();close()};keyFn=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Escape'){b.click();return true}}}
  function confirm(text,o){o=o||{};const card=open(`<div class="ov-title">${o.title||''}</div><div class="ov-text">${text}</div><div class="ov-row"><button class="btn btn-good" type="button" id="ovYes">${o.yes||'Yes'}</button><button class="btn btn-ghost" type="button" id="ovNo">${o.no||'No'}</button></div>`);
    card.querySelector('#ovYes').onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';if(o.onYes)o.onYes()};card.querySelector('#ovNo').onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';if(o.onNo)o.onNo()};
    keyFn=e=>{if(e.key==='Enter'){card.querySelector('#ovYes').click();return true}if(e.key==='Escape'){card.querySelector('#ovNo').click();return true}}}
  /* a number pad conversation: check(n) returns {ok,msg,done,text} */
  function pad(o){const card=open(`<div class="ov-title">${o.title}</div><div class="pd-who"></div><div class="ov-text" id="padText">${o.text}</div><div class="pad-val" id="padVal">&nbsp;</div>
    <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" data-k="${n}">${n}</button>`).join('')}<button type="button" data-k="bs" aria-label="Delete">⌫</button><button type="button" data-k="0">0</button><button type="button" class="go" data-k="go" aria-label="${o.verb}">✓</button></div>
    <div class="ov-msg" id="padMsg"></div><div class="ov-row"><button class="btn btn-ghost btn-sm" type="button" id="padLater">Come back later</button></div>`);
    card.querySelector('.pd-who').append(whoCanvas(o.who));let val='';const vEl=card.querySelector('#padVal'),mEl=card.querySelector('#padMsg');let locked=false;
    const draw=()=>{vEl.textContent=val||' '};
    const submit=()=>{if(locked||!val)return;const n=parseInt(val,10);const r=o.check(n);mEl.textContent=r.msg||'';mEl.className='ov-msg '+(r.ok?'good':'bad');
      if(r.ok){locked=true;Snd.pop(3);setTimeout(()=>{close()},1400)}else{Snd.wrong();val='';draw();if(r.text)card.querySelector('#padText').innerHTML=r.text}};
    const key=k=>{if(locked)return;Snd.tick();if(k==='bs')val=val.slice(0,-1);else if(k==='go'){submit();return}else if(val.length<5)val+=k;draw()};
    card.querySelectorAll('.pad button').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();key(b.getAttribute('data-k'))})});
    card.querySelector('#padLater').onclick=()=>{Snd.click();close()};
    keyFn=e=>{if(/^[0-9]$/.test(e.key)){key(e.key);return true}if(e.key==='Backspace'){key('bs');return true}if(e.key==='Enter'){key('go');return true}if(e.key==='Escape'){close();return true}};
    cur.submit=n=>{val=String(n);draw();submit()}}
  function pause(){const card=open(`<div class="ov-title">Paused</div><div class="ov-row"><button class="btn btn-good btn-big" type="button" id="pzResume">Keep exploring</button></div><div class="ov-row"><button class="btn btn-ghost" type="button" id="pzMap">Leave to the map</button><button class="btn btn-ghost" type="button" id="pzCamp">Back to camp</button></div>`);
    card.querySelector('#pzResume').onclick=()=>{Snd.click();close()};card.querySelector('#pzMap').onclick=()=>{Snd.click();cur=null;box.hidden=true;Game.leave()};card.querySelector('#pzCamp').onclick=()=>{Snd.click();cur=null;box.hidden=true;Game.stop();persist();openHub()};
    keyFn=e=>{if(e.key==='Escape'||e.key==='Enter'){card.querySelector('#pzResume').click();return true}}}
  function clear(s,done){const card=open(`<div class="ov-title">${s.name} cleared!</div><div class="ov-text">${s.first?'A new region opens on the map.':'Cleared again!'} Bonus: <b>${s.bonus}</b> coins.</div><div class="ov-row"><button class="btn btn-good btn-big" type="button" id="ovDone">Hooray!</button></div>`);
    const b=card.querySelector('#ovDone');b.onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';done()};keyFn=e=>{if(e.key==='Enter'){b.click();return true}}}
  function key(e){return keyFn?!!keyFn(e):false}
  function onKey(fn){keyFn=fn}
  return {open,close,isOpen,message,confirm,pad,pause,clear,key,onKey,submit:n=>{if(cur&&cur.submit)cur.submit(n)},get card(){return box.firstElementChild}}
})();

/* a turn-based battle: the monster shows its HP once, then the hero's hits are listed and the kid keeps the total */
const Battle=(()=>{
  let B=null;
  function start(enemy,info,done){B={e:enemy,info,done,dealt:0,hits:[],armed:false,dblUsed:false,first:true,guard:info.st.guard,hearts:info.hearts,maxHearts:info.maxHearts,over:false,turn:'hero'};
    const card=Ov.open(`<div class="bt-top"><canvas class="bt-mon" width="220" height="220"></canvas><div class="bt-info"><div class="bt-name">${info.name}</div><div class="bt-sub" id="btSub">${info.boss?'Boss! ':''}<b>${info.hp} HP</b> · hits for ${info.power}</div><div class="bar bt-hp"><i id="btHp" style="width:100%"></i></div><div class="bt-trail" id="btTrail"></div></div></div>
      <div class="bt-hero"><span id="btHearts" class="hearts"></span><span id="btBlock"></span></div><div class="ov-msg" id="btMsg">${info.boss?'The boss roars! Pick your move.':'What\'s your move?'}</div>
      <div class="bt-moves" id="btMoves">${info.moves.map((m,i)=>`<button class="mv-btn" type="button" data-i="${i}">${m}<small>${['Jab','Swipe','Slam'][i]} · ${i+1}</small></button>`).join('')}${info.allowDouble?'<button class="mv-btn dbl" type="button" data-i="dbl">×2<small>Double next · 4</small></button>':''}</div>`,'bt');
    B.card=card;paint();renderHearts();
    card.querySelectorAll('.mv-btn').forEach(b=>b.onclick=()=>{const i=b.getAttribute('data-i');if(i==='dbl')arm();else pick(+i)});
    Ov.onKey(e=>{if(!B||B.over)return false;if(/^[1-3]$/.test(e.key)){pick(+e.key-1);return true}if(e.key==='4'&&info.allowDouble){arm();return true}return false});
    Snd.bossHit()}
  function paint(){const c=B.card.querySelector('.bt-mon'),x=c.getContext('2d');x.clearRect(0,0,220,220);drawMonster(x,110,112,B.info.boss?62:54,B.info.col,B.info.shape,performance.now()/1000,B.info.boss,B.e.hurt>0)}
  function renderHearts(){B.card.querySelector('#btHearts').innerHTML=Array.from({length:B.maxHearts},(_,i)=>heartSvg.replace('class="heart"','class="heart'+(i<B.hearts?'':' lost')+'"')).join('');
    B.card.querySelector('#btBlock').textContent=B.info.st.block?'shield blocks '+B.info.st.block:''}
  function arm(){if(B.dblUsed||B.turn!=='hero')return;B.armed=!B.armed;Snd.tick();B.card.querySelector('.mv-btn.dbl').classList.toggle('armed',B.armed);msg(B.armed?'Double is ready. Pick the move to double.':'What\'s your move?')}
  function msg(t,cls){const m=B.card.querySelector('#btMsg');m.innerHTML=t;m.className='ov-msg '+(cls||'')}
  function setButtons(on){B.card.querySelectorAll('.mv-btn').forEach(b=>{b.disabled=!on||(b.getAttribute('data-i')==='dbl'&&B.dblUsed)})}
  function pick(i){if(B.turn!=='hero'||B.over)return;let d=B.info.moves[i];if(B.armed){d*=2;B.armed=false;B.dblUsed=true;const db=B.card.querySelector('.mv-btn.dbl');if(db)db.classList.remove('armed')}
    B.dealt+=d;B.hits.push(d);B.e.hurt=.5;Snd.hit();B.turn='monster';setButtons(false);
    const tr=B.card.querySelector('#btTrail');tr.innerHTML=B.hits.map(h=>`<span>${h}</span>`).join('');
    B.card.querySelector('#btHp').style.width=Math.max(0,100*(1-B.dealt/B.info.hp)).toFixed(1)+'%';paint();
    if(B.dealt>=B.info.hp){const perfect=B.dealt===B.info.hp;B.over=true;
      msg(perfect?`<b>Exactly ${B.info.hp}!</b> A perfect finish, double loot!`:`${B.info.name} is down, but you hit ${B.dealt - B.info.hp} too hard and the loot scattered.`,perfect?'good':'');
      if(perfect){Snd.special();FX.burst(innerWidth/2,innerHeight*.4,70)}else Snd.pop(2);
      setTimeout(()=>finish({won:true,perfect,overkill:!perfect}),perfect?1500:1300);return}
    B.wind=!B.wind;
    if(B.wind){msg(`Hit for ${d}. ${B.info.name} winds up for a big swing… your move!`);setTimeout(()=>{if(!B||B.over)return;B.turn='hero';setButtons(true)},500);return}
    msg(`Hit for ${d}. ${B.info.name} strikes back…`);
    setTimeout(monsterTurn,650)}
  function monsterTurn(){if(!B||B.over)return;const st=B.info.st;let dmg=Math.max(0,B.info.power-st.block),note='';
    if(B.first&&st.dodge){dmg=0;note='Swift Boots! The hit misses.'}else if(B.guard){B.guard=false;dmg=0;note='Your pet blocks the hit!'}else if(dmg===0)note='Your shield takes the whole hit.';else note=`Ouch, ${dmg} heart${dmg>1?'s':''} lost.`;
    B.first=false;
    if(dmg>0){B.hearts=Math.max(0,B.hearts-dmg);Snd.wrong();const he=B.card.querySelector('#btHearts');he.classList.remove('shake');void he.offsetWidth;he.style.animation='shake .5s'}else Snd.swish();
    renderHearts();
    if(B.hearts<=0){B.over=true;msg(note+' You can\'t go on…','bad');setTimeout(()=>finish({won:false,fainted:true}),1200);return}
    msg(note+' Your move.');B.turn='hero';setButtons(true)}
  function finish(res){const b=B;B=null;Ov.close();res.enemy=b.e;res.hearts=b.hearts;b.done(res)}
  return {start,pick,arm,get B(){return B}}
})();
