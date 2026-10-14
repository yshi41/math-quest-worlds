/* ---------- the arithmetic behind every room ----------
   Pure number generators: grade g (3 or 4) and region tier t (1..8) set the size of the numbers; ctx carries
   the hero's weapon numbers (M melee, R ranged, divs = every weapon value owned). Every generator guarantees a
   solvable puzzle. Node-testable (module.exports). */
const MQMath=(function(){
  const ri=n=>Math.floor(Math.random()*n), rint=(a,b)=>a+ri(Math.max(0,b-a)+1), pick=a=>a[ri(a.length)], chance=p=>Math.random()<p;
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const digitSum=n=>String(n).split('').reduce((a,d)=>a+ +d,0);

  /* ---- rules: a test on a number, with words for the sign ---- */
  function rule(g,t,allow){
    let kinds=g===3?(t<=2?['even','multiple','multiple']:t<=5?['even','odd','multiple','multiple','greater']:['multiple','factor','odd','greater','less','digits'])
      :(t<=2?['multiple','even','factor']:t<=5?['multiple','factor','greater','less','digits']:['multiple','factor','factor','digits','prime']);
    if(allow)kinds=kinds.filter(k=>allow.includes(k));if(!kinds.length)kinds=['multiple'];
    const kind=pick(kinds),range=g===3?(t<=3?30:60):(t<=3?80:150);
    let n,label,test;
    switch(kind){
      case 'even':label='an even number';test=v=>v%2===0;break;
      case 'odd':label='an odd number';test=v=>v%2===1;break;
      case 'multiple':n=g===3?pick(t<=2?[2,5,10]:t<=5?[2,3,4,5,10]:[3,4,6,7,8,9]):pick(t<=2?[3,4,5,6]:t<=5?[6,7,8,9]:[7,8,9,11,12]);label='a multiple of '+n;test=v=>v%n===0;break;
      case 'factor':n=pick(g===3?[12,18,20,24,30]:[24,36,48,60,72,84]);label='a number that divides '+n+' evenly';test=v=>v>=1&&n%v===0;break;
      case 'greater':n=Math.round(range*(0.4+Math.random()*.3));label='a number greater than '+n;test=v=>v>n;break;
      case 'less':n=Math.round(range*(0.3+Math.random()*.3));label='a number less than '+n;test=v=>v<n;break;
      case 'digits':n=rint(5,12);label='a number whose digits add up to '+n;test=v=>digitSum(v)===n;break;
      case 'prime':label='a prime number';test=v=>v>1&&[...Array(v).keys()].slice(2).every(d=>v%d!==0);break;
    }
    return {kind,n,label,test,range};
  }
  /* numbers for a rule: exactly okCount of them fit; the pool depends on the rule so there is always enough of each */
  function ruleNumbers(r,total,okCount){
    const lo=r.kind==='factor'?1:2,hi=r.kind==='factor'?r.n:Math.max(20,r.range);
    const ok=[],no=[];for(let v=lo;v<=hi;v++)(r.test(v)?ok:no).push(v);
    const a=shuffle(ok).slice(0,okCount),b=shuffle(no).slice(0,total-okCount);
    while(a.length<okCount&&ok.length)a.push(pick(ok));while(b.length<total-okCount&&no.length)b.push(pick(no));
    const nums=shuffle(a.concat(b));return {nums,okIdx:nums.map((v,i)=>r.test(v)?i:-1).filter(i=>i>=0)};
  }
  /* an expression that equals v (times tables and friendly sums) or deliberately does not */
  function expr(v,g,wrong){
    const forms=[];
    for(let a=2;a<=12;a++)if(v%a===0&&v/a>=2&&v/a<=12)forms.push(a+' × '+(v/a));
    if(forms.length&&(g===4||v<=50)&&chance(.7))return wrong?wrongExpr(v,g):pick(forms);
    if(wrong)return wrongExpr(v,g);const a=rint(1,v-1),c=v+rint(1,9);return chance(.5)?a+' + '+(v-a):c+' − '+(c-v);
  }
  function wrongExpr(v,g){const w=v+pick([-3,-2,-1,1,2,3,4,10]);return w>1?expr(w,g,false):(v+5)+' − 2'}

  /* ---- stone river: 5 columns of 3 stones; one column is the way across ---- */
  function stones(g,t,ctx){
    const variant=pick(g===3&&t<=2?['sum','sum','rule']:['sum','rule','count']);
    if(variant==='rule'){const r=rule(g,t,['even','odd','multiple','factor','greater','less']);
      for(let tries=0;tries<300;tries++){const cols=[];for(let c=0;c<5;c++){const col=[];for(let k=0;k<3;k++)col.push(rint(r.kind==='factor'?1:2,r.kind==='factor'?r.n:r.range));cols.push(col)}
        const okCols=cols.map(col=>col.every(r.test));const good=okCols.filter(Boolean).length;
        if(good!==1){if(good===0){const c=ri(5);const {nums}=ruleNumbers(r,3,3);cols[c]=nums;if(cols.map(col=>col.every(r.test)).filter(Boolean).length!==1)continue}else continue}
        const answer=cols.findIndex(col=>col.every(r.test));return {variant,label:'Only step on stones showing '+r.label+'.',cols,answer,rule:r}}}
    if(variant==='count'){const k=g===3?pick(t<=3?[2,5,10]:[2,3,4,5,10]):pick([3,4,6,7,8,9,12]);const start=k*rint(1,4);
      const good=[start,start+k,start+2*k];const cols=[];const answer=ri(5);
      for(let c=0;c<5;c++){if(c===answer)cols.push(good.slice());else{let col;do{col=[start+pick([-k,0,k,2*k]),start+pick([0,k,2*k,3*k,k+1,k-1]),start+pick([k,2*k,3*k,2*k+1,2*k-1])]}while(col[0]===good[0]&&col[1]===good[1]&&col[2]===good[2]);cols.push(col)}}
      return {variant,label:'Count up by '+k+': start on '+start+' and step onto the next number each time.',cols,answer,k,start}}
    const lo=g===3?2:5+t, hi=g===3?6+t:14+3*t;
    for(let tries=0;tries<500;tries++){const cols=[];for(let c=0;c<5;c++){const col=[];for(let k=0;k<3;k++)col.push(rint(lo,hi));cols.push(col)}
      const sums=cols.map(sum),answer=ri(5),target=sums[answer];if(sums.filter(s=>s===target).length!==1)continue;
      return {variant:'sum',label:'Cross on stones that add up to exactly '+target+'. Step over '+target+' and they sink!',cols,answer,target}}
    return {variant:'sum',label:'Cross on stones that add up to exactly '+(lo*3)+'.',cols:[[lo,lo,lo],[hi,hi,hi],[hi,hi,lo],[hi,lo,lo],[hi,hi,hi]],answer:0,target:lo*3};
  }
  /* ---- rule doors: four numbers, one door obeys ---- */
  function doors(g,t){const r=rule(g,t);const {nums,okIdx}=ruleNumbers(r,4,1);return {label:'Only the door showing '+r.label+' opens. The others bite!',nums,answer:okIdx[0],rule:r}}
  /* ---- target gallery: shoot the targets that fit; wrong ones shoot back ---- */
  function targets(g,t){
    const variant=pick(g===3&&t<=2?['rule','rule','pair']:['rule','pair','equal']);
    if(variant==='pair'){const target=g===3?rint(16,t<=3?24:40):rint(24,t<=3?60:120);const a=rint(Math.max(1,Math.floor(target*.2)),Math.floor(target*.5)-1),b=target-a;const nums=new Set([a,b]);
      for(let tries=0;tries<400&&nums.size<6;tries++){const v=rint(1,target-1);if(nums.has(target-v)||v===a||v===b)continue;nums.add(v)}
      let extra=1;while(nums.size<6){if(!nums.has(target-extra)&&!nums.has(extra))nums.add(extra);extra++}
      const arr=shuffle([...nums]);
      return {variant,label:'Shoot the two targets that add up to exactly '+target+'. Any other pair shoots back!',nums:arr,ok:arr.map((v,i)=>v===a||v===b?i:-1).filter(i=>i>=0),target}}
    if(variant==='equal'){const v=g===3?rint(6,t<=3?30:60):rint(12,t<=3?80:144);const okN=rint(2,3);const nums=[];for(let i=0;i<6;i++)nums.push(i<okN?expr(v,g,false):expr(v,g,true));
      const arr=shuffle(nums.map((e,i)=>({e,ok:i<okN})));return {variant,label:'Shoot every target that equals '+v+'. The others shoot back!',nums:arr.map(x=>x.e),ok:arr.map((x,i)=>x.ok?i:-1).filter(i=>i>=0),target:v}}
    const r=rule(g,t);const okN=rint(2,3);const {nums,okIdx}=ruleNumbers(r,6,okN);return {variant:'rule',label:'Shoot every target showing '+r.label+'. The others shoot back!',nums,ok:okIdx,rule:r}}
  /* ---- push blocks onto plates ---- */
  function blocks(g,t){
    const variant=pick(g===3&&t<=2?['sum','sum','balance']:['sum','balance','row']);
    if(variant==='balance'){for(let tries=0;tries<300;tries++){const hi=g===3?(t<=3?10:20):(t<=3?25:60);const a=rint(1,hi),b=rint(1,hi),c=rint(1,a+b-1),d=a+b-c;if(c===d&&a===b)continue;const vals=[a,b,c,d];
        /* only one way to split into two equal pairs */
        const splits=[[0,1,2,3],[0,2,1,3],[0,3,1,2]].filter(s=>vals[s[0]]+vals[s[1]]===vals[s[2]]+vals[s[3]]);if(splits.length!==1)continue;
        return {variant,label:'Balance the scale: the two blocks on the left plates must add up to the same as the two on the right.',vals:shuffle(vals),left:2,right:2}}}
    if(variant==='row'){for(let tries=0;tries<300;tries++){const hi=g===3?(t<=3?9:15):(t<=3?20:40);const vals=[];while(vals.length<5){const v=rint(1,hi);if(!vals.includes(v))vals.push(v)}
        const trip=[];for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)for(let k=j+1;k<5;k++)trip.push(vals[i]+vals[j]+vals[k]);const target=pick(trip);if(trip.filter(s=>s===target).length!==1)continue;
        return {variant,label:'Fill the row of three plates with blocks that add up to exactly '+target+'.',vals,target,plates:3}}}
    for(let tries=0;tries<300;tries++){const hi=g===3?(t<=3?12:25):(t<=3?30:70);const vals=[];while(vals.length<4){const v=rint(1,hi);if(!vals.includes(v))vals.push(v)}
      const pairs=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)pairs.push(vals[i]+vals[j]);const target=pick(pairs);if(pairs.filter(s=>s===target).length!==1)continue;
      return {variant:'sum',label:'Push two blocks onto the plates so they add up to exactly '+target+'.',vals,target,plates:2}}
    return {variant:'sum',label:'Push two blocks onto the plates so they add up to exactly 7.',vals:[3,4,9,11],target:7,plates:2};
  }
  /* ---- muncher floor: 15 tiles, step on every one that fits ---- */
  function muncher(g,t){
    if(g===4&&t>=3&&chance(.3)){const v=rint(12,t<=5?60:144);const okN=rint(4,5);const nums=[];for(let i=0;i<15;i++)nums.push(i<okN?expr(v,g,false):expr(v,g,true));const arr=shuffle(nums.map((e,i)=>({e,ok:i<okN})));
      return {variant:'equal',label:'Step on every tile that equals '+v+', and nothing else. Wrong tiles wake the Troggles!',nums:arr.map(x=>x.e),ok:arr.map((x,i)=>x.ok?i:-1).filter(i=>i>=0),target:v}}
    const r=rule(g,t);const okN=rint(4,6);const {nums,okIdx}=ruleNumbers(r,15,okN);return {variant:'rule',label:'Step on every tile showing '+r.label+', and nothing else. Wrong tiles wake the Troggles!',nums,ok:okIdx,rule:r}}
  /* ---- counting path: a 5 by 3 lattice, walk the skip-count ---- */
  function skipPath(g,t){
    const variant=g===3?(t<=4?'up':pick(['up','up','down'])):pick(['up','down','double']);
    const k=g===3?pick(t<=3?[2,5,10]:[2,3,4,5,6,10]):pick([3,4,6,7,8,9,11,12,25]);
    /* the path snakes: (0,2)->(1,2)->(2,2)->(2,1)->(3,1)->(4,1)->(4,0): 7 cells */
    const path=[[0,2],[1,2],[2,2],[2,1],[3,1],[4,1],[4,0]];
    let seq=[];if(variant==='double'){let v=pick([1,2,3,5]);for(let i=0;i<7;i++){seq.push(v);v*=2}}
    else if(variant==='down'){const start=k*rint(8,12);for(let i=0;i<7;i++)seq.push(start-i*k)}
    else{const start=k*rint(0,3);for(let i=0;i<7;i++)seq.push(start+i*k)}
    const grid=[];for(let y=0;y<3;y++){grid.push([]);for(let x=0;x<5;x++)grid[y].push(null)}
    path.forEach((p,i)=>{grid[p[1]][p[0]]=seq[i]});
    for(let y=0;y<3;y++)for(let x=0;x<5;x++)if(grid[y][x]==null){let v;do{v=seq[ri(7)]+pick([-2,-1,1,2,k+1,k-1,-k-1])}while(seq.includes(v)||v<0);grid[y][x]=v}
    const label=variant==='double'?'Start on '+seq[0]+' and step onto double the number each time.':variant==='down'?'Start on '+seq[0]+' and count down by '+k+' each step.':'Start on '+seq[0]+' and count up by '+k+' each step.';
    return {variant,k,seq,grid,path,label};
  }
  /* ---- torches: shoot them in times-table order ---- */
  function torches(g,t){const k=g===3?pick(t<=3?[2,5,10]:[2,3,4,5,10]):pick([3,4,6,7,8,9,12]);const down=g===4&&t>=5&&chance(.4);
    let seq=[1,2,3,4,5].map(i=>i*k);if(down)seq=seq.reverse();const shown=shuffle(seq);return {k,seq,shown,label:(down?'Light the torches counting down by ':'Light the torches counting up by ')+k+': '+(down?'biggest':'smallest')+' first.'}}
  /* ---- dial lock: set the dials to the answer ---- */
  function dials(g,t){const kind=g===3?(t<=3?pick(['sum','prod']):pick(['sum','prod','diff'])):pick(['prod','prod','diff','sum']);let a,b,v,text;
    for(let tries=0;tries<50;tries++){
      if(kind==='prod'){a=rint(2,g===3?9:12);b=rint(2,g===3?(t<=3?5:9):12);v=a*b;text=a+' × '+b}
      else if(kind==='diff'){v=rint(10,g===3?60:99);a=v+rint(5,g===3?30:60);b=a-v;text=a+' − '+b}
      else{a=rint(10,g===3?40:60);b=rint(10,g===3?40:39);v=a+b;text=a+' + '+b}
      if(v<=99)break}
    if(v>99){a=7;b=9;v=63;text='7 × 9'}
    return {kind,v,digits:String(v).padStart(2,'0').split('').map(Number),label:'The lock opens at '+text+'. Hit a dial to turn it.'}}
  /* ---- Number Slimes: each shows a number you can reach exactly with melee M and ranged R hits ---- */
  function numSlimes(g,t,ctx){const M=ctx.M||2,R=ctx.R||3;const n=g===3?3:3;const out=[];const hits=g===3?(t<=3?3:4):(t<=3?4:6);
    for(let i=0;i<n;i++){let v=0;const parts=rint(2,hits);for(let k=0;k<parts;k++)v+=chance(.5)?M:R;out.push(v)}return out}
  /* ---- Factor Beetles: products of the hero's own weapon numbers (2 or 3 factors) ---- */
  function beetles(g,t,ctx){const divs=(ctx.divs&&ctx.divs.length?ctx.divs:[2,3]).filter(d=>d>1);const n=3,out=[];
    for(let i=0;i<n;i++){const f=g===3?(t<=3?2:rint(2,3)):rint(2,3);let v=1;for(let k=0;k<f;k++)v*=pick(divs);if(v>(g===3?60:150))v=pick(divs)*pick(divs);out.push(v)}return out}
  /* ---- bosses ---- */
  function bossShield(g,t,ctx){const M=ctx.M||2,R=ctx.R||3;const phases=[];for(let p=0;p<3;p++){let v=0;const parts=(g===3?3:4)+p+Math.floor(t/4);for(let k=0;k<parts;k++)v+=chance(.5)?M:R;phases.push(v)}return {phases}}
  function bossFactor(g,t,ctx){const divs=(ctx.divs&&ctx.divs.length?ctx.divs:[2,3]).filter(d=>d>1);const phases=[];for(let p=0;p<3;p++){let v=1;const f=2+p+(g===4?1:0);for(let k=0;k<f;k++){const d=pick(divs);if(v*d>(g===3?100:400))break;v*=d}if(v===1)v=pick(divs)*pick(divs);phases.push(v)}return {phases,divs}}
  function bossMinions(g,t){const r=rule(g,t,['multiple','even','odd','factor']);return {rule:r,need:6,label:'It feeds on '+r.label+'!'}}
  function minionNumber(r){const {nums}=ruleNumbers(r,1,chance(.5)?1:0);return nums[0]}
  function bossPattern(g,t){const rounds=[];for(let i=0;i<4;i++){const kind=g===3?pick(t<=3?['up','up','down']:['up','down','double']):pick(['up','down','double','square']);const k=g===3?pick([2,3,4,5,10]):pick([3,4,6,7,8,9,12]);let seq=[];
      if(kind==='double'){let v=pick([1,2,3]);for(let j=0;j<4;j++){seq.push(v);v*=2}}else if(kind==='square'){const s=rint(1,5);for(let j=0;j<4;j++)seq.push((s+j)*(s+j))}else if(kind==='down'){const st=k*rint(6,9);for(let j=0;j<4;j++)seq.push(st-j*k)}else{const st=k*rint(0,3);for(let j=0;j<4;j++)seq.push(st+j*k)}
      const shown=seq.slice(0,3),answer=seq[3];const opts=new Set([answer]);while(opts.size<6){const w=answer+pick([-k,k,-1,1,2,-2,k+1,2*k]);if(w>0)opts.add(w)}rounds.push({shown,answer,opts:shuffle([...opts])})}return {rounds}}
  /* ---- fork caves ---- */
  function fork(g,t,c){const cur=(c&&c.cur)||'gems';const opts=[];const n=g===4&&t>=5?3:2;
    for(let tries=0;tries<100&&opts.length<n;tries++){let o;const kind=g===3?pick(['chests','chests','pile']):pick(['chests','chests','bags','pile']);
      if(kind==='chests'){const k=g===3?rint(2,t<=3?5:9):rint(3,9),v=g===3?rint(2,t<=3?6:10):rint(11,t<=3?19:28);o={text:`${k} chests with ${v} ${cur} each`,value:k*v}}
      else if(kind==='bags'){const k=rint(2,6),v=rint(12,30),e=rint(5,20);o={text:`${k} bags of ${v} ${cur} plus ${e} loose ones`,value:k*v+e}}
      else{const v=g===3?rint(8,t<=3?30:90):rint(40,250);o={text:`one big pile of ${v} ${cur}`,value:v}}
      if(opts.some(x=>x.value===o.value))continue;opts.push(o)}
    let best=0;opts.forEach((o,i)=>{if(o.value>opts[best].value)best=i});return {options:opts,best}}
  /* plain monster strength by tier */
  function monsterHP(g,t,kind){const base=kind==='spiker'?4:kind==='shooter'?3:3;return base+Math.floor((t-1)/2)+(g===4?1:0)}

  return {rule,ruleNumbers,expr,stones,doors,targets,blocks,muncher,skipPath,torches,dials,numSlimes,beetles,bossShield,bossFactor,bossMinions,minionNumber,bossPattern,fork,monsterHP,_r:{ri,rint,pick,shuffle}};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MQMath;
