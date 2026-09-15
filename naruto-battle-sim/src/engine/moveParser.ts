import type { Move, ParsedMoveEffect } from "../types/game";

const cache = new Map<string, ParsedMoveEffect>();

export function parseMoveDesc(move: Move): ParsedMoveEffect {
  const cached = cache.get(move.id);
  if (cached) return cached;

  const d = move.desc;
  const name = move.name;

  const e: ParsedMoveEffect = {
    isAOE: false,
    isHeal: false,
    healAmount: 0,
    healTarget: "ally",
    healToFull: false,
    isPriority: false,
    isSelfDestruct: false,
    selfDestructDamage: 0,
    isExecute: false,
    executeThreshold: 0,
    executeFallbackDmg: 0,
    isRevive: false,
    isTransform: false,
    isClone: false,
    cloneHp: 0,
    isSelfBuff: false,
    isTeamBuff: false,
    isSummon: false,
    summonDuration: 0,
    summonDmgReduction: 0,
    summonMaxAbsorb: 0,
    summonBuffs: [],
    appliedStatuses: [],
    selfEffects: [],
    conditionalBonusPct: 0,
    conditionalOn: "",
    requiresTransformed: false,
    requiresClone: false,
    requiresRitualCircle: false,
    requiresCondition: "",
    hitCount: 1,
    cleansesPoison: false,
    cleansesBurn: false,
    chakraDrain: 0,
    chakraGain: 0,
    chakraTransfer: 0,
    trueDamage: 0,
    selfDamage: 0,
    maxUses: 0,
    swapHpPct: false,
    isGuard: false,
    isDodgeGrant: false,
    isChakraTransfer: false,
    statChanges: [],
  };

  // ─── AOE ───
  if (/AOE/i.test(d)) e.isAOE = true;

  // ─── Priority ───
  if (/PRIORITY/i.test(d) || /Priority/i.test(name)) e.isPriority = true;

  // ─── Heal ───
  const healFull = /[Hh]eal\s+(?:somebody|target)?\s*to\s+full/i.exec(d);
  if (healFull) {
    e.isHeal = true;
    e.healToFull = true;
    e.healTarget = "anybody";
  }
  const healMatch = /[Hh]eal\s+((?:ally|self|anybody|somebody)\s+)?(\d+)\s*[Hh]?[Pp]?/i.exec(d);
  if (healMatch) {
    e.isHeal = true;
    e.healAmount = parseInt(healMatch[2]);
    const who = (healMatch[1] ?? "").trim().toLowerCase();
    if (who.startsWith("self")) e.healTarget = "self";
    else if (who.startsWith("ally")) e.healTarget = "ally";
    else if (who.startsWith("anybody") || who.startsWith("somebody")) e.healTarget = "anybody";
  }
  // "Heal self 25 HP" style
  if (/[Hh]eal\s+self/i.test(d)) e.healTarget = "self";

  // ─── Cleanse ───
  if (/[Cc]leanse.*Poison/i.test(d) || /[Cc]leans.*Poison/i.test(d)) e.cleansesPoison = true;
  if (/[Cc]leanse.*Burn/i.test(d) || /[Cc]leans.*Burn/i.test(d)) e.cleansesBurn = true;

  // ─── Self-destruct ───
  if (/[Ss]elf-destruct/i.test(d) || (/dies/i.test(d) && /deal\s+(\d+)\s+damage/i.test(d))) {
    e.isSelfDestruct = true;
    const sdm = /deal\s+(\d+)\s+damage/i.exec(d);
    if (sdm) e.selfDestructDamage = parseInt(sdm[1]);
    e.selfEffects.push({ type: "die" });
  }

  // ─── Execute ───
  if (/(?:under|below)\s+(\d+)%\s*HP.*(?:dies?|KO)/i.test(d)) {
    e.isExecute = true;
    const em = /(?:under|below)\s+(\d+)%/i.exec(d);
    if (em) e.executeThreshold = parseInt(em[1]);
    const fb = /otherwise\s+deal\s+(\d+)/i.exec(d);
    if (fb) e.executeFallbackDmg = parseInt(fb[1]);
  }

  // ─── Revive ───
  if (/[Rr]evive/i.test(d)) e.isRevive = true;

  // ─── Transform ───
  if (/[Tt]ransform/i.test(d)) e.isTransform = true;

  // ─── Clone ───
  const cloneMatch = /[Cc]lone\s*[\(:]?\s*(\d+)\s*HP/i.exec(d);
  if (cloneMatch) {
    e.isClone = true;
    e.cloneHp = parseInt(cloneMatch[1]);
  }
  if (/[Cc]reate\s+(?:\d-hit\s+)?clone/i.test(d) && !e.isClone) {
    e.isClone = true;
    const hpm = /(\d+)\s*HP/i.exec(d);
    if (hpm) e.cloneHp = parseInt(hpm[1]);
    else e.cloneHp = 15;
  }

  // ─── Self buff / Team buff ───
  if (/[Ss]elf\s+buff/i.test(d) || /\|\s*[Ss]elf/i.test(d) || /[Ss]elf\s+(?:DEF|ATK|EVASION|FOCUS|SPD)/i.test(d)) {
    e.isSelfBuff = true;
  }
  if (/[Tt]eam/i.test(d)) e.isTeamBuff = true;

  // ─── Summon ───
  if (/[Ss]ummon/i.test(d) && !/[Ss]ummon.*clone/i.test(d)) {
    e.isSummon = true;
    const durM = /\((\d+)T\)/i.exec(d);
    if (durM) e.summonDuration = parseInt(durM[1]);
    const redM = /-(\d+)%\s*dmg/i.exec(d);
    if (redM) e.summonDmgReduction = parseInt(redM[1]);
    const absM = /(\d+)\s+total\s+damage/i.exec(d);
    if (absM) e.summonMaxAbsorb = parseInt(absM[1]);
    // parse buff like "ATK +10"
    const buffM = /ATK\s*\+(\d+)/i.exec(d);
    if (buffM) e.summonBuffs.push({ stat: "atk", value: parseInt(buffM[1]) });
  }

  // ─── Guard ───
  if (/take\s+0\s+damage/i.test(d)) e.isGuard = true;

  // ─── Dodge grant ───
  if (/dodge\s+the\s+next/i.test(d)) e.isDodgeGrant = true;

  // ─── HP swap ───
  if (/[Ss]wap\s+HP%/i.test(d)) e.swapHpPct = true;

  // ─── Chakra transfer ───
  const ctM = /[Tt]ransfer\s+(\d+)\s*CHK/i.exec(d);
  if (ctM) {
    e.isChakraTransfer = true;
    e.chakraTransfer = parseInt(ctM[1]);
  }

  // ─── Multi-hit ───
  const hitM = /(\d+)-hit/i.exec(d);
  if (hitM) e.hitCount = parseInt(hitM[1]);

  // ─── Max uses ───
  const usesM = /\((\d+)x\)/i.exec(d);
  if (usesM) e.maxUses = parseInt(usesM[1]);
  const usesM2 = /max\s+(\d+)\s+uses/i.exec(d);
  if (usesM2) e.maxUses = parseInt(usesM2[1]);

  // ─── Conditional bonus ───
  const condM = /\+(\d+)%\s*(?:BP|dmg|damage)?\s*(?:if|vs)\s+(?:target\s+is\s+)?(\w+)/i.exec(d);
  if (condM) {
    e.conditionalBonusPct = parseInt(condM[1]);
    e.conditionalOn = condM[2].toUpperCase();
  }

  // ─── Chakra drain ───
  const cdM = /(?:target\s+)?CHK\s*-(\d+)/i.exec(d);
  if (cdM) e.chakraDrain = parseInt(cdM[1]);

  // ─── Self damage ───
  const selfDmgM = /self\s*-?(\d+)\s*HP/i.exec(d);
  if (selfDmgM && !e.isSelfDestruct) e.selfDamage = parseInt(selfDmgM[1]);
  // "Karin -10 HP" style
  const karinSelf = /;\s*\w+\s*-(\d+)\s*HP/i.exec(d);
  if (karinSelf) e.selfDamage = parseInt(karinSelf[1]);

  // ─── Requirements ───
  if (/only\s+usable\s+while\s+transformed/i.test(d)) e.requiresTransformed = true;
  if (/[Rr]eq\s+clone/i.test(d)) e.requiresClone = true;
  if (/enables?\s+Curse/i.test(d) || /Ritual/i.test(d)) {
    // Ritual Circle is a setup move, not a requirement check
  }
  if (/if\s+Manda\s+is\s+active/i.test(d)) e.requiresCondition = "manda";

  // ─── Parse stat changes from desc ───
  // "ATK +15, DEF +10, Speed -15" etc.
  const statRe = /\b(ATK|DEF|CTR|SPD|Speed)\s*([+-])(\d+)/gi;
  let sm;
  while ((sm = statRe.exec(d)) !== null) {
    const stat = sm[1].toLowerCase() === "speed" ? "spd" : sm[1].toLowerCase();
    const val = parseInt(sm[3]) * (sm[2] === "-" ? -1 : 1);
    // Try to find duration
    const after = d.slice(sm.index + sm[0].length);
    const durM2 = /^\s*(?:,\s*\w+\s*[+-]\d+)*\s*[;|]?\s*\((\d+)T\)/i.exec(after);
    // Also check if within a parenthesized block already parsed
    const isBattle = /\(battle\)/i.test(d);
    e.statChanges.push({
      stat,
      value: val,
      turns: durM2 ? parseInt(durM2[1]) : undefined,
      permanent: isBattle || undefined,
    });
  }

  // ─── Status effects (applied to target/enemies) ───
  parseStatusEffects(d, e);

  // ─── Self stun after move ───
  // Patterns like "Naruto Stun (1T)", "Guy Stun (1T)", "Lee Stun (1T)", "stunned for 2 turns"
  if (/(?:self|user)?\s*[Ss]tun(?:ned)?\s*(?:for\s+)?(?:\()?(\d+)\s*[Tt](?:urns?)?\)?/i.test(d)) {
    // Only if it's clearly self-stun (has a name prefix or "stunned for")
    if (/stunned\s+for/i.test(d) || /;\s*\w+\s+Stun/i.test(d)) {
      const ssm = /(\d+)\s*[Tt]/i.exec(d.match(/[Ss]tun(?:ned)?\s*(?:for\s+)?(?:\()?(\d+)/i)?.[0] ?? "");
      if (ssm) e.selfEffects.push({ type: "stun", turns: parseInt(ssm[1]) });
    }
  }

  // ─── Self damage EOR from transform ───
  if (/[Tt]ake\s+(\d+)\s*(?:dmg|damage|HP)?\s*(?:every\s+turn|EOR)/i.test(d)) {
    const sdE = /[Tt]ake\s+(\d+)\s*(?:dmg|damage|HP)?\s*(?:every\s+turn|EOR)/i.exec(d);
    if (sdE) e.selfEffects.push({ type: "damage", amount: parseInt(sdE[1]) });
  }

  cache.set(move.id, e);
  return e;
}

function parseStatusEffects(d: string, e: ParsedMoveEffect): void {
  // Stun with chance: "Stun 30% (1T)" or "stun 20%"
  const stunChance = /[Ss]tun\s+(\d+)%\s*(?:\((\d+)T\))?/g;
  let m;
  while ((m = stunChance.exec(d)) !== null) {
    // Make sure this isn't self-stun
    const before = d.slice(Math.max(0, m.index - 20), m.index);
    if (/;\s*\w+\s*$/i.test(before) || /stunned/i.test(before)) continue; // self stun
    e.appliedStatuses.push({
      statusId: "STUN",
      chance: parseInt(m[1]),
      turns: m[2] ? parseInt(m[2]) : 1,
      target: "enemy",
    });
  }

  // Guaranteed stun (no percentage): "Stun (2T)" without a percentage
  if (/[Ss]tun\s*\((\d+)T\)/i.test(d) && !/\d+%\s*\(\d+T\)/i.test(d)) {
    // Check it's not self stun
    if (!/stunned\s+for/i.test(d) && !/;\s*\w+\s+Stun/i.test(d)) {
      const gs = /[Ss]tun\s*\((\d+)T\)/i.exec(d);
      if (gs) {
        e.appliedStatuses.push({
          statusId: "STUN",
          chance: 100,
          turns: parseInt(gs[1]),
          target: "enemy",
        });
      }
    }
  }

  // Poison with chance: "Poison 60%"
  const poisonM = /[Pp]oison\s+(\d+)%/g;
  while ((m = poisonM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "POISON",
      chance: parseInt(m[1]),
      target: e.isAOE ? "allEnemies" : "enemy",
      flatDmg: 6, // default; Shizune's passive overrides to 10
    });
  }

  // Burn: "Burn -3% HP EOR (3T)" or "Burn -5% HP EOR (permanent)"
  const burnM = /[Bb]urn\s*-(\d+)%\s*HP\s*EOR\s*\((\d+)T\)/g;
  while ((m = burnM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "BURN",
      chance: 100,
      turns: parseInt(m[2]),
      target: e.isAOE ? "allEnemies" : "enemy",
      pctDmg: parseInt(m[1]),
    });
  }
  // Permanent burn: "Burn -5% HP EOR (permanent)"
  if (/[Bb]urn\s*-(\d+)%\s*HP\s*EOR\s*\(permanent\)/i.test(d)) {
    const bpm = /[Bb]urn\s*-(\d+)%\s*HP\s*EOR\s*\(permanent\)/i.exec(d);
    if (bpm) {
      e.appliedStatuses.push({
        statusId: "BURN",
        chance: 100,
        target: e.isAOE ? "allEnemies" : "enemy",
        pctDmg: parseInt(bpm[1]),
      });
    }
  }

  // Blind: "BLIND -10 ACC (2T)"
  const blindM = /BLIND\s*-(\d+)\s*ACC\s*\((\d+)T\)/gi;
  while ((m = blindM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "BLIND",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "acc",
      target: e.isAOE ? "allEnemies" : "enemy",
    });
  }

  // Disorient: "Disorient (2T)"
  const disorientM = /[Dd]isorient\s*\((\d+)T\)/g;
  while ((m = disorientM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "DISORIENT",
      chance: 100,
      turns: parseInt(m[1]),
      target: e.isAOE ? "allEnemies" : "enemy",
    });
  }

  // SPD down: "SPD -10 (2T)"
  const spdDownM = /SPD\s*-(\d+)\s*\((\d+)T\)/gi;
  while ((m = spdDownM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "SPD_DOWN",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "spd",
      target: e.isAOE ? "allEnemies" : "enemy",
    });
  }
  // "lower Speed -10 permanently"
  if (/lower\s+Speed\s*-(\d+)\s*permanently/i.test(d)) {
    const lsm = /lower\s+Speed\s*-(\d+)/i.exec(d);
    if (lsm) {
      e.appliedStatuses.push({
        statusId: "SPD_DOWN",
        chance: 100,
        value: parseInt(lsm[1]),
        stat: "spd",
        target: e.isAOE ? "allEnemies" : "enemy",
      });
    }
  }

  // DEF down: "DEF -10 (2T)"
  const defDownM = /DEF\s*-(\d+)\s*\((\d+)T\)/gi;
  while ((m = defDownM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "DEF_DOWN",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "def",
      target: e.isAOE ? "allEnemies" : "enemy",
    });
  }

  // MARKED: "MARKED (3T)"
  const markedM = /MARKED\s*\((\d+)T\)/gi;
  while ((m = markedM.exec(d)) !== null) {
    e.appliedStatuses.push({
      statusId: "MARKED",
      chance: 100,
      turns: parseInt(m[1]),
      target: e.isAOE ? "allEnemies" : "enemy",
    });
  }

  // Vulnerable: "Vulnerable (next hit +20% dmg, team)"
  if (/[Vv]ulnerable/i.test(d)) {
    e.appliedStatuses.push({
      statusId: "VULNERABLE",
      chance: 100,
      turns: 99, // lasts until consumed
      target: "enemy",
    });
  }

  // EVASION buff: "EVASION +15 (2T)"
  const evasionM = /EVASION\s*\+(\d+)\s*\((\d+)T\)/gi;
  while ((m = evasionM.exec(d)) !== null) {
    const target = /[Tt]eam/i.test(d) ? "team" : /[Ss]elf/i.test(d) ? "self" : "self";
    e.appliedStatuses.push({
      statusId: "EVASION",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      target,
    });
  }

  // FOCUS: "FOCUS +15 ACC (2T)" or "FOCUS +15 (2T)"
  const focusM = /FOCUS\s*\+(\d+)\s*(?:ACC\s*)?\((\d+)T\)/gi;
  while ((m = focusM.exec(d)) !== null) {
    const target = /[Tt]eam/i.test(d) ? "team" : "self";
    e.appliedStatuses.push({
      statusId: "FOCUS",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "acc",
      target,
    });
  }

  // DEF buff: "DEF +15 (3T, stacks 3)" or "Self DEF +15 (3T)"
  const defUpM = /DEF\s*\+(\d+)\s*\((\d+)T(?:,\s*stacks?\s*(\d+))?\)/gi;
  while ((m = defUpM.exec(d)) !== null) {
    // Don't double-count if this is part of a transform stat change
    if (/[Tt]ransform/i.test(d)) continue;
    const target = /[Tt]eam/i.test(d) ? "team" : "self";
    e.appliedStatuses.push({
      statusId: "DEF_UP",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "def",
      target,
    });
  }

  // ATK buff: "ATK +15 (3T, stacks 3)" or "Self ATK +15 (3T)"
  const atkUpM = /ATK\s*\+(\d+)\s*\((\d+)T(?:,\s*stacks?\s*(\d+))?\)/gi;
  while ((m = atkUpM.exec(d)) !== null) {
    if (/[Tt]ransform/i.test(d)) continue;
    const target = /[Tt]eam/i.test(d) ? "team" : "self";
    e.appliedStatuses.push({
      statusId: "ATK_UP",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "atk",
      target,
    });
  }

  // SPD buff: "SPD +10 (3T)"
  const spdUpM = /SPD\s*\+(\d+)\s*\((\d+)T(?:,\s*stacks?\s*(\d+))?\)/gi;
  while ((m = spdUpM.exec(d)) !== null) {
    if (/[Tt]ransform/i.test(d)) continue;
    const target = /[Tt]eam/i.test(d) ? "team" : "self";
    e.appliedStatuses.push({
      statusId: "SPD_UP",
      chance: 100,
      turns: parseInt(m[2]),
      value: parseInt(m[1]),
      stat: "spd",
      target,
    });
  }

  // Stun immune: "Stun-immune (1T)"
  if (/[Ss]tun-immune\s*\((\d+)T\)/i.test(d)) {
    const sim = /[Ss]tun-immune\s*\((\d+)T\)/i.exec(d);
    if (sim) {
      e.appliedStatuses.push({
        statusId: "STUN_IMMUNE",
        chance: 100,
        turns: parseInt(sim[1]),
        target: "self",
      });
    }
  }

  // Regen: "Regen 6 HP EOR (3T)"
  const regenM = /[Rr]egen\s+(\d+)\s*HP\s*EOR\s*\((\d+)T\)/i.exec(d);
  if (regenM) {
    e.appliedStatuses.push({
      statusId: "REGEN",
      chance: 100,
      turns: parseInt(regenM[2]),
      target: "self",
      healAmount: parseInt(regenM[1]),
    });
  }

  // Bleeding: "Bleeding (3T)"
  const bleedM = /[Bb]leeding\s*\((\d+)T\)/i.exec(d);
  if (bleedM) {
    e.appliedStatuses.push({
      statusId: "BLEEDING",
      chance: 100,
      turns: parseInt(bleedM[1]),
      target: "enemy",
      flatDmg: 8,
    });
  }

  // N/G locked: "N/G locked (1T)"
  if (/N\/G\s+locked\s*\((\d+)T\)/i.test(d)) {
    const nlm = /N\/G\s+locked\s*\((\d+)T\)/i.exec(d);
    if (nlm) {
      e.appliedStatuses.push({
        statusId: "N_LOCKED",
        chance: 100,
        turns: parseInt(nlm[1]),
        target: "enemy",
      });
    }
  }

  // Shadow Link: "Shadow Link (1T)"
  if (/Shadow\s+Link\s*\((\d+)T\)/i.test(d)) {
    const slm = /Shadow\s+Link\s*\((\d+)T\)/i.exec(d);
    if (slm) {
      e.appliedStatuses.push({
        statusId: "SHADOW_LINK",
        chance: 100,
        turns: parseInt(slm[1]),
        target: "enemy",
      });
    }
  }
}

/** Pre-parse all moves for a set of ninjas. Returns a map of move.id -> parsed effect. */
export function parseAllMoves(ninjas: import("../types/game").Ninja[]): Map<string, ParsedMoveEffect> {
  const map = new Map<string, ParsedMoveEffect>();
  for (const n of ninjas) {
    for (const m of n.moves) {
      map.set(m.id, parseMoveDesc(m));
    }
  }
  return map;
}
