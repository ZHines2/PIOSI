/**
 * heroes.js
 * 
 * This file contains the hero configurations for the game.
 * Each hero is defined as an object with properties like attack, range, agility, and hp.
 * Some heroes have additional properties for unique behavior.
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
    hp: 12,
  },
  {
    name: "Wizard",
    symbol: "✡",
    attack: 2,
    range: 7,
    agility: 2,
    hp: 10,
    chain: 5 // The chain stat gives bonus attack damage to any adjacent enemy.
  },
  {
    name: "Berserker",
    symbol: "⚒",
    attack: 6,
    range: 1,
    agility: 3,
    hp: 20,
    rage: 1 // New rage stat: whenever attacked by an enemy, a random stat is increased by this value.
  },
  {
    name: "Rogue",
    symbol: "☠",
    attack: 4,
    range: 2,
    agility: 6,
    hp: 12,
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
    joke: true, // Provides humorous interactions.
    trick: 1   // Placeholder "trick" stat for potential future behaviors.
  },
  {  
    name: "Meatwalker",
    symbol: "₻",
    attack: 7,
    range: 1,
    agility: 2,
    hp: 22,
    heal: 1, // Slight healing property.
    meat: true, // Indicates meat-related interactions.
    bulk: 1 // New bulk stat for Meatwalker.
  },
  {
    name: "Soothscribe",
    symbol: "☄",
    attack: 2,
    range: 6,
    agility: 3,
    hp: 11,
    tarot: true, // Can fetch tarot cards for special actions.
    fate: 1
  },
  {
    name: "Nonsequiteur",
    symbol: "∄",
    attack: 3,
    range: 3,
    agility: 3,
    hp: 10,
    nonseq: true, // Delivers random, non-sequitur interactions.
    caprice: 1 // New stat for random stat increment.
  },
  {
    name: "Griot",
    symbol: "℣",
    attack: 1,
    range: 1,
    agility: 1,
    hp: 10,
    reactsToHistory: true // Reacts uniquely when encountering historical events.
  },
  {
    name: "Torcher",
    symbol: "⚶",
    attack: 4,
    range: 2,
    agility: 3,
    hp: 14,
    torcher: true, // Has a burning property.
    burn: 1      // Burn damage value.
  },
  {
    name: "Slüjier",
    symbol: "🜜",
    attack: 5,
    range: 1,
    agility: 4,
    hp: 16,
    sluj: 1 // Special ability indicator for sluj actions.
  },
  // Updated Shrink hero configuration with symbol ☊
  {
    name: "Shrink",
    symbol: "☊",
    attack: 2,
    range: 1,
    agility: 3,
    hp: 12,
    shrink: true, // Indicates shrink-related behavior.
    psych: 1 // New psych stat for Shrink.
  },
  {
    name: "Sycophant",
    symbol: "♟",
    attack: 0,
    range: 0,
    agility: 2,
    hp: 15
  },
  // New hero "Yeetrian" with knockback stat "yeet".
  {
    name: "Yeetrian",
    symbol: "⛓",
    attack: 3,
    range: 2,
    agility: 4,
    hp: 14,
    yeet: 1
  },
  // New hero "Mellitron" with customized stats and a swarm ability.
  {
    name: "Mellitron",
    symbol: "丰",
    attack: 1,
    range: 3,
    agility: 5,
    hp: 18,
    swarm: 2 // Swarm stat: indicates additional abilities when swarming.
  },
  // New hero "Gastronomer" with a spicy stat.
  {
    name: "Gastronomer",
    symbol: "𑍐",
    attack: 2,
    range: 1,
    agility: 3,
    hp: 15,
    spicy: 1, // Spicy stat: increases the amount the vittle heals for.
    recipe: true // Indicates recipe-related interactions.
  },
  // New hero "Palisade" with armor stat.
  {
    name: "Palisade",
    symbol: "ᱟ",
    attack: 3,
    range: 1,
    agility: 2,
    hp: 20,
    armor: 5, // Armor stat: absorbs damage before HP is affected.
    description: "Palisade stands as a bulwark against all attacks, his armor absorbing the brunt of enemy blows."
  },
  // New hero "Mycelian" with spore stat.
  {
    name: "Mycelian",
    symbol: "ৡ",
    attack: 2,
    range: 1,
    agility: 3,
    hp: 15,
    spore: 1 // Spore stat: indicates the ability to gain random stats from mushrooms.
  },
  // Updated hero "Pæg" with improved stats and added chain stat.
  {
    name: "Pæg",
    symbol: "ꚤ",
    attack: 1,
    range: 1,
    agility: 1,  
    hp: 1,  
    heal: 1,
    burn: 1,
    sluj: 1,
    ghis: 1,
    yeet: 1,
    swarm: 1,
    spicy: 1,
    armor: 1,
    spore: 1,
    chain: 1    // Added chain stat to Pæg.
  },
  // New hero "Kemetic"
  {
    name: "Kemetic",
    symbol: "𓋇",
    attack: 5,
    range: 5,
    agility: 5,
    hp: 25,
    // The new ankh stat will cause boosts on hero deaths.
    ankh: 5
  },
  // New hero "Greenjay"
  {
    name: "Greenjay",
    symbol: "࿈",
    attack: 5,
    range: 2,
    agility: 4,
    hp: 30,
    rise: 5 // new rise stat
  },
    // New hero "Sysiphuge"
  {
    name: "Sysiphuge",
    symbol: "₾",
    attack: 4,
    range: 1,
    agility: 4,
    hp: 16,
    dodge: 4
  }
];
