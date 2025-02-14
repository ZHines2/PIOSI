import { Enemy } from './entities.js';

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
 * - Levels can include multiple floors or levels within the same grid.
 * - Stairs or ladders can be used to connect different levels, allowing players to navigate vertically.
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

// Function to generate a multi-level layout with stairs or ladders
function generateMultiLevelLayout(rows, cols, minRoomSize, maxRoomSize, numRooms, wallHP, numFloors) {
  const floors = [];
  for (let i = 0; i < numFloors; i++) {
    const floorLayout = generateLevelLayout(rows, cols, minRoomSize, maxRoomSize, numRooms, wallHP);
    floors.push(floorLayout);
  }

  // Add stairs or ladders to connect floors
  for (let i = 0; i < numFloors - 1; i++) {
    const currentFloor = floors[i];
    const nextFloor = floors[i + 1];

    // Place stairs in a random room on the current floor
    const currentRoom = currentFloor.rooms[getRandomInt(0, currentFloor.rooms.length - 1)];
    const stairX = currentRoom.x + getRandomInt(1, currentRoom.width - 2);
    const stairY = currentRoom.y + getRandomInt(1, currentRoom.height - 2);
    currentFloor.layout[stairY][stairX] = { type: "stairs", toFloor: i + 1 };

    // Place corresponding stairs in a random room on the next floor
    const nextRoom = nextFloor.rooms[getRandomInt(0, nextFloor.rooms.length - 1)];
    const nextStairX = nextRoom.x + getRandomInt(1, nextRoom.width - 2);
    const nextStairY = nextRoom.y + getRandomInt(1, nextRoom.height - 2);
    nextFloor.layout[nextStairY][nextStairX] = { type: "stairs", toFloor: i };
  }

  return floors;
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
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 3, Math.floor(7 / 2)),
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 5, Math.floor(7 / 2))
    ]
  },
  {
    level: 3,
    title: "Level 3: The Vertical Corridor",
    rows: 14,
    cols: 3,
    wallHP: 60,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      for (let col = 0; col < cols; col++) {
        enemies.push(new Enemy("Buckleman", "⛨", 1, 1, 20, 1, col, Math.floor(rows / 2)));
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
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 12, 0),
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 11, 1),
      new Enemy("Buckleman", "⛨", 1, 1, 20, 1, 8, 2),
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 12, 2)
    ]
  },
  {
    level: 5,
    title: "Level 5: Gratt ߁‎",
    rows: 10,
    cols: 8,
    wallHP: 50,
    enemies: [
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 1, 5),
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 2, 5),
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 3, 5),
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 4, 5),
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 5, 5),
      new Enemy("Static Wall", "█", 0, 0, 50, 0, 6, 5),
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 1, 4),
      new Enemy("Brigand", "Җ", 3, 1, 12, 2, 2, 4),
      new Enemy("Buckleman", "⛨", 1, 1, 20, 1, 3, 4),
      new Enemy("Getter", "∴", 5, 1, 50, 5, 4, 6),
      new Enemy("Stonch Hogan", "酉", 7, 1, 100, 3, 5, 6),
      new Enemy("Taker", "∵", 1, 5, 50, 5, 6, 6)
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
        new Enemy("Chess Pawn", "♙", 2, 1, 10, 2, 0, 0, ["Pawn advances with silent determination."]),
        new Enemy("Chess Knight", "♘", 4, 2, 15, 3, 0, 0, ["Knight leaps into battle with tactical prowess."]),
        new Enemy("Chess Bishop", "♗", 3, 3, 12, 2, 0, 0, ["Bishop glides, striking from afar with precision."])
      ];
      // Increase density by using the bottom three rows for a formation
      const formationRows = 3;
      const startRow = rows - formationRows - 1;
      for (let r = startRow; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          // Choose enemy type based on a cycling pattern to add variety
          const enemyType = enemyTypes[(r + c) % enemyTypes.length];
          enemies.push(new Enemy(enemyType.name, enemyType.symbol, enemyType.attack, enemyType.range, enemyType.hp, enemyType.agility, c, r, enemyType.dialogue));
        }
      }
      return enemies;
    }
  },
  {
    level: 100,
    title: "Level ∞: The Chamber of Echoes",
    rows: 20,
    cols: 20,
    wallHP: 150,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const loreKeepers = [
        new Enemy("Ancient Chronicler", "ℜ", 0, 1, 40, 2, Math.floor(cols / 2), Math.floor(rows / 2), [
          "Welcome to the Chamber of Echoes, where truth and memory intertwine.",
          "The walls you've broken, the battles you've fought... all reflections of greater struggles.",
          "Our world was not always divided by walls. They rose when fear overcame wisdom.",
          "Each symbol you see - they are more than mere characters. They are echoes of ancient powers."
        ]),
        new Enemy("Time Weaver", "Ѯ", 3, 3, 30, 5, cols - 3, rows - 3, [
          "I have watched countless cycles of breaking and rebuilding.",
          "The Griot's tales? Mere fragments of a vast tapestry.",
          "Want to know about the first wall? Or perhaps... the last one?"
        ]),
        new Enemy("Reality Breaker", "Ѭ", 4, 2, 35, 3, 2, 2, [
          "You think you're breaking walls? You're breaking reality itself.",
          "Each level is a layer of truth. Each symbol a fragment of forgotten knowledge.",
          "The Slüjier's power? A remnant of chaos from before the walls."
        ])
      ];

      for (let i = 0; i < 4; i++) {
        loreKeepers.push(new Enemy("Echo Spirit", "Ԇ", 2, 2, 20, 2, Math.floor(Math.random() * (cols - 4)) + 2, Math.floor(Math.random() * (rows - 4)) + 2, [
          "Did you know the Knight's symbol represents more than just strength?",
          "The Torcher's flames carry whispers of ancient purification rites.",
          "Even the Jester's jokes hold fragments of forgotten wisdom.",
          "The walls remember when they were mountains, before they were carved into barriers."
        ]));
      }

      return loreKeepers;
    }
  },
  {
    level: 101,
    title: "Level Ω: Gratt Prime",
    rows: 25,
    cols: 25,
    wallHP: 1000,
    generateEnemies: true,
    waveNumber: 0,
    restPhase: false,
    enemyGenerator: (rows, cols, waveNumber = 0) => {
      const initialEnemies = [];

      if (waveNumber === 0) {
        initialEnemies.push(
          new Enemy("Healing Shrine", "₪", 0, 2, 999, 0, Math.floor(cols / 2), Math.floor(rows / 2), [
            "Rest, warriors. The cycle continues.",
            "Your strength returns, but the wall endures.",
            "The Gratt remembers those who persist."
          ]),
          new Enemy("Gratt Keeper", "Ψ", 0, 1, 999, 1, Math.floor(cols / 2) - 2, Math.floor(rows / 2), [
            "The wall has stood since time immemorial.",
            "Each strike weakens its eternal vigil.",
            "Wisdom may succeed where force fails."
          ]),
          new Enemy("Catalyst", "!", 0, 0, 1, 0, Math.floor(cols / 2) + 2, Math.floor(rows / 2), ["The cycle must continue..."])
        );
      }

      if (waveNumber % 5 === 0) {
        return initialEnemies;
      }

      const enemies = [];
      const baseEnemyCount = 3 + Math.floor(waveNumber / 2);
      const waveStrength = Math.floor(waveNumber / 10);

      const enemyTypes = [
        new Enemy("Gratt Sentinel", "Ѫ", 4 + waveStrength, 2, 15 + waveStrength * 5, 2 + Math.floor(waveStrength / 2), 0, 0),
        new Enemy("Phase Striker", "Ж", 6 + waveStrength * 2, 1, 10 + waveStrength * 3, 4 + waveStrength, 0, 0),
        new Enemy("Echo Mage", "Ω", 3 + waveStrength, 4 + Math.floor(waveStrength / 2), 8 + waveStrength * 2, 2, 0, 0)
      ];

      if (waveNumber >= 10) {
        enemyTypes.push(new Enemy("Gratt Champion", "Ԅ", 8 + waveStrength * 2, 2, 30 + waveStrength * 8, 3 + Math.floor(waveStrength / 2), 0, 0));
      }

      if (waveNumber >= 20) {
        enemyTypes.push(new Enemy("Time Weaver Echo", "Җ", 5 + waveStrength, 3, 20 + waveStrength * 4, 5 + waveStrength, 0, 0, [
          "Time flows differently here...",
          "The wall remembers every assault.",
          "Perhaps there is another way."
        ]));
      }

      for (let i = 0; i < baseEnemyCount; i++) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = new Enemy(enemyType.name, enemyType.symbol, enemyType.attack, enemyType.range, enemyType.hp, enemyType.agility, 0, 0, enemyType.dialogue);

        let placed = false;
        while (!placed) {
          const x = Math.floor(Math.random() * (cols - 4)) + 2;
          const y = Math.floor(Math.random() * (rows - 4)) + 2;

          const isFarEnough = enemies.every(e =>
            Math.abs(e.x - x) > 3 || Math.abs(e.y - y) > 3
          );

          if (isFarEnough) {
            enemy.x = x;
            enemy.y = y;
            placed = true;
          }
        }

        enemies.push(enemy);
      }

      if (waveNumber > 0 && waveNumber % 10 === 0) {
        enemies.forEach(enemy => {
          enemy.dialogue = [
            "The wall weakens not through force alone.",
            "Ancient runes pulse with forgotten meaning.",
            "Patterns emerge for those who observe."
          ];
        });
      }
      return [...initialEnemies, ...enemies];
    },
    onWaveComplete: (waveNumber) => ({
      message: `The eternal wall endures...`,
      wallDamageReduction: Math.max(0.5, 1 - (waveNumber * 0.01))
    }),
    getWaveStats: (waveNumber) => ({
      enemyScale: 1 + (waveNumber * 0.1)
    })
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
        return new Enemy(enemy.name, enemy.symbol, enemy.attack, enemy.range, enemy.hp, enemy.agility, level.cols - enemy.enemyXOffset, Math.floor(level.rows / 2));
      }
      return new Enemy(enemy.name, enemy.symbol, enemy.attack, enemy.range, enemy.hp, enemy.agility, enemy.x, enemy.y);
    });
  }

  return {
    rows: level.rows,
    cols: level.cols,
    wallHP: level.wallHP,
    title: level.title,
    enemies,
    onWaveComplete: level.onWaveComplete,
    getWaveStats: level.getWaveStats
  };
}

export function hasDialogue(entity) {
  return Array.isArray(entity.dialogue) && entity.dialogue.length > 0;
}

export function getRandomDialogue(entity) {
  if (!hasDialogue(entity)) return null;
  return entity.dialogue[Math.floor(Math.random() * entity.dialogue.length)];
}
