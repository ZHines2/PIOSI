const game = {
  resources: { vittles: 0, mushrooms: 0, wood: 0, stone: 0 },
  wanderers: 0,
  wanderersOnSojourn: 0,
  selection: 'gather', // gather, summon, pyre, sojourn
  signalPyreBuilt: false,
  unlockedTiles: [],
  ticks: { phrase: 0, sequence: 1, totalSequences: 5, phrasesPerSequence: 25 },
};

const selections = ['gather', 'summon', 'pyre', 'sojourn'];

// Key events
document.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    performSelectedAction();
  } else if (event.code === 'ArrowDown') {
    moveSelection(1);
  } else if (event.code === 'ArrowUp') {
    moveSelection(-1);
  }
});

function performSelectedAction() {
  switch (game.selection) {
    case 'gather': gatherResources(); break;
    case 'summon': summonWanderer(); break;
    case 'pyre': buildSignalPyre(); break;
    case 'sojourn': sendOnSojourn(); break;
  }
}

function gatherResources() {
  Math.random() < 0.8 ? game.resources.vittles++ : game.resources.mushrooms++;
  updateUI();
}

function summonWanderer() {
  if (game.resources.vittles >= 10) {
    game.resources.vittles -= 10;
    game.wanderers++;
    updateUI();
  }
}

function buildSignalPyre() {
  if (!game.signalPyreBuilt && game.resources.wood >= 25) {
    game.resources.wood -= 25;
    game.signalPyreBuilt = true;
    updateUI();
  }
}

function sendOnSojourn() {
  if (game.signalPyreBuilt && game.wanderers >= 5 && game.wanderersOnSojourn === 0) {
    game.wanderers -= 5;
    game.wanderersOnSojourn = 5;
    game.sojournEnd = game.ticks.phrase + (game.ticks.phrasesPerSequence * game.ticks.totalSequences);
    updateUI();
  }
}

function completeSojourn() {
  game.wanderersOnSojourn = 0;
  const newTile = Math.random() < 0.5 ? '🌲' : '⛰️';
  game.unlockedTiles.push(newTile);
  updateUI();
}

function wandererGathering() {
  if (game.resources.mushrooms >= game.wanderers) {
    game.resources.mushrooms -= game.wanderers;
    for (let i = 0; i < game.wanderers; i++) {
      Math.random() < 0.9 ? game.resources.wood++ : game.resources.stone++;
    }
  }
}

function moveSelection(dir) {
  let idx = selections.indexOf(game.selection);
  do {
    idx = (idx + dir + selections.length) % selections.length;
  } while (!isSelectionAvailable(selections[idx]));
  game.selection = selections[idx];
  updateSelectionUI();
}

function isSelectionAvailable(sel) {
  if (sel === 'summon') return game.resources.vittles >= 10;
  if (sel === 'pyre') return game.resources.wood >= 25 && !game.signalPyreBuilt;
  if (sel === 'sojourn') return game.signalPyreBuilt && game.wanderers >= 5 && !game.wanderersOnSojourn;
  return true;
}

// Main game loop
setInterval(() => {
  wandererGathering();

  game.ticks.phrase++;
  if (game.wanderersOnSojourn && game.ticks.phrase === game.sojournEnd) {
    completeSojourn();
  }

  if (game.ticks.phrase > game.ticks.phrasesPerSequence) {
    game.ticks.phrase = 1;
    game.ticks.sequence = (game.ticks.sequence % 5) + 1;
  }

  updateUI();
}, 1000);

// UI update functions
function updateUI() {
  document.getElementById('vittles').innerText = `ౚ ${game.resources.vittles}`;
  document.getElementById('mushrooms').innerText = `🍄 ${game.resources.mushrooms}`;
  document.getElementById('wanderers').innerText = `𐫰 ${game.wanderers}`;
  document.getElementById('wood').innerText = `🪵 ${game.resources.wood}`;
  document.getElementById('stone').innerText = `🪨 ${game.resources.stone}`;
  document.getElementById('pyre').innerText = game.signalPyreBuilt ? `🔥 Built` : `🔥 Not Built`;
  document.getElementById('tiles').innerText = `Tiles: ${game.unlockedTiles.join(', ')}`;
}

function updateSelectionUI() {
  selections.forEach(sel => {
    document.getElementById(sel).style.backgroundColor = sel === game.selection ? '#ccc' : 'transparent';
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  updateSelectionUI();
});
