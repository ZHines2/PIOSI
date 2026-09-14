import Foundation
import SwiftUI

@MainActor
final class BattleViewModel: ObservableObject {
    @Published private(set) var session = GameSession(content: .mvp)

    var screen: SessionScreen { session.screen }
    var encounter: EncounterState? { session.encounter }
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
        session.continuePrimaryAction()
    }

    func move(_ delta: GridPoint) {
        session.moveActiveHero(by: delta)
    }

    func attack(_ delta: GridPoint) {
        session.attack(in: delta)
    }

    func endTurn() {
        session.endTurn()
    }
}
