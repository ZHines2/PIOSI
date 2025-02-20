/**
 * levels.js
 *
 * Tutorial:
 * This module defines game level configurations in a scalable and maintainable way.
 *
 * For detailed guidelines on creating new levels, refer to the Level Creation Rubric in docs/level-creation.md.
 * 
 * Overview of Level Creation:
 * - Each level is defined by properties like `level`, `title`, `rows`, `cols`, `wallHP`, and `enemies`.
 * - Levels can use an `enemyGenerator` function to dynamically generate enemies.
 * - Special properties like `generateEnemies`, `waveNumber`, and `restPhase` can be used for advanced level configurations.
 * - Levels can include additional objects (level objects) such as "vittle" items.
 *   For example, in level 1 a vittle can be defined that the player may interact with.
 */

// Helper function to generate a random integer within a range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a level layout with static "wall" enemies
function generateLevelLayout(rows, cols, minRoomSize, maxRoomSize, numRooms, wallHP) {
  const layout = []; // 2D array to hold level data
  for (let y = 0; y < rows; y++) {
    layout[y] = [];
    for (let x = 0; x < cols; x++) {
      layout[y][x] = null; // Initially empty
    }
  }

  const rooms = [];

  // Function to create a room
  const createRoom = (x, y, width, height) => {
    const room = { x, y, width, height };
    rooms.push(room);
  };

  // Attempt to generate rooms (very simple for now - just places without collision)
  for (let i = 0; i < numRooms; i++) {
    let width = getRandomInt(minRoomSize, maxRoomSize);
    let height = getRandomInt(minRoomSize, maxRoomSize);
    let x = getRandomInt(1, cols - width - 1);
    let y = getRandomInt(1, rows - height - 1);
    createRoom(x, y, width, height);
  }

  // Place "wall" enemies around the rooms (very basic - needs improvement to connect rooms)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let isWall = true;
      for (const room of rooms) {
        if (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
          isWall = false; // Inside a room
          break;
        }
      }
      if (isWall) {
        layout[y][x] = { type: "wall", hp: wallHP }; // Mark as a "wall"
      }
    }
  }

  return { layout, rooms };
}

export const levelSettings = [
  {
    level: 1,
    title: "Level 1: The Breaking Wall",
    rows: 5,
    cols: 10,
    wallHP: 20,
    enemies: []
  },
  {
    level: 2,
    title: "Level 2: The Reinforced Barricade",
    rows: 7,
    cols: 12,
    wallHP: 40,
    enemies: [
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 3
      },
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 5
      }
    ]
  },
  {
    level: 3,
    title: "Level 3: The Vertical Corridor",
    rows: 14,
    cols: 4,
    wallHP: 60,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      for (let col = 0; col < cols; col++) {
        enemies.push({
          name: "Coterian",
          symbol: "ꕥ",
          attack: 1,
          range: 1,
          hp: 55,
          agility: 22,
          x: col,
          y: Math.floor(rows / 2)
        });
      }
      return enemies;
    }
  },
  {
    level: 4,
    title: "Level 4: Outside the Gratt",
    rows: 3,
    cols: 15,
    wallHP: 70,
    enemies: [
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 0 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 11, y: 1 },
      { name: "Buckleman", symbol: "⛨", attack: 1, range: 1, hp: 25, agility: 1, x: 8, y: 2 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 2 }
    ]
  },
  {
    level: 5,
    title: "Level 5: Gratt ߁‎",
    rows: 10,
    cols: 8,
    wallHP: 50,
    enemies: [
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 1, y: 5 },
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 2, y: 5 },
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 3, y: 5 },
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 4, y: 5 },
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 5 },
      { name: "Static Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 6, y: 5 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 1, y: 4 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 2, y: 4 },
      { name: "Buckleman", symbol: "⛨", attack: 1, range: 1, hp: 20, agility: 1, x: 3, y: 4 },
      { name: "Getter", symbol: "∴", attack: 5, range: 1, hp: 55, agility: 5, x: 4, y: 6 },
      { name: "Stonch Hogan", symbol: "酉", attack: 8, range: 1, hp: 150, agility: 3, x: 5, y: 6 },
      { name: "Taker", symbol: "∵", attack: 1, range: 5, hp: 55, agility: 5, x: 6, y: 6 }
    ]
  },
  {
    level: 6,
    title: "Level 6: Gratt ߁‎ Antefoyer",
    rows: 7,
    cols: 6,
    wallHP: 100,
    enemies: [
      { name: "Tsortuf Hōsse", symbol: "ꁽ", attack: 10, range: 1, hp: 100, agility: 2, x: 1, y: 1 },
      { name: "Zoot Alorre", symbol: "ꍕ", attack: 5, range: 1, hp: 100, agility: 19, x: 4, y: 4 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 4, y: 0 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 0 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 1 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 2, y: 2 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 3, y: 2 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 2 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 0, y: 3 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 2, y: 3 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 3, y: 3 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 3 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 0, y: 4 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 4 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 0, y: 5 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 1, y: 5 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 2, y: 5 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 3, y: 5 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 4, y: 5 },
      { name: "Wall", symbol: "█", attack: 0, range: 0, hp: 50, agility: 0, x: 5, y: 5 }
    ]
  },
  {
    level: 7,
    title: "Level 7: Vestibule",
    rows: 8,
    cols: 8,
    wallHP: 75,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      for (let i = 0; i < 5; i++) {
        enemies.push({
          name: "Intender",
          symbol: "ꘐ",
          attack: 10,
          range: 10,
          hp: 75,
          agility: 10,
          x: getRandomInt(0, cols - 1),
          y: getRandomInt(0, rows - 1)
        });
      }
      return enemies;
    }
  },
  {
    level: 8,
    title: "Level 8: Strengthened Foes",
    rows: 9,
    cols: 8,
    wallHP: 100,
    enemies: [
      { name: "Əkaisee", symbol: "ੴ", attack: 10, range: 1, hp: 88, agility: 10, x: 2, y: 2 },
      { name: "Duppie Zero", symbol: "ਔ", attack: 10, range: 10, hp: 99, agility: 1, x: 7, y: 7 }
    ]
  },
  {
    level: 9,
    title: "Level 9: Further Discussion",
    rows: 12,
    cols: 12,
    wallHP: 200,
    enemies: [
      { name: "Steelgaze", symbol: "Ⳃ", attack: 15, range: 1, hp: 200, agility: 4, x: 3, y: 3 },
      { name: "Steelgaze", symbol: "Ⳃ", attack: 15, range: 1, hp: 200, agility: 4, x: 4, y: 4 },
      { name: "Steelgaze", symbol: "Ⳃ", attack: 15, range: 1, hp: 200, agility: 4, x: 5, y: 5 },
      { name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, hp: 200, agility: 2, x: 8, y: 8 },
      { name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, hp: 200, agility: 2, x: 9, y: 9 },
      { name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, hp: 200, agility: 2, x: 10, y: 10 }
    ]
  },
  {
    level: 10,
    title: "Level 10: Introspections of ߁‎",
    rows: 10,
    cols: 10,
    wallHP: 250,
    enemies: [
      { name: "Ge'umdaïƨe", symbol: "⅌", attack: 100, range: 5, hp: 1000, agility: 3, x: 6, y: 6 }
    ]
  },
  {
    level: 99,
    title: "Level ௧: Further Introspection",
    rows: 15,
    cols: 15,
    wallHP: 100,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      // Define enemy types for a denser, more complex chessboard formation
      const enemyTypes = [
        {
          name: "Chess Pawn",
          symbol: "♙",
          attack: 2,
          range: 1,
          hp: 50,
          agility: 2,
          dialogue: ["advance - with silent determination."]
        },
        {
          name: "Chess Knight",
          symbol: "♘",
          attack: 4,
          range: 2,
          hp: 55,
          agility: 5,
          dialogue: ["leap - into battle with tactical prowess."]
        },
        {
          name: "Chess Bishop",
          symbol: "♗",
          attack: 3,
          range: 3,
          hp: 120,
          agility: 10,
          dialogue: ["glide - strike from afar with precision."]
        }
      ];
      // Increase density by using the bottom three rows for a formation
      const formationRows = 3;
      const startRow = rows - formationRows - 1;
      for (let r = startRow; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          // Choose enemy type based on a cycling pattern to add variety
          const enemyType = enemyTypes[(r + c) % enemyTypes.length];
          enemies.push({
            ...enemyType,
            x: c,
            y: r
          });
        }
      }
      return enemies;
    }
  }
];

export function getLevel(levelNumber) {
  const level = levelSettings.find(ls => ls.level === levelNumber);
  if (!level) return null;
  let enemies;

  if (level.generateEnemies && typeof level.enemyGenerator === "function") {
    enemies = level.enemyGenerator(level.rows, level.cols, level.waveNumber || 0);
  } else {
    enemies = (level.enemies || []).map(enemy => {
      if (enemy.enemyXOffset !== undefined) {
        return {
          ...enemy,
          x: level.cols - enemy.enemyXOffset,
          y: Math.floor(level.rows / 2)
        };
      }
      return enemy;
    });
  }

  return {
    rows: level.rows,
    cols: level.cols,
    wallHP: level.wallHP,
    title: level.title,
    enemies,
    onWaveComplete: level.onWaveComplete,
    getWaveStats: level.getWaveStats,
    layout: level.layout // Ensure layout property is included in the returned level object
  };
}

export function hasDialogue(entity) {
  return Array.isArray(entity.dialogue) && entity.dialogue.length > 0;
}

export function getRandomDialogue(entity) {
  if (!hasDialogue(entity)) return null;
  return entity.dialogue[Math.floor(Math.random() * entity.dialogue.length)];
}
