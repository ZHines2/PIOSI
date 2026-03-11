/**
 * contentLoader.js
 *
 * Loads the content manifest and then loads hero/level JSON data packs.
 * Falls back to statically-imported data if JSON loading fails (e.g., when
 * running from the file system without a server).
 *
 * Usage:
 *   import { loadContent } from './contentLoader.js';
 *   const { manifest, heroes, getLevel } = await loadContent();
 *
 * Adding a new hero:
 *   Add an entry to content/heroes.<packname>.json and ensure the pack is
 *   listed in content/manifest.json under "packs".
 *
 * Adding a new level:
 *   Add an entry to content/levels.<packname>.json. Level numbers must be
 *   unique across all loaded packs.
 *
 * Enabling/disabling modes:
 *   Edit the "modes" object in content/manifest.json. Setting a mode to
 *   false hides its entry points in the UI without removing engine code.
 */

import { heroes as staticHeroes } from "./heroes.js";
import { getLevel as getStaticLevel } from "./levels.js";

/** Default manifest used when content/manifest.json cannot be fetched. */
const DEFAULT_MANIFEST = {
  version: "1.0.0",
  packs: ["core"],
  modes: {
    battle: true,
    modeUp: true,
    worldMap: false,
    summit: false,
    emanations: false
  },
  coreLevels: 3
};

/**
 * Resolves enemy positions from a level definition.
 * Enemies with `enemyXOffset` are placed relative to the right edge of the
 * grid (matching the behaviour of the original levels.js getLevel function).
 *
 * @param {Object} level - The raw level definition.
 * @returns {Array} Resolved enemy array.
 */
function resolveEnemies(level) {
  return (level.enemies || []).map(enemy => {
    if (enemy.enemyXOffset !== undefined) {
      return {
        ...enemy,
        x: level.cols - enemy.enemyXOffset,
        y: enemy.y !== undefined ? enemy.y : Math.floor(level.rows / 2)
      };
    }
    return enemy;
  });
}

/**
 * Creates a `getLevel(levelNumber)` function from a levels array.
 * Falls back to the static getLevel from levels.js for any level not found
 * in the provided array (e.g. the level 99 cheat level).
 *
 * @param {Array} levels - Array of level definition objects.
 * @returns {Function} A getLevel function compatible with the BattleEngine API.
 */
function makeLevelGetter(levels) {
  return function getLevel(levelNumber) {
    const level = levels.find(l => l.level === levelNumber);
    if (level) {
      return {
        rows: level.rows,
        cols: level.cols,
        wallHP: level.wallHP,
        title: level.title,
        enemies: resolveEnemies(level),
        layout: level.layout || null
      };
    }
    // Fall back to statically-defined levels (includes level 99 cheat level).
    return getStaticLevel(levelNumber);
  };
}

/**
 * Loads a JSON file via fetch. Returns null if the fetch fails or the
 * response is not OK, so callers can fall back to static data gracefully.
 *
 * @param {string} url - URL to fetch.
 * @returns {Promise<Object|null>}
 */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Loads the content manifest and all enabled content packs.
 *
 * @returns {Promise<{manifest: Object, heroes: Array, getLevel: Function}>}
 */
export async function loadContent() {
  // 1. Load manifest
  const manifestData = await fetchJSON("./content/manifest.json");
  const manifest = manifestData || DEFAULT_MANIFEST;

  // 2. Load heroes from each enabled pack, merging into one array
  const heroArrays = await Promise.all(
    manifest.packs.map(pack => fetchJSON(`./content/heroes.${pack}.json`))
  );
  const allLoadedHeroes = heroArrays
    .filter(Boolean)
    .flatMap(data => data.heroes || []);
  const heroes = allLoadedHeroes.length > 0 ? allLoadedHeroes : staticHeroes;

  // 3. Load levels from each enabled pack, merging into one array
  const levelArrays = await Promise.all(
    manifest.packs.map(pack => fetchJSON(`./content/levels.${pack}.json`))
  );
  const allLoadedLevels = levelArrays
    .filter(Boolean)
    .flatMap(data => data.levels || []);

  // makeLevelGetter falls back to static levels.js for anything not in JSON
  const getLevel = makeLevelGetter(allLoadedLevels);

  return { manifest, heroes, getLevel };
}
