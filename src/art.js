/* ---------- drawing: heroes (from Spelling Worlds), gear, pets, monsters, NPCs and map tiles ---------- */
let heroCount=0;
const PIECE_FN={lagoon:lagoonPieces,candy:candyPieces,canopy:canopyPieces,ocean:oceanPieces,bows:bowsPieces,boba:bobaPieces,birds:birdsPieces,cheer:cheerPieces};
/* a Spelling Worlds character wearing the given outfit levels (world pieces 1-10 and shared accessories 24-66) */
function heroSVG(k,ch,wear,mood,opts){opts=opts||{};wear=wear||[];const p='mq'+(++heroCount);
  const d=(DRAW[ch]||DRAW.axolotl)(K_INK);
  if(opts.plain)return '<svg class="axo" viewBox="'+(opts.viewBox||'-15 -15 290 270')+'" data-mood="'+(mood||'neutral')+'" aria-hidden="true">'+d.back+d.main+'</svg>';
  const pc=(PIECE_FN[k]||lagoonPieces)(p);
  let behind='',front='';SHARED_ACC.forEach(a=>{const gg='<g class="acc fx-acc" data-lv="'+a.lv+'" data-slot="'+a.slot+'">'+a.d(p)+'</g>';if(a.back)behind+=gg;else front+=gg});
  let s='<svg class="axo" viewBox="'+(opts.viewBox||'-15 -15 290 270')+'" data-mood="'+(mood||'neutral')+'" aria-hidden="true"><defs><clipPath id="'+p+'-hat"><path d="M130 6 L100 64 L160 64 Z"/></clipPath><clipPath id="'+p+'-cape"><path d="'+pc.capePath+'"/></clipPath></defs>'
    +pc.glow+behind+d.back+pc.behind+d.main+pc.front+front+(opts.gear||'')+'</svg>';
  if(wear.length)s=s.replace(/<g class="acc ([^"]*)" data-lv="(\d+)"/g,(m,cls,lv)=>wear.indexOf(+lv)>=0?'<g class="acc '+cls+' on" data-lv="'+lv+'"':m);
  return s}
/* useful gear drawn on the hero: the weapon in the right hand, the shield at the left side */
const WEAPON_ART={
  w0:'<path d="M190 204 L230 150" stroke="#8B5A2B" stroke-width="6" stroke-linecap="round"/><ellipse cx="224" cy="156" rx="8" ry="4.5" fill="#5CC97A" transform="rotate(-45 224 156)"/>',
  w1:'<path d="M190 204 L226 158" stroke="#2FAFC4" stroke-width="6" stroke-linecap="round"/><circle cx="231" cy="150" r="13" fill="rgba(190,238,248,.8)" stroke="#7ED4E6" stroke-width="3"/><circle cx="226" cy="145" r="3.5" fill="#fff"/>',
  w2:'<path d="M198 196 L234 140 L242 148 L206 204 Z" fill="#FF8FA8" stroke="#E0558A" stroke-width="2" stroke-linejoin="round"/><path d="M188 192 L214 214" stroke="#F2C94C" stroke-width="6" stroke-linecap="round"/><path d="M186 210 L200 194" stroke="#8B5A2B" stroke-width="7" stroke-linecap="round"/>',
  w3:'<path d="M190 206 L226 162" stroke="#8B5A2B" stroke-width="7" stroke-linecap="round"/><rect x="212" y="136" width="36" height="28" rx="6" fill="#5B6B7C" stroke="#3A4756" stroke-width="2.5" transform="rotate(-50 230 150)"/><path d="M226 158 l5 -8 l-4 0 l5 -8" stroke="#FFE24A" stroke-width="3" fill="none" stroke-linecap="round"/>',
  w4:'<path d="M200 194 L238 136 L246 144 L208 202 Z" fill="#7CD4FF" stroke="#3B66E6" stroke-width="2" stroke-linejoin="round"/><path d="M186 212 L202 194" stroke="#2B4FB8" stroke-width="7" stroke-linecap="round"/>'+'<polygon points="200,186 204,194 213,195 206,201 208,210 200,205 192,210 194,201 187,195 196,194" fill="#FFE24A"/>',
  w5:'<path d="M182 214 L246 134" stroke="#C8324B" stroke-width="6" stroke-linecap="round"/><polygon points="246,134 258,122 250,146" fill="#F2C94C" stroke="#D9A72E" stroke-width="2"/><path d="M230 154 q-6 14 -2 24 M230 154 q4 14 -6 22" stroke="#FFD23F" stroke-width="3" fill="none" stroke-linecap="round"/>'};
const SHIELD_ART={
  s1:'<circle cx="56" cy="198" r="22" fill="#5E9A4E" stroke="#3F6E36" stroke-width="4"/><ellipse cx="56" cy="198" rx="7" ry="13" fill="#9CC23A" transform="rotate(-30 56 198)"/>',
  s2:'<circle cx="56" cy="198" r="22" fill="#F2C94C" stroke="#D9A72E" stroke-width="4"/><path d="M44 206 q12 -26 24 0 M50 206 q6 -16 12 0" stroke="#D9A72E" stroke-width="3" fill="none"/>',
  s3:'<circle cx="56" cy="198" r="22" fill="#3B66E6" stroke="#2B4FB8" stroke-width="4"/><polygon points="56,184 60,194 71,194 62,200 65,211 56,204 47,211 50,200 41,194 52,194" fill="#FFE24A"/>'};
function gearSVG(gear){let s='';if(!gear)return s;if(gear.weapon&&WEAPON_ART[gear.weapon])s+=WEAPON_ART[gear.weapon];if(gear.shield&&SHIELD_ART[gear.shield])s+=SHIELD_ART[gear.shield];return s}
const CHARM_ART={
  c1:'<path d="M32 56 C8 40 8 14 24 10 C30 8 34 14 32 18 C30 14 34 8 40 10 C56 14 56 40 32 56Z" fill="#FF5C8A"/>',
  c2:'<path d="M32 58 C4 40 4 10 22 6 C29 4 34 12 32 16 C30 12 35 4 42 6 C60 10 60 40 32 58Z" fill="#E0338A"/><circle cx="20" cy="22" r="4" fill="#fff" opacity=".8"/>',
  c3:'<path d="M14 54 C14 28 30 8 52 8 C50 32 36 50 14 54Z" fill="#FF9A3C"/><path d="M14 54 L44 16" stroke="#E07A2E" stroke-width="3"/><path d="M18 46 l10 -2 M24 36 l10 -2 M30 28 l8 -2" stroke="#FFD23F" stroke-width="2.5"/>'};
const BOOTS_ART={
  b1:'<path d="M20 10 h18 v24 h12 a8 8 0 0 1 0 16 H20Z" fill="#5E9A4E" stroke="#3F6E36" stroke-width="3" stroke-linejoin="round"/><path d="M24 20 h10 M24 28 h10" stroke="#9CC23A" stroke-width="3"/>',
  b2:'<path d="M20 10 h18 v24 h12 a8 8 0 0 1 0 16 H20Z" fill="#3B66E6" stroke="#2B4FB8" stroke-width="3" stroke-linejoin="round"/><path d="M8 22 q10 -8 14 2 M6 30 q10 -8 14 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>',
  b3:'<path d="M20 10 h18 v24 h12 a8 8 0 0 1 0 16 H20Z" fill="#E8476B" stroke="#B3243F" stroke-width="3" stroke-linejoin="round"/><path d="M10 40 q6 -10 2 -18 q10 6 6 18" fill="#FFD23F"/>'};
function gearIcon(it){if(it.slot==='weapon')return '<svg class="gi" viewBox="176 118 86 104" aria-hidden="true">'+WEAPON_ART[it.id]+'</svg>';
  if(it.slot==='shield')return '<svg class="gi" viewBox="28 170 56 56" aria-hidden="true">'+SHIELD_ART[it.id]+'</svg>';
  if(it.slot==='charm')return '<svg class="gi" viewBox="0 0 64 64" aria-hidden="true">'+CHARM_ART[it.id]+'</svg>';
  return '<svg class="gi" viewBox="0 0 64 64" aria-hidden="true">'+BOOTS_ART[it.id]+'</svg>'}

/* pets: six little companions in a 120 by 120 box, with cosmetic accessories and a useful tag on the collar */
function petEyes(lx,rx,y,r,K){r=r||4;K=K||'#2A2024';return '<circle cx="'+lx+'" cy="'+y+'" r="'+r+'" fill="'+K+'"/><circle cx="'+(lx+1.4)+'" cy="'+(y-1.4)+'" r="'+(r*.4)+'" fill="#fff"/><circle cx="'+rx+'" cy="'+y+'" r="'+r+'" fill="'+K+'"/><circle cx="'+(rx+1.4)+'" cy="'+(y-1.4)+'" r="'+(r*.4)+'" fill="#fff"/>'}
const PET_ART={
  pup:()=>'<path d="M86 80 q16 -10 10 -24" stroke="#E3B57A" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="84" rx="30" ry="24" fill="#E3B57A"/><ellipse cx="46" cy="104" rx="10" ry="6" fill="#F0CC96"/><ellipse cx="74" cy="104" rx="10" ry="6" fill="#F0CC96"/><ellipse cx="33" cy="50" rx="10" ry="18" fill="#B98350" transform="rotate(14 33 50)"/><ellipse cx="87" cy="50" rx="10" ry="18" fill="#B98350" transform="rotate(-14 87 50)"/><circle cx="60" cy="50" r="28" fill="#E3B57A"/><ellipse cx="60" cy="61" rx="14" ry="10" fill="#F6E1C0"/><ellipse cx="60" cy="57" rx="5" ry="3.5" fill="#3A2A22"/><path d="M54 64 q6 5 12 0" stroke="#3A2A22" stroke-width="2" fill="none" stroke-linecap="round"/>'+petEyes(50,70,47),
  kit:()=>'<path d="M88 86 q18 -4 16 -22" stroke="#B8B8C8" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="84" rx="28" ry="23" fill="#B8B8C8"/><ellipse cx="60" cy="90" rx="14" ry="12" fill="#E8E8F0"/><path d="M38 40 L32 12 L54 30 Z M82 40 L88 12 L66 30 Z" fill="#B8B8C8"/><path d="M40 36 L36 20 L50 31 Z M80 36 L84 20 L70 31 Z" fill="#FFB6C8"/><circle cx="60" cy="52" r="26" fill="#B8B8C8"/><path d="M52 30 q8 -6 16 0 M48 36 q12 -8 24 0" stroke="#8E8EA6" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="62" rx="4" ry="3" fill="#FF8FA8"/><path d="M60 65 q-5 5 -9 2 M60 65 q5 5 9 2" stroke="#3A2A22" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M26 58 l16 2 M26 66 l16 -1 M94 58 l-16 2 M94 66 l-16 -1" stroke="#8E8EA6" stroke-width="2" stroke-linecap="round"/>'+petEyes(50,70,50),
  bun:()=>'<ellipse cx="47" cy="22" rx="9" ry="21" fill="#F4F2F0" stroke="#E2DCD6" stroke-width="2" transform="rotate(-8 47 22)"/><ellipse cx="73" cy="22" rx="9" ry="21" fill="#F4F2F0" stroke="#E2DCD6" stroke-width="2" transform="rotate(8 73 22)"/><ellipse cx="47" cy="24" rx="4" ry="14" fill="#FFC9D6" transform="rotate(-8 47 24)"/><ellipse cx="73" cy="24" rx="4" ry="14" fill="#FFC9D6" transform="rotate(8 73 24)"/><ellipse cx="60" cy="86" rx="30" ry="24" fill="#F4F2F0" stroke="#E2DCD6" stroke-width="2"/><circle cx="88" cy="96" r="9" fill="#fff"/><ellipse cx="48" cy="106" rx="10" ry="5" fill="#fff"/><ellipse cx="72" cy="106" rx="10" ry="5" fill="#fff"/><circle cx="60" cy="54" r="27" fill="#F4F2F0" stroke="#E2DCD6" stroke-width="2"/><ellipse cx="60" cy="62" rx="4" ry="3" fill="#FF8FA8"/><path d="M60 65 q-5 4 -8 1 M60 65 q5 4 8 1" stroke="#3A2A22" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="44" cy="62" r="5" fill="#FFB6C8" opacity=".6"/><circle cx="76" cy="62" r="5" fill="#FFB6C8" opacity=".6"/>'+petEyes(51,69,52),
  hoot:()=>'<path d="M48 22 L40 6 L56 16 Z M72 22 L80 6 L64 16 Z" fill="#6B4E36"/><ellipse cx="60" cy="72" rx="32" ry="36" fill="#8B6A4A"/><ellipse cx="32" cy="76" rx="10" ry="22" fill="#6B4E36" transform="rotate(12 32 76)"/><ellipse cx="88" cy="76" rx="10" ry="22" fill="#6B4E36" transform="rotate(-12 88 76)"/><ellipse cx="60" cy="86" rx="18" ry="18" fill="#D9BC95"/><path d="M50 84 q10 8 20 0 M52 94 q8 7 16 0" stroke="#B89A72" stroke-width="2" fill="none"/><circle cx="48" cy="50" r="14" fill="#fff"/><circle cx="72" cy="50" r="14" fill="#fff"/><circle cx="48" cy="50" r="12" fill="#FFF6DC"/><circle cx="72" cy="50" r="12" fill="#FFF6DC"/>'+petEyes(49,73,51,6)+'<path d="M55 62 L65 62 L60 72 Z" fill="#F2A54A"/><path d="M50 108 l-4 6 M54 108 l0 7 M66 108 l0 7 M70 108 l4 6" stroke="#F2A54A" stroke-width="3" stroke-linecap="round"/>',
  blob:()=>'<path d="M28 98 Q18 60 44 42 Q60 26 80 44 Q100 62 92 98 Z" fill="#8BD16B" opacity=".92"/><path d="M28 98 Q24 70 40 56" stroke="#fff" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/><ellipse cx="44" cy="54" rx="7" ry="10" fill="#fff" opacity=".45"/><path d="M50 72 q10 10 20 0" stroke="#2A4A1F" stroke-width="3" fill="none" stroke-linecap="round"/>'+petEyes(50,70,62,5,'#2A4A1F'),
  drako:()=>'<path d="M30 70 Q6 56 18 34 Q30 48 40 56Z M90 70 Q114 56 102 34 Q90 48 80 56Z" fill="#4A9F62"/><path d="M88 92 q20 2 24 -14 q-10 2 -14 -4" fill="#5FBF7A"/><ellipse cx="60" cy="84" rx="28" ry="24" fill="#5FBF7A"/><ellipse cx="60" cy="90" rx="16" ry="14" fill="#D8F2B8"/><path d="M48 32 L42 10 L56 26 Z M72 32 L78 10 L64 26 Z" fill="#F2C94C"/><circle cx="60" cy="52" r="26" fill="#5FBF7A"/><ellipse cx="60" cy="63" rx="12" ry="8" fill="#8CD69F"/><circle cx="55" cy="62" r="2" fill="#2A4A1F"/><circle cx="65" cy="62" r="2" fill="#2A4A1F"/><path d="M52 70 q8 6 16 0" stroke="#2A4A1F" stroke-width="2" fill="none" stroke-linecap="round"/>'+petEyes(50,70,50)};
const PET_ACC_ART={
  pc1:'<ellipse cx="50" cy="20" rx="10" ry="6" fill="#E8476B" transform="rotate(-18 50 20)"/><ellipse cx="70" cy="20" rx="10" ry="6" fill="#E8476B" transform="rotate(18 70 20)"/><circle cx="60" cy="21" r="4" fill="#B3243F"/>',
  pc8:'<circle cx="68" cy="18" r="4.5" fill="#FF7EB6"/><circle cx="76" cy="24" r="4.5" fill="#FF7EB6"/><circle cx="73" cy="33" r="4.5" fill="#FF7EB6"/><circle cx="63" cy="33" r="4.5" fill="#FF7EB6"/><circle cx="60" cy="24" r="4.5" fill="#FF7EB6"/><circle cx="68" cy="26" r="4" fill="#FFD23F"/>',
  pc2:'<path d="M60 -2 L46 28 L74 28 Z" fill="#7CD4FF"/><path d="M52 15 L68 11 M49 22 L71 18" stroke="#FF7A98" stroke-width="4"/><circle cx="60" cy="0" r="5" fill="#FFD23F"/>',
  pc7:'<path d="M66 -6 L44 30 L84 30 Z" fill="#5B4BD6"/><ellipse cx="62" cy="30" rx="26" ry="5" fill="#4839B3"/><polygon points="62,8 64,14 70,14 65,18 67,24 62,20 57,24 59,18 54,14 60,14" fill="#FFE24A"/>',
  pc6:'<path d="M44 30 L44 10 L52 20 L60 6 L68 20 L76 10 L76 30 Z" fill="#FFD23F" stroke="#E0A000" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="24" r="3" fill="#FF5C8A"/>',
  pc3:'<rect x="38" y="74" width="44" height="9" rx="4.5" fill="#3B66E6"/><polygon points="60,70 62,77 69,77 63,81 65,88 60,84 55,88 57,81 51,77 58,77" fill="#FFE24A"/>',
  pc4:'<path d="M36 72 q24 14 48 0 l2 10 q-26 14 -52 0 Z" fill="#E07A2E"/><path d="M74 80 l6 24 l-12 0 l0 -20 Z" fill="#E07A2E"/><path d="M44 78 q16 8 32 0 M70 92 l8 -1 M70 98 l8 -1" stroke="#FFD23F" stroke-width="3" fill="none"/>',
  pc5:'<rect x="38" y="42" width="19" height="13" rx="5" fill="#2A2024"/><rect x="63" y="42" width="19" height="13" rx="5" fill="#2A2024"/><path d="M57 47 L63 47 M30 46 L38 46 M82 46 L90 46" stroke="#2A2024" stroke-width="3"/><path d="M42 46 l6 -2" stroke="#fff" stroke-width="2" opacity=".6"/>'};
const PET_TAG_ART={
  t1:'<circle cx="60" cy="88" r="7" fill="#F2C94C" stroke="#D9A72E" stroke-width="2"/><circle cx="60" cy="92" r="2" fill="#9A6A10"/>',
  t2:'<ellipse cx="60" cy="88" rx="8" ry="6" fill="#8B5A2B"/><circle cx="57" cy="86" r="2" fill="#fff" opacity=".6"/>',
  t3:'<path d="M52 82 h16 v10 a8 8 0 0 1 -16 0 Z" fill="#8B5A2B" stroke="#5E3A1B" stroke-width="2"/><path d="M54 82 q6 -6 12 0" stroke="#5E3A1B" stroke-width="2" fill="none"/>',
  t4:'<circle cx="60" cy="90" r="4.5" fill="#FF7EB6"/><circle cx="54" cy="84" r="2.3" fill="#FF7EB6"/><circle cx="58" cy="81" r="2.3" fill="#FF7EB6"/><circle cx="63" cy="81" r="2.3" fill="#FF7EB6"/><circle cx="67" cy="84" r="2.3" fill="#FF7EB6"/>',
  t5:'<path d="M52 82 h16 v9 q0 7 -8 10 q-8 -3 -8 -10 Z" fill="#3B66E6" stroke="#2B4FB8" stroke-width="2"/><path d="M56 89 l3 3 l6 -6" stroke="#fff" stroke-width="2" fill="none"/>'};
function petSVG(id,wear,tag,opts){opts=opts||{};const art=PET_ART[id]||PET_ART.pup;let s=art();
  (wear||[]).forEach(w=>{if(PET_ACC_ART[w])s+=PET_ACC_ART[w]});
  if(tag&&PET_TAG_ART[tag])s+=PET_TAG_ART[tag];
  return '<svg class="pet'+(opts.cls?' '+opts.cls:'')+'" viewBox="0 -8 120 128" aria-hidden="true">'+s+'</svg>'}

/* ---------- canvas drawing for the rooms ---------- */
const TAU2=Math.PI*2;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function label(c,text,x,y,size,col,halo){c.font='700 '+Math.round(size)+'px Fredoka, Nunito, sans-serif';c.textAlign='center';c.textBaseline='middle';
  if(halo!==false){c.lineWidth=Math.max(3,size*.22);c.strokeStyle='rgba(255,255,255,.92)';c.lineJoin='round';c.strokeText(text,x,y)}c.fillStyle=col||'#22333B';c.fillText(text,x,y)}
function drawPlant(c,kind,x,y,T,ts){const cx=x+T/2,by=y+T*.92;c.save();
  if(kind==='tree'){c.fillStyle='#8B5A2B';rr(c,cx-T*.08,by-T*.4,T*.16,T*.4,2);c.fill();c.fillStyle=ts.plantDk;c.beginPath();c.arc(cx,y+T*.42,T*.4,0,TAU2);c.fill();c.fillStyle=ts.plant;c.beginPath();c.arc(cx-T*.08,y+T*.36,T*.3,0,TAU2);c.fill()}
  else if(kind==='gumdrop'){c.fillStyle=ts.plantDk;rr(c,x+T*.12,y+T*.18,T*.76,T*.74,T*.3);c.fill();c.fillStyle=ts.plant;rr(c,x+T*.18,y+T*.14,T*.64,T*.66,T*.28);c.fill();c.fillStyle='rgba(255,255,255,.8)';[[.3,.4],[.6,.3],[.5,.6],[.72,.58]].forEach(p=>{c.beginPath();c.arc(x+T*p[0],y+T*p[1],T*.05,0,TAU2);c.fill()})}
  else if(kind==='coral'){c.strokeStyle=ts.plant;c.lineCap='round';c.lineWidth=T*.16;[[-.26,.3],[0,.12],[.26,.3]].forEach(p=>{c.beginPath();c.moveTo(cx,by);c.lineTo(cx+T*p[0],y+T*p[1]);c.stroke()});c.strokeStyle=ts.plantDk;c.lineWidth=T*.07;c.beginPath();c.moveTo(cx,by);c.lineTo(cx,y+T*.5);c.stroke()}
  else if(kind==='fern'){c.strokeStyle=ts.plant;c.lineCap='round';c.lineWidth=T*.09;[-.34,-.17,0,.17,.34].forEach(d=>{c.beginPath();c.moveTo(cx,by);c.quadraticCurveTo(cx+d*T*1.2,y+T*.5,cx+d*T*1.4,y+T*.18);c.stroke()})}
  else if(kind==='bow'){c.fillStyle=ts.plant;c.beginPath();c.moveTo(cx,y+T*.5);c.lineTo(x+T*.1,y+T*.2);c.lineTo(x+T*.1,y+T*.8);c.closePath();c.fill();c.beginPath();c.moveTo(cx,y+T*.5);c.lineTo(x+T*.9,y+T*.2);c.lineTo(x+T*.9,y+T*.8);c.closePath();c.fill();c.fillStyle=ts.plantDk;c.beginPath();c.arc(cx,y+T*.5,T*.14,0,TAU2);c.fill()}
  else if(kind==='cup'){c.fillStyle='#F6E7D3';rr(c,x+T*.24,y+T*.22,T*.52,T*.66,T*.08);c.fill();c.fillStyle=ts.plantDk;[[.36,.74],[.5,.78],[.64,.74],[.43,.62]].forEach(p=>{c.beginPath();c.arc(x+T*p[0],y+T*p[1],T*.06,0,TAU2);c.fill()});c.strokeStyle=ts.plant;c.lineWidth=T*.08;c.beginPath();c.moveTo(cx+T*.08,y+T*.3);c.lineTo(cx+T*.18,y+T*.02);c.stroke()}
  else if(kind==='pom'){c.strokeStyle=ts.plant;c.lineCap='round';c.lineWidth=T*.08;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.strokeStyle=i%2?ts.plant:ts.bloom;c.beginPath();c.moveTo(cx,y+T*.5);c.lineTo(cx+Math.cos(a)*T*.38,y+T*.5+Math.sin(a)*T*.38);c.stroke()}}
  c.restore()}
function drawNPC(c,cx,cy,T,kind,t){c.save();const bob=Math.sin(t*2.2)*T*.03;const col={trader:'#E07A2E',alchemist:'#7B4BD6',elder:'#8A6A4A',friends:'#2FAFC4',troll:'#5E9A4E'}[kind]||'#888';
  c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(cx,cy+T*.42,T*.34,T*.1,0,0,TAU2);c.fill();
  if(kind==='friends'){[[-.22,0],[.22,.02]].forEach((p,i)=>{const fx=cx+p[0]*T,fy=cy+p[1]*T+bob;c.fillStyle=i?'#F0468C':'#2FAFC4';c.beginPath();c.ellipse(fx,fy+T*.18,T*.17,T*.2,0,0,TAU2);c.fill();c.fillStyle='#FFE0C8';c.beginPath();c.arc(fx,fy-T*.08,T*.15,0,TAU2);c.fill();c.fillStyle='#22333B';c.beginPath();c.arc(fx-T*.05,fy-T*.1,T*.025,0,TAU2);c.arc(fx+T*.05,fy-T*.1,T*.025,0,TAU2);c.fill()});c.restore();return}
  c.fillStyle=col;c.beginPath();c.ellipse(cx,cy+T*.14+bob,T*.28,T*.3,0,0,TAU2);c.fill();
  c.fillStyle=kind==='troll'?'#8BC46B':'#FFE0C8';c.beginPath();c.arc(cx,cy-T*.16+bob,T*.24,0,TAU2);c.fill();
  c.fillStyle='#22333B';c.beginPath();c.arc(cx-T*.08,cy-T*.18+bob,T*.035,0,TAU2);c.arc(cx+T*.08,cy-T*.18+bob,T*.035,0,TAU2);c.fill();
  c.strokeStyle='#22333B';c.lineWidth=Math.max(1.5,T*.04);c.lineCap='round';c.beginPath();
  if(kind==='troll'){c.moveTo(cx-T*.08,cy-T*.04+bob);c.lineTo(cx+T*.08,cy-T*.06+bob)}else{c.moveTo(cx-T*.07,cy-T*.07+bob);c.quadraticCurveTo(cx,cy-T*.01+bob,cx+T*.07,cy-T*.07+bob)}c.stroke();
  if(kind==='trader'){c.fillStyle='#8B5A2B';rr(c,cx-T*.28,cy-T*.44+bob,T*.56,T*.1,3);c.fill();rr(c,cx-T*.18,cy-T*.6+bob,T*.36,T*.2,4);c.fill()}
  else if(kind==='alchemist'){c.fillStyle='#5B4BD6';c.beginPath();c.moveTo(cx-T*.3,cy-T*.34+bob);c.lineTo(cx+T*.3,cy-T*.34+bob);c.lineTo(cx+T*.06,cy-T*.82+bob);c.closePath();c.fill();c.fillStyle='#FFE24A';c.beginPath();c.arc(cx+T*.02,cy-T*.52+bob,T*.05,0,TAU2);c.fill()}
  else if(kind==='elder'){c.fillStyle='#F4F2F0';c.beginPath();c.ellipse(cx,cy+T*.02+bob,T*.16,T*.16,0,0,Math.PI);c.fill();c.strokeStyle='#F4F2F0';c.lineWidth=T*.06;c.beginPath();c.arc(cx,cy-T*.2+bob,T*.26,Math.PI*1.1,Math.PI*1.9);c.stroke()}
  else if(kind==='troll'){c.fillStyle='#F2E3B8';c.beginPath();c.moveTo(cx-T*.2,cy-T*.3+bob);c.lineTo(cx-T*.3,cy-T*.52+bob);c.lineTo(cx-T*.1,cy-T*.38+bob);c.closePath();c.moveTo(cx+T*.2,cy-T*.3+bob);c.lineTo(cx+T*.3,cy-T*.52+bob);c.lineTo(cx+T*.1,cy-T*.38+bob);c.closePath();c.fill();c.strokeStyle='#8B5A2B';c.lineWidth=T*.09;c.beginPath();c.moveTo(cx+T*.3,cy+T*.3+bob);c.lineTo(cx+T*.5,cy-T*.1+bob);c.stroke()}
  c.restore()}
function drawMonster(c,x,y,r,col,shape,t,boss,hurt){c.save();c.translate(x,y);const wob=Math.sin(t*3)*.06;
  c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(0,r*.95,r*.8,r*.22,0,0,TAU2);c.fill();
  if(hurt)c.globalAlpha=.6+.4*Math.sin(t*40);
  c.fillStyle=col;
  if(shape===1){c.beginPath();for(let i=0;i<20;i++){const a=i*TAU2/20,rad=i%2?r*.78:r*1.08;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad*(1+wob))}c.closePath();c.fill()}
  else if(shape===2){c.beginPath();c.arc(0,-r*.15,r*.85,Math.PI,0);for(let i=0;i<4;i++){const bx=r*.85-i*r*.566;c.quadraticCurveTo(bx-r*.283,r*.95+Math.sin(t*4+i)*r*.08,bx-r*.566,r*.7)}c.closePath();c.fill()}
  else{c.beginPath();c.ellipse(0,0,r*(1+wob),r*(.92-wob),0,0,TAU2);c.fill()}
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-r*.35,-r*.4,r*.22,r*.14,-.6,0,TAU2);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(-r*.3,-r*.15,r*.22,0,TAU2);c.arc(r*.3,-r*.15,r*.22,0,TAU2);c.fill();
  c.fillStyle='#22333B';c.beginPath();c.arc(-r*.27,-r*.12,r*.1,0,TAU2);c.arc(r*.33,-r*.12,r*.1,0,TAU2);c.fill();
  c.strokeStyle='#22333B';c.lineWidth=Math.max(1.5,r*.09);c.lineCap='round';c.beginPath();c.moveTo(-r*.5,-r*.42);c.lineTo(-r*.15,-r*.3);c.moveTo(r*.5,-r*.42);c.lineTo(r*.15,-r*.3);c.stroke();
  c.beginPath();c.moveTo(-r*.28,r*.35);c.quadraticCurveTo(0,r*.12,r*.28,r*.35);c.stroke();
  if(boss){c.fillStyle='#FFD23F';c.strokeStyle='#E0A000';c.lineWidth=Math.max(1.5,r*.05);c.beginPath();c.moveTo(-r*.5,-r*.8);c.lineTo(-r*.5,-r*1.25);c.lineTo(-r*.25,-r*1.02);c.lineTo(0,-r*1.35);c.lineTo(r*.25,-r*1.02);c.lineTo(r*.5,-r*1.25);c.lineTo(r*.5,-r*.8);c.closePath();c.fill();c.stroke()}
  c.restore()}
/* one room on the canvas; ox,oy shift it in pixels while rooms scroll */
function drawRoom(c,room,T,ts,t,ox,oy,ink){const Wd=MQWorld,TT=Wd.T,Wt=Wd.W,Ht=Wd.H;c.save();c.translate(ox||0,oy||0);
  c.fillStyle=ts.ground;c.fillRect(0,0,Wt*T,Ht*T);
  c.fillStyle=ts.ground2;for(let y=0;y<Ht;y++)for(let x=(y%2);x<Wt;x+=2)c.fillRect(x*T,y*T,T,T);
  for(let y=0;y<Ht;y++)for(let x=0;x<Wt;x++){const v=room.grid[y*Wt+x],o=room.obj[y*Wt+x],px=x*T,py=y*T;
    switch(v){
      case TT.PATH:c.fillStyle=ts.path;c.fillRect(px,py,T,T);break;
      case TT.WALL:{const edge=x===0||y===0||x===Wt-1||y===Ht-1;c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle=ts.wall;rr(c,px+1,py+1,T-2,T*.72,T*.18);c.fill();if(!edge){c.fillStyle='rgba(255,255,255,.18)';rr(c,px+T*.15,py+T*.1,T*.5,T*.2,T*.1);c.fill()}break}
      case TT.WATER:{c.fillStyle=ts.water;c.fillRect(px,py,T,T);c.strokeStyle=ts.waterHi;c.lineWidth=Math.max(1,T*.06);c.lineCap='round';const ph=Math.sin(t*1.6+x*.9+y*1.3)*T*.12;c.beginPath();c.moveTo(px+T*.15,py+T*.5+ph);c.quadraticCurveTo(px+T*.5,py+T*.3+ph,px+T*.85,py+T*.5+ph);c.stroke();break}
      case TT.BRIDGE:{c.fillStyle='#C99A5B';c.fillRect(px,py,T,T);c.strokeStyle='#A47841';c.lineWidth=Math.max(1,T*.05);for(let i=1;i<4;i++){c.beginPath();c.moveTo(px,py+i*T/4);c.lineTo(px+T,py+i*T/4);c.stroke()}break}
      case TT.TREE:drawPlant(c,ts.plantKind,px,py,T,ts);break;
      case TT.DECOR:{c.fillStyle=ts.bloom;[[.3,.35],[.65,.3],[.5,.65]].forEach(p=>{c.beginPath();c.arc(px+T*p[0],py+T*p[1],T*.09,0,TAU2);c.fill()});c.fillStyle='#fff';[[.3,.35],[.65,.3],[.5,.65]].forEach(p=>{c.beginPath();c.arc(px+T*p[0],py+T*p[1],T*.035,0,TAU2);c.fill()});break}
      case TT.STONE:{c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+T*.52,py+T*.6,T*.4,T*.3,0,0,TAU2);c.fill();c.fillStyle=o&&o.sunk?'#7A8A95':'#C9D1D6';c.beginPath();c.ellipse(px+T*.5,py+T*.52,T*.42,T*.33,0,0,TAU2);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(px+T*.38,py+T*.42,T*.16,T*.08,-.5,0,TAU2);c.fill();if(o)label(c,String(o.v),px+T*.5,py+T*.54,T*.38,o.hit?'#1F9C72':ink||'#22333B');break}
      case TT.DOOR:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle=o&&o.bit?'#8A3A3A':'#6B4A2B';rr(c,px+T*.1,py+T*.08,T*.8,T*.9,T*.3);c.fill();c.fillStyle='#F6E7D3';c.beginPath();c.arc(px+T*.5,py+T*.5,T*.3,0,TAU2);c.fill();if(o)label(c,String(o.n),px+T*.5,py+T*.52,T*.3,ink||'#22333B',false);break}
      case TT.OPEN:{c.fillStyle=ts.path;c.fillRect(px,py,T,T);c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=Math.max(1,T*.06);c.beginPath();c.arc(px+T*.5,py+T*.55,T*.4,Math.PI,0);c.stroke();break}
      case TT.CHEST:{const op=o&&o.open;c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(px+T*.5,py+T*.88,T*.38,T*.1,0,0,TAU2);c.fill();c.fillStyle=op?'#B98350':'#8B5A2B';rr(c,px+T*.12,py+T*.38,T*.76,T*.48,T*.1);c.fill();c.fillStyle=op?'#D9A72E':'#A8703A';rr(c,px+T*.12,py+(op?T*.12:T*.26),T*.76,T*.22,T*.1);c.fill();c.fillStyle='#F2C94C';c.fillRect(px+T*.44,py+T*.4,T*.12,T*.44);if(op){c.fillStyle='rgba(255,226,74,.55)';c.beginPath();c.ellipse(px+T*.5,py+T*.3,T*.3,T*.18,0,0,TAU2);c.fill()}break}
      case TT.SIGN:{c.fillStyle='#8B5A2B';c.fillRect(px+T*.44,py+T*.5,T*.12,T*.42);c.fillStyle=ts.sand;rr(c,px+T*.1,py+T*.14,T*.8,T*.44,T*.1);c.fill();c.strokeStyle='#8B5A2B';c.lineWidth=Math.max(1,T*.05);rr(c,px+T*.1,py+T*.14,T*.8,T*.44,T*.1);c.stroke();label(c,'?',px+T*.5,py+T*.37,T*.34,'#8B5A2B',false);break}
      case TT.GATE:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle='#8B5A2B';[.18,.5,.82].forEach(f=>c.fillRect(px+T*f-T*.06,py+T*.1,T*.12,T*.85));c.fillRect(px,py+T*.3,T,T*.1);c.fillRect(px,py+T*.65,T,T*.1);break}
      case TT.BOSSDOOR:{c.fillStyle='#3A2A22';c.fillRect(px,py,T,T);c.fillStyle='#6B4A2B';rr(c,px+T*.06,py+T*.06,T*.88,T*.94,T*.2);c.fill();c.strokeStyle='#F2C94C';c.lineWidth=Math.max(1.5,T*.06);rr(c,px+T*.14,py+T*.14,T*.72,T*.8,T*.14);c.stroke();c.fillStyle='#F2C94C';c.beginPath();c.arc(px+T*.5,py+T*.48,T*.1,0,TAU2);c.fill();c.fillRect(px+T*.46,py+T*.5,T*.08,T*.2);break}
      case TT.CAVE:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle='#1E1A24';c.beginPath();c.arc(px+T*.5,py+T*.95,T*.44,Math.PI,0);c.lineTo(px+T*.94,py+T);c.lineTo(px+T*.06,py+T);c.closePath();c.fill();if(o&&o.sealed){c.fillStyle=ts.wall;rr(c,px+T*.2,py+T*.5,T*.6,T*.5,T*.12);c.fill()}break}
      case TT.POST:{c.fillStyle='#C99A5B';c.fillRect(px,py,T,T);c.fillStyle='#8B5A2B';c.fillRect(px+T*.38,py+T*.1,T*.24,T*.8);c.fillStyle='#6B4A2B';c.fillRect(px+T*.3,py+T*.1,T*.4,T*.14);break}
      case TT.CAULDRON:{c.fillStyle='#2E2A33';c.beginPath();c.ellipse(px+T*.5,py+T*.62,T*.4,T*.32,0,0,TAU2);c.fill();c.fillStyle='#8BD16B';c.beginPath();c.ellipse(px+T*.5,py+T*.38,T*.34,T*.12,0,0,TAU2);c.fill();c.fillStyle='#C8F5A0';[[.35,.3],[.6,.26],[.5,.34]].forEach((p,i)=>{c.beginPath();c.arc(px+T*p[0],py+T*p[1]-Math.abs(Math.sin(t*2+i))*T*.08,T*.05,0,TAU2);c.fill()});break}
      case TT.STATUE:{c.fillStyle='#9AA3AC';rr(c,px+T*.2,py+T*.62,T*.6,T*.3,T*.06);c.fill();c.fillStyle='#B8C0C8';c.beginPath();c.ellipse(px+T*.5,py+T*.4,T*.2,T*.24,0,0,TAU2);c.fill();c.beginPath();c.arc(px+T*.5,py+T*.16,T*.14,0,TAU2);c.fill();break}
      default:break}
    if(o&&o.type==='npc'&&v===TT.NPC)drawNPC(c,px+T*.5,py+T*.5,T,o.kind,t)}
  c.restore()}
