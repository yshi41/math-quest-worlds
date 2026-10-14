/* ---------- the arithmetic behind every puzzle ----------
   Pure number generators: grade g (3 or 4) and region tier t (1..8) set the size of the numbers.
   Every generator guarantees a solvable puzzle with one right answer. Node-testable (module.exports). */
const MQMath=(function(){
  const ri=n=>Math.floor(Math.random()*n), rint=(a,b)=>a+ri(Math.max(0,b-a)+1), pick=a=>a[ri(a.length)], chance=p=>Math.random()<p;
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

  /* stepping stones: 5 columns of 3 stones; exactly one column adds up to the target */
  function stones(g,t){
    const lo=g===3?2:5+t, hi=g===3?6+t:14+3*t;
    for(let tries=0;tries<500;tries++){
      const cols=[];for(let c=0;c<5;c++){const col=[];for(let r=0;r<3;r++)col.push(rint(lo,hi));cols.push(col)}
      const sums=cols.map(sum), answer=ri(5), target=sums[answer];
      if(sums.filter(s=>s===target).length!==1)continue;
      return {target,cols,answer};
    }
    return {target:lo*3,cols:[[lo,lo,lo],[hi,hi,hi],[hi,hi,lo],[hi,lo,lo],[hi,hi,hi]],answer:0};
  }

  /* number doors: four numbers, one rule, exactly one door obeys it */
  function doors(g,t){
    let m, range;
    if(g===3){ m=pick(t<=2?[2,5,10]:t<=5?[2,3,4,5,10]:[3,4,6,8,5]); range=t<=3?30:60 }
    else { m=pick(t<=2?[3,4,6,5]:t<=5?[6,7,8,9]:[7,8,9,12,11]); range=t<=3?80:150 }
    if(g===4&&t>=4&&chance(.3)){
      const N=pick([24,36,48,60,72]), fs=[];for(let d=2;d<N;d++)if(N%d===0)fs.push(d);
      const correct=pick(fs), wrong=new Set();while(wrong.size<3){const v=rint(2,N-1);if(N%v!==0&&v!==correct)wrong.add(v)}
      const nums=shuffle([correct,...wrong]);return {label:'a number that divides '+N+' evenly',nums,answer:nums.indexOf(correct),m:N,kind:'factor'};
    }
    const label=m===2?'an even number':'a multiple of '+m;
    const correct=m*rint(2,Math.max(2,Math.floor(range/m))), wrong=new Set();
    while(wrong.size<3){const v=rint(3,range);if(v%m!==0&&v!==correct)wrong.add(v)}
    const nums=shuffle([correct,...wrong]);
    return {label,nums,answer:nums.indexOf(correct),m,kind:'multiple'};
  }

  /* the elder's riddle: "I'm thinking of a number..." */
  function riddle(g,t){
    const kinds=g===3?(t<=3?['add','sub','groups']:t<=6?['add','sub','groups','double']:['add','sub','groups','double','half'])
      :(t<=3?['double+','add','sub','groups','times-']:t<=6?['times+','add','sub','div','groups']:['times-','add3','div','times+']);
    const k=pick(kinds);let ans,text;
    const big=g===3?(t<=3?60:t<=6?200:500):(t<=3?500:1000);
    const nice=n=>n>=100?Math.round(n/5)*5:n;
    switch(k){
      case 'add':{ans=nice(rint(5,Math.floor(big*.6)));const a=nice(rint(4,Math.floor(big*.4)));text=`Add ${a} to my number and you get ${ans+a}.`;break}
      case 'sub':{ans=nice(rint(10,big));const a=nice(rint(3,Math.floor(ans*.7)));text=`Take ${a} away from my number and you get ${ans-a}.`;break}
      case 'groups':{const n=rint(2,g===3&&t<=3?5:9),kk=rint(2,g===3?(t<=3?5:10):12);ans=n*kk;text=`I have ${n} baskets with ${kk} shells in each. How many shells is that?`;break}
      case 'double':{ans=rint(3,g===3?(t<=6?25:50):60);text=`Double my number and you get ${ans*2}.`;break}
      case 'half':{ans=rint(3,40)*2;text=`Half of my number is ${ans/2}.`;break}
      case 'double+':{ans=rint(3,40);const a=rint(2,15);text=`Double my number, then add ${a}, and you get ${ans*2+a}.`;break}
      case 'times-':{const m=rint(3,9);ans=rint(3,20);const a=rint(1,ans*m-1>10?10:ans*m-1);text=`Multiply my number by ${m}, then take away ${a}, and you get ${ans*m-a}.`;break}
      case 'times+':{const m=rint(3,9);ans=rint(3,25);const a=rint(2,20);text=`Multiply my number by ${m}, then add ${a}, and you get ${ans*m+a}.`;break}
      case 'div':{const d=rint(3,9),q=rint(3,15);ans=d*q;text=`Share my number between ${d} friends and each gets ${q}.`;break}
      case 'add3':{const a=nice(rint(50,300)),b=nice(rint(50,300));ans=nice(rint(50,400));text=`My number plus ${a} plus ${b} makes ${ans+a+b}.`;break}
    }
    return {text:`I'm thinking of a number. ${text} What is my number?`,answer:ans,kind:k};
  }

  /* the toll bridge: a price per leg and a party with a known number of legs */
  function toll(g,t,c){
    const pet=c&&c.pet;
    const party=[['you',2]];
    party.push(pet?[pet,4]:['the old turtle',4]);
    if(g===3){ if(t>=4)party.push(['two seagulls',4]); if(t>=7)party.push(['a spider',8]) }
    else { party.push(pick([['three crabs',24],['two spiders',16],['four seagulls',8],['a centipede',30]])); if(t>=4)party.push(pick([['a beetle',6],['two ducks',4],['three cats',12]])) }
    const p=g===3?rint(2,t<=3?5:9):rint(3,t<=3?9:12);
    const legs=sum(party.map(x=>x[1]));
    const who=party.map((x,i)=>`${x[0]} (${x[1]} legs)`).join(', ').replace(/, ([^,]*)$/,' and $1');
    return {text:`Halt! The toll is ${p} coins for every leg that crosses. Crossing today: ${who}. How many coins do you pay?`,answer:p*legs,p,legs};
  }

  /* the trader: so many pearls for every shell */
  function trader(g,t,c){
    const cur=(c&&c.cur)||'pearls';
    let r,n;
    if(g===3){ if(t<=2){r=rint(2,5);n=rint(2,5)} else if(t<=5){r=rint(2,9);n=rint(2,9)} else {r=rint(3,9);n=rint(4,12)} }
    else { if(t<=3){r=rint(3,9);n=rint(11,19)} else if(t<=6){r=rint(4,12);n=rint(12,25)} else {r=rint(6,15);n=rint(15,40)} }
    const goods=pick(['shells','acorns','buttons','feathers','marbles']);
    return {text:`I give ${r} ${cur} for every one of your ${goods}. You have ${n} ${goods}. How many ${cur} will you ask me for?`,answer:r*n,r,n};
  }

  /* the alchemist: potions from ingredients, limited by the scarcer one */
  function brew(g,t,c){
    const potion=pick(['Fizzy Potion','Giggle Tonic','Rainbow Brew','Moonlight Elixir']);
    const ingA=pick(['glow mushrooms','sunberries','star seeds']), ingB=pick(['dewdrops','moon petals','honey drops']);
    if(g===3&&t<=3){ const k=rint(2,5),m=rint(2,9);return {text:`The ${potion} needs ${k} ${ingA} for every bottle. You gathered ${k*m} ${ingA}. How many bottles can we brew?`,answer:m,potion} }
    let a,b,x,y;
    if(g===3){ a=rint(2,4);b=rint(2,5);const m1=rint(2,9),m2=rint(2,9);x=a*m1+(t>=6?ri(a):0);y=b*m2+(t>=6?ri(b):0) }
    else { a=rint(2,6);b=rint(3,8);const m1=rint(3,12),m2=rint(3,12);x=a*m1+ri(a);y=b*m2+ri(b) }
    const ans=Math.min(Math.floor(x/a),Math.floor(y/b));
    return {text:`The ${potion} needs ${a} ${ingA} and ${b} ${ingB} for every bottle. You gathered ${x} ${ingA} and ${y} ${ingB}. How many bottles can we brew?`,answer:ans,potion};
  }

  /* the share cave: a pile shared fairly, sometimes with a remainder question */
  function share(g,t,c){
    const pet=c&&c.pet;
    const d=g===3?rint(2,5):rint(3,9), s=g===3?rint(2,t<=3?10:12):rint(4,15);
    const friends=d-(pet?2:1);
    const group=pet?`you, ${pet}${friends>0?` and ${friends} friend${friends>1?'s':''}`:''}`:`you and ${friends} friend${friends>1?'s':''}`;
    const thing=pick(['shiny shells','gems','gold buttons','star coins']);
    if(g===4&&t>=5&&chance(.4)){ const r=rint(1,d-1);return {text:`We found ${d*s+r} ${thing}! We share them fairly between ${group}, that's ${d} of us, and the pet gets whatever is left over. How many are left over?`,answer:r,share:s,d} }
    return {text:`We found ${d*s} ${thing}! We share them fairly between ${group}, that's ${d} of us. How many does each of us get?`,answer:s,share:s,d};
  }

  /* the fork: caves with different hauls; the best haul is the right pick */
  function fork(g,t,c){
    const cur=(c&&c.cur)||'gems';
    const opts=[];
    const n=g===4&&t>=5?3:2;
    for(let tries=0;tries<100&&opts.length<n;tries++){
      let o;
      const kind=g===3?pick(['chests','chests','pile']):pick(['chests','chests','bags','pile']);
      if(kind==='chests'){const k=g===3?rint(2,t<=3?5:9):rint(3,9),v=g===3?rint(2,t<=3?6:10):rint(11,t<=3?19:28);o={text:`${k} chests with ${v} ${cur} each`,value:k*v}}
      else if(kind==='bags'){const k=rint(2,6),v=rint(12,30),e=rint(5,20);o={text:`${k} bags of ${v} ${cur} plus ${e} loose ones`,value:k*v+e}}
      else {const v=g===3?rint(8,t<=3?30:90):rint(40,250);o={text:`one big pile of ${v} ${cur}`,value:v}}
      if(opts.some(x=>x.value===o.value))continue;
      opts.push(o);
    }
    let best=0;opts.forEach((o,i)=>{if(o.value>opts[best].value)best=i});
    return {options:opts,best};
  }

  /* a monster's HP is a sum of the hero's own moves, so an exact finish is always possible */
  function battleHP(g,t,moves,o){
    o=o||{};
    let n=g===3?Math.min(5,2+Math.ceil(t/3)):Math.min(7,3+Math.ceil(t/2.5));
    if(o.boss)n+=2;
    const dbl=g===4||t>=3;
    const plan=[];for(let i=0;i<n;i++)plan.push(pick(moves));
    if(dbl&&chance(.4)){const i=ri(plan.length);plan[i]=plan[i]*2}
    return {hp:sum(plan),plan,double:dbl};
  }
  function monsterPower(g,t,boss){const m=g===3?1+Math.floor((t-1)/3):1+Math.floor(t/3);return m+(boss?1:0)}

  return {stones,doors,riddle,toll,trader,brew,share,fork,battleHP,monsterPower,cap,_r:{ri,rint,pick,shuffle}};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MQMath;
