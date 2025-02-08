/**
 * heroes.js
 * 
 * This file contains the hero configurations for the game. The hero stats have been rebalanced
 * for better gameplay. Each hero is an object with attributes (attack, range, agility, hp, etc.)
 * that can be adjusted as needed. Below are the updated, balanced stats along with comments on each role.
 *
 * How to add a new hero:
 * - Copy an existing hero object entry.
 * - Update the properties such as name, symbol, and stats.
 * - Optionally add new properties like "joke", "meat", or any custom ability.
 *
 * Extra Unicode characters for hero symbols (feel free to use one of these):
 *   ★  (U+2605) - A star symbol
 *   ✪  (U+272A) - Circled star
 *   ☯  (U+262F) - Yin Yang
 *   ⚔  (U+2694) - Crossed Swords
 *   ♜  (U+265C) - Black Rook
 *   ♞  (U+265E) - Black Knight
 *   🜜  (U+1D71C) - Alchemical symbol (used for Slüjier)
 *
 * As you add or modify heroes, adjust these stats here to ensure balance.
 */

export const heroes = [
  {
    name: "Knight",
    symbol: "♞",
    // Role: Frontline tank/melee fighter.
    attack: 4,
    range: 1,
    agility: 4,
    hp: 18,
    // Consider alternative symbol: ♜
  },
  {
    name: "Archer",
    symbol: "⚔",
    // Role: Ranged damage dealer with balanced mobility.
    attack: 3,
    range: 5,
    agility: 4,
    hp: 12
  },
  {
    name: "Wizard",
    symbol: "✡",
    // Role: Long-range spellcaster with lower damage but high range.
    attack: 2,
    range: 7,
    agility: 2,
    hp: 10
  },
  {
    name: "Berserker",
    symbol: "⚒",
    // Role: High damage melee fighter sacrificing some agility.
    attack: 6,
    range: 1,
    agility: 3,
    hp: 20
  },
  {
    name: "Rogue",
    symbol: "☠",
    // Role: Versatile melee/stalker with extra agility for positioning.
    attack: 4,
    range: 2,
    agility: 6,
    hp: 12,
    // Optionally consider using a dagger symbol like 🗡 (U+1F5E1)
  },
  {
    name: "Jester",
    symbol: "♣",
    // Role: Support with humorous effects triggering additional fun during battle.
    attack: 3,
    range: 2,
    agility: 5,
    hp: 10,
    joke: true  // Triggers joke-fetching routines.
  },
  {
    name: "Meatwalker",
    symbol: "₻",
    // Role: Heavy hitter with robust HP. Emphasizes endurance over speed.
    attack: 7,
    range: 1,
    agility: 2,
    hp: 22,
    meat: true  // Uses bacon ipsum messages.
    // Alternatively, try 🍖 (U+1F356) for a different icon.
  },
  {
    name: "Soothscribe",
    symbol: "☄",
    // Role: Medium-range support character with mystical abilities.
    attack: 2,
    range: 6,
    agility: 3,
    hp: 11,
    tarot: true  // Interacts with tarot routines.
  },
  {
    name: "Nonsequiteur",
    symbol: "∄",
    // Role: Supports randomness, triggering non-sequitur events.
    attack: 3,
    range: 3,
    agility: 3,
    hp: 10,
    nonseq: true  // Triggers non-sequitur fact fetching.
  },
  {
    name: "Griot",
    symbol: "℣",
    // Role: Narrative support. Provides historical commentary.
    attack: 1,
    range: 1,
    agility: 1,
    hp: 10,
    reactsToHistory: true  // Reacts to historical events.
  },
  {
    name: "Torcher",
    symbol: "⚶",
    // Role: Elemental attacker with bonus burn effects.
    attack: 4,
    range: 2,
    agility: 3,
    hp: 14,
    torcher: true,
    burn: 1  // Starts with a burn ability.
  },
  {
    name: "Slüjier",
    symbol: "🜜",
    // Role: Melee specialist with a unique slüj effect.
    attack: 5,
    range: 1,
    agility: 4,
    hp: 16,
    sluj: 1  // Initially set with a slüj effect.
    // Super tip: Explore alternative icons or composite emojis for creative flair.
  }
];

/**
 * Additional helper functions or constants related to heroes can be added here.
 * For example:
 *
 * export function getHeroByName(name) {
 *   return heroes.find(hero => hero.name === name);
 * }
 *
 * These utilities can help when integrating new hero designs or modifying existing ones.
 */