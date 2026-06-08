import { state } from './state.js';
import { getModeUpOptions } from './modeup.js';
import { getCompleteStats } from './renderer.js';

function buffLabel(buff) {
  return Object.entries(buff)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `+${v} ${k.charAt(0).toUpperCase() + k.slice(1)}`)
    .join(', ') || 'no change';
}

export function updateModeUpHeroDisplay() {
  const hero = state.livingHeroes[state.modeUpIndex];
  const [prescribed, emergent] = getModeUpOptions(hero, state.level);
  const stats = getCompleteStats(hero);
  const optIdx = state.modeUpOptionIndex;

  const statEntry = (label, val, buffVal) =>
    `<p>${label}: ${val}${buffVal ? ` <span class="stat-up">+${buffVal}</span>` : ''}</p>`;

  const activeBuff = optIdx === 0 ? prescribed : emergent;

  const col1 = [
    statEntry('HP',      stats.hp,      activeBuff.hp),
    statEntry('Attack',  stats.attack,  activeBuff.attack),
    statEntry('Range',   stats.range,   activeBuff.range),
    statEntry('Agility', stats.agility, activeBuff.agility),
    statEntry('Heal',    stats.heal,    activeBuff.heal),
    statEntry('Burn',    stats.burn,    activeBuff.burn),
    statEntry('Slüj',    stats.sluj,    activeBuff.sluj),
    statEntry('Ghïs',    stats.ghis,    activeBuff.ghis),
    statEntry('Trick',   stats.trick,   activeBuff.trick),
    statEntry('Yeet',    stats.yeet,    activeBuff.yeet),
    statEntry('Swarm',   stats.swarm,   activeBuff.swarm),
    statEntry('Spicy',   stats.spicy,   activeBuff.spicy),
  ].join('');

  const col2 = [
    statEntry('Armor',   stats.armor,   activeBuff.armor),
    statEntry('Spore',   stats.spore,   activeBuff.spore),
    statEntry('Chain',   stats.chain,   activeBuff.chain),
    statEntry('Caprice', stats.caprice, activeBuff.caprice),
    statEntry('Fate',    stats.fate,    activeBuff.fate),
    statEntry('Rage',    stats.rage,    activeBuff.rage),
    statEntry('Bulk',    stats.bulk,    activeBuff.bulk),
    statEntry('Psych',   stats.psych,   activeBuff.psych),
    statEntry('Ankh',    stats.ankh,    activeBuff.ankh),
    statEntry('Rise',    stats.rise,    activeBuff.rise),
    statEntry('Dodge',   stats.dodge,   activeBuff.dodge),
    statEntry('Bomba',   stats.bomba,   activeBuff.bomba),
  ].join('');

  document.getElementById('mode-up-hero-display').innerHTML = `
    <p class="highlight">${hero.name} (${hero.symbol})</p>
    <div class="modeup-options">
      <div class="modeup-option${optIdx === 0 ? ' active' : ''}" data-opt="0">
        <div class="modeup-option-label">⚔ Destiny Path</div>
        <div class="modeup-option-buff">${buffLabel(prescribed)}</div>
      </div>
      <div class="modeup-option${optIdx === 1 ? ' active' : ''}" data-opt="1">
        <div class="modeup-option-label">✦ Emergent Path</div>
        <div class="modeup-option-buff">${buffLabel(emergent)}</div>
      </div>
    </div>
    <div id="stats-container">
      <div class="stat-column">${col1}</div>
      <div class="stat-column">${col2}</div>
    </div>
    <p class="modeup-hint">◀ ▶ change hero · ▲ ▼ change path · Space confirm</p>`;

  // Click handlers for path options
  document.querySelectorAll('.modeup-option').forEach(el => {
    el.addEventListener('click', () => {
      state.modeUpOptionIndex = parseInt(el.dataset.opt, 10);
      updateModeUpHeroDisplay();
    });
  });
}
