import { heroes as staticHeroes } from './heroes.js';
import { getLevel as getStaticLevel } from './levels.js';

export const state = {
  currentScreen: 'title',
  level: 1,
  party: [],
  selectedHeroes: [],
  heroIndex: 0,
  enemies: [],
  battleEngine: null,
  cheatActive: false,
  isometricMode: false,
  modeUpIndex: 0,
  modeUpOptionIndex: 0,   // 0 = prescribed path, 1 = emergent (stat-derived)
  offlineMode: false,
  livingHeroes: [],
  loadedManifest: null,
  allHeroes: staticHeroes,
  getLevel: getStaticLevel,
  uiOptions: {
    showTimeline: true,
    showIntent: true,
    showReadability: true,
  },
};
