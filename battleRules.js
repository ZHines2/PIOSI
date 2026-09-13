import { applyKnockback } from "./applyKnockback.js";
import { CORE_RANDOM_STATS, ABILITY_HOOKS } from "./gameModel.js";

function pickStat(engine, stats = CORE_RANDOM_STATS) {
  return engine.pickRandom(stats);
}

const RULES = [
  {
    id: "caprice",
    hook: ABILITY_HOOKS.ON_BATTLE_START,
    when: ({ hero }) => hero?.caprice > 0,
    execute: ({ hero }, engine) => {
      for (let i = 0; i < hero.caprice; i++) {
        const randomStat = pickStat(engine);
        if (!randomStat) return;
        hero[randomStat] += 1;
        engine.logCallback(`${hero.name}'s caprice boosts ${randomStat} to ${hero[randomStat]}`);
        engine.emitEvent("stat.changed", { unitId: hero.id, stat: randomStat, amount: 1, source: "caprice" });
      }
    }
  },
  {
    id: "fate",
    hook: ABILITY_HOOKS.ON_BATTLE_START,
    when: ({ hero }) => hero?.fate > 0,
    execute: ({ hero }, engine) => {
      const fates = [
        { stat: "attack", change: 1 }, { stat: "attack", change: -1 },
        { stat: "range", change: 1 }, { stat: "range", change: -1 },
        { stat: "agility", change: 1 }, { stat: "agility", change: -1 },
        { stat: "hp", change: 1 }, { stat: "hp", change: -1 }
      ];
      for (let i = 0; i < hero.fate; i++) {
        const randomFate = engine.pickRandom(fates);
        if (!randomFate) return;
        hero[randomFate.stat] += randomFate.change;
        engine.logCallback(`${hero.name}'s fate changes ${randomFate.stat} to ${hero[randomFate.stat]}`);
        engine.emitEvent("stat.changed", {
          unitId: hero.id,
          stat: randomFate.stat,
          amount: randomFate.change,
          source: "fate"
        });
      }
    }
  },
  {
    id: "spicy",
    hook: ABILITY_HOOKS.ON_MOVE,
    when: ({ tile, unit }) => tile === "ౚ" && unit,
    execute: ({ unit }, engine) => {
      const healingValue = 10 + (unit.spicy ? unit.spicy * 2 : 0);
      unit.hp += healingValue;
      engine.logCallback(`${unit.name} picks up a vittle and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
      engine.emitEvent("heal.applied", { unitId: unit.id, amount: healingValue, source: "vittle" });
    }
  },
  {
    id: "spore",
    hook: ABILITY_HOOKS.ON_MOVE,
    when: ({ tile, unit }) => tile === "ඉ" && unit,
    execute: ({ unit }, engine) => {
      unit.hp += 5;
      engine.logCallback(`${unit.name} picks up a mushroom and heals for 5 HP! (New HP: ${unit.hp})`);
      engine.emitEvent("heal.applied", { unitId: unit.id, amount: 5, source: "mushroom" });
      if (unit.spore > 0) {
        const randomStat = pickStat(engine);
        if (!randomStat) return;
        unit[randomStat] += unit.spore;
        engine.logCallback(`${unit.name} gains ${unit.spore} boost to ${randomStat} (Now: ${unit[randomStat]})`);
        engine.emitEvent("stat.changed", { unitId: unit.id, stat: randomStat, amount: unit.spore, source: "spore" });
      }
    }
  },
  {
    id: "heal",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ALLY,
    when: ({ attacker }) => attacker?.heal > 0,
    execute: ({ attacker, target }, engine) => {
      target.hp += attacker.heal;
      engine.logCallback(`${attacker.name} heals ${target.name} for ${attacker.heal} HP! (New HP: ${target.hp})`);
      engine.emitEvent("heal.applied", { unitId: target.id, amount: attacker.heal, source: "heal" });
    }
  },
  {
    id: "psych",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ALLY,
    when: ({ attacker }) => attacker?.heal <= 0 && attacker?.psych > 0,
    execute: ({ attacker, target }, engine) => {
      const randomStat = pickStat(engine);
      if (!randomStat) return;
      target[randomStat] += attacker.psych;
      engine.logCallback(`${attacker.name} uses psych on ${target.name}, boosting ${randomStat} by ${attacker.psych}! (New ${randomStat}: ${target[randomStat]})`);
      engine.emitEvent("stat.changed", { unitId: target.id, stat: randomStat, amount: attacker.psych, source: "psych" });
    }
  },
  {
    id: "trick",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: ({ attacker }) => attacker?.trick > 0,
    execute: ({ attacker, target }, engine) => {
      const debuffableStats = CORE_RANDOM_STATS.filter(stat => typeof target[stat] === "number");
      const chosenStat = engine.pickRandom(debuffableStats);
      if (!chosenStat) return;
      const original = target[chosenStat];
      target[chosenStat] = Math.max(0, target[chosenStat] - attacker.trick);
      engine.logCallback(`${attacker.name}'s trick lowers ${target.name}'s ${chosenStat} from ${original} to ${target[chosenStat]}!`);
      engine.emitEvent("stat.changed", { unitId: target.id, stat: chosenStat, amount: -attacker.trick, source: "trick" });
    }
  },
  {
    id: "burn",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: ({ attacker }) => attacker?.burn > 0,
    execute: ({ attacker, target }, engine) => {
      target.statusEffects.burn = { damage: attacker.burn, duration: 3, sourceId: attacker.id };
      engine.logCallback(`${target.name} is burning for ${attacker.burn} damage for 3 turns!`);
      engine.emitEvent("status.applied", { unitId: target.id, status: "burn", source: attacker.id });
    }
  },
  {
    id: "sluj",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: ({ attacker }) => attacker?.sluj > 0,
    execute: ({ attacker, target }, engine) => {
      if (!target.statusEffects.sluj) {
        target.statusEffects.sluj = { level: attacker.sluj, duration: 4, counter: 0, sourceId: attacker.id };
      } else {
        target.statusEffects.sluj.level += attacker.sluj;
        target.statusEffects.sluj.duration = 4;
        target.statusEffects.sluj.sourceId = attacker.id;
      }
      engine.logCallback(`${target.name} is afflicted with slüj (level ${target.statusEffects.sluj.level}) for 4 turns!`);
      engine.emitEvent("status.applied", { unitId: target.id, status: "sluj", source: attacker.id });
    }
  },
  {
    id: "yeet",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: ({ attacker }) => attacker?.yeet > 0,
    execute: ({ attacker, target, dx, dy }, engine) => {
      applyKnockback(target, dx, dy, attacker.yeet, attacker.attack, engine.battlefield, engine.logCallback, engine.isWithinBounds.bind(engine));
      engine.emitEvent("movement.forced", { unitId: target.id, source: "yeet" });
    }
  },
  {
    id: "chain",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: ({ attacker }) => attacker?.chain > 0,
    execute: ({ attacker, target }, engine) => {
      const effectiveMultiplier = 1 - Math.exp(-attacker.chain / 10);
      const initialChainDamage = Math.round(attacker.attack * effectiveMultiplier);
      if (initialChainDamage > 0) {
        engine.logCallback(`${target.name} takes ${initialChainDamage} chain damage!`);
        engine.applyChainDamage(target, initialChainDamage, effectiveMultiplier, new Set(), attacker);
        engine.emitEvent("damage.applied", { unitId: target.id, amount: initialChainDamage, source: "chain" });
      }
    }
  },
  {
    id: "bomba",
    hook: ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY,
    when: () => true,
    execute: ({ target }, engine) => {
      const adjacentOffsets = [
        { x: -1, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: -1 }, { x: 0, y: 1 }
      ];
      adjacentOffsets.forEach(offset => {
        const adjX = target.x + offset.x;
        const adjY = target.y + offset.y;
        const adjacentHero = engine.getLiveHeroes().find(h => h.x === adjX && h.y === adjY && h.bomba > 0);
        if (adjacentHero) {
          target.hp -= adjacentHero.bomba;
          engine.logCallback(`${adjacentHero.name}'s bomba deals ${adjacentHero.bomba} additional damage to ${target.name}! (HP left: ${target.hp})`);
          engine.emitEvent("damage.applied", { unitId: target.id, amount: adjacentHero.bomba, source: "bomba", actorId: adjacentHero.id });
        }
      });
    }
  },
  {
    id: "bulk",
    hook: ABILITY_HOOKS.ON_KILL,
    when: ({ attacker }) => attacker?.bulk > 0,
    execute: ({ attacker }, engine) => {
      const randomStat = pickStat(engine);
      if (!randomStat) return;
      attacker[randomStat] += attacker.bulk;
      engine.logCallback(`${attacker.name}'s bulk raises their ${randomStat} by ${attacker.bulk}! (New ${randomStat}: ${attacker[randomStat]})`);
      engine.emitEvent("stat.changed", { unitId: attacker.id, stat: randomStat, amount: attacker.bulk, source: "bulk" });
    }
  },
  {
    id: "rage",
    hook: ABILITY_HOOKS.ON_TAKE_DAMAGE,
    when: ({ target, prevented }) => target?.rage > 0 && !prevented && target.hp > 0,
    execute: ({ target }, engine) => {
      const randomStat = pickStat(engine);
      if (!randomStat) return;
      target[randomStat] += target.rage;
      engine.logCallback(`${target.name}'s rage boosts ${randomStat} by ${target.rage} (Now: ${target[randomStat]})`);
      engine.emitEvent("stat.changed", { unitId: target.id, stat: randomStat, amount: target.rage, source: "rage" });
    }
  },
  {
    id: "swarm",
    hook: ABILITY_HOOKS.ON_TURN_END,
    when: ({ heroes }) => Array.isArray(heroes) && heroes.some(hero => hero.swarm > 0),
    execute: ({ heroes }, engine) => {
      const adjacentOffsets = [
        { x: -1, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: -1 }, { x: -1, y: 1 },
        { x: 1, y: -1 }, { x: 1, y: 1 }
      ];
      heroes.forEach(hero => {
        if (hero.swarm <= 0) return;
        adjacentOffsets.forEach(offset => {
          const targetX = hero.x + offset.x;
          const targetY = hero.y + offset.y;
          if (!engine.isWithinBounds(targetX, targetY)) return;
          const enemy = engine.enemies.find(e => e.x === targetX && e.y === targetY);
          if (!enemy) return;
          enemy.hp -= hero.swarm;
          engine.logCallback(`${hero.name}'s swarm deals ${hero.swarm} damage to ${enemy.name} at (${targetX},${targetY}) (HP left: ${enemy.hp})`);
          engine.emitEvent("damage.applied", { unitId: enemy.id, amount: hero.swarm, source: "swarm", actorId: hero.id });
          if (enemy.hp <= 0) {
            engine.handleEnemyDefeat(enemy, {
              attacker: hero,
              cause: "swarm",
              message: `${enemy.name} is defeated by swarm damage!`
            });
          }
        });
      });
    }
  },
  createAnkhRule(ABILITY_HOOKS.ON_DEATH)
];

function createAnkhRule(hook) {
  return {
    id: "ankh",
    hook,
    when: ({ hero, outcome }) => Boolean(hero) && outcome === "permanent",
    execute: ({ hero }, engine) => {
      engine.getLiveHeroes().forEach(liveHero => {
        if (liveHero.ankh > 0) {
          const randomStat = engine.pickRandom(["attack", "hp", "agility", "range"]);
          if (!randomStat) return;
          liveHero[randomStat] += liveHero.ankh;
          engine.logCallback(`${liveHero.name} gains an ankh boost of ${liveHero.ankh} ${randomStat} (Now: ${liveHero[randomStat]}).`);
          engine.emitEvent("stat.changed", { unitId: liveHero.id, stat: randomStat, amount: liveHero.ankh, source: "ankh", triggerId: hero.id });
        }
      });
    }
  };
}

export function runBattleHook(engine, hook, context = {}) {
  const applied = [];
  for (const rule of RULES) {
    if (rule.hook !== hook) continue;
    if (typeof rule.when === "function" && !rule.when(context, engine)) continue;
    rule.execute(context, engine);
    applied.push(rule.id);
    if (context.stopProcessing) break;
  }
  if (applied.length > 0) {
    engine.emitEvent("hook.applied", {
      hook,
      rules: applied,
      actorId: context.hero?.id ?? context.attacker?.id ?? context.unit?.id ?? context.target?.id ?? null
    });
  }
  return applied;
}
