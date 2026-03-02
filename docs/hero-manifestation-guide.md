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
- `armor`: The armor points of the hero, which absorb damage before HP is affected.
- `special abilities`: Any special abilities the hero possesses.

## Special Properties

Some heroes have special properties that give them unique abilities. Here are some examples:

- `heal`: The hero can heal other heroes.
- `burn`: The hero can inflict burn damage on enemies.
- `sluj`: The hero can inflict sluj damage on enemies.
- `yeet`: The hero can knock back enemies.
- `swarm`: The hero can deal turn-based damage to adjacent enemies.
- `spicy`: Each "spicy" stat raises the amount the vittle heals for.
- `caprice`: The hero can randomly boost one of their stats.
- `fate`: The hero can randomly buff or debuff stats for all heroes.
- `bulk`: The hero can raise a random stat every time they defeat an enemy.
- `chain`: The hero can deal chain damage to adjacent enemies.
- `psych`: The hero can boost ally stats.
- `ankh`: The hero can provide boosts on hero deaths.
- `rise`: The hero can revive with HP equal to the rise value.

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
  hp: 18,
  description: "The Knight stands at the forefront, defending the realm with unwavering courage. Known for his unbreakable defense, he once held the line against an entire army, his shield never faltering."
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
  heal: 4, // Healing power: used when interacting with a friendly hero.
  description: "The Cleric's healing powers are legendary. She has saved countless lives on the battlefield, her touch mending wounds and restoring hope."
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
  yeet: 1, // Knockback ability.
  description: "Yeetrian's mighty 'yeet' ability can knock back enemies with a single blow, sending them crashing into walls and obstacles. His strength is unmatched, and his enemies fear his powerful strikes."
}
```

### Example 4: Mellitron

```javascript
{
  name: "Mellitron",
  symbol: "丰",
  attack: 1,
  range: 3,
  agility: 5,
  hp: 18,
  swarm: 2, // Swarm ability.
  description: "Mellitron commands a swarm of bees that deal turn-based damage to any enemy in an adjacent tile. His bees sting with relentless fury, and his enemies are left in agony."
}
```

### Example 5: Gastronomer

```javascript
{
  name: "Gastronomer",
  symbol: "𑍐",
  attack: 2,
  range: 1,
  agility: 3,
  hp: 15,
  spicy: 1, // Spicy stat: increases the amount the vittle heals for.
  description: "The Gastronomer uses his culinary skills to enhance the healing properties of vittles. Each 'spicy' stat raises the amount the vittle heals for, making him a valuable asset in prolonged battles."
}
```

### Example 6: Palisade

```javascript
{
  name: "Palisade",
  symbol: "ᱟ",
  attack: 3,
  range: 1,
  agility: 2,
  hp: 20,
  armor: 5, // Armor stat: absorbs damage before HP is affected.
  description: "Palisade is a stalwart defender, his armor absorbing the brunt of enemy attacks. He stands as a bulwark against the forces of darkness, his resolve unshakable."
}
```

### Example 7: Pæg

```javascript
{
  name: "Pæg",
  symbol: "ꚤ",
  attack: 1,
  range: 1,
  agility: 1,
  hp: 1,
  heal: 1,
  burn: 1,
  sluj: 1,
  ghis: 1,
  yeet: 1,
  swarm: 1,
  charm: 1,
  spicy: 1,
  armor: 1,
  spore: 1,
  chain: 1,
  description: "Pæg is a versatile hero with 1 in every stat, making him a jack-of-all-trades but master of none."
}
```

### Example 8: Nonsequiteur

```javascript
{
  name: "Nonsequiteur",
  symbol: "∄",
  attack: 3,
  range: 3,
  agility: 3,
  hp: 10,
  nonseq: true, // Delivers random, non-sequitur interactions.
  caprice: 1, // New stat for random stat increment
  description: "Nonsequiteur is known for his unpredictable nature. His 'caprice' stat allows him to randomly boost one of his stats, making him a wild card in any battle."
}
```

### Example 9: Soothscribe

```javascript
{
  name: "Soothscribe",
  symbol: "☄",
  attack: 2,
  range: 6,
  agility: 3,
  hp: 11,
  tarot: true, // Can fetch tarot cards for special actions.
  fate: 1, // New stat for random buffs or debuffs
  description: "The Soothscribe's 'fate' stat allows him to randomly buff or debuff stats for all heroes, making him a master of unpredictability."
}
```

### Example 10: Meatwalker

```javascript
{
  name: "Meatwalker",
  symbol: "₻",
  attack: 7,
  range: 1,
  agility: 2,
  hp: 22,
  heal: 1, // Slight healing property.
  meat: true, // Indicates meat-related interactions.
  bulk: 1, // New bulk stat for Meatwalker
  description: "Meatwalker's bulk stat allows him to raise a random stat every time he defeats an enemy, making him stronger with each victory."
}
```

### Example 11: Shrink

```javascript
{
  name: "Shrink",
  symbol: "☊",
  attack: 2,
  range: 1,
  agility: 3,
  hp: 12,
  shrink: true, // Indicates shrink-related behavior.
  psych: 1, // New psych stat for Shrink.
  description: "The Shrink uses his psychological expertise to boost ally stats, making him a valuable support hero."
}
```

### Example 12: Kemetic

```javascript
{
  name: "Kemetic",
  symbol: "𓋇",
  attack: 5,
  range: 5,
  agility: 5,
  hp: 25,
  ankh: 5, // The new ankh stat will cause boosts on hero deaths.
  description: "Kemetic is a powerful hero with high attack, range, agility, and ankh stat, making him a formidable force on the battlefield."
}
```

### Example 13: Greenjay

```javascript
{
  name: "Greenjay",
  symbol: "࿈",
  attack: 5,
  range: 2,
  agility: 4,
  hp: 30,
  rise: 5, // New rise stat.
  description: "Greenjay's rise stat allows him to revive with HP equal to the rise value, making him a resilient hero who can continue fighting even after falling."
}
```

## Griot.js Integration

The `griot.js` module handles API calls for special characters and generates narrative text using a Markov chain that’s refreshed with recent interactions. The Griot hero reacts uniquely when encountering historical events, and the module provides various special API calls for characters.

## Healing Items

### Vittle (ౚ)

- **Symbol**: ౚ
- **Healing Amount**: 10 HP
- **Description**: A nourishing item that heals the hero for 10 health points when picked up.

### Mushroom (ඉ)

- **Symbol**: ඉ
- **Healing Amount**: 5 HP
- **Description**: A healing item that restores 5 health points to the hero when picked up.

## Possible Fates

Here is a list of 10 possible fates that can be applied to heroes:

1. Increase attack power
2. Decrease attack power
3. Increase range
4. Decrease range
5. Increase agility
6. Decrease agility
7. Increase health points (HP)
8. Decrease health points (HP)
9. Increase healing power
10. Decrease healing power

By following these guidelines and best practices, you can create heroes that are balanced, engaging, and fun for players. Happy hero designing!
