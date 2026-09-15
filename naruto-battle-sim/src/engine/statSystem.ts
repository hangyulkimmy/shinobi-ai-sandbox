import type { Fighter, Status, StatusId, Ninja } from "../types/game";

// ─── Multiplicative effective stat ───

export function getEffectiveStat(baseStat: number, mods: number[]): number {
  let m = 1.0;
  for (const f of mods) m *= f;
  return Math.max(1, Math.floor(baseStat * m));
}

/** Rebuild every mod array from the current statuses list. Call after any status add / remove. */
export function rebuildMods(fighter: Fighter, _ninja: Ninja): void {
  const atk: number[] = [];
  const def: number[] = [];
  const ctr: number[] = [];
  const spd: number[] = [];
  const acc: number[] = [];

  for (const s of fighter.statuses) {
    if (s.value === undefined || !s.stat) continue;
    const isDown =
      s.statusId.includes("DOWN") ||
      s.statusId === "BLIND" ||
      s.statusId === "SEVERED"; // severed is a debuff wrapper
    const factor = isDown ? (100 - s.value) / 100 : (100 + s.value) / 100;

    switch (s.stat) {
      case "atk": atk.push(factor); break;
      case "def": def.push(factor); break;
      case "ctr": ctr.push(factor); break;
      case "spd": spd.push(factor); break;
      case "acc": acc.push(factor); break;
    }
  }

  (fighter as any)._atkMods = atk;
  (fighter as any)._defMods = def;
  (fighter as any)._ctrMods = ctr;
  (fighter as any)._spdMods = spd;
  (fighter as any)._accMods = acc;
}

export function atkMods(f: Fighter): number[] { return (f as any)._atkMods ?? []; }
export function defMods(f: Fighter): number[] { return (f as any)._defMods ?? []; }
export function ctrMods(f: Fighter): number[] { return (f as any)._ctrMods ?? []; }
export function spdMods(f: Fighter): number[] { return (f as any)._spdMods ?? []; }
export function accMods(f: Fighter): number[] { return (f as any)._accMods ?? []; }

export function effectiveAtk(ninja: Ninja, f: Fighter): number { return getEffectiveStat(ninja.atk, atkMods(f)); }
export function effectiveDef(ninja: Ninja, f: Fighter): number { return getEffectiveStat(ninja.def, defMods(f)); }
export function effectiveCtr(ninja: Ninja, f: Fighter): number { return getEffectiveStat(ninja.ctr, ctrMods(f)); }
export function effectiveSpd(ninja: Ninja, f: Fighter): number { return getEffectiveStat(ninja.spd, spdMods(f)); }
export function effectiveAcc(baseAcc: number, f: Fighter): number { return getEffectiveStat(baseAcc, accMods(f)); }

// ─── Status helpers ───

export function hasStatus(f: Fighter, sid: StatusId): boolean {
  return f.statuses.some((s) => s.statusId === sid);
}

export function getStatus(f: Fighter, sid: StatusId): Status | undefined {
  return f.statuses.find((s) => s.statusId === sid);
}

export function countStatus(f: Fighter, stackKey: string): number {
  return f.statuses.filter((s) => s.stackKey === stackKey).length;
}

/**
 * Add a status to a fighter. Respects stack limits.
 * For "refresh-only" statuses, pass `refreshOnly: true` to only refresh duration if one exists.
 */
export function addStatus(
  fighter: Fighter,
  ninja: Ninja,
  status: Status,
  opts?: { refreshOnly?: boolean },
): boolean {
  // Stack limit check
  if (status.stackKey && status.maxStacks) {
    const existing = fighter.statuses.filter((s) => s.stackKey === status.stackKey);
    if (existing.length >= status.maxStacks) {
      // Refresh the oldest one's duration instead of adding
      if (status.turns !== undefined && existing[0].turns !== undefined) {
        existing[0].turns = status.turns;
      }
      return false;
    }
  }

  // Refresh-only: if one already exists, just refresh duration
  if (opts?.refreshOnly) {
    const existing = fighter.statuses.find((s) => s.statusId === status.statusId);
    if (existing) {
      if (status.turns !== undefined) existing.turns = status.turns;
      return false; // didn't add new
    }
  }

  fighter.statuses.push(status);
  rebuildMods(fighter, ninja);
  return true;
}

export function removeStatus(fighter: Fighter, ninja: Ninja, sid: StatusId): void {
  fighter.statuses = fighter.statuses.filter((s) => s.statusId !== sid);
  rebuildMods(fighter, ninja);
}

export function removeStatusByKey(fighter: Fighter, ninja: Ninja, stackKey: string): void {
  fighter.statuses = fighter.statuses.filter((s) => s.stackKey !== stackKey);
  rebuildMods(fighter, ninja);
}

/** Create a simple display-friendly Status object */
export function makeStatus(
  sid: StatusId,
  label: string,
  turns?: number,
  extra?: Partial<Status>,
): Status {
  return { id: label, statusId: sid, turns, ...extra };
}

/** Create a stat-mod status with proper label */
export function makeStatMod(
  sid: StatusId,
  stat: string,
  value: number,
  turns?: number,
  sourceId?: string,
  stackKey?: string,
  maxStacks?: number,
): Status {
  const sign = sid.includes("DOWN") || sid === "BLIND" ? "-" : "+";
  const label = `${stat.toUpperCase()}${sign}${value}`;
  return {
    id: label,
    statusId: sid,
    turns,
    value,
    stat,
    sourceId,
    stackKey,
    maxStacks,
  };
}

// ─── Fighter factory helpers ───

export function defaultAbilityState(): import("../types/game").AbilityState {
  return {
    triggered: false,
    extraLives: 0,
    kamuiCooldown: 0,
    hitReducedThisTurn: false,
    acidAppliedThisTurn: false,
    toadActive: false,
    shadowLinks: [],
    ritualActive: false,
    vengeanceStacks: 0,
    scrollArsenalCharges: 0,
    splitBodies: [],
    protectedThisRound: false,
    surgedThisRound: false,
    genjutsuMarkedThisRound: false,
    serpentEscapeUsed: false,
    chiyoSaveUsed: false,
  };
}

export function defaultTurnFlags(): import("../types/game").TurnFlags {
  return { actedThisTurn: false, canAct: true, guardActive: false };
}
