import type { BattleState, Fighter, Move, Ninja, ParsedMoveEffect } from "../types/game";
import { effectiveAtk, effectiveCtr, effectiveDef, hasStatus } from "./statSystem";
import { parseMoveDesc } from "./moveParser";

// ─── Helpers ───

function findNinja(ninjas: Ninja[], id: string): Ninja {
  return ninjas.find((x) => x.id === id) ?? ninjas.find((x) => id.startsWith(x.id))!;
}

function aliveEnemies(fighter: Fighter, state: BattleState): Fighter[] {
  return state.fighters.filter((f) => f.alive && f.teamId !== fighter.teamId);
}

function aliveAllies(fighter: Fighter, state: BattleState): Fighter[] {
  return state.fighters.filter((f) => f.alive && f.teamId === fighter.teamId && f.ninjaId !== fighter.ninjaId);
}

function estimateDamage(power: number, A: number, D: number): number {
  return Math.floor(((42 * power * (A / D)) / 50 + 2) * 1.0);
}

export type MoveChoice = {
  move: Move;
  targets: Fighter[];
};

// ─── Personality system ───
// Each ninja gets an AI "style" that weights the scoring categories differently.
// aggressive: favors damage + kill-secure
// defensive: favors healing + shielding + survival
// control:   favors CC + debuffs + tactical setups
// support:   favors heals + team buffs + cleansing
// balanced:  default weights

type Personality = "aggressive" | "defensive" | "control" | "support" | "balanced";

function getPersonality(ninja: Ninja): Personality {
  const id = ninja.id;
  // Support / healers
  if (["sakura-haruno", "shizune", "lady-chiyo", "karin-uzumaki", "hinata-hyuga"].includes(id)) return "support";
  // Control / tacticians
  if (["shikamaru-nara", "ino-yamanaka", "kurenai-yuhi", "itachi-uchiha"].includes(id)) return "control";
  // Defensive / tanky
  if (["gaara", "yamato", "kakuzu", "hidan", "kisame-hoshigaki"].includes(id)) return "defensive";
  // Aggressive / damage
  if (["might-guy", "rock-lee", "a-4th-raikage", "naruto-uzumaki", "killer-b",
       "jugo", "kiba-inuzuka", "choji-akimichi", "suigetsu-hozuki"].includes(id)) return "aggressive";
  return "balanced";
}

type Weights = {
  damage: number;
  heal: number;
  cc: number;
  buff: number;
  debuff: number;
  killSecure: number;
  survival: number;
};

function getWeights(p: Personality): Weights {
  switch (p) {
    case "aggressive": return { damage: 1.4, heal: 0.6, cc: 0.7, buff: 0.7, debuff: 0.8, killSecure: 1.5, survival: 0.6 };
    case "defensive":  return { damage: 0.8, heal: 1.3, cc: 0.9, buff: 1.3, debuff: 0.9, killSecure: 1.0, survival: 1.5 };
    case "control":    return { damage: 0.7, heal: 0.8, cc: 1.5, buff: 1.2, debuff: 1.4, killSecure: 1.0, survival: 0.8 };
    case "support":    return { damage: 0.5, heal: 1.5, cc: 0.8, buff: 1.4, debuff: 0.7, killSecure: 0.8, survival: 1.3 };
    case "balanced":   return { damage: 1.0, heal: 1.0, cc: 1.0, buff: 1.0, debuff: 1.0, killSecure: 1.0, survival: 1.0 };
  }
}

// ─── Score normalization ───
// All sub-scores are scaled to roughly 0-50 range so no single category dominates.
const MAX_SCORE = 50;

/**
 * AI move selection: scoring + tactical approach.
 *
 * Score(move) = ImmediateValue + FutureValue + TacticalValue − Risk − Waste
 *               − DiversityPenalty + SmallRandomNoise
 *
 * Kunai is excluded from normal selection — only used as fallback when
 * no other move is affordable.
 *
 * Diversity: recently used moves get penalized (×0.5 if used last turn, ×0.7 if 2 turns ago).
 * Randomness: ±10% noise on final score so behavior isn't robotic.
 */
export function chooseMove(
  ninja: Ninja,
  fighter: Fighter,
  state: BattleState,
  ninjas: Ninja[],
  getEffectiveChkCost: (ninja: Ninja, fighter: Fighter, move: Move) => number,
): MoveChoice {
  const enemies = aliveEnemies(fighter, state);
  const allies = aliveAllies(fighter, state);
  if (enemies.length === 0) return { move: ninja.moves[0], targets: [] };

  const personality = getPersonality(ninja);
  const W = getWeights(personality);

  // ── Collect valid moves (excluding kunai) ──
  const validMoves: { move: Move; parsed: ParsedMoveEffect }[] = [];
  let kunaiEntry: { move: Move; parsed: ParsedMoveEffect } | null = null;

  for (const move of ninja.moves) {
    const cost = getEffectiveChkCost(ninja, fighter, move);
    if (cost > fighter.chk) continue;

    const parsed = parseMoveDesc(move);

    // Check requirements
    if (parsed.maxUses > 0 && (fighter.moveUses[move.id] ?? 0) >= parsed.maxUses) continue;
    if (parsed.requiresTransformed && !fighter.transformed) continue;
    if (parsed.requiresClone && fighter.clones.length === 0) continue;
    if (parsed.requiresRitualCircle && !fighter.abilityState.ritualActive) continue;
    if (parsed.requiresCondition === "manda" && fighter.summons.length === 0) continue;
    if (parsed.isTransform && fighter.transformed) continue;
    if (hasStatus(fighter, "N_LOCKED") && (move.cat === "N" || move.cat === "G")) continue;

    // Kunai is fallback only
    if (move.id === "kunai") {
      kunaiEntry = { move, parsed };
      continue;
    }

    validMoves.push({ move, parsed });
  }

  // If no valid moves besides kunai, use kunai
  if (validMoves.length === 0) {
    const fallback = kunaiEntry ?? { move: ninja.moves[0], parsed: parseMoveDesc(ninja.moves[0]) };
    const targets = resolveTargets(fighter, fallback.parsed, state, enemies, allies);
    return { move: fallback.move, targets };
  }

  // ── Score each move ──
  let best: { move: Move; score: number; targets: Fighter[] } | null = null;

  for (const { move, parsed } of validMoves) {
    let { score, targets } = scoreMoveUtility(ninja, fighter, move, parsed, state, ninjas, enemies, allies, W);

    // ── Diversity penalty: penalize recently used moves ──
    const recent = fighter.recentMoves;
    if (recent.length > 0 && recent[recent.length - 1] === move.id) {
      // Same move as last turn → halve the score
      score *= 0.5;
    } else if (recent.length > 1 && recent[recent.length - 2] === move.id) {
      // Same move as 2 turns ago → mild penalty
      score *= 0.7;
    }

    // ── Small random noise (±10%) so behavior isn't robotic ──
    const noise = 0.90 + Math.random() * 0.20; // 0.90 to 1.10
    score *= noise;

    if (!best || score > best.score) {
      best = { move, score, targets };
    }
  }

  return { move: best!.move, targets: best!.targets };
}

// ─── Main scoring function ───
// Score(move) = ImmediateValue + FutureValue + TacticalValue − Risk − Waste

function scoreMoveUtility(
  ninja: Ninja,
  fighter: Fighter,
  move: Move,
  parsed: ParsedMoveEffect,
  state: BattleState,
  ninjas: Ninja[],
  enemies: Fighter[],
  allies: Fighter[],
  W: Weights,
): { score: number; targets: Fighter[] } {
  let score = 0;
  let targets: Fighter[] = resolveTargets(fighter, parsed, state, enemies, allies);

  // ═══════════════════════════════════════
  // 1. IMMEDIATE VALUE
  // ═══════════════════════════════════════

  // ── Damage ──
  if (move.power !== null && move.power > 0 && !parsed.isHeal) {
    const isPhysical = move.cat === "T";
    const A = isPhysical ? effectiveAtk(ninja, fighter) : effectiveCtr(ninja, fighter);

    if (parsed.isAOE) {
      let totalDmg = 0;
      for (const e of enemies) {
        const D = effectiveDef(findNinja(ninjas, e.ninjaId), e);
        const dmg = estimateDamage(move.power / Math.max(1, enemies.length), A, D);
        totalDmg += dmg;
      }
      // Normalize: AOE total damage scaled to MAX_SCORE
      score += Math.min(MAX_SCORE, totalDmg * 0.4) * (move.acc / 100) * W.damage;
    } else {
      // Target weakest enemy for scoring
      const sorted = [...enemies].sort((a, b) => a.hp - b.hp);
      const target = sorted[0];
      targets = [target];
      const D = effectiveDef(findNinja(ninjas, target.ninjaId), target);
      const dmg = estimateDamage(move.power, A, D);
      // Normalize: single target damage scaled to MAX_SCORE
      score += Math.min(MAX_SCORE, dmg * 0.6) * (move.acc / 100) * W.damage;

      // ── KILL SECURE (Tactical) ──
      if (dmg >= target.hp) {
        score += MAX_SCORE * W.killSecure;
      } else if (dmg >= target.hp * 0.7) {
        // Close to killing — decent bonus
        score += 15 * W.killSecure;
      }

      // Conditional bonus (e.g., +50% vs MARKED)
      if (parsed.conditionalOn === "MARKED" && hasStatus(target, "MARKED")) {
        score += 12 * W.damage;
      }
    }

    // Multi-hit bonus
    if (parsed.hitCount > 1) score += 8 * (parsed.hitCount - 1) * W.damage;
  }

  // ── Healing (ImmediateValue) ──
  if (parsed.isHeal && (parsed.healAmount > 0 || parsed.healToFull)) {
    const healTargetList = resolveHealTargets(fighter, parsed, allies);

    for (const ht of healTargetList) {
      const hpPct = ht.hp / ht.maxHp;
      const missingHp = ht.maxHp - ht.hp;
      const healAmt = parsed.healToFull ? missingHp : parsed.healAmount;
      const effectiveHeal = Math.min(healAmt, missingHp);

      // Need factor: heals are more valuable the lower the target's HP
      const needFactor = hpPct < 0.20 ? 2.5 : hpPct < 0.35 ? 2.0 : hpPct < 0.50 ? 1.3 : hpPct < 0.70 ? 0.7 : 0.2;

      // Normalize heal to MAX_SCORE range
      const healScore = Math.min(MAX_SCORE, (effectiveHeal / ht.maxHp) * 100 * needFactor);
      score += healScore * W.heal;

      // ── SURVIVAL (Tactical): prevent ally death ──
      if (hpPct < 0.20 && effectiveHeal > 15) {
        score += 25 * W.survival;
      }
    }

    // ── WASTE: overhealing penalty ──
    for (const ht of healTargetList) {
      const missing = ht.maxHp - ht.hp;
      const healAmt = parsed.healToFull ? missing : parsed.healAmount;
      if (healAmt > missing && missing < healAmt * 0.3) {
        score -= 10; // significant overheal
      }
    }

    targets = healTargetList;
  }

  // ═══════════════════════════════════════
  // 2. FUTURE VALUE (buffs/debuffs over time)
  // ═══════════════════════════════════════

  for (const applied of parsed.appliedStatuses) {
    const dur = applied.turns ?? 2;

    switch (applied.statusId) {
      // ── CC (Control) ──
      case "STUN":
        score += 35 * (applied.chance / 100) * W.cc;
        // Don't waste CC on already stunned
        if (targets.length > 0 && targets[0].teamId !== fighter.teamId && hasStatus(targets[0], "STUN")) {
          score -= 20;
        }
        break;
      case "SHADOW_LINK":
        score += 40 * (applied.chance / 100) * W.cc;
        break;
      case "DISORIENT":
        score += 30 * (applied.chance / 100) * W.cc;
        if (targets.length > 0 && targets[0].teamId !== fighter.teamId && hasStatus(targets[0], "DISORIENT")) {
          score -= 15;
        }
        break;
      case "N_LOCKED":
        score += 25 * (applied.chance / 100) * W.cc;
        break;

      // ── Debuffs ──
      case "POISON":
        score += (15 + (applied.flatDmg ?? 6) * dur * 0.5) * (applied.chance / 100) * W.debuff;
        break;
      case "BURN":
        score += (12 + (applied.pctDmg ?? 3) * dur * 2) * (applied.chance / 100) * W.debuff;
        break;
      case "BLIND":
        score += 18 * (applied.chance / 100) * dur * 0.6 * W.debuff;
        break;
      case "SPD_DOWN":
        score += 12 * dur * 0.5 * W.debuff;
        break;
      case "DEF_DOWN":
        score += 15 * dur * 0.5 * W.debuff;
        break;
      case "MARKED":
        // MARKED enables conditional damage for the team
        score += 12 * W.debuff;
        break;
      case "VULNERABLE":
        score += 18 * W.debuff;
        break;
      case "BLEEDING":
        score += 14 * dur * 0.5 * W.debuff;
        break;

      // ── Buffs ──
      case "EVASION":
        score += 20 * dur * 0.5 * W.buff;
        break;
      case "FOCUS":
        score += 18 * dur * 0.5 * W.buff;
        break;
      case "DEF_UP":
        score += 18 * dur * 0.5 * W.buff;
        // Redundant buff penalty
        if (hasStatus(fighter, "DEF_UP")) score -= 8;
        break;
      case "ATK_UP":
        score += 18 * dur * 0.5 * W.buff;
        if (hasStatus(fighter, "ATK_UP")) score -= 8;
        break;
      case "SPD_UP":
        score += 14 * dur * 0.5 * W.buff;
        if (hasStatus(fighter, "SPD_UP")) score -= 8;
        break;
      case "STUN_IMMUNE":
        score += 15 * W.buff;
        break;
      case "REGEN":
        score += 15 * dur * 0.5 * W.heal;
        break;
    }
  }

  // Team buffs are worth more (affect multiple people)
  if (parsed.isTeamBuff) {
    const teamSize = state.fighters.filter((f) => f.alive && f.teamId === fighter.teamId).length;
    score *= 1 + (teamSize - 1) * 0.15; // each extra ally adds 15% value
  }

  // ═══════════════════════════════════════
  // 3. TACTICAL VALUE
  // ═══════════════════════════════════════

  // ── Clone: damage sponge ──
  if (parsed.isClone) {
    if (fighter.clones.length === 0) {
      score += 25 * W.buff;
    } else {
      score += 5; // diminishing returns
    }
  }

  // ── Summon ──
  if (parsed.isSummon && fighter.summons.length === 0) {
    score += 30 * W.buff;
  }

  // ── Transform: big power spike (but 1x only) ──
  if (parsed.isTransform && !fighter.transformed) {
    score += 35 * W.buff;
    // Even higher value early in the fight
    if (state.turn <= 3) score += 10;
  }

  // ── Execute ──
  if (parsed.isExecute) {
    const execTarget = enemies.find((e) => (e.hp / e.maxHp) * 100 < parsed.executeThreshold);
    if (execTarget) {
      score += MAX_SCORE * 2 * W.killSecure; // always pick execute when available
      targets = [execTarget];
    } else {
      score += parsed.executeFallbackDmg > 0 ? parsed.executeFallbackDmg * 0.3 * W.damage : 5;
      targets = enemies.length > 0 ? [enemies.reduce((a, b) => (a.hp < b.hp ? a : b))] : [];
    }
  }

  // ── Guard ──
  if (parsed.isGuard) {
    const hpPct = fighter.hp / fighter.maxHp;
    score += (hpPct < 0.25 ? 35 : hpPct < 0.40 ? 25 : hpPct < 0.60 ? 12 : 5) * W.survival;
    targets = [fighter];
  }

  // ── Dodge grant ──
  if (parsed.isDodgeGrant && allies.length > 0) {
    const weakest = allies.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
    const weakPct = weakest.hp / weakest.maxHp;
    score += (weakPct < 0.30 ? 30 : weakPct < 0.50 ? 20 : 10) * W.survival;
    targets = [weakest];
  }

  // ── Self-destruct ──
  if (parsed.isSelfDestruct) {
    const hpPct = fighter.hp / fighter.maxHp;
    if (hpPct < 0.10) score += 80 * W.damage;
    else if (hpPct < 0.25) score += 30 * W.damage;
    else score -= 80; // don't blow up at full HP
    targets = [...enemies];
  }

  // ── Revive ──
  if (parsed.isRevive) {
    const revivable = state.deadQueue.filter((d) => d.teamId === fighter.teamId && state.turn - d.diedOnTurn <= 2);
    if (revivable.length > 0) {
      score += 55 * W.survival;
    } else {
      score -= 50; // no one to revive
    }
    targets = [fighter];
  }

  // ── HP swap ──
  if (parsed.swapHpPct && allies.length > 0) {
    const myPct = fighter.hp / fighter.maxHp;
    const weakest = allies.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
    const allyPct = weakest.hp / weakest.maxHp;
    if (myPct > allyPct + 0.30) {
      score += 40 * W.survival;
      targets = [weakest];
    } else {
      score -= 30; // don't swap if it makes things worse
    }
  }

  // ── Chakra transfer ──
  if (parsed.isChakraTransfer && allies.length > 0) {
    const needyAlly = allies.reduce((a, b) => (a.chk < b.chk ? a : b));
    const chkPct = needyAlly.chk / needyAlly.maxChk;
    score += (chkPct < 0.15 ? 25 : chkPct < 0.30 ? 15 : 5) * W.buff;
    targets = [needyAlly];
  }

  // ── Cleanse bonus ──
  if (parsed.cleansesPoison || parsed.cleansesBurn) {
    const cleanTargets = parsed.healTarget === "self" ? [fighter] : [...allies, fighter];
    for (const ct of cleanTargets) {
      if (parsed.cleansesPoison && hasStatus(ct, "POISON")) score += 18 * W.heal;
      if (parsed.cleansesBurn && hasStatus(ct, "BURN")) score += 14 * W.heal;
    }
  }

  // ═══════════════════════════════════════
  // 4. RISK
  // ═══════════════════════════════════════

  // Self-stun / self-damage penalties
  for (const se of parsed.selfEffects) {
    if (se.type === "stun") score -= 20;
    if (se.type === "damage") score -= (se.amount ?? 5) * 0.8;
    if (se.type === "die") score -= 200;
  }
  if (parsed.selfDamage > 0) score -= parsed.selfDamage * 0.6;

  // Low accuracy risk (moves below 90% acc get penalized)
  if (move.acc < 90) {
    score -= (90 - move.acc) * 0.5;
  }

  // Chakra cost risk: penalize if it leaves you with very little CHK for next turns
  const costAfter = fighter.chk - move.chk;
  if (costAfter < 10 && move.chk > 0) {
    score -= 8; // will be stuck with kunai next turn
  }

  // ═══════════════════════════════════════
  // 5. EARLY GAME BONUS for setup moves
  // ═══════════════════════════════════════
  if (state.turn <= 2) {
    if (parsed.isTransform && !fighter.transformed) score += 12;
    if (parsed.isSelfBuff || parsed.isTeamBuff) score += 8;
    if (parsed.isClone && fighter.clones.length === 0) score += 8;
    if (parsed.isSummon && fighter.summons.length === 0) score += 8;
  }

  // ═══════════════════════════════════════
  // 6. FOCUS FIRE bonus
  // ═══════════════════════════════════════
  // Bonus for targeting enemies that are already low HP (finish them off)
  if (!parsed.isAOE && !parsed.isHeal && move.power !== null && move.power > 0 && targets.length > 0) {
    const t = targets[0];
    if (t.teamId !== fighter.teamId) {
      const tPct = t.hp / t.maxHp;
      if (tPct < 0.25) score += 10 * W.killSecure;
      else if (tPct < 0.40) score += 5 * W.killSecure;
    }
  }

  return { score: Math.max(0, score), targets };
}

// ─── Resolve targets for a move ───

function resolveTargets(
  fighter: Fighter,
  parsed: ParsedMoveEffect,
  state: BattleState,
  enemies: Fighter[],
  allies: Fighter[],
): Fighter[] {
  // Heal: target lowest HP ally
  if (parsed.isHeal) {
    return resolveHealTargets(fighter, parsed, allies);
  }

  // Self-buff / guard / clone / summon / transform
  if (parsed.isGuard || parsed.isClone || parsed.isSummon || parsed.isTransform) return [fighter];
  if (parsed.isSelfBuff && !parsed.isAOE) return [fighter];

  // Dodge grant: weakest ally
  if (parsed.isDodgeGrant && allies.length > 0) {
    return [allies.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))];
  }

  // HP swap: lowest HP ally
  if (parsed.swapHpPct && allies.length > 0) {
    return [allies.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))];
  }

  // Chakra transfer: lowest CHK ally
  if (parsed.isChakraTransfer && allies.length > 0) {
    return [allies.reduce((a, b) => (a.chk < b.chk ? a : b))];
  }

  // Revive
  if (parsed.isRevive) return [fighter];

  // Self-destruct: all enemies
  if (parsed.isSelfDestruct) return [...enemies];

  // Team buff
  if (parsed.isTeamBuff) return state.fighters.filter((f) => f.alive && f.teamId === fighter.teamId);

  // AOE: all enemies
  if (parsed.isAOE) return [...enemies];

  // Single-target: pick a target by threat & vulnerability
  if (enemies.length > 0) {
    return [pickSingleTarget(enemies)];
  }

  return [fighter];
}

/** Pick single target: weighted by low HP (vulnerability) */
function pickSingleTarget(enemies: Fighter[]): Fighter {
  // Sort by HP ascending
  const sorted = [...enemies].sort((a, b) => a.hp - b.hp);
  // 50% lowest HP, 30% second lowest, 20% random
  const r = Math.random();
  if (r < 0.50 || sorted.length === 1) return sorted[0];
  if (r < 0.80 && sorted.length >= 2) return sorted[1];
  return enemies[Math.floor(Math.random() * enemies.length)];
}

/** Resolve heal targets based on parsed heal type */
function resolveHealTargets(
  fighter: Fighter,
  parsed: ParsedMoveEffect,
  allies: Fighter[],
): Fighter[] {
  if (parsed.healTarget === "self") return [fighter];
  if (parsed.healTarget === "team") return [fighter, ...allies];
  if (allies.length > 0) {
    // Also consider self if self is lower HP
    const all = [fighter, ...allies];
    return [all.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))];
  }
  return [fighter];
}
