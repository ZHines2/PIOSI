# Game State Analyzer Documentation

## Overview

The Game State Analyzer is an advanced agentic technology module that provides real-time analysis of PIOSI game states. It acts as an autonomous agent that observes, tracks, and reports on game progression without interfering with game logic.

## Features

### 1. **Real-time State Analysis**
- Tracks hero positions, stats, and status effects
- Monitors enemy positions and threat levels
- Analyzes battlefield layout and environmental factors
- Evaluates turn order and game flow

### 2. **Strategic Assessment**
- Calculates power balance between heroes and enemies
- Generates tactical recommendations
- Identifies threats and opportunities
- Determines game phase (offensive, defensive, critical, etc.)

### 3. **Historical Tracking**
- Maintains history of up to 50 game states
- Analyzes trends over time
- Tracks momentum and progression
- Exportable state history for external analysis

### 4. **Multi-Mode Support**
- Battle Mode analysis (standard campaign)
- Summit Mode analysis (battle royale)
- Extensible for future game modes

## Architecture

The analyzer follows agentic technology principles:

- **Autonomous**: Operates independently without manual intervention
- **Observable**: Provides transparent insights into game state
- **Non-invasive**: Does not modify game logic or state
- **Extensible**: Easy to add new analysis metrics

## Usage

### In-Game Integration

The analyzer is automatically integrated into the game and runs during:

1. **Battle Initialization** - Logs initial state when a level starts
2. **After Each Action** - Updates analysis after hero moves/attacks
3. **Level Completion** - Provides final state summary
4. **Summit Mode** - Periodic analysis every 10 turns

### Developer Console Access

Access the analyzer through the browser console:

```javascript
// Display current game state
PIOSI.logState()

// Get formatted state report as string
const report = PIOSI.getFormattedReport()
console.log(report)

// Get detailed state analysis object
const analysis = PIOSI.getBattleState()
console.log(analysis)

// View state history
const history = PIOSI.getStateHistory()

// Export history as JSON
const jsonExport = PIOSI.exportHistory()
console.log(jsonExport)

// Clear state history
PIOSI.clearHistory()
```

### Programmatic Access

```javascript
import { GameStateAnalyzer, globalAnalyzer } from './gameStateAnalyzer.js';

// Analyze battle state
const analysis = globalAnalyzer.analyzeBattleState(battleEngine);

// Get formatted report
const report = globalAnalyzer.getFormattedReport(analysis);

// Register callback for state updates
globalAnalyzer.onStateUpdate((analysis) => {
  console.log('State updated:', analysis);
});
```

## Analysis Output

### Battle Mode Analysis

```
=== GAME STATE ANALYSIS ===
Mode: battle
Timestamp: 2:45:30 PM

HEROES:
  [ACTIVE] Knight: HP 18 at (2,1)
  Archer: HP 12 at (1,1)
  Wizard: HP 10 at (0,1)

ENEMIES:
  Brigand: HP 12 at (3,5) [Threat: 7.2]
  Brigand: HP 12 at (5,5) [Threat: 7.2]

BATTLEFIELD:
  Dimensions: 7x12
  Wall HP: 40
  Open Space: 73.8%

STRATEGIC ASSESSMENT:
  Situation: favorable
  Power Balance: 1.45
  Recommendations:
    - 2 enemies in attack range
    - Advantageous position - press the attack on weakened enemies
```

### Summit Mode Analysis

```javascript
{
  timestamp: 1702742400000,
  mode: "summit",
  totalHeroes: 30,
  aliveHeroes: 18,
  teams: [
    { teamId: 0, members: ["Knight", "Archer"], totalHP: 45, totalStrength: 78 },
    { teamId: 5, members: ["Wizard"], totalHP: 10, totalStrength: 22 },
    // ... more teams
  ],
  mapSize: 50,
  turnOrder: ["Knight", "Rogue", "Archer", ...],
  currentTurnIndex: 15,
  dominantTeam: { teamId: 0, members: ["Knight", "Archer"], ... },
  battlePhase: "consolidation"
}
```

## Metrics Explained

### Combat Effectiveness
Calculated for each hero based on:
- Base score: `attack × range × (agility / 10)`
- HP factor: Current HP normalized to 100
- Special abilities: Sum of heal, burn, chain, yeet, swarm stats

### Threat Level
Calculated for each enemy based on:
- Base score: `attack × range × agility`
- HP factor: Current HP normalized to 50

### Power Balance
Ratio of total hero strength to total enemy strength:
- `> 1.5`: Favorable
- `1.2 - 1.5`: Advantageous
- `0.85 - 1.2`: Neutral
- `0.7 - 0.85`: Challenging
- `< 0.7`: Dire

### Game Phase
Determined by:
- **victory_imminent**: No enemies and wall collapsed
- **critical**: Only 1 hero alive
- **defensive**: More than 2x enemies vs heroes
- **offensive**: Fewer enemies than heroes
- **balanced**: Roughly equal forces

### Summit Battle Phase
- **early_chaos**: 10+ teams remaining
- **consolidation**: 4-9 teams remaining
- **endgame**: 2-3 teams remaining
- **victory**: 1 team remaining

## Customization

### Adding Custom Metrics

Extend the `GameStateAnalyzer` class to add custom analysis:

```javascript
class CustomAnalyzer extends GameStateAnalyzer {
  analyzeCustomMetric(battleEngine) {
    // Your custom analysis logic
    return {
      customValue: calculateCustomValue(),
      customRecommendation: generateRecommendation()
    };
  }
  
  analyzeBattleState(battleEngine) {
    const baseAnalysis = super.analyzeBattleState(battleEngine);
    baseAnalysis.customMetrics = this.analyzeCustomMetric(battleEngine);
    return baseAnalysis;
  }
}
```

### Custom Callbacks

Register callbacks to respond to state changes:

```javascript
globalAnalyzer.onStateUpdate((analysis) => {
  // Custom logic on state update
  if (analysis.strategicAssessment.situation === 'dire') {
    console.warn('Critical situation detected!');
  }
});
```

## Performance Considerations

- State analysis runs after each significant game event
- History is limited to 50 states to prevent memory issues
- Console logging uses collapsible groups for readability
- Analysis calculations are optimized for real-time performance

## Future Enhancements

Potential future features:
- Machine learning for advanced strategic recommendations
- Predictive analysis for enemy movement patterns
- Multiplayer state synchronization
- Visual state representation with charts/graphs
- Performance analytics and optimization suggestions
- Replay system with state history playback

## Troubleshooting

### No State Analysis Appearing
- Ensure the game is running in a modern browser with console access
- Check that the analyzer module is properly imported
- Verify that `battleEngine` is initialized

### Incomplete Analysis
- Some data may be unavailable depending on game mode
- Check browser console for error messages
- Ensure game state is fully initialized before analysis

### Performance Issues
- Clear state history periodically with `PIOSI.clearHistory()`
- Reduce analysis frequency for older browsers
- Check for console log overhead

## Technical Details

### Dependencies
- No external dependencies
- Pure JavaScript ES6+ module
- Compatible with modern browsers (Chrome, Firefox, Safari, Edge)

### Data Structure
State analysis objects follow a consistent schema:
- `timestamp`: Unix timestamp of analysis
- `mode`: Game mode identifier
- `heroes`: Array of hero analysis objects
- `enemies`: Array of enemy analysis objects
- `battlefield`: Battlefield state analysis
- `turnState`: Current turn information
- `strategicAssessment`: Strategic evaluation
- `gameFlow`: Historical and trend analysis

### Integration Points
The analyzer integrates with:
1. `index.html` - Main game controller
2. `battleEngine.js` - Battle state management
3. `summitMode.js` - Summit Mode battle royale
4. Browser console - Developer access

## Examples

### Example 1: Monitoring Hero Health

```javascript
globalAnalyzer.onStateUpdate((analysis) => {
  const lowHealthHeroes = analysis.heroes.filter(h => 
    h.isAlive && h.stats.hp < 10
  );
  
  if (lowHealthHeroes.length > 0) {
    console.warn('Low health heroes:', lowHealthHeroes.map(h => h.name));
  }
});
```

### Example 2: Tracking Enemy Defeats

```javascript
let previousEnemyCount = 0;

globalAnalyzer.onStateUpdate((analysis) => {
  const currentCount = analysis.enemies.length;
  
  if (currentCount < previousEnemyCount) {
    console.log(`Enemy defeated! ${previousEnemyCount - currentCount} enemies remaining`);
  }
  
  previousEnemyCount = currentCount;
});
```

### Example 3: Exporting Game Statistics

```javascript
// After completing a level
const history = PIOSI.getStateHistory();
const stats = {
  totalTurns: history.length,
  avgHeroHP: history.map(s => s.heroes.reduce((sum, h) => sum + h.stats.hp, 0) / s.heroes.length),
  situations: history.map(s => s.strategicAssessment.situation)
};

console.log('Game Statistics:', stats);
```

## Credits

Developed as part of the PIOSI game state analysis initiative using modern agentic technology principles.

## License

This component follows the same MIT License as the main PIOSI project.
