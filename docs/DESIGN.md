# Math Quest Worlds — mechanics design (v2, 10/14/2026)

Goal from Yan: real action combat (melee + ranged, character-themed), killable monsters with drops, bosses and
level progression built on math that lives **in the action**, many puzzle kinds and variations, one simple
graphics set until the mechanics are right.

## What the research says (and what we take from it)

- **Intrinsic integration** (Habgood & Ainsworth 2011, *Zombie Division*; Cutting & Iacovides 2022): learning
  gains are highest when the math sits inside the most enjoyable mechanic and the game world itself. In Zombie
  Division the zombies wear numbers and the weapons are divisors; you only hurt a zombie with a weapon whose
  number divides its number. The later study showed the gain comes from where the player's attention goes.
  → Our monsters wear numbers; our weapons *are* numbers; attacking is the math.
- **Number Munchers** (MECC 1986): a grid of numbers, eat every one that fits the rule (multiples, factors,
  primes, equality), lose a life on a wrong one, while Troggles roam. → the Muncher room and the target gallery.
- **Exact-number enemies** (Talystro, Krumit's Quest): enemies are numbers, you must land on them exactly;
  precision over power. → Number Slimes and the Shield Boss (reach exactly 0 or it resets).
- **Zelda dungeon grammar** (Zelda Wiki: block, switch, target, torch puzzles; Gnome Stew on distractors):
  blocks onto floor switches, shoot the target, light torches in order, with enemies as pressure.
  → every puzzle is a Zelda room with numbers on the blocks, targets and torches.
- **Classroom puzzles**: skip-counting mazes, magic squares, balance scales, KenKen cages, number locks.
  → the counting path, block sums, the balance plates, the dial lock.
- **Flow / productive failure**: clear goal, instant feedback, cheap retries, difficulty by tier. A wrong step
  costs a heart or resets the room, never a lecture. The sign states the rule once; the room teaches the rest.

## Core action

- Hero turns to face up/down/left/right, walks with a step animation. **Melee** (Z, J, Space, button A):
  a swing in front of the hero. **Ranged** (X, K, button B): a projectile; costs 1 ammo, ammo refills slowly
  and drops from monsters. Attacks are named and coloured per character (Axolotl: Tail Whip / Bubble Pop).
- Every weapon has a **number**: the melee value M and the ranged value R (start: 2 and 3). Plain monsters take
  that much damage. Math monsters read the number:
  - **Number Slime** shows N: hits subtract M or R; land on exactly 0 and it pops with double loot; go below
    and it bounces back to N.
  - **Factor Beetle** shows N: only a hit whose value divides N hurts it, and N becomes N ÷ value; it dies at 1.
    A beetle showing 35 needs a 5 or a 7, so found weapons matter.
- Monsters drop coins, hearts, ammo, and now and then a weapon or armour piece.
- Bosses drop a special weapon or armour; the secret room's puzzle gives a rare item.

## Puzzle catalogue (each has variants picked by grade and tier)

| Room | Mechanic | Variants |
|---|---|---|
| Stone river | hop stones across water | exact sum; only stones that fit a rule; count up by k |
| Rule doors | walk into the one door that fits | multiples, factors, even/odd, greater/less than, digit sum |
| Target gallery | **shoot** the targets that fit, wrong ones fire back | multiples, factors, the pair that adds to the target, expressions equal to the target |
| Push blocks | push numbered blocks onto plates | two blocks that add to the target; balance the scale (left = right); a row of three |
| Muncher floor | step on every tile that fits, wrong tiles spawn Troggles | multiples, factors, even/odd, greater than, expressions |
| Counting path | walk the tiles in skip-count order, a wrong tile sends you back | count up by k, count down by k, doubling |
| Torch order | **shoot** torches in times-table order | k, 2k, 3k … ; descending |
| Dial lock | **hit** dials to set the code | product, sum, difference |
| Arena | clear the math monsters | Number Slimes (exact), Factor Beetles (divisors) |
| Fork caves | pick the richer haul | products vs piles |

## Bosses (one design per region, rotating)

1. **Shield Boss** — a number shield; hits subtract M or R; exactly 0 breaks it and stuns the boss; below 0 resets it.
2. **Factor Boss** — only divisor hits shrink its number; at 1 the phase ends; it spawns beetles.
3. **Minion Boss** — invulnerable; feeds on a rule ("multiples of 6"); kill fitting minions to hurt it, wrong ones heal it.
4. **Pattern Boss** — floor plates with numbers; stand on the next number of its sequence before the slam lands.

## Region layout

```
puzzle A (key)   boss gate (3 keys)   puzzle B (key)   secret room (rare item)
puzzle C (loot)  hall (monsters)      puzzle D (loot)  arena (key)
fork caves       ENTRANCE             puzzle E (loot)  monster nest (loot)
```
Puzzle rooms are drawn from the catalogue without repeats, so two regions rarely play the same.

## Sources
- Habgood & Ainsworth, *Motivating children to learn effectively: exploring the value of intrinsic integration*, JLS 2011 — https://tca2.education.illinois.edu/docs/librariesprovider23/default-document-library/j-of-the-learning-sc-2011-habgood.pdf
- Cutting & Iacovides, *Learning by Doing: Intrinsic Integration Directs Attention to Increase Learning in Games*, ACM 2022 — https://dl.acm.org/doi/abs/10.1145/3549503
- Number Munchers — https://en.wikipedia.org/wiki/Number_Munchers
- Zelda Wiki: Puzzle / Block / Floor Switch — https://zelda.fandom.com/wiki/Puzzle
- Gnome Stew, *What Legend of Zelda can teach us about dungeon design* — https://gnomestew.com/what-legend-of-zelda-can-take-us-about-dungeon-design/
- PC Gamer on Talystro's exact-number battles — https://www.pcgamer.com/games/roguelike/this-roguelike-deckbuilder-may-look-like-edutainment-but-its-maths-based-battles-are-surprisingly-tense-and-strategic/
- Skip-counting mazes (Cazoom, Education.com) — https://www.cazoommaths.com/us/math-worksheet/count-in-3s-maze-worksheet/
- Balance-scale puzzles (edu-games.org, Polypad) — https://polypad.amplify.com/lesson/building-balance-scale-puzzle
- Magic squares and KenKen for grades 3–4 — https://www.math-salamanders.com/magic-square-worksheets.html
- Filament Games on friction in learning games — https://www.filamentgames.com/blog/why-effective-educational-games-require-friction
