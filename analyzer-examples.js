/**
 * Game State Analyzer - Usage Examples
 * 
 * This file demonstrates various ways to use the Game State Analyzer
 * in the PIOSI game.
 */

// ============================================================================
// Example 1: Basic State Analysis in the Browser Console
// ============================================================================

/*
  Open the game in your browser, open the Developer Console (F12), and run:

  PIOSI.logState()

  This will display the current game state with heroes, enemies, battlefield
  info, and strategic recommendations.
*/

// ============================================================================
// Example 2: Getting a Formatted Report
// ============================================================================

/*
  const report = PIOSI.getFormattedReport();
  console.log(report);

  Output:
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
*/

// ============================================================================
// Example 3: Monitoring Hero Health Over Time
// ============================================================================

/*
  // Get state history and analyze HP trends
  const history = PIOSI.getStateHistory();
  
  history.forEach((state, index) => {
    const heroHP = state.heroes.map(h => ({
      name: h.name,
      hp: h.stats.hp,
      alive: h.isAlive
    }));
    
    console.log(`Turn ${index}:`, heroHP);
  });
*/

// ============================================================================
// Example 4: Tracking Combat Effectiveness
// ============================================================================

/*
  const analysis = PIOSI.getBattleState();
  
  if (analysis && analysis.heroes) {
    console.log('Combat Effectiveness Rankings:');
    
    const rankings = analysis.heroes
      .filter(h => h.isAlive)
      .sort((a, b) => b.combatEffectiveness - a.combatEffectiveness)
      .map((h, idx) => ({
        rank: idx + 1,
        name: h.name,
        effectiveness: h.combatEffectiveness.toFixed(2)
      }));
    
    console.table(rankings);
  }
*/

// ============================================================================
// Example 5: Detecting Critical Situations
// ============================================================================

/*
  const analysis = PIOSI.getBattleState();
  
  if (analysis && analysis.strategicAssessment) {
    const situation = analysis.strategicAssessment.situation;
    
    if (situation === 'dire' || situation === 'critical') {
      console.warn('🚨 CRITICAL SITUATION DETECTED!');
      console.warn('Recommendations:', analysis.strategicAssessment.recommendations);
    } else if (situation === 'favorable') {
      console.log('✅ Favorable position - keep pushing!');
    }
  }
*/

// ============================================================================
// Example 6: Analyzing Enemy Threat Levels
// ============================================================================

/*
  const analysis = PIOSI.getBattleState();
  
  if (analysis && analysis.enemies) {
    console.log('Enemy Threat Analysis:');
    
    const threats = analysis.enemies
      .sort((a, b) => b.threatLevel - a.threatLevel)
      .map(e => ({
        name: e.name,
        hp: e.stats.hp,
        threat: e.threatLevel.toFixed(2),
        position: `(${e.position.x},${e.position.y})`
      }));
    
    console.table(threats);
    
    // Identify highest threat
    if (threats.length > 0) {
      console.log(`⚠️ Priority target: ${threats[0].name} at ${threats[0].position}`);
    }
  }
*/

// ============================================================================
// Example 7: Exporting Game Statistics
// ============================================================================

/*
  // Export history for external analysis
  const jsonHistory = PIOSI.exportHistory();
  
  // Copy to clipboard (in browser)
  navigator.clipboard.writeText(jsonHistory).then(() => {
    console.log('✅ History copied to clipboard!');
  });
  
  // Or save to file (you'll need to trigger download manually)
  const blob = new Blob([jsonHistory], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  console.log('Download URL:', url);
*/

// ============================================================================
// Example 8: Real-time Monitoring with Callbacks
// ============================================================================

/*
  // Add this code at game initialization
  
  import { globalAnalyzer } from './gameStateAnalyzer.js';
  
  // Register a callback to monitor state changes
  globalAnalyzer.onStateUpdate((analysis) => {
    // Log every state change
    console.log(`State updated at ${new Date(analysis.timestamp).toLocaleTimeString()}`);
    
    // Check for low health heroes
    if (analysis.heroes) {
      const lowHealthHeroes = analysis.heroes.filter(h => 
        h.isAlive && h.stats.hp < 10
      );
      
      if (lowHealthHeroes.length > 0) {
        console.warn('⚠️ Low health heroes:', lowHealthHeroes.map(h => h.name));
      }
    }
    
    // Check for power imbalance
    if (analysis.strategicAssessment) {
      const balance = analysis.strategicAssessment.powerBalance;
      
      if (balance < 0.7) {
        console.error('🚨 Severe power disadvantage!', balance.toFixed(2));
      } else if (balance > 1.5) {
        console.log('💪 Strong advantage!', balance.toFixed(2));
      }
    }
  });
*/

// ============================================================================
// Example 9: Analyzing Battlefield Density
// ============================================================================

/*
  const analysis = PIOSI.getBattleState();
  
  if (analysis && analysis.battlefield) {
    const density = analysis.battlefield.density;
    const openSpace = analysis.battlefield.grid.openSpaceRatio;
    
    console.log('Battlefield Analysis:');
    console.log(`  Unit Density: ${(density * 100).toFixed(1)}%`);
    console.log(`  Open Space: ${(openSpace * 100).toFixed(1)}%`);
    
    if (density > 0.3) {
      console.log('  Status: Crowded - limited movement options');
    } else if (density < 0.1) {
      console.log('  Status: Sparse - plenty of room to maneuver');
    } else {
      console.log('  Status: Balanced - good tactical options');
    }
  }
*/

// ============================================================================
// Example 10: Summit Mode Team Analysis
// ============================================================================

/*
  // When in Summit Mode, analyze team dynamics
  
  const analysis = PIOSI.getBattleState();
  
  if (analysis && analysis.mode === 'summit') {
    console.log('🏔️ Summit Mode Team Analysis');
    console.log(`Battle Phase: ${analysis.battlePhase}`);
    console.log(`Total Teams: ${analysis.teams.length}`);
    
    // Show team strengths
    analysis.teams.forEach(team => {
      console.log(`Team ${team.teamId}:`);
      console.log(`  Members: ${team.members.join(', ')}`);
      console.log(`  Total HP: ${team.totalHP}`);
      console.log(`  Total Strength: ${team.totalStrength}`);
    });
    
    if (analysis.dominantTeam) {
      console.log(`\n👑 Dominant Team: ${analysis.dominantTeam.teamId}`);
    }
  }
*/

// ============================================================================
// Example 11: Creating a Custom Dashboard
// ============================================================================

/*
  // Create a real-time dashboard in the console
  
  function displayDashboard() {
    console.clear();
    const analysis = PIOSI.getBattleState();
    
    if (!analysis) {
      console.log('No active battle');
      return;
    }
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║     PIOSI GAME STATE DASHBOARD        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    
    // Heroes section
    console.log('HEROES:');
    analysis.heroes.filter(h => h.isAlive).forEach(hero => {
      const status = hero.isActive ? '▶' : ' ';
      const hpBar = '█'.repeat(Math.floor(hero.stats.hp / 5));
      console.log(`  ${status} ${hero.name}: ${hpBar} ${hero.stats.hp} HP`);
    });
    console.log('');
    
    // Enemies section
    console.log('ENEMIES:');
    analysis.enemies.forEach(enemy => {
      const hpBar = '█'.repeat(Math.floor(enemy.stats.hp / 5));
      console.log(`    ${enemy.name}: ${hpBar} ${enemy.stats.hp} HP (Threat: ${enemy.threatLevel.toFixed(1)})`);
    });
    console.log('');
    
    // Strategic section
    console.log('STRATEGIC STATUS:');
    console.log(`  Situation: ${analysis.strategicAssessment.situation.toUpperCase()}`);
    console.log(`  Power Balance: ${analysis.strategicAssessment.powerBalance.toFixed(2)}`);
    console.log(`  Wall HP: ${analysis.battlefield.wallHP}`);
    console.log('');
    
    console.log('RECOMMENDATIONS:');
    analysis.strategicAssessment.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  // Update dashboard every 2 seconds
  setInterval(displayDashboard, 2000);
*/

// ============================================================================
// Example 12: Performance Analysis
// ============================================================================

/*
  // Analyze game performance over time
  
  const history = PIOSI.getStateHistory();
  
  if (history.length > 10) {
    const recentStates = history.slice(-10);
    
    // Calculate average turn duration
    const turnDurations = [];
    for (let i = 1; i < recentStates.length; i++) {
      const duration = recentStates[i].timestamp - recentStates[i-1].timestamp;
      turnDurations.push(duration);
    }
    
    const avgDuration = turnDurations.reduce((a, b) => a + b, 0) / turnDurations.length;
    console.log(`Average turn duration: ${(avgDuration / 1000).toFixed(2)} seconds`);
    
    // Calculate damage dealt
    const damageDealt = recentStates.map((state, idx) => {
      if (idx === 0) return 0;
      const prevEnemyHP = recentStates[idx-1].enemies.reduce((sum, e) => sum + e.stats.hp, 0);
      const currEnemyHP = state.enemies.reduce((sum, e) => sum + e.stats.hp, 0);
      return prevEnemyHP - currEnemyHP;
    });
    
    const totalDamage = damageDealt.reduce((a, b) => a + b, 0);
    console.log(`Total damage dealt: ${totalDamage}`);
    console.log(`Damage per turn: ${(totalDamage / recentStates.length).toFixed(1)}`);
  }
*/

// ============================================================================
// Notes
// ============================================================================

/*
  Tips for using the Game State Analyzer:

  1. Open the browser console (F12) to see detailed logs
  2. Use PIOSI.logState() frequently to monitor game state
  3. Export history before closing the game to save progress data
  4. Combine multiple analysis methods for deeper insights
  5. Use callbacks for real-time monitoring during gameplay
  6. Check state trends to identify patterns and optimize strategy
  
  For complete documentation, see: docs/game-state-analyzer.md
*/
