#if canImport(SwiftUI)
import SwiftUI
import Observation

public struct ContentView: View {
    @State private var gameState = GameState()

    public init() {}

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            switch gameState.screen {
            case .title:
                TitleView(gameState: gameState)
            case .worldMap:
                WorldMapView(gameState: gameState)
            case .heroSelection:
                HeroSelectionView(gameState: gameState)
            case .battle:
                BattleView(gameState: gameState)
            case .gameOver:
                GameOverView(gameState: gameState)
            }
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - GameState

public enum AppScreen {
    case title, worldMap, heroSelection, battle, gameOver
}

@Observable
public class GameState {
    public var screen: AppScreen = .title
    public var selectedHeroes: [Hero] = []
    public var currentLevelNumber: Int = 1
    public var engine: BattleEngine?

    public let allHeroes: [Hero] = makeHeroes()

    public init() {}

    public func startGame(heroes: [Hero]) {
        selectedHeroes = heroes
        currentLevelNumber = 1
        loadLevel(currentLevelNumber)
    }

    public func loadLevel(_ number: Int) {
        guard let level = getLevel(number) else { return }
        // Heroes carry over stats between levels
        let party = selectedHeroes
        engine = BattleEngine(
            party: party,
            enemies: level.enemies,
            rows: level.rows,
            cols: level.cols,
            wallHP: level.wallHP
        )
        engine?.onLevelComplete = { [weak self] in
            guard let self else { return }
            self.currentLevelNumber += 1
            if let _ = getLevel(self.currentLevelNumber) {
                self.loadLevel(self.currentLevelNumber)
            } else {
                self.screen = .gameOver
            }
        }
        engine?.onGameOver = { [weak self] in
            self?.screen = .gameOver
        }
        screen = .battle
    }
}

// MARK: - TitleView

struct TitleView: View {
    var gameState: GameState

    var body: some View {
        VStack(spacing: 32) {
            Text("PIOSI")
                .font(.system(size: 64, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
            Text("THE SAGAS CONTINUE")
                .font(.system(size: 18, design: .monospaced))
                .foregroundColor(.gray)
            Button("BEGIN") {
                gameState.screen = .worldMap
            }
            .font(.system(size: 22, weight: .bold, design: .monospaced))
            .padding(.horizontal, 40)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.15))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white, lineWidth: 1))
            .foregroundColor(.white)
        }
    }
}

// MARK: - GameOverView

struct GameOverView: View {
    var gameState: GameState

    var body: some View {
        VStack(spacing: 24) {
            Text("GAME OVER")
                .font(.system(size: 48, weight: .bold, design: .monospaced))
                .foregroundColor(.red)
            Button("PLAY AGAIN") {
                gameState.screen = .title
            }
            .font(.system(size: 20, weight: .bold, design: .monospaced))
            .padding(.horizontal, 32)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.1))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white, lineWidth: 1))
            .foregroundColor(.white)
        }
    }
}
#endif
