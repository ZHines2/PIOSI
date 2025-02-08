/**
 * levels.js
 *
 * Tutorial:
 * This module defines game level configurations in a scalable and maintainable way.
 * Each level object includes:
 *   - level: numeric identifier
 *   - title: descriptive title
 *   - rows & cols: grid dimensions
 *   - wallHP: structural health to break through
 *   - enemies: array of enemy configuration objects (optional)
 *   - generateEnemies: boolean for dynamic enemy placement (optional)
 *   - enemyGenerator: function for generating enemies dynamically (optional)
 *   - dialogueEntities: array of entities that can be interacted with for lore (optional)
 */

export const levelSettings = [
  {
    level: 1,
    title: "Level 1: The Breaking Wall",
    rows: 5,
    cols: 10,
    wallHP: 20,
    enemies: []
  },
  {
    level: 2,
    title: "Level 2: The Reinforced Barricade",
    rows: 7,
    cols: 12,
    wallHP: 40,
    enemies: [
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 3
      },
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 5
      }
    ]
  },
  {
    level: 3,
    title: "Level 3: The Vertical Corridor",
    rows: 14,
    cols: 3,
    wallHP: 60,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      for (let col = 0; col < cols; col++) {
        enemies.push({
          name: "Buckleman",
          symbol: "⛨",
          attack: 1,
          range: 1,
          hp: 20,
          agility: 1,
          x: col,
          y: Math.floor(rows / 2)
        });
      }
      return enemies;
    }
  },
  {
    level: 4,
    title: "Level 4: Outside the Gratt",
    rows: 3,
    cols: 15,
    wallHP: 70,
    enemies: [
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 0 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 11, y: 1 },
      { name: "Buckleman", symbol: "⛨", attack: 1, range: 1, hp: 20, agility: 1, x: 8, y: 2 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 2 }
    ]
  },
  {
    level: 99,
    title: "Level ௧: Further Introspection",
    rows: 15,
    cols: 15,
    wallHP: 100,
    enemies: [
      {
        name: "Shadow Duelist",
        symbol: "Ξ",
        attack: 5,
        range: 1,
        hp: 25,
        agility: 3,
        x: 10,
        y: 10,
        dialogue: [
          "We are reflections of your inner struggles...",
          "The wall you seek to break... is it truly stone?",
          "Some barriers exist in the mind alone."
        ]
      },
      {
        name: "Spectral Archer",
        symbol: "Λ",
        attack: 4,
        range: 3,
        hp: 15,
        agility: 2,
        x: 8,
        y: 2,
        dialogue: [
          "Our arrows pierce both flesh and illusion.",
          "Beyond this wall lies a truth you may not be ready to face.",
          "What drives you to break through? Glory? Knowledge? Or something deeper?"
        ]
      }
    ]
  },
  {
    level: 100,
    title: "Level ∞: The Chamber of Echoes",
    rows: 20,
    cols: 20,
    wallHP: 150,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const loreKeepers = [
        {
          name: "Ancient Chronicler",
          symbol: "ℜ",
          attack: 0,
          range: 1,
          hp: 40,
          agility: 2,
          x: Math.floor(cols / 2),
          y: Math.floor(rows / 2),
          dialogue: [
            "Welcome to the Chamber of Echoes, where truth and memory intertwine.",
            "The walls you've broken, the battles you've fought... all reflections of greater struggles.",
            "Our world was not always divided by walls. They rose when fear overcame wisdom.",
            "Each symbol you see - they are more than mere characters. They are echoes of ancient powers."
          ]
        },
        {
          name: "Time Weaver",
          symbol: "Ѯ",
          attack: 3,
          range: 3,
          hp: 30,
          agility: 5,
          x: cols - 3,
          y: rows - 3,
          dialogue: [
            "I have watched countless cycles of breaking and rebuilding.",
            "The Griot's tales? Mere fragments of a vast tapestry.",
            "Want to know about the first wall? Or perhaps... the last one?"
          ]
        },
        {
          name: "Reality Breaker",
          symbol: "Ѭ",
          attack: 4,
          range: 2,
          hp: 35,
          agility: 3,
          x: 2,
          y: 2,
          dialogue: [
            "You think you're breaking walls? You're breaking reality itself.",
            "Each level is a layer of truth. Each symbol a fragment of forgotten knowledge.",
            "The Slüjier's power? A remnant of chaos from before the walls."
          ]
        }
      ];

      for (let i = 0; i < 4; i++) {
        loreKeepers.push({
          name: "Echo Spirit",
          symbol: "Ԇ",
          attack: 2,
          range: 2,
          hp: 20,
          agility: 2,
          x: Math.floor(Math.random() * (cols - 4)) + 2,
          y: Math.floor(Math.random() * (rows - 4)) + 2,
          dialogue: [
            "Did you know the Knight's symbol represents more than just strength?",
            "The Torcher's flames carry whispers of ancient purification rites.",
            "Even the Jester's jokes hold fragments of forgotten wisdom.",
            "The walls remember when they were mountains, before they were carved into barriers."
          ]
        });
      }

      return loreKeepers;
    }
  },
  {
    level: 101,
    title: "Level Ω: Gratt Prime",
    rows: 25,
    cols: 25,
    wallHP: 1000,
    generateEnemies: true,
    waveNumber: 0,
    restPhase: false,
    enemyGenerator: (rows, cols, waveNumber = 0) => {
      if (waveNumber % 5 === 0) {
        return [
          {
            name: "Healing Shrine",
            symbol: "₪",
            attack: 0,
            range: 2,
            hp: 999,
            agility: 0,
            x: Math.floor(cols / 2),
            y: Math.floor(rows / 2),
            healing: true,
            healAmount: 15 + Math.floor(waveNumber / 5) * 5,
            dialogue: [
              "Rest, warriors. The cycle continues.",
              "Your strength returns, but the wall endures.",
              "The Gratt remembers those who persist."
            ]
          },
          {
            name: "Gratt Keeper",
            symbol: "Ψ",
            attack: 0,
            range: 1,
            hp: 999,
            agility: 1,
            x: Math.floor(cols / 2) - 2,
            y: Math.floor(rows / 2),
            dialogue: [
              "The wall has stood since time immemorial.",
              "Each strike weakens its eternal vigil.",
              "Wisdom may succeed where force fails."
            ]
          }
        ];
      }

      const enemies = [];
      const baseEnemyCount = 3 + Math.floor(waveNumber / 2);
      const waveStrength = Math.floor(waveNumber / 10);

      const enemyTypes = [
        {
          name: "Gratt Sentinel",
          symbol: "Ѫ",
          attack: 4 + waveStrength,
          range: 2,
          hp: 15 + waveStrength * 5,
          agility: 2 + Math.floor(waveStrength / 2)
        },
        {
          name: "Phase Striker",
          symbol: "Ж",
          attack: 6 + waveStrength * 2,
          range: 1,
          hp: 10 + waveStrength * 3,
          agility: 4 + waveStrength
        },
        {
          name: "Echo Mage",
          symbol: "Ω",
          attack: 3 + waveStrength,
          range: 4 + Math.floor(waveStrength / 2),
          hp: 8 + waveStrength * 2,
          agility: 2
        }
      ];

      if (waveNumber >= 10) {
        enemyTypes.push({
          name: "Gratt Champion",
          symbol: "Ԅ",
          attack: 8 + waveStrength * 2,
          range: 2,
          hp: 30 + waveStrength * 8,
          agility: 3 + Math.floor(waveStrength / 2)
        });
      }

      if (waveNumber >= 20) {
        enemyTypes.push({
          name: "Time Weaver Echo",
          symbol: "Җ",
          attack: 5 + waveStrength,
          range: 3,
          hp: 20 + waveStrength * 4,
          agility: 5 + waveStrength,
          dialogue: [
            "Time flows differently here...",
            "The wall remembers every assault.",
            "Perhaps there is another way."
          ]
        });
      }

      for (let i = 0; i < baseEnemyCount; i++) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = { ...enemyType, x: 0, y: 0 };
        
        let placed = false;
        while (!placed) {
          const x = Math.floor(Math.random() * (cols - 4)) + 2;
          const y = Math.floor(Math.random() * (rows - 4)) + 2;
          
          const isFarEnough = enemies.every(e => 
            Math.abs(e.x - x) > 3 || Math.abs(e.y - y) > 3
          );

          if (isFarEnough) {
            enemy.x = x;
            enemy.y = y;
            placed = true;
          }
        }

        enemies.push(enemy);
      }

      if (waveNumber > 0 && waveNumber % 10 === 0) {
        enemies.forEach(enemy => {
          enemy.dialogue = [
            "The wall weakens not through force alone.",
            "Ancient runes pulse with forgotten meaning.",
            "Patterns emerge for those who observe."
          ];
        });
      }

      return enemies;
    },
    onWaveComplete: (waveNumber) => ({
      message: `The eternal wall endures...`,
      wallDamageReduction: Math.max(0.5, 1 - (waveNumber * 0.01))
    }),
    getWaveStats: (waveNumber) => ({
      enemyScale: 1 + (waveNumber * 0.1)
    })
  }
];

export function getLevel(levelNumber) {
  const level = levelSettings.find(ls => ls.level === levelNumber);
  if (!level) return null;
  let enemies;

  if (level.generateEnemies && typeof level.enemyGenerator === "function") {
    enemies = level.enemyGenerator(level.rows, level.cols, level.waveNumber || 0);
  } else {
    enemies = (level.enemies || []).map(enemy => {
      if (enemy.enemyXOffset !== undefined) {
        return {
          ...enemy,
          x: level.cols - enemy.enemyXOffset,
          y: Math.floor(level.rows / 2)
        };
      }
      return enemy;
    });
  }

  return {
    rows: level.rows,
    cols: level.cols,
    wallHP: level.wallHP,
    title: level.title,
    enemies,
    onWaveComplete: level.onWaveComplete,
    getWaveStats: level.getWaveStats
  };
}

export function hasDialogue(entity) {
  return Array.isArray(entity.dialogue) && entity.dialogue.length > 0;
}

export function getRandomDialogue(entity) {
  if (!hasDialogue(entity)) return null;
  return entity.dialogue[Math.floor(Math.random() * entity.dialogue.length)];
}
