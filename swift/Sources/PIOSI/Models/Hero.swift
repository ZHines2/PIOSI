/// Hero.swift
///
/// Defines the Hero data model for PIOSI.
/// Each hero has base combat stats plus optional special-ability stats
/// that mirror the JavaScript `heroes` array in heroes.js.

import Foundation

// MARK: - StatusEffects

/// Tracks transient per-battle status conditions on a unit.
public struct StatusEffects {
    public var burn: BurnEffect?
    public var sluj: SlujEffect?
    public var isDead: Bool = false

    public init() {}
}

public struct BurnEffect {
    public var damage: Int
    public var duration: Int
    public init(damage: Int, duration: Int) {
        self.damage = damage
        self.duration = duration
    }
}

public struct SlujEffect {
    public var level: Int
    public var duration: Int
    public var counter: Int
    public init(level: Int, duration: Int, counter: Int = 0) {
        self.level = level
        self.duration = duration
        self.counter = counter
    }
}

// MARK: - PersistentDeath

/// Marks a hero as permanently dead (persists across level transitions).
public final class PersistentDeath {
    public let isDead: Bool = true
    public init() {}
}

// MARK: - Hero

/// A playable hero character.
public class Hero: Identifiable {
    public let id: UUID
    public let name: String
    public let symbol: String
    public let spriteName: String  // asset name without path prefix

    // Core combat stats
    public var attack: Int
    public var range: Int
    public var agility: Int
    public var hp: Int

    // Optional special-ability stats (nil means the hero does not have this ability)
    public var chain: Int?      // bonus chain damage to adjacent enemies
    public var rage: Int?       // stat boost when attacked
    public var heal: Int?       // healing power when targeting an ally
    public var joke: Bool       // humorous interactions
    public var trick: Int?      // debuffs a random enemy stat on hit
    public var meat: Bool       // meat-related interactions
    public var bulk: Int?
    public var tarot: Bool      // can fetch tarot cards
    public var fate: Int?       // random stat change each level
    public var nonseq: Bool     // delivers random non-sequitur interactions
    public var caprice: Int?    // random stat boost each level
    public var torcher: Bool    // burning property
    public var burn: Int?       // burn damage value
    public var sluj: Int?       // slüj affliction stat
    public var shrink: Bool     // shrink-related behaviour
    public var psych: Int?      // boosts a random stat of an ally on attack
    public var yeet: Int?       // knockback distance
    public var swarm: Int?      // passive damage to adjacent enemies each turn
    public var spicy: Int?      // increases vittle healing
    public var recipe: Bool     // recipe-related interactions
    public var armor: Int?      // absorbs damage before HP is reduced
    public var spore: Int?      // random stat gain from mushrooms
    public var ghis: Int?
    public var ankh: Int?       // boosts live heroes when a hero dies
    public var rise: Int        // resurrect with `rise` HP instead of dying
    public var dodge: Int       // chance to avoid incoming attacks
    public var bomba: Int?      // bonus damage to enemies attacked by another hero

    // Battle-state fields (reset each battle)
    public var x: Int = 0
    public var y: Int = 0
    public var statusEffects: StatusEffects = StatusEffects()
    public var persistentDeath: PersistentDeath?

    public init(
        name: String,
        symbol: String,
        spriteName: String,
        attack: Int,
        range: Int,
        agility: Int,
        hp: Int,
        chain: Int? = nil,
        rage: Int? = nil,
        heal: Int? = nil,
        joke: Bool = false,
        trick: Int? = nil,
        meat: Bool = false,
        bulk: Int? = nil,
        tarot: Bool = false,
        fate: Int? = nil,
        nonseq: Bool = false,
        caprice: Int? = nil,
        torcher: Bool = false,
        burn: Int? = nil,
        sluj: Int? = nil,
        shrink: Bool = false,
        psych: Int? = nil,
        yeet: Int? = nil,
        swarm: Int? = nil,
        spicy: Int? = nil,
        recipe: Bool = false,
        armor: Int? = nil,
        spore: Int? = nil,
        ghis: Int? = nil,
        ankh: Int? = nil,
        rise: Int = 0,
        dodge: Int = 0,
        bomba: Int? = nil
    ) {
        self.id = UUID()
        self.name = name
        self.symbol = symbol
        self.spriteName = spriteName
        self.attack = attack
        self.range = range
        self.agility = agility
        self.hp = hp
        self.chain = chain
        self.rage = rage
        self.heal = heal
        self.joke = joke
        self.trick = trick
        self.meat = meat
        self.bulk = bulk
        self.tarot = tarot
        self.fate = fate
        self.nonseq = nonseq
        self.caprice = caprice
        self.torcher = torcher
        self.burn = burn
        self.sluj = sluj
        self.shrink = shrink
        self.psych = psych
        self.yeet = yeet
        self.swarm = swarm
        self.spicy = spicy
        self.recipe = recipe
        self.armor = armor
        self.spore = spore
        self.ghis = ghis
        self.ankh = ankh
        self.rise = rise
        self.dodge = dodge
        self.bomba = bomba
    }
}

// MARK: - Hero catalogue

/// Returns a fresh copy of all heroes, matching the heroes.js catalogue.
public func makeHeroes() -> [Hero] {
    [
        Hero(name: "Knight",       symbol: "♞",  spriteName: "Knight",       attack: 4, range: 1, agility: 4, hp: 18),
        Hero(name: "Archer",       symbol: "⚔",  spriteName: "Archer",       attack: 3, range: 5, agility: 4, hp: 12),
        Hero(name: "Wizard",       symbol: "✡",  spriteName: "Wizard",       attack: 2, range: 7, agility: 2, hp: 10,  chain: 5),
        Hero(name: "Berserker",    symbol: "⚒",  spriteName: "Berserker",    attack: 6, range: 1, agility: 3, hp: 20,  rage: 1),
        Hero(name: "Rogue",        symbol: "☠",  spriteName: "Rogue",        attack: 4, range: 2, agility: 6, hp: 12),
        Hero(name: "Cleric",       symbol: "✝",  spriteName: "Cleric",       attack: 2, range: 1, agility: 3, hp: 12,  heal: 4),
        Hero(name: "Jester",       symbol: "♣",  spriteName: "Jester",       attack: 3, range: 2, agility: 5, hp: 10,  joke: true, trick: 1),
        Hero(name: "Meatwalker",   symbol: "₻",  spriteName: "Meatwalker",   attack: 7, range: 1, agility: 2, hp: 22,  heal: 1, meat: true, bulk: 1),
        Hero(name: "Soothscribe",  symbol: "☄",  spriteName: "Soothscribe",  attack: 2, range: 6, agility: 3, hp: 11,  tarot: true, fate: 1),
        Hero(name: "Nonsequiteur", symbol: "∄",  spriteName: "Nonsequiteur", attack: 3, range: 3, agility: 3, hp: 10,  nonseq: true, caprice: 1),
        Hero(name: "Griot",        symbol: "℣",  spriteName: "Griot",        attack: 1, range: 1, agility: 1, hp: 10),
        Hero(name: "Torcher",      symbol: "⚶",  spriteName: "Torcher",      attack: 4, range: 2, agility: 3, hp: 14,  torcher: true, burn: 1),
        Hero(name: "Slüjier",      symbol: "🜜", spriteName: "Slujier",      attack: 5, range: 1, agility: 4, hp: 16,  sluj: 1),
        Hero(name: "Shrink",       symbol: "☊",  spriteName: "Shrink",       attack: 2, range: 1, agility: 3, hp: 12,  shrink: true, psych: 1),
        Hero(name: "Sycophant",    symbol: "♟",  spriteName: "Sycophant",    attack: 0, range: 0, agility: 2, hp: 15),
        Hero(name: "Yeetrian",     symbol: "⛓",  spriteName: "Yeetrian",     attack: 3, range: 2, agility: 4, hp: 14,  yeet: 1),
        Hero(name: "Mellitron",    symbol: "丰", spriteName: "Mellitron",    attack: 1, range: 3, agility: 5, hp: 18,  swarm: 2),
        Hero(name: "Gastronomer",  symbol: "𑍐", spriteName: "Gastronomer",  attack: 2, range: 1, agility: 3, hp: 15,  spicy: 1, recipe: true),
        Hero(name: "Palisade",     symbol: "ᱟ",  spriteName: "Palisade",     attack: 3, range: 1, agility: 2, hp: 20,  armor: 5),
        Hero(name: "Mycelian",     symbol: "ৡ",  spriteName: "Mycelian",     attack: 2, range: 1, agility: 3, hp: 15,  spore: 1),
        Hero(name: "Pæg",          symbol: "ꚤ",  spriteName: "Paeg",         attack: 1, range: 1, agility: 1, hp: 1,
             chain: 1, heal: 1, burn: 1, sluj: 1, yeet: 1, swarm: 1, spicy: 1, armor: 1, spore: 1, ghis: 1),
        Hero(name: "Kemetic",      symbol: "𓋇", spriteName: "Kemetic",      attack: 5, range: 5, agility: 5, hp: 25,  ankh: 5),
        Hero(name: "Greenjay",     symbol: "࿈",  spriteName: "Greenjay",     attack: 5, range: 2, agility: 4, hp: 30,  rise: 5),
        Hero(name: "Sysiphuge",    symbol: "₾",  spriteName: "Sysiphuge",    attack: 4, range: 1, agility: 4, hp: 16,  dodge: 4),
        Hero(name: "Bombador",     symbol: "❦",  spriteName: "Bombador",     attack: 2, range: 1, agility: 6, hp: 20,  bomba: 5),
    ]
}
