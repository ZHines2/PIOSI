/**
 * Modern Renderer Manager for game visuals
 */
export class RendererManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rows = 5;
    this.cols = 5;
    this.grid = [];
    this.TILE_WIDTH = 50;
    this.TILE_HEIGHT = 24;
    
    // Rendering options
    this.showGrid = true;
    this.animationsEnabled = true;
    this.highQuality = true;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.warn('Game canvas not found');
      return false;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Could not get canvas context');
      return false;
    }

    // Enable high-quality rendering
    if (this.highQuality) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }

    console.log('Renderer initialized');
    return true;
  }

  initializeLevel(levelData, enemies) {
    this.rows = levelData.rows || 5;
    this.cols = levelData.cols || 5;
    
    // Initialize grid
    this.grid = Array(this.rows)
      .fill()
      .map(() => Array(this.cols).fill('.'));
    
    // Resize canvas
    this.canvas.width = this.cols * this.TILE_WIDTH;
    this.canvas.height = this.rows * this.TILE_HEIGHT;
    
    // Set high DPI scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    if (dpr > 1) {
      this.canvas.style.width = `${this.canvas.width}px`;
      this.canvas.style.height = `${this.canvas.height}px`;
      this.canvas.width *= dpr;
      this.canvas.height *= dpr;
      this.ctx.scale(dpr, dpr);
    }

    console.log(`Level initialized: ${this.rows}x${this.cols}`);
  }

  render() {
    this.clearCanvas();
    
    if (this.showGrid) {
      this.drawGrid();
    }
    
    this.drawWalls();
    this.drawEnemies();
    this.drawHeroes();
    
    // Add performance timing for debugging
    if (window.performance && window.performance.mark) {
      window.performance.mark('render-complete');
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Optional: Add subtle background gradient
    if (this.highQuality) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawGrid() {
    this.ctx.strokeStyle = this.highQuality ? '#333' : '#666';
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.7;

    // Vertical lines
    for (let i = 0; i <= this.cols; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.TILE_WIDTH, 0);
      this.ctx.lineTo(i * this.TILE_WIDTH, this.rows * this.TILE_HEIGHT);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= this.rows; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.TILE_HEIGHT);
      this.ctx.lineTo(this.cols * this.TILE_WIDTH, i * this.TILE_HEIGHT);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  drawWalls() {
    this.ctx.fillStyle = '#654321';
    this.ctx.strokeStyle = '#4a3319';
    this.ctx.lineWidth = 1;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y] && this.grid[y][x] === '#') {
          const tileX = x * this.TILE_WIDTH;
          const tileY = y * this.TILE_HEIGHT;
          
          // Draw wall with border
          this.ctx.fillRect(tileX, tileY, this.TILE_WIDTH, this.TILE_HEIGHT);
          this.ctx.strokeRect(tileX, tileY, this.TILE_WIDTH, this.TILE_HEIGHT);
        }
      }
    }
  }

  drawEnemies() {
    if (!window.gameState || !window.gameState.enemies) return;

    this.ctx.font = this.highQuality ? 'bold 20px Sono, monospace' : '16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    window.gameState.enemies.forEach(enemy => {
      if (enemy.hp <= 0) return;

      const x = enemy.x * this.TILE_WIDTH + this.TILE_WIDTH / 2;
      const y = enemy.y * this.TILE_HEIGHT + this.TILE_HEIGHT / 2;

      // Draw enemy background
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      this.ctx.fillRect(
        enemy.x * this.TILE_WIDTH + 2,
        enemy.y * this.TILE_HEIGHT + 2,
        this.TILE_WIDTH - 4,
        this.TILE_HEIGHT - 4
      );

      // Draw enemy symbol
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeText(enemy.symbol, x, y);
      this.ctx.fillText(enemy.symbol, x, y);

      // Draw HP bar if enabled
      if (this.highQuality && enemy.maxHp) {
        this.drawHealthBar(enemy, enemy.x, enemy.y);
      }
    });
  }

  drawHeroes() {
    if (!window.gameState || !window.gameState.party) return;

    this.ctx.font = this.highQuality ? 'bold 20px Sono, monospace' : '16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    window.gameState.party.forEach((hero, index) => {
      if (!hero.isAlive()) return;

      const x = hero.x * this.TILE_WIDTH + this.TILE_WIDTH / 2;
      const y = hero.y * this.TILE_HEIGHT + this.TILE_HEIGHT / 2;
      
      const isActive = index === window.gameState.currentHeroIndex;

      // Draw hero background
      this.ctx.fillStyle = isActive ? 'rgba(78, 205, 196, 0.3)' : 'rgba(69, 183, 184, 0.2)';
      this.ctx.fillRect(
        hero.x * this.TILE_WIDTH + 2,
        hero.y * this.TILE_HEIGHT + 2,
        this.TILE_WIDTH - 4,
        this.TILE_HEIGHT - 4
      );

      // Draw selection indicator for active hero
      if (isActive) {
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          hero.x * this.TILE_WIDTH + 1,
          hero.y * this.TILE_HEIGHT + 1,
          this.TILE_WIDTH - 2,
          this.TILE_HEIGHT - 2
        );
      }

      // Draw hero symbol
      this.ctx.fillStyle = isActive ? '#4ecdc4' : '#45b7b8';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeText(hero.symbol, x, y);
      this.ctx.fillText(hero.symbol, x, y);

      // Draw HP bar if enabled
      if (this.highQuality) {
        this.drawHealthBar(hero, hero.x, hero.y);
      }

      // Draw movement range if in move mode
      if (isActive && hero.movePoints > 0 && !window.gameState.attackMode) {
        this.drawMovementRange(hero);
      }
    });
  }

  drawHealthBar(entity, gridX, gridY) {
    const barWidth = this.TILE_WIDTH - 6;
    const barHeight = 4;
    const x = gridX * this.TILE_WIDTH + 3;
    const y = gridY * this.TILE_HEIGHT + this.TILE_HEIGHT - barHeight - 2;

    const healthPercent = entity.hp / entity.maxHp;

    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    // Health bar
    const healthColor = healthPercent > 0.6 ? '#4CAF50' : 
                       healthPercent > 0.3 ? '#FFC107' : '#F44336';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  drawMovementRange(hero) {
    this.ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
    this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    this.ctx.lineWidth = 1;

    for (let dy = -hero.movePoints; dy <= hero.movePoints; dy++) {
      for (let dx = -hero.movePoints; dx <= hero.movePoints; dx++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= hero.movePoints && distance > 0) {
          const targetX = hero.x + dx;
          const targetY = hero.y + dy;
          
          if (targetX >= 0 && targetX < this.cols && targetY >= 0 && targetY < this.rows) {
            if (!this.isWallAt(targetX, targetY)) {
              const pixelX = targetX * this.TILE_WIDTH;
              const pixelY = targetY * this.TILE_HEIGHT;
              
              this.ctx.fillRect(pixelX, pixelY, this.TILE_WIDTH, this.TILE_HEIGHT);
              this.ctx.strokeRect(pixelX, pixelY, this.TILE_WIDTH, this.TILE_HEIGHT);
            }
          }
        }
      }
    }
  }

  drawAttackRange(hero) {
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    this.ctx.lineWidth = 1;

    for (let dy = -hero.range; dy <= hero.range; dy++) {
      for (let dx = -hero.range; dx <= hero.range; dx++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= hero.range && distance > 0) {
          const targetX = hero.x + dx;
          const targetY = hero.y + dy;
          
          if (targetX >= 0 && targetX < this.cols && targetY >= 0 && targetY < this.rows) {
            const pixelX = targetX * this.TILE_WIDTH;
            const pixelY = targetY * this.TILE_HEIGHT;
            
            this.ctx.fillRect(pixelX, pixelY, this.TILE_WIDTH, this.TILE_HEIGHT);
            this.ctx.strokeRect(pixelX, pixelY, this.TILE_WIDTH, this.TILE_HEIGHT);
          }
        }
      }
    }
  }

  isWallAt(x, y) {
    return this.grid[y] && this.grid[y][x] === '#';
  }

  // Animation helpers
  animateExplosion(x, y, callback) {
    if (!this.animationsEnabled) {
      if (callback) callback();
      return;
    }

    const centerX = x * this.TILE_WIDTH + this.TILE_WIDTH / 2;
    const centerY = y * this.TILE_HEIGHT + this.TILE_HEIGHT / 2;
    
    let frame = 0;
    const maxFrames = 15;
    
    const animate = () => {
      // Save current canvas state
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw explosion effect
      const radius = (frame / maxFrames) * 30;
      const alpha = 1 - (frame / maxFrames);
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.globalAlpha = 1;
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        // Restore canvas and call callback
        this.ctx.putImageData(imageData, 0, 0);
        if (callback) callback();
      }
    };
    
    animate();
  }

  // Screen capture for debugging
  captureScreenshot() {
    return this.canvas.toDataURL('image/png');
  }
}