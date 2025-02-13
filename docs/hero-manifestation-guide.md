# Hero Manifestation Guide

This document provides guidelines and best practices for creating new heroes in the game. Follow these steps to ensure your heroes are balanced, engaging, and fun.

## Hero Properties

Each hero is defined by a set of properties. Here are the key properties you need to define:

- `name`: The name of the hero.
- `symbol`: The symbol representing the hero on the grid.
- `attack`: The attack power of the hero.
- `range`: The attack range of the hero.
- `agility`: The agility of the hero, which determines how many moves they can make per turn.
- `hp`: The health points of the hero.
- `special abilities`: Any special abilities the hero possesses.

## Special Properties

Some heroes have special properties that give them unique abilities. Here are some examples:

- `heal`: The hero can heal other heroes.
- `burn`: The hero can inflict burn damage on enemies.
- `sluj`: The hero can inflict sluj damage on enemies.
- `yeet`: The hero can knock back enemies.
- `swarm`: The hero can deal turn-based damage to adjacent enemies.

## Best Practices

- **Balance**: Ensure that the hero is balanced in terms of abilities and stats. Avoid making heroes too powerful or too weak.
- **Variety**: Introduce a variety of heroes with different abilities to keep the gameplay interesting.
- **Testing**: Playtest your heroes to ensure they are fun and engaging. Make adjustments based on feedback.

## Examples

Here are some examples of hero configurations:

### Example 1: Knight

```javascript
{
  name: "Knight",
  symbol: "♞",
  attack: 4,
  range: 1,
  agility: 4,
  hp: 18
}
```

### Example 2: Cleric

```javascript
{
  name: "Cleric",
  symbol: "✝",
  attack: 2,
  range: 1,
  agility: 3,
  hp: 12,
  heal: 4 // Healing power: used when interacting with a friendly hero.
}
```

### Example 3: Yeetrian

```javascript
{
  name: "Yeetrian",
  symbol: "⛓",
  attack: 3,
  range: 2,
  agility: 4,
  hp: 14,
  yeet: 1 // Knockback ability.
}
```

## Griot.js Integration

The `griot.js` module handles API calls for special characters and generates narrative text using a Markov chain that’s refreshed with recent interactions. The Griot hero reacts uniquely when encountering historical events, and the module provides various special API calls for characters.

By following these guidelines and best practices, you can create heroes that are balanced, engaging, and fun for players. Happy hero designing!
