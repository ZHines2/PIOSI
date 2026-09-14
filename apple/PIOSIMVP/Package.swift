// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "PIOSIMVP",
    products: [
        .library(
            name: "PIOSICore",
            targets: ["PIOSICore"]
        )
    ],
    targets: [
        .target(
            name: "PIOSICore",
            path: "Shared/PIOSICore"
        ),
        .testTarget(
            name: "PIOSICoreTests",
            dependencies: ["PIOSICore"],
            path: "Tests/PIOSICoreTests"
        )
    ]
)
