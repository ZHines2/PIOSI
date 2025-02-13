/**
 * modeup.js
 * 
 * This file contains the logic for powering up heroes ("mode up") 
 * when a level is completed. It exports two functions:
 *  - getModeUpBuff: Computes the buff values based on the selected hero and level.
 *  - applyModeUp: Applies the computed buff values to the entire party and logs a message.
 *
 * Updated to define explicit modeup logic for all heroes, including Yeetrian and Mellitron.
 */

export function getModeUpBuff(chosenHero, level) {
  const buffIncrement = level;
  // Define specific buffs for each hero
  if (chosenHero.name === "Knight") {
    // Knight gets increased attack and HP.
    return { attack: 1 * buffIncrement, hp: 2 * buffIncrement };
  } else if (chosenHero.name === "Archer") {
    // Archer gets increased range to simulate extended reach.
    return { range: 1 * buffIncrement };
  } else if (chosenHero.name === "Berserker") {
    // Berserker gets a significant boost to attack power.
    return { attack: 3 * buffIncrement };
  } else if (chosenHero.name === "Rogue") {
    // Rogue receives additional agility to enhance mobility.
    return { agility: 2 * buffIncrement };
  } else if (chosenHero.name === "Torcher") {
    // Torcher's burn damage increases with level.
    return { burn: 1 * buffIncrement };
  } else if (chosenHero.name === "Slüjier") {
    // Slüjier's unique stat "sluj" increases.
    return { sluj: 1 * buffIncrement };
  } else if (chosenHero.name === "Cleric") {
    // Cleric's healing power increases.
    return { heal: 2 * buffIncrement };
  } else if (chosenHero.name === "Sycophant") {
    // Sycophant gets increases in all stats including a special "ghis" stat.
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
  } else if (chosenHero.name === "Yeetrian") {
    // Yeetrian's knockback ability increases.
    return { yeet: 1 * buffIncrement };
  } else if (chosenHero.name === "Mellitron") {
    // Mellitron's unique swarm ability increases.
    return { swarm: 1 * buffIncrement };
  } else if (chosenHero.heal !== undefined) {
    // Generic heroes with a heal property get a minor heal increase.
    return { heal: 1 * buffIncrement };
  } else {
    // Fallback for heroes with no specific buffs defined.
    return { ghis: 1 * buffIncrement };
  }
}

export function applyModeUp(chosenHero, level, party, logCallback) {
  const buff = getModeUpBuff(chosenHero, level);
  const messageParts = [];
  
  // Construct a descriptive message based on the buffs applied.
  if (buff.hp) messageParts.push(`+${buff.hp} HP`);
  if (buff.attack) messageParts.push(`+${buff.attack} Attack`);
  if (buff.range) messageParts.push(`+${buff.range} Range`);
  if (buff.agility) messageParts.push(`+${buff.agility} Agility`);
  if (buff.burn) messageParts.push(`+${buff.burn} Burn`);
  if (buff.sluj) messageParts.push(`+${buff.sluj} Slüj`);
  if (buff.heal) messageParts.push(`+${buff.heal} Heal`);
  if (buff.ghis) messageParts.push(`+${buff.ghis} Ghïs`);
  if (buff.yeet) messageParts.push(`+${buff.yeet} Yeet`);
  if (buff.swarm) messageParts.push(`+${buff.swarm} Swarm`);
  
  // Create a log message indicating the hero's power-up and the buffs applied.
  const message = messageParts.length > 0
    ? `${chosenHero.name} empowers the party with ${messageParts.join(", ")}!`
    : `${chosenHero.name} tries to mode up but nothing happens...`;

  // Apply the buffs to each hero in the party.
  party.forEach(hero => {
    for (let stat in buff) {
      if (stat === "hp") {
        // Increase HP only if the hero is alive.
        if (hero.hp > 0) {
          hero.hp += buff[stat];
        }
      } else {
        // For other stats, initialize the stat if not present, then increment it.
        if (!Object.prototype.hasOwnProperty.call(hero, stat)) {
          hero[stat] = 0;
        }
        hero[stat] += buff[stat];
      }
    }
  });
  
  // Log the buff application message via the provided callback.
  logCallback(message);
}
