/**
 * modeup.js
 * 
 * This file contains the logic for powering up heroes ("mode up")
 * when a level is completed. It exports two functions:
 *  - getModeUpBuff: Computes the buff values based on the selected hero and level.
 *  - applyModeUp: Applies the computed buff values to the entire party and logs a message.
 *
 * Updates:
 * - The Wizard now gains an increase to his "chain" stat.
 * - The Sycophant's mode up now gives him +1 in every stat.
 * - The Berserker now increases his "rage" stat with mode up.
 * - The Jester now increases his "trick" stat with mode up.
 */

export function getModeUpBuff(chosenHero, level) {
  const buffIncrement = level;
  if (chosenHero.name === "Knight") {
    // Knight gets increased attack and HP.
    return { attack: 1 * buffIncrement, hp: 2 * buffIncrement };
  } else if (chosenHero.name === "Archer") {
    // Archer gets increased range.
    return { range: 1 * buffIncrement };
  } else if (chosenHero.name === "Berserker") {
    // Berserker gets a significant boost to attack power and rage.
    return { attack: 3 * buffIncrement, rage: 1 * buffIncrement };
  } else if (chosenHero.name === "Rogue") {
    // Rogue receives additional agility.
    return { agility: 2 * buffIncrement };
  } else if (chosenHero.name === "Torcher") {
    // Torcher's burn damage increases.
    return { burn: 1 * buffIncrement };
  } else if (chosenHero.name === "Slüjier") {
    // Slüjier's "sluj" increases.
    return { sluj: 1 * buffIncrement };
  } else if (chosenHero.name === "Cleric") {
    // Cleric's healing power increases.
    return { heal: 2 * buffIncrement };
  } else if (chosenHero.name === "Jester") {
    // Jester's trick stat increases.
    return { trick: 1 * buffIncrement };
  } else if (chosenHero.name === "Sycophant") {
    // Sycophant now gains +1 in every stat.
    return {
      attack: 1 * buffIncrement,
      hp: 1 * buffIncrement,
      range: 1 * buffIncrement,
      agility: 1 * buffIncrement,
      burn: 1 * buffIncrement,
      sluj: 1 * buffIncrement,
      heal: 1 * buffIncrement,
      ghis: 1 * buffIncrement,
      yeet: 1 * buffIncrement,
      swarm: 1 * buffIncrement,
      spicy: 1 * buffIncrement,
      armor: 1 * buffIncrement,
      spore: 1 * buffIncrement,
      chain: 1 * buffIncrement,
      caprice: 1 * buffIncrement,
      fate: 1 * buffIncrement,
      rage: 1 * buffIncrement // Added rage stat to Sycophant's buffs
    };
  } else if (chosenHero.name === "Yeetrian") {
    // Yeetrian's knockback increases.
    return { yeet: 1 * buffIncrement };
  } else if (chosenHero.name === "Mellitron") {
    // Mellitron's swarm ability increases.
    return { swarm: 1 * buffIncrement };
  } else if (chosenHero.name === "Gastronomer") {
    // Gastronomer's spicy stat increases.
    return { spicy: 1 * buffIncrement };
  } else if (chosenHero.name === "Palisade") {
    // Palisade's armor increases.
    return { armor: 1 * buffIncrement };
  } else if (chosenHero.name === "Mycelian") {
    // Mycelian's spore increases.
    return { spore: 1 * buffIncrement };
  } else if (chosenHero.name === "Wizard") {
    // The Wizard's chain stat increases.
    return { chain: 1 * buffIncrement };
  } else if (chosenHero.name === "Nonsequiteur") {
    // Nonsequiteur's caprice stat increases.
    return { caprice: 1 * buffIncrement };
  } else if (chosenHero.name === "Soothscribe") {
    // Soothscribe's fate stat increases.
    return { fate: 1 * buffIncrement };
  } else if (chosenHero.name === "Meatwalker") {
    // Meatwalker's bulk stat increases.
    return { bulk: 1 * buffIncrement };
  } else {
    // Fallback for heroes with no specific buff defined.
    return { ghis: 1 * buffIncrement };
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
  if (buff.trick) messageParts.push(`+${buff.trick} Trick`);
  if (buff.ghis) messageParts.push(`+${buff.ghis} Ghïs`);
  if (buff.yeet) messageParts.push(`+${buff.yeet} Yeet`);
  if (buff.swarm) messageParts.push(`+${buff.swarm} Swarm`);
  if (buff.spicy) messageParts.push(`+${buff.spicy} Spicy`);
  if (buff.armor) messageParts.push(`+${buff.armor} Armor`);
  if (buff.spore) messageParts.push(`+${buff.spore} Spore`);
  if (buff.chain) messageParts.push(`+${buff.chain} Chain`);
  if (buff.caprice) messageParts.push(`+${buff.caprice} Caprice`);
  if (buff.fate) messageParts.push(`+${buff.fate} Fate`);
  if (buff.rage) messageParts.push(`+${buff.rage} Rage`);
  if (buff.bulk) messageParts.push(`+${buff.bulk} Bulk`);

  const message =
    messageParts.length > 0
      ? `${chosenHero.name} empowers the party with ${messageParts.join(", ")}!`
      : `${chosenHero.name} tries to mode up but nothing happens...`;

  // Apply the buffs to each hero in the party.
  party.forEach((hero) => {
    for (let stat in buff) {
      if (stat === "hp") {
        if (hero.hp > 0) {
          hero.hp += buff[stat];
        }
      } else {
        if (!hero.hasOwnProperty(stat)) {
          hero[stat] = 0;
        }
        hero[stat] += buff[stat];
      }
    }
  });

  logCallback(message);
}
