/**
 * heroes.js
 * 
 * This file contains the hero configurations for the game.
 * Each hero is defined as an object with properties like attack, range, agility, and hp.
 * The Cleric hero has an additional "heal" stat that enables friendly healing when interacting.
 */

export const heroes = [
  {
    name: "Knight",
    symbol: "♞",
    attack: 4,
    range: 1,
    agility: 4,
    hp: 18,
  },
  {
    name: "Archer",
    symbol: "⚔",
    attack: 3,
    range: 5,
    agility: 4,
    hp: 12
  },
  {
    name: "Wizard",
    symbol: "✡",
    attack: 2,
    range: 7,
    agility: 2,
    hp: 10
  },
  {
    name: "Berserker",
    symbol: "⚒",
    attack: 6,
    range: 1,
    agility: 3,
    hp: 20
  },
  {
    name: "Rogue",
    symbol: "☠",
    attack: 4,
    range: 2,
    agility: 6,
    hp: 12
  },
  {
    name: "Cleric",
    symbol: "✝",
    attack: 2,
    range: 1,
    agility: 3,
    hp: 12,
    heal: 4 // Healing power: used when interacting with a friendly hero.
  },
  {
    name: "Jester",
    symbol: "♣",
    attack: 3,
    range: 2,
    agility: 5,
    hp: 10,
    joke: true
  },
  {
    name: "Meatwalker",
    symbol: "₻",
    attack: 7,
    range: 1,
    agility: 2,
    hp: 22,
    meat: true
  },
  {
    name: "Soothscribe",
    symbol: "☄",
    attack: 2,
    range: 6,
    agility: 3,
    hp: 11,
    tarot: true
  },
  {
    name: "Nonsequiteur",
    symbol: "∄",
    attack: 3,
    range: 3,
    agility: 3,
    hp: 10,
    nonseq: true
  },
  {
    name: "Griot",
    symbol: "℣",
    attack: 1,
    range: 1,
    agility: 1,
    hp: 10,
    reactsToHistory: true
  },
  {
    name: "Torcher",
    symbol: "⚶",
    attack: 4,
    range: 2,
    agility: 3,
    hp: 14,
    torcher: true,
    burn: 1
  },
  {
    name: "Slüjier",
    symbol: "🜜",
    attack: 5,
    range: 1,
    agility: 4,
    hp: 16,
    sluj: 1
  },
  // Updated Shrink hero configuration with symbol ☊
  {
    name: "Shrink",
    symbol: "☊",
    attack: 2,
    range: 1,
    agility: 3,
    hp: 12,
    shrink: true
  }
];
