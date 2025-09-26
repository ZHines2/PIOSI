# NEW PIOSI - Modernized Edition

🎮 **A completely modernized version of the classic PIOSI game, rebuilt with contemporary web development practices and enhanced with beautiful UI/UX.**

## ✨ Features

### 🏗️ **Modern Architecture**
- **ES6+ Modules**: Clean, modular JavaScript with modern syntax
- **Vite Build System**: Lightning-fast development with hot module reload
- **Component-Based**: Organized systems for GameState, Audio, Renderer, Input, and UI
- **Event-Driven**: Modern pub/sub architecture for system communication

### 🎨 **Enhanced User Experience**
- **Beautiful UI**: Stunning hero selection cards with dynamic styling
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Visual Polish**: Smooth transitions, animations, and visual feedback
- **Intuitive Controls**: Keyboard navigation with touch/swipe support

### 🎵 **Rich Audio System**
- **Background Music**: Dynamic music system with fade effects
- **Audio Management**: Modern AudioManager with playlist support
- **Performance Optimized**: Efficient audio loading and playback

### 🎯 **Enhanced Gameplay**
- **26+ Unique Heroes**: Each with detailed stats, abilities, and descriptions
- **Strategic Party Building**: Choose 3 heroes from diverse character classes
- **Beautiful Hero Cards**: Rich visual presentation of hero information
- **Game State Management**: Comprehensive game state tracking and reporting

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/ZHines2/PIOSI.git
cd PIOSI

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How to Play

### **Title Screen**
- Press **SPACE** to start the game

### **Party Selection**
- Use **LEFT/RIGHT** arrow keys to browse heroes
- Press **SPACE** to select/deselect a hero
- Choose exactly **3 heroes** to proceed
- Each hero has unique stats and abilities

### **Game Screen**
- Use **arrow keys** to move your heroes
- Press **SPACE** to attack
- Press **V** to view detailed game state report

## 📱 Mobile Support

NEW PIOSI includes full mobile support:
- **Touch Controls**: Tap and swipe gestures
- **Responsive UI**: Optimized for mobile screens
- **Virtual Controls**: On-screen control options

## 🛠️ Development

### **Project Structure**
```
src/
├── components/          # Game components (Hero, etc.)
├── systems/            # Game systems (Audio, Renderer, etc.)
├── data/              # Game data (heroes, levels, etc.)
├── utils/             # Utility functions
└── types/             # Type definitions

assets/
├── audio/             # Music and sound effects
├── images/            # Game images
└── sprites/           # Character sprites
```

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### **Development Features**
- **Hot Module Reload**: Instant updates during development
- **Error Overlay**: Clear error messages and stack traces
- **Source Maps**: Easy debugging with original source files
- **Linting & Formatting**: Consistent code quality

## 🎯 Technical Innovations

### **Modern JavaScript**
- ES6+ modules with clean imports/exports
- Modern async/await patterns
- Class-based architecture with proper encapsulation
- Event-driven system communication

### **Performance Optimizations**
- Efficient asset loading and caching
- Optimized rendering with canvas
- Smart event handling and memory management
- Build-time optimization with Vite

### **Developer Experience**
- TypeScript-style JSDoc annotations
- Comprehensive error handling and logging
- Modern debugging tools integration
- Clean, maintainable code structure

## 🎨 Hero System

NEW PIOSI features **26+ unique heroes**, each with:

### **Core Stats**
- **Attack**: Damage dealt to enemies
- **Range**: Attack distance
- **Agility**: Movement speed and turn order
- **HP**: Health points

### **Special Abilities**
- **Numeric Abilities**: heal, burn, chain, rage, psych, etc.
- **Boolean Abilities**: torcher, shrink, joke, meat, tarot, etc.
- **Unique Mechanics**: Each hero has distinctive gameplay elements

### **Examples**
- **Knight** ♞: Balanced warrior with solid combat stats
- **Wizard** ✡: Long-range spellcaster with chain lightning
- **Archer** ⚔: Ranged specialist with excellent reach
- **Rogue** 🗡: High-damage assassin with superior mobility

## 📈 Future Enhancements

- **Level System**: Complete the battle engine with levels and enemies
- **Save System**: Persistent game progress
- **Multiplayer**: Online multiplayer support
- **Mod Support**: Community content and customization
- **Advanced Graphics**: Enhanced visual effects and animations

## 🤝 Contributing

NEW PIOSI is open for contributions! Whether it's bug fixes, new features, or gameplay enhancements, all contributions are welcome.

## 📄 License

MIT License - feel free to use, modify, and distribute as needed.

---

**NEW PIOSI** represents the evolution of indie game development, combining nostalgic gameplay with modern web technologies. Experience the perfect blend of classic strategy gaming and contemporary user experience design! 🎮✨