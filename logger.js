import { state } from './state.js';
import {
  fetchJoke, fetchBaconIpsum, fetchTarotCard, fetchNonseqFact,
  fetchShrinkAdvice, fetchRandomRecipe, getGriotReaction, recordInteraction,
} from './griot.js';

const _pinnedLines = [];
const _PINNED_MAX = 3;
const _IMPORTANT_RE = /turn begins|'s turn|wall collapses|wall hp|level \d|complete!|game over|enters the field|is defeated|is dead|now it's|says:/i;

export function logMessage(message) {
  const logDiv = document.getElementById('log');
  logDiv.innerHTML += `<p>${message}</p>`;
  logDiv.scrollTop = logDiv.scrollHeight;
  if (_IMPORTANT_RE.test(message)) {
    _pinnedLines.push(message);
    if (_pinnedLines.length > _PINNED_MAX) _pinnedLines.shift();
    const linesDiv = document.getElementById('hud-narrative-lines');
    if (linesDiv) {
      linesDiv.innerHTML = _pinnedLines.map(l => `<div class="hud-pin-line">${l}</div>`).join('');
    }
  }
}

export function clearLog() {
  document.getElementById('log').innerHTML = '';
  _pinnedLines.length = 0;
  const linesDiv = document.getElementById('hud-narrative-lines');
  if (linesDiv) linesDiv.innerHTML = '';
}

export async function recordAttack(message) {
  recordInteraction(message);
  const hero = state.party[state.battleEngine.currentUnit];
  if (hero.joke) {
    logMessage(await fetchJoke());
  } else if (hero.meat) {
    logMessage(await fetchBaconIpsum());
  } else if (hero.tarot) {
    logMessage(await fetchTarotCard());
  } else if (hero.nonseq) {
    logMessage(await fetchNonseqFact());
  } else if (hero.shrink) {
    logMessage(`Advice: ${await fetchShrinkAdvice()}`);
  } else if (hero.recipe) {
    logMessage(await fetchRandomRecipe());
  } else if (hero.reactsToHistory) {
    logMessage(await getGriotReaction());
  }
}
