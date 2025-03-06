/**
 * modeup.js
 * 
 * This file contains the logic for powering up heroes ("mode up")
 * when a level is completed. It exports two functions:
 *  - getModeUpBuff: Computes the buff values based on the chosen hero and level.
 *  - applyModeUp: Applies the computed buff values to the entire party and logs a message.
 *
 * Updates:
 * - The Wizard now gains an increase to his "chain" stat.
 * - The Sycophant's mode up now gives him +1 in every stat.
 *  - The Berserker now increases his "rage" stat with mode up.
 *  - The Jester now increases his "trick" stat with mode up.
 *  - Added the new "ankh" stat for heroes. Heroes that have a nonzero "ankh" stat
 *    (for instance, Kemetic) may get their "ankh" stat increased during mode up.
 *  - Now including the "rise" stat for heroes like Greenjay.
 *  - After mode up, if a hero had been marked as dead but now has a nonzero "rise" stat
 *    (or gains a rise buff), the hero's death marker is removed, allowing the hero to come back.
 */

/**
 * Computes the mode up buff values for the chosen hero based on the level.
 * The function uses the hero's name to determine which stats get boosted.
 *
 * @param {Object} chosenHero - the hero that has been chosen for mode up.
 * @param {number} level - the level of mode up (used as increment multiplier).
 * @returns {Object} An object representing the buff amounts for each stat.
 */
export function getModeUpBuff(chosenHero, level) {
  const buffIncrement = level;
  // Use a switch for cleaner structure.
  switch (chosenHero.name) {
    case "Knight":
      // Knight gets increased attack and HP.
      return { attack: 1 * buffIncrement, hp: 2 * buffIncrement };
    case "Archer":
      // Archer gets increased range.
      return { range: 1 * buffIncrement };
    case "Berserker":
      // Berserker gets a boost to attack and increases his rage stat.
      return { attack: 3 * buffIncrement, rage: 1 * buffIncrement };
    case "Rogue":
      // Rogue receives additional agility.
      return { agility: 2 * buffIncrement };
    case "Torcher":
      // Torcher's burn damage increases.
      return { burn: 1 * buffIncrement };
    case "Slüjier":
      // Slüjier's "sluj" increases.
      return { sluj: 1 * buffIncrement };
    case "Cleric":
      // Cleric's healing power increases.
      return { heal: 2 * buffIncrement };
    case "Jester":
      // Jester's trick stat increases.
      return { trick: 1 * buffIncrement };
    case "Sycophant":
      // Sycophant gains +1 in every stat.
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
        rage: 1 * buffIncrement,
      };
    case "Yeetrian":
      // Yeetrian's knockback increases.
      return { yeet: 1 * buffIncrement };
    case "Mellitron":
      // Mellitron's swarm increases.
      return { swarm: 1 * buffIncrement };
    case "Gastronomer":
      // Gastronomer's spicy stat increases.
      return { spicy: 1 * buffIncrement };
    case "Palisade":
      // Palisade's armor increases.
      return { armor: 1 * buffIncrement };
    case "Mycelian":
      // Mycelian's spore increases.
      return { spore: 1 * buffIncrement };
    case "Wizard":
      // The Wizard's chain stat increases.
      return { chain: 1 * buffIncrement };
    case "Nonsequiteur":
      // Nonsequiteur's caprice increases.
      return { caprice: 1 * buffIncrement };
    case "Soothscribe":
      // Soothscribe's fate increases.
      return { fate: 1 * buffIncrement };
    case "Meatwalker":
      // Meatwalker's bulk increases.
      return { bulk: 1 * buffIncrement };
    case "Shrink":
      // Shrink's psych stat increases.
      return { psych: 1 * buffIncrement };
    case "Kemetic":
      // Kemetic gets a boost in his ankh stat.
      return { ankh: 1 * buffIncrement };
    case "Greenjay":
      // Greenjay gains an increase to his rise stat.
      return { rise: 1 * buffIncrement };
    case "Sysiphuge":
      // Sysiphuge's dodge increases.
      return { dodge: 1 * buffIncrement };
    default:
      // Fallback for heroes with no defined buff – boost a generic stat.
      return { ghis: 1 * buffIncrement };
  }
}

/**
 * Applies the mode up buffs to every hero in the party and logs a message.
 *
 * @param {Object} chosenHero - the hero chosen for mode up (determines the buff scheme).
 * @param {number} level - the mode up level (increment multiplier).
 * @param {Array} party - the array of heroes in the party.
 * @param {function} logCallback - function used to log messages.
 */
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
  if (buff.psych) messageParts.push(`+${buff.psych} Psych`);
  if (buff.ankh) messageParts.push(`+${buff.ankh} Ankh`);
  if (buff.rise) messageParts.push(`+${buff.rise} Rise`);
  if (buff.dodge) messageParts.push(`+${buff.dodge} Dodge`);

  const message = messageParts.length > 0
    ? `${chosenHero.name} empowers the party with ${messageParts.join(", ")}!`
    : `${chosenHero.name} tries to mode up but nothing happens...`;

  // Apply the buffs to each hero in the party.
  party.forEach((hero) => {
    for (let stat in buff) {
      // For hp, only buff if the hero is still alive.
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
    // If a hero was previously marked as dead (persistentDeath exists) but now has a nonzero rise,
    // remove the death marker so that they can come back.
    if (hero.persistentDeath && hero.rise > 0) {
      hero.persistentDeath = null;
      // Optionally, clear any death status effects.
      if (hero.statusEffects) {
        delete hero.statusEffects.death;
      }
      logCallback(`${hero.name} has been revived by Rise!`);
    }
  });

  logCallback(message);
}
