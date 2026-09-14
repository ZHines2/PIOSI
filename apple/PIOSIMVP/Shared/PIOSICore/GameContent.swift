import Foundation

public struct LevelDefinition: Identifiable, Equatable, Codable, Sendable {
    public let id: Int
    public let title: String
    public let summary: String
    public let rows: Int
    public let columns: Int
    public let wallHP: Int
    public let enemies: [CombatantBlueprint]

    public init(
        id: Int,
        title: String,
        summary: String,
        rows: Int,
        columns: Int,
        wallHP: Int,
        enemies: [CombatantBlueprint]
    ) {
        self.id = id
        self.title = title
        self.summary = summary
        self.rows = rows
        self.columns = columns
        self.wallHP = wallHP
        self.enemies = enemies
    }
}

public struct GameContent: Equatable, Sendable {
    public let starterHeroes: [CombatantBlueprint]
    public let levels: [LevelDefinition]

    public init(starterHeroes: [CombatantBlueprint], levels: [LevelDefinition]) {
        self.starterHeroes = starterHeroes
        self.levels = levels
    }

    public static let mvp = GameContent(
        starterHeroes: [
            CombatantBlueprint(id: "knight", name: "Knight", symbol: "♞", attack: 4, range: 1, agility: 4, maxHP: 18),
            CombatantBlueprint(id: "archer", name: "Archer", symbol: "⚔", attack: 3, range: 5, agility: 4, maxHP: 12),
            CombatantBlueprint(id: "wizard", name: "Wizard", symbol: "✡", attack: 2, range: 7, agility: 2, maxHP: 10)
        ],
        levels: [
            LevelDefinition(
                id: 1,
                title: "Level 1: The Breaking Wall",
                summary: "A stripped-back phone pass still opens at the wall: learn movement, spend turns, and break through.",
                rows: 5,
                columns: 5,
                wallHP: 20,
                enemies: []
            ),
            LevelDefinition(
                id: 2,
                title: "Level 2: The Reinforced Barricade",
                summary: "Two brigands now pressure the squad while the barricade still has to fall.",
                rows: 7,
                columns: 12,
                wallHP: 40,
                enemies: [
                    CombatantBlueprint(
                        id: "brigand-a",
                        name: "Brigand",
                        symbol: "Җ",
                        attack: 3,
                        range: 1,
                        agility: 2,
                        maxHP: 12,
                        startingPosition: GridPoint(x: 9, y: 3)
                    ),
                    CombatantBlueprint(
                        id: "brigand-b",
                        name: "Brigand",
                        symbol: "Җ",
                        attack: 3,
                        range: 1,
                        agility: 2,
                        maxHP: 12,
                        startingPosition: GridPoint(x: 7, y: 3)
                    )
                ]
            )
        ]
    )
}
