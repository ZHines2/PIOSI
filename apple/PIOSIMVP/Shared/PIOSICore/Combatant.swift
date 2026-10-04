import Foundation

public enum Team: String, Codable, Sendable {
    case hero
    case enemy
}

public struct CombatantBlueprint: Identifiable, Equatable, Codable, Sendable {
    public let id: String
    public let name: String
    public let symbol: String
    public let attack: Int
    public let range: Int
    public let agility: Int
    public let maxHP: Int
    public let startingPosition: GridPoint?

    public init(
        id: String,
        name: String,
        symbol: String,
        attack: Int,
        range: Int,
        agility: Int,
        maxHP: Int,
        startingPosition: GridPoint? = nil
    ) {
        self.id = id
        self.name = name
        self.symbol = symbol
        self.attack = attack
        self.range = range
        self.agility = agility
        self.maxHP = maxHP
        self.startingPosition = startingPosition
    }
}

public struct Combatant: Identifiable, Equatable, Codable, Sendable {
    public let id: String
    public let team: Team
    public var name: String
    public var symbol: String
    public var attack: Int
    public var range: Int
    public var agility: Int
    public var maxHP: Int
    public var hp: Int
    public var position: GridPoint

    public init(blueprint: CombatantBlueprint, team: Team, position: GridPoint) {
        self.id = blueprint.id
        self.team = team
        self.name = blueprint.name
        self.symbol = blueprint.symbol
        self.attack = blueprint.attack
        self.range = blueprint.range
        self.agility = blueprint.agility
        self.maxHP = blueprint.maxHP
        self.hp = blueprint.maxHP
        self.position = position
    }

    public init(
        id: String,
        team: Team,
        name: String,
        symbol: String,
        attack: Int,
        range: Int,
        agility: Int,
        maxHP: Int,
        hp: Int,
        position: GridPoint
    ) {
        self.id = id
        self.team = team
        self.name = name
        self.symbol = symbol
        self.attack = attack
        self.range = range
        self.agility = agility
        self.maxHP = maxHP
        self.hp = min(hp, maxHP)
        self.position = position
    }

    public var isAlive: Bool {
        hp > 0
    }

    public var summaryLine: String {
        "\(name) HP \(hp)/\(maxHP) • ATK \(attack) • RNG \(range) • AGI \(agility)"
    }
}
