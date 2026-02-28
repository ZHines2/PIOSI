/// PIOSIApp.swift
///
/// Entry point for the PIOSI iOS application.
/// Compiled only on Apple platforms where SwiftUI is available.

#if canImport(SwiftUI)
import SwiftUI

@main
public struct PIOSIApp: App {
    public init() {}

    public var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
#endif
