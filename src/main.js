/**
 * NEW PIOSI - Modern Main Application Entry Point
 * 
 * This is the modernized version of PIOSI with:
 * - ES6+ modules and modern JavaScript features
 * - Clean separation of concerns
 * - Better code organization and maintainability
 * - Enhanced error handling
 * - Improved performance
 */

import { GameStateManager } from './systems/GameStateManager.js';
import { Hero } from './components/Hero.js';
import { heroData } from './data/heroes.js';
import { AudioManager } from './systems/AudioManager.js';
import { RendererManager } from './systems/RendererManager.js';
import { InputManager } from './systems/InputManager.js';
import { UIManager } from './systems/UIManager.js';

// Import legacy modules with path corrections
import { levelSettings } from '../levels.js';
import { 
  fetchJoke,
  fetchBaconIpsum,
  fetchTarotCard,
  fetchNonseqFact,
  fetchShrinkAdvice,
  fetchRandomRecipe,
  getGriotReaction,
  initializeGriot
} from '../griot.js';

class NewPIOSI {
  constructor() {
    this.gameState = new GameStateManager();
    this.audioManager = new AudioManager();
    this.renderer = new RendererManager();
    this.input = new InputManager();
    this.ui = new UIManager();
    
    this.selectedHeroes = [];
    this.heroIndex = 0;
    
    // Constants
    this.TILE_WIDTH = 50;
    this.TILE_HEIGHT = 24;
    
    // Initialize the application
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing NEW PIOSI...');
      
      // Initialize all systems
      await this.audioManager.init();
      this.renderer.init();
      this.setupEventListeners();
      
      // Initialize narrative system
      await initializeGriot('fantasy_narrative.txt');
      
      // Show title screen
      this.showTitleScreen();
      
      console.log('✅ NEW PIOSI initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing NEW PIOSI:', error);
      this.showError('Failed to initialize the game. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Main game state change listeners
    this.gameState.on('screenChange', ({ from, to }) => {
      console.log(`Screen changed: ${from} -> ${to}`);
      this.handleScreenChange(to);
    });

    this.gameState.on('partyChange', (party) => {
      console.log('Party changed:', party.map(h => h.name));
    });

    this.gameState.on('levelStart', ({ level, enemies }) => {
      console.log(`Starting level ${level} with ${enemies.length} enemies`);
      this.renderer.initializeLevel(level, enemies);
    });

    // Input handling
    this.input.on('keydown', (event) => {
      this.handleInput(event);
    });

    // UI events
    this.ui.on('heroSelect', (heroIndex) => {
      this.selectHero(heroIndex);
    });

    // Audio events
    this.audioManager.on('songChange', (songInfo) => {
      console.log('Now playing:', songInfo.title);
    });
  }

  handleInput(event) {
    const currentScreen = this.gameState.currentScreen;
    
    switch (currentScreen) {
      case 'title-screen':
        this.handleTitleInput(event);
        break;
      case 'party-select':
        this.handlePartySelectInput(event);
        break;
      case 'game-screen':
        this.handleGameInput(event);
        break;
      case 'emanations-mode':
        this.handleEmanationsInput(event);
        break;
      default:
        console.log('Unhandled input for screen:', currentScreen);
    }
  }

  handleTitleInput(event) {
    if (event.code === 'Space') {
      this.gameState.changeScreen('party-select');
    }
  }

  handlePartySelectInput(event) {
    switch (event.code) {
      case 'ArrowLeft':
        this.heroIndex = this.heroIndex > 0 ? this.heroIndex - 1 : heroData.length - 1;
        this.updatePartySelectDisplay();
        break;
      case 'ArrowRight':
        this.heroIndex = (this.heroIndex + 1) % heroData.length;
        this.updatePartySelectDisplay();
        break;
      case 'Space':
        this.toggleHeroSelection();
        break;
    }
  }

  handleGameInput(event) {
    const currentHero = this.gameState.getCurrentHero();
    
    switch (event.code) {
      case 'KeyV':
        this.showGameStateReport();
        break;
      case 'Tab':
        event.preventDefault();
        this.gameState.nextHero();
        break;
      case 'Space':
        this.gameState.toggleAttackMode();
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        this.handleMovement(event.code, currentHero);
        break;
    }
  }

  handleEmanationsInput(event) {
    switch (event.code) {
      case 'Escape':
        this.gameState.changeScreen('game-screen');
        break;
      case 'ArrowLeft':
        this.audioManager.previousSong();
        break;
      case 'ArrowRight':
        this.audioManager.nextSong();
        break;
      case 'Space':
        this.audioManager.togglePlayPause();
        break;
      case 'KeyS':
        this.audioManager.stop();
        break;
    }
  }

  handleMovement(direction, hero) {
    if (!hero) return;

    let newX = hero.x;
    let newY = hero.y;

    switch (direction) {
      case 'ArrowLeft':
        newX = Math.max(0, newX - 1);
        break;
      case 'ArrowRight':
        newX = Math.min(this.renderer.cols - 1, newX + 1);
        break;
      case 'ArrowUp':
        newY = Math.max(0, newY - 1);
        break;
      case 'ArrowDown':
        newY = Math.min(this.renderer.rows - 1, newY + 1);
        break;
    }

    // Check for collisions and move
    if (this.canMoveToPosition(newX, newY, hero)) {
      const moved = hero.moveTo(newX, newY);
      if (moved) {
        this.renderer.render();
        this.ui.updateHeroStatus(hero);
        
        // Discover new zone
        const zoneId = `${newX},${newY},${this.gameState.currentLevel}`;
        this.gameState.discoverZone(zoneId);
      }
    } else {
      this.ui.showMessage('Path blocked! Cannot move there.');
    }
  }

  canMoveToPosition(x, y, movingHero) {
    // Check bounds
    if (x < 0 || x >= this.renderer.cols || y < 0 || y >= this.renderer.rows) {
      return false;
    }

    // Check for walls
    if (this.renderer.isWallAt(x, y)) {
      return false;
    }

    // Check for other heroes
    const heroCollision = this.gameState.party.some(hero => 
      hero !== movingHero && hero.x === x && hero.y === y && hero.isAlive()
    );
    
    if (heroCollision) {
      return false;
    }

    // Check for enemies
    const enemyCollision = this.gameState.enemies.some(enemy =>
      enemy.x === x && enemy.y === y && enemy.hp > 0
    );

    return !enemyCollision;
  }

  toggleHeroSelection() {
    const selectedIndex = this.selectedHeroes.indexOf(this.heroIndex);
    
    if (selectedIndex > -1) {
      // Deselect hero
      this.selectedHeroes.splice(selectedIndex, 1);
    } else if (this.selectedHeroes.length < 3) {
      // Select hero
      this.selectedHeroes.push(this.heroIndex);
    }

    this.updatePartySelectDisplay();

    // Check if party is complete
    if (this.selectedHeroes.length === 3) {
      setTimeout(() => {
        this.startGame();
      }, 500);
    }
  }

  startGame() {
    // Create hero instances from selected data
    const party = this.selectedHeroes.map(index => new Hero(heroData[index]));
    
    // Set initial positions
    party.forEach((hero, index) => {
      hero.x = index;
      hero.y = 0;
    });

    this.gameState.setParty(party);
    this.gameState.changeScreen('game-screen');
    this.gameState.startLevel(1, []);
    
    // Start background music
    this.audioManager.playBackgroundMusic();
  }

  updatePartySelectDisplay() {
    const hero = heroData[this.heroIndex];
    const isSelected = this.selectedHeroes.includes(this.heroIndex);
    
    this.ui.updatePartySelect({
      hero,
      isSelected,
      selectedCount: this.selectedHeroes.length
    });
  }

  showTitleScreen() {
    this.ui.showScreen('title');
    this.audioManager.fadeInTitleMusic();
  }

  handleScreenChange(newScreen) {
    this.ui.showScreen(newScreen);
    
    switch (newScreen) {
      case 'party-select':
        this.showPartySelectScreen();
        break;
      case 'game-screen':
        this.showGameScreen();
        break;
      case 'emanations-mode':
        this.showEmanationsMode();
        break;
    }
  }

  showPartySelectScreen() {
    this.heroIndex = 0;
    this.selectedHeroes = [];
    this.updatePartySelectDisplay();
    this.audioManager.playMenuMusic();
  }

  showGameScreen() {
    this.renderer.render();
    this.audioManager.playBackgroundMusic();
  }

  showEmanationsMode() {
    this.ui.showEmanationsUI();
  }

  showGameStateReport() {
    const report = this.gameState.generateStateReport();
    console.log('=== NEW PIOSI GAME STATE REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    
    this.ui.showGameStateReport(report);
  }

  showError(message) {
    console.error('Game Error:', message);
    this.ui.showError(message);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check for WebGL and modern features
  if (!window.WebGLRenderingContext) {
    console.warn('WebGL not supported, falling back to Canvas 2D');
  }

  // Start the game
  window.newPIOSI = new NewPIOSI();
});

// Export for debugging
export { NewPIOSI };