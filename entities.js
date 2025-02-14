class Entity {
  constructor(name, symbol, attack, range, hp, agility, x, y) {
    this.name = name;
    this.symbol = symbol;
    this.attack = attack;
    this.range = range;
    this.hp = this.maxHp = hp;
    this.agility = agility;
    this.x = x;
    this.y = y;
  }
}

class Placeable extends Entity {
  constructor(name, symbol, x, y) {
    super(name, symbol, 0, 0, 0, 0, x, y);
  }
}

class Breakable extends Placeable {
  constructor(name, symbol, x, y, hp) {
    super(name, symbol, x, y);
    this.hp = hp;
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.destroy();
    }
  }

  destroy() {
    // Logic to handle destruction of the breakable object
  }
}

class Mushroom extends Placeable {
  constructor(name, symbol, x, y, attribute) {
    super(name, symbol, x, y);
    this.attribute = attribute;
  }

  collect(hero) {
    if (hero.spore) {
      const randomStat = this.getRandomStat();
      hero[randomStat] += 1;
      console.log(`${hero.name} collected a mushroom and gained +1 ${randomStat}!`);
    } else {
      hero.hp = Math.min(hero.hp + 1, hero.maxHp);
      console.log(`${hero.name} collected a mushroom and healed 1 HP!`);
    }
    this.destroy();
  }

  getRandomStat() {
    const stats = ['attack', 'range', 'agility', 'hp'];
    return stats[Math.floor(Math.random() * stats.length)];
  }

  destroy() {
    // Logic to handle destruction of the mushroom
  }
}

class Vittle extends Placeable {
  constructor(name, symbol, x, y, healAmount) {
    super(name, symbol, x, y);
    this.healAmount = healAmount;
  }

  collect(hero) {
    hero.hp = Math.min(hero.hp + this.healAmount, hero.maxHp);
    console.log(`${hero.name} collected a vittle and healed ${this.healAmount} HP!`);
    this.destroy();
  }

  destroy() {
    // Logic to handle destruction of the vittle
  }
}
