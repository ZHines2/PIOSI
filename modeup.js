/**
 * modeup.js
 * 
 * This file contains the logic for powering up heroes (mode up) 
 * when a level is completed. It exports functions that calculate 
 * the buffs based on the selected hero and applies those buffs 
 * to the entire party.
 */

export function getModeUpBuff(chosenHero, level) {
  const buffIncrement = level;
  // Check for specific hero names before generic checks.
  if (chosenHero.name === "Knight") {
    return { attack: 1 * buffIncrement, hp: 2 * buffIncrement };
  } else if (chosenHero.name === "Archer") {
    return { range: 1 * buffIncrement };
  } else if (chosenHero.name === "Berserker") {
    return { attack: 3 * buffIncrement };
  } else if (chosenHero.name === "Rogue") {
    return { agility: 2 * buffIncrement };
  } else if (chosenHero.name === "Torcher") {
    return { burn: 1 * buffIncrement };
  } else if (chosenHero.name === "Slüjier") {
    return { sluj: 1 * buffIncrement };
  } else if (chosenHero.name === "Cleric") {
    return { heal: 2 * buffIncrement };
  } else if (chosenHero.name === "Sycophant") {
    // For Sycophant, every stat increases by 1 * buffIncrement.
    return {
      attack: 1 * buffIncrement,
      hp: 1 * buffIncrement,
      range: 1 * buffIncrement,
      agility: 1 * buffIncrement,
      burn: 1 * buffIncrement,
      sluj: 1 * buffIncrement,
      heal: 1 * buffIncrement,
      ghis: 1 * buffIncrement,
    };
  } else if (chosenHero.yeet !== undefined) {
    // New branch for heroes with a knockback (yeet) stat.
    return { yeet: 1 * buffIncrement };
  } else if (chosenHero.heal !== undefined) {
    // Generic case for heroes that have a heal property.
    return { heal: 1 * buffIncrement };
  } else {
    // Fallback case for heroes with no specific buffs.
    return { ghis: 1 * buffIncrement };
  }
}

export function applyModeUp(chosenHero, level, party, logCallback) {
  const buff = getModeUpBuff(chosenHero, level);
  const messageParts = [];
  
  // Build message parts based on the buff values
  if (buff.hp) messageParts.push(`+${buff.hp} HP`);
  if (buff.attack) messageParts.push(`+${buff.attack} Attack`);
  if (buff.range) messageParts.push(`+${buff.range} Range`);
  if (buff.agility) messageParts.push(`+${buff.agility} Agility`);
  if (buff.burn) messageParts.push(`+${buff.burn} Burn`);
  if (buff.sluj) messageParts.push(`+${buff.sluj} Slüj`);
  if (buff.heal) messageParts.push(`+${buff.heal} Heal`);
  if (buff.ghis) messageParts.push(`+${buff.ghis} Ghïs`);
  if (buff.yeet) messageParts.push(`+${buff.yeet} Yeet`);
  
  const message = messageParts.length > 0
    ? `${chosenHero.name} empowers the party with ${messageParts.join(", ")}!`
    : `${chosenHero.name} tries to mode up but nothing happens...`;

  party.forEach(hero => {
    for (let stat in buff) {
      if (stat === "hp") {
        // Only add HP buff if hero is alive
        if (hero.hp > 0) {
          hero.hp += buff[stat];
        }
      } else {
        // Initialize stat if it doesn't exist, then add buff value
        if (!Object.prototype.hasOwnProperty.call(hero, stat)) {
          hero[stat] = 0;
        }
        hero[stat] += buff[stat];
      }
    }
  });
  
  logCallback(message);
}
