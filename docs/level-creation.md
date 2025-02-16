# Level Creation Rubric

This document provides guidelines and best practices for creating new levels in the game. Follow these steps to ensure your levels are balanced, engaging, and fun.

## Level Properties

Each level is defined by a set of properties. Here are the key properties you need to define:

- `level`: The level number.
- `title`: The title of the level.
- `rows`: The number of rows in the level grid.
- `cols`: The number of columns in the level grid.
- `wallHP`: The health points of the wall that players need to break through.
- `enemies`: An array of enemy configurations.
- `items`: An array of item configurations.

## Enemy Configuration

Each enemy is defined by a set of properties. Here are the key properties you need to define:

- `name`: The name of the enemy.
- `symbol`: The symbol representing the enemy on the grid.
- `attack`: The attack power of the enemy.
- `range`: The attack range of the enemy.
- `hp`: The health points of the enemy.
- `agility`: The agility of the enemy, which determines how many moves they can make per turn.
- `x`: The x-coordinate of the enemy's starting position.
- `y`: The y-coordinate of the enemy's starting position.

## Item Configuration

Each item is defined by a set of properties. Here are the key properties you need to define:

- `name`: The name of the item.
- `symbol`: The symbol representing the item on the grid.
- `effect`: A function that defines the effect of the item when collected.
- `message`: A message to be logged when the item is collected.

## Dynamic Enemy Generation

Some levels use an `enemyGenerator` function to dynamically generate enemies. This function takes the number of rows and columns as parameters and returns an array of enemy configurations. Here is an example of an `enemyGenerator` function:

```javascript
function enemyGenerator(rows, cols) {
  const enemies = [];
  for (let col = 0; col < cols; col++) {
    enemies.push({
      name: "Buckleman",
      symbol: "⛨",
      attack: 1,
      range: 1,
      hp: 20,
      agility: 1,
      x: col,
      y: Math.floor(rows / 2)
    });
  }
  return enemies;
}
```

## Multi-Level Layouts

Levels can include multiple floors or levels within the same grid. Stairs or ladders can be used to connect different levels, allowing players to navigate vertically. Here is an example of a function to generate a multi-level layout:

```javascript
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
```

## Best Practices

- **Balance**: Ensure that the level is balanced in terms of difficulty. Avoid making levels too easy or too hard.
- **Variety**: Introduce a variety of enemies and obstacles to keep the gameplay interesting.
- **Progression**: Gradually increase the difficulty of the levels as the player progresses through the game.
- **Testing**: Playtest your levels to ensure they are fun and engaging. Make adjustments based on feedback.

## Examples

Here are some examples of level configurations:

### Example 1: Simple Level

```javascript
{
  level: 1,
  title: "Level 1: The Breaking Wall",
  rows: 5,
  cols: 10,
  wallHP: 20,
  enemies: [],
  items: [
    {
      name: "Vittle",
      symbol: "ౚ",
      effect: (hero) => {
        hero.hp += 1;
      },
      message: "You found a Vittle! +1 HP"
    },
    debugPickupItem
  ]
}
```

### Example 2: Level with Enemies

```javascript
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
  ],
  items: [
    debugPickupItem
  ]
}
```

### Example 3: Level with Dynamic Enemy Generation

```javascript
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
      enemies.push({
        name: "Buckleman",
        symbol: "⛨",
        attack: 1,
        range: 1,
        hp: 20,
        agility: 1,
        x: col,
        y: Math.floor(rows / 2)
      });
    }
    return enemies;
  },
  items: [
    debugPickupItem
  ]
}
```

### Example 4: Level with Multiple Floors

```javascript
{
  level: 4,
  title: "Level 4: Outside the Gratt",
  rows: 3,
  cols: 15,
  wallHP: 70,
  enemies: [
    { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 0 },
    { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 11, y: 1 },
    { name: "Buckleman", symbol: "⛨", attack: 1, range: 1, hp: 20, agility: 1, x: 8, y: 2 },
    { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 2 }
  ],
  items: [
    debugPickupItem
  ]
}
```

### Example 5: Advanced Level with Waves

```javascript
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
    { name: "Getter", symbol: "∴", attack: 5, range: 1, hp: 50, agility: 5, x: 4, y: 6 },
    { name: "Stonch Hogan", symbol: "酉", attack: 7, range: 1, hp: 100, agility: 3, x: 5, y: 6 },
    { name: "Taker", symbol: "∵", attack: 1, range: 5, hp: 50, agility: 5, x: 6, y: 6 }
  ],
  items: [
    debugPickupItem
  ]
}
```

## Integrating `debugPickupItem` into Levels

To integrate the `debugPickupItem` into levels, follow these steps:

1. Define the `debugPickupItem` in the `levels.js` file with the desired properties and effects.
2. Ensure that the `debugPickupItem` is included in the `items` array for the relevant levels.
3. Modify the `moveUnit` method in the `BattleEngine` class to check for the `debugPickupItem` when a unit moves.
4. Add logic to apply the effect of the `debugPickupItem` when collected.
5. Update the `initializeBattle` function in the `index.html` file to include the `debugPickupItem` in the battlefield.
6. Ensure the `renderBattlefield` function in the `index.html` file displays the `debugPickupItem` correctly.

By following these guidelines and best practices, you can create levels that are challenging, engaging, and fun for players. Happy level designing!
