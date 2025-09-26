/**
 * Simplified NEW PIOSI - Working Version
 */

import { heroData } from './data/heroes.js';

class SimplePIOSI {
  constructor() {
    this.currentScreen = 'title';
    this.heroIndex = 0;
    this.selectedHeroes = [];
    this.party = [];
    
    console.log('🚀 Initializing Simple NEW PIOSI...');
    this.init();
  }

  init() {
    // Set up event listeners
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    document.addEventListener('DOMContentLoaded', () => this.showTitleScreen());
    
    // Start immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.showTitleScreen());
    } else {
      this.showTitleScreen();
    }
    
    console.log('✅ Simple NEW PIOSI initialized!');
  }

  handleKeydown(event) {
    console.log(`Key pressed: ${event.code} on screen: ${this.currentScreen}`);
    
    switch (this.currentScreen) {
      case 'title':
        if (event.code === 'Space') {
          this.showPartySelect();
        }
        break;
        
      case 'party-select':
        switch (event.code) {
          case 'ArrowLeft':
            this.heroIndex = this.heroIndex > 0 ? this.heroIndex - 1 : heroData.length - 1;
            this.updatePartyDisplay();
            break;
          case 'ArrowRight':
            this.heroIndex = (this.heroIndex + 1) % heroData.length;
            this.updatePartyDisplay();
            break;
          case 'Space':
            this.toggleHeroSelection();
            break;
        }
        break;
        
      case 'game':
        // Game controls will be added later
        if (event.code === 'KeyV') {
          this.showGameReport();
        }
        break;
    }
  }

  showTitleScreen() {
    this.currentScreen = 'title';
    this.hideAllScreens();
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) {
      titleScreen.style.display = 'block';
      console.log('Showing title screen');
    }
  }

  showPartySelect() {
    this.currentScreen = 'party-select';
    this.heroIndex = 0;
    this.selectedHeroes = [];
    
    this.hideAllScreens();
    const partyScreen = document.getElementById('party-select');
    if (partyScreen) {
      partyScreen.style.display = 'block';
      this.updatePartyDisplay();
      console.log('Showing party select screen');
    }
  }

  showGame() {
    this.currentScreen = 'game';
    this.hideAllScreens();
    const gameScreen = document.getElementById('game-container');
    if (gameScreen) {
      gameScreen.style.display = 'block';
      console.log('Showing game screen');
    }
  }

  hideAllScreens() {
    const screens = ['title-screen', 'party-select', 'game-container'];
    screens.forEach(screenId => {
      const screen = document.getElementById(screenId);
      if (screen) {
        screen.style.display = 'none';
      }
    });
  }

  updatePartyDisplay() {
    const hero = heroData[this.heroIndex];
    const isSelected = this.selectedHeroes.includes(this.heroIndex);
    
    const displayDiv = document.getElementById('hero-display');
    const infoP = document.getElementById('selection-info');
    
    if (displayDiv && hero) {
      displayDiv.innerHTML = `
        <div style="
          background: ${isSelected ? 'linear-gradient(135deg, #3498db, #2980b9)' : 'linear-gradient(135deg, #2c3e50, #34495e)'};
          border: 2px solid ${isSelected ? '#3498db' : '#34495e'};
          border-radius: 12px;
          padding: 20px;
          margin: 10px auto;
          max-width: 400px;
          color: white;
          text-align: center;
        ">
          <h3>${hero.name} ${hero.symbol}</h3>
          <img src="${hero.sprite}" alt="${hero.name}" width="80" height="80" style="border-radius: 8px;" />
          <p style="font-style: italic; color: #bdc3c7;">${hero.description || 'A brave warrior ready for battle.'}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;">
              <strong>Attack:</strong> <span style="color: #3498db;">${hero.attack}</span>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;">
              <strong>Range:</strong> <span style="color: #3498db;">${hero.range}</span>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;">
              <strong>Agility:</strong> <span style="color: #3498db;">${hero.agility}</span>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;">
              <strong>HP:</strong> <span style="color: #3498db;">${hero.hp}</span>
            </div>
          </div>
          <div style="margin: 15px 0;">
            ${this.getHeroAbilities(hero)}
          </div>
          <div style="font-weight: bold; font-size: 16px; color: ${isSelected ? '#2ecc71' : '#e74c3c'};">
            ${isSelected ? '✓ SELECTED' : 'Press SPACE to Select'}
          </div>
        </div>
      `;
    }
    
    if (infoP) {
      infoP.innerHTML = `
        <div style="text-align: center; font-size: 18px; margin-top: 20px;">
          Selected Heroes: <span style="font-weight: bold; color: #3498db;">${this.selectedHeroes.length}/3</span>
          ${this.selectedHeroes.length === 3 ? '<div style="color: #2ecc71; font-weight: bold; margin-top: 10px;">Ready to start!</div>' : ''}
        </div>
      `;
    }
  }

  getHeroAbilities(hero) {
    const abilities = [];
    
    // Numeric abilities
    const numericAbilities = ['heal', 'burn', 'sluj', 'chain', 'rage', 'psych', 'armor'];
    numericAbilities.forEach(ability => {
      if (hero[ability] && hero[ability] > 0) {
        abilities.push(`<span style="background: rgba(46, 204, 113, 0.3); color: #2ecc71; padding: 3px 8px; margin: 2px; border-radius: 12px; font-size: 12px;">${ability}: ${hero[ability]}</span>`);
      }
    });

    // Boolean abilities  
    const booleanAbilities = ['torcher', 'shrink', 'joke', 'meat', 'tarot', 'nonseq'];
    booleanAbilities.forEach(ability => {
      if (hero[ability]) {
        abilities.push(`<span style="background: rgba(155, 89, 182, 0.3); color: #9b59b6; padding: 3px 8px; margin: 2px; border-radius: 12px; font-size: 12px;">${ability}</span>`);
      }
    });

    return abilities.length > 0 ? abilities.join('') : '<span style="color: #7f8c8d; font-style: italic;">No special abilities</span>';
  }

  toggleHeroSelection() {
    const selectedIndex = this.selectedHeroes.indexOf(this.heroIndex);
    
    if (selectedIndex > -1) {
      // Deselect hero
      this.selectedHeroes.splice(selectedIndex, 1);
      console.log(`Deselected ${heroData[this.heroIndex].name}`);
    } else if (this.selectedHeroes.length < 3) {
      // Select hero
      this.selectedHeroes.push(this.heroIndex);
      console.log(`Selected ${heroData[this.heroIndex].name}`);
    }

    this.updatePartyDisplay();

    // Check if party is complete
    if (this.selectedHeroes.length === 3) {
      console.log('Party complete! Starting game...');
      setTimeout(() => {
        this.startGame();
      }, 1000);
    }
  }

  startGame() {
    // Create party from selected heroes
    this.party = this.selectedHeroes.map(index => ({
      ...heroData[index],
      x: index,
      y: 0,
      maxHp: heroData[index].hp,
      movePoints: heroData[index].agility,
      hasAttacked: false
    }));
    
    console.log('Starting game with party:', this.party.map(h => h.name));
    this.showGame();
    this.initializeGame();
  }

  initializeGame() {
    // Initialize game canvas and basic game state
    const canvas = document.getElementById('gameCanvas');
    const levelTitle = document.getElementById('level-title');
    const status = document.getElementById('status');
    
    if (levelTitle) {
      levelTitle.textContent = 'NEW PIOSI - Level 1: The Beginning';
    }
    
    if (status) {
      status.innerHTML = `
        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; color: white;">
          <strong>Party:</strong> ${this.party.map(h => h.name).join(', ')} | 
          <strong>Status:</strong> Ready for Adventure!
        </div>
      `;
    }
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NEW PIOSI Game Engine', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Modern Architecture Implemented!', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  showGameReport() {
    console.log('=== NEW PIOSI GAME REPORT ===');
    console.log('Current Screen:', this.currentScreen);
    console.log('Selected Heroes:', this.selectedHeroes.map(i => heroData[i].name));
    console.log('Party:', this.party.map(h => h.name));
    console.log('Hero Data Count:', heroData.length);
  }
}

// Initialize the game
window.addEventListener('DOMContentLoaded', () => {
  window.simplePIOSI = new SimplePIOSI();
});

export { SimplePIOSI };