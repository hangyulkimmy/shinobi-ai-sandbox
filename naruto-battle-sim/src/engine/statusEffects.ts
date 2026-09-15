import type { BattleState, Fighter, Ninja } from "../types/game";
import { rebuildMods, hasStatus } from "./statSystem";
import { tickSummons } from "./clones";

// ─── helpers ───
function findNinja(ninjas: Ninja[], id: string): Ninja {
  const n = ninjas.find((x) => x.id === id);
  if (n) return n;
  const base = ninjas.find((x) => id.startsWith(x.id));
  if (base) return base;
  throw new Error(`Missing ninja: ${id}`);
}

/**
 * Process all End-of-Round effects for every alive fighter:
 *  - Poison, Burn, Bleeding damage
 *  - Regen healing
 *  - Self-damage EOR (transform cost, etc.)
 *  - Summon duration ticks
 */
export function processEOR(
  state: BattleState,
  ninjas: Ninja[],
  log: string[],
  handleLethal: (state: BattleState, fighter: Fighter, ninjas: Ninja[], log: string[]) => boolean,
): void {
  // Process in speed order
  const ordered = state.fighters
    .filter((f) => f.alive)
    .map((f) => ({ f, spd: findNinja(ninjas, f.ninjaId).spd }))
    .sort((a, b) => b.spd - a.spd);

  for (const { f } of ordered) {
    if (!f.alive) continue;
    for (const s of [...f.statuses]) {
      if (!f.alive) break;

      switch (s.statusId) {
        case "POISON": {
          const dmg = s.flatDmg ?? 6;
          f.hp = Math.max(0, f.hp - dmg);
          log.push(`${f.displayName} took ${dmg} poison damage.`);
          if (f.hp <= 0) handleLethal(state, f, ninjas, log);
          break;
        }
        case "BURN": {
          const dmg = Math.max(1, Math.floor(f.maxHp * (s.pctDmg ?? 5) / 100));
          f.hp = Math.max(0, f.hp - dmg);
          log.push(`${f.displayName} took ${dmg} burn damage.`);
          if (f.hp <= 0) handleLethal(state, f, ninjas, log);
          break;
        }
        case "BLEEDING": {
          const dmg = s.flatDmg ?? 8;
          f.hp = Math.max(0, f.hp - dmg);
          log.push(`${f.displayName} took ${dmg} bleeding damage.`);
          if (f.hp <= 0) handleLethal(state, f, ninjas, log);
          break;
        }
        case "REGEN": {
          const heal = s.healAmount ?? 6;
          const before = f.hp;
          f.hp = Math.min(f.maxHp, f.hp + heal);
          const actual = f.hp - before;
          if (actual > 0) log.push(`${f.displayName} regenerated ${actual} HP.`);
          break;
        }
        case "SELF_DMG_EOR": {
          const dmg = s.flatDmg ?? 5;
          f.hp = Math.max(0, f.hp - dmg);
          log.push(`${f.displayName} took ${dmg} recoil damage.`);
          if (f.hp <= 0) handleLethal(state, f, ninjas, log);
          break;
        }
      }
    }

    // Tick summons
    if (f.alive) {
      tickSummons(f, log);
    }
  }
}

/**
 * Tick down status durations for all alive fighters. Remove expired statuses.
 */
export function tickAllStatuses(state: BattleState, ninjas: Ninja[]): void {
  for (const f of state.fighters) {
    if (!f.alive) continue;
    const ninja = findNinja(ninjas, f.ninjaId);
    tickStatuses(f, ninja);
  }
}

export function tickStatuses(fighter: Fighter, ninja: Ninja): void {
  let changed = false;
  fighter.statuses = fighter.statuses.filter((s) => {
    if (s.turns === undefined) return true; // permanent
    s.turns -= 1;
    if (s.turns <= 0) {
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) rebuildMods(fighter, ninja);
}

/**
 * Check if a fighter can act this turn based on their status effects.
 */
export function canFighterAct(f: Fighter): { canAct: boolean; reason: string } {
  if (hasStatus(f, "STUN")) return { canAct: false, reason: "stunned" };
  if (hasStatus(f, "DISORIENT")) return { canAct: false, reason: "disoriented" };
  if (hasStatus(f, "SHADOW_LINK")) return { canAct: false, reason: "bound by shadows" };
  return { canAct: true, reason: "" };
}

/** Get total evasion % from all EVASION statuses */
export function getEvasionChance(f: Fighter): number {
  let total = 0;
  for (const s of f.statuses) {
    if (s.statusId === "EVASION") total += s.value ?? 0;
  }
  return Math.min(total, 75); // cap at 75%
}

/** Check if fighter has dodge-next-hit protection */
export function hasDodgeNext(f: Fighter): boolean {
  return hasStatus(f, "DODGE_NEXT");
}

/** Consume the dodge-next-hit status */
export function consumeDodgeNext(f: Fighter, ninja: Ninja): void {
  const idx = f.statuses.findIndex((s) => s.statusId === "DODGE_NEXT");
  if (idx >= 0) {
    f.statuses.splice(idx, 1);
    rebuildMods(f, ninja);
  }
}
