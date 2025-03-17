/**
 * renderer.js
 *
 * This file contains the logic for rendering the battlefield.
 * The `renderBattlefield` function is exported and used in `index.html`.
 */

/**
 * Renders the battlefield based on the current state of the battle engine.
 * @param {Object} battleEngine - The battle engine instance containing the battlefield state.
 */
export function renderBattlefield(battleEngine) {
  const battlefieldElement = document.getElementById("battlefield");
  if (!battlefieldElement) {
    console.error("Battlefield element not found");
    return;
  }

  let html = '';
  for (let y = 0; y < battleEngine.rows; y++) {
    html += '<div class="row">';
    for (let x = 0; x < battleEngine.cols; x++) {
      const cellContent = battleEngine.battlefield[y][x];
      let cellClass = '';
      if (cellContent === 'ౚ' || cellContent === 'ඉ') cellClass += ' healing-item';
      if (battleEngine.enemies.some(enemy => enemy.symbol === cellContent)) cellClass += ' enemy';
      const activeHero = battleEngine.party[battleEngine.currentUnit] && !battleEngine.party[battleEngine.currentUnit].persistentDeath ? battleEngine.party[battleEngine.currentUnit] : null;
      if (activeHero && activeHero.x === x && activeHero.y === y) {
        cellClass += battleEngine.awaitingAttackDirection ? ' attack-mode' : ' active';
      }
      html += `<div class="cell${cellClass}">${cellContent}</div>`;
    }
    html += '</div>';
  }
  battlefieldElement.innerHTML = html;
}
