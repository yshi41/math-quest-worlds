/* ---------- regions: twelve Zelda-style rooms of 16 by 11 tiles, plus the boss room ----------
   One template for every region (mirrored left-right on even tiers, puzzle kinds drawn fresh for every visit):
     puzzle A (key)  | boss gate hall  | puzzle B (key) | secret room (rare item)
     puzzle C (loot) | hall (monsters) | puzzle D (loot)| arena (math monsters, key)
     fork caves      | ENTRANCE        | puzzle E (loot)| monster nest (loot)
   The boss room sits above the boss gate hall, behind a door that needs all three keys. Side doorways sit in
   rows 6-8 so a river across rows 2-4 never blocks them. Node-testable. */
const MQWorld=(function(){
  const W=16,H=11;
  const T={FLOOR:0,WALL:1,WATER:2,TREE:3,PATH:4,STONE:5,DOOR:6,CHEST:7,SIGN:9,GATE:10,BOSSDOOR:11,CAVE:12,BRIDGE:13,DECOR:14,OPEN:16,PLATE:20,BLOCK:21,TARGET:22,TORCH:23,DIAL:24,NUMTILE:25,ISLAND:26,RESET:27};
  const SOLID=new Set([T.WALL,T.WATER,T.TREE,T.DOOR,T.CHEST,T.SIGN,T.GATE,T.BOSSDOOR,T.CAVE,T.BLOCK,T.TARGET,T.TORCH,T.DIAL]);
  const key=(rx,ry)=>rx+','+ry;
  const OPP={top:'bottom',bottom:'top',left:'right',right:'left'};
  const SIDE=[6,7,8],MID=[7,8];
  const LINKS=[['entrance','hall','top',MID],['entrance','fork','left',SIDE],['entrance','pE','right',SIDE],
    ['hall','pC','left',SIDE],['hall','pD','right',SIDE],['hall','bossgate','top',MID],
    ['pC','pA','top',MID],['pD','pB','top',MID],['pD','arena','right',SIDE],['pE','pD','top',MID],['pE','nest','right',SIDE],
    ['arena','secret','top',MID],['bossgate','pA','left',SIDE],['bossgate','pB','right',SIDE],['bossgate','boss','top',MID]];
  const POS={pA:[0,0],bossgate:[1,0],pB:[2,0],secret:[3,0],pC:[0,1],hall:[1,1],pD:[2,1],arena:[3,1],fork:[0,2],entrance:[1,2],pE:[2,2],nest:[3,2],boss:[1,-1]};
  const PUZZLES=['stones','doors','targets','blocks','muncher','skip','torches','dials'];

  function makeRoom(tag){const g=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)g[y*W+x]=(x===0||y===0||x===W-1||y===H-1)?T.WALL:T.FLOOR;
    return {tag,rx:POS[tag][0],ry:POS[tag][1],grid:g,obj:{},enemies:[],plates:[],openings:{top:[],bottom:[],left:[],right:[]},puzzle:null}}
  const at=(r,x,y)=>r.grid[y*W+x];
  const set=(r,x,y,t)=>{r.grid[y*W+x]=t};
  const put=(r,x,y,t,o)=>{set(r,x,y,t);o.x=x;o.y=y;r.obj[y*W+x]=o;return o};
  const plate=(r,x,y,side,extra)=>{set(r,x,y,T.PLATE);r.plates.push(Object.assign({x,y,side,on:false,n:null},extra||{}))};
  function carve(r,side,cells){r.openings[side]=cells.slice();cells.forEach(c=>{if(side==='top')set(r,c,0,T.FLOOR);else if(side==='bottom')set(r,c,H-1,T.FLOOR);else if(side==='left')set(r,0,c,T.FLOOR);else set(r,W-1,c,T.FLOOR)})}
  const M=()=>MQMath;
  function chest(r,x,y,content,extra){return put(r,x,y,T.CHEST,Object.assign({type:'chest',content,locked:'puzzle',open:false},extra||{}))}
  function sign(r,x,y,text){return put(r,x,y,T.SIGN,{type:'sign',text})}

  /* ---- puzzle builders: each keeps the outer ring (x 1 and 14, y 1 and 9) as a walkway ---- */
  const B={
    /* a river across rows 2-4; five columns of three stones; the bottom stone of a column is met first from the south */
    stones(r,g,t,ctx){const p=M().stones(g,t,ctx);for(let y=2;y<=4;y++)for(let x=1;x<=W-2;x++)set(r,x,y,T.WATER);
      [2,5,8,11,14].forEach((x,c)=>{for(let row=0;row<3;row++)put(r,x,4-row,T.STONE,{type:'stone',v:p.cols[c][row],col:c})});
      chest(r,13,1,'reward');sign(r,3,7,p.label);r.puzzle={type:'stones',data:p,done:false,active:false,sum:0,idx:0,set:[],start:null,from:null}},
    /* a walled box with a door on each side; only the door that fits opens */
    doors(r,g,t){const p=M().doors(g,t);for(let x=5;x<=10;x++){set(r,x,3,T.WALL);set(r,x,6,T.WALL)}for(let y=3;y<=6;y++){set(r,5,y,T.WALL);set(r,10,y,T.WALL)}
      [[7,3],[10,4],[7,6],[5,5]].forEach((s,i)=>put(r,s[0],s[1],T.DOOR,{type:'door',n:p.nums[i],ok:i===p.answer}));
      chest(r,8,5,'reward');sign(r,3,8,p.label);r.puzzle={type:'doors',data:p,done:false}},
    /* six targets on the north wall, shoot the right ones */
    targets(r,g,t){const p=M().targets(g,t);[3,5,7,9,11,13].forEach((x,i)=>put(r,x,2,T.TARGET,{type:'target',v:p.nums[i],ok:p.ok.includes(i),lit:false}));
      chest(r,8,7,'reward');sign(r,3,8,p.label);r.puzzle={type:'targets',data:p,done:false}},
    /* numbered blocks and plates; the swirl plate puts the blocks back */
    blocks(r,g,t){const p=M().blocks(g,t);let plates,starts;
      if(p.variant==='balance'){plates=[[5,4,'L'],[5,6,'L'],[10,4,'R'],[10,6,'R']];starts=[[3,2],[12,2],[3,8],[12,8]]}
      else if(p.variant==='row'){plates=[[6,5,'A'],[7,5,'A'],[8,5,'A']];starts=[[3,2],[12,2],[3,8],[12,8],[7,8]]}
      else{plates=[[7,5,'A'],[8,5,'A']];starts=[[3,2],[12,2],[3,8],[12,8]]}
      plates.forEach(pl=>plate(r,pl[0],pl[1],pl[2]));
      p.vals.forEach((v,i)=>put(r,starts[i][0],starts[i][1],T.BLOCK,{type:'block',v,home:[starts[i][0],starts[i][1]]}));
      set(r,13,8,T.RESET);chest(r,13,2,'reward');sign(r,2,5,p.label+' The swirl plate puts the blocks back.');r.puzzle={type:'blocks',data:p,done:false}},
    /* fifteen numbered floor tiles; step on every one that fits */
    muncher(r,g,t){const p=M().muncher(g,t);let i=0;for(let y=3;y<=7;y+=2)for(let x=4;x<=12;x+=2){put(r,x,y,T.NUMTILE,{type:'numtile',v:p.nums[i],ok:p.ok.includes(i),done:false});i++}
      chest(r,13,1,'reward');sign(r,2,2,p.label);r.puzzle={type:'muncher',data:p,done:false,need:p.ok.length,got:0}},
    /* the counting path across a lattice of tiles */
    skip(r,g,t){const p=M().skipPath(g,t);for(let y=0;y<3;y++)for(let x=0;x<5;x++)put(r,3+x*2,3+y*2,T.NUMTILE,{type:'numtile',v:p.grid[y][x],ok:false,done:false,gx:x,gy:y});
      chest(r,13,2,'reward');sign(r,2,8,p.label);r.puzzle={type:'skip',data:p,done:false,idx:0}},
    /* torches along the north wall, lit in times-table order */
    torches(r,g,t){const p=M().torches(g,t);[4,6,8,10,12].forEach((x,i)=>put(r,x,2,T.TORCH,{type:'torch',v:p.shown[i],lit:false}));
      chest(r,8,7,'reward');sign(r,3,8,p.label);r.puzzle={type:'torches',data:p,done:false,idx:0}},
    /* two dials showing digits; hit a dial to turn it */
    dials(r,g,t){const p=M().dials(g,t);put(r,7,4,T.DIAL,{type:'dial',d:0,i:0});put(r,9,4,T.DIAL,{type:'dial',d:0,i:1});
      chest(r,8,7,'reward');sign(r,4,4,p.label);r.puzzle={type:'dials',data:p,done:false}}
  };

  function makeRegion(k,g,t,ctx){
    ctx=ctx||{};const cur=ctx.cur||'coins';
    const rooms={};Object.keys(POS).forEach(tag=>rooms[tag]=makeRoom(tag));
    LINKS.forEach(([a,b,side,cells])=>{carve(rooms[a],side,cells);carve(rooms[b],OPP[side],cells)});
    carve(rooms.entrance,'bottom',MID);rooms.entrance.exit=true;
    /* five different puzzle kinds for A..E, a harder one for the secret room */
    const kinds=M()._r.shuffle(PUZZLES).slice(0,5);const slots=['pA','pB','pC','pD','pE'];
    slots.forEach((tag,i)=>{const r=rooms[tag];B[kinds[i]](r,g,t,ctx);r.kind=kinds[i];r.reward=Object.values(r.obj).find(o=>o.type==='chest');r.reward.content=i<2?'key':'loot';r.reward.amount=24+8*t});
    let r=rooms.secret;const sk=M()._r.pick(['blocks','targets','muncher','skip']);B[sk](r,g,Math.min(8,t+2),ctx);r.kind=sk;r.reward=Object.values(r.obj).find(o=>o.type==='chest');r.reward.content='item';r.reward.item=ctx.secretItem||null;r.reward.amount=40+10*t;
    /* entrance */
    r=rooms.entrance;sign(r,5,2,`Welcome to ${ctx.name||'the region'}! Three keys open the boss door: two are in puzzle rooms, one in the arena. Walk south out of this room to leave.`);
    for(let x=6;x<=9;x++)for(let y=1;y<=9;y++)if(at(r,x,y)===T.FLOOR)set(r,x,y,T.PATH);
    /* fork caves */
    r=rooms.fork;const fk=M().fork(g,t,{cur}),fo=fk.options;const cx=fo.length===3?[3,8,12]:[4,11];
    fo.forEach((o,i)=>{put(r,cx[i],1,T.CAVE,{type:'cave',i,text:o.text,value:o.value});sign(r,cx[i]+1,2,`This cave holds ${o.text}.`)});r.fork=fk;
    /* hall, nest, arena, boss gate, boss */
    r=rooms.hall;r.enemies.push({x:4,y:4,kind:'slime'},{x:11,y:4,kind:'slime'},{x:12,y:2,kind:t>=3?'spiker':'slime'});[[2,2],[13,2],[2,9],[13,9]].forEach(s=>set(r,s[0],s[1],T.TREE));
    r=rooms.nest;r.enemies.push({x:4,y:3,kind:'slime'},{x:10,y:4,kind:'spiker'},{x:11,y:2,kind:t>=2?'shooter':'slime'},{x:5,y:8,kind:'slime'});chest(r,13,3,'gear',{locked:'enemies'});[[2,2],[7,5],[13,9]].forEach(s=>set(r,s[0],s[1],T.TREE));
    r=rooms.arena;const beetleArena=t%2===0;const vals=beetleArena?M().beetles(g,t,ctx):M().numSlimes(g,t,ctx);
    vals.forEach((v,i)=>r.enemies.push({x:[4,8,11][i],y:[3,5,3][i],kind:beetleArena?'beetle':'numslime',n:v}));chest(r,13,3,'key',{locked:'enemies'});
    sign(r,2,8,beetleArena?'Factor Beetles! Only a weapon whose number divides a beetle\'s number can hurt it, and the number shrinks by that much each hit. At 1 it pops.':'Number Slimes! Each hit takes your weapon\'s number off a slime. Land on exactly 0 to pop it; go below and it bounces back.');
    r=rooms.bossgate;r.openings.top.forEach(c=>put(r,c,0,T.BOSSDOOR,{type:'bossdoor'}));r.enemies.push({x:4,y:4,kind:'slime'},{x:11,y:4,kind:'shooter'});
    r=rooms.boss;const bt=['shield','factor','minions','pattern'][(t-1)%4];r.bossType=bt;
    r.boss={kind:'boss',x:8,y:4,type:bt,data:bt==='shield'?M().bossShield(g,t,ctx):bt==='factor'?M().bossFactor(g,t,ctx):bt==='minions'?M().bossMinions(g,t):M().bossPattern(g,t)};
    if(bt==='pattern'){[[3,7],[5,7],[7,7],[9,7],[11,7],[13,7]].forEach((s,i)=>plate(r,s[0],s[1],'P',{i}))}
    const mirror=t%2===0;
    if(mirror)Object.keys(rooms).forEach(tag=>flip(rooms[tag]));
    const byKey={};Object.keys(rooms).forEach(tag=>{const rm=rooms[tag];if(mirror)rm.rx=3-rm.rx;byKey[key(rm.rx,rm.ry)]=rm});
    return {key:k,g,t,mirror,rooms:byKey,byTag:rooms,start:{rx:rooms.entrance.rx,ry:2,x:7.5,y:8.5},cur,keys:0,kinds};
  }
  function flip(r){const g=new Uint8Array(W*H),obj={};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){g[y*W+(W-1-x)]=r.grid[y*W+x];const o=r.obj[y*W+x];if(o){o.x=W-1-x;if(o.home)o.home=[W-1-o.home[0],o.home[1]];obj[y*W+o.x]=o}}
    r.grid=g;r.obj=obj;r.enemies.forEach(e=>{e.x=W-1-e.x});if(r.boss)r.boss.x=W-1-r.boss.x;r.plates.forEach(p=>{p.x=W-1-p.x});
    const o=r.openings;r.openings={top:o.top.map(c=>W-1-c),bottom:o.bottom.map(c=>W-1-c),left:o.right.slice(),right:o.left.slice()}}
  return {W,H,T,SOLID,key,makeRegion,at,PUZZLES};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MQWorld;
