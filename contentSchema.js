import { BOOLEAN_UNIT_FLAGS, NUMERIC_UNIT_STATS, normalizeCombatant, normalizeLevelSettings, slugifyId } from "./gameModel.js";

const KNOWN_MODES = ["battle", "modeUp", "worldMap", "summit", "emanations"];

function normalizeBooleanRecord(source = {}) {
  return KNOWN_MODES.reduce((modes, modeName) => {
    modes[modeName] = Boolean(source[modeName]);
    return modes;
  }, {});
}

function normalizeHeroDefinition(hero, index) {
  const normalized = normalizeCombatant(
    {
      ...hero,
      id: hero?.id ?? slugifyId(hero?.name, `hero-${index + 1}`)
    },
    { fallbackId: `hero-${index + 1}`, team: "hero" }
  );

  if (!normalized.name) normalized.name = `Hero ${index + 1}`;
  if (!normalized.symbol) normalized.symbol = "?";
  return normalized;
}

function normalizeEnemyDefinition(enemy, index, levelNumber) {
  const normalized = normalizeCombatant(
    {
      ...enemy,
      id: enemy?.id ?? slugifyId(enemy?.name, `level-${levelNumber}-enemy-${index + 1}`)
    },
    { fallbackId: `level-${levelNumber}-enemy-${index + 1}`, team: "enemy" }
  );

  if (!normalized.name) normalized.name = `Enemy ${index + 1}`;
  if (!normalized.symbol) normalized.symbol = "!";
  return normalized;
}

export function normalizeManifest(manifest = {}) {
  const packs = Array.isArray(manifest.packs) && manifest.packs.length > 0
    ? manifest.packs.filter(pack => typeof pack === "string" && pack.trim().length > 0)
    : ["core"];

  return {
    version: typeof manifest.version === "string" ? manifest.version : "1.0.0",
    packs,
    modes: normalizeBooleanRecord(manifest.modes ?? {
      battle: true,
      modeUp: true,
      worldMap: false,
      summit: false,
      emanations: false
    }),
    coreLevels: Number.isFinite(manifest.coreLevels) ? manifest.coreLevels : 3
  };
}

export function normalizeHeroCollection(heroes = []) {
  return Array.isArray(heroes) ? heroes.map((hero, index) => normalizeHeroDefinition(hero, index)) : [];
}

export function normalizeLevelCollection(levels = []) {
  if (!Array.isArray(levels)) return [];
  return levels.map((level, index) => {
    const levelNumber = Number.isFinite(level?.level) ? level.level : index + 1;
    const normalizedLevel = normalizeLevelSettings({
      ...level,
      level: levelNumber,
      enemies: Array.isArray(level?.enemies)
        ? level.enemies.map((enemy, enemyIndex) => normalizeEnemyDefinition(enemy, enemyIndex, levelNumber))
        : []
    });
    normalizedLevel.level = levelNumber;
    return normalizedLevel;
  });
}

export function validateHeroCollection(heroes = []) {
  const warnings = [];
  heroes.forEach((hero, index) => {
    if (!hero.name) warnings.push(`Hero ${index + 1} is missing a name.`);
    if (!hero.symbol) warnings.push(`Hero ${hero.name ?? index + 1} is missing a symbol.`);
    NUMERIC_UNIT_STATS.forEach(stat => {
      if (hero[stat] !== undefined && !Number.isFinite(hero[stat])) {
        warnings.push(`Hero ${hero.name ?? index + 1} has a non-numeric ${stat}.`);
      }
    });
    BOOLEAN_UNIT_FLAGS.forEach(flag => {
      if (hero[flag] !== undefined && typeof hero[flag] !== "boolean") {
        warnings.push(`Hero ${hero.name ?? index + 1} has a non-boolean ${flag}.`);
      }
    });
  });
  return warnings;
}

export function validateLevelCollection(levels = []) {
  const warnings = [];
  levels.forEach(level => {
    if (!Number.isFinite(level.level)) warnings.push("A level is missing a numeric level value.");
    if (!Number.isFinite(level.rows) || !Number.isFinite(level.cols)) {
      warnings.push(`Level ${level.level ?? "unknown"} is missing grid dimensions.`);
    }
  });
  return warnings;
}
