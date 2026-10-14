/* ---------- Math Quest Worlds: fixed data ---------- */
/* the kids, their home world and the grade their numbers follow (Riley and Addie are in 3rd grade) */
const KIDS=[{id:'charlie',name:'Charlie',theme:'candy',grade:4},{id:'riley',name:'Riley',theme:'lagoon',grade:3},{id:'vera',name:'Vera',theme:'canopy',grade:4},{id:'cora',name:'Cora',theme:'ocean',grade:4},{id:'addie',name:'Addie',theme:'bows',grade:3},{id:'amy',name:'Amy',theme:'boba',grade:4},{id:'hallie',name:'Hallie',theme:'cheer',grade:4}];
/* the eight regions of the world map, in ring order; a kid's home region comes first, then the ring continues */
const RING=['lagoon','candy','canopy','ocean','bows','boba','birds','cheer'];
const RNAME={lagoon:'Axolotl Lagoon',candy:'Sweetshop',canopy:'Rainforest Canopy',ocean:'Jellyfish Ocean',bows:'Bow Boutique',boba:'Boba Shop',birds:'Terror Bird Valley',cheer:'Cheer Gym'};
const WGRAD={lagoon:'linear-gradient(135deg,#CFF0F1,#9BDCE0)',candy:'linear-gradient(135deg,#FFF3F8,#FFD3E6)',canopy:'linear-gradient(135deg,#E4F3D6,#AFDA95)',ocean:'linear-gradient(135deg,#E3E7FF,#B9C3F5)',bows:'linear-gradient(135deg,#FFF0F6,#F8C8DD)',boba:'linear-gradient(135deg,#FFF6EC,#F5D9BD)',birds:'linear-gradient(135deg,#F6E9CF,#E6CFA3)',cheer:'linear-gradient(135deg,#FFF0F7,#FFD1E8)'};
const CUR_ICON={
  lagoon:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#F4EEF8" stroke="#C9BCD9" stroke-width="1.4"/><circle cx="7.4" cy="7" r="2.4" fill="#fff"/></svg>',
  candy:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="1" width="6" height="18" rx="3" fill="#FF5C8A" transform="rotate(30 10 10)"/></svg>',
  canopy:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17C3 7 9 2 18 2C18 11 13 17 3 17Z" fill="#5FAF5A"/><path d="M3 17L13 7" stroke="#2E7D3A" stroke-width="1.5"/></svg>',
  ocean:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#E4D4FF" stroke="#9C7BFF" stroke-width="1.6"/><circle cx="7" cy="7" r="2.2" fill="#fff"/></svg>',
  bows:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 10L2 4V16Z M10 10L18 4V16Z" fill="#FF7EB6"/><circle cx="10" cy="10" r="2.6" fill="#E0559A"/></svg>',
  boba:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#3B2418"/><circle cx="7.2" cy="7" r="2.2" fill="#9A7A6A"/></svg>',
  birds:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M16 3C9 3 4 9 3 17c6-1 11-6 13-14z" fill="#D9772B"/><path d="M3 17L14 5" stroke="#B5541A" stroke-width="1.4"/></svg>',
  cheer:'<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><g stroke-width="2.2" stroke-linecap="round"><path d="M10 10 L10 1.5 M10 10 L18.5 10 M10 10 L10 18.5 M10 10 L1.5 10" stroke="#E0338A"/><path d="M10 10 L16 4 M10 10 L16 16 M10 10 L4 16 M10 10 L4 4" stroke="#7B4BD6"/></g><circle cx="10" cy="10" r="3" fill="#E0338A"/></svg>'};
/* how each region's floor, walls, water and plants are painted on the canvas */
const TILESET={
  lagoon:{ground:'#BFE9DB',ground2:'#B0E0D0',path:'#EAD9A6',wall:'#5E95A8',wallDk:'#436F80',water:'#58BEDA',waterHi:'#A6E4F0',plant:'#2E9E7A',plantDk:'#1F7A5C',plantKind:'coral',bloom:'#FF8FA8',sand:'#F2E3B8'},
  candy:{ground:'#FFDDEB',ground2:'#FFD1E4',path:'#FFF1C9',wall:'#C97BA3',wallDk:'#9E5A82',water:'#7FD3F0',waterHi:'#C6EEFA',plant:'#FF5C8A',plantDk:'#D23A6A',plantKind:'gumdrop',bloom:'#5CC97A',sand:'#FFE9F3'},
  canopy:{ground:'#BFE0A3',ground2:'#AFD692',path:'#D9C089',wall:'#7A6A4E',wallDk:'#5A4C36',water:'#4FB4C9',waterHi:'#9FDCE8',plant:'#2E8B57',plantDk:'#1F6B3F',plantKind:'tree',bloom:'#FF9A3C',sand:'#E6D5A8'},
  ocean:{ground:'#C9CFF7',ground2:'#B9C3F5',path:'#E6E1C8',wall:'#5A5FA6',wallDk:'#3F437D',water:'#4F6FE0',waterHi:'#9FB4F5',plant:'#F06292',plantDk:'#C2416F',plantKind:'coral',bloom:'#7FDBFF',sand:'#E3E7FF'},
  bows:{ground:'#FFE3EF',ground2:'#FCD6E6',path:'#FFF5E8',wall:'#B55C8E',wallDk:'#8D4270',water:'#8CC8FF',waterHi:'#CFE7FF',plant:'#C92A6E',plantDk:'#9E1E55',plantKind:'bow',bloom:'#B98CF0',sand:'#FFF0F6'},
  boba:{ground:'#F3DFC6',ground2:'#ECD3B4',path:'#FFF3E3',wall:'#8A5A3C',wallDk:'#64402A',water:'#C98A52',waterHi:'#E8B98A',plant:'#6B8F3A',plantDk:'#4E6E28',plantKind:'cup',bloom:'#C9336E',sand:'#FBEBD6'},
  birds:{ground:'#E6D5A3',ground2:'#DCC78F',path:'#F3E6C0',wall:'#8E6B45',wallDk:'#6B4E30',water:'#5F9EC2',waterHi:'#A9CFE6',plant:'#5E8C3A',plantDk:'#3F6626',plantKind:'fern',bloom:'#C2552B',sand:'#F2E3B8'},
  cheer:{ground:'#F7D9B8',ground2:'#F0CCA6',path:'#FFF2E2',wall:'#9A5F7F',wallDk:'#73415F',water:'#7BB7F0',waterHi:'#C2DDF9',plant:'#E0338A',plantDk:'#B01E6A',plantKind:'pom',bloom:'#7B4BD6',sand:'#FFEFD8'}};
/* roaming monsters and the boss of each region; each monster has a body shape (0 blob, 1 spiky, 2 ghost) */
const MONSTERS={
  lagoon:{mon:[['Grumpy Crab','#E86A5A',1],['Soggy Eel','#4F8FB8',2],['Snappy Clam','#B48CF0',0]],boss:['King Crab','#D9453A']},
  candy:{mon:[['Sour Gumdrop','#8BD16B',0],['Jawbreaker','#F5A623',1],['Licorice Snake','#4A3B5A',2]],boss:['Giant Gumdrop','#F0468C']},
  canopy:{mon:[['Sneaky Snake','#8FB83A',2],['Cranky Beetle','#7A4F2E',1],['Mossy Golem','#5E8C5A',0]],boss:['Thorn Beast','#B04FC2']},
  ocean:{mon:[['Prickly Urchin','#5A3FA0',1],['Shadow Squid','#3B4A7A',2],['Moody Angler','#2E7F8F',0]],boss:['Kraken','#6A48F5']},
  bows:{mon:[['Tangle Knot','#C92A6E',0],['Snippy Scissors','#7A7F8A',1],['Runaway Ribbon','#7447D6',2]],boss:['Tangle Queen','#E0338A']},
  boba:{mon:[['Sticky Blob','#5A3A2A',0],['Tapioca Troll','#B4532A',1],['Grumpy Straw','#8A4FC2',2]],boss:['Boba Blob','#3B2418']},
  birds:{mon:[['Bone Lizard','#B9A27A',1],['Tar Pit Toad','#3A3A3A',0],['Dusty Vulture','#8A5CC9',2]],boss:['Bone Dragon','#C2552B']},
  cheer:{mon:[['Foul Ball','#A8A8A8',0],['Mean Mascot','#7B4BD6',1],['Stinky Sock','#8BAA3A',2]],boss:['Grouchy Referee','#D6334F']}};
/* useful gear for the hero: one item per slot */
const WEAPONS=[{id:'w0',name:'Twig',moves:[3,5,8],price:0,blurb:'A trusty stick.'},{id:'w1',name:'Bubble Wand',moves:[4,7,12],price:120,blurb:'Pops with a 12.'},{id:'w2',name:'Coral Sword',moves:[6,9,15],price:260,blurb:'Sharp sixes, nines and fifteens.'},{id:'w3',name:'Thunder Hammer',moves:[8,14,20],price:450,blurb:'Big swings of 8, 14 and 20.'},{id:'w4',name:'Star Blade',moves:[10,15,25],price:700,blurb:'Tens, fifteens and a 25.'},{id:'w5',name:'Dragon Lance',moves:[12,18,30],price:1000,blurb:'The mightiest moves: 12, 18, 30.'}];
const SHIELDS=[{id:'s1',name:'Leaf Shield',block:1,price:150,blurb:'Blocks 1 damage from every hit.'},{id:'s2',name:'Shell Shield',block:2,price:320,blurb:'Blocks 2 damage from every hit.'},{id:'s3',name:'Star Shield',block:3,price:600,blurb:'Blocks 3 damage from every hit.'}];
const CHARMS=[{id:'c1',name:'Heart Charm',hearts:2,price:180,blurb:'+2 hearts.'},{id:'c2',name:'Big Heart Charm',hearts:4,price:420,blurb:'+4 hearts.'},{id:'c3',name:'Phoenix Feather',hearts:2,revive:true,price:800,blurb:'+2 hearts, and once per region you get back up with 3 hearts.'}];
const BOOTS=[{id:'b1',name:'Hop Boots',miss:1,price:140,blurb:'One wrong door or sunk stone per region costs no heart.'},{id:'b2',name:'Swift Boots',dodge:true,price:300,blurb:'The first hit of every battle misses you.'},{id:'b3',name:'Rocket Boots',miss:1,dodge:true,price:650,blurb:'Hop Boots and Swift Boots in one.'}];
const GEAR={weapon:WEAPONS,shield:SHIELDS,charm:CHARMS,boots:BOOTS};
const GEAR_NAMES={weapon:'Weapons',shield:'Shields',charm:'Charms',boots:'Boots'};
const GEAR_BY_ID={};Object.keys(GEAR).forEach(s=>GEAR[s].forEach(it=>{GEAR_BY_ID[it.id]=Object.assign({slot:s},it)}));
/* pets, their cosmetic accessories and their useful tags */
const PETS=[{id:'pup',name:'Pup',price:200,blurb:'A bouncy puppy.'},{id:'kit',name:'Kit',price:200,blurb:'A curious kitten.'},{id:'bun',name:'Bun',price:250,blurb:'A fluffy bunny.'},{id:'hoot',name:'Hoot',price:300,blurb:'A wise little owl.'},{id:'blob',name:'Blob',price:300,blurb:'A giggly slime.'},{id:'drako',name:'Drako',price:500,blurb:'A baby dragon.'}];
const PET_COS=[{id:'pc1',slot:'head',name:'Red Bow',price:60},{id:'pc8',slot:'head',name:'Flower',price:70},{id:'pc2',slot:'head',name:'Party Hat',price:90},{id:'pc7',slot:'head',name:'Wizard Hat',price:150},{id:'pc6',slot:'head',name:'Tiny Crown',price:200},{id:'pc3',slot:'neck',name:'Star Collar',price:80},{id:'pc4',slot:'neck',name:'Cozy Scarf',price:90},{id:'pc5',slot:'eyes',name:'Cool Shades',price:110}];
const PET_TAGS=[{id:'t1',name:'Jingle Bell',price:180,blurb:'+5 coins after every battle.'},{id:'t3',name:'Snack Pouch',price:300,blurb:'+1 heart after every battle.'},{id:'t2',name:'Treasure Nose',price:320,blurb:'Chests hold 25% more.'},{id:'t4',name:'Lucky Paw',price:450,blurb:'One wrong door or sunk stone per region costs no heart.'},{id:'t5',name:'Guard Collar',price:600,blurb:'Your pet blocks one hit in every battle.'}];
const PET_BY_ID={};PETS.forEach(p=>PET_BY_ID[p.id]=p);PET_COS.forEach(p=>PET_BY_ID[p.id]=p);PET_TAGS.forEach(p=>PET_BY_ID[p.id]=p);
/* cosmetic outfit prices: the world's ten level outfits, then the shared accessories keep their own prices */
const OUTFIT_PRICES=[60,100,150,200,260,330,400,480,560,650];
/* level thresholds: level = number of entries at or below the character's xp */
const LV_XP=[0,40,100,180,280,400,540,700,880,1080,1300,1540,1800,2080,2380,2700,3040,3400,3780,4180];
const PET_WORDS={pup:'your pup',kit:'your kitten',bun:'your bunny',hoot:'your owl',blob:'your slime',drako:'your dragon'};
