import SwiftUI

@main
struct PIOSIMobileApp: App {
    @StateObject private var viewModel = BattleViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
        }
    }
}
