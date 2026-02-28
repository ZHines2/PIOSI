/// Level.swift
///
/// Defines level configurations for PIOSI, translated from levels.js.
/// Each LevelSetting describes the layout dimensions, wall HP, and enemies
/// for one level.  Dynamic levels use an `enemyGenerator` closure.

import Foundation

// MARK: - LevelSetting

public struct LevelSetting {
    public let level: Int
    public let title: String
    public let rows: Int
    public let cols: Int
    public let wallHP: Int
    /// Static enemy list; used when `enemyGenerator` is nil.
    public let staticEnemies: [EnemyTemplate]
    /// Closure that builds enemies dynamically given grid dimensions.
    public let enemyGenerator: ((_ rows: Int, _ cols: Int) -> [EnemyTemplate])?

    public init(
        level: Int,
        title: String,
        rows: Int,
        cols: Int,
        wallHP: Int,
        staticEnemies: [EnemyTemplate] = [],
        enemyGenerator: ((_ rows: Int, _ cols: Int) -> [EnemyTemplate])? = nil
    ) {
        self.level = level
        self.title = title
        self.rows = rows
        self.cols = cols
        self.wallHP = wallHP
        self.staticEnemies = staticEnemies
        self.enemyGenerator = enemyGenerator
    }
}

// MARK: - EnemyTemplate

/// A value-type blueprint used to spawn Enemy instances for a level.
public struct EnemyTemplate {
    public let name: String
    public let symbol: String
    public let attack: Int
    public let range: Int
    public let agility: Int
    public let hp: Int
    public let x: Int
    public let y: Int
    public let dodge: Int
    public let dialogue: [String]

    public init(
        name: String,
        symbol: String,
        attack: Int,
        range: Int,
        agility: Int,
        hp: Int,
        x: Int,
        y: Int,
        dodge: Int = 0,
        dialogue: [String] = []
    ) {
        self.name = name
        self.symbol = symbol
        self.attack = attack
        self.range = range
        self.agility = agility
        self.hp = hp
        self.x = x
        self.y = y
        self.dodge = dodge
        self.dialogue = dialogue
    }

    /// Instantiates an Enemy from this template.
    public func makeEnemy() -> Enemy {
        Enemy(
            name: name, symbol: symbol,
            attack: attack, range: range, agility: agility, hp: hp,
            x: x, y: y, dodge: dodge, dialogue: dialogue
        )
    }
}

// MARK: - Random helpers

private func randomInt(_ min: Int, _ max: Int) -> Int {
    guard min <= max else { return min }
    return Int.random(in: min...max)
}

// MARK: - Level catalogue

/// Full level catalogue mirroring the levelSettings array in levels.js.
public let levelSettings: [LevelSetting] = [

    LevelSetting(level: 1, title: "Level 1: The Breaking Wall",
                 rows: 5, cols: 5, wallHP: 20),

    LevelSetting(level: 2, title: "Level 2: The Reinforced Barricade",
                 rows: 7, cols: 12, wallHP: 40,
                 staticEnemies: [
                    EnemyTemplate(name: "Brigand", symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 9, y: 3),
                    EnemyTemplate(name: "Brigand", symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 7, y: 3),
                 ]),

    LevelSetting(level: 3, title: "Level 3: The Vertical Corridor",
                 rows: 14, cols: 4, wallHP: 60,
                 enemyGenerator: { rows, cols in
                     (0..<cols).map { col in
                         EnemyTemplate(name: "Coterian", symbol: "ꕥ", attack: 1, range: 1, agility: 22, hp: 55,
                                       x: col, y: rows / 2)
                     }
                 }),

    LevelSetting(level: 4, title: "Level 4: Outside the Gratt",
                 rows: 3, cols: 15, wallHP: 70,
                 staticEnemies: [
                    EnemyTemplate(name: "Brigand",   symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 12, y: 0),
                    EnemyTemplate(name: "Brigand",   symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 11, y: 1),
                    EnemyTemplate(name: "Buckleman", symbol: "⛨", attack: 1, range: 1, agility: 1, hp: 25, x:  8, y: 2),
                    EnemyTemplate(name: "Brigand",   symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 12, y: 2),
                 ]),

    LevelSetting(level: 5, title: "Level 5: Gratt ߁",
                 rows: 10, cols: 8, wallHP: 50,
                 staticEnemies: [
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 1, y: 5),
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 2, y: 5),
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 3, y: 5),
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 4, y: 5),
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 5),
                    EnemyTemplate(name: "Static Wall",   symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 6, y: 5),
                    EnemyTemplate(name: "Brigand",       symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 1, y: 4),
                    EnemyTemplate(name: "Brigand",       symbol: "Җ", attack: 3, range: 1, agility: 2, hp: 12, x: 2, y: 4),
                    EnemyTemplate(name: "Buckleman",     symbol: "⛨", attack: 1, range: 1, agility: 1, hp: 20, x: 3, y: 4),
                    EnemyTemplate(name: "Getter",        symbol: "∴", attack: 5, range: 1, agility: 5, hp: 55, x: 4, y: 6),
                    EnemyTemplate(name: "Stonch Hogan",  symbol: "酉", attack: 8, range: 1, agility: 3, hp: 150, x: 5, y: 6),
                    EnemyTemplate(name: "Taker",         symbol: "∵", attack: 1, range: 5, agility: 5, hp: 55, x: 6, y: 6),
                 ]),

    LevelSetting(level: 6, title: "Level 6: Gratt ߁ Antefoyer",
                 rows: 7, cols: 6, wallHP: 100,
                 staticEnemies: [
                    EnemyTemplate(name: "Tsortuf Hōsse", symbol: "ꁽ", attack: 10, range: 1, agility: 2,  hp: 100, x: 1, y: 1),
                    EnemyTemplate(name: "Zoot Alorre",   symbol: "ꍕ", attack: 5,  range: 1, agility: 19, hp: 100, x: 4, y: 4),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 4, y: 0),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 0),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 1),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 2, y: 2),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 3, y: 2),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 2),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 0, y: 3),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 2, y: 3),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 3, y: 3),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 3),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 0, y: 4),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 4),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 0, y: 5),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 1, y: 5),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 2, y: 5),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 3, y: 5),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 4, y: 5),
                    EnemyTemplate(name: "Wall", symbol: "█", attack: 0, range: 0, agility: 0, hp: 50, x: 5, y: 5),
                 ]),

    LevelSetting(level: 7, title: "Level 7: Vestibule",
                 rows: 8, cols: 8, wallHP: 75,
                 enemyGenerator: { rows, cols in
                     (0..<5).map { _ in
                         EnemyTemplate(name: "Intender", symbol: "ꘐ", attack: 10, range: 10, agility: 10, hp: 75,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1))
                     }
                 }),

    LevelSetting(level: 8, title: "Level 8: Shaded Yod",
                 rows: 9, cols: 8, wallHP: 100,
                 staticEnemies: [
                    EnemyTemplate(name: "Əkaisee",    symbol: "ੴ", attack: 10, range: 1,  agility: 10, hp: 88, x: 2, y: 2),
                    EnemyTemplate(name: "Duppie Zero", symbol: "ਔ", attack: 10, range: 10, agility: 1,  hp: 99, x: 7, y: 7),
                 ]),

    LevelSetting(level: 9, title: "Level 9: Further Discussion",
                 rows: 12, cols: 12, wallHP: 200,
                 staticEnemies: [
                    EnemyTemplate(name: "Steelgaze",    symbol: "Ⳃ", attack: 15, range: 1, agility: 4, hp: 200, x: 3, y: 3),
                    EnemyTemplate(name: "Steelgaze",    symbol: "Ⳃ", attack: 15, range: 1, agility: 4, hp: 200, x: 4, y: 4),
                    EnemyTemplate(name: "Steelgaze",    symbol: "Ⳃ", attack: 15, range: 1, agility: 4, hp: 200, x: 5, y: 5),
                    EnemyTemplate(name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, agility: 2, hp: 200, x: 8, y: 8),
                    EnemyTemplate(name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, agility: 2, hp: 200, x: 9, y: 9),
                    EnemyTemplate(name: "Boughsplitter", symbol: "⳧", attack: 20, range: 2, agility: 2, hp: 200, x: 10, y: 10),
                 ]),

    LevelSetting(level: 10, title: "Level 10: Introspections of ߁",
                 rows: 10, cols: 10, wallHP: 350,
                 staticEnemies: {
                     var enemies = [EnemyTemplate(name: "Ge'umdaïƨe", symbol: "⅌", attack: 100, range: 6, agility: 6, hp: 1000, x: 6, y: 6)]
                     for col in 0..<10 {
                         enemies.append(EnemyTemplate(name: "Coterian", symbol: "ꕥ", attack: 1, range: 1, agility: 22, hp: 55, x: col, y: 7))
                     }
                     return enemies
                 }()),

    LevelSetting(level: 11, title: "Level 11: The Hidden Depths",
                 rows: 8, cols: 8, wallHP: 400,
                 enemyGenerator: { rows, cols in
                     (0..<5).map { _ in
                         EnemyTemplate(name: "Shadow Stalker", symbol: "☾", attack: 15, range: 2, agility: 5, hp: 100,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1),
                                       dialogue: ["You cannot escape the shadows!", "I am the darkness."])
                     }
                 }),

    LevelSetting(level: 12, title: "Level 12: The Forgotten Ruins",
                 rows: 9, cols: 9, wallHP: 450,
                 staticEnemies: [
                    EnemyTemplate(name: "Ancient Guardian", symbol: "⚔", attack: 20, range: 1, agility: 3, hp: 200, x: 4, y: 4, dialogue: ["You shall not pass!", "I guard these ruins."]),
                    EnemyTemplate(name: "Ancient Guardian", symbol: "⚔", attack: 20, range: 1, agility: 3, hp: 200, x: 3, y: 3, dialogue: ["You shall not pass!", "I guard these ruins."]),
                    EnemyTemplate(name: "Ancient Guardian", symbol: "⚔", attack: 20, range: 1, agility: 3, hp: 200, x: 5, y: 5, dialogue: ["You shall not pass!", "I guard these ruins."]),
                 ]),

    LevelSetting(level: 13, title: "Level 13: The Abyssal Chasm",
                 rows: 10, cols: 10, wallHP: 500,
                 enemyGenerator: { rows, cols in
                     (0..<7).map { _ in
                         EnemyTemplate(name: "Abyssal Fiend", symbol: "⛧", attack: 25, range: 3, agility: 4, hp: 150,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1),
                                       dialogue: ["The abyss consumes all!", "You will be devoured."])
                     }
                 }),

    LevelSetting(level: 14, title: "Level 14: The Enchanted Forest",
                 rows: 11, cols: 11, wallHP: 550,
                 staticEnemies: [
                    EnemyTemplate(name: "Forest Spirit", symbol: "♆", attack: 30, range: 2, agility: 6, hp: 250, x: 5, y: 5, dialogue: ["The forest protects us!", "You shall not harm nature."]),
                    EnemyTemplate(name: "Forest Spirit", symbol: "♆", attack: 30, range: 2, agility: 6, hp: 250, x: 4, y: 4, dialogue: ["The forest protects us!", "You shall not harm nature."]),
                    EnemyTemplate(name: "Forest Spirit", symbol: "♆", attack: 30, range: 2, agility: 6, hp: 250, x: 6, y: 6, dialogue: ["The forest protects us!", "You shall not harm nature."]),
                 ]),

    LevelSetting(level: 15, title: "Level 15: The Crystal Caverns",
                 rows: 12, cols: 12, wallHP: 600,
                 enemyGenerator: { rows, cols in
                     (0..<10).map { _ in
                         EnemyTemplate(name: "Crystal Golem", symbol: "♦", attack: 35, range: 1, agility: 2, hp: 300,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1),
                                       dialogue: ["You will shatter!", "Feel the power of the crystals."])
                     }
                 }),

    LevelSetting(level: 16, title: "Level 16: The Infernal Pit",
                 rows: 13, cols: 13, wallHP: 650,
                 staticEnemies: [
                    EnemyTemplate(name: "Infernal Demon", symbol: "♨", attack: 40, range: 3, agility: 5, hp: 350, x: 6, y: 6, dialogue: ["Burn in the flames!", "You cannot withstand the heat."]),
                    EnemyTemplate(name: "Infernal Demon", symbol: "♨", attack: 40, range: 3, agility: 5, hp: 350, x: 5, y: 5, dialogue: ["Burn in the flames!", "You cannot withstand the heat."]),
                    EnemyTemplate(name: "Infernal Demon", symbol: "♨", attack: 40, range: 3, agility: 5, hp: 350, x: 7, y: 7, dialogue: ["Burn in the flames!", "You cannot withstand the heat."]),
                 ]),

    LevelSetting(level: 17, title: "Level 17: The Celestial Spire",
                 rows: 14, cols: 14, wallHP: 700,
                 enemyGenerator: { rows, cols in
                     (0..<12).map { _ in
                         EnemyTemplate(name: "Celestial Guardian", symbol: "✪", attack: 45, range: 2, agility: 4, hp: 400,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1),
                                       dialogue: ["The stars guide us!", "You cannot reach the heavens."])
                     }
                 }),

    LevelSetting(level: 18, title: "Level 18: The Arcane Sanctum",
                 rows: 15, cols: 15, wallHP: 750,
                 staticEnemies: [
                    EnemyTemplate(name: "Arcane Sentinel", symbol: "⚚", attack: 50, range: 4, agility: 6, hp: 450, x: 7, y: 7, dialogue: ["The arcane protects us!", "You shall not breach our sanctum."]),
                    EnemyTemplate(name: "Arcane Sentinel", symbol: "⚚", attack: 50, range: 4, agility: 6, hp: 450, x: 6, y: 6, dialogue: ["The arcane protects us!", "You shall not breach our sanctum."]),
                    EnemyTemplate(name: "Arcane Sentinel", symbol: "⚚", attack: 50, range: 4, agility: 6, hp: 450, x: 8, y: 8, dialogue: ["The arcane protects us!", "You shall not breach our sanctum."]),
                 ]),

    LevelSetting(level: 19, title: "Level 19: The Void Realm",
                 rows: 16, cols: 16, wallHP: 800,
                 enemyGenerator: { rows, cols in
                     (0..<15).map { _ in
                         EnemyTemplate(name: "Void Wraith", symbol: "☠", attack: 55, range: 3, agility: 5, hp: 500,
                                       x: randomInt(0, cols - 1), y: randomInt(0, rows - 1),
                                       dialogue: ["The void consumes all!", "You will be lost in the void."])
                     }
                 }),

    LevelSetting(level: 20, title: "Level 20: The Final Confrontation",
                 rows: 17, cols: 17, wallHP: 850,
                 staticEnemies: [
                    EnemyTemplate(name: "Eternal Overlord", symbol: "♛", attack: 60, range: 5, agility: 7, hp: 1000, x: 8, y: 8, dialogue: ["You cannot defeat me!", "I am eternal."]),
                    EnemyTemplate(name: "Eternal Overlord", symbol: "♛", attack: 60, range: 5, agility: 7, hp: 1000, x: 7, y: 7, dialogue: ["You cannot defeat me!", "I am eternal."]),
                    EnemyTemplate(name: "Eternal Overlord", symbol: "♛", attack: 60, range: 5, agility: 7, hp: 1000, x: 9, y: 9, dialogue: ["You cannot defeat me!", "I am eternal."]),
                 ]),

    LevelSetting(level: 99, title: "Level ௧: Further Introspection",
                 rows: 15, cols: 15, wallHP: 100,
                 enemyGenerator: { rows, cols in
                     let types: [(name: String, symbol: String, attack: Int, range: Int, agility: Int, hp: Int, dialogue: [String])] = [
                         ("Chess Pawn",   "♙", 2, 1, 2,  50, ["advance - with silent determination."]),
                         ("Chess Knight", "♘", 4, 2, 5,  55, ["leap - into battle with tactical prowess."]),
                         ("Chess Bishop", "♗", 3, 3, 10, 120, ["glide - strike from afar with precision."]),
                     ]
                     let formationRows = 3
                     let startRow = rows - formationRows - 1
                     var enemies: [EnemyTemplate] = []
                     for r in startRow..<(rows - 1) {
                         for c in 0..<cols {
                             let t = types[(r + c) % types.count]
                             enemies.append(EnemyTemplate(name: t.name, symbol: t.symbol,
                                                          attack: t.attack, range: t.range, agility: t.agility, hp: t.hp,
                                                          x: c, y: r, dialogue: t.dialogue))
                         }
                     }
                     return enemies
                 }),
]

// MARK: - Level lookup

/// Returns a configured Level for the given level number, or nil if not found.
public func getLevel(_ levelNumber: Int) -> ResolvedLevel? {
    guard let setting = levelSettings.first(where: { $0.level == levelNumber }) else { return nil }
    let enemies: [Enemy]
    if let gen = setting.enemyGenerator {
        enemies = gen(setting.rows, setting.cols).map { $0.makeEnemy() }
    } else {
        enemies = setting.staticEnemies.map { $0.makeEnemy() }
    }
    return ResolvedLevel(
        rows: setting.rows,
        cols: setting.cols,
        wallHP: setting.wallHP,
        title: setting.title,
        enemies: enemies
    )
}

/// A fully-resolved level ready for BattleEngine consumption.
public struct ResolvedLevel {
    public let rows: Int
    public let cols: Int
    public let wallHP: Int
    public let title: String
    public let enemies: [Enemy]
}
