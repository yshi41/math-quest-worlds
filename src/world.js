/* ---------- regions: twelve Zelda-style rooms of 16 by 11 tiles, plus the boss room ----------
   One template for every region (mirrored left-right on odd tiers, decorations seeded by region, the numbers
   rolled fresh on every visit). Node-testable. Layout (row 0 at the top):
     riddle (key 1) | boss gate hall | share cave  | hidden grove
     stepping stones| hall + troll   | number doors| monster den (key 2)
     fork caves     | ENTRANCE       | trader      | alchemist
   The boss room sits above the boss gate hall, behind a door that needs both keys. */
const MQWorld=(function(){
  const W=16,H=11;
  const T={FLOOR:0,WALL:1,WATER:2,TREE:3,PATH:4,STONE:5,DOOR:6,CHEST:7,NPC:8,SIGN:9,GATE:10,BOSSDOOR:11,CAVE:12,BRIDGE:13,DECOR:14,POST:15,OPEN:16,CAULDRON:17,STATUE:18};
  const SOLID=new Set([T.WALL,T.WATER,T.TREE,T.DOOR,T.CHEST,T.NPC,T.SIGN,T.GATE,T.BOSSDOOR,T.CAVE,T.POST,T.CAULDRON,T.STATUE]);
  const key=(rx,ry)=>rx+','+ry;
  const OPP={top:'bottom',bottom:'top',left:'right',right:'left'};
  /* which rooms touch, through which side of the first, and the tiles of the opening */
  const LINKS=[['entrance','hall','top',[7,8]],['entrance','fork','left',[4,5,6]],['entrance','trader','right',[4,5,6]],['trader','alchemist','right',[4,5,6]],
    ['hall','stones','left',[6,7,8]],['hall','doors','right',[4,5,6]],['hall','bossgate','top',[7,8]],['stones','riddle','top',[7,8]],
    ['doors','den','right',[4,5,6]],['doors','share','top',[12,13]],['den','grove','top',[7,8]],['bossgate','boss','top',[7,8]]];
  const POS={riddle:[0,0],bossgate:[1,0],share:[2,0],grove:[3,0],stones:[0,1],hall:[1,1],doors:[2,1],den:[3,1],fork:[0,2],entrance:[1,2],trader:[2,2],alchemist:[3,2],boss:[1,-1]};
  /* decoration spots per room, all off the lanes between the openings */
  const SPOTS={default:[[2,2],[3,2],[12,2],[13,2],[2,8],[3,8],[12,8],[13,8],[5,9],[10,9],[5,1],[10,1],[2,5],[13,5]],
    stones:[[2,9],[13,9],[5,9],[10,9],[3,8],[12,8]],hall:[[2,5],[13,5],[3,8],[12,8],[5,9],[10,9]],doors:[[2,2],[3,8],[2,8],[12,2],[13,8],[5,9]],
    entrance:[[2,2],[3,2],[12,2],[13,2],[2,8],[13,8]],bossgate:[[2,8],[13,8],[5,9],[10,9],[2,5],[13,5]],boss:[[2,2],[13,2],[2,8],[13,8]]};

  function makeRoom(tag){const g=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)g[y*W+x]=(x===0||y===0||x===W-1||y===H-1)?T.WALL:T.FLOOR;
    return {tag,rx:POS[tag][0],ry:POS[tag][1],grid:g,obj:{},enemies:[],openings:{top:[],bottom:[],left:[],right:[]}}}
  const at=(r,x,y)=>r.grid[y*W+x];
  const set=(r,x,y,t)=>{r.grid[y*W+x]=t};
  const put=(r,x,y,t,o)=>{set(r,x,y,t);o.x=x;o.y=y;r.obj[y*W+x]=o;return o};
  function carve(r,side,cells){r.openings[side]=cells.slice();cells.forEach(c=>{if(side==='top')set(r,c,0,T.FLOOR);else if(side==='bottom')set(r,c,H-1,T.FLOOR);else if(side==='left')set(r,0,c,T.FLOOR);else set(r,W-1,c,T.FLOOR)})}

  function makeRegion(k,g,t,ctx){
    ctx=ctx||{};const M=MQMath, cur=ctx.cur||'pearls';
    const rooms={};Object.keys(POS).forEach(tag=>rooms[tag]=makeRoom(tag));
    LINKS.forEach(([a,b,side,cells])=>{carve(rooms[a],side,cells);carve(rooms[b],OPP[side],cells)});
    carve(rooms.entrance,'bottom',[7,8]);rooms.entrance.exit=true;
    const puz={stones:M.stones(g,t),doors:M.doors(g,t),riddle:M.riddle(g,t),toll:M.toll(g,t,ctx),trader:M.trader(g,t,ctx),brew:M.brew(g,t,ctx),share:M.share(g,t,ctx),fork:M.fork(g,t,ctx)};
    let r;
    /* entrance */
    r=rooms.entrance;put(r,4,8,T.SIGN,{type:'sign',text:`Welcome to ${ctx.name||'the region'}! Find the two keys to open the boss door. Walk south out of this room to leave.`});
    for(let x=6;x<=9;x++)for(let y=1;y<=9;y++)if(at(r,x,y)===T.FLOOR)set(r,x,y,T.PATH);
    /* trader and alchemist */
    r=rooms.trader;put(r,8,4,T.NPC,{type:'npc',kind:'trader',name:'Trader',puzzle:'trader'});
    r=rooms.alchemist;put(r,8,4,T.NPC,{type:'npc',kind:'alchemist',name:'Alchemist',puzzle:'brew'});put(r,10,4,T.CAULDRON,{type:'decor'});
    /* fork caves */
    r=rooms.fork;const fo=puz.fork.options;const cx=fo.length===3?[3,8,12]:[4,11];
    fo.forEach((o,i)=>{put(r,cx[i],1,T.CAVE,{type:'cave',i,text:o.text,value:o.value});put(r,cx[i]+1,2,T.SIGN,{type:'sign',text:`This cave holds ${o.text}.`,cave:i})});
    /* stepping stones */
    /* river rows 3-5; the north bank (rows 1-2) stays clear so every column can walk to the gate */
    r=rooms.stones;for(let y=3;y<=5;y++)for(let x=1;x<=W-2;x++)set(r,x,y,T.WATER);
    [2,5,8,11,14].forEach((x,c)=>{for(let row=0;row<3;row++)put(r,x,3+row,T.STONE,{type:'stone',v:puz.stones.cols[c][row],col:c})});
    r.openings.top.forEach(c=>put(r,c,0,T.GATE,{type:'gate'}));
    put(r,8,7,T.SIGN,{type:'sign',text:`Cross on stones that add up to exactly ${puz.stones.target}. Step over ${puz.stones.target} and they sink!`});
    put(r,13,1,T.CHEST,{type:'chest',content:'coins',amount:20+6*t});
    /* hall: water along the top, a bridge with the troll */
    r=rooms.hall;for(let y=1;y<=2;y++)for(let x=1;x<=W-2;x++)set(r,x,y,T.WATER);
    set(r,7,1,T.BRIDGE);set(r,8,1,T.BRIDGE);set(r,8,2,T.BRIDGE);
    put(r,7,2,T.NPC,{type:'npc',kind:'troll',name:'Bridge Troll',puzzle:'toll'});put(r,8,2,T.POST,{type:'post'});
    r.enemies.push({x:4,y:7},{x:11,y:8});
    /* number doors: a wall down the middle with four doors */
    r=rooms.doors;for(let y=1;y<=H-2;y++)set(r,9,y,T.WALL);
    [2,4,6,8].forEach((y,i)=>put(r,9,y,T.DOOR,{type:'door',n:puz.doors.nums[i],ok:i===puz.doors.answer}));
    put(r,5,2,T.SIGN,{type:'sign',text:`Only the door with ${puz.doors.label} opens. The others bite!`});
    r.enemies.push({x:12,y:8});
    /* monster den with the second key */
    r=rooms.den;put(r,12,5,T.CHEST,{type:'chest',content:'key',locked:'den'});r.enemies.push({x:5,y:3},{x:10,y:7},{x:12,y:3});
    /* hidden grove: a bonus chest and a heart */
    r=rooms.grove;put(r,5,4,T.CHEST,{type:'chest',content:'coins',amount:30+8*t});put(r,10,4,T.CHEST,{type:'chest',content:'heart'});r.enemies.push({x:8,y:7});
    /* the elder and the first key */
    r=rooms.riddle;put(r,6,5,T.NPC,{type:'npc',kind:'elder',name:'Elder',puzzle:'riddle'});put(r,9,5,T.CHEST,{type:'chest',content:'key',locked:'riddle'});
    /* share cave */
    r=rooms.share;put(r,8,4,T.NPC,{type:'npc',kind:'friends',name:'Friends',puzzle:'share'});
    /* boss gate hall */
    r=rooms.bossgate;r.openings.top.forEach(c=>put(r,c,0,T.BOSSDOOR,{type:'bossdoor'}));put(r,5,2,T.STATUE,{type:'decor'});put(r,10,2,T.STATUE,{type:'decor'});r.enemies.push({x:4,y:6});
    /* boss room */
    r=rooms.boss;r.enemies.push({x:8,y:4,boss:true});
    /* decorations, seeded by region and tier so each region looks its own way */
    let seed=(RING_INDEX(k)+1)*131+t*17;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
    Object.keys(rooms).forEach(tag=>{const rm=rooms[tag],spots=(SPOTS[tag]||SPOTS.default).slice(),n=2+Math.floor(rnd()*3);
      for(let i=0;i<n&&spots.length;i++){const [x,y]=spots.splice(Math.floor(rnd()*spots.length),1)[0];if(at(rm,x,y)!==T.FLOOR)continue;
        if(near(rm,x,y))continue;set(rm,x,y,rnd()<.7?T.TREE:T.DECOR)}});
    const mirror=t%2===0;
    if(mirror)Object.keys(rooms).forEach(tag=>flip(rooms[tag]));
    const byKey={};Object.keys(rooms).forEach(tag=>{const rm=rooms[tag];if(mirror)rm.rx=3-rm.rx;byKey[key(rm.rx,rm.ry)]=rm});
    return {key:k,g,t,mirror,rooms:byKey,byTag:rooms,puz,start:{rx:rooms.entrance.rx,ry:2,x:7.5,y:8.5},cur,keys:0};
  }
  /* an interactive tile next door would be blocked by a plant */
  function near(r,x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const v=at(r,x+dx,y+dy);if(v!==T.FLOOR&&v!==T.WALL&&v!==T.PATH&&v!==T.TREE&&v!==T.DECOR)return true}return false}
  function flip(r){const g=new Uint8Array(W*H),obj={};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){g[y*W+(W-1-x)]=r.grid[y*W+x];const o=r.obj[y*W+x];if(o){o.x=W-1-x;obj[y*W+o.x]=o}}
    r.grid=g;r.obj=obj;r.enemies.forEach(e=>{e.x=W-1-e.x});
    const o=r.openings;r.openings={top:o.top.map(c=>W-1-c),bottom:o.bottom.map(c=>W-1-c),left:o.right.slice(),right:o.left.slice()}}
  function RING_INDEX(k){return ['lagoon','candy','canopy','ocean','bows','boba','birds','cheer'].indexOf(k)}
  return {W,H,T,SOLID,key,makeRegion,at};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MQWorld;
