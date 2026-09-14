export const CORE_RANDOM_STATS = Object.freeze(["attack", "range", "agility", "hp"]);

export const NUMERIC_UNIT_STATS = Object.freeze([
  "attack",
  "range",
  "agility",
  "hp",
  "heal",
  "burn",
  "sluj",
  "ghis",
  "trick",
  "yeet",
  "swarm",
  "spicy",
  "armor",
  "spore",
  "chain",
  "caprice",
  "fate",
  "rage",
  "bulk",
  "psych",
  "ankh",
  "rise",
  "dodge",
  "bomba"
]);

export const BOOLEAN_UNIT_FLAGS = Object.freeze([
  "joke",
  "meat",
  "tarot",
  "nonseq",
  "reactsToHistory",
  "torcher",
  "shrink",
  "recipe"
]);

export const ABILITY_HOOKS = Object.freeze({
  ON_BATTLE_START: "onBattleStart",
  ON_MOVE: "onMove",
  ON_ATTACK_TARGET_ALLY: "onAttackTargetAlly",
  ON_ATTACK_TARGET_ENEMY: "onAttackTargetEnemy",
  ON_TAKE_DAMAGE: "onTakeDamage",
  ON_KILL: "onKill",
  ON_TURN_END: "onTurnEnd",
  ON_DEATH: "onDeath",
  ON_REVIVE: "onRevive"
});

export const BATTLE_PHASES = Object.freeze({
  BATTLE_START: "battle_start",
  PLAYER_TURN_START: "player_turn_start",
  PLAYER_MOVE: "player_move",
  PLAYER_ATTACK_SELECT: "player_attack_select",
  PLAYER_ATTACK_RESOLVE: "player_attack_resolve",
  PLAYER_TURN_END: "player_turn_end",
  ENEMY_PHASE: "enemy_phase",
  ROUND_END: "round_end",
  VICTORY: "victory",
  DEFEAT: "defeat"
});

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function slugifyId(value, fallback = "unit") {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function createSeededRng(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 0x12345678;
  return {
    seed: state,
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(max) {
      if (!Number.isFinite(max) || max <= 0) return 0;
      return Math.floor(this.next() * max);
    },
    pick(items) {
      if (!Array.isArray(items) || items.length === 0) return undefined;
      return items[this.int(items.length)];
    },
    chance(probability) {
      if (!Number.isFinite(probability) || probability <= 0) return false;
      if (probability >= 1) return true;
      return this.next() < probability;
    }
  };
}

export function normalizeCombatant(unit, { fallbackId = "unit", team = "neutral" } = {}) {
  const source = unit ?? {};
  const normalized = { ...source };
  normalized.id = slugifyId(normalized.id ?? normalized.name, fallbackId);
  normalized.team = normalized.team ?? team;
  normalized.statusEffects = normalized.statusEffects && typeof normalized.statusEffects === "object"
    ? { ...normalized.statusEffects }
    : {};
  normalized.persistentDeath = normalized.persistentDeath ?? null;
  NUMERIC_UNIT_STATS.forEach(stat => {
    normalized[stat] = toFiniteNumber(normalized[stat], 0);
  });
  BOOLEAN_UNIT_FLAGS.forEach(flag => {
    normalized[flag] = Boolean(normalized[flag]);
  });
  if (normalized.x !== undefined) normalized.x = toFiniteNumber(normalized.x, 0);
  if (normalized.y !== undefined) normalized.y = toFiniteNumber(normalized.y, 0);
  return normalized;
}

export function normalizeLevelSettings(levelSettings = {}) {
  const layout = Array.isArray(levelSettings.layout) ? levelSettings.layout : null;
  return {
    ...levelSettings,
    rows: toFiniteNumber(levelSettings.rows, 0),
    cols: toFiniteNumber(levelSettings.cols, 0),
    wallHP: toFiniteNumber(levelSettings.wallHP, 0),
    title: typeof levelSettings.title === "string" ? levelSettings.title : "Untitled Level",
    layout
  };
}
