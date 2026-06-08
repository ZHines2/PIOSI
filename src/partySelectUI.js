import { state } from './state.js';
import {
  fetchJoke, fetchBaconIpsum, fetchTarotCard, fetchNonseqFact,
  fetchShrinkAdvice, fetchRandomRecipe, getGriotReaction,
} from './griot.js';
import { getCompleteStats } from './renderer.js';

// ── Archetype derivation ──────────────────────────────────────────────────────

function getArchetype(hero) {
  if ((hero.heal || 0) > 0 || (hero.psych || 0) > 0 || (hero.swarm || 0) > 0 ||
      (hero.spicy || 0) > 0 || (hero.spore || 0) > 0) return 'Support';
  if ((hero.range || 0) >= 5) return 'Ranged';
  if ((hero.agility || 0) >= 5 || (hero.yeet || 0) > 0 || (hero.bomba || 0) > 0) return 'Skirmisher';
  if ((hero.hp || 0) >= 18 && (hero.range || 0) <= 2) return 'Frontliner';
  return 'Wildcard';
}

// ── Synergy hints ─────────────────────────────────────────────────────────────

function getSynergyHint(selectedIndices, allHeroes) {
  if (!selectedIndices.length) return '';
  const selected = selectedIndices.map(i => allHeroes[i]);
  const archetypes = selected.map(getArchetype);
  const ids = selected.map(h => h.id || h.name.toLowerCase());

  if (selectedIndices.length === 1) {
    const a = archetypes[0];
    if (a === 'Frontliner') return 'Solid anchor. Second slot: Ranged to work from safety, or Support to sustain the frontline.';
    if (a === 'Ranged')     return 'Long reach but fragile. A Frontliner to absorb hits would help.';
    if (a === 'Support')    return 'Strong sustain core. Your second pick wants to be a damage dealer.';
    if (a === 'Skirmisher') return 'High mobility. Pair with someone who holds ground so you have a safe base to return to.';
    return 'Wildcard start — anything can pair here. Pick what sounds interesting.';
  }

  if (selectedIndices.length === 2) {
    // Named synergies
    if (ids.includes('mellitron') && ids.includes('yeetrian'))
      return '⚡ Mellitron + Yeetrian: yeet enemies into swarm range for passive AoE stacking. Third slot: a healer keeps it going.';
    if (ids.includes('wizard') && ids.includes('mellitron'))
      return '⚡ Double AoE pressure. Both heroes are fragile — add a Frontliner to give them a body shield.';
    if (ids.includes('berserker') && ids.includes('cleric'))
      return '⚡ Classic rage-and-heal. Berserker tanks and snowballs; Cleric keeps HP topped. Third slot is free.';
    if (ids.includes('kemetic') && (ids.includes('cleric') || ids.includes('greenjay')))
      return '⚡ Ankh + healing: dying becomes a strategic buff delivery. Third slot wants raw damage.';
    if (ids.includes('palisade') && ids.includes('mellitron'))
      return '⚡ Wall + swarm: park Mellitron behind Palisade and let the aura work. Third slot: range.';
    if (ids.includes('sycophant') && ids.includes('cleric'))
      return '⚡ Sycophant starts at zero — the Cleric keeps it alive long enough to Mode Up into a powerhouse.';
    if (ids.includes('paeg') && ids.includes('palisade'))
      return '⚡ Pæg hidden behind armor: glass artillery protected by a tank. Extremely fragile, extremely potent.';

    // Archetype-based hints
    const hasFront      = archetypes.includes('Frontliner');
    const hasRange      = archetypes.includes('Ranged');
    const hasSupport    = archetypes.includes('Support');
    const hasSkirmisher = archetypes.includes('Skirmisher');

    if (hasFront && hasRange)      return 'Good foundation. Third slot: Support will keep both alive longer — or a Skirmisher for aggression.';
    if (hasFront && hasSupport)    return 'Durable core. Third slot: Ranged or Skirmisher for reach.';
    if (hasRange && hasSupport)    return 'Fragile backline. You need a Frontliner up front to absorb hits.';
    if (hasFront && hasFront)      return 'Heavy frontline. Third slot: range or mobility to reach isolated targets.';
    if (hasSkirmisher && hasRange) return 'Mobile and long-reach. A Frontliner or Support rounds this out.';
    return 'Interesting combination. Third slot can pull this in any direction.';
  }

  return '';
}

// ── Upstage trio (selected party) ────────────────────────────────────────────

export function renderPartySlots() {
  const el = document.getElementById('party-slots');
  if (!el) return;
  el.innerHTML = [0, 1, 2].map(i => {
    const heroIdx = state.selectedHeroes[i];
    const hero = heroIdx !== undefined ? state.allHeroes[heroIdx] : null;
    return `<div class="upstage-slot${hero ? ' filled' : ' empty'}">
      <div class="upstage-light"></div>
      ${hero
        ? `${hero.sprite
            ? `<img class="upstage-sprite" src="${hero.sprite}" alt="${hero.name}">`
            : `<div class="upstage-symbol">${hero.symbol}</div>`}
           <div class="upstage-name">${hero.name}</div>`
        : `<div class="upstage-vacancy">VACANT</div>`}
    </div>`;
  }).join('');
}

// ── Stage row (silhouette roster) ─────────────────────────────────────────────

export function renderRosterStrip() {
  const strip = document.getElementById('stage-row');
  if (!strip) return;
  strip.innerHTML = state.allHeroes.map((hero, i) => {
    const isSel = state.selectedHeroes.includes(i);
    const isCur = i === state.heroIndex;
    return `<div class="stage-figure${isSel ? ' cast' : ''}${isCur ? ' center-stage' : ''}"
      data-index="${i}" title="${hero.name}">
      ${hero.sprite
        ? `<img src="${hero.sprite}" alt="${hero.name}">`
        : `<span>${hero.symbol}</span>`}
      ${isCur ? '<div class="footlight"></div>' : ''}
    </div>`;
  }).join('');

  strip.querySelectorAll('.stage-figure').forEach(fig => {
    fig.addEventListener('click', () => {
      state.heroIndex = parseInt(fig.dataset.index, 10);
      updateHeroDisplay();
    });
  });

  const cur = strip.querySelector('.stage-figure.center-stage');
  if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

// ── Spotlight hero display ────────────────────────────────────────────────────

export async function updateHeroDisplay() {
  const hero = state.allHeroes[state.heroIndex];
  const isSelected = state.selectedHeroes.includes(state.heroIndex);
  const displayEl = document.getElementById('hero-display');
  if (!displayEl) return;

  // Crossfade out
  displayEl.classList.add('fading');
  await new Promise(r => setTimeout(r, 80));

  // Fetch flavor while faded
  let flavor = '';
  if (hero.joke)               flavor = await fetchJoke();
  else if (hero.meat)          flavor = await fetchBaconIpsum();
  else if (hero.tarot)         flavor = await fetchTarotCard();
  else if (hero.nonseq)        flavor = await fetchNonseqFact();
  else if (hero.shrink)        flavor = `Advice: ${await fetchShrinkAdvice()}`;
  else if (hero.recipe)        flavor = await fetchRandomRecipe();
  else if (hero.reactsToHistory) flavor = await getGriotReaction();

  // Nonzero stat chips only
  const stats = getCompleteStats(hero);
  const chips = Object.entries(stats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<span class="stat-chip">${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}</span>`)
    .join('');

  const archetype = getArchetype(hero);
  const selCount  = state.selectedHeroes.length;

  let actionLabel;
  if (isSelected)        actionLabel = '<span class="action-selected">✓ In the company — Space to remove</span>';
  else if (selCount < 3) actionLabel = '<span class="action-pick">Space to cast</span>';
  else                   actionLabel = '<span class="action-full">Company full</span>';

  displayEl.innerHTML = `
    <div class="spotlight-hero">
      <div class="spotlight-glow archetype-glow-${archetype.toLowerCase()}"></div>
      <div class="spotlight-sprite-wrap">
        ${hero.sprite
          ? `<img src="${hero.sprite}" alt="${hero.name}" class="spotlight-sprite">`
          : `<div class="spotlight-symbol">${hero.symbol}</div>`}
      </div>
      <div class="spotlight-info">
        <div class="spotlight-name-row">
          <span class="spotlight-name">${hero.name}</span>
          <span class="hero-archetype-tag archetype-${archetype.toLowerCase()}">${archetype}</span>
        </div>
        ${flavor ? `<div class="hero-flavor">${flavor}</div>` : ''}
        <div class="hero-stat-chips">${chips}</div>
        <div class="hero-action-row">${actionLabel}</div>
      </div>
    </div>`;

  // Crossfade back in
  displayEl.classList.remove('fading');

  // Update dependent panels
  renderPartySlots();
  renderRosterStrip();

  // Synergy hint
  const hintEl = document.getElementById('synergy-hint');
  if (hintEl) {
    const hint = getSynergyHint(state.selectedHeroes, state.allHeroes);
    hintEl.textContent = hint;
    hintEl.style.display = hint ? '' : 'none';
  }

  // Selection counter
  const infoEl = document.getElementById('selection-info');
  if (infoEl) infoEl.textContent = `${selCount} / 3 cast`;

  // Party-assembled state
  const screen = document.getElementById('party-select');
  if (screen) screen.classList.toggle('party-assembled', selCount === 3);

  // Show/hide the start button (visible once ≥1 hero is cast)
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.style.display = selCount >= 1 ? '' : 'none';
}

// ── Select / deselect ─────────────────────────────────────────────────────────

export function selectHero() {
  if (state.selectedHeroes.includes(state.heroIndex)) {
    state.selectedHeroes = state.selectedHeroes.filter(i => i !== state.heroIndex);
  } else if (state.selectedHeroes.length < 3) {
    state.selectedHeroes.push(state.heroIndex);
  }
  updateHeroDisplay();
}
