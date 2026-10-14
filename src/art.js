/* ---------- one simple set of canvas graphics: tiles, the hero, monsters, shots and drops ----------
   Kept deliberately plain while the mechanics are being tuned (Yan, 10/14/2026). The Spelling Worlds SVG
   characters still appear in the camp; on the stage every character is a round hero in its own colour. */
const TAU2=Math.PI*2;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function label(c,text,x,y,size,col,halo){c.font='700 '+Math.round(size)+'px Fredoka, Nunito, sans-serif';c.textAlign='center';c.textBaseline='middle';
  if(halo!==false){c.lineWidth=Math.max(3,size*.22);c.strokeStyle='rgba(255,255,255,.92)';c.lineJoin='round';c.strokeText(text,x,y)}c.fillStyle=col||'#22333B';c.fillText(text,x,y)}
function drawPlant(c,x,y,T,ts){const cx=x+T/2,by=y+T*.92;c.fillStyle='#8B5A2B';rr(c,cx-T*.08,by-T*.4,T*.16,T*.4,2);c.fill();c.fillStyle=ts.plantDk;c.beginPath();c.arc(cx,y+T*.42,T*.4,0,TAU2);c.fill();c.fillStyle=ts.plant;c.beginPath();c.arc(cx-T*.08,y+T*.36,T*.3,0,TAU2);c.fill()}
/* one room on the canvas; ox,oy shift it in pixels while rooms scroll */
function drawRoom(c,room,T,ts,t,ox,oy,ink){const Wd=MQWorld,TT=Wd.T,Wt=Wd.W,Ht=Wd.H;c.save();c.translate(ox||0,oy||0);
  c.fillStyle=ts.ground;c.fillRect(0,0,Wt*T,Ht*T);
  c.fillStyle=ts.ground2;for(let y=0;y<Ht;y++)for(let x=(y%2);x<Wt;x+=2)c.fillRect(x*T,y*T,T,T);
  for(let y=0;y<Ht;y++)for(let x=0;x<Wt;x++){const v=room.grid[y*Wt+x],o=room.obj[y*Wt+x],px=x*T,py=y*T;
    switch(v){
      case TT.PATH:c.fillStyle=ts.path;c.fillRect(px,py,T,T);break;
      case TT.WALL:{const edge=x===0||y===0||x===Wt-1||y===Ht-1;c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle=ts.wall;rr(c,px+1,py+1,T-2,T*.72,T*.18);c.fill();if(!edge){c.fillStyle='rgba(255,255,255,.18)';rr(c,px+T*.15,py+T*.1,T*.5,T*.2,T*.1);c.fill()}break}
      case TT.WATER:{c.fillStyle=ts.water;c.fillRect(px,py,T,T);c.strokeStyle=ts.waterHi;c.lineWidth=Math.max(1,T*.06);c.lineCap='round';const ph=Math.sin(t*1.6+x*.9+y*1.3)*T*.12;c.beginPath();c.moveTo(px+T*.15,py+T*.5+ph);c.quadraticCurveTo(px+T*.5,py+T*.3+ph,px+T*.85,py+T*.5+ph);c.stroke();break}
      case TT.ISLAND:{c.fillStyle=ts.sand;c.fillRect(px,py,T,T);c.fillStyle=ts.waterHi;c.fillRect(px,py,T,T*.08);break}
      case TT.BRIDGE:{c.fillStyle='#C99A5B';c.fillRect(px,py,T,T);c.strokeStyle='#A47841';c.lineWidth=Math.max(1,T*.05);for(let i=1;i<4;i++){c.beginPath();c.moveTo(px,py+i*T/4);c.lineTo(px+T,py+i*T/4);c.stroke()}break}
      case TT.TREE:drawPlant(c,px,py,T,ts);break;
      case TT.DECOR:{c.fillStyle=ts.bloom;[[.3,.35],[.65,.3],[.5,.65]].forEach(p=>{c.beginPath();c.arc(px+T*p[0],py+T*p[1],T*.09,0,TAU2);c.fill()});break}
      case TT.STONE:{c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+T*.52,py+T*.6,T*.4,T*.3,0,0,TAU2);c.fill();c.fillStyle=o&&o.sunk?'#7A8A95':'#C9D1D6';c.beginPath();c.ellipse(px+T*.5,py+T*.52,T*.42,T*.33,0,0,TAU2);c.fill();if(o)label(c,String(o.v),px+T*.5,py+T*.54,T*.38,o.hit?'#1F9C72':ink||'#22333B');break}
      case TT.DOOR:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle=o&&o.bit?'#8A3A3A':'#6B4A2B';rr(c,px+T*.1,py+T*.08,T*.8,T*.9,T*.3);c.fill();c.fillStyle='#F6E7D3';c.beginPath();c.arc(px+T*.5,py+T*.5,T*.3,0,TAU2);c.fill();if(o)label(c,String(o.n),px+T*.5,py+T*.52,T*.3,ink||'#22333B',false);break}
      case TT.OPEN:{c.fillStyle=ts.path;c.fillRect(px,py,T,T);c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=Math.max(1,T*.06);c.beginPath();c.arc(px+T*.5,py+T*.55,T*.4,Math.PI,0);c.stroke();break}
      case TT.CHEST:{const op=o&&o.open,locked=o&&!op&&o.locked;c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(px+T*.5,py+T*.88,T*.38,T*.1,0,0,TAU2);c.fill();c.fillStyle=op?'#B98350':'#8B5A2B';rr(c,px+T*.12,py+T*.38,T*.76,T*.48,T*.1);c.fill();c.fillStyle=op?'#D9A72E':'#A8703A';rr(c,px+T*.12,py+(op?T*.12:T*.26),T*.76,T*.22,T*.1);c.fill();c.fillStyle='#F2C94C';c.fillRect(px+T*.44,py+T*.4,T*.12,T*.44);
        if(locked){c.fillStyle='#5A636B';rr(c,px+T*.38,py+T*.5,T*.24,T*.22,T*.05);c.fill()}else if(!op){c.fillStyle='rgba(255,226,74,'+(.35+.3*Math.sin(t*5))+')';c.beginPath();c.ellipse(px+T*.5,py+T*.3,T*.34,T*.18,0,0,TAU2);c.fill()}break}
      case TT.SIGN:{c.fillStyle='#8B5A2B';c.fillRect(px+T*.44,py+T*.5,T*.12,T*.42);c.fillStyle=ts.sand;rr(c,px+T*.1,py+T*.14,T*.8,T*.44,T*.1);c.fill();c.strokeStyle='#8B5A2B';c.lineWidth=Math.max(1,T*.05);rr(c,px+T*.1,py+T*.14,T*.8,T*.44,T*.1);c.stroke();label(c,'?',px+T*.5,py+T*.37,T*.34,'#8B5A2B',false);break}
      case TT.GATE:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle='#8B5A2B';[.18,.5,.82].forEach(f=>c.fillRect(px+T*f-T*.06,py+T*.1,T*.12,T*.85));c.fillRect(px,py+T*.3,T,T*.1);c.fillRect(px,py+T*.65,T,T*.1);break}
      case TT.BOSSDOOR:{c.fillStyle='#3A2A22';c.fillRect(px,py,T,T);c.fillStyle='#6B4A2B';rr(c,px+T*.06,py+T*.06,T*.88,T*.94,T*.2);c.fill();c.strokeStyle='#F2C94C';c.lineWidth=Math.max(1.5,T*.06);rr(c,px+T*.14,py+T*.14,T*.72,T*.8,T*.14);c.stroke();c.fillStyle='#F2C94C';c.beginPath();c.arc(px+T*.5,py+T*.48,T*.1,0,TAU2);c.fill();c.fillRect(px+T*.46,py+T*.5,T*.08,T*.2);break}
      case TT.CAVE:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle='#1E1A24';c.beginPath();c.arc(px+T*.5,py+T*.95,T*.44,Math.PI,0);c.lineTo(px+T*.94,py+T);c.lineTo(px+T*.06,py+T);c.closePath();c.fill();if(o&&o.sealed){c.fillStyle=ts.wall;rr(c,px+T*.2,py+T*.5,T*.6,T*.5,T*.12);c.fill()}break}
      case TT.PLATE:{const on=o&&o.on;c.fillStyle=on?ts.plateOn:ts.plate;rr(c,px+T*.1,py+T*.1,T*.8,T*.8,T*.12);c.fill();c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=Math.max(1,T*.05);rr(c,px+T*.18,py+T*.18,T*.64,T*.64,T*.08);c.stroke();if(o&&o.side&&o.side!=='A'&&o.side!=='P')label(c,o.side,px+T*.5,py+T*.5,T*.3,'rgba(0,0,0,.35)',false);if(o&&o.n!=null)label(c,String(o.n),px+T*.5,py+T*.52,T*.36,ink||'#22333B');break}
      case TT.RESET:{c.fillStyle=ts.plate;rr(c,px+T*.1,py+T*.1,T*.8,T*.8,T*.12);c.fill();label(c,'↺',px+T*.5,py+T*.52,T*.5,'#55707E',false);break}
      case TT.BLOCK:{c.fillStyle='rgba(0,0,0,.18)';rr(c,px+T*.08,py+T*.14,T*.86,T*.86,T*.1);c.fill();c.fillStyle=ts.block;rr(c,px+T*.06,py+T*.06,T*.88,T*.88,T*.12);c.fill();c.strokeStyle=ts.blockDk;c.lineWidth=Math.max(1.5,T*.06);rr(c,px+T*.06,py+T*.06,T*.88,T*.88,T*.12);c.stroke();if(o)label(c,String(o.v),px+T*.5,py+T*.52,T*.42,'#fff',false);break}
      case TT.TARGET:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);const lit=o&&o.lit;c.fillStyle=lit?'#7ED49A':'#F6F1E4';c.beginPath();c.arc(px+T*.5,py+T*.5,T*.42,0,TAU2);c.fill();c.strokeStyle=lit?'#1F9C72':'#E86A5A';c.lineWidth=Math.max(1.5,T*.07);c.beginPath();c.arc(px+T*.5,py+T*.5,T*.3,0,TAU2);c.stroke();if(o)label(c,String(o.v),px+T*.5,py+T*.52,String(o.v).length>3?T*.22:T*.3,ink||'#22333B');break}
      case TT.TORCH:{c.fillStyle=ts.wallDk;c.fillRect(px,py,T,T);c.fillStyle='#8B5A2B';c.fillRect(px+T*.42,py+T*.4,T*.16,T*.5);c.fillStyle='#5A636B';rr(c,px+T*.3,py+T*.34,T*.4,T*.14,T*.05);c.fill();
        if(o&&o.lit){const f=T*(.26+.06*Math.sin(t*12+x));c.fillStyle='#FFB347';c.beginPath();c.ellipse(px+T*.5,py+T*.28,f*.6,f,0,0,TAU2);c.fill();c.fillStyle='#FFE24A';c.beginPath();c.ellipse(px+T*.5,py+T*.32,f*.3,f*.55,0,0,TAU2);c.fill()}
        if(o)label(c,String(o.v),px+T*.5,py+T*.78,T*.26,'#fff',false);break}
      case TT.DIAL:{c.fillStyle='#5A636B';rr(c,px+T*.1,py+T*.1,T*.8,T*.8,T*.14);c.fill();c.fillStyle='#F6F1E4';rr(c,px+T*.22,py+T*.2,T*.56,T*.6,T*.08);c.fill();if(o)label(c,String(o.d),px+T*.5,py+T*.52,T*.5,o.locked?'#1F9C72':ink||'#22333B',false);break}
      case TT.NUMTILE:{const done=o&&o.done,bad=o&&o.bad;c.fillStyle=done?'#7ED49A':bad?'#F3A0A0':ts.num;rr(c,px+T*.08,py+T*.08,T*.84,T*.84,T*.14);c.fill();c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=Math.max(1,T*.04);rr(c,px+T*.08,py+T*.08,T*.84,T*.84,T*.14);c.stroke();if(o)label(c,String(o.v),px+T*.5,py+T*.52,String(o.v).length>3?T*.26:T*.36,done?'#0F6B4A':ink||'#22333B',false);break}
      default:break}}
  c.restore()}
/* the hero: a round body in the character's colour that faces the way it walks */
function drawHero(c,h,T,t,theme,swing){const x=h.x*T,y=h.y*T,r=T*.4,d=h.dir,dx=d==='left'?-1:d==='right'?1:0,dy=d==='up'?-1:d==='down'?1:0;c.save();
  c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(x,y+r*.9,r*.9,r*.28,0,0,TAU2);c.fill();
  const step=h.moving?Math.sin(h.walkT*14)*r*.25:0;
  c.fillStyle=theme.body;c.beginPath();c.arc(x-r*.35,y+r*.75+(step>0?-step:0),r*.22,0,TAU2);c.arc(x+r*.35,y+r*.75+(step<0?step:0),r*.22,0,TAU2);c.fill();
  if(swing>0){const a=Math.atan2(dy,dx),s=swing/.25;c.strokeStyle=theme.col;c.lineWidth=Math.max(3,T*.12);c.lineCap='round';c.globalAlpha=.9;c.beginPath();c.arc(x,y,r*1.45,a-1.2+s*1.0,a+1.2-s*1.0);c.stroke();c.globalAlpha=1}
  c.fillStyle=theme.body;c.beginPath();c.arc(x,y-r*.1,r,0,TAU2);c.fill();c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=Math.max(1.5,T*.05);c.stroke();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x-r*.35,y-r*.5,r*.25,r*.16,-.6,0,TAU2);c.fill();
  if(d!=='up'){const ex=dx*r*.3,ey=-r*.2+dy*r*.15;const sep=dx?r*.22:r*.36;c.fillStyle='#fff';c.beginPath();c.arc(x+ex-sep,y+ey,r*.2,0,TAU2);c.arc(x+ex+sep,y+ey,r*.2,0,TAU2);c.fill();c.fillStyle='#22333B';c.beginPath();c.arc(x+ex-sep+dx*r*.07,y+ey+dy*r*.06,r*.1,0,TAU2);c.arc(x+ex+sep+dx*r*.07,y+ey+dy*r*.06,r*.1,0,TAU2);c.fill();
    c.strokeStyle='#22333B';c.lineWidth=Math.max(1.5,T*.045);c.lineCap='round';c.beginPath();c.moveTo(x+ex-r*.15,y+ey+r*.32);c.quadraticCurveTo(x+ex,y+ey+r*.45,x+ex+r*.15,y+ey+r*.32);c.stroke()}
  else{c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.arc(x,y-r*.35,r*.3,0,TAU2);c.fill()}
  /* the weapon on the facing side */
  c.strokeStyle='#8B5A2B';c.lineWidth=Math.max(2.5,T*.09);c.lineCap='round';c.beginPath();c.moveTo(x+dx*r*.6+(dy?r*.6:0),y+dy*r*.6);c.lineTo(x+dx*r*1.3+(dy?r*.6:0),y+dy*r*1.3-(dy?0:r*.2));c.stroke();
  c.restore()}
function drawMonster(c,e,T,t){const x=e.x*T,y=e.y*T,r=e.r*T;c.save();c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(x,y+r*.9,r*.8,r*.22,0,0,TAU2);c.fill();
  if(e.hurt>0&&Math.floor(t*30)%2)c.globalAlpha=.5;const wob=Math.sin(t*3+e.x)*.06;c.fillStyle=e.col;
  if(e.kind==='spiker'){c.beginPath();for(let i=0;i<16;i++){const a=i*TAU2/16+t*2,rad=i%2?r*.7:r*1.1;c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}c.closePath();c.fill()}
  else if(e.kind==='shooter'){c.beginPath();const a0=Math.atan2(e.fy||0,e.fx||1);for(let i=0;i<3;i++){const a=a0+i*TAU2/3;c.lineTo(x+Math.cos(a)*r*1.1,y+Math.sin(a)*r*1.1)}c.closePath();c.fill()}
  else if(e.kind==='numslime'){rr(c,x-r,y-r*.9,r*2,r*1.8,r*.4);c.fill()}
  else if(e.kind==='beetle'){c.beginPath();for(let i=0;i<6;i++){const a=i*TAU2/6+Math.PI/6;c.lineTo(x+Math.cos(a)*r*1.05,y+Math.sin(a)*r*1.05)}c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=Math.max(1,T*.04);c.beginPath();c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke()}
  else if(e.kind==='boss'){c.beginPath();c.ellipse(x,y,r*(1+wob),r*(.95-wob),0,0,TAU2);c.fill();c.fillStyle='#FFD23F';c.strokeStyle='#E0A000';c.lineWidth=Math.max(1.5,r*.05);c.beginPath();c.moveTo(x-r*.5,y-r*.75);c.lineTo(x-r*.5,y-r*1.2);c.lineTo(x-r*.25,y-r*.97);c.lineTo(x,y-r*1.3);c.lineTo(x+r*.25,y-r*.97);c.lineTo(x+r*.5,y-r*1.2);c.lineTo(x+r*.5,y-r*.75);c.closePath();c.fill();c.stroke();c.fillStyle=e.col}
  else if(e.kind==='troggle'){c.beginPath();c.ellipse(x,y,r*.9,r*1.05,0,0,TAU2);c.fill();c.fillStyle='#22333B';c.fillRect(x-r*.5,y+r*.6,r*.25,r*.5);c.fillRect(x+r*.25,y+r*.6,r*.25,r*.5)}
  else{c.beginPath();c.ellipse(x,y,r*(1+wob),r*(.92-wob),0,0,TAU2);c.fill()}
  c.fillStyle='#fff';c.beginPath();c.arc(x-r*.3,y-r*.15,r*.22,0,TAU2);c.arc(x+r*.3,y-r*.15,r*.22,0,TAU2);c.fill();c.fillStyle='#22333B';c.beginPath();c.arc(x-r*.27,y-r*.12,r*.1,0,TAU2);c.arc(x+r*.33,y-r*.12,r*.1,0,TAU2);c.fill();
  c.strokeStyle='#22333B';c.lineWidth=Math.max(1.5,r*.09);c.lineCap='round';c.beginPath();c.moveTo(-r*.5+x,-r*.42+y);c.lineTo(-r*.15+x,-r*.3+y);c.moveTo(r*.5+x,-r*.42+y);c.lineTo(r*.15+x,-r*.3+y);c.stroke();
  c.beginPath();c.moveTo(x-r*.28,y+r*.35);c.quadraticCurveTo(x,y+r*.12,x+r*.28,y+r*.35);c.stroke();
  if(e.n!=null)label(c,String(e.n),x,y-r*1.25,Math.max(12,r*.75),e.kind==='boss'&&e.stun>0?'#1F9C72':'#22333B');
  if(e.kind==='boss'&&e.tag)label(c,e.tag,x,y+r*1.45,Math.max(11,r*.42),'#8A2E3A');
  if(e.kind!=='numslime'&&e.kind!=='beetle'&&e.kind!=='boss'&&e.hpMax>1){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x-r,y-r*1.45,r*2,Math.max(3,r*.18));c.fillStyle='#E86A5A';c.fillRect(x-r,y-r*1.45,r*2*Math.max(0,e.hp/e.hpMax),Math.max(3,r*.18))}
  c.restore()}
function drawShot(c,s,T,theme){const x=s.x*T,y=s.y*T,r=T*.17;c.save();c.fillStyle=s.col||theme.col;c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.5;const a=Math.atan2(s.vy,s.vx);
  switch(s.shape||theme.shape){
    case 'drop':c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(r*1.4,0);c.quadraticCurveTo(0,-r,-r,0);c.quadraticCurveTo(0,r,r*1.4,0);c.fill();c.stroke();break;
    case 'leaf':c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,r*1.4,r*.7,0,0,TAU2);c.fill();c.stroke();break;
    case 'dart':c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(r*1.6,0);c.lineTo(-r,-r*.6);c.lineTo(-r*.5,0);c.lineTo(-r,r*.6);c.closePath();c.fill();c.stroke();break;
    case 'star':c.translate(x,y);c.rotate(a*3);c.beginPath();for(let i=0;i<10;i++){const q=i*Math.PI/5,rad=i%2?r*.5:r*1.3;c.lineTo(Math.cos(q)*rad,Math.sin(q)*rad)}c.closePath();c.fill();c.stroke();break;
    case 'spark':c.translate(x,y);c.rotate(a);c.beginPath();for(let i=0;i<8;i++){const q=i*Math.PI/4,rad=i%2?r*.45:r*1.2;c.lineTo(Math.cos(q)*rad,Math.sin(q)*rad)}c.closePath();c.fill();c.stroke();break;
    default:c.beginPath();c.arc(x,y,r,0,TAU2);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(x-r*.3,y-r*.3,r*.3,0,TAU2);c.fill()}
  if(s.v!=null&&s.showV)label(c,String(s.v),s.x*T,s.y*T-T*.35,T*.28,'#22333B');c.restore()}
function drawDrop(c,d,T,t){const x=d.x*T,y=d.y*T-Math.abs(Math.sin(t*4+d.x))*T*.08,r=T*.2;c.save();if(d.life<2&&Math.floor(t*10)%2)c.globalAlpha=.4;
  if(d.kind==='coin'){c.fillStyle='#F2C94C';c.strokeStyle='#D9A72E';c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,TAU2);c.fill();c.stroke();label(c,'¢',x,y+1,r*1.3,'#9A6A10',false)}
  else if(d.kind==='heart'){c.fillStyle='#FF5C8A';c.beginPath();c.moveTo(x,y+r);c.bezierCurveTo(x-r*1.6,y-r*.2,x-r*.8,y-r*1.3,x,y-r*.4);c.bezierCurveTo(x+r*.8,y-r*1.3,x+r*1.6,y-r*.2,x,y+r);c.fill()}
  else if(d.kind==='ammo'){c.fillStyle='#7CD4FF';c.strokeStyle='#2FAFC4';c.lineWidth=2;c.beginPath();c.arc(x,y,r*.8,0,TAU2);c.fill();c.stroke();c.beginPath();c.arc(x+r*.6,y-r*.5,r*.5,0,TAU2);c.fill();c.stroke()}
  else if(d.kind==='key'){c.strokeStyle='#E0A000';c.lineWidth=3;c.beginPath();c.arc(x-r*.4,y-r*.3,r*.5,0,TAU2);c.moveTo(x,y);c.lineTo(x+r,y+r);c.moveTo(x+r*.6,y+r*.6);c.lineTo(x+r*.9,y+r*.3);c.stroke()}
  else{c.fillStyle='#B48CF0';c.strokeStyle='#7447D6';c.lineWidth=2;c.beginPath();for(let i=0;i<10;i++){const q=i*Math.PI/5-Math.PI/2,rad=i%2?r*.55:r*1.3;c.lineTo(x+Math.cos(q)*rad,y+Math.sin(q)*rad)}c.closePath();c.fill();c.stroke()}
  c.restore()}
/* small inline icons for the backpack */
function itemIcon(it){if(it.kind==='melee')return '<svg class="gi" viewBox="0 0 64 64"><path d="M14 50 L44 20 L50 26 L20 56 Z" fill="#9AA3AC" stroke="#5A636B" stroke-width="2"/><path d="M10 44 L20 54" stroke="#8B5A2B" stroke-width="7" stroke-linecap="round"/><text x="32" y="40" font-family="Fredoka,Nunito,sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#22333B">'+it.v+'</text></svg>';
  if(it.kind==='ranged')return '<svg class="gi" viewBox="0 0 64 64"><path d="M20 10 Q50 32 20 54" fill="none" stroke="#8B5A2B" stroke-width="5" stroke-linecap="round"/><path d="M20 10 L20 54" stroke="#E6D3B3" stroke-width="2"/><path d="M14 32 L50 32 M44 26 L50 32 L44 38" fill="none" stroke="#2FAFC4" stroke-width="4" stroke-linecap="round"/><text x="34" y="20" font-family="Fredoka,Nunito,sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#22333B">'+it.v+'</text></svg>';
  if(it.kind==='armor')return '<svg class="gi" viewBox="0 0 64 64"><path d="M14 12 L32 6 L50 12 L50 34 Q50 50 32 58 Q14 50 14 34 Z" fill="#3B66E6" stroke="#2B4FB8" stroke-width="3"/><text x="32" y="40" font-family="Fredoka,Nunito,sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#fff">'+it.block+'</text></svg>';
  return '<svg class="gi" viewBox="0 0 64 64"><path d="M32 56 C8 40 8 14 24 10 C30 8 34 14 32 18 C30 14 34 8 40 10 C56 14 56 40 32 56Z" fill="#FF5C8A"/></svg>'}
/* the Spelling Worlds character portrait for the camp and the player cards (no outfits while graphics stay simple) */
function heroSVG(k,ch,mood){const d=(DRAW[ch]||DRAW.axolotl)(K_INK);return '<svg class="axo" viewBox="-15 -15 290 270" data-mood="'+(mood||'neutral')+'" aria-hidden="true">'+d.back+d.main+'</svg>'}
