/**
 * defenera.js
 *
 * This file contains the logic for adjusting game features and selecting playable heroes.
 * It provides functions to adjust game features such as difficulty, sound settings, and graphics.
 * It also includes a function to select playable heroes from the available list.
 */

// Create a heroList array with a deactivated property for each hero
export const heroList = [
  {
    name: "Knight",
    symbol: "♞",
    deactivated: false,
  },
  {
    name: "Archer",
    symbol: "⚔",
    deactivated: false,
  },
  {
    name: "Wizard",
    symbol: "✡",
    deactivated: true,
  },
  {
    name: "Berserker",
    symbol: "⚒",
    deactivated: false,
  },
  {
    name: "Rogue",
    symbol: "☠",
    deactivated: true,
  },
  {
    name: "Cleric",
    symbol: "✝",
    deactivated: false,
  },
  {
    name: "Jester",
    symbol: "♣",
    deactivated: false,
  },
  {
    name: "Meatwalker",
    symbol: "₻",
    deactivated: true,
  },
  {
    name: "Soothscribe",
    symbol: "☄",
    deactivated: false,
  },
  {
    name: "Nonsequiteur",
    symbol: "∄",
    deactivated: false,
  },
  {
    name: "Griot",
    symbol: "℣",
    deactivated: true,
  },
  {
    name: "Torcher",
    symbol: "⚶",
    deactivated: false,
  },
  {
    name: "Slüjier",
    symbol: "🜜",
    deactivated: false,
  },
  {
    name: "Shrink",
    symbol: "☊",
    deactivated: false,
  },
  {
    name: "Sycophant",
    symbol: "♟",
    deactivated: true,
  },
  {
    name: "Yeetrian",
    symbol: "⛓",
    deactivated: false,
  },
  {
    name: "Mellitron",
    symbol: "丰",
    deactivated: false,
  },
  {
    name: "Gastronomer",
    symbol: "𑍐",
    deactivated: false,
  },
  {
    name: "Palisade",
    symbol: "ᱟ",
    deactivated: false,
  },
  {
    name: "Mycelian",
    symbol: "ৡ",
    deactivated: false,
  },
  {
    name: "Pæg",
    symbol: "ꚤ",
    deactivated: false,
  },
  {
    name: "Kemetic",
    symbol: "𓋇",
    deactivated: false,
  },
  {
    name: "Greenjay",
    symbol: "࿈",
    deactivated: false,
  },
  {
    name: "Sysiphuge",
    symbol: "₾",
    deactivated: false,
  },
  {
    name: "Bombador",
    symbol: "❦",
    deactivated: false,
  }
];

// Function to adjust game features such as difficulty, sound settings, and graphics
export function adjustGameFeatures(settings) {
  // Adjust difficulty
  if (settings.difficulty) {
    // Apply difficulty settings
    console.log(`Setting difficulty to ${settings.difficulty}`);
  }

  // Adjust sound settings
  if (settings.sound) {
    // Apply sound settings
    console.log(`Setting sound to ${settings.sound}`);
  }

  // Adjust graphics settings
  if (settings.graphics) {
    // Apply graphics settings
    console.log(`Setting graphics to ${settings.graphics}`);
  }
}

// Function to select playable heroes from the available list
export function selectPlayableHeroes(heroList) {
  // Display hero selection UI
  console.log("Displaying hero selection UI");

  // Allow user to select heroes
  const selectedHeroes = heroList.filter(hero => hero.selected && !hero.deactivated);

  // Return the selected heroes
  return selectedHeroes;
}

// Function to integrate with the existing game logic to apply the selected features and heroes
export function applySelectedFeaturesAndHeroes(settings, heroList) {
  // Adjust game features
  adjustGameFeatures(settings);

  // Select playable heroes
  const selectedHeroes = selectPlayableHeroes(heroList);

  // Apply selected heroes to the game
  console.log("Applying selected heroes to the game:", selectedHeroes);
}

// Function to handle keyboard events for navigation and selection
export function handleKeyboardEvents(event) {
  switch (event.key) {
    case "ArrowLeft":
      // Handle left arrow key
      console.log("Left arrow key pressed");
      break;
    case "ArrowRight":
      // Handle right arrow key
      console.log("Right arrow key pressed");
      break;
    case "ArrowUp":
      // Handle up arrow key
      console.log("Up arrow key pressed");
      break;
    case "ArrowDown":
      // Handle down arrow key
      console.log("Down arrow key pressed");
      break;
    case "Space":
      // Handle space bar
      console.log("Space bar pressed");
      break;
    default:
      break;
  }
}

// Function to display hero symbols in a row/column layout, wrapping if overflow
export function displayHeroSymbols(heroList) {
  const container = document.getElementById("hero-list");
  container.innerHTML = "";

  heroList.forEach(hero => {
    const heroElement = document.createElement("div");
    heroElement.className = "hero-symbol";
    heroElement.textContent = hero.symbol;

    if (hero.deactivated) {
      heroElement.style.color = "grey";
    }

    container.appendChild(heroElement);
  });
}

// Function to return to the hero selection screen
export function returnToHeroSelectionScreen() {
  // Reset the current view and display the hero selection UI
  console.log("Returning to hero selection screen");
  displayHeroSymbols(heroList);
}
