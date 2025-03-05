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
- `generateEnemies`: A boolean indicating if enemies should be generated dynamically.
- `enemyGenerator`: A function to dynamically generate enemies.
- `layout`: A 2D array representing the level layout.

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
- `dialogue`: An array of dialogue lines for the enemy.

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

## Level Layout

The `layout` property is a 2D array representing the level layout. Each cell in the array can be `null` (empty) or an object representing a wall or other obstacle. Here is an example of a level layout:

```javascript
const layout = [
  [null, null, null, null, null],
  [null, { type: "wall", hp: 50 }, null, { type: "wall", hp: 50 }, null],
  [null, null, null, null, null],
  [null, { type: "wall", hp: 50 }, null, { type: "wall", hp: 50 }, null],
  [null, null, null, null, null]
];
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
  enemies: []
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
  }
}
```

### Example 4: Level with Layout

```javascript
{
  level: 4,
  title: "Level 4: The Maze",
  rows: 5,
  cols: 5,
  wallHP: 50,
  layout: [
    [null, null, null, null, null],
    [null, { type: "wall", hp: 50 }, null, { type: "wall", hp: 50 }, null],
    [null, null, null, null, null],
    [null, { type: "wall", hp: 50 }, null, { type: "wall", hp: 50 }, null],
    [null, null, null, null, null]
  ],
  enemies: [
    {
      name: "Maze Guardian",
      symbol: "M",
      attack: 5,
      range: 1,
      hp: 30,
      agility: 2,
      x: 2,
      y: 2
    }
  ]
}
```

By following these guidelines and best practices, you can create levels that are challenging, engaging, and fun for players. Happy level designing!
