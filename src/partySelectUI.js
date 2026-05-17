import { state } from './state.js';
import {
  fetchJoke, fetchBaconIpsum, fetchTarotCard, fetchNonseqFact,
  fetchShrinkAdvice, fetchRandomRecipe, getGriotReaction,
} from './griot.js';
import { getCompleteStats } from './renderer.js';

export async function updateHeroDisplay() {
  const hero = state.allHeroes[state.heroIndex];
  let display = `<p class="highlight">${hero.name} `;
  if (hero.sprite) {
    display += `<img src="${hero.sprite}" alt="${hero.name}" style="height:40px; vertical-align:middle; image-rendering: pixelated;">`;
  } else {
    display += `(${hero.symbol})`;
  }
  display += '</p>';
  if (hero.joke) {
    display += `<p>${await fetchJoke()}</p>`;
  } else if (hero.meat) {
    display += `<p>${await fetchBaconIpsum()}</p>`;
  } else if (hero.tarot) {
    display += `<p>${await fetchTarotCard()}</p>`;
  } else if (hero.nonseq) {
    display += `<p>${await fetchNonseqFact()}</p>`;
  } else if (hero.shrink) {
    display += `<p>Advice: ${await fetchShrinkAdvice()}</p>`;
  } else if (hero.recipe) {
    display += `<p>${await fetchRandomRecipe()}</p>`;
  } else if (hero.reactsToHistory) {
    display += `<p>${await getGriotReaction()}</p>`;
  }
  const stats = getCompleteStats(hero);
  display += `<p>
    Attack: ${stats.attack} |
    Range: ${stats.range} |
    Agility: ${stats.agility} |
    HP: ${stats.hp} |
    Heal: ${stats.heal} |
    Burn: ${stats.burn} |
    Slüj: ${stats.sluj} |
    Ghïs: ${stats.ghis} |
    Trick: ${stats.trick} |
    Yeet: ${stats.yeet} |
    Swarm: ${stats.swarm} |
    Spicy: ${stats.spicy} |
    Armor: ${stats.armor} |
    Spore: ${stats.spore} |
    Chain: ${stats.chain} |
    Caprice: ${stats.caprice} |
    Fate: ${stats.fate} |
    Rage: ${stats.rage} |
    Bulk: ${stats.bulk} |
    Psych: ${stats.psych} |
    Ankh: ${stats.ankh} |
    Rise: ${stats.rise} |
    Dodge: ${stats.dodge} |
    Bomba: ${stats.bomba} |
  </p>`;
  display += `<p>${state.selectedHeroes.includes(state.heroIndex) ? 'SELECTED' : 'Press Spacebar to Select'}</p>`;
  document.getElementById('hero-display').innerHTML = display;
  document.getElementById('selection-info').textContent = `Selected Heroes: ${state.selectedHeroes.length}/3`;
}

export function selectHero() {
  if (state.selectedHeroes.includes(state.heroIndex)) {
    state.selectedHeroes = state.selectedHeroes.filter(i => i !== state.heroIndex);
  } else if (state.selectedHeroes.length < 3) {
    state.selectedHeroes.push(state.heroIndex);
  }
  updateHeroDisplay();
}
