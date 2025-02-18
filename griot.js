// griot.js
// This module handles API calls for special characters and generates 
// narrative text using a Markov chain that's refreshed with recent interactions.

let trainingCorpus = "";
const markovChain = {};
const recentInteractions = [];
const MAX_INTERACTIONS = 10;

// Loads the initial corpus from a URL or file path.
export async function loadTrainingCorpus(corpusUrl = "fantasy_narrative.txt") {
  try {
    const response = await fetch(corpusUrl);
    trainingCorpus = await response.text();
    refreshMarkovChain();
  } catch (error) {
    console.error("Error loading training corpus:", error);
    trainingCorpus = "The world is silent...";
    refreshMarkovChain();
  }
}

// Record a recent interaction and update the Markov chain.
export function recordInteraction(interaction) {
  recentInteractions.push(interaction);
  if (recentInteractions.length > MAX_INTERACTIONS) {
    recentInteractions.shift();
  }
  refreshMarkovChain();
}

// Rebuild the Markov chain using the combination of base corpus and recent interactions.
function refreshMarkovChain() {
  const combinedText = trainingCorpus + "\n" + recentInteractions.join(" ");
  for (let key in markovChain) {
    delete markovChain[key];
  }
  trainMarkovChain(combinedText);
}

// Trains the Markov chain from supplied text.
function trainMarkovChain(text) {
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].trim().toLowerCase();
    if (!word) continue;
    const nextWord = words[i + 1].trim().toLowerCase();
    if (!markovChain[word]) {
      markovChain[word] = [];
    }
    markovChain[word].push(nextWord);
  }
}

// Generates narrative text using the Markov chain.
function generateText(length = 20) {
  let currentWord = getRandomStartWord();
  let text = currentWord;
  for (let i = 1; i < length; i++) {
    const nextWords = markovChain[currentWord];
    if (!nextWords || nextWords.length === 0) break;
    const nextWord = nextWords[Math.floor(Math.random() * nextWords.length)];
    text += " " + nextWord;
    currentWord = nextWord;
  }
  return text;
}

// Returns a random starting word.
function getRandomStartWord() {
  const words = Object.keys(markovChain);
  return words[Math.floor(Math.random() * words.length)] || "";
}

// Special API calls for characters (bypass caching for diversity).

export async function fetchJoke() {
  try {
    const response = await fetch("https://v2.jokeapi.dev/joke/Programming?type=single");
    const data = await response.json();
    return data.joke;
  } catch (error) {
    console.error("Error fetching joke:", error);
    return "No joke available at the moment.";
  }
}

export async function fetchBaconIpsum() {
  try {
    const response = await fetch("https://baconipsum.com/api/?type=meat-and-filler&sentences=1");
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error("Error fetching bacon ipsum:", error);
    return "No message available.";
  }
}

export async function fetchTarotCard() {
  try {
    const response = await fetch("https://tarotapi.dev/api/v1/cards/random");
    const data = await response.json();
    if (data.cards && data.cards.length > 0) {
      const card = data.cards[0];
      return `Card: ${card.name} - ${card.meaning_up}`;
    } else {
      return "No tarot card data available.";
    }
  } catch (error) {
    console.error("Error fetching tarot card:", error);
    return "No tarot card available right now.";
  }
}

export async function fetchNonseqFact() {
  try {
    const response = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error fetching fact:", error);
    return "No fact available at the moment.";
  }
}

// New: Fetch psychology advice from a free API for the Shrink hero.
export async function fetchShrinkAdvice() {
  try {
    const response = await fetch("https://api.adviceslip.com/advice");
    const data = await response.json();
    return data.slip.advice;
  } catch (error) {
    console.error("Error fetching shrink advice:", error);
    return "No advice available at the moment.";
  }
}

// New: Fetch a random recipe for the Gastronomer hero using a free API.
export async function fetchRandomRecipe() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await response.json();
    if (data.meals && data.meals.length > 0) {
      const meal = data.meals[0];
      return `Recipe: ${meal.strMeal} - Category: ${meal.strCategory} - Region: ${meal.strArea}`;
    } else {
      return "No recipe available at the moment.";
    }
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return "No recipe available right now.";
  }
}

// Generates narrative text for the Griot special character.
export async function getGriotReaction() {
  return generateText(20);
}

// Initialization function to be called during startup.
export async function initializeGriot(corpusUrl) {
  await loadTrainingCorpus(corpusUrl);
}
