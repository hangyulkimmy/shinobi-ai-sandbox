/**
 * Naruto Battle Sim – Full Battle Engine
 *
 * Turn flow:
 *  1. Turn start → reset flags, fire onTurnStart, check HP thresholds
 *  2. Action phase (priority movers first, then speed order)
 *  3. EOR ticks (poison, burn, bleed, regen, self-damage)
 *  4. Tick status durations, remove expired, rebuild mods
 *  5. Win check
 */

import type {
  BattleState,
  Fighter,
  Move,
  Ninja,
  Team,
  Status,
  AppliedStatusDef,
  ParsedMoveEffect,
} from "../types/game";

import {
  effectiveAtk,
  effectiveCtr,
  effectiveDef,
  effectiveSpd,
  effectiveAcc,
  hasStatus,
  addStatus,
  removeStatus,
  makeStatus,
  makeStatMod,
  defaultAbilityState,
  defaultTurnFlags,
} from "./statSystem";

import { parseMoveDesc } from "./moveParser";
import { firePassive, firePassiveForAll, firePassiveForTeam } from "./passives";
import { processEOR, tickAllStatuses, canFighterAct, getEvasionChance, hasDodgeNext, consumeDodgeNext } from "./statusEffects";
import { absorbWithClone, applySummonReduction, createClone, createSummon } from "./clones";
import { chooseMove as aiChooseMove } from "./ai";

// ─── Helpers ───

function findNinja(ninjas: Ninja[], id: string): Ninja {
  const n = ninjas.find((x) => x.id === id);
  if (n) return n;
  // Fallback: Zetsu split creates "zetsu-b" – map back to base ninja
  const base = ninjas.find((x) => id.startsWith(x.id));
  if (base) return base;
  throw new Error(`Missing ninja: ${id}`);
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function roll(pct: number) {
  return Math.random() * 100 < pct;
}

function aliveFighters(state: BattleState) {
  return state.fighters.filter((f) => f.alive);
}

function teamAlive(state: BattleState, teamId: string) {
  return state.fighters.some((f) => f.alive && f.teamId === teamId);
}

// ─── Damage formula ───

function calcDamage(opts: {
  power: number;
  A: number;
  D: number;
  critChance?: number;
}): { dmg: number; crit: boolean } {
  const cc = opts.critChance ?? 100 / 16;
  const crit = roll(cc);
  const F = crit ? 62 : 42;
  const random = rand(0.9, 1.1);
  const base = ((F * opts.power * (opts.A / Math.max(1, opts.D))) / 50 + 2) * random;
  return { dmg: Math.max(1, Math.floor(base)), crit };
}

// ─── Get effective CHK cost (with passive reductions) ───

function getEffectiveChkCost(
  ninja: Ninja,
  fighter: Fighter,
  move: Move,
  state?: BattleState,
  ninjas?: Ninja[],
  target?: Fighter,
): number {
  const cost = { value: move.chk };
  if (state && ninjas) {
    firePassive("onChkCost", {
      state,
      fighter,
      ninja,
      ninjas,
      log: [],
      move,
      chkCost: cost,
      target,
    });
  }
  return Math.max(0, cost.value);
}

// ─── Handle lethal damage (with passive saves) ───

function handleLethal(
  state: BattleState,
  fighter: Fighter,
  ninjas: Ninja[],
  log: string[],
): boolean {
  if (fighter.hp > 0) return false;

  const ninja = findNinja(ninjas, fighter.ninjaId);

  // 1. Self-save passives (Kakuzu, Sasori, Hidan)
  firePassive("onLethalDamage", {
    state,
    fighter,
    ninja,
    ninjas,
    log,
  });

  if (fighter.alive && fighter.hp > 0) return false; // saved

  // 2. Lady Chiyo save (check teammates)
  const chiyo = state.fighters.find(
    (f) =>
      f.alive &&
      f.teamId === fighter.teamId &&
      f.ninjaId !== fighter.ninjaId &&
      f.ninjaId === nid("Lady Chiyo") &&
      !f.abilityState.chiyoSaveUsed,
  );
  if (chiyo) {
    chiyo.abilityState.chiyoSaveUsed = true;
    fighter.hp = 1;
    fighter.alive = true;
    log.push(`Lady Chiyo's Puppet Matriarch saved ${fighter.displayName}! Set to 1 HP.`);
    return false;
  }

  // Actually dead
  fighter.alive = false;
  fighter.hp = 0;
  state.deadQueue.push({
    ninjaId: fighter.ninjaId,
    teamId: fighter.teamId,
    diedOnTurn: state.turn,
  });
  log.push(`${fighter.displayName} was knocked out!`);

  // Fire onAllyDeath for teammates
  firePassiveForTeam("onAllyDeath", state, fighter.teamId, ninjas, log);

  return true;
}

function nid(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Apply statuses from a parsed move effect ───

function applyMoveStatuses(
  appliedDefs: AppliedStatusDef[],
  attacker: Fighter,
  attackerNinja: Ninja,
  target: Fighter,
  state: BattleState,
  ninjas: Ninja[],
  log: string[],
): void {
  for (const def of appliedDefs) {
    // Roll chance
    let chance = def.chance;

    // Shizune poison chance boost
    if (def.statusId === "POISON" && attacker.ninjaId === nid("Shizune")) {
      chance = Math.min(95, chance + 15);
    }

    if (!roll(chance)) continue;

    // Check immunities
    if (def.statusId === "DISORIENT" && hasStatus(target, "GENJUTSU_IMMUNE")) {
      log.push(`${target.displayName} is immune to Genjutsu!`);
      continue;
    }
    if (def.statusId === "STUN" && hasStatus(target, "STUN_IMMUNE")) {
      log.push(`${target.displayName} is immune to stun!`);
      continue;
    }
    // Sasori is immune to poison
    if (def.statusId === "POISON" && target.ninjaId === nid("Sasori")) {
      log.push(`${target.displayName} is immune to poison!`);
      continue;
    }

    const resolveTargets = (): Fighter[] => {
      switch (def.target) {
        case "enemy":
          return [target];
        case "allEnemies":
          return state.fighters.filter((f) => f.alive && f.teamId !== attacker.teamId);
        case "self":
          return [attacker];
        case "ally":
          return [target]; // target is already resolved by AI
        case "team":
          return state.fighters.filter((f) => f.alive && f.teamId === attacker.teamId);
        default:
          return [target];
      }
    };

    const targets = resolveTargets();

    for (const t of targets) {
      const tNinja = findNinja(ninjas, t.ninjaId);

      // Same immunity checks per target
      if (def.statusId === "DISORIENT" && hasStatus(t, "GENJUTSU_IMMUNE")) continue;
      if (def.statusId === "STUN" && hasStatus(t, "STUN_IMMUNE")) continue;
      if (def.statusId === "POISON" && t.ninjaId === nid("Sasori")) continue;

      const status: Status = {
        id: statusLabel(def),
        statusId: def.statusId,
        turns: def.turns,
        value: def.value,
        stat: def.stat,
        sourceId: attacker.ninjaId,
        flatDmg: def.flatDmg,
        pctDmg: def.pctDmg,
        healAmount: def.healAmount,
      };

      addStatus(t, tNinja, status);
      log.push(`${t.displayName} gained ${status.id}${def.turns ? ` (${def.turns}T)` : ""}!`);
    }

    // Fire onApplyStatus passives for the attacker
    firePassive("onApplyStatus", {
      state,
      fighter: attacker,
      ninja: attackerNinja,
      ninjas,
      log,
      target,
    });
  }
}

function statusLabel(def: AppliedStatusDef): string {
  switch (def.statusId) {
    case "STUN": return "STUN";
    case "POISON": return "POISON";
    case "BURN": return `BURN -${def.pctDmg ?? 5}%`;
    case "BLIND": return `BLIND -${def.value ?? 10}`;
    case "DISORIENT": return "DISORIENT";
    case "SPD_DOWN": return `SPD-${def.value ?? 10}`;
    case "DEF_DOWN": return `DEF-${def.value ?? 10}`;
    case "MARKED": return "MARKED";
    case "VULNERABLE": return "VULNERABLE";
    case "EVASION": return `EVA+${def.value ?? 10}`;
    case "FOCUS": return `FOCUS+${def.value ?? 10}`;
    case "DEF_UP": return `DEF+${def.value ?? 10}`;
    case "ATK_UP": return `ATK+${def.value ?? 10}`;
    case "SPD_UP": return `SPD+${def.value ?? 10}`;
    case "STUN_IMMUNE": return "STUN IMMUNE";
    case "REGEN": return `REGEN ${def.healAmount ?? 6}`;
    case "BLEEDING": return "BLEEDING";
    case "SHADOW_LINK": return "SHADOW LINK";
    case "N_LOCKED": return "N/G LOCKED";
    default: return def.statusId;
  }
}

// ─── Init ───

export function initBattle(ninjas: Ninja[], teams: Team[]): BattleState {
  const fighters: Fighter[] = [];

  for (const t of teams) {
    for (const nidVal of t.members) {
      const n = findNinja(ninjas, nidVal);
      fighters.push({
        ninjaId: n.id,
        displayName: n.name,
        teamId: t.id,
        hp: n.hp,
        maxHp: n.hp,
        chk: n.chk,
        maxChk: n.chk,
        alive: true,
        statuses: [],
        clones: [],
        summons: [],
        abilityState: defaultAbilityState(),
        moveUses: {},
        recentMoves: [],
        transformed: false,
        turnFlags: defaultTurnFlags(),
      });
    }
  }

  const state: BattleState = {
    turn: 0,
    teams,
    fighters,
    log: [],
    deadQueue: [],
  };

  // Fire onBattleStart passives
  const startLog: string[] = [];
  firePassiveForAll("onBattleStart", state, ninjas, startLog);
  state.log = ["Battle started!", ...startLog];
  state.turn = 1;

  return state;
}

// ─── Main turn step ───

export function stepTurn(inputState: BattleState, ninjas: Ninja[]): BattleState {
  if (inputState.winnerTeamId) return inputState;

  // Deep-clone state so we never mutate the input (React StrictMode safe)
  const state: BattleState = {
    ...inputState,
    fighters: inputState.fighters.map((f) => ({
      ...f,
      statuses: f.statuses.map((s) => ({ ...s })),
      clones: f.clones.map((c) => ({ ...c })),
      summons: f.summons.map((s) => ({ ...s })),
      abilityState: { ...f.abilityState, shadowLinks: [...f.abilityState.shadowLinks], splitBodies: [...f.abilityState.splitBodies] },
      moveUses: { ...f.moveUses },
      recentMoves: [...f.recentMoves],
      turnFlags: { ...f.turnFlags },
    })),
    teams: inputState.teams.map((t) => ({ ...t, members: [...t.members] })),
    log: [...inputState.log],
    deadQueue: inputState.deadQueue.map((d) => ({ ...d })),
  };

  const log: string[] = [];
  log.push("");
  log.push(`═══ Turn ${state.turn} ═══`);

  // ──────── TURN START ────────

  // Reset per-turn flags & restore 8 CHK per turn
  for (const f of state.fighters) {
    if (!f.alive) continue;
    f.turnFlags = defaultTurnFlags();
    const chkBefore = f.chk;
    f.chk = Math.min(f.maxChk, f.chk + 8);
    const gained = f.chk - chkBefore;
    if (gained > 0) log.push(`${f.displayName} restored ${gained} CHK.`);
  }

  // Fire onTurnStart passives
  firePassiveForAll("onTurnStart", state, ninjas, log);

  // Check HP thresholds
  for (const f of state.fighters) {
    if (!f.alive) continue;
    const ninja = findNinja(ninjas, f.ninjaId);
    firePassive("onHpThreshold", { state, fighter: f, ninja, ninjas, log });
  }

  // ──────── DETERMINE ACTION ORDER ────────

  const alive = aliveFighters(state);

  // Pre-select moves for priority detection
  const moveChoices = new Map<string, ReturnType<typeof aiChooseMove>>();
  for (const f of alive) {
    const ninja = findNinja(ninjas, f.ninjaId);
    const choice = aiChooseMove(ninja, f, state, ninjas, (n, fi, m) =>
      getEffectiveChkCost(n, fi, m, state, ninjas),
    );
    moveChoices.set(f.ninjaId, choice);
  }

  // Sort: priority movers first, then by speed
  const ordered = alive
    .map((f) => {
      const ninja = findNinja(ninjas, f.ninjaId);
      const choice = moveChoices.get(f.ninjaId)!;
      const parsed = parseMoveDesc(choice.move);
      return {
        f,
        ninja,
        spd: effectiveSpd(ninja, f),
        isPriority: parsed.isPriority,
      };
    })
    .sort((a, b) => {
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      return b.spd - a.spd;
    });

  // ──────── ACTION PHASE ────────

  for (const { f, ninja } of ordered) {
    if (!f.alive) continue;

    // Can act check
    const actCheck = canFighterAct(f);
    if (!actCheck.canAct) {
      log.push(`${f.displayName} is ${actCheck.reason} and cannot act!`);
      continue;
    }

    // Re-evaluate move choice (state may have changed)
    const { move, targets } = aiChooseMove(ninja, f, state, ninjas, (n, fi, m) =>
      getEffectiveChkCost(n, fi, m, state, ninjas),
    );

    const parsed = parseMoveDesc(move);

    // CHK cost
    const cost = getEffectiveChkCost(ninja, f, move, state, ninjas, targets[0]);
    if (cost > f.chk) {
      // Fall back to kunai
      const kunai = ninja.moves.find((m) => m.id === "kunai") ?? ninja.moves[0];
      resolveMove(f, ninja, kunai, parseMoveDesc(kunai), state, ninjas, log);
      continue;
    }
    f.chk = Math.max(0, f.chk - cost);

    // Increment use counter & track recent moves for AI diversity
    f.moveUses[move.id] = (f.moveUses[move.id] ?? 0) + 1;
    f.recentMoves.push(move.id);
    if (f.recentMoves.length > 3) f.recentMoves.shift();

    log.push(`${ninja.name} used ${move.name}!`);

    // Resolve the move
    resolveMoveWithTargets(f, ninja, move, parsed, targets, state, ninjas, log);

    // Post-move: self effects
    for (const se of parsed.selfEffects) {
      if (se.type === "stun" && f.alive) {
        addStatus(f, ninja, makeStatus("STUN", "STUN", se.turns ?? 1));
        log.push(`${f.displayName} is stunned from the effort!`);
      }
      if (se.type === "damage" && f.alive) {
        addStatus(f, ninja, makeStatus("SELF_DMG_EOR", "Recoil", undefined, { flatDmg: se.amount ?? 5 }));
      }
      if (se.type === "die" && f.alive) {
        f.hp = 0;
        handleLethal(state, f, ninjas, log);
      }
    }
    if (parsed.selfDamage > 0 && f.alive) {
      f.hp = Math.max(0, f.hp - parsed.selfDamage);
      log.push(`${f.displayName} took ${parsed.selfDamage} self-damage.`);
      if (f.hp <= 0) handleLethal(state, f, ninjas, log);
    }

    // Fire onAfterMove
    if (f.alive) {
      firePassive("onAfterMove", { state, fighter: f, ninja, ninjas, log, move, target: targets[0] });
    }

    // Fire onSupportMove
    if (f.alive && move.cat === "S") {
      firePassive("onSupportMove", { state, fighter: f, ninja, ninjas, log, move, target: targets[0] });
    }

    // Fire onGenjutsuHit
    if (f.alive && move.cat === "G" && targets.length > 0) {
      firePassive("onGenjutsuHit", { state, fighter: f, ninja, ninjas, log, move, target: targets[0] });
    }

    // Check HP thresholds after action
    for (const ff of state.fighters) {
      if (!ff.alive) continue;
      const nn = findNinja(ninjas, ff.ninjaId);
      firePassive("onHpThreshold", { state, fighter: ff, ninja: nn, ninjas, log });
    }
  }

  // ──────── END OF ROUND ────────

  processEOR(state, ninjas, log, handleLethal);
  tickAllStatuses(state, ninjas);

  // Clean dead queue (keep last 2 rounds only for revive)
  state.deadQueue = state.deadQueue.filter((d) => state.turn - d.diedOnTurn <= 2);

  // Win check
  const aliveTeams = state.teams.filter((t) => teamAlive(state, t.id));
  let winnerTeamId: string | undefined;
  if (aliveTeams.length === 1) winnerTeamId = aliveTeams[0].id;
  if (aliveTeams.length === 0) winnerTeamId = "draw";

  return {
    ...state,
    turn: state.turn + 1,
    log: [...state.log, ...log],
    winnerTeamId,
  };
}

// ─── Move resolution with target list ───

function resolveMoveWithTargets(
  f: Fighter,
  ninja: Ninja,
  move: Move,
  parsed: ParsedMoveEffect,
  targets: Fighter[],
  state: BattleState,
  ninjas: Ninja[],
  log: string[],
): void {
  // ── GUARD ──
  if (parsed.isGuard) {
    f.turnFlags.guardActive = true;
    log.push(`${f.displayName} takes a defensive stance!`);
    return;
  }

  // ── DODGE GRANT ──
  if (parsed.isDodgeGrant && targets.length > 0) {
    const ally = targets[0];
    const allyNinja = findNinja(ninjas, ally.ninjaId);
    addStatus(ally, allyNinja, makeStatus("DODGE_NEXT", "Dodge Next", 2));
    log.push(`${ally.displayName} will dodge the next single-target hit!`);
    return;
  }

  // ── HP SWAP ──
  if (parsed.swapHpPct && targets.length > 0) {
    const ally = targets[0];
    const myPct = f.hp / f.maxHp;
    const allyPct = ally.hp / ally.maxHp;
    f.hp = Math.max(1, Math.floor(f.maxHp * allyPct));
    ally.hp = Math.max(1, Math.floor(ally.maxHp * myPct));
    log.push(`${f.displayName} swapped HP% with ${ally.displayName}!`);
    return;
  }

  // ── CHAKRA TRANSFER ──
  if (parsed.isChakraTransfer && targets.length > 0) {
    const ally = targets[0];
    const amount = Math.min(parsed.chakraTransfer, f.chk);
    f.chk -= amount;
    ally.chk = Math.min(ally.maxChk, ally.chk + amount);
    log.push(`${f.displayName} transferred ${amount} CHK to ${ally.displayName}!`);
    return;
  }

  // ── CLONE CREATION ──
  if (parsed.isClone) {
    const clone = createClone(f.displayName, parsed.cloneHp);
    f.clones.push(clone);
    log.push(`${f.displayName} created a clone! (${parsed.cloneHp} HP)`);
    return;
  }

  // ── SUMMON ──
  if (parsed.isSummon) {
    const summon = createSummon(
      move.name,
      parsed.summonDuration || 3,
      {
        dmgReduction: parsed.summonDmgReduction ? (100 - parsed.summonDmgReduction) / 100 : undefined,
        maxAbsorb: parsed.summonMaxAbsorb || undefined,
        buffs: parsed.summonBuffs,
      },
    );
    f.summons.push(summon);
    // Apply summon buffs
    for (const buff of parsed.summonBuffs) {
      const sid = buff.value > 0 ? "ATK_UP" : "ATK_DOWN";
      addStatus(f, ninja, makeStatMod(sid as any, buff.stat, Math.abs(buff.value), parsed.summonDuration || 3, f.ninjaId));
    }
    // Track for passives
    if (/[Gg]amabunta/i.test(move.name)) f.abilityState.toadActive = true;
    log.push(`${f.displayName} summoned ${summon.name}!`);
    return;
  }

  // ── TRANSFORM (1x only) ──
  if (parsed.isTransform && !parsed.isSelfDestruct) {
    if (f.transformed) {
      log.push(`${f.displayName} is already transformed!`);
      return;
    }
    f.transformed = true;
    // Apply stat changes from the transform
    for (const sc of parsed.statChanges) {
      const isUp = sc.value > 0;
      const sid = isUp
        ? (`${sc.stat.toUpperCase()}_UP` as any)
        : (`${sc.stat.toUpperCase()}_DOWN` as any);
      addStatus(f, ninja, makeStatMod(sid, sc.stat, Math.abs(sc.value), sc.turns, f.ninjaId));
    }
    log.push(`${f.displayName} transformed!`);
    // Some transforms also apply statuses
    applyMoveStatuses(parsed.appliedStatuses.filter((a) => a.target === "self"), f, ninja, f, state, ninjas, log);
    // After-transform passive (Killer B heal)
    firePassive("onAfterMove", { state, fighter: f, ninja, ninjas, log, move });
    return;
  }

  // ── REVIVE ──
  if (parsed.isRevive) {
    const revivable = state.deadQueue.filter(
      (d) => d.teamId === f.teamId && state.turn - d.diedOnTurn <= 2,
    );
    for (const entry of revivable) {
      const dead = state.fighters.find((x) => x.ninjaId === entry.ninjaId);
      if (dead && !dead.alive) {
        dead.alive = true;
        dead.hp = Math.floor(dead.maxHp * 0.5);
        // Cost to reviver
        f.hp = Math.max(1, f.hp - 40);
        log.push(`${dead.displayName} was revived at 50% HP! ${f.displayName} took 40 damage.`);
      }
    }
    state.deadQueue = state.deadQueue.filter((d) => d.teamId !== f.teamId);
    if (f.hp <= 0) handleLethal(state, f, ninjas, log);
    return;
  }

  // ── SELF-DESTRUCT ──
  if (parsed.isSelfDestruct) {
    const enemies = state.fighters.filter((x) => x.alive && x.teamId !== f.teamId);
    for (const e of enemies) {
      e.hp = Math.max(0, e.hp - parsed.selfDestructDamage);
      log.push(`${e.displayName} took ${parsed.selfDestructDamage} damage from the explosion!`);
      if (e.hp <= 0) handleLethal(state, e, ninjas, log);
    }
    f.hp = 0;
    handleLethal(state, f, ninjas, log);
    return;
  }

  // ── EXECUTE ──
  if (parsed.isExecute && targets.length > 0) {
    const target = targets[0];
    const hpPct = (target.hp / target.maxHp) * 100;
    if (hpPct < parsed.executeThreshold) {
      target.hp = 0;
      log.push(`${target.displayName} was executed by ${move.name}!`);
      handleLethal(state, target, ninjas, log);
    } else if (parsed.executeFallbackDmg > 0) {
      target.hp = Math.max(0, target.hp - parsed.executeFallbackDmg);
      log.push(`${target.displayName} took ${parsed.executeFallbackDmg} damage.`);
      if (target.hp <= 0) handleLethal(state, target, ninjas, log);
    } else {
      log.push(`${move.name} failed — target HP too high.`);
    }
    return;
  }

  // ── HEAL ──
  if (parsed.isHeal) {
    const healTargets = resolveHealTargets(f, parsed, targets, state);
    for (const ht of healTargets) {
      let amount = parsed.healToFull ? ht.maxHp - ht.hp : parsed.healAmount;
      // Sakura bonus handled by passive
      const before = ht.hp;
      ht.hp = Math.min(ht.maxHp, ht.hp + amount);
      const actual = ht.hp - before;
      if (actual > 0) log.push(`${ht.displayName} was healed for ${actual} HP!`);
    }
    // Cleanse
    if (parsed.cleansesPoison || parsed.cleansesBurn) {
      for (const ht of healTargets) {
        const htNinja = findNinja(ninjas, ht.ninjaId);
        if (parsed.cleansesPoison && hasStatus(ht, "POISON")) {
          removeStatus(ht, htNinja, "POISON");
          log.push(`${ht.displayName}'s poison was cleansed!`);
        }
        if (parsed.cleansesBurn && hasStatus(ht, "BURN")) {
          removeStatus(ht, htNinja, "BURN");
          log.push(`${ht.displayName}'s burn was cleansed!`);
        }
      }
    }
    // Apply any buff statuses the heal move also grants
    const buffStatuses = parsed.appliedStatuses.filter((a) => a.target === "self" || a.target === "team" || a.target === "ally");
    if (buffStatuses.length > 0) {
      for (const ht of healTargets) {
        applyMoveStatuses(buffStatuses, f, ninja, ht, state, ninjas, log);
      }
    }
    return;
  }

  // ── BUFF-ONLY MOVE (no damage, no heal) ──
  if (move.power === null && !parsed.isHeal) {
    // Apply statuses
    const selfStatuses = parsed.appliedStatuses.filter(
      (a) => a.target === "self" || a.target === "team",
    );
    const enemyStatuses = parsed.appliedStatuses.filter(
      (a) => a.target === "enemy" || a.target === "allEnemies",
    );

    // Self/team buffs
    if (selfStatuses.length > 0) {
      const selfTargets = parsed.isTeamBuff
        ? state.fighters.filter((x) => x.alive && x.teamId === f.teamId)
        : [f];
      for (const st of selfTargets) {
        applyMoveStatuses(selfStatuses, f, ninja, st, state, ninjas, log);
      }
    }

    // Enemy debuffs (e.g. Shadow Possession, Smoke Screen)
    if (enemyStatuses.length > 0) {
      const enemyTargets = parsed.isAOE
        ? state.fighters.filter((x) => x.alive && x.teamId !== f.teamId)
        : targets.filter((t) => t.alive && t.teamId !== f.teamId);
      for (const et of enemyTargets) {
        // Accuracy check for debuff-only moves
        let acc = move.acc;
        const accW = { value: acc };
        firePassive("onAccuracyCalc", { state, fighter: f, ninja, ninjas, log, move, accuracy: accW });
        acc = effectiveAcc(accW.value, f);
        if (!roll(acc)) {
          log.push(`But it missed ${et.displayName}!`);
          continue;
        }
        applyMoveStatuses(enemyStatuses, f, ninja, et, state, ninjas, log);
      }
    }

    // Stat changes from desc (for buff moves)
    if (parsed.statChanges.length > 0 && parsed.isSelfBuff) {
      for (const sc of parsed.statChanges) {
        const isUp = sc.value > 0;
        const sid = isUp ? (`${sc.stat.toUpperCase()}_UP` as any) : (`${sc.stat.toUpperCase()}_DOWN` as any);
        addStatus(f, ninja, makeStatMod(sid, sc.stat, Math.abs(sc.value), sc.turns ?? 3, f.ninjaId));
      }
    }

    // Ritual Circle (Hidan)
    if (/[Rr]itual\s+[Cc]ircle/i.test(move.name)) {
      f.abilityState.ritualActive = true;
      addStatus(f, ninja, makeStatus("RITUAL_CIRCLE", "Ritual Circle"));
      log.push(`${f.displayName} set up a Ritual Circle!`);
    }

    // Shared Pain (Hidan)
    if (/[Ss]hared\s+[Pp]ain/i.test(move.name) && targets.length > 0) {
      const t = targets[0];
      f.abilityState.sharedPainTarget = t.ninjaId;
      const tNinja = findNinja(ninjas, t.ninjaId);
      addStatus(t, tNinja, makeStatus("SHARED_PAIN", "Shared Pain", undefined, { linkedTargetId: f.ninjaId }));
      log.push(`${t.displayName} is linked by Shared Pain!`);
    }

    // If move still has desc info to log
    if (selfStatuses.length === 0 && enemyStatuses.length === 0 && parsed.statChanges.length === 0) {
      log.push(`(${move.desc})`);
    }
    return;
  }

  // ── DAMAGE MOVE ──
  resolveMove(f, ninja, move, parsed, state, ninjas, log, targets);
}

function resolveMove(
  f: Fighter,
  ninja: Ninja,
  move: Move,
  parsed: ParsedMoveEffect,
  state: BattleState,
  ninjas: Ninja[],
  log: string[],
  preTargets?: Fighter[],
): void {
  if (typeof move.power !== "number") {
    log.push(`(${move.desc})`);
    return;
  }

  const enemies = state.fighters.filter((x) => x.alive && x.teamId !== f.teamId);
  if (enemies.length === 0) return;

  // Determine targets
  let damageTargets: Fighter[];
  if (parsed.isAOE) {
    damageTargets = [...enemies];
  } else if (preTargets && preTargets.length > 0 && preTargets[0].teamId !== f.teamId) {
    damageTargets = [preTargets[0]];
  } else {
    // Lowest HP
    const sorted = [...enemies].sort((a, b) => a.hp - b.hp);
    damageTargets = [sorted[0]];
  }

  const hitCount = parsed.hitCount || 1;

  // AOE splits base power across targets
  const aoeDivisor = parsed.isAOE ? damageTargets.filter((t) => t.alive).length : 1;

  // Track which targets were actually hit (for status application)
  const hitTargets = new Set<string>();

  for (const target of damageTargets) {
    if (!target.alive) continue;
    const targetNinja = findNinja(ninjas, target.ninjaId);

    for (let hit = 0; hit < hitCount; hit++) {
      if (!target.alive) break;

      // ── EVASION CHECK ──
      if (!parsed.isAOE) {
        // Dodge-next check
        if (hasDodgeNext(target)) {
          consumeDodgeNext(target, targetNinja);
          log.push(`${target.displayName} dodged the attack!`);
          continue;
        }
        // Guard check
        if (target.turnFlags.guardActive) {
          log.push(`${target.displayName}'s guard blocked the attack!`);
          continue;
        }
        // Evasion roll
        const evasion = getEvasionChance(target);
        if (evasion > 0 && roll(evasion)) {
          log.push(`${target.displayName} evaded the attack!`);
          continue;
        }
      }

      // ── ACCURACY CHECK ──
      const accW = { value: move.acc };
      firePassive("onAccuracyCalc", { state, fighter: f, ninja, ninjas, log, move, accuracy: accW, target });
      const finalAcc = effectiveAcc(accW.value, f);

      if (!roll(finalAcc)) {
        log.push(`But it missed ${target.displayName}!`);
        continue;
      }

      // ── HIT CONFIRMED ──
      hitTargets.add(target.ninjaId);

      // ── DAMAGE CALC ──
      const isPhysical = move.cat === "T";
      const A = isPhysical ? effectiveAtk(ninja, f) : effectiveCtr(ninja, f);

      // DEF calc with ignore passives
      const defIgnore = { value: 1.0 };
      firePassive("onDefCalc", { state, fighter: f, ninja, ninjas, log, move, defIgnore, target });
      const D = Math.max(1, Math.floor(effectiveDef(targetNinja, target) * defIgnore.value));

      // Crit chance
      const critW = { value: 100 / 16 }; // 6.25%
      firePassive("onCritCalc", { state, fighter: f, ninja, ninjas, log, critChance: critW });

      const effectivePower = parsed.isAOE ? Math.max(1, Math.floor(move.power / aoeDivisor)) : move.power;
      const { dmg: baseDmg, crit } = calcDamage({ power: effectivePower, A, D, critChance: critW.value });

      let dmg = baseDmg;

      // Conditional bonus
      if (parsed.conditionalOn === "MARKED" && hasStatus(target, "MARKED") && parsed.conditionalBonusPct > 0) {
        dmg = Math.floor(dmg * (1 + parsed.conditionalBonusPct / 100));
      }

      // Vulnerable check
      if (hasStatus(target, "VULNERABLE")) {
        dmg = Math.floor(dmg * 1.2);
        removeStatus(target, targetNinja, "VULNERABLE");
        log.push(`${target.displayName} was vulnerable!`);
      }

      // Hidan Severed: deals less damage
      if (hasStatus(f, "SEVERED")) {
        dmg = Math.floor(dmg * 0.85);
      }

      // ── PRE-HIT PASSIVES (attacker) ──
      const dmgW = { value: dmg };
      firePassive("onBeforeHit", { state, fighter: f, ninja, ninjas, log, move, target, damage: dmgW });
      dmg = dmgW.value;

      // ── PRE-HIT PASSIVES (defender) ──
      const dmgW2 = { value: dmg };
      firePassive("onBeforeHitReceived", {
        state,
        fighter: target,
        ninja: targetNinja,
        ninjas,
        log,
        move,
        attacker: f,
        damage: dmgW2,
        isAOE: parsed.isAOE,
      });
      dmg = dmgW2.value;

      // Hidan Severed: takes more damage
      if (hasStatus(target, "SEVERED")) {
        dmg = Math.floor(dmg * 1.2);
      }

      // Clone absorption (single-target only)
      dmg = absorbWithClone(target, dmg, log, parsed.isAOE);

      // Summon reduction
      dmg = applySummonReduction(target, dmg, log);

      // Apply damage
      if (dmg > 0) {
        target.hp = Math.max(0, target.hp - dmg);
        log.push(
          `${target.displayName} took ${dmg} damage${crit ? " (CRIT!)" : ""}.${
            hit > 0 ? ` (hit ${hit + 1})` : ""
          }`,
        );
      }

      // ── POST-HIT PASSIVES (attacker) ──
      firePassive("onDealDamage", {
        state,
        fighter: f,
        ninja,
        ninjas,
        log,
        move,
        target,
        damage: { value: dmg },
      });

      // ── POST-HIT PASSIVES (defender) ──
      firePassive("onReceiveDamage", {
        state,
        fighter: target,
        ninja: targetNinja,
        ninjas,
        log,
        move,
        attacker: f,
        damage: { value: dmg },
        isAOE: parsed.isAOE,
      });

      // ── CHAKRA DRAIN ──
      if (parsed.chakraDrain > 0) {
        const drain = Math.min(parsed.chakraDrain, target.chk);
        target.chk -= drain;
        if (drain > 0) log.push(`${target.displayName} lost ${drain} CHK!`);
      }

      // ── SHARED PAIN (Hidan) ──
      const sharedPain = target.statuses.find((s) => s.statusId === "SHARED_PAIN");
      if (sharedPain && sharedPain.linkedTargetId) {
        const linked = state.fighters.find((x) => x.ninjaId === sharedPain.linkedTargetId && x.alive);
        if (linked) {
          const sharedDmg = Math.floor(dmg * 0.5);
          linked.hp = Math.max(0, linked.hp - sharedDmg);
          log.push(`${linked.displayName} took ${sharedDmg} shared pain damage!`);
          if (linked.hp <= 0) handleLethal(state, linked, ninjas, log);
        }
      }

      // ── LETHAL CHECK ──
      if (target.hp <= 0) {
        handleLethal(state, target, ninjas, log);
        break; // stop multi-hit on dead target
      }
    }
  }

  // ── APPLY STATUSES (only to targets that were actually hit) ──

  // Enemy statuses: apply once per target that was hit, NOT via "allEnemies" expansion
  const enemyStatuses = parsed.appliedStatuses.filter(
    (a) => a.target === "enemy" || a.target === "allEnemies",
  );
  if (enemyStatuses.length > 0) {
    // Force each status to apply as "enemy" (single target) to avoid allEnemies re-expansion
    const singleTargetDefs = enemyStatuses.map((s) => ({ ...s, target: "enemy" as const }));
    for (const target of damageTargets) {
      if (!target.alive) continue;
      if (!hitTargets.has(target.ninjaId)) continue; // missed = no status
      applyMoveStatuses(singleTargetDefs, f, ninja, target, state, ninjas, log);
    }
  }

  // Self/team statuses: apply once total (not per target)
  const selfTeamStatuses = parsed.appliedStatuses.filter(
    (a) => a.target === "self" || a.target === "team",
  );
  if (selfTeamStatuses.length > 0 && hitTargets.size > 0) {
    // Only apply self/team buffs if at least one hit landed
    const selfTargets = parsed.isTeamBuff
      ? state.fighters.filter((x) => x.alive && x.teamId === f.teamId)
      : [f];
    for (const st of selfTargets) {
      applyMoveStatuses(selfTeamStatuses, f, ninja, st, state, ninjas, log);
    }
  }
}

function resolveHealTargets(
  f: Fighter,
  parsed: ParsedMoveEffect,
  targets: Fighter[],
  state: BattleState,
): Fighter[] {
  switch (parsed.healTarget) {
    case "self":
      return [f];
    case "team":
      return state.fighters.filter((x) => x.alive && x.teamId === f.teamId);
    case "ally":
    case "anybody": {
      // Use AI-selected target, or fallback to lowest HP ally
      if (targets.length > 0 && targets[0].teamId === f.teamId) return [targets[0]];
      const allies = state.fighters.filter((x) => x.alive && x.teamId === f.teamId);
      allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      return allies.length > 0 ? [allies[0]] : [f];
    }
    default:
      return [f];
  }
}

// Keep the old API for backward compatibility
export { chooseMove } from "./ai";
