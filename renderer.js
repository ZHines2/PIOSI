import { state } from './state.js';

export function getCompleteStats(hero) {
  return {
    attack: hero.attack || 0,
    range: hero.range || 0,
    agility: hero.agility || 0,
    hp: hero.hp || 0,
    heal: hero.heal || 0,
    burn: hero.burn || 0,
    sluj: hero.sluj || 0,
    ghis: hero.ghis || 0,
    trick: hero.trick || 0,
    yeet: hero.yeet || 0,
    swarm: hero.swarm || 0,
    spicy: hero.spicy || 0,
    armor: hero.armor || 0,
    spore: hero.spore || 0,
    chain: hero.chain || 0,
    caprice: hero.caprice || 0,
    fate: hero.fate || 0,
    rage: hero.rage || 0,
    bulk: hero.bulk || 0,
    psych: hero.psych || 0,
    ankh: hero.ankh || 0,
    rise: hero.rise || 0,
    dodge: hero.dodge || 0,
    bomba: hero.bomba || 0,
  };
}

export function renderBattlefield() {
  const { battleEngine, party, isometricMode } = state;
  const gridDiv = document.getElementById('battlefield');
  const isoCanvas = document.getElementById('iso-battlefield');
  if (isometricMode) {
    gridDiv.style.display = 'none';
    isoCanvas.style.display = 'block';
    battleEngine.drawIsometricBattlefield(isoCanvas);
  } else {
    isoCanvas.style.display = 'none';
    gridDiv.style.display = '';
    gridDiv.innerHTML = battleEngine.drawBattlefield();
  }
  document.getElementById('status').textContent =
    'Wall HP: ' + battleEngine.wallHP + ' | ' +
    party[battleEngine.currentUnit].name +
    "'s Turn (Moves Left: " + battleEngine.movePoints + ')';
  updateBattleHUD();
}

export function updateBattleHUD() {
  const { battleEngine, party } = state;
  if (!battleEngine) return;
  const hero = party[battleEngine.currentUnit];
  const mode = battleEngine.awaitingAttackDirection ? '⚔ ATTACK — choose direction' : '↕ MOVE';

  const topDiv = document.getElementById('hud-top');
  if (topDiv) {
    topDiv.innerHTML =
      `<span class="hud-kv"><b>HERO:</b> ${hero.symbol} ${hero.name}</span>` +
      `<span class="hud-kv"><b>MOVES:</b> ${battleEngine.movePoints}</span>` +
      `<span class="hud-kv"><b>MODE:</b> ${mode}</span>` +
      `<span class="hud-kv"><b>WALL HP:</b> ${battleEngine.wallHP}</span>` +
      `<span class="hud-kv"><b>ENEMIES:</b> ${battleEngine.enemies.length}</span>`;
  }

  const partyDiv = document.getElementById('hud-party');
  if (partyDiv) {
    partyDiv.innerHTML = '<div class="hud-panel-title">PARTY</div>' +
      party.map((h, i) => {
        const isActive = i === battleEngine.currentUnit && !h.persistentDeath;
        const isDead = !!h.persistentDeath;
        const cls = isDead ? 'hud-hero hud-hero-dead' : isActive ? 'hud-hero hud-hero-active' : 'hud-hero';
        const statusEffectsText = h.statusEffects ? Object.keys(h.statusEffects).join(' ') : '';
        return `<div class="${cls}">` +
          `<div class="hud-hero-name">${h.symbol} ${h.name}</div>` +
          `<div class="hud-hero-stats"><span>HP: ${h.hp}</span>${h.armor ? `<span>ARM: ${h.armor}</span>` : ''}</div>` +
          (statusEffectsText ? `<div class="hud-hero-fx">${statusEffectsText}</div>` : '') +
          '</div>';
      }).join('');
  }
}
