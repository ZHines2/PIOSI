import Foundation
import SwiftUI

@MainActor
final class BattleViewModel: ObservableObject {
    @Published private(set) var session = GameSession(content: .mvp)

    var screen: SessionScreen { session.screen }
    var encounter: EncounterState? { session.encounter }
    var availableHeroes: [CombatantBlueprint] { session.availableHeroes }
    var starterHeroNames: [String] { session.content.starterHeroes.map(\.name) }
    var selectedHeroIDs: Set<String> { Set(session.selectedHeroes.map(\.id)) }
    var partySizeLimit: Int { session.partySizeLimit }
    var canStartAdventure: Bool {
        !session.selectedHeroes.isEmpty && session.selectedHeroes.count == session.partySizeLimit
    }
    var titleText: String { session.titleText() }
    var subtitleText: String { session.subtitleText() }

    var primaryActionTitle: String {
        switch session.screen {
        case .title:
            return "Start Lite Campaign"
        case .briefing:
            return "Enter Battle"
        case .encounterVictory:
            return "Continue"
        case .campaignVictory, .defeat:
            return "Back to Title"
        case .battle:
            return ""
        }
    }

    func triggerPrimaryAction() {
        updateSession { $0.continuePrimaryAction() }
    }

    func toggleHeroSelection(_ heroID: String) {
        updateSession { $0.toggleHeroSelection(heroID) }
    }

    func move(_ delta: GridPoint) {
        updateSession { $0.moveActiveHero(by: delta) }
    }

    func attack(_ delta: GridPoint) {
        updateSession { $0.attack(in: delta) }
    }

    func endTurn() {
        updateSession { $0.endTurn() }
    }

    private func updateSession(_ mutate: (inout GameSession) -> Void) {
        var updatedSession = session
        mutate(&updatedSession)
        session = updatedSession
    }
}
