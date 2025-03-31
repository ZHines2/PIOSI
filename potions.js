// Define an array of 15 potion colors.
export const colors = [
  'red', 'blue', 'green', 'yellow', 'purple',
  'orange', 'pink', 'cyan', 'magenta', 'lime',
  'teal', 'brown', 'black', 'white', 'silver'
];

// Define an array of safe potion effects.
// Each effect has an id, a descriptive name, and an effect function that applies the effect.
export const effects = [
  { id: 1, name: 'hp boost (no max)', effect: (hero) => { hero.hp += 50; } },
  { id: 2, name: 'hp loss (could kill)', effect: (hero) => { hero.hp -= 50; } },
  { id: 3, name: 'agility boost', effect: (hero) => { hero.agility += 10; } },
  { id: 4, name: 'agility loss', effect: (hero) => { hero.agility -= 10; } },
  { id: 5, name: 'range boost', effect: (hero) => { hero.range += 1; } },
  { id: 6, name: 'range loss', effect: (hero) => { hero.range -= 1; } },
  { id: 7, name: 'return to origin scene', effect: (hero) => {
      // Safely return the hero to the origin scene.
      hero.sceneCoord = { row: 0, col: 0, z: 0 };
    }
  },
  { id: 10, name: 'attack boost', effect: (hero) => { hero.attack += 5; } },
  { id: 11, name: 'attack loss', effect: (hero) => { hero.attack -= 5; } }
];

// Create a mapping from color to effect that will remain constant for this playthrough.
let colorEffectMapping = new Map();

// Initializes the potion color-to-effect mapping.
// This should be called once at the beginning of a playthrough.
export function initializePotionMapping() {
  // Create a shallow copy and shuffle the effects array.
  const shuffledEffects = effects.slice().sort(() => Math.random() - 0.5);

  // Map each color to an effect from the shuffled list.
  colors.forEach((color, index) => {
    // Use modulo in case there are more colors than effects.
    const effect = shuffledEffects[index % shuffledEffects.length];
    colorEffectMapping.set(color, effect);
  });
  console.log("Potion mapping initialized.");
}

// Generates a random potion.
// The potion's color is randomly selected from the color pool,
// and its effect is determined by the persistent mapping.
// Returns an object representing the potion with its color and effect details.
export function getRandomPotion() {
  // Randomly choose a color.
  const color = colors[Math.floor(Math.random() * colors.length)];

  // Retrieve its assigned effect.
  const effect = colorEffectMapping.get(color);

  if (!effect) {
    throw new Error("Potion mapping not initialized. Call initializePotionMapping() first.");
  }

  return {
    color: color,
    effectId: effect.id,
    effectName: effect.name,
    // Include the effect function so it can be applied when the potion is used.
    effectFn: effect.effect
  };
}

// Applies the potion's effect to a hero.
// This function applies the effect function, computes the detailed stat changes,
// and returns a message showing the original stat and final stat for each change.
// potion: The potion object as returned by getRandomPotion.
// hero: The hero object to which the potion effect applies.
export function applyPotionEffect(potion, hero) {
  // Capture the hero's stats before applying the effect.
  const oldStats = {
    hp: hero.hp,
    attack: hero.attack,
    agility: hero.agility,
    range: hero.range,
    score: hero.score || 0
  };

  // Apply the potion's effect function.
  potion.effectFn(hero);

  // Capture the hero's stats after the effect.
  const newStats = {
    hp: hero.hp,
    attack: hero.attack,
    agility: hero.agility,
    range: hero.range,
    score: hero.score || 0
  };

  // Compute the differences and generate a detailed message.
  let messages = [];
  for (const stat in oldStats) {
    if (oldStats[stat] !== newStats[stat]) {
      messages.push(`${stat}: ${oldStats[stat]} -> ${newStats[stat]}`);
    }
  }
  const detailMessage = messages.length > 0 ? messages.join(", ") : "No stat change";
  const fullMessage = `Applied potion effect: ${potion.effectName} to ${hero.name}. ${detailMessage}`;
  console.log(fullMessage);
  return fullMessage;
}
