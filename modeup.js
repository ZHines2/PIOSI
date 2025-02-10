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
    // For Sycophant, all stats increase by 1 times the buff increment.
    return {
      attack: 1 * buffIncrement,
      hp: 1 * buffIncrement,
      range: 1 * buffIncrement,
      agility: 1 * buffIncrement,
      burn: 1 * buffIncrement,
      sluj: 1 * buffIncrement,
      heal: 1 * buffIncrement,
    };
  } else if (chosenHero.heal !== undefined) {
    return { heal: 1 * buffIncrement };
  } else {
    return { ghis: 1 };
  }
}

export function applyModeUp(chosenHero, level, party, logCallback) {
  const buff = getModeUpBuff(chosenHero, level);
  const messageParts = [];
  if (buff.hp) messageParts.push(`+${buff.hp} HP`);
  if (buff.attack) messageParts.push(`+${buff.attack} Attack`);
  if (buff.range) messageParts.push(`+${buff.range} Range`);
  if (buff.agility) messageParts.push(`+${buff.agility} Agility`);
  if (buff.burn) messageParts.push(`+${buff.burn} Burn`);
  if (buff.sluj) messageParts.push(`+${buff.sluj} Slüj`);
  if (buff.heal) messageParts.push(`+${buff.heal} Heal`);
  if (buff.ghis) messageParts.push(`+${buff.ghis} Ghïs`);
  
  const message = messageParts.length > 0
    ? `${chosenHero.name} empowers the party with ${messageParts.join(", ")}!`
    : `${chosenHero.name} tries to mode up but nothing happens...`;

  party.forEach(hero => {
    for (let stat in buff) {
      if (stat === "hp") {
        if (hero.hp > 0) {
          hero.hp += buff[stat];
        }
      } else {
        if (!Object.prototype.hasOwnProperty.call(hero, stat)) {
          hero[stat] = 0;
        }
        hero[stat] += buff[stat];
      }
    }
  });
  
  logCallback(message);
}
