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

public struct UnlockableHero: Equatable, Sendable {
    public let hero: CombatantBlueprint
    public let requiredEncounterWins: Int

    public init(hero: CombatantBlueprint, requiredEncounterWins: Int) {
        self.hero = hero
        self.requiredEncounterWins = max(1, requiredEncounterWins)
    }
}

public struct CampaignProgress: Codable, Equatable, Sendable {
    public static let currentSchemaVersion = 1

    public let schemaVersion: Int
    public let selectedHeroIDs: [String]
    public let unlockedHeroIDs: [String]
    public let completedEncounterCount: Int

    public init(
        schemaVersion: Int = CampaignProgress.currentSchemaVersion,
        selectedHeroIDs: [String],
        unlockedHeroIDs: [String],
        completedEncounterCount: Int
    ) {
        self.schemaVersion = schemaVersion
        self.selectedHeroIDs = selectedHeroIDs
        self.unlockedHeroIDs = unlockedHeroIDs
        self.completedEncounterCount = max(0, completedEncounterCount)
    }
}

public protocol CampaignProgressStore: Sendable {
    func load() -> CampaignProgress?
    func save(_ progress: CampaignProgress)
}

public struct NoopCampaignProgressStore: CampaignProgressStore {
    public init() {}

    public func load() -> CampaignProgress? { nil }
    public func save(_ progress: CampaignProgress) {}
}

public final class UserDefaultsCampaignProgressStore: CampaignProgressStore, @unchecked Sendable {
    static let storageKey = "piosi.campaignProgress"
    private let defaults: UserDefaults
    private let preservesFutureSchema: Bool

    public init(suiteName: String? = nil) {
        let defaults: UserDefaults
        if let suiteName {
            defaults = UserDefaults(suiteName: suiteName) ?? .standard
        } else {
            defaults = .standard
        }
        self.defaults = defaults
        self.preservesFutureSchema = Self.hasNewerSchema(defaults.data(forKey: Self.storageKey))
    }

    public func load() -> CampaignProgress? {
        guard let data = defaults.data(forKey: Self.storageKey) else { return nil }
        guard let progress = try? JSONDecoder().decode(CampaignProgress.self, from: data),
              progress.schemaVersion == CampaignProgress.currentSchemaVersion else {
            return nil
        }
        return progress
    }

    /// Saves current-version progress unless the stored record is from a newer app schema.
    public func save(_ progress: CampaignProgress) {
        guard !preservesFutureSchema else { return }
        guard let data = try? JSONEncoder().encode(progress) else {
            assertionFailure("Campaign progress could not be encoded.")
            return
        }
        defaults.set(data, forKey: Self.storageKey)
    }

    private struct CampaignProgressSchema: Decodable {
        let schemaVersion: Int
    }

    private static func hasNewerSchema(_ data: Data?) -> Bool {
        guard let data,
              let schema = try? JSONDecoder().decode(CampaignProgressSchema.self, from: data) else {
            return false
        }
        return schema.schemaVersion > CampaignProgress.currentSchemaVersion
    }
}

public struct GameContent: Equatable, Sendable {
    public let starterHeroes: [CombatantBlueprint]
    public let partySizeLimit: Int
    public let unlockableHeroes: [UnlockableHero]
    public let levels: [LevelDefinition]

    public init(
        starterHeroes: [CombatantBlueprint],
        partySizeLimit: Int = 3,
        unlockableHeroes: [UnlockableHero] = [],
        levels: [LevelDefinition]
    ) {
        self.starterHeroes = starterHeroes
        // An empty starter roster intentionally yields a zero-sized party.
        self.partySizeLimit = min(max(1, partySizeLimit), starterHeroes.count)
        self.unlockableHeroes = unlockableHeroes
        self.levels = levels
    }

    public static let mvp = GameContent(
        starterHeroes: [
            CombatantBlueprint(id: "knight", name: "Knight", symbol: "♞", attack: 4, range: 1, agility: 4, maxHP: 18),
            CombatantBlueprint(id: "archer", name: "Archer", symbol: "⚔", attack: 3, range: 5, agility: 4, maxHP: 12),
            CombatantBlueprint(id: "rogue", name: "Rogue", symbol: "☠", attack: 4, range: 2, agility: 6, maxHP: 12)
        ],
        unlockableHeroes: [
            UnlockableHero(
                hero: CombatantBlueprint(id: "wizard", name: "Wizard", symbol: "✡", attack: 2, range: 7, agility: 2, maxHP: 10),
                requiredEncounterWins: 2
            )
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
