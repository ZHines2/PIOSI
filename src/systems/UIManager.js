/**
 * Modern UI Manager for handling user interface
 */
export class UIManager {
  constructor() {
    this.listeners = new Map();
    this.currentScreen = null;
    this.elements = new Map();
    this.notifications = [];
    
    this.init();
  }

  init() {
    // Cache commonly used elements
    this.cacheElements();
    
    // Initialize notification system
    this.createNotificationContainer();
    
    console.log('UI Manager initialized');
  }

  cacheElements() {
    const elementIds = [
      'title-screen',
      'party-select',
      'game-container',
      'hero-display',
      'selection-info',
      'status',
      'log',
      'level-title'
    ];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements.set(id, element);
      } else {
        console.warn(`Element not found: ${id}`);
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  showScreen(screenName) {
    // Hide all screens
    const screens = ['title-screen', 'party-select', 'game-container', 'emanations-mode'];
    screens.forEach(screen => {
      const element = this.elements.get(screen) || document.getElementById(screen);
      if (element) {
        element.style.display = 'none';
      }
    });

    // Show target screen
    let targetElement;
    switch (screenName) {
      case 'title':
        targetElement = this.elements.get('title-screen');
        break;
      case 'party-select':
        targetElement = this.elements.get('party-select');
        break;
      case 'game-screen':
        targetElement = this.elements.get('game-container');
        break;
      case 'emanations-mode':
        targetElement = document.getElementById('emanations-mode');
        break;
    }

    if (targetElement) {
      targetElement.style.display = 'block';
      this.currentScreen = screenName;
      
      // Add screen transition effects
      this.animateScreenTransition(targetElement);
    } else {
      console.warn(`Screen element not found: ${screenName}`);
    }
  }

  animateScreenTransition(element) {
    // Simple fade-in effect
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }

  updatePartySelect({ hero, isSelected, selectedCount }) {
    const displayDiv = this.elements.get('hero-display');
    const infoP = this.elements.get('selection-info');

    if (!displayDiv || !infoP) {
      console.warn('Party select elements not found');
      return;
    }

    // Create enhanced hero display
    displayDiv.innerHTML = `
      <div class="hero-card ${isSelected ? 'selected' : ''}">
        <div class="hero-header">
          <h3>${hero.name}</h3>
          <div class="hero-symbol">${hero.symbol}</div>
        </div>
        <img src="${hero.sprite}" alt="${hero.name}" width="80" height="80" class="hero-sprite" />
        <div class="hero-description">
          <p>${hero.description || 'A brave warrior ready for battle.'}</p>
        </div>
        <div class="hero-stats">
          <div class="stat-row">
            <span class="stat-label">Attack:</span>
            <span class="stat-value">${hero.attack}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Range:</span>
            <span class="stat-value">${hero.range}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Agility:</span>
            <span class="stat-value">${hero.agility}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">HP:</span>
            <span class="stat-value">${hero.hp}</span>
          </div>
        </div>
        <div class="hero-abilities">
          ${this.renderHeroAbilities(hero)}
        </div>
        <div class="selection-status">
          ${isSelected ? '✓ SELECTED' : 'Press SPACE to Select'}
        </div>
      </div>
    `;

    infoP.innerHTML = `
      <div class="selection-counter">
        Selected Heroes: <span class="count">${selectedCount}/3</span>
        ${selectedCount === 3 ? '<div class="ready-indicator">Ready to start!</div>' : ''}
      </div>
    `;

    // Add CSS if not already present
    this.ensurePartySelectStyles();
  }

  renderHeroAbilities(hero) {
    const abilities = [];
    
    // Check for special numeric abilities
    const numericAbilities = ['heal', 'burn', 'sluj', 'chain', 'rage', 'psych', 'armor'];
    numericAbilities.forEach(ability => {
      if (hero[ability] && hero[ability] > 0) {
        abilities.push(`<span class="ability">${ability}: ${hero[ability]}</span>`);
      }
    });

    // Check for boolean abilities
    const booleanAbilities = ['torcher', 'shrink', 'joke', 'meat', 'tarot', 'nonseq'];
    booleanAbilities.forEach(ability => {
      if (hero[ability]) {
        abilities.push(`<span class="ability special">${ability}</span>`);
      }
    });

    return abilities.length > 0 ? abilities.join('') : '<span class="no-abilities">No special abilities</span>';
  }

  ensurePartySelectStyles() {
    if (document.getElementById('party-select-styles')) return;

    const style = document.createElement('style');
    style.id = 'party-select-styles';
    style.textContent = `
      .hero-card {
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border: 2px solid #34495e;
        border-radius: 12px;
        padding: 20px;
        margin: 10px auto;
        max-width: 400px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      }
      .hero-card.selected {
        border-color: #3498db;
        background: linear-gradient(135deg, #3498db, #2980b9);
        transform: scale(1.02);
      }
      .hero-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .hero-header h3 {
        margin: 0;
        color: #ecf0f1;
      }
      .hero-symbol {
        font-size: 24px;
        background: rgba(255,255,255,0.1);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hero-sprite {
        display: block;
        margin: 0 auto 15px auto;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .hero-description {
        font-style: italic;
        color: #bdc3c7;
        margin-bottom: 15px;
        text-align: center;
      }
      .hero-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 10px;
        background: rgba(255,255,255,0.1);
        border-radius: 5px;
      }
      .stat-label {
        font-weight: bold;
      }
      .stat-value {
        color: #3498db;
        font-weight: bold;
      }
      .hero-abilities {
        margin-bottom: 15px;
      }
      .ability {
        display: inline-block;
        background: rgba(46, 204, 113, 0.3);
        color: #2ecc71;
        padding: 3px 8px;
        margin: 2px;
        border-radius: 12px;
        font-size: 12px;
        border: 1px solid #2ecc71;
      }
      .ability.special {
        background: rgba(155, 89, 182, 0.3);
        color: #9b59b6;
        border-color: #9b59b6;
      }
      .no-abilities {
        color: #7f8c8d;
        font-style: italic;
      }
      .selection-status {
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        color: #e74c3c;
      }
      .hero-card.selected .selection-status {
        color: #2ecc71;
      }
      .selection-counter {
        text-align: center;
        font-size: 18px;
        margin-top: 20px;
      }
      .count {
        font-weight: bold;
        color: #3498db;
      }
      .ready-indicator {
        color: #2ecc71;
        font-weight: bold;
        margin-top: 10px;
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
  }

  updateHeroStatus(hero) {
    const statusElement = this.elements.get('status');
    if (!statusElement) return;

    statusElement.innerHTML = `
      <div class="hero-status">
        <span class="hero-name">${hero.name}</span>
        <span class="hero-hp">HP: ${hero.hp}/${hero.maxHp}</span>
        <span class="hero-moves">Moves: ${hero.movePoints}</span>
        <span class="hero-mode">${window.gameState?.attackMode ? 'ATTACK MODE' : 'MOVE MODE'}</span>
      </div>
    `;

    this.ensureStatusStyles();
  }

  ensureStatusStyles() {
    if (document.getElementById('status-styles')) return;

    const style = document.createElement('style');
    style.id = 'status-styles';
    style.textContent = `
      .hero-status {
        display: flex;
        gap: 20px;
        align-items: center;
        padding: 10px;
        background: rgba(0,0,0,0.3);
        border-radius: 5px;
        margin: 10px 0;
      }
      .hero-name {
        font-weight: bold;
        color: #3498db;
      }
      .hero-hp {
        color: #e74c3c;
      }
      .hero-moves {
        color: #f39c12;
      }
      .hero-mode {
        color: #2ecc71;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  showMessage(message, type = 'info', duration = 3000) {
    const logElement = this.elements.get('log');
    if (logElement) {
      const timestamp = new Date().toLocaleTimeString();
      logElement.innerHTML += `<div class="log-message ${type}">[${timestamp}] ${message}</div>`;
      logElement.scrollTop = logElement.scrollHeight;
    }

    // Also show as notification
    this.showNotification(message, type, duration);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Remove after duration
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }

  showGameStateReport(report) {
    const modal = document.createElement('div');
    modal.className = 'game-state-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Game State Report</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="report-section">
            <h4>Game Session</h4>
            <p>Score: ${report.gameSession.playerScore}/${report.gameSession.maxScore}</p>
            <p>Discovered Zones: ${report.gameSession.discoveredZones}</p>
            <p>Total Enemies: ${report.gameSession.totalEnemies}</p>
          </div>
          <div class="report-section">
            <h4>Current Location</h4>
            <p>Scene: ${report.currentLocation.scene}</p>
            <p>Enemies Present: ${report.currentLocation.enemiesPresent}</p>
          </div>
          <div class="report-section">
            <h4>Party Status</h4>
            <p>Active Hero: ${report.party.activeHero?.name || 'None'}</p>
            <p>Alive: ${report.party.aliveHeroes} | Dead: ${report.party.deadHeroes}</p>
          </div>
        </div>
      </div>
    `;

    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
    `;

    const closeBtn = modal.querySelector('.close-button');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      float: right;
    `;

    closeBtn.onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };

    document.body.appendChild(modal);
  }

  showError(message) {
    this.showNotification(message, 'error', 5000);
    
    // Also create an error overlay for critical errors
    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10001;
      ">
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          background: white;
          color: #e74c3c;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        ">Reload Page</button>
      </div>
    `;
    
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
    `;

    document.body.appendChild(overlay);
  }

  showEmanationsUI() {
    // Implementation for emanations mode UI
    console.log('Showing emanations UI');
  }

  createNotificationContainer() {
    // Container is created dynamically for each notification
    // This is more flexible than a fixed container
  }
}