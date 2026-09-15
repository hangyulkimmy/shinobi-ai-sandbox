// ─── Move & Ninja (data layer – matches defaults.ts) ───

export type MoveCat = "T" | "N" | "S" | "G";
/** Alias kept for compatibility */
export type MoveCategory = MoveCat;

export type Move = {
  id: string;
  name: string;
  cat: MoveCat;
  power: number | null;
  acc: number;
  chk: number;
  desc: string;
};

export type Ninja = {
  id: string;
  name: string;
  category: string;
  hp: number;
  chk: number;
  atk: number;
  ctr: number;
  def: number;
  spd: number;
  abilityText: string;
  moves: Move[];
};

export type Team = {
  id: string;
  name: string;
  members: string[];
};

// ─── Status system ───

export type StatusId =
  | "STUN"
  | "POISON"
  | "BURN"
  | "BLIND"
  | "DISORIENT"
  | "SPD_DOWN"
  | "DEF_DOWN"
  | "ATK_UP"
  | "DEF_UP"
  | "CTR_UP"
  | "SPD_UP"
  | "ATK_DOWN"
  | "CTR_DOWN"
  | "EVASION"
  | "FOCUS"
  | "STUN_IMMUNE"
  | "GENJUTSU_IMMUNE"
  | "REGEN"
  | "VULNERABLE"
  | "MARKED"
  | "SHADOW_LINK"
  | "BLEEDING"
  | "TRANSFORM"
  | "SEVERED"
  | "RITUAL_CIRCLE"
  | "SHARED_PAIN"
  | "N_LOCKED"
  | "GUARD"
  | "DODGE_NEXT"
  | "TRAP_ILLUSION"
  | "SELF_DMG_EOR"
  | "KAMUI_REMOVE"
  | "CURSE"
  | "ACC_DOWN"
  | "SUMMON";

export type Status = {
  /** Human-readable label shown on StatusChips */
  id: string;
  /** Machine key used by the engine */
  statusId: StatusId;
  /** undefined = permanent; number = decremented each EOR */
  turns?: number;
  /** Percentage value for stat mods (e.g. 15 means ×1.15 or ×0.85) */
  value?: number;
  /** Which stat is affected */
  stat?: string;
  /** Who applied this status */
  sourceId?: string;
  /** Stack grouping key */
  stackKey?: string;
  /** Max stacks for this stackKey */
  maxStacks?: number;
  /** Flat damage per tick for POISON / BLEEDING */
  flatDmg?: number;
  /** % of maxHp per tick for BURN */
  pctDmg?: number;
  /** HP healed per tick for REGEN */
  healAmount?: number;
  /** Linked target for SHARED_PAIN */
  linkedTargetId?: string;
  /** Generic bag */
  data?: Record<string, unknown>;
};

// ─── Clone / Summon ───

export type Clone = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  absorbHits?: number;
};

export type Summon = {
  id: string;
  name: string;
  turnsLeft: number;
  maxAbsorb?: number;
  absorbed: number;
  dmgReduction?: number;
  buffs?: { stat: string; value: number }[];
};

// ─── Fighter ───

export type AbilityState = {
  triggered: boolean;
  extraLives: number;
  storedMove?: Move;
  storedMoveUsed?: boolean;
  kamuiCooldown: number;
  hitReducedThisTurn: boolean;
  acidAppliedThisTurn: boolean;
  toadActive: boolean;
  shadowLinks: string[];
  sharedPainTarget?: string;
  ritualActive: boolean;
  vengeanceStacks: number;
  scrollArsenalCharges: number;
  splitBodies: string[];
  protectedThisRound: boolean;
  surgedThisRound: boolean;
  genjutsuMarkedThisRound: boolean;
  serpentEscapeUsed: boolean;
  chiyoSaveUsed: boolean;
  [key: string]: unknown;
};

export type TurnFlags = {
  actedThisTurn: boolean;
  canAct: boolean;
  guardActive: boolean;
};

export type Fighter = {
  ninjaId: string;
  displayName: string;
  teamId: string;
  hp: number;
  maxHp: number;
  chk: number;
  maxChk: number;
  alive: boolean;
  statuses: Status[];
  clones: Clone[];
  summons: Summon[];
  abilityState: AbilityState;
  moveUses: Record<string, number>;
  /** Last 3 move IDs used (most recent last). Used for AI diversity scoring. */
  recentMoves: string[];
  transformed: boolean;
  turnFlags: TurnFlags;
};

// ─── Battle state ───

export type DeadEntry = {
  ninjaId: string;
  teamId: string;
  diedOnTurn: number;
};

export type BattleState = {
  turn: number;
  teams: Team[];
  fighters: Fighter[];
  log: string[];
  winnerTeamId?: string;
  deadQueue: DeadEntry[];
};

// ─── Parsed move effect (output of moveParser) ───

export type AppliedStatusDef = {
  statusId: StatusId;
  chance: number;
  turns?: number;
  value?: number;
  stat?: string;
  target: "enemy" | "self" | "ally" | "team" | "allEnemies";
  flatDmg?: number;
  pctDmg?: number;
  healAmount?: number;
};

export type SelfEffectDef = {
  type: "stun" | "damage" | "hpCost" | "die";
  turns?: number;
  amount?: number;
};

export type ParsedMoveEffect = {
  isAOE: boolean;
  isHeal: boolean;
  healAmount: number;
  healTarget: "self" | "ally" | "anybody" | "team";
  healToFull: boolean;
  isPriority: boolean;
  isSelfDestruct: boolean;
  selfDestructDamage: number;
  isExecute: boolean;
  executeThreshold: number;
  executeFallbackDmg: number;
  isRevive: boolean;
  isTransform: boolean;
  isClone: boolean;
  cloneHp: number;
  isSelfBuff: boolean;
  isTeamBuff: boolean;
  isSummon: boolean;
  summonDuration: number;
  summonDmgReduction: number;
  summonMaxAbsorb: number;
  summonBuffs: { stat: string; value: number }[];
  appliedStatuses: AppliedStatusDef[];
  selfEffects: SelfEffectDef[];
  conditionalBonusPct: number;
  conditionalOn: string;
  requiresTransformed: boolean;
  requiresClone: boolean;
  requiresRitualCircle: boolean;
  requiresCondition: string;
  hitCount: number;
  cleansesPoison: boolean;
  cleansesBurn: boolean;
  chakraDrain: number;
  chakraGain: number;
  chakraTransfer: number;
  trueDamage: number;
  selfDamage: number;
  maxUses: number;
  swapHpPct: boolean;
  isGuard: boolean;
  isDodgeGrant: boolean;
  isChakraTransfer: boolean;
  statChanges: { stat: string; value: number; turns?: number; permanent?: boolean }[];
};
