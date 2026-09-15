/**
 * Passive ability registry for all 48 ninjas.
 *
 * Each passive is a set of hooks that fire at specific moments in the turn flow.
 * The battle engine calls `firePassive(hook, ctx)` and all registered handlers run.
 */

import type { BattleState, Fighter, Move, Ninja } from "../types/game";
import {
  addStatus,
  hasStatus,
  makeStatMod,
  makeStatus,
  removeStatus,
} from "./statSystem";

// ─── Context passed to passive handlers ───

export type PassiveCtx = {
  state: BattleState;
  fighter: Fighter;
  ninja: Ninja;
  ninjas: Ninja[];
  log: string[];
  // Contextual (set by caller when relevant)
  move?: Move;
  target?: Fighter;
  attacker?: Fighter;
  /** Mutable damage wrapper – handler can modify .value */
  damage?: { value: number };
  /** Mutable accuracy wrapper */
  accuracy?: { value: number };
  /** Mutable CHK cost wrapper */
  chkCost?: { value: number };
  /** Mutable crit-chance wrapper (base 6.25) */
  critChance?: { value: number };
  /** Mutable DEF multiplier – set < 1 to ignore portion of DEF */
  defIgnore?: { value: number };
  isAOE?: boolean;
};

export type PassiveHook =
  | "onBattleStart"
  | "onTurnStart"
  | "onChkCost"
  | "onAccuracyCalc"
  | "onCritCalc"
  | "onDefCalc"
  | "onBeforeHit"
  | "onBeforeHitReceived"
  | "onDealDamage"
  | "onReceiveDamage"
  | "onAfterMove"
  | "onLethalDamage"
  | "onAllyDeath"
  | "onHpThreshold"
  | "onGenjutsuHit"
  | "onSupportMove"
  | "onApplyStatus";

type Handler = (ctx: PassiveCtx) => void;
type PassiveEntry = { hook: PassiveHook; handler: Handler };

// ─── Registry ───

const REGISTRY = new Map<string, PassiveEntry[]>();

function reg(ninjaId: string, entries: PassiveEntry[]) {
  REGISTRY.set(ninjaId, entries);
}

// Helper to match ninja by id prefix
function nid(name: string): string {
  return name.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function findNinja(ninjas: Ninja[], id: string): Ninja {
  return ninjas.find((x) => x.id === id) ?? ninjas.find((x) => id.startsWith(x.id))!;
}

// ───────────────────────────────────────────
// 1. Tsunade – Antidote
// ───────────────────────────────────────────
reg(nid("Tsunade"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      // Cure poison after 1 round (just remove it at turn start if present)
      const poison = ctx.fighter.statuses.find((s) => s.statusId === "POISON");
      if (poison) {
        removeStatus(ctx.fighter, ctx.ninja, "POISON");
        ctx.log.push(`${ctx.fighter.displayName}'s Antidote cured poison!`);
      }
      // Reduce disorient duration by 1
      const dis = ctx.fighter.statuses.find((s) => s.statusId === "DISORIENT");
      if (dis && dis.turns !== undefined) {
        dis.turns = Math.max(0, dis.turns - 1);
        if (dis.turns <= 0) {
          removeStatus(ctx.fighter, ctx.ninja, "DISORIENT");
          ctx.log.push(`${ctx.fighter.displayName}'s Antidote cleared disorientation!`);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 2. Killer B – Gyuki Boost
// ───────────────────────────────────────────
reg(nid("Killer B"), [
  {
    hook: "onAfterMove",
    handler(ctx) {
      // When Killer B transforms, heal 20% max HP
      if (ctx.move && /[Vv]ersion\s*2\s*[Cc]loak/i.test(ctx.move.name) && ctx.fighter.transformed) {
        const heal = Math.floor(ctx.fighter.maxHp * 0.2);
        ctx.fighter.hp = Math.min(ctx.fighter.maxHp, ctx.fighter.hp + heal);
        ctx.log.push(`${ctx.fighter.displayName}'s Gyuki Boost healed ${heal} HP!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 3. Orochimaru – Serpent Escape
// ───────────────────────────────────────────
reg(nid("Orochimaru"), [
  {
    hook: "onApplyStatus",
    handler(ctx) {
      // When stun would be applied to Orochimaru, negate it for 20 CHK (once)
      if (
        ctx.target?.ninjaId === ctx.fighter.ninjaId &&
        ctx.move &&
        !ctx.fighter.abilityState.serpentEscapeUsed &&
        hasStatus(ctx.fighter, "STUN")
      ) {
        if (ctx.fighter.chk >= 20) {
          ctx.fighter.chk -= 20;
          removeStatus(ctx.fighter, ctx.ninja, "STUN");
          ctx.fighter.abilityState.serpentEscapeUsed = true;
          ctx.log.push(`${ctx.fighter.displayName}'s Serpent Escape negated stun! (-20 CHK)`);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 4. Kisame – Shark Skin
// ───────────────────────────────────────────
reg(nid("Kisame Hoshigaki"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.target && ctx.damage && ctx.damage.value > 0) {
        const drain = Math.min(8, ctx.target.chk);
        ctx.target.chk -= drain;
        ctx.fighter.chk = Math.min(ctx.fighter.maxChk, ctx.fighter.chk + drain);
        if (drain > 0) ctx.log.push(`${ctx.fighter.displayName}'s Shark Skin drained ${drain} CHK!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 5. Minato – Flying Raijin Mastery
// ───────────────────────────────────────────
reg(nid("Minato Namikaze"), [
  {
    hook: "onChkCost",
    handler(ctx) {
      if (ctx.target && hasStatus(ctx.target, "MARKED") && ctx.chkCost) {
        const reduction = Math.floor(ctx.chkCost.value * 0.3);
        ctx.chkCost.value -= reduction;
        // Logged silently
      }
    },
  },
]);

// ───────────────────────────────────────────
// 6. Pain – Rinnegan Pressure
// ───────────────────────────────────────────
reg(nid("Pain"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.hitReducedThisTurn = false;
    },
  },
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (!ctx.fighter.abilityState.hitReducedThisTurn && ctx.damage) {
        ctx.damage.value = Math.floor(ctx.damage.value * 0.9);
        ctx.fighter.abilityState.hitReducedThisTurn = true;
        ctx.log.push(`${ctx.fighter.displayName}'s Rinnegan Pressure reduced damage!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 7. A (4th Raikage) – Lightning Armor
// ───────────────────────────────────────────
reg(nid("A (4th Raikage)"), [
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (ctx.damage && ctx.fighter.hp > ctx.fighter.maxHp * 0.5) {
        ctx.damage.value = Math.floor(ctx.damage.value * 0.85);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 8. Kakashi – Sharingan
// ───────────────────────────────────────────
reg(nid("Kakashi Hatake"), [
  {
    hook: "onReceiveDamage",
    handler(ctx) {
      // Store the first enemy move used against Kakashi (once per battle)
      if (
        ctx.attacker &&
        ctx.move &&
        !ctx.fighter.abilityState.storedMove &&
        ctx.attacker.teamId !== ctx.fighter.teamId
      ) {
        ctx.fighter.abilityState.storedMove = { ...ctx.move };
        ctx.log.push(`${ctx.fighter.displayName}'s Sharingan copied ${ctx.move.name}!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 9. Jiraiya – Toad Contract
// ───────────────────────────────────────────
reg(nid("Jiraiya"), [
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (ctx.fighter.abilityState.toadActive && ctx.damage) {
        ctx.damage.value = Math.floor(ctx.damage.value * 0.85);
      }
    },
  },
  {
    hook: "onChkCost",
    handler(ctx) {
      if (ctx.fighter.abilityState.toadActive && ctx.move?.cat === "N" && ctx.chkCost) {
        ctx.chkCost.value = Math.floor(ctx.chkCost.value * 0.8);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 10. Naruto – Kurama Cloak
// ───────────────────────────────────────────
reg(nid("Naruto Uzumaki"), [
  {
    hook: "onHpThreshold",
    handler(ctx) {
      if (!ctx.fighter.abilityState.triggered && ctx.fighter.hp > 0 && ctx.fighter.hp <= ctx.fighter.maxHp * 0.3) {
        ctx.fighter.abilityState.triggered = true;
        const heal = Math.floor(ctx.fighter.maxHp * 0.2);
        ctx.fighter.hp = Math.min(ctx.fighter.maxHp, ctx.fighter.hp + heal);
        // Permanent buffs
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("ATK_UP", "atk", 20, undefined, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("CTR_UP", "ctr", 40, undefined, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("DEF_UP", "def", 20, undefined, ctx.fighter.ninjaId));
        ctx.log.push(`${ctx.fighter.displayName}'s Kurama Cloak activated! Healed ${heal} HP, ATK+20, CTR+40, DEF+20!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 11. Gaara – Shukaku Awakening
// ───────────────────────────────────────────
reg(nid("Gaara"), [
  {
    hook: "onHpThreshold",
    handler(ctx) {
      if (!ctx.fighter.abilityState.triggered && ctx.fighter.hp > 0 && ctx.fighter.hp <= ctx.fighter.maxHp * 0.3) {
        ctx.fighter.abilityState.triggered = true;
        ctx.fighter.transformed = true;
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("DEF_UP", "def", 20, 3, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("CTR_UP", "ctr", 25, 3, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("ATK_UP", "atk", 10, 3, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatus("SELF_DMG_EOR", "Recoil", 3, { flatDmg: 5 }));
        ctx.log.push(`${ctx.fighter.displayName}'s Shukaku Awakening activated!`);
        // Blind all enemies
        for (const e of ctx.state.fighters.filter((f) => f.alive && f.teamId !== ctx.fighter.teamId)) {
          const en = findNinja(ctx.ninjas, e.ninjaId);
          addStatus(e, en, makeStatMod("BLIND", "acc", 5, 2, ctx.fighter.ninjaId));
          ctx.log.push(`${e.displayName} was blinded!`);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 12. Sasuke – Vengeance
// ───────────────────────────────────────────
reg(nid("Sasuke Uchiha"), [
  {
    hook: "onAllyDeath",
    handler(ctx) {
      if (ctx.fighter.abilityState.vengeanceStacks < 2) {
        ctx.fighter.abilityState.vengeanceStacks += 1;
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("ATK_UP", "atk", 10, undefined, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("CTR_UP", "ctr", 10, undefined, ctx.fighter.ninjaId));
        ctx.log.push(`${ctx.fighter.displayName}'s Vengeance activated! ATK+10, CTR+10 (stack ${ctx.fighter.abilityState.vengeanceStacks})`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 13. Itachi – Genjutsu Master
// ───────────────────────────────────────────
reg(nid("Itachi Uchiha"), [
  {
    hook: "onBattleStart",
    handler(ctx) {
      addStatus(ctx.fighter, ctx.ninja, makeStatus("GENJUTSU_IMMUNE", "Genjutsu Immune"));
    },
  },
  {
    hook: "onGenjutsuHit",
    handler(ctx) {
      if (ctx.target) {
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatus("SELF_DMG_EOR", "Itachi Curse", 2, { flatDmg: 10, sourceId: ctx.fighter.ninjaId }));
        ctx.log.push(`${ctx.target.displayName} takes curse damage from Itachi's Genjutsu!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 14. Might Guy – Eight Gates (passive is manual via Gate Release move)
// ───────────────────────────────────────────
// No auto-passive needed; Gate Release applies buffs when used as a move

// ───────────────────────────────────────────
// 15. Kakuzu – Earth Grudge Fear
// ───────────────────────────────────────────
reg(nid("Kakuzu"), [
  {
    hook: "onBattleStart",
    handler(ctx) {
      ctx.fighter.abilityState.extraLives = 4;
    },
  },
  {
    hook: "onLethalDamage",
    handler(ctx) {
      if (ctx.fighter.abilityState.extraLives > 0) {
        ctx.fighter.abilityState.extraLives -= 1;
        ctx.fighter.hp = Math.floor(ctx.fighter.maxHp * 0.25);
        ctx.fighter.alive = true;
        ctx.log.push(`${ctx.fighter.displayName} lost a heart! (${ctx.fighter.abilityState.extraLives} remaining) Revived at 25% HP.`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 16. Yamato – Wood Style Control
// ───────────────────────────────────────────
reg(nid("Yamato"), [
  {
    hook: "onSupportMove",
    handler(ctx) {
      if (ctx.target) {
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, {
          id: "EVA+10",
          statusId: "EVASION",
          turns: 2,
          value: 10,
          sourceId: ctx.fighter.ninjaId,
        });
        ctx.log.push(`${ctx.target.displayName} gained Evasion +10 from Yamato's Wood Style!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 17. Sakura – Medical Prodigy
// ───────────────────────────────────────────
reg(nid("Sakura Haruno"), [
  {
    hook: "onAfterMove",
    handler(ctx) {
      // If Sakura just healed and target is below 50%, add 10 extra HP
      if (ctx.move?.cat === "S" && ctx.target && ctx.target.hp < ctx.target.maxHp * 0.5 && ctx.target.hp > 0) {
        const bonus = 10;
        ctx.target.hp = Math.min(ctx.target.maxHp, ctx.target.hp + bonus);
        ctx.log.push(`${ctx.fighter.displayName}'s Medical Prodigy healed ${ctx.target.displayName} an extra ${bonus} HP!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 18. Kabuto – Anatomy Expert
// ───────────────────────────────────────────
reg(nid("Kabuto Yakushi"), [
  {
    hook: "onDefCalc",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.defIgnore) {
        ctx.defIgnore.value *= 0.85; // ignore 15% of DEF
      }
    },
  },
]);

// ───────────────────────────────────────────
// 19. Obito – Kamui Intangibility
// ───────────────────────────────────────────
reg(nid("Obito Uchiha"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.kamuiCooldown += 1;
      ctx.fighter.abilityState.hitReducedThisTurn = false;
    },
  },
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (
        ctx.fighter.abilityState.kamuiCooldown >= 3 &&
        !ctx.fighter.abilityState.hitReducedThisTurn &&
        ctx.damage
      ) {
        ctx.damage.value = 0;
        ctx.fighter.abilityState.kamuiCooldown = 0;
        ctx.fighter.abilityState.hitReducedThisTurn = true;
        ctx.log.push(`${ctx.fighter.displayName}'s Kamui phased through the attack!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 20. Rock Lee – Hard Work
// ───────────────────────────────────────────
reg(nid("Rock Lee"), [
  {
    hook: "onAfterMove",
    handler(ctx) {
      if (ctx.move?.cat === "T") {
        const key = `FOCUS:${ctx.fighter.ninjaId}`;
        const count = ctx.fighter.statuses.filter((s) => s.stackKey === key).length;
        if (count < 3) {
          addStatus(ctx.fighter, ctx.ninja, {
            id: "FOCUS+10",
            statusId: "FOCUS",
            turns: 2,
            value: 10,
            stat: "acc",
            stackKey: key,
            maxStacks: 3,
          });
          ctx.log.push(`${ctx.fighter.displayName}'s Hard Work! Focus +10 ACC (stack ${count + 1})`);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 21. Neji – Byakugan Precision
// ───────────────────────────────────────────
reg(nid("Neji Hyuga"), [
  {
    hook: "onAccuracyCalc",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.accuracy) {
        ctx.accuracy.value = Math.min(100, ctx.accuracy.value + 5);
      }
    },
  },
  {
    hook: "onDefCalc",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.defIgnore) {
        ctx.defIgnore.value *= 0.9; // ignore 10% DEF
      }
    },
  },
]);

// ───────────────────────────────────────────
// 22. Hinata – Protective Byakugan
// ───────────────────────────────────────────
reg(nid("Hinata Hyuga"), [
  {
    hook: "onReceiveDamage",
    handler(ctx) {
      // When an ally on Hinata's team is hit by single-target, grant EVASION +10
      if (
        ctx.target &&
        ctx.target.teamId === ctx.fighter.teamId &&
        ctx.target.ninjaId !== ctx.fighter.ninjaId &&
        !ctx.isAOE &&
        !ctx.fighter.abilityState.protectedThisRound
      ) {
        // Already applied before damage, so this is more of a per-round buff
        ctx.fighter.abilityState.protectedThisRound = true;
      }
    },
  },
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.protectedThisRound = false;
    },
  },
]);

// ───────────────────────────────────────────
// 23. Suigetsu – Liquid Body
// ───────────────────────────────────────────
reg(nid("Suigetsu Hozuki"), [
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.damage) {
        ctx.damage.value = Math.floor(ctx.damage.value * 0.8);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 24. Choji – Calorie Control
// ───────────────────────────────────────────
reg(nid("Choji Akimichi"), [
  {
    hook: "onHpThreshold",
    handler(ctx) {
      if (!ctx.fighter.abilityState.triggered && ctx.fighter.hp > 0 && ctx.fighter.hp <= ctx.fighter.maxHp * 0.4) {
        ctx.fighter.abilityState.triggered = true;
        const heal = Math.floor(ctx.fighter.maxHp * 0.2);
        ctx.fighter.hp = Math.min(ctx.fighter.maxHp, ctx.fighter.hp + heal);
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("ATK_UP", "atk", 15, 3, ctx.fighter.ninjaId));
        addStatus(ctx.fighter, ctx.ninja, makeStatMod("DEF_UP", "def", 15, 3, ctx.fighter.ninjaId));
        ctx.log.push(`${ctx.fighter.displayName}'s Calorie Control activated! Healed ${heal} HP, ATK+15, DEF+15!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 25. Hiruzen – Professor
// ───────────────────────────────────────────
reg(nid("Hiruzen Sarutobi"), [
  {
    hook: "onChkCost",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.chkCost) {
        ctx.chkCost.value = Math.floor(ctx.chkCost.value * 0.85);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 26. Mei – Acidic Aftertaste
// ───────────────────────────────────────────
reg(nid("Mei Terumi"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.acidAppliedThisTurn = false;
    },
  },
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (!ctx.fighter.abilityState.acidAppliedThisTurn && ctx.target && ctx.damage && ctx.damage.value > 0) {
        ctx.fighter.abilityState.acidAppliedThisTurn = true;
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatus("SELF_DMG_EOR", "Acid", 2, { flatDmg: 6, sourceId: ctx.fighter.ninjaId }), { refreshOnly: true });
        ctx.log.push(`${ctx.target.displayName} is corroded by Mei's acid! (6 dmg/turn for 2T)`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 27. Sasori – Living Puppet
// ───────────────────────────────────────────
reg(nid("Sasori"), [
  {
    hook: "onBattleStart",
    handler(ctx) {
      addStatus(ctx.fighter, ctx.ninja, makeStatus("GENJUTSU_IMMUNE", "Poison Immune")); // reuse for poison immunity
      // We'll handle poison immunity in the status application logic
    },
  },
  {
    hook: "onLethalDamage",
    handler(ctx) {
      if (!ctx.fighter.abilityState.triggered) {
        ctx.fighter.abilityState.triggered = true;
        ctx.fighter.hp = Math.floor(ctx.fighter.maxHp * 0.25);
        ctx.fighter.alive = true;
        ctx.log.push(`${ctx.fighter.displayName}'s Living Puppet activated! Set to 25% HP.`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 28. Utakata – Bubble Counter
// ───────────────────────────────────────────
reg(nid("Utakata"), [
  {
    hook: "onReceiveDamage",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.attacker && ctx.attacker.teamId !== ctx.fighter.teamId) {
        const aN = findNinja(ctx.ninjas, ctx.attacker.ninjaId);
        if (!hasStatus(ctx.attacker, "POISON")) {
          addStatus(ctx.attacker, aN, makeStatus("POISON", "POISON", undefined, { flatDmg: 6 }));
          ctx.log.push(`${ctx.attacker.displayName} was poisoned by Utakata's bubbles!`);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 29. Jugo – Unstable Surge
// ───────────────────────────────────────────
reg(nid("Jugo"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.surgedThisRound = false;
    },
  },
  {
    hook: "onReceiveDamage",
    handler(ctx) {
      if (!ctx.fighter.abilityState.surgedThisRound && ctx.damage && ctx.damage.value > 0) {
        ctx.fighter.abilityState.surgedThisRound = true;
        ctx.fighter.chk = Math.min(ctx.fighter.maxChk, ctx.fighter.chk + 8);
        addStatus(ctx.fighter, ctx.ninja, {
          id: "FOCUS+15",
          statusId: "FOCUS",
          turns: 2,
          value: 15,
          stat: "acc",
        });
        ctx.fighter.hp = Math.max(0, ctx.fighter.hp - 4);
        ctx.log.push(`${ctx.fighter.displayName}'s Unstable Surge! +8 CHK, Focus +15, -4 HP.`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 30. Onoki – Earth Style Specialist
// ───────────────────────────────────────────
reg(nid("Onoki"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.damage) {
        const bonus = Math.floor(ctx.damage.value * 0.15);
        ctx.damage.value += bonus;
      }
    },
  },
]);

// ───────────────────────────────────────────
// 31. Asuma – Wind Blades
// ───────────────────────────────────────────
reg(nid("Asuma Sarutobi"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.target && Math.random() < 0.25) {
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatus("MARKED", "MARKED", 2), { refreshOnly: true });
        ctx.log.push(`${ctx.target.displayName} was marked by Asuma's Wind Blades!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 32. Konan – Paper Affinity
// ───────────────────────────────────────────
reg(nid("Konan"), [
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.damage) {
        const isFire = /[Ff]ire|[Ff]lame/i.test(ctx.move.name);
        if (isFire) {
          ctx.damage.value = Math.floor(ctx.damage.value * 1.2);
        } else {
          ctx.damage.value = Math.floor(ctx.damage.value * 0.8);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 33. Sai – Ink Tactics
// ───────────────────────────────────────────
reg(nid("Sai"), [
  {
    hook: "onApplyStatus",
    handler(ctx) {
      // When Sai applies MARKED, also apply EVA -5 for 2T
      if (ctx.target && ctx.target.teamId !== ctx.fighter.teamId) {
        const hasMarked = ctx.target.statuses.some((s) => s.statusId === "MARKED" && s.sourceId === ctx.fighter.ninjaId);
        if (hasMarked) {
          const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
          addStatus(ctx.target, tNinja, {
            id: "EVA-5",
            statusId: "EVASION",
            turns: 2,
            value: -5,
            sourceId: ctx.fighter.ninjaId,
          });
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 34. Shizune – Poison Specialist
// ───────────────────────────────────────────
reg(nid("Shizune"), [
  {
    hook: "onApplyStatus",
    handler(ctx) {
      // Shizune's poison deals 10 instead of 6
      if (ctx.target) {
        const poisonStatus = ctx.target.statuses.find(
          (s) => s.statusId === "POISON" && s.sourceId === ctx.fighter.ninjaId,
        );
        if (poisonStatus) {
          poisonStatus.flatDmg = 10;
          poisonStatus.id = "POISON(10)";
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 35. Shino – Kikaichu Drain
// ───────────────────────────────────────────
reg(nid("Shino Aburame"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.target && ctx.damage && ctx.damage.value > 0) {
        const drain = Math.min(4, ctx.target.chk);
        ctx.target.chk -= drain;
        ctx.fighter.chk = Math.min(ctx.fighter.maxChk, ctx.fighter.chk + drain);
        if (drain > 0) ctx.log.push(`${ctx.fighter.displayName}'s bugs drained ${drain} CHK!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 36. Temari – Wind Pressure
// ───────────────────────────────────────────
reg(nid("Temari"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.target && Math.random() < 0.3) {
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatMod("BLIND", "acc", 10, 2, ctx.fighter.ninjaId), { refreshOnly: true });
        ctx.log.push(`${ctx.target.displayName} was blinded by Temari's wind!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 37. Karin – Sensory Specialist
// ───────────────────────────────────────────
reg(nid("Karin Uzumaki"), [
  {
    hook: "onAccuracyCalc",
    handler(ctx) {
      // Immune to BLIND / -ACC: override accuracy back
      if (ctx.accuracy) {
        // Remove any BLIND penalty from the accuracy
        // We do this by setting accuracy to at least the move's base acc
        if (ctx.move) ctx.accuracy.value = Math.max(ctx.accuracy.value, ctx.move.acc);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 38. Shikamaru – Shadow Tactician
// ───────────────────────────────────────────
reg(nid("Shikamaru Nara"), [
  {
    hook: "onSupportMove",
    handler(ctx) {
      // If any Shadow Link active, apply to 1 additional enemy (max 3 total)
      if (ctx.fighter.abilityState.shadowLinks.length > 0 && ctx.fighter.abilityState.shadowLinks.length < 3) {
        const enemies = ctx.state.fighters.filter(
          (f) => f.alive && f.teamId !== ctx.fighter.teamId && !ctx.fighter.abilityState.shadowLinks.includes(f.ninjaId),
        );
        if (enemies.length > 0) {
          const target = enemies[0];
          const tNinja = findNinja(ctx.ninjas, target.ninjaId);
          addStatus(target, tNinja, makeStatus("SHADOW_LINK", "Shadow Link", 1));
          ctx.fighter.abilityState.shadowLinks.push(target.ninjaId);
          ctx.log.push(`${target.displayName} was caught by an extra Shadow Link!`);
        }
      }
    },
  },
  {
    hook: "onReceiveDamage",
    handler(ctx) {
      // If Shikamaru takes damage, all links end
      if (ctx.fighter.abilityState.shadowLinks.length > 0 && ctx.damage && ctx.damage.value > 0) {
        for (const linkedId of ctx.fighter.abilityState.shadowLinks) {
          const linked = ctx.state.fighters.find((f) => f.ninjaId === linkedId);
          if (linked) {
            const lNinja = findNinja(ctx.ninjas, linked.ninjaId);
            removeStatus(linked, lNinja, "SHADOW_LINK");
          }
        }
        ctx.fighter.abilityState.shadowLinks = [];
        ctx.log.push(`${ctx.fighter.displayName}'s Shadow Links were broken!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 39. Ino – Mind Link
// ───────────────────────────────────────────
reg(nid("Ino Yamanaka"), [
  {
    hook: "onTurnStart",
    handler(ctx) {
      ctx.fighter.abilityState.genjutsuMarkedThisRound = false;
    },
  },
  {
    hook: "onGenjutsuHit",
    handler(ctx) {
      if (!ctx.fighter.abilityState.genjutsuMarkedThisRound && ctx.target) {
        ctx.fighter.abilityState.genjutsuMarkedThisRound = true;
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatus("MARKED", "MARKED", 2, { sourceId: ctx.fighter.ninjaId }));
        ctx.log.push(`${ctx.target.displayName} was marked by Ino's Mind Link!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 40. Kankuro – Puppet Frame
// ───────────────────────────────────────────
reg(nid("Kankuro"), [
  {
    hook: "onBeforeHitReceived",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.damage) {
        ctx.damage.value = Math.floor(ctx.damage.value * 0.8);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 41. Zetsu – Dual Body
// ───────────────────────────────────────────
reg(nid("Zetsu"), [
  {
    hook: "onBattleStart",
    handler(ctx) {
      // Split into two bodies: create a second fighter with half HP each
      const secondId = ctx.fighter.ninjaId + "-b";
      const halfHp = Math.floor(ctx.fighter.maxHp / 2);
      ctx.fighter.hp = halfHp;
      ctx.fighter.maxHp = halfHp;
      ctx.fighter.displayName = "White Zetsu";

      const second: Fighter = {
        ninjaId: secondId,
        displayName: "Black Zetsu",
        teamId: ctx.fighter.teamId,
        hp: halfHp,
        maxHp: halfHp,
        chk: ctx.fighter.chk,
        maxChk: ctx.fighter.maxChk,
        alive: true,
        statuses: [],
        clones: [],
        summons: [],
        abilityState: { ...ctx.fighter.abilityState, triggered: false, extraLives: 0 },
        moveUses: {},
        transformed: false,
        turnFlags: { actedThisTurn: false, canAct: true, guardActive: false },
      };

      ctx.state.fighters.push(second);
      ctx.fighter.abilityState.splitBodies = [ctx.fighter.ninjaId, secondId];
      // Add to team members
      const team = ctx.state.teams.find((t) => t.id === ctx.fighter.teamId);
      if (team) team.members.push(secondId);
      ctx.log.push(`Zetsu split into White Zetsu and Black Zetsu!`);
    },
  },
]);

// ───────────────────────────────────────────
// 42. Kurenai – Genjutsu Specialist
// ───────────────────────────────────────────
reg(nid("Kurenai Yuhi"), [
  {
    hook: "onChkCost",
    handler(ctx) {
      if (ctx.move?.cat === "G" && ctx.chkCost) {
        ctx.chkCost.value = Math.floor(ctx.chkCost.value * 0.8);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 43. Baki – Ambush Footwork
// ───────────────────────────────────────────
reg(nid("Baki"), [
  {
    hook: "onBeforeHit",
    handler(ctx) {
      if (ctx.target && ctx.damage) {
        const mySpd = findNinja(ctx.ninjas, ctx.fighter.ninjaId).spd;
        const targetSpd = findNinja(ctx.ninjas, ctx.target.ninjaId).spd;
        if (mySpd > targetSpd) {
          ctx.damage.value = Math.floor(ctx.damage.value * 1.2);
        }
      }
    },
  },
]);

// ───────────────────────────────────────────
// 44. Kiba – Akamaru Senses
// ───────────────────────────────────────────
reg(nid("Kiba Inuzuka"), [
  {
    hook: "onAccuracyCalc",
    handler(ctx) {
      // Immune to BLIND / -ACC
      if (ctx.move && ctx.accuracy) {
        ctx.accuracy.value = Math.max(ctx.accuracy.value, ctx.move.acc);
      }
    },
  },
  {
    hook: "onCritCalc",
    handler(ctx) {
      if (ctx.critChance) {
        ctx.critChance.value *= 2;
      }
    },
  },
]);

// ───────────────────────────────────────────
// 45. Deidara – Living Explosives
// ───────────────────────────────────────────
reg(nid("Deidara"), [
  {
    hook: "onDealDamage",
    handler(ctx) {
      if (ctx.move?.cat === "N" && ctx.target && Math.random() < 0.3) {
        const tNinja = findNinja(ctx.ninjas, ctx.target.ninjaId);
        addStatus(ctx.target, tNinja, makeStatus("BURN", "BURN -3%", 3, {
          pctDmg: 3,
          sourceId: ctx.fighter.ninjaId,
        }), { refreshOnly: true });
        ctx.log.push(`${ctx.target.displayName} caught fire from Deidara's explosives!`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 46. Lady Chiyo – Puppet Matriarch
// ───────────────────────────────────────────
reg(nid("Lady Chiyo"), [
  {
    hook: "onLethalDamage",
    handler(_ctx) {
      // This fires for ANY fighter. Check if Lady Chiyo is alive and on same team.
      // NOTE: The battle engine handles this by iterating team allies.
      // This passive is special – it triggers for allies, not for self.
      // We handle it differently in the battle engine's handleLethal.
    },
  },
]);

// ───────────────────────────────────────────
// 47. Hidan – Immortal Body
// ───────────────────────────────────────────
reg(nid("Hidan"), [
  {
    hook: "onLethalDamage",
    handler(ctx) {
      if (!ctx.fighter.abilityState.triggered) {
        ctx.fighter.abilityState.triggered = true;
        ctx.fighter.hp = 1;
        ctx.fighter.alive = true;
        ctx.fighter.abilityState.ritualActive = false;
        ctx.fighter.abilityState.sharedPainTarget = undefined;
        removeStatus(ctx.fighter, ctx.ninja, "RITUAL_CIRCLE");
        removeStatus(ctx.fighter, ctx.ninja, "SHARED_PAIN");
        addStatus(ctx.fighter, ctx.ninja, makeStatus("SEVERED", "SEVERED", 2, {
          data: { dmgTakenMult: 1.2, dmgDealtMult: 0.85 },
        }));
        ctx.log.push(`${ctx.fighter.displayName}'s Immortal Body activated! Set to 1 HP. Severed for 2 turns.`);
      }
    },
  },
]);

// ───────────────────────────────────────────
// 48. Tenten – Twin Scroll Mastery
// ───────────────────────────────────────────
reg(nid("Tenten"), [
  {
    hook: "onAccuracyCalc",
    handler(ctx) {
      if (ctx.move?.cat === "T" && ctx.accuracy) {
        ctx.accuracy.value = 100; // never miss
      }
    },
  },
  {
    hook: "onCritCalc",
    handler(ctx) {
      if (ctx.critChance) {
        ctx.critChance.value *= 3;
      }
    },
  },
]);

// ─────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────

/**
 * Fire a passive hook for a specific fighter.
 * Returns true if at least one handler ran.
 */
export function firePassive(hook: PassiveHook, ctx: PassiveCtx): boolean {
  const entries = REGISTRY.get(ctx.fighter.ninjaId);
  if (!entries) return false;
  let ran = false;
  for (const e of entries) {
    if (e.hook === hook) {
      e.handler(ctx);
      ran = true;
    }
  }
  return ran;
}

/**
 * Fire a passive hook for ALL alive fighters on a team.
 */
export function firePassiveForTeam(
  hook: PassiveHook,
  state: BattleState,
  teamId: string,
  ninjas: Ninja[],
  log: string[],
  extra?: Partial<PassiveCtx>,
): void {
  for (const f of state.fighters) {
    if (!f.alive || f.teamId !== teamId) continue;
    const ninja = findNinja(ninjas, f.ninjaId);
    firePassive(hook, { state, fighter: f, ninja, ninjas, log, ...extra });
  }
}

/**
 * Fire a passive hook for ALL alive fighters.
 */
export function firePassiveForAll(
  hook: PassiveHook,
  state: BattleState,
  ninjas: Ninja[],
  log: string[],
  extra?: Partial<PassiveCtx>,
): void {
  for (const f of state.fighters) {
    if (!f.alive) continue;
    const ninja = findNinja(ninjas, f.ninjaId);
    firePassive(hook, { state, fighter: f, ninja, ninjas, log, ...extra });
  }
}

/** Check if a ninja has registered passives */
export function hasPassives(ninjaId: string): boolean {
  return REGISTRY.has(ninjaId);
}
