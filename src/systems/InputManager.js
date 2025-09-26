/**
 * Modern Input Manager with enhanced input handling
 */
export class InputManager {
  constructor() {
    this.listeners = new Map();
    this.keyStates = new Map();
    this.mouseState = { x: 0, y: 0, down: false };
    this.touchSupported = 'ontouchstart' in window;
    
    this.init();
  }

  init() {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.keyStates.set(event.code, true);
      this.emit('keydown', event);
    });

    document.addEventListener('keyup', (event) => {
      this.keyStates.set(event.code, false);
      this.emit('keyup', event);
    });

    // Mouse events
    document.addEventListener('mousedown', (event) => {
      this.mouseState.down = true;
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;
      this.emit('mousedown', event);
    });

    document.addEventListener('mouseup', (event) => {
      this.mouseState.down = false;
      this.emit('mouseup', event);
    });

    document.addEventListener('mousemove', (event) => {
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;
      this.emit('mousemove', event);
    });

    // Touch events for mobile
    if (this.touchSupported) {
      this.initTouchEvents();
    }

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    console.log('Input manager initialized');
  }

  initTouchEvents() {
    let touchStart = null;
    let swipeThreshold = 30;

    document.addEventListener('touchstart', (event) => {
      touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        time: Date.now()
      };
      this.emit('touchstart', event);
    });

    document.addEventListener('touchend', (event) => {
      if (!touchStart) return;

      const touchEnd = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
        time: Date.now()
      };

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const deltaTime = touchEnd.time - touchStart.time;

      // Check for swipe gesture
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        const direction = this.getSwipeDirection(deltaX, deltaY);
        this.emit('swipe', { direction, deltaX, deltaY, deltaTime });
        
        // Convert swipe to arrow key event
        const keyCode = this.swipeToKeyCode(direction);
        if (keyCode) {
          const syntheticEvent = new KeyboardEvent('keydown', { code: keyCode, key: keyCode });
          this.emit('keydown', syntheticEvent);
        }
      } else {
        // Short tap
        this.emit('tap', { x: touchEnd.x, y: touchEnd.y });
      }

      touchStart = null;
    });

    // Touch move for dragging
    document.addEventListener('touchmove', (event) => {
      event.preventDefault(); // Prevent scrolling
      this.emit('touchmove', event);
    });
  }

  getSwipeDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  swipeToKeyCode(direction) {
    const mapping = {
      'up': 'ArrowUp',
      'down': 'ArrowDown',
      'left': 'ArrowLeft',
      'right': 'ArrowRight'
    };
    return mapping[direction];
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  isKeyPressed(keyCode) {
    return this.keyStates.get(keyCode) || false;
  }

  getMouseState() {
    return { ...this.mouseState };
  }

  // Helper methods for common key combinations
  isMovementKey(keyCode) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyCode);
  }

  isModifierPressed(event) {
    return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  }

  // Virtual keyboard for mobile
  createVirtualControls() {
    if (!this.touchSupported) return;

    const container = document.createElement('div');
    container.className = 'virtual-controls';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
      gap: 5px;
      width: 120px;
      height: 120px;
      z-index: 1000;
      pointer-events: all;
    `;

    // Create directional buttons
    const buttons = [
      { text: '↖', row: 1, col: 1, keys: ['ArrowUp', 'ArrowLeft'] },
      { text: '↑', row: 1, col: 2, keys: ['ArrowUp'] },
      { text: '↗', row: 1, col: 3, keys: ['ArrowUp', 'ArrowRight'] },
      { text: '←', row: 2, col: 1, keys: ['ArrowLeft'] },
      { text: '⚔', row: 2, col: 2, keys: ['Space'] }, // Attack/Select button
      { text: '→', row: 2, col: 3, keys: ['ArrowRight'] },
      { text: '↙', row: 3, col: 1, keys: ['ArrowDown', 'ArrowLeft'] },
      { text: '↓', row: 3, col: 2, keys: ['ArrowDown'] },
      { text: '↘', row: 3, col: 3, keys: ['ArrowDown', 'ArrowRight'] },
    ];

    buttons.forEach(({ text, row, col, keys }) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        grid-row: ${row};
        grid-column: ${col};
        background: rgba(0,0,0,0.7);
        color: white;
        border: 1px solid #444;
        border-radius: 5px;
        font-size: 16px;
        touch-action: manipulation;
        user-select: none;
      `;

      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.background = 'rgba(255,255,255,0.3)';
        
        keys.forEach(key => {
          const event = new KeyboardEvent('keydown', { code: key, key });
          this.emit('keydown', event);
        });
      });

      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.background = 'rgba(0,0,0,0.7)';
      });

      container.appendChild(button);
    });

    document.body.appendChild(container);
    return container;
  }
}