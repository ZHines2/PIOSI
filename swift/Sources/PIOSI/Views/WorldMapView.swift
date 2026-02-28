/// WorldMapView.swift
///
/// Displays the world-map destination selector, mirroring worldMap.js.
/// The player navigates left/right through destinations and taps one to proceed.
/// Compiled only on Apple platforms where SwiftUI is available.

#if canImport(SwiftUI)
import SwiftUI
import Observation

struct WorldMapView: View {
    var gameState: GameState
    @State private var selectedIndex: Int = 0

    private let nodes: [(title: String, action: WorldMapAction)] = [
        ("Gratt ߁",       .startGratt1),
        ("Gratt ߂",       .notYetAccessible),
        ("Gratt ߃",       .notYetAccessible),
        ("Gratt ߷",       .openLevel99),
        ("Summit Mode",    .summitMode),
        ("Emanations Mode",.emanationsMode),
    ]

    var body: some View {
        VStack(spacing: 0) {
            Text("THE BROADLANDS")
                .font(.system(size: 28, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
                .padding(.top, 48)
            Text("Select your destination:")
                .font(.system(size: 14, design: .monospaced))
                .foregroundColor(.gray)
                .padding(.bottom, 24)

            ScrollView {
                VStack(spacing: 8) {
                    ForEach(nodes.indices, id: \.self) { index in
                        Button {
                            selectedIndex = index
                            handleSelection(nodes[index].action)
                        } label: {
                            Text(nodes[index].title)
                                .font(.system(size: 18, design: .monospaced))
                                .foregroundColor(index == selectedIndex ? .black : .white)
                                .frame(maxWidth: .infinity)
                                .padding(12)
                                .background(index == selectedIndex ? Color.yellow : Color(white: 0.13))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 4)
                                        .stroke(index == selectedIndex ? Color.yellow : Color.gray, lineWidth: 2)
                                )
                        }
                        .padding(.horizontal, 24)
                    }
                }
            }
            Spacer()
        }
        .background(Color.black.ignoresSafeArea())
    }

    private func handleSelection(_ action: WorldMapAction) {
        switch action {
        case .startGratt1:
            gameState.screen = .heroSelection
        case .openLevel99:
            gameState.currentLevelNumber = 99
            gameState.screen = .heroSelection
        case .summitMode:
            // Summit mode: single hero, infinite escalating waves
            gameState.screen = .heroSelection
        case .emanationsMode:
            // Emanations mode: not yet implemented
            break
        case .notYetAccessible:
            break
        }
    }
}

enum WorldMapAction {
    case startGratt1, openLevel99, summitMode, emanationsMode, notYetAccessible
}
#endif
