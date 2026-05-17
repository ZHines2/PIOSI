import { state } from './state.js';
import { getModeUpBuff } from './modeup.js';
import { getCompleteStats } from './renderer.js';

export function updateModeUpHeroDisplay() {
  const hero = state.livingHeroes[state.modeUpIndex];
  const buff = getModeUpBuff(hero, state.level);
  const stats = getCompleteStats(hero);
  const statEntry = (label, val, buffVal) =>
    `<p>${label}: ${val} ${buffVal ? `<span class="stat-up">+${buffVal}</span>` : ''}</p>`;
  const col1 = [
    statEntry('HP', stats.hp, buff.hp),
    statEntry('Attack', stats.attack, buff.attack),
    statEntry('Range', stats.range, buff.range),
    statEntry('Agility', stats.agility, buff.agility),
    statEntry('Heal', stats.heal, buff.heal),
    statEntry('Burn', stats.burn, buff.burn),
    statEntry('Slüj', stats.sluj, buff.sluj),
    statEntry('Ghïs', stats.ghis, buff.ghis),
    statEntry('Trick', stats.trick, buff.trick),
    statEntry('Yeet', stats.yeet, buff.yeet),
    statEntry('Swarm', stats.swarm, buff.swarm),
    statEntry('Spicy', stats.spicy, buff.spicy),
  ].join('');
  const col2 = [
    statEntry('Armor', stats.armor, buff.armor),
    statEntry('Spore', stats.spore, buff.spore),
    statEntry('Chain', stats.chain, buff.chain),
    statEntry('Caprice', stats.caprice, buff.caprice),
    statEntry('Fate', stats.fate, buff.fate),
    statEntry('Rage', stats.rage, buff.rage),
    statEntry('Bulk', stats.bulk, buff.bulk),
    statEntry('Psych', stats.psych, buff.psych),
    statEntry('Ankh', stats.ankh, buff.ankh),
    statEntry('Rise', stats.rise, buff.rise),
    statEntry('Dodge', stats.dodge, buff.dodge),
    statEntry('Bomba', stats.bomba, buff.bomba),
  ].join('');
  document.getElementById('mode-up-hero-display').innerHTML =
    `<p class="highlight">${hero.name} (${hero.symbol})</p>` +
    `<div id="stats-container">` +
    `<div class="stat-column">${col1}</div>` +
    `<div class="stat-column">${col2}</div>` +
    `</div>`;
}
