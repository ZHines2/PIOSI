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
  const { battleEngine, party, isometricMode, uiOptions } = state;
  const gridDiv = document.getElementById('battlefield');
  const isoCanvas = document.getElementById('iso-battlefield');
  if (isometricMode) {
    gridDiv.style.display = 'none';
    isoCanvas.style.display = 'block';
    battleEngine.drawIsometricBattlefield(isoCanvas);
  } else {
    isoCanvas.style.display = 'none';
    gridDiv.style.display = '';
    gridDiv.innerHTML = battleEngine.drawBattlefield(uiOptions.showReadability);
  }
  document.getElementById('status').textContent =
    'Wall HP: ' + battleEngine.wallHP + ' | ' +
    party[battleEngine.currentUnit].name +
    "'s Turn (Moves Left: " + battleEngine.movePoints + ')';
  updateBattleHUD();
  renderPartyCards();
  renderTurnTimeline();
  renderEnemyIntent();
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

export function renderPartyCards() {
  const { battleEngine, party } = state;
  const cardsEl = document.getElementById('party-cards');
  if (!cardsEl || !battleEngine || !party.length) return;

  cardsEl.innerHTML = party.map((hero, index) => {
    const stats = getCompleteStats(hero);
    const chips = Object.entries(stats)
      .filter(([, v]) => typeof v === 'number' && v > 0)
      .map(([k, v]) => `<span class="stat-chip">${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}</span>`)
      .join('');
    const isActive = index === battleEngine.currentUnit && !hero.persistentDeath;
    const isDead = hero.hp <= 0 || !!hero.persistentDeath;
    return `<article class="party-card${isActive ? ' active-turn' : ''}${isDead ? ' defeated' : ''}">
      <div class="party-card-header">
        ${hero.sprite
          ? `<img class="party-sprite" src="${hero.sprite}" alt="${hero.name}">`
          : `<div class="party-symbol">${hero.symbol}</div>`}
        <h3>${hero.name}</h3>
      </div>
      <div class="party-card-stats">${chips || '<span class="stat-chip">No stats</span>'}</div>
    </article>`;
  }).join('');
}

export function renderTurnTimeline() {
  const { battleEngine, uiOptions } = state;
  const el = document.getElementById('turn-timeline');
  if (!el || !battleEngine) return;
  if (!uiOptions.showTimeline) { el.style.display = 'none'; return; }
  el.style.display = '';
  const items = battleEngine.getTurnTimeline(10);
  el.innerHTML = '<h3 class="panel-title">Turn Order</h3><div class="timeline-list">' +
    items.map(item => `<div class="timeline-item${item.active ? ' active' : ''}">${item.label}</div>`).join('') +
    '</div>';
}

export function renderEnemyIntent() {
  const { battleEngine, uiOptions } = state;
  const el = document.getElementById('enemy-intent');
  if (!el || !battleEngine) return;
  if (!uiOptions.showIntent) { el.style.display = 'none'; return; }
  el.style.display = '';
  const intents = battleEngine.getEnemyIntentPreview(8);
  el.innerHTML = '<h3 class="panel-title">Enemy Intent</h3><div class="intent-list">' +
    (intents.length
      ? intents.map(i =>
          `<div class="intent-item threat-${i.threatClass}"><strong>${i.enemy}</strong> → ${i.target} <em>(${i.note})</em></div>`
        ).join('')
      : '<div class="intent-item">No immediate threats.</div>') +
    '</div>';
}
