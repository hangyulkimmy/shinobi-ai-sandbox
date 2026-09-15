// src/data/defaults.ts
import type { Ninja, Move } from "../types/game";

/**
 * Kunai is auto-added to every ninja:
 * [T] Kunai Throw — 10 power, 100% acc, 0 CHK
 */
const KUNAI: Move = {
  id: "kunai",
  name: "Kunai Throw",
  cat: "T",
  power: 10,
  acc: 100,
  chk: 0,
  desc: "Free basic attack.",
};

function withKunai(n: Ninja): Ninja {
  // If you ever decide to manually include kunai in a ninja kit, this avoids duplicates.
  const hasKunai = n.moves.some((m) => m.id === "kunai");
  return hasKunai ? n : { ...n, moves: [...n.moves, KUNAI] };
}

function idFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Helper to make move ids stable */
function mid(ninjaId: string, short: string) {
  return `${ninjaId}__${short}`;
}

// ----------------------------
// RAW (your pasted 48 ninjas)
// ----------------------------
export const RAW_NINJAS: Ninja[] = [
  {
    id: idFromName("Tsunade"),
    name: "Tsunade",
    category: "Leaf",
    hp: 290,
    chk: 150,
    atk: 150,
    ctr: 150,
    def: 140,
    spd: 116,
    abilityText: `Antidote:
Poison is cured after 1 round.
If affected by Genjutsu (Disorient),
its duration is reduced by 1 round (after 1 round).`,
    moves: [
      { id: mid(idFromName("Tsunade"), "mystical-palm"), name: "Mystical Palm", cat: "S", power: null, acc: 100, chk: 20, desc: "Heal anybody 20hp" },
      { id: mid(idFromName("Tsunade"), "creation-rebirth"), name: "Creation Rebirth", cat: "S", power: null, acc: 100, chk: 100, desc: "Heal somebody to full health but stunned for 2 turns" },
      { id: mid(idFromName("Tsunade"), "a-flick"), name: "A Flick", cat: "T", power: 25, acc: 95, chk: 10, desc: "Flick an opponent for 10 dmg (stun 30%)" },
      { id: mid(idFromName("Tsunade"), "chakra-enhanced-punch"), name: "Chakra Enhanced Punch", cat: "T", power: 40, acc: 100, chk: 20, desc: "Punch an opponent for 20 dmg" },
      { id: mid(idFromName("Tsunade"), "chakra-enhanced-earthquake"), name: "Chakra Enhanced Earthquake", cat: "N", power: 40, acc: 100, chk: 30, desc: "AOE - Cause an earthquake for 20 dmg" },
    ],
  },

  {
    id: idFromName("Killer B"),
    name: "Killer B",
    category: "Cloud",
    hp: 280,
    chk: 150,
    atk: 142,
    ctr: 138,
    def: 138,
    spd: 136,
    abilityText: `Gyuki Boost -
Heals 20% of max HP when transformed`,
    moves: [
      { id: mid(idFromName("Killer B"), "lightning-lariat"), name: "Lightning Lariat", cat: "T", power: 45, acc: 95, chk: 20, desc: "Rush strike (stun 20%)" },
      { id: mid(idFromName("Killer B"), "kenjutsu-flurry"), name: "Kenjutsu Flurry", cat: "T", power: 32, acc: 100, chk: 10, desc: "Sword combo" },
      { id: mid(idFromName("Killer B"), "ink-splash"), name: "Ink Splash", cat: "N", power: 20, acc: 100, chk: 20, desc: "AOE ink hit: lower Speed -10 permanently (100%)" },
      { id: mid(idFromName("Killer B"), "version-2-cloak"), name: "Version 2 Cloak", cat: "S", power: null, acc: 100, chk: 25, desc: "Transform permanently (ATK +15, DEF +10, Speed -15). Take 5 dmg every turn. On transform: heal 20% max HP once" },
      { id: mid(idFromName("Killer B"), "tailed-beast-bomb"), name: "Tailed Beast Bomb", cat: "N", power: 90, acc: 85, chk: 70, desc: "AOE finisher (only usable while transformed)" },
    ],
  },

  {
    id: idFromName("Orochimaru"),
    name: "Orochimaru",
    category: "Leaf",
    hp: 280,
    chk: 150,
    atk: 116,
    ctr: 142,
    def: 142,
    spd: 128,
    abilityText: `Serpent Escape -
Negate stun for 20 CHK once`,
    moves: [
      { id: mid(idFromName("Orochimaru"), "poison-fangs"), name: "Poison Fangs", cat: "N", power: 25, acc: 95, chk: 20, desc: "Bite attack. Poison 60%" },
      { id: mid(idFromName("Orochimaru"), "snake-swarm"), name: "Snake Swarm", cat: "N", power: 60, acc: 90, chk: 45, desc: "AOE snake barrage. Poison 40%" },
      { id: mid(idFromName("Orochimaru"), "summon-manda-guard"), name: "Summon: Manda (Guard)", cat: "S", power: null, acc: 100, chk: 40, desc: "Summon Manda: Orochimaru takes 40% less damage until Manda blocks 60 total damage, then disappears" },
      { id: mid(idFromName("Orochimaru"), "curse-mark"), name: "Curse Mark", cat: "N", power: null, acc: 90, chk: 45, desc: "Increases target ATK by 30% and applies Curse" },
      { id: mid(idFromName("Orochimaru"), "manda-constriction"), name: "Manda: Constriction", cat: "N", power: 65, acc: 90, chk: 35, desc: "If Manda is active: damage / reduce target Speed -15 for 2 turns" },
    ],
  },

  {
    id: idFromName("Kisame Hoshigaki"),
    name: "Kisame Hoshigaki",
    category: "Mist",
    hp: 290,
    chk: 145,
    atk: 130,
    ctr: 113,
    def: 148,
    spd: 130,
    abilityText: `Shark Skin -
Any [T] hit drains up to 8 CHK from the target
and restores his CHK by that amount`,
    moves: [
      { id: mid(idFromName("Kisame Hoshigaki"), "samehada-slash"), name: "Samehada Slash", cat: "T", power: 40, acc: 100, chk: 20, desc: "Slash (triggers CHK drain)" },
      { id: mid(idFromName("Kisame Hoshigaki"), "shark-rush"), name: "Shark Rush", cat: "T", power: 32, acc: 100, chk: 10, desc: "Rush hit (triggers CHK drain)" },
      { id: mid(idFromName("Kisame Hoshigaki"), "water-shark-bomb"), name: "Water Shark Bomb", cat: "N", power: 75, acc: 90, chk: 45, desc: "Heavy water strike" },
      { id: mid(idFromName("Kisame Hoshigaki"), "water-prison-jutsu"), name: "Water Prison Jutsu", cat: "S", power: null, acc: 80, chk: 55, desc: "80% hit: Stun 2 turns; Kisame N-only 2 turns" },
      { id: mid(idFromName("Kisame Hoshigaki"), "water-clone-jutsu"), name: "Water Clone Jutsu", cat: "S", power: null, acc: 100, chk: 40, desc: "Create 1-hit clone for 15 HP" },
    ],
  },

  {
    id: idFromName("Minato Namikaze"),
    name: "Minato Namikaze",
    category: "Leaf",
    hp: 260,
    chk: 145,
    atk: 118,
    ctr: 145,
    def: 118,
    spd: 150,
    abilityText: `Flying Raijin Mastery -
If the target is a Marked enemy,
his move costs 30% less CHK (rounded down)`,
    moves: [
      { id: mid(idFromName("Minato Namikaze"), "flying-raijin-slash"), name: "Flying Raijin Slash", cat: "T", power: 35, acc: 100, chk: 10, desc: "Quick slash" },
      { id: mid(idFromName("Minato Namikaze"), "rasengan"), name: "Rasengan", cat: "N", power: 75, acc: 90, chk: 45, desc: "Heavy single hit" },
      { id: mid(idFromName("Minato Namikaze"), "flying-raijin-mark"), name: "Flying Raijin Mark", cat: "S", power: null, acc: 100, chk: 15, desc: "Mark target (3 turns); marked target SPD -10 (2 turns)" },
      { id: mid(idFromName("Minato Namikaze"), "flash-step-assault"), name: "Flash Step Assault", cat: "N", power: 40, acc: 100, chk: 20, desc: "+50% BP if target is Marked" },
      { id: mid(idFromName("Minato Namikaze"), "flying-raijin-escape"), name: "Flying Raijin Escape", cat: "S", power: null, acc: 100, chk: 35, desc: "The chosen ally will dodge the next single-target hit within 2 turns" },
    ],
  },

  {
    id: idFromName("Pain"),
    name: "Pain",
    category: "Mist",
    hp: 260,
    chk: 150,
    atk: 120,
    ctr: 140,
    def: 134,
    spd: 122,
    abilityText: `Rinnegan Pressure:
The first time each turn Pain is hit,
reduce the damage by 10%`,
    moves: [
      { id: mid(idFromName("Pain"), "shinra-tensei"), name: "Shinra Tensei", cat: "N", power: 55, acc: 90, chk: 40, desc: "AOE push; SPD -10 (2T)" },
      { id: mid(idFromName("Pain"), "bansho-tenin"), name: "Bansho Tenin", cat: "N", power: 45, acc: 95, chk: 25, desc: "Pull hit; Stun 30% (1T)" },
      { id: mid(idFromName("Pain"), "chakra-rods"), name: "Chakra Rods", cat: "N", power: 50, acc: 90, chk: 30, desc: "Hit; Stun 40% (1T)" },
      { id: mid(idFromName("Pain"), "chibaku-tensei"), name: "Chibaku Tensei", cat: "N", power: 90, acc: 85, chk: 70, desc: "AOE nuke; Pain -10 HP EOR (2T)" },
      { id: mid(idFromName("Pain"), "outer-path-revive"), name: "Outer Path Revive", cat: "S", power: null, acc: 100, chk: 80, desc: "OP Revive (1x): revive recent dead (2R) to 50%; cost 40 true dmg each (most recent first; min 1 HP)" },
    ],
  },

  {
    id: idFromName("A (4th Raikage)"),
    name: "A (4th Raikage)",
    category: "Cloud",
    hp: 280,
    chk: 120,
    atk: 145,
    ctr: 105,
    def: 132,
    spd: 146,
    abilityText: `Lightning Armor:
Take 15% less damage while above 50% HP`,
    moves: [
      { id: mid(idFromName("A (4th Raikage)"), "lariat"), name: "Lariat", cat: "T", power: 45, acc: 95, chk: 20, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("A (4th Raikage)"), "guillotine-drop"), name: "Guillotine Drop", cat: "T", power: 70, acc: 90, chk: 45, desc: "Heavy hit; DEF -15 (2T)" },
      { id: mid(idFromName("A (4th Raikage)"), "lightning-chop"), name: "Lightning Chop", cat: "T", power: 40, acc: 100, chk: 20, desc: "Hit; Vulnerable (next hit +20% dmg, team)" },
      { id: mid(idFromName("A (4th Raikage)"), "lightning-armor-burst"), name: "Lightning Armor Burst", cat: "S", power: null, acc: 100, chk: 35, desc: "Self buff (3T): ATK +15, DEF +10, SPD +10; Stun-immune (1T)" },
      { id: mid(idFromName("A (4th Raikage)"), "elbow-blitz"), name: "Elbow Blitz", cat: "T", power: 28, acc: 100, chk: 25, desc: "2-hit attack; if both hit: N/G locked (1T)" },
    ],
  },

  {
    id: idFromName("Kakashi Hatake"),
    name: "Kakashi Hatake",
    category: "Leaf",
    hp: 260,
    chk: 135,
    atk: 122,
    ctr: 136,
    def: 125,
    spd: 140,
    abilityText: `Sharingan:
The first time an enemy uses a move,
Kakashi stores it.
Once per battle, Kakashi may use
Copy to cast the stored move with -10% accuracy`,
    moves: [
      { id: mid(idFromName("Kakashi Hatake"), "chidori"), name: "Chidori", cat: "N", power: 55, acc: 95, chk: 35, desc: "Hit" },
      { id: mid(idFromName("Kakashi Hatake"), "kamui"), name: "Kamui", cat: "S", power: null, acc: 100, chk: 80, desc: "Kamui (1x): enemy under 35% HP dies" },
      { id: mid(idFromName("Kakashi Hatake"), "lightning-beast-fang"), name: "Lightning Beast Fang", cat: "N", power: 50, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Kakashi Hatake"), "thousand-years-of-death"), name: "Thousand Years of Death", cat: "T", power: 25, acc: 95, chk: 10, desc: "Hit; Stun 30% (1T)" },
      { id: mid(idFromName("Kakashi Hatake"), "mangekyo-sharingan"), name: "Mangekyo Sharingan", cat: "S", power: null, acc: 100, chk: 70, desc: "Remove ally or enemy (2T); if enemy: -10% HP/turn and Kakashi +10% HP/turn (2T) (1x)" },
    ],
  },

  {
    id: idFromName("Jiraiya"),
    name: "Jiraiya",
    category: "Leaf",
    hp: 270,
    chk: 140,
    atk: 120,
    ctr: 138,
    def: 125,
    spd: 130,
    abilityText: `Toad Contract:
While Gamabunta is active,
Jiraiya takes 15% less damage
and his Ninjutsu costs 20% less CHK`,
    moves: [
      { id: mid(idFromName("Jiraiya"), "fire-style-flame-bomb"), name: "Fire Style: Flame Bomb", cat: "N", power: 60, acc: 90, chk: 35, desc: "Hit" },
      { id: mid(idFromName("Jiraiya"), "toad-oil-flame-bullet"), name: "Toad Oil Flame Bullet", cat: "N", power: 55, acc: 90, chk: 40, desc: "AOE; Poison 30%" },
      { id: mid(idFromName("Jiraiya"), "dark-swamp"), name: "Dark Swamp", cat: "N", power: 50, acc: 90, chk: 40, desc: "AOE; SPD -15 (2T)" },
      { id: mid(idFromName("Jiraiya"), "summon-gamabunta"), name: "Summon: Gamabunta", cat: "S", power: null, acc: 100, chk: 45, desc: "Summon (3T): -15% dmg taken; ATK +10" },
      { id: mid(idFromName("Jiraiya"), "toad-song-genjutsu"), name: "Toad Song Genjutsu", cat: "G", power: null, acc: 80, chk: 55, desc: "Disorient (2T)" },
    ],
  },

  {
    id: idFromName("Naruto Uzumaki"),
    name: "Naruto Uzumaki",
    category: "Leaf",
    hp: 270,
    chk: 150,
    atk: 136,
    ctr: 96,
    def: 130,
    spd: 136,
    abilityText: `Kurama Cloak:
When Naruto drops below 30% HP (1x),
heal 20% max HP and gain
ATK +20, CTR +40, DEF +20`,
    moves: [
      { id: mid(idFromName("Naruto Uzumaki"), "shadow-clone-jutsu"), name: "Shadow Clone Jutsu", cat: "S", power: null, acc: 100, chk: 25, desc: "Create 1-hit clone (15 HP)" },
      { id: mid(idFromName("Naruto Uzumaki"), "shadow-clone-barrage"), name: "Shadow Clone Barrage", cat: "T", power: 30, acc: 100, chk: 20, desc: "Req clone: 2-hit attack" },
      { id: mid(idFromName("Naruto Uzumaki"), "rasengan"), name: "Rasengan", cat: "N", power: 75, acc: 90, chk: 45, desc: "Heavy hit" },
      { id: mid(idFromName("Naruto Uzumaki"), "rasenshuriken"), name: "Rasenshuriken", cat: "N", power: 90, acc: 85, chk: 70, desc: "AOE nuke; Naruto Stun (1T); max 3 uses" },
      { id: mid(idFromName("Naruto Uzumaki"), "uzumaki-rush"), name: "Uzumaki Rush", cat: "T", power: 35, acc: 100, chk: 15, desc: "Hit; SPD -10 (2T)" },
    ],
  },

  {
    id: idFromName("Gaara"),
    name: "Gaara",
    category: "Sand",
    hp: 280,
    chk: 140,
    atk: 105,
    ctr: 129,
    def: 150,
    spd: 115,
    abilityText: `Shukaku Awakening:
When Gaara drops below 30% HP (1x),
Partial Transform (3T): DEF +20, CTR +25, ATK +10;
on trigger, apply BLIND -5 ACC (2T) to all enemies;
Gaara takes -5 HP EOR (3T)`,
    moves: [
      { id: mid(idFromName("Gaara"), "sand-coffin"), name: "Sand Coffin", cat: "N", power: 45, acc: 95, chk: 30, desc: "Hit; MARKED (3T)" },
      { id: mid(idFromName("Gaara"), "sand-burial"), name: "Sand Burial", cat: "N", power: 80, acc: 90, chk: 55, desc: "If target is MARKED: heavy hit" },
      { id: mid(idFromName("Gaara"), "sand-tsunami"), name: "Sand Tsunami", cat: "N", power: 70, acc: 90, chk: 55, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Gaara"), "sand-armor"), name: "Sand Armor", cat: "S", power: null, acc: 100, chk: 35, desc: "Self buff (3T): DEF +20, SPD -10" },
      { id: mid(idFromName("Gaara"), "desert-mirage"), name: "Desert Mirage", cat: "S", power: null, acc: 100, chk: 45, desc: "Team EVASION +15 (2T)" },
    ],
  },

  {
    id: idFromName("Sasuke Uchiha"),
    name: "Sasuke Uchiha",
    category: "Leaf",
    hp: 260,
    chk: 135,
    atk: 127,
    ctr: 127,
    def: 123,
    spd: 134,
    abilityText: `Vengeance:
When an ally dies, Sasuke gains ATK +10 and CTR +10
(battle) (max 2 stacks)`,
    moves: [
      { id: mid(idFromName("Sasuke Uchiha"), "chidori"), name: "Chidori", cat: "N", power: 75, acc: 90, chk: 50, desc: "Heavy hit" },
      { id: mid(idFromName("Sasuke Uchiha"), "fireball-jutsu"), name: "Fireball Jutsu", cat: "N", power: 60, acc: 90, chk: 40, desc: "AOE" },
      { id: mid(idFromName("Sasuke Uchiha"), "shuriken-jutsu"), name: "Shuriken Jutsu", cat: "T", power: 35, acc: 95, chk: 25, desc: "AOE; MARKED (3T)" },
      { id: mid(idFromName("Sasuke Uchiha"), "sharingan-genjutsu"), name: "Sharingan Genjutsu", cat: "G", power: null, acc: 85, chk: 35, desc: "Disorient (1T)" },
      { id: mid(idFromName("Sasuke Uchiha"), "amaterasu"), name: "Amaterasu", cat: "N", power: 55, acc: 85, chk: 55, desc: "Hit; Burn -5% HP EOR (permanent)" },
    ],
  },

  {
    id: idFromName("Itachi Uchiha"),
    name: "Itachi Uchiha",
    category: "Leaf",
    hp: 250,
    chk: 145,
    atk: 110,
    ctr: 138,
    def: 118,
    spd: 138,
    abilityText: `Genjutsu Master:
Itachi is immune to Genjutsu (Disorient).
Enemies hit by Itachi’s Genjutsu
take 10 true dmg EOR for 2 turns`,
    moves: [
      { id: mid(idFromName("Itachi Uchiha"), "tsukuyomi"), name: "Tsukuyomi", cat: "G", power: null, acc: 80, chk: 55, desc: "Disorient (3T)" },
      { id: mid(idFromName("Itachi Uchiha"), "phoenix-flame"), name: "Fire Style: Phoenix Flame", cat: "N", power: 45, acc: 90, chk: 35, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Itachi Uchiha"), "amaterasu"), name: "Amaterasu", cat: "N", power: null, acc: 85, chk: 65, desc: "Hit; Burn -5% HP EOR (permanent)" },
      { id: mid(idFromName("Itachi Uchiha"), "susanoo-guard"), name: "Susanoo Guard", cat: "S", power: null, acc: 100, chk: 40, desc: "Self buff (2T): DEF +20, EVASION +10" },
      { id: mid(idFromName("Itachi Uchiha"), "shuriken-shadow-clone"), name: "Shuriken Shadow Clone", cat: "T", power: 22, acc: 100, chk: 15, desc: "2-hit; MARKED (3T)" },
    ],
  },

  {
    id: idFromName("Might Guy"),
    name: "Might Guy",
    category: "Leaf",
    hp: 260,
    chk: 120,
    atk: 148,
    ctr: 98,
    def: 128,
    spd: 148,
    abilityText: `Eight Gates:
Once per battle, open Gates (3T):
ATK +25, SPD +20, EVASION +10, DEF -20;
take -10 HP EOR (3T)`,
    moves: [
      { id: mid(idFromName("Might Guy"), "dynamic-entry"), name: "Dynamic Entry", cat: "T", power: 35, acc: 100, chk: 10, desc: "Hit; BLIND -10 ACC (1T)" },
      { id: mid(idFromName("Might Guy"), "leaf-hurricane"), name: "Leaf Hurricane", cat: "T", power: 40, acc: 95, chk: 20, desc: "AOE" },
      { id: mid(idFromName("Might Guy"), "primary-lotus"), name: "Primary Lotus", cat: "T", power: 75, acc: 90, chk: 45, desc: "Heavy hit; Stun 20% (1T)" },
      { id: mid(idFromName("Might Guy"), "gate-release"), name: "Gate Release", cat: "S", power: null, acc: 100, chk: 35, desc: "Activate Eight Gates (3T)" },
      { id: mid(idFromName("Might Guy"), "night-guy"), name: "Night Guy", cat: "T", power: 120, acc: 75, chk: 80, desc: "Ultimate hit; 75% ACC; Guy Stun (1T)" },
    ],
  },

  {
    id: idFromName("Kakuzu"),
    name: "Kakuzu",
    category: "Other",
    hp: 280,
    chk: 130,
    atk: 122,
    ctr: 112,
    def: 145,
    spd: 112,
    abilityText: `Earth Grudge Fear:
4 extra hearts.
On lethal dmg, consume 1 heart and
revive immediately at 25% HP (no cleanse).
If lethal occurs before Kakuzu acts that round,
he loses that action.`,
    moves: [
      { id: mid(idFromName("Kakuzu"), "fire-mask-blast"), name: "Fire Mask Blast", cat: "N", power: 60, acc: 90, chk: 45, desc: "AOE" },
      { id: mid(idFromName("Kakuzu"), "wind-mask-pressure"), name: "Wind Mask Pressure", cat: "N", power: 50, acc: 90, chk: 40, desc: "AOE; BLIND -10 ACC (2T)" },
      { id: mid(idFromName("Kakuzu"), "lightning-mask-spear"), name: "Lightning Mask Spear", cat: "N", power: 65, acc: 90, chk: 50, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Kakuzu"), "water-mask-torrent"), name: "Water Mask Torrent", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Kakuzu"), "thread-stitching"), name: "Thread Stitching", cat: "S", power: null, acc: 100, chk: 35, desc: "Heal self 25 HP" },
    ],
  },

  {
    id: idFromName("Yamato"),
    name: "Yamato",
    category: "Leaf",
    hp: 260,
    chk: 130,
    atk: 108,
    ctr: 135,
    def: 132,
    spd: 120,
    abilityText: `Wood Style Control:
When Yamato uses a Support move,
grant the target EVASION +10 (2T)`,
    moves: [
      { id: mid(idFromName("Yamato"), "wood-wall"), name: "Wood Wall", cat: "N", power: null, acc: 100, chk: 25, desc: "Self DEF +15 (3T, stacks 3)" },
      { id: mid(idFromName("Yamato"), "wood-binding"), name: "Wood Binding", cat: "N", power: 45, acc: 95, chk: 30, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Yamato"), "deep-forest-emergence"), name: "Deep Forest Emergence", cat: "N", power: 60, acc: 90, chk: 50, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Yamato"), "suppression-formation"), name: "Suppression Formation", cat: "S", power: null, acc: 100, chk: 35, desc: "Team DEF +10 (3T, stacks 3)" },
      { id: mid(idFromName("Yamato"), "wood-clone"), name: "Wood Clone", cat: "S", power: null, acc: 100, chk: 55, desc: "Create clone (30 HP)" },
    ],
  },

  {
    id: idFromName("Sakura Haruno"),
    name: "Sakura Haruno",
    category: "Leaf",
    hp: 240,
    chk: 105,
    atk: 134,
    ctr: 148,
    def: 120,
    spd: 126,
    abilityText: `Medical Prodigy:
Sakura’s heals restore +10 extra HP
if the target is below 50% HP`,
    moves: [
      { id: mid(idFromName("Sakura Haruno"), "healing-jutsu"), name: "Healing Jutsu", cat: "S", power: 20, acc: 100, chk: 20, desc: "Heal ally 20 HP" },
      { id: mid(idFromName("Sakura Haruno"), "emergency-surgery"), name: "Emergency Surgery", cat: "S", power: 35, acc: 100, chk: 40, desc: "Heal ally 35 HP; cleanse Poison + Burn" },
      { id: mid(idFromName("Sakura Haruno"), "chakra-punch"), name: "Chakra Punch", cat: "T", power: 40, acc: 100, chk: 20, desc: "Hit" },
      { id: mid(idFromName("Sakura Haruno"), "ground-smash"), name: "Ground Smash", cat: "T", power: 45, acc: 90, chk: 35, desc: "AOE" },
      { id: mid(idFromName("Sakura Haruno"), "strength-of-a-hundred"), name: "Strength of a Hundred", cat: "S", power: null, acc: 100, chk: 60, desc: "Self buff (battle): ATK +15, DEF +10; -5 HP EOR" },
    ],
  },

  {
    id: idFromName("Kabuto Yakushi"),
    name: "Kabuto Yakushi",
    category: "Other",
    hp: 250,
    chk: 140,
    atk: 105,
    ctr: 141,
    def: 115,
    spd: 124,
    abilityText: `Anatomy Expert:
Kabuto’s Ninjutsu moves ignore 15% of the target’s DEF`,
    moves: [
      { id: mid(idFromName("Kabuto Yakushi"), "chakra-scalpel"), name: "Chakra Scalpel", cat: "N", power: 50, acc: 95, chk: 30, desc: "DEF -10 (2T) | Hit" },
      { id: mid(idFromName("Kabuto Yakushi"), "poison-needle"), name: "Poison Needle", cat: "N", power: 25, acc: 95, chk: 20, desc: "Poison 50% | Hit" },
      { id: mid(idFromName("Kabuto Yakushi"), "temple-strike"), name: "Temple Strike", cat: "N", power: 40, acc: 95, chk: 25, desc: "Stun 30% (1T) | Hit" },
      { id: mid(idFromName("Kabuto Yakushi"), "cellular-regeneration"), name: "Cellular Regeneration", cat: "S", power: null, acc: 100, chk: 35, desc: "Heal self 20 HP" },
      { id: mid(idFromName("Kabuto Yakushi"), "nerve-disruption-genjutsu"), name: "Nerve Disruption Genjutsu", cat: "G", power: null, acc: 80, chk: 55, desc: "AOE; Disorient (1T)" },
    ],
  },

  {
    id: idFromName("Obito Uchiha"),
    name: "Obito Uchiha",
    category: "Leaf",
    hp: 200,
    chk: 135,
    atk: 118,
    ctr: 139,
    def: 118,
    spd: 139,
    abilityText: `Kamui Intangibility:
Every 3 rounds,
the first hit Obito would take deals 0 damage`,
    moves: [
      { id: mid(idFromName("Obito Uchiha"), "warp-strike"), name: "Warp Strike (Priority)", cat: "T", power: 45, acc: 95, chk: 20, desc: "Priority hit; MARKED (3T)" },
      { id: mid(idFromName("Obito Uchiha"), "great-fireball"), name: "Fire Style: Great Fireball", cat: "N", power: 60, acc: 90, chk: 40, desc: "AOE" },
      { id: mid(idFromName("Obito Uchiha"), "kamui-phase"), name: "Kamui Phase", cat: "S", power: null, acc: 100, chk: 35, desc: "EVASION +20 (2T)" },
      { id: mid(idFromName("Obito Uchiha"), "cutting-sprigs"), name: "Wood Style: Cutting Sprigs", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Obito Uchiha"), "uchiha-return"), name: "Uchiha Return", cat: "S", power: null, acc: 100, chk: 70, desc: "Swap HP% with ally (1x)" },
    ],
  },

  {
    id: idFromName("Rock Lee"),
    name: "Rock Lee",
    category: "Leaf",
    hp: 250,
    chk: 120,
    atk: 132,
    ctr: 94,
    def: 128,
    spd: 142,
    abilityText: `Hard Work:
When Rock Lee uses a Taijutsu move,
gain FOCUS +10 ACC (2T) (stacks 3)`,
    moves: [
      { id: mid(idFromName("Rock Lee"), "leaf-hurricane"), name: "Leaf Hurricane", cat: "T", power: 40, acc: 95, chk: 20, desc: "AOE" },
      { id: mid(idFromName("Rock Lee"), "primary-lotus"), name: "Primary Lotus", cat: "T", power: 75, acc: 90, chk: 45, desc: "Heavy hit; Stun 20% (1T)" },
      { id: mid(idFromName("Rock Lee"), "hidden-lotus"), name: "Hidden Lotus", cat: "T", power: 110, acc: 80, chk: 80, desc: "Ultimate hit; Lee Stun (1T)" },
      { id: mid(idFromName("Rock Lee"), "gate-of-opening"), name: "Gate of Opening", cat: "S", power: null, acc: 100, chk: 35, desc: "Self buff (3T): ATK +20, SPD +15, DEF -15; -5 HP EOR (3T)" },
      { id: mid(idFromName("Rock Lee"), "leaf-whirlwind"), name: "Leaf Whirlwind", cat: "T", power: 35, acc: 100, chk: 15, desc: "Hit; SPD -10 (2T)" },
    ],
  },

  {
    id: idFromName("Neji Hyuga"),
    name: "Neji Hyuga",
    category: "Leaf",
    hp: 250,
    chk: 120,
    atk: 118,
    ctr: 122,
    def: 128,
    spd: 140,
    abilityText: `Byakugan Precision:
Neji’s Taijutsu moves have +5 Base ACC
and ignore 10% of target DEF`,
    moves: [
      { id: mid(idFromName("Neji Hyuga"), "gentle-fist"), name: "Gentle Fist", cat: "T", power: 40, acc: 100, chk: 15, desc: "Hit; target CHK -10" },
      { id: mid(idFromName("Neji Hyuga"), "64-palms"), name: "Eight Trigrams: 64 Palms", cat: "T", power: null, acc: 90, chk: 70, desc: "64-hit: 1 true dmg per hit; every 4 hits drain 1 CHK (total -16 CHK)" },
      { id: mid(idFromName("Neji Hyuga"), "rotation"), name: "Rotation", cat: "T", power: null, acc: 100, chk: 30, desc: "Self DEF +20 (1T); EVASION +10 for that move only" },
      { id: mid(idFromName("Neji Hyuga"), "byakugan-focus"), name: "Byakugan Focus", cat: "S", power: null, acc: 100, chk: 25, desc: "FOCUS +15 ACC (2T)" },
      { id: mid(idFromName("Neji Hyuga"), "air-palm"), name: "Air Palm", cat: "T", power: 45, acc: 95, chk: 20, desc: "Hit; MARKED (3T)" },
    ],
  },

  {
    id: idFromName("Hinata Hyuga"),
    name: "Hinata Hyuga",
    category: "Leaf",
    hp: 270,
    chk: 140,
    atk: 108,
    ctr: 128,
    def: 118,
    spd: 125,
    abilityText: `Protective Byakugan:
Once per round, when an ally is targeted
by a single-target move,
grant them EVASION +10 for that move only`,
    moves: [
      { id: mid(idFromName("Hinata Hyuga"), "gentle-step"), name: "Gentle Step", cat: "T", power: 35, acc: 100, chk: 15, desc: "Hit; target CHK -8" },
      { id: mid(idFromName("Hinata Hyuga"), "twin-lion-fists"), name: "Twin Lion Fists", cat: "T", power: 70, acc: 90, chk: 45, desc: "Heavy hit; target CHK -12" },
      { id: mid(idFromName("Hinata Hyuga"), "protective-stance"), name: "Protective Stance", cat: "S", power: null, acc: 100, chk: 30, desc: "Grant ally DEF +10 (3T, stacks 3)" },
      { id: mid(idFromName("Hinata Hyuga"), "byakugan-focus"), name: "Byakugan Focus", cat: "S", power: null, acc: 100, chk: 25, desc: "Self FOCUS +15 ACC (2T)" },
      { id: mid(idFromName("Hinata Hyuga"), "air-palm"), name: "Air Palm", cat: "T", power: 40, acc: 95, chk: 20, desc: "Hit; MARKED (3T)" },
    ],
  },

  {
    id: idFromName("Suigetsu Hozuki"),
    name: "Suigetsu Hozuki",
    category: "Mist",
    hp: 250,
    chk: 120,
    atk: 125,
    ctr: 110,
    def: 123,
    spd: 122,
    abilityText: `Liquid Body:
Take 20% less damage from Taijutsu moves`,
    moves: [
      { id: mid(idFromName("Suigetsu Hozuki"), "executioner-slash"), name: "Executioner Slash", cat: "T", power: 75, acc: 90, chk: 40, desc: "Heavy hit; MARKED (2T)" },
      { id: mid(idFromName("Suigetsu Hozuki"), "water-arm-smash"), name: "Water Arm Smash", cat: "T", power: 45, acc: 95, chk: 25, desc: "Hit; DEF -10 (2T)" },
      { id: mid(idFromName("Suigetsu Hozuki"), "water-wave"), name: "Water Wave", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Suigetsu Hozuki"), "liquefy"), name: "Liquefy", cat: "S", power: null, acc: 100, chk: 30, desc: "Self EVASION +15 (2T); cleanse Poison" },
      { id: mid(idFromName("Suigetsu Hozuki"), "water-clone"), name: "Water Clone", cat: "S", power: null, acc: 100, chk: 50, desc: "Create clone (25 HP)" },
    ],
  },

  {
    id: idFromName("Choji Akimichi"),
    name: "Choji Akimichi",
    category: "Leaf",
    hp: 290,
    chk: 110,
    atk: 138,
    ctr: 85,
    def: 136,
    spd: 110,
    abilityText: `Calorie Control:
Once per battle, when Choji drops below 40% HP,
heal 20% max HP and gain ATK +15, DEF +15 (3T)`,
    moves: [
      { id: mid(idFromName("Choji Akimichi"), "human-boulder"), name: "Human Boulder", cat: "T", power: 45, acc: 95, chk: 25, desc: "AOE" },
      { id: mid(idFromName("Choji Akimichi"), "spiky-human-boulder"), name: "Spiky Human Boulder", cat: "T", power: 55, acc: 90, chk: 40, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Choji Akimichi"), "butterfly-punch"), name: "Butterfly Punch", cat: "T", power: 75, acc: 90, chk: 45, desc: "Heavy hit; Vulnerable (next hit +20% dmg, team)" },
      { id: mid(idFromName("Choji Akimichi"), "calorie-chips"), name: "Calorie Chips", cat: "S", power: null, acc: 100, chk: 35, desc: "Heal self 25 HP" },
      { id: mid(idFromName("Choji Akimichi"), "partial-expansion"), name: "Partial Expansion", cat: "S", power: null, acc: 100, chk: 30, desc: "Self DEF +15 (3T, stacks 3)" },
    ],
  },

  {
    id: idFromName("Hiruzen Sarutobi"),
    name: "Hiruzen Sarutobi",
    category: "Leaf",
    hp: 240,
    chk: 130,
    atk: 105,
    ctr: 132,
    def: 115,
    spd: 120,
    abilityText: `Professor:
Hiruzen’s Ninjutsu moves cost
15% less CHK (rounded down)`,
    moves: [
      { id: mid(idFromName("Hiruzen Sarutobi"), "dragon-flame"), name: "Fire Style: Dragon Flame", cat: "N", power: 55, acc: 90, chk: 40, desc: "AOE" },
      { id: mid(idFromName("Hiruzen Sarutobi"), "mud-wall"), name: "Earth Style: Mud Wall", cat: "N", power: null, acc: 100, chk: 30, desc: "Self DEF +15 (3T, stacks 3)" },
      { id: mid(idFromName("Hiruzen Sarutobi"), "shuriken-storm"), name: "Wind Style: Shuriken Storm", cat: "N", power: 45, acc: 90, chk: 35, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Hiruzen Sarutobi"), "shock-blade"), name: "Lightning Style: Shock Blade", cat: "N", power: 60, acc: 90, chk: 45, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Hiruzen Sarutobi"), "reaper-seal"), name: "Reaper Seal", cat: "S", power: null, acc: 85, chk: 90, desc: "Execute (1x): if target below 30% HP, KO; otherwise deal 40 dmg" },
    ],
  },

  {
    id: idFromName("Mei Terumi"),
    name: "Mei Terumi",
    category: "Mist",
    hp: 250,
    chk: 140,
    atk: 95,
    ctr: 133,
    def: 110,
    spd: 118,
    abilityText: `Acidic Aftertaste:
The first enemy Mei hits each round
takes 6 true dmg EOR for 2 turns`,
    moves: [
      { id: mid(idFromName("Mei Terumi"), "quicklime"), name: "Lava Style: Quicklime", cat: "N", power: 55, acc: 90, chk: 40, desc: "Hit; Burn -3% HP EOR (3T)" },
      { id: mid(idFromName("Mei Terumi"), "boil-mist"), name: "Boil Release: Mist", cat: "N", power: null, acc: 90, chk: 45, desc: "AOE; BLIND -10 ACC (2T)" },
      { id: mid(idFromName("Mei Terumi"), "water-dragon"), name: "Water Style: Water Dragon", cat: "N", power: 60, acc: 90, chk: 50, desc: "AOE" },
      { id: mid(idFromName("Mei Terumi"), "hidden-mist"), name: "Hidden Mist Jutsu", cat: "S", power: null, acc: 100, chk: 40, desc: "Team EVASION +10 (2T)" },
      { id: mid(idFromName("Mei Terumi"), "acid-vapor-blast"), name: "Acid Vapor Blast", cat: "N", power: 70, acc: 85, chk: 65, desc: "AOE; Burn -3% HP EOR (3T)" },
    ],
  },

  {
    id: idFromName("Sasori"),
    name: "Sasori",
    category: "Sand",
    hp: 240,
    chk: 135,
    atk: 95,
    ctr: 120,
    def: 130,
    spd: 118,
    abilityText: `Living Puppet:
Sasori is immune to Poison.
The first time he would die, set HP to 25% instead (1x)`,
    moves: [
      { id: mid(idFromName("Sasori"), "iron-sand-assault"), name: "Iron Sand Assault", cat: "N", power: 55, acc: 90, chk: 40, desc: "Hit; MARKED (3T)" },
      { id: mid(idFromName("Sasori"), "poison-needle-barrage"), name: "Poison Needle Barrage", cat: "N", power: 25, acc: 90, chk: 25, desc: "AOE; Poison 50%" },
      { id: mid(idFromName("Sasori"), "puppet-swarm"), name: "Puppet Swarm", cat: "N", power: 50, acc: 90, chk: 45, desc: "AOE; DEF -10 (2T)" },
      { id: mid(idFromName("Sasori"), "hiruko-shell"), name: "Hiruko Shell", cat: "S", power: null, acc: 100, chk: 35, desc: "Self DEF +15 (3T, stacks 3)" },
      { id: mid(idFromName("Sasori"), "hundred-puppets"), name: "Hundred Puppets", cat: "N", power: 90, acc: 85, chk: 75, desc: "AOE nuke; 85% ACC" },
    ],
  },

  {
    id: idFromName("Utakata"),
    name: "Utakata",
    category: "Mist",
    hp: 240,
    chk: 140,
    atk: 90,
    ctr: 130,
    def: 110,
    spd: 126,
    abilityText: `Bubble Counter:
When Utakata is hit by a Taijutsu move,
apply Poison to the attacker
(6 dmg EOR, permanent, non-stack)`,
    moves: [
      { id: mid(idFromName("Utakata"), "bubble-shot"), name: "Bubble Shot", cat: "N", power: 45, acc: 95, chk: 30, desc: "Hit; BLIND -10 ACC (2T)" },
      { id: mid(idFromName("Utakata"), "soap-bubble-trap"), name: "Soap Bubble Trap", cat: "N", power: 35, acc: 90, chk: 30, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Utakata"), "bubble-minefield"), name: "Bubble Minefield", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Utakata"), "version-2-bubble-cloak"), name: "Version 2 Bubble Cloak", cat: "S", power: null, acc: 100, chk: 55, desc: "Transform (battle): CTR +20, DEF +10, SPD +10; take 5 dmg EOR" },
      { id: mid(idFromName("Utakata"), "tailed-bubble-burst"), name: "Tailed Bubble Burst", cat: "N", power: 90, acc: 85, chk: 75, desc: "AOE nuke; 85% ACC" },
    ],
  },

  {
    id: idFromName("Jugo"),
    name: "Jugo",
    category: "Other",
    hp: 270,
    chk: 120,
    atk: 140,
    ctr: 70,
    def: 140,
    spd: 110,
    abilityText: `Unstable Surge:
Once per round, the first time Jugo takes damage,
gain +8 CHK and FOCUS +15 (2T),
then take 4 dmg immediately.`,
    moves: [
      { id: mid(idFromName("Jugo"), "brutal-palm-strike"), name: "Brutal Palm Strike", cat: "T", power: 45, acc: 95, chk: 20, desc: "Stun 20% (1T) | Hit" },
      { id: mid(idFromName("Jugo"), "rage-uppercut"), name: "Rage Uppercut", cat: "T", power: 75, acc: 90, chk: 45, desc: "MARKED (2T) | Heavy hit" },
      { id: mid(idFromName("Jugo"), "arm-cannon-smash"), name: "Arm Cannon Smash", cat: "T", power: 55, acc: 90, chk: 40, desc: "AOE" },
      { id: mid(idFromName("Jugo"), "natural-energy-mutation"), name: "Natural Energy Mutation", cat: "S", power: null, acc: 100, chk: 55, desc: "Transform (battle)" },
      { id: mid(idFromName("Jugo"), "berserk-lunge"), name: "Berserk Lunge (Priority)", cat: "T", power: 85, acc: 90, chk: 50, desc: "PRIORITY | Heavy hit; SPD -10 (2T)" },
    ],
  },

  {
    id: idFromName("Onoki"),
    name: "Onoki",
    category: "Stone",
    hp: 240,
    chk: 145,
    atk: 75,
    ctr: 146,
    def: 118,
    spd: 100,
    abilityText: `Earth Style Specialist:
Onoki’s Earth Style moves deal +15% damage.`,
    moves: [
      { id: mid(idFromName("Onoki"), "atomic-dismantling"), name: "Dust Release: Atomic Dismantling", cat: "N", power: 95, acc: 85, chk: 80, desc: "Hit; 85% ACC" },
      { id: mid(idFromName("Onoki"), "stone-golem"), name: "Earth Style: Stone Golem", cat: "N", power: null, acc: 100, chk: 35, desc: "Self DEF +15 (3T, stacks 3)" },
      { id: mid(idFromName("Onoki"), "weighted-boulder"), name: "Weighted Boulder Jutsu", cat: "N", power: 45, acc: 90, chk: 40, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Onoki"), "light-weight-technique"), name: "Light-Weight Technique", cat: "S", power: null, acc: 100, chk: 25, desc: "FOCUS +15 (2T) | Self" },
      { id: mid(idFromName("Onoki"), "stone-shuriken-barrage"), name: "Stone Shuriken Barrage", cat: "N", power: 40, acc: 90, chk: 35, desc: "MARKED (2T) | AOE" },
    ],
  },

  {
    id: idFromName("Asuma Sarutobi"),
    name: "Asuma Sarutobi",
    category: "Leaf",
    hp: 240,
    chk: 120,
    atk: 112,
    ctr: 109,
    def: 115,
    spd: 124,
    abilityText: `Wind Blades:
Asuma’s Taijutsu hits apply MARKED (2T)
25% of the time (refresh-only).`,
    moves: [
      { id: mid(idFromName("Asuma Sarutobi"), "chakra-blade-slash"), name: "Chakra Blade Slash", cat: "T", power: 45, acc: 100, chk: 15, desc: "Hit" },
      { id: mid(idFromName("Asuma Sarutobi"), "twin-blade-rush"), name: "Twin Blade Rush", cat: "T", power: 55, acc: 95, chk: 25, desc: "Stun 20% (1T) | Hit" },
      { id: mid(idFromName("Asuma Sarutobi"), "wind-cutter"), name: "Wind Cutter", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE" },
      { id: mid(idFromName("Asuma Sarutobi"), "smoke-screen"), name: "Smoke Screen", cat: "S", power: null, acc: 90, chk: 35, desc: "BLIND -15 ACC (2T) | AOE" },
      { id: mid(idFromName("Asuma Sarutobi"), "decapitation-strike"), name: "Decapitation Strike", cat: "T", power: 85, acc: 85, chk: 55, desc: "Hit; 85% ACC; +20% dmg vs MARKED targets" },
    ],
  },

  {
    id: idFromName("Konan"),
    name: "Konan",
    category: "Mist",
    hp: 240,
    chk: 140,
    atk: 82,
    ctr: 128,
    def: 110,
    spd: 120,
    abilityText: `Paper Affinity:
Konan takes 20% less damage from
Ninjutsu moves that are not Fire,
but takes 20% more damage from Fire Ninjutsu.`,
    moves: [
      { id: mid(idFromName("Konan"), "paper-shuriken-storm"), name: "Paper Shuriken Storm", cat: "N", power: 50, acc: 90, chk: 35, desc: "MARKED (2T) | AOE" },
      { id: mid(idFromName("Konan"), "paper-bomb-wings"), name: "Paper Bomb Wings", cat: "N", power: 60, acc: 90, chk: 50, desc: "AOE; Burn -3% HP EOR (3T)" },
      { id: mid(idFromName("Konan"), "paper-clone"), name: "Paper Clone", cat: "S", power: null, acc: 100, chk: 45, desc: "Create clone (25 HP)" },
      { id: mid(idFromName("Konan"), "paper-body-regeneration"), name: "Paper Body Regeneration", cat: "S", power: 15, acc: 100, chk: 40, desc: "Heal self 15 HP; Regen 6 HP EOR (3T) (refresh-only)" },
      { id: mid(idFromName("Konan"), "ocean-of-paper"), name: "Ocean of Paper", cat: "N", power: 90, acc: 85, chk: 75, desc: "AOE nuke; 85% ACC" },
    ],
  },

  {
    id: idFromName("Sai"),
    name: "Sai",
    category: "Leaf",
    hp: 230,
    chk: 130,
    atk: 100,
    ctr: 116,
    def: 110,
    spd: 125,
    abilityText: `Ink Tactics:
When Sai applies MARKED,
also reduce the target’s EVA
by an additional -5 for 2 turns.`,
    moves: [
      { id: mid(idFromName("Sai"), "beast-scroll-lion"), name: "Beast Scroll: Lion", cat: "N", power: 55, acc: 90, chk: 40, desc: "MARKED (3T) | Hit" },
      { id: mid(idFromName("Sai"), "beast-scroll-serpent"), name: "Beast Scroll: Serpent", cat: "N", power: 40, acc: 90, chk: 35, desc: "Stun 20% (1T) | Hit" },
      { id: mid(idFromName("Sai"), "beast-scroll-flood"), name: "Beast Scroll: Flood", cat: "N", power: 50, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Sai"), "ink-evasion"), name: "Ink Evasion", cat: "S", power: null, acc: 100, chk: 30, desc: "EVASION +15 (2T) | Self" },
      { id: mid(idFromName("Sai"), "beast-scroll-birds"), name: "Beast Scroll: Birds", cat: "N", power: 55, acc: 90, chk: 45, desc: "MARKED (2T) | AOE" },
    ],
  },

  {
    id: idFromName("Shizune"),
    name: "Shizune",
    category: "Leaf",
    hp: 250,
    chk: 130,
    atk: 75,
    ctr: 134,
    def: 110,
    spd: 122,
    abilityText: `Poison Specialist:
Shizune’s Poison is deadlier
(10 dmg EOR, permanent, non-stack).
Her Poison applications have +15% chance
to apply (capped at 95%).`,
    moves: [
      { id: mid(idFromName("Shizune"), "medical-ninjutsu"), name: "Medical Ninjutsu", cat: "S", power: 20, acc: 100, chk: 20, desc: "Heal ally 20 HP" },
      { id: mid(idFromName("Shizune"), "poison-senbon"), name: "Poison Senbon", cat: "N", power: 25, acc: 95, chk: 20, desc: "Poison 50% | Hit" },
      { id: mid(idFromName("Shizune"), "poison-cloud"), name: "Poison Cloud", cat: "N", power: 45, acc: 90, chk: 45, desc: "AOE; Poison 40%" },
      { id: mid(idFromName("Shizune"), "antidote-injection"), name: "Antidote Injection", cat: "S", power: 10, acc: 100, chk: 35, desc: "Heal 10 HP; Cleanse Poison + Burn | Ally" },
      { id: mid(idFromName("Shizune"), "chakra-scalpel-assist"), name: "Chakra Scalpel Assist", cat: "T", power: 35, acc: 95, chk: 25, desc: "DEF -10 (2T) | Hit" },
    ],
  },

  {
    id: idFromName("Shino Aburame"),
    name: "Shino Aburame",
    category: "Leaf",
    hp: 240,
    chk: 125,
    atk: 92,
    ctr: 125,
    def: 112,
    spd: 118,
    abilityText: `Kikaichu Drain:
When Shino hits with a Bug Ninjutsu move,
drain 4 CHK from each enemy hit and
restore that amount to Shino (no cap).`,
    moves: [
      { id: mid(idFromName("Shino Aburame"), "bug-swarm-bite"), name: "Bug Swarm Bite", cat: "N", power: 45, acc: 95, chk: 25, desc: "Hit; target CHK -10" },
      { id: mid(idFromName("Shino Aburame"), "parasitic-beetle-spread"), name: "Parasitic Beetle Spread", cat: "N", power: 45, acc: 90, chk: 45, desc: "AOE; Poison 30%" },
      { id: mid(idFromName("Shino Aburame"), "insect-cocoon"), name: "Insect Cocoon", cat: "N", power: null, acc: 100, chk: 30, desc: "Self DEF +15 (3T, stacks 3)" },
      { id: mid(idFromName("Shino Aburame"), "kikaichu-purge"), name: "Kikaichu Purge", cat: "S", power: null, acc: 100, chk: 35, desc: "Cleanse self Poison + Burn; EVASION +10 (2T)" },
      { id: mid(idFromName("Shino Aburame"), "raging-beetle-wave"), name: "Raging Beetle Wave", cat: "N", power: 55, acc: 90, chk: 55, desc: "AOE; MARKED (2T)" },
    ],
  },

  {
    id: idFromName("Temari"),
    name: "Temari",
    category: "Sand",
    hp: 240,
    chk: 125,
    atk: 90,
    ctr: 115,
    def: 110,
    spd: 128,
    abilityText: `Wind Pressure:
Temari’s Wind Ninjutsu hits apply
BLIND -10 ACC (2T) 30% of the time (refresh-only).`,
    moves: [
      { id: mid(idFromName("Temari"), "wind-scythe"), name: "Wind Scythe", cat: "N", power: 55, acc: 90, chk: 35, desc: "Hit; MARKED (2T)" },
      { id: mid(idFromName("Temari"), "cyclone-burst"), name: "Cyclone Burst", cat: "N", power: 55, acc: 90, chk: 45, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Temari"), "dust-whirl"), name: "Dust Whirl", cat: "N", power: null, acc: 90, chk: 40, desc: "AOE; BLIND -10 ACC (2T)" },
      { id: mid(idFromName("Temari"), "tailwind-formation"), name: "Tailwind Formation", cat: "S", power: null, acc: 100, chk: 40, desc: "Team SPD +10 (3T, stacks 3)" },
      { id: mid(idFromName("Temari"), "summoning-kamatari"), name: "Summoning: Kamatari", cat: "N", power: 85, acc: 85, chk: 70, desc: "AOE nuke; 85% ACC" },
    ],
  },

  {
    id: idFromName("Karin Uzumaki"),
    name: "Karin Uzumaki",
    category: "Leaf",
    hp: 240,
    chk: 130,
    atk: 70,
    ctr: 133,
    def: 112,
    spd: 118,
    abilityText: `Sensory Specialist:
Karin’s Accuracy cannot be reduced
(immune to BLIND and any -ACC effects).`,
    moves: [
      { id: mid(idFromName("Karin Uzumaki"), "sensory-scan"), name: "Sensory Scan", cat: "S", power: null, acc: 100, chk: 35, desc: "FOCUS +15 (2T) | Team" },
      { id: mid(idFromName("Karin Uzumaki"), "healing-bite"), name: "Healing Bite", cat: "S", power: 40, acc: 100, chk: 40, desc: "Heal ally 40 HP; Karin -10 HP" },
      { id: mid(idFromName("Karin Uzumaki"), "chakra-chains"), name: "Chakra Chains", cat: "N", power: 45, acc: 90, chk: 40, desc: "Hit; MARKED (3T)" },
      { id: mid(idFromName("Karin Uzumaki"), "chakra-suppression-seal"), name: "Chakra Suppression Seal", cat: "N", power: 55, acc: 90, chk: 55, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Karin Uzumaki"), "spirit-snap"), name: "Spirit Snap", cat: "N", power: null, acc: 85, chk: 45, desc: "Hit; Disorient (1T)" },
    ],
  },

  {
    id: idFromName("Shikamaru Nara"),
    name: "Shikamaru Nara",
    category: "Leaf",
    hp: 230,
    chk: 125,
    atk: 80,
    ctr: 126,
    def: 110,
    spd: 126,
    abilityText: `Shadow Tactician:
While any Shadow Link is active,
after Shikamaru uses a Support move,
apply Shadow Link (1T) to 1 additional enemy
(max 3 linked total).
If Shikamaru takes damage, all Links end immediately.`,
    moves: [
      { id: mid(idFromName("Shikamaru Nara"), "shadow-possession"), name: "Shadow Possession", cat: "G", power: null, acc: 85, chk: 55, desc: "Hit; 85% ACC; Shadow Link (1T): target cannot act" },
      { id: mid(idFromName("Shikamaru Nara"), "shadow-stitching"), name: "Shadow Stitching", cat: "N", power: 45, acc: 90, chk: 35, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Shikamaru Nara"), "tactical-command"), name: "Tactical Command", cat: "S", power: null, acc: 100, chk: 40, desc: "FOCUS +15 (2T) | Team" },
      { id: mid(idFromName("Shikamaru Nara"), "shadow-screen"), name: "Shadow Screen", cat: "S", power: null, acc: 90, chk: 40, desc: "BLIND -15 ACC (2T) | AOE" },
      { id: mid(idFromName("Shikamaru Nara"), "shadow-strangle"), name: "Shadow Strangle", cat: "N", power: 60, acc: 85, chk: 55, desc: "Hit; 85% ACC; SPD -10 (2T)" },
    ],
  },

  {
    id: idFromName("Ino Yamanaka"),
    name: "Ino Yamanaka",
    category: "Leaf",
    hp: 220,
    chk: 120,
    atk: 90,
    ctr: 131,
    def: 110,
    spd: 118,
    abilityText: `Mind Link:
The first time each round Ino hits an enemy with Genjutsu,
apply MARKED (2T) to that enemy.`,
    moves: [
      { id: mid(idFromName("Ino Yamanaka"), "mind-transfer"), name: "Mind Transfer", cat: "G", power: null, acc: 80, chk: 55, desc: "Hit; 80% ACC; Mind Transfer: spend 20 CHK at end of turn" },
      { id: mid(idFromName("Ino Yamanaka"), "mind-disruption"), name: "Mind Disruption", cat: "G", power: null, acc: 85, chk: 45, desc: "AOE; Disorient (1T)" },
      { id: mid(idFromName("Ino Yamanaka"), "team-coordination"), name: "Team Coordination", cat: "S", power: null, acc: 100, chk: 35, desc: "FOCUS +15 (2T) | Team" },
      { id: mid(idFromName("Ino Yamanaka"), "sensory-relay"), name: "Sensory Relay", cat: "S", power: null, acc: 100, chk: 40, desc: "Team EVASION +10 (2T)" },
      { id: mid(idFromName("Ino Yamanaka"), "psychic-shockwave"), name: "Psychic Shockwave", cat: "N", power: 45, acc: 90, chk: 55, desc: "AOE; MARKED (2T)" },
    ],
  },

  {
    id: idFromName("Kankuro"),
    name: "Kankuro",
    category: "Sand",
    hp: 230,
    chk: 125,
    atk: 80,
    ctr: 128,
    def: 110,
    spd: 118,
    abilityText: `Puppet Frame:
Kankuro takes 20% less damage from Ninjutsu moves.`,
    moves: [
      { id: mid(idFromName("Kankuro"), "puppet-strike"), name: "Puppet Strike", cat: "N", power: 45, acc: 95, chk: 25, desc: "Hit; MARKED (2T)" },
      { id: mid(idFromName("Kankuro"), "poison-blades"), name: "Poison Blades", cat: "N", power: 30, acc: 95, chk: 25, desc: "Hit; Poison 50%" },
      { id: mid(idFromName("Kankuro"), "black-ant-trap"), name: "Black Ant Trap", cat: "N", power: 55, acc: 85, chk: 45, desc: "Hit; 85% ACC; Stun 20% (1T)" },
      { id: mid(idFromName("Kankuro"), "puppet-shield"), name: "Puppet Shield (Priority)", cat: "S", power: null, acc: 100, chk: 35, desc: "PRIORITY | Guard: for this turn, Kankuro takes 0 damage" },
      { id: mid(idFromName("Kankuro"), "iron-maiden-crush"), name: "Iron Maiden Crush", cat: "N", power: 85, acc: 85, chk: 70, desc: "Hit; 85% ACC; if target is MARKED, deal +20% damage" },
    ],
  },

  {
    id: idFromName("Zetsu"),
    name: "Zetsu",
    category: "Other",
    hp: 250,
    chk: 110,
    atk: 88,
    ctr: 120,
    def: 110,
    spd: 118,
    abilityText: `Dual Body:
At the start of battle, Zetsu splits into two bodies.`,
    moves: [
      { id: mid(idFromName("Zetsu"), "ambush-strike"), name: "Ambush Strike", cat: "T", power: 35, acc: 95, chk: 20, desc: "Hit; MARKED (2T)" },
      { id: mid(idFromName("Zetsu"), "bodyguard-spores"), name: "Bodyguard Spores", cat: "S", power: null, acc: 100, chk: 35, desc: "PRIORITY | redirect the next single-target hit to this body" },
      { id: mid(idFromName("Zetsu"), "parasitic-bind"), name: "Parasitic Bind", cat: "N", power: 40, acc: 90, chk: 35, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Zetsu"), "chakra-leech"), name: "Chakra Leech", cat: "N", power: 35, acc: 95, chk: 30, desc: "Hit; target CHK -15; Zetsu +15 CHK" },
      { id: mid(idFromName("Zetsu"), "chakra-transfer"), name: "Chakra Transfer", cat: "S", power: null, acc: 100, chk: 45, desc: "Transfer 40 CHK to an ally" },
    ],
  },

  {
    id: idFromName("Kurenai Yuhi"),
    name: "Kurenai Yuhi",
    category: "Leaf",
    hp: 220,
    chk: 120,
    atk: 78,
    ctr: 130,
    def: 110,
    spd: 120,
    abilityText: `Genjutsu Specialist:
Kurenai’s Genjutsu moves cost
20% less CHK (rounded down).`,
    moves: [
      { id: mid(idFromName("Kurenai Yuhi"), "flower-trap"), name: "Illusion: Flower Trap", cat: "G", power: null, acc: 85, chk: 65, desc: "Hit; 85% ACC; Stun (2T)" },
      { id: mid(idFromName("Kurenai Yuhi"), "false-surroundings"), name: "Illusion: False Surroundings", cat: "G", power: null, acc: 100, chk: 55, desc: "AOE; Trap Illusion (this turn only)" },
      { id: mid(idFromName("Kurenai Yuhi"), "petal-shuriken"), name: "Petal Shuriken", cat: "N", power: 40, acc: 90, chk: 35, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Kurenai Yuhi"), "genjutsu-veil"), name: "Genjutsu Veil", cat: "S", power: null, acc: 100, chk: 40, desc: "Team EVASION +10 (2T)" },
      { id: mid(idFromName("Kurenai Yuhi"), "tree-bind-illusion"), name: "Tree Bind Illusion", cat: "G", power: null, acc: 85, chk: 55, desc: "Hit; 85% ACC; Stun 20% (1T)" },
    ],
  },

  {
    id: idFromName("Baki"),
    name: "Baki",
    category: "Sand",
    hp: 220,
    chk: 120,
    atk: 100,
    ctr: 108,
    def: 112,
    spd: 118,
    abilityText: `Ambush Footwork:
If Baki acts before his target (higher SPD),
his attack deals +20% damage.`,
    moves: [
      { id: mid(idFromName("Baki"), "wind-blade-slash"), name: "Wind Blade Slash", cat: "N", power: 65, acc: 85, chk: 45, desc: "Hit; 85% ACC" },
      { id: mid(idFromName("Baki"), "sandstorm-gale"), name: "Sandstorm Gale", cat: "N", power: 50, acc: 90, chk: 45, desc: "AOE; BLIND -15 ACC (2T)" },
      { id: mid(idFromName("Baki"), "quickdraw-kunai"), name: "Quickdraw Kunai", cat: "T", power: 35, acc: 95, chk: 15, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Baki"), "desert-footwork"), name: "Desert Footwork", cat: "S", power: null, acc: 100, chk: 30, desc: "EVASION +15 (2T) | Self" },
      { id: mid(idFromName("Baki"), "slicing-cyclone"), name: "Slicing Cyclone", cat: "N", power: 55, acc: 90, chk: 55, desc: "AOE; SPD -10 (2T)" },
    ],
  },

  {
    id: idFromName("Kiba Inuzuka"),
    name: "Kiba Inuzuka",
    category: "Leaf",
    hp: 230,
    chk: 110,
    atk: 108,
    ctr: 86,
    def: 112,
    spd: 132,
    abilityText: `Akamaru Senses:
Kiba’s Accuracy cannot be reduced
(immune to BLIND and any -ACC effects).
Kiba’s crit chance is doubled.`,
    moves: [
      { id: mid(idFromName("Kiba Inuzuka"), "fang-over-fang"), name: "Fang Over Fang", cat: "T", power: 45, acc: 95, chk: 25, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Kiba Inuzuka"), "wolf-fang-barrage"), name: "Wolf Fang Barrage", cat: "T", power: 28, acc: 100, chk: 20, desc: "Hit; 2-hit" },
      { id: mid(idFromName("Kiba Inuzuka"), "akamaru-assist"), name: "Akamaru Assist", cat: "S", power: null, acc: 100, chk: 35, desc: "Self ATK +15 (3T, stacks 3)" },
      { id: mid(idFromName("Kiba Inuzuka"), "beast-scent-mark"), name: "Beast Scent Mark", cat: "S", power: 30, acc: 95, chk: 20, desc: "MARKED (3T) | Hit" },
      { id: mid(idFromName("Kiba Inuzuka"), "ferocious-pounce"), name: "Ferocious Pounce", cat: "T", power: 75, acc: 85, chk: 55, desc: "Hit; 85% ACC; Stun 20% (1T)" },
    ],
  },

  {
    id: idFromName("Deidara"),
    name: "Deidara",
    category: "Stone",
    hp: 230,
    chk: 135,
    atk: 85,
    ctr: 107,
    def: 105,
    spd: 115,
    abilityText: `Living Explosives:
Deidara’s Ninjutsu hits apply Burn -3% HP EOR (3T)
30% of the time (refresh-only).`,
    moves: [
      { id: mid(idFromName("Deidara"), "c1-clay-birds"), name: "C1 Clay Birds", cat: "N", power: 45, acc: 90, chk: 40, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Deidara"), "c2-clay-dragon"), name: "C2 Clay Dragon", cat: "N", power: 55, acc: 90, chk: 55, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Deidara"), "c3-mega-bomb"), name: "C3 Mega Bomb", cat: "N", power: 85, acc: 85, chk: 75, desc: "AOE nuke; 85% ACC" },
      { id: mid(idFromName("Deidara"), "clay-clone"), name: "Clay Clone", cat: "S", power: null, acc: 100, chk: 55, desc: "Create clone (25 HP)" },
      { id: mid(idFromName("Deidara"), "c0-final-detonation"), name: "C0 Final Detonation (1x)", cat: "N", power: null, acc: 95, chk: 100, desc: "Self-destruct (1x): deal 120 damage to all enemies; Deidara dies" },
    ],
  },

  {
    id: idFromName("Lady Chiyo"),
    name: "Lady Chiyo",
    category: "Sand",
    hp: 220,
    chk: 120,
    atk: 70,
    ctr: 147,
    def: 110,
    spd: 105,
    abilityText: `Puppet Matriarch:
Once per battle, when an ally would die,
prevent it and set them to 1 HP instead.`,
    moves: [
      { id: mid(idFromName("Lady Chiyo"), "chakra-threads"), name: "Chakra Threads", cat: "S", power: null, acc: 100, chk: 40, desc: "Team DEF +10 (3T, stacks 3)" },
      { id: mid(idFromName("Lady Chiyo"), "medical-puppet-repair"), name: "Medical Puppet Repair", cat: "S", power: 25, acc: 100, chk: 35, desc: "Heal ally 25 HP" },
      { id: mid(idFromName("Lady Chiyo"), "puppet-barrage"), name: "Puppet Barrage", cat: "N", power: 45, acc: 90, chk: 45, desc: "AOE; MARKED (2T)" },
      { id: mid(idFromName("Lady Chiyo"), "antidote-puppet"), name: "Antidote Puppet", cat: "S", power: 10, acc: 100, chk: 40, desc: "Cleanse ally Poison + Burn; heal 10 HP" },
      { id: mid(idFromName("Lady Chiyo"), "ten-puppets-siege"), name: "Ten Puppets: Siege", cat: "N", power: 80, acc: 85, chk: 75, desc: "AOE nuke; 85% ACC" },
    ],
  },

  {
    id: idFromName("Hidan"),
    name: "Hidan",
    category: "Other",
    hp: 210,
    chk: 150,
    atk: 112,
    ctr: 80,
    def: 150,
    spd: 110,
    abilityText: `Immortal Body:
Once per battle, lethal damage sets Hidan to 1 HP instead,
immediately ends Ritual Circle (if active) and
removes any active Shared Pain link.
Hidan becomes Severed (2T):
takes +20% damage, deals -15% damage,
and cannot use Ritual moves.`,
    moves: [
      { id: mid(idFromName("Hidan"), "triple-scythe-slash"), name: "Triple-Scythe Slash", cat: "T", power: 28, acc: 100, chk: 20, desc: "Hit; 2-hit" },
      { id: mid(idFromName("Hidan"), "bloodletting-cut"), name: "Bloodletting Cut", cat: "T", power: 45, acc: 95, chk: 25, desc: "Hit; Bleeding (3T)" },
      { id: mid(idFromName("Hidan"), "ritual-circle"), name: "Ritual Circle", cat: "S", power: null, acc: 100, chk: 40, desc: "Hidan takes -20% damage; enables Curse: Shared Pain" },
      { id: mid(idFromName("Hidan"), "curse-shared-pain"), name: "Curse: Shared Pain", cat: "N", power: null, acc: 85, chk: 55, desc: "target share 50% of damage taken" },
      { id: mid(idFromName("Hidan"), "finishing-reap"), name: "Finishing Reap", cat: "T", power: 75, acc: 85, chk: 45, desc: "Hit; 85% ACC" },
    ],
  },

  {
    id: idFromName("Tenten"),
    name: "Tenten",
    category: "Leaf",
    hp: 220,
    chk: 110,
    atk: 85,
    ctr: 114,
    def: 110,
    spd: 124,
    abilityText: `Twin Scroll Mastery:
Tenten’s Taijutsu moves never miss.
Tenten’s crit chance is tripled.`,
    moves: [
      { id: mid(idFromName("Tenten"), "kunai-volley"), name: "Kunai Volley", cat: "T", power: 40, acc: 95, chk: 25, desc: "AOE" },
      { id: mid(idFromName("Tenten"), "chain-sickle-snare"), name: "Chain Sickle Snare", cat: "T", power: 35, acc: 95, chk: 25, desc: "Hit; Stun 20% (1T)" },
      { id: mid(idFromName("Tenten"), "giant-fan-smash"), name: "Giant Fan Smash", cat: "T", power: 45, acc: 90, chk: 40, desc: "AOE; SPD -10 (2T)" },
      { id: mid(idFromName("Tenten"), "scroll-arsenal"), name: "Scroll Arsenal", cat: "S", power: null, acc: 100, chk: 25, desc: "Self buff (2 uses): next 2 Taijutsu moves hit twice" },
      { id: mid(idFromName("Tenten"), "explosive-tag-barrage"), name: "Explosive Tag Barrage", cat: "N", power: 55, acc: 85, chk: 65, desc: "AOE; 85% ACC; Burn -3% HP EOR (3T)" },
    ],
  },
];

// This is what your app imports.
export const SAMPLE_NINJAS: Ninja[] = RAW_NINJAS.map(withKunai);

