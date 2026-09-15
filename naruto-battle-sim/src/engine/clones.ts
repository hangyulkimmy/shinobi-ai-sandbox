import type { Fighter, Clone, Summon } from "../types/game";

/**
 * Try to absorb damage via clones. Returns the remaining damage that hits the actual fighter.
 * AOE attacks bypass clones.
 */
export function absorbWithClone(
  target: Fighter,
  damage: number,
  log: string[],
  isAOE: boolean,
): number {
  if (isAOE || target.clones.length === 0) return damage;

  const clone = target.clones[0];

  if (clone.absorbHits !== undefined && clone.absorbHits > 0) {
    clone.absorbHits -= 1;
    log.push(`${clone.name} absorbed the hit!`);
    if (clone.absorbHits <= 0) {
      target.clones.shift();
      log.push(`${clone.name} was destroyed!`);
    }
    return 0;
  }

  // HP-based clone
  clone.hp -= damage;
  if (clone.hp <= 0) {
    const overflow = Math.abs(clone.hp);
    target.clones.shift();
    log.push(`${clone.name} was destroyed!`);
    return overflow;
  }
  log.push(`${clone.name} took ${damage} damage. (${clone.hp}/${clone.maxHp} HP left)`);
  return 0;
}

/** Create a clone entity */
export function createClone(ownerName: string, hp: number, absorbHits?: number): Clone {
  return {
    id: `clone-${ownerName}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${ownerName}'s Clone`,
    hp,
    maxHp: hp,
    absorbHits,
  };
}

/** Apply summon damage reduction. Returns modified damage. */
export function applySummonReduction(
  target: Fighter,
  damage: number,
  log: string[],
): number {
  if (target.summons.length === 0) return damage;

  let finalDmg = damage;
  for (const summon of target.summons) {
    if (summon.dmgReduction) {
      const reduction = Math.floor(damage * (1 - summon.dmgReduction));
      const reduced = damage - reduction;
      finalDmg = reduction;

      if (summon.maxAbsorb !== undefined) {
        summon.absorbed += reduced;
        if (summon.absorbed >= summon.maxAbsorb) {
          log.push(`${summon.name} absorbed too much damage and vanished!`);
          target.summons = target.summons.filter((s) => s.id !== summon.id);
        }
      }
      break; // only one summon applies reduction at a time
    }
  }
  return finalDmg;
}

/** Tick summon durations. Remove expired summons. */
export function tickSummons(fighter: Fighter, log: string[]): void {
  fighter.summons = fighter.summons.filter((s) => {
    if (s.turnsLeft === -1) return true; // permanent until destroyed
    s.turnsLeft -= 1;
    if (s.turnsLeft <= 0) {
      log.push(`${s.name} has expired.`);
      return false;
    }
    return true;
  });
}

/** Create a summon entity */
export function createSummon(
  name: string,
  turnsLeft: number,
  opts?: {
    dmgReduction?: number;
    maxAbsorb?: number;
    buffs?: { stat: string; value: number }[];
  },
): Summon {
  return {
    id: `summon-${name}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    turnsLeft,
    absorbed: 0,
    dmgReduction: opts?.dmgReduction,
    maxAbsorb: opts?.maxAbsorb,
    buffs: opts?.buffs,
  };
}
