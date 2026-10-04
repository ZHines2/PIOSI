# PIOSI Swift MVP

This folder contains a first-pass, mobile-first Swift starter that sits beside the existing web game instead of replacing it.

## What is included

- `Shared/PIOSICore/` — a small, testable model layer for the lite campaign
- `iOS/PIOSIMobile/` — a SwiftUI iPhone app shell wired to the shared core
- `Tests/PIOSICoreTests/` — targeted tests for progression, wall-collapse victory, and basic enemy turns
- a three-hero squad selector over the currently available heroes

## Lite campaign scope

The MVP keeps one narrow playable path from the current web app. The starting squad is Knight, Archer, and Rogue; winning the first two encounters unlocks Wizard for later squad selection.

1. Title card
2. Level briefing
3. Turn-based battle with touch controls
4. Wall-collapse victory flow into the next level
5. Final campaign-complete screen after the second encounter

Ported from the current web experience:

- starting party of Knight, Archer, and Rogue, with Wizard unlocked after two encounter wins
- level titles/objectives inspired by `content/levels.core.json`
- agility-based hero turn order
- grid movement, directional attacks, wall damage, enemy pursuit, and defeat handling

Intentionally deferred for phase 2:

- the rest of the hero roster and advanced party-management options
- Mode Up, world map, summit mode, and emanations mode
- advanced ability hooks from `battleRules.js`
- asset/audio loading, save data, and broader iPad/macOS layouts

## Validation

Run the shared-core tests from this folder:

```bash
swift test
```

To open the iPhone shell in Xcode on macOS, use:

```bash
open apple/PIOSIMVP/iOS/PIOSIMobile/PIOSIMobile.xcodeproj
```
