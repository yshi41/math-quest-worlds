/* ---------- overlays on the stage: signs, choices, pause, found items, region clear ---------- */
const Ov=(()=>{
  const box=$('#overlay');let cur=null,keyFn=null;
  function open(html,cls){box.innerHTML='<div class="ov-card'+(cls?' '+cls:'')+'">'+html+'</div>';box.hidden=false;cur={};keyFn=null;return box.firstElementChild}
  function close(){box.hidden=true;box.innerHTML='';const c=cur;cur=null;keyFn=null;if(c&&c.onClose)c.onClose()}
  function isOpen(){return !box.hidden}
  function message(text,o){o=o||{};const card=open(`<div class="ov-title">${o.title||''}</div><div class="ov-text">${text}</div><div class="ov-row"><button class="btn btn-good" type="button" id="ovOk">${o.btn||'Okay'}</button></div>`);
    cur.onClose=o.onClose;const b=card.querySelector('#ovOk');b.focus();b.onclick=()=>{Snd.click();close()};keyFn=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Escape'||e.key==='z'||e.key==='Z'){b.click();return true}}}
  function confirm(text,o){o=o||{};const card=open(`<div class="ov-title">${o.title||''}</div><div class="ov-text">${text}</div><div class="ov-row"><button class="btn btn-good" type="button" id="ovYes">${o.yes||'Yes'}</button><button class="btn btn-ghost" type="button" id="ovNo">${o.no||'No'}</button></div>`);
    card.querySelector('#ovYes').onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';if(o.onYes)o.onYes()};card.querySelector('#ovNo').onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';if(o.onNo)o.onNo()};
    keyFn=e=>{if(e.key==='Enter'){card.querySelector('#ovYes').click();return true}if(e.key==='Escape'){card.querySelector('#ovNo').click();return true}}}
  function item(it,text,onClose){const card=open(`<div class="ov-title">Found: ${it.name}</div><div class="ov-item">${itemIcon(it)}</div><div class="ov-text">${text}</div><div class="ov-row"><button class="btn btn-good" type="button" id="ovOk">Nice!</button></div>`);
    cur.onClose=onClose;const b=card.querySelector('#ovOk');b.focus();b.onclick=()=>{Snd.click();close()};keyFn=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Escape'){b.click();return true}}}
  function pause(){const r=REC(),G=Game.G;const list=(kind)=>r.inv[kind].slice().sort((a,b)=>ITEM_BY_ID[a].v-ITEM_BY_ID[b].v).map(id=>`<button class="btn btn-sm ${r.equip[kind]===id?'btn-good':'btn-ghost'}" type="button" data-eq="${kind}:${id}">${ITEM_BY_ID[id].v} · ${ITEM_BY_ID[id].name}</button>`).join('');
    const card=open(`<div class="ov-title">Paused</div><div class="ov-row"><button class="btn btn-good btn-big" type="button" id="pzResume">Keep exploring</button></div>
      <div class="pz-gear"><div><b>Melee</b> ${G?'· '+G.st.theme.melee:''}</div><div class="ov-row">${list('melee')}</div><div><b>Ranged</b> ${G?'· '+G.st.theme.ranged:''}</div><div class="ov-row">${list('ranged')}</div></div>
      <div class="ov-row"><button class="btn btn-ghost" type="button" id="pzMap">Leave to the map</button><button class="btn btn-ghost" type="button" id="pzCamp">Back to camp</button></div>`);
    card.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{const [kind,id]=b.getAttribute('data-eq').split(':');r.equip[kind]=id;Game.refreshStats();persist();Snd.tick();pause()});
    card.querySelector('#pzResume').onclick=()=>{Snd.click();close()};card.querySelector('#pzMap').onclick=()=>{Snd.click();cur=null;box.hidden=true;Game.leave()};card.querySelector('#pzCamp').onclick=()=>{Snd.click();cur=null;box.hidden=true;Game.stop();persist();openHub()};
    keyFn=e=>{if(e.key==='Escape'||e.key==='Enter'){card.querySelector('#pzResume').click();return true}}}
  function clear(s,done){const card=open(`<div class="ov-title">${s.name} cleared!</div><div class="ov-text">${s.first?'A new region opens on the map.':'Cleared again!'} Bonus: <b>${s.bonus}</b> coins.</div><div class="ov-row"><button class="btn btn-good btn-big" type="button" id="ovDone">Hooray!</button></div>`);
    const b=card.querySelector('#ovDone');b.onclick=()=>{Snd.click();cur=null;box.hidden=true;box.innerHTML='';done()};keyFn=e=>{if(e.key==='Enter'){b.click();return true}}}
  function key(e){return keyFn?!!keyFn(e):false}
  function onKey(fn){keyFn=fn}
  return {open,close,isOpen,message,confirm,item,pause,clear,key,onKey,get card(){return box.firstElementChild}}
})();
