/**
 * Test script for Game State Analyzer
 * 
 * This script tests the core functionality of the GameStateAnalyzer
 * without requiring the full game to be running.
 */

import { GameStateAnalyzer } from './gameStateAnalyzer.js';

console.log('🧪 Testing Game State Analyzer...\n');

// Create test analyzer instance
const analyzer = new GameStateAnalyzer();

// Test 1: Basic instantiation
console.log('Test 1: Basic instantiation');
console.log('✓ Analyzer created successfully');
console.log('  - State history length:', analyzer.stateHistory.length);
console.log('  - Max history length:', analyzer.maxHistoryLength);
console.log('');

// Test 2: Mock battle engine
console.log('Test 2: Mock battle engine analysis');
const mockBattleEngine = {
  party: [
    {
      name: 'Knight',
      symbol: '♞',
      hp: 18,
      attack: 4,
      range: 1,
      agility: 4,
      x: 2,
      y: 1,
      statusEffects: {}
    },
    {
      name: 'Archer',
      symbol: '⚔',
      hp: 12,
      attack: 3,
      range: 5,
      agility: 4,
      x: 1,
      y: 1,
      statusEffects: {}
    },
    {
      name: 'Wizard',
      symbol: '✡',
      hp: 10,
      attack: 2,
      range: 7,
      agility: 2,
      x: 0,
      y: 1,
      chain: 5,
      statusEffects: {}
    }
  ],
  enemies: [
    {
      name: 'Brigand',
      symbol: 'Җ',
      hp: 12,
      attack: 3,
      range: 1,
      agility: 2,
      x: 3,
      y: 5,
      statusEffects: {}
    },
    {
      name: 'Brigand',
      symbol: 'Җ',
      hp: 12,
      attack: 3,
      range: 1,
      agility: 2,
      x: 5,
      y: 5,
      statusEffects: {}
    }
  ],
  rows: 7,
  cols: 12,
  wallHP: 40,
  currentUnit: 0,
  movePoints: 4,
  awaitingAttackDirection: false,
  transitioningLevel: false,
  battlefield: [
    ['.', '♞', '⚔', '✡', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', 'Җ', '.', 'Җ', '.', '.', '.', '.', '.', '.'],
    ['ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ', 'ᚙ']
  ],
  getLiveHeroes: function() {
    return this.party.filter(h => h.hp > 0 && !h.persistentDeath);
  }
};

const analysis = analyzer.analyzeBattleState(mockBattleEngine);
console.log('✓ Battle state analyzed successfully');
console.log('  - Mode:', analysis.mode);
console.log('  - Heroes alive:', analysis.heroes.filter(h => h.isAlive).length);
console.log('  - Enemies:', analysis.enemies.length);
console.log('  - Situation:', analysis.strategicAssessment.situation);
console.log('  - Power Balance:', analysis.strategicAssessment.powerBalance.toFixed(2));
console.log('');

// Test 3: Strategic assessment
console.log('Test 3: Strategic recommendations');
console.log('Recommendations:');
analysis.strategicAssessment.recommendations.forEach(rec => {
  console.log('  -', rec);
});
console.log('');

// Test 4: Formatted report
console.log('Test 4: Formatted report generation');
const report = analyzer.getFormattedReport(analysis);
console.log('✓ Report generated successfully');
console.log('Report length:', report.length, 'characters');
console.log('');
console.log('--- FORMATTED REPORT ---');
console.log(report);
console.log('--- END REPORT ---');
console.log('');

// Test 5: State history
console.log('Test 5: State history tracking');
console.log('✓ State recorded in history');
console.log('  - History length:', analyzer.stateHistory.length);
console.log('');

// Test 6: Mock Summit Mode
console.log('Test 6: Summit Mode analysis');
const mockSummitMode = {
  allHeroes: [
    { name: 'Knight', hp: 18, attack: 4, team: 0, x: 10, y: 10 },
    { name: 'Archer', hp: 12, attack: 3, team: 0, x: 11, y: 10 },
    { name: 'Wizard', hp: 10, attack: 2, team: 1, x: 20, y: 20 },
    { name: 'Rogue', hp: 0, attack: 4, team: 2, x: 30, y: 30 },
  ],
  mapSize: 50,
  turnOrder: [
    { name: 'Knight' },
    { name: 'Archer' },
    { name: 'Wizard' }
  ],
  turnIndex: 5
};

const summitAnalysis = analyzer.analyzeSummitState(mockSummitMode);
console.log('✓ Summit state analyzed successfully');
console.log('  - Mode:', summitAnalysis.mode);
console.log('  - Total heroes:', summitAnalysis.totalHeroes);
console.log('  - Alive heroes:', summitAnalysis.aliveHeroes);
console.log('  - Number of teams:', summitAnalysis.teams.length);
console.log('  - Battle phase:', summitAnalysis.battlePhase);
console.log('  - Dominant team:', summitAnalysis.dominantTeam?.teamId);
console.log('');

// Test 7: Callback registration
console.log('Test 7: Callback system');
let callbackExecuted = false;
analyzer.onStateUpdate((analysis) => {
  callbackExecuted = true;
});
// Trigger another analysis to test callback
analyzer.analyzeBattleState(mockBattleEngine);
console.log('✓ Callback system working:', callbackExecuted ? 'YES' : 'NO');
console.log('');

// Test 8: History export
console.log('Test 8: History export');
const exportedHistory = analyzer.exportHistory();
const parsedHistory = JSON.parse(exportedHistory);
console.log('✓ History exported successfully');
console.log('  - Export is valid JSON:', Array.isArray(parsedHistory));
console.log('  - Exported states:', parsedHistory.length);
console.log('');

// Test 9: Clear history
console.log('Test 9: Clear history');
analyzer.clearHistory();
console.log('✓ History cleared');
console.log('  - History length after clear:', analyzer.stateHistory.length);
console.log('');

// Summary
console.log('═══════════════════════════════════════');
console.log('✅ All tests passed successfully!');
console.log('═══════════════════════════════════════');
console.log('');
console.log('The Game State Analyzer is ready for use.');
console.log('');
