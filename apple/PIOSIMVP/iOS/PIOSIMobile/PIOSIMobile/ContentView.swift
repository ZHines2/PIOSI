import SwiftUI

struct ContentView: View {
    @ObservedObject var viewModel: BattleViewModel

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    bodyContent
                }
                .padding(20)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(viewModel.titleText)
                .font(.system(size: 32, weight: .bold, design: .rounded))
            Text(viewModel.subtitleText)
                .font(.body)
                .foregroundStyle(.secondary)
            if let warning = viewModel.campaignProgressWarning {
                Text(warning)
                    .font(.footnote)
                    .foregroundStyle(.orange)
            }
        }
    }

    @ViewBuilder
    private var bodyContent: some View {
        switch viewModel.screen {
        case .title, .briefing, .encounterVictory, .campaignVictory, .defeat:
            stageCard
        case .battle:
            if let encounter = viewModel.encounter {
                BattleScreen(encounter: encounter, viewModel: viewModel)
            }
        }
    }

    private var stageCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(stageCopy)
                .font(.headline)
            if case .title = viewModel.screen {
                heroSelection
            }
            Button(viewModel.primaryActionTitle, action: viewModel.triggerPrimaryAction)
                .buttonStyle(PrimaryCTAButtonStyle())
                .disabled(viewModel.screen == .title && !viewModel.canStartAdventure)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.08))
        )
    }

    private var heroSelection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Choose your squad (\(viewModel.selectedHeroIDs.count)/\(viewModel.partySizeLimit))")
                .font(.subheadline.weight(.semibold))
            if viewModel.availableHeroes.isEmpty {
                Text("No heroes are available.")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(viewModel.availableHeroes) { hero in
                    let isSelected = viewModel.selectedHeroIDs.contains(hero.id)
                    Button {
                        viewModel.toggleHeroSelection(hero.id)
                    } label: {
                        HStack {
                            Text(hero.symbol)
                            Text(hero.name)
                            Spacer()
                            Label(isSelected ? "Selected" : "Add", systemImage: isSelected ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(isSelected ? .green : .secondary)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(Color.white.opacity(isSelected ? 0.12 : 0.05))
                        )
                        .accessibilityElement(children: .ignore)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(isSelected ? "Remove" : "Add") \(hero.name) \(isSelected ? "from" : "to") squad")
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }
        }
    }

    private var stageCopy: String {
        switch viewModel.screen {
        case .title:
            let starterNames = viewModel.starterHeroNames.joined(separator: ", ")
            return starterNames.isEmpty
                ? "No heroes are available for this campaign."
                : "Begin with \(starterNames). Choose \(viewModel.partySizeLimit) heroes from your available roster."
        case .briefing:
            return "Prepare your squad, break through the wall, and press on to the next encounter."
        case .encounterVictory:
            return "The squad punched through this barricade. Move on to the next story beat in the lite campaign."
        case .campaignVictory:
            return "You finished the first-pass mobile slice. Phase 2 can add the full hero roster, Mode Up, the world map, and more content without replacing the core state layer."
        case .defeat:
            return "The party was wiped out. Restart from the title to try the mobile route again."
        case .battle:
            return ""
        }
    }
}

private struct BattleScreen: View {
    let encounter: EncounterState
    @ObservedObject var viewModel: BattleViewModel

    private let boardSpacing: CGFloat = 6

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            battleSummary
            board
            actionPads
            partyCards
            battleLog
        }
    }

    private var battleSummary: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Active: \(encounter.activeHero?.name ?? "-")")
                .font(.headline)
            Text("Move \(encounter.remainingMovePoints) • Wall HP \(max(0, encounter.wallHP)) • Turn \(encounter.turnCount)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.06)))
    }

    private var board: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: boardSpacing), count: encounter.level.columns)
        return LazyVGrid(columns: columns, spacing: boardSpacing) {
            ForEach(0..<encounter.level.rows, id: \.self) { row in
                ForEach(0..<encounter.level.columns, id: \.self) { column in
                    BoardCell(tile: encounter.tile(at: GridPoint(x: column, y: row)))
                }
            }
        }
    }

    private var actionPads: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Move")
                .font(.headline)
            DPad(centerTitle: "Wait", actionLabelPrefix: "Move") { direction in
                if let direction {
                    viewModel.move(direction)
                } else {
                    viewModel.endTurn()
                }
            }

            Text("Attack")
                .font(.headline)
            DPad(centerTitle: "End", actionLabelPrefix: "Attack") { direction in
                if let direction {
                    viewModel.attack(direction)
                } else {
                    viewModel.endTurn()
                }
            }
        }
    }

    private var partyCards: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Squad")
                .font(.headline)
            ForEach(encounter.heroes, id: \.id) { hero in
                HStack {
                    Text(hero.symbol)
                    Text(hero.summaryLine)
                        .foregroundStyle(hero.isAlive ? .primary : .secondary)
                    Spacer()
                }
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white.opacity(hero.isAlive ? 0.06 : 0.03)))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(hero.summaryLine)
            }
        }
    }

    private var battleLog: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Latest Events")
                .font(.headline)
            ForEach(Array(encounter.log.enumerated()), id: \.offset) { _, line in
                Text(line)
                    .font(.footnote.monospaced())
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.06)))
        .accessibilityElement(children: .contain)
        .accessibilityLiveRegion(.polite)
    }
}

private struct BoardCell: View {
    let tile: BoardTile

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(backgroundColor)
                .frame(height: 34)
            Text(symbol)
                .font(.system(size: 18, weight: .bold, design: .rounded))
        }
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(tileAccessibilityLabel)
    }

    private var symbol: String {
        switch tile {
        case .empty:
            return "·"
        case .wall:
            return "ᚙ"
        case .hero(let hero, _):
            return hero.symbol
        case .enemy(let enemy):
            return enemy.symbol
        }
    }

    private var backgroundColor: Color {
        switch tile {
        case .empty:
            return Color.white.opacity(0.05)
        case .wall:
            return Color.orange.opacity(0.35)
        case .hero(_, let isActive):
            return isActive ? Color.blue.opacity(0.65) : Color.teal.opacity(0.45)
        case .enemy:
            return Color.red.opacity(0.55)
        }
    }

    private var borderColor: Color {
        switch tile {
        case .hero(_, let isActive):
            return isActive ? .white : .clear
        default:
            return .clear
        }
    }

    private var tileAccessibilityLabel: String {
        switch tile {
        case .empty:
            return "Empty tile"
        case .wall:
            return "Wall"
        case .hero(let hero, let isActive):
            return "\(isActive ? "Active " : "")\(hero.name), HP \(max(0, hero.hp)) of \(hero.maxHP)"
        case .enemy(let enemy):
            return "\(enemy.name), HP \(max(0, enemy.hp)) of \(enemy.maxHP)"
        }
    }
}

private struct DPad: View {
    let centerTitle: String
    let actionLabelPrefix: String
    let action: (GridPoint?) -> Void

    var body: some View {
        VStack(spacing: 8) {
            padButton(title: "▲", direction: .up, accessibilityLabel: "\(actionLabelPrefix) up")
            HStack(spacing: 8) {
                padButton(title: "◀", direction: .left, accessibilityLabel: "\(actionLabelPrefix) left")
                Button(centerTitle) { action(nil) }
                    .buttonStyle(ControlPadButtonStyle())
                    .accessibilityLabel(centerTitle == "Wait" ? "Wait and end turn" : "End turn")
                padButton(title: "▶", direction: .right, accessibilityLabel: "\(actionLabelPrefix) right")
            }
            padButton(title: "▼", direction: .down, accessibilityLabel: "\(actionLabelPrefix) down")
        }
    }

    private func padButton(title: String, direction: GridPoint, accessibilityLabel: String) -> some View {
        Button(title) { action(direction) }
            .buttonStyle(ControlPadButtonStyle())
            .accessibilityLabel(accessibilityLabel)
    }
}

private struct PrimaryCTAButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.blue.opacity(configuration.isPressed ? 0.65 : 0.9))
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct ControlPadButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(Color.white.opacity(configuration.isPressed ? 0.18 : 0.1))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
