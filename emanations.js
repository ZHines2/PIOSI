/**
 * emanations.js
 *
 * This file contains the logic for the emanations functionality.
 * It now provides a minimal UI that shows instructions and the current song information.
 */

let currentSongIndex = 0;
let isPlaying = false;
const songs = [
  'DarkAnoid.mp3', 
  'WoodenPath.mp3', 
  '5GiMaxVision.mp3', 
  'ineedsome.mp3', 
  'SouthernBelle.mp3', 
  'whaviors.mp3', 
  'afrojapanesetwilight.mp3', 
  'science.mp3'
];
const audioElement = document.getElementById('emanations-audio');
let uiElement = null;  // Container for instructions and song info

/**
 * Updates the emanations mode display with instructions and current song.
 */
function updateSongInfo() {
  if (uiElement) {
    uiElement.innerHTML = `
      <h1>Emanations Mode</h1>
      <p>Use Left/Right arrow keys to select a song.</p>
      <p>Press Spacebar to play the selected song.</p>
      <p><strong>Current Song:</strong> ${songs[currentSongIndex]}</p>
      <p><strong>Status:</strong> ${isPlaying ? 'Playing' : 'Stopped'}</p>
    `;
  }
}

/**
 * Plays a song from the repository.
 * @param {number} index - The index of the song to play.
 */
export function playSong(index) {
  if (audioElement) {
    audioElement.src = songs[index];
    audioElement.play();
    isPlaying = true;
    updateSongInfo();
  } else {
    console.error('Audio element not found');
  }
}

/**
 * Stops the currently playing song.
 */
export function stopSong() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
    updateSongInfo();
  } else {
    console.error('Audio element not found');
  }
}

/**
 * Plays the next song in the repository.
 */
export function playNextSong() {
  if (isPlaying) {
    fadeOutCurrentSong(() => {
      currentSongIndex = (currentSongIndex + 1) % songs.length;
      playSong(currentSongIndex);
    });
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
  }
}

/**
 * Plays the previous song in the repository.
 */
export function playPreviousSong() {
  if (isPlaying) {
    fadeOutCurrentSong(() => {
      currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      playSong(currentSongIndex);
    });
  } else {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
  }
}

/**
 * Fades out the currently playing song.
 * @param {Function} callback - The callback function to call after the song has faded out.
 */
function fadeOutCurrentSong(callback) {
  let volume = audioElement.volume;
  const fadeInterval = setInterval(() => {
    if (volume > 0) {
      volume = Math.max(0, volume - 0.1);
      audioElement.volume = volume;
    } else {
      clearInterval(fadeInterval);
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.volume = 1; // Reset volume for future use
      isPlaying = false;
      updateSongInfo();
      callback();
    }
  }, 100); // Adjust timing as needed
}

/**
 * Toggles between playing and pausing the current song.
 */
export function togglePlayPause() {
  if (isPlaying) {
    stopSong();
  } else {
    playSong(currentSongIndex);
  }
}
const canvas = document.getElementById('emanations-canvas');
const ctx = canvas.getContext('2d');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// Call this to start the visualization loop
function visualize() {
  requestAnimationFrame(visualize);
  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];
    const red = barHeight + 25 * (i/bufferLength);
    const green = 250 * (i/bufferLength);
    const blue = 200;

    ctx.fillStyle = `rgb(${red},${green},${blue})`;
    ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
}

// Start visualization on song play
export function playSong(index) {
  if (audioElement) {
    audioElement.src = songs[index];
    audioElement.play();
    isPlaying = true;
    audioCtx.resume(); // Ensure audio context is resumed on user interaction
    visualize();
    updateSongInfo();
  } else {
    console.error('Audio element not found');
  }
}
/**
 * Creates and initializes the UI for Emanations Mode.
 * This minimal UI displays instructions and the current song information.
 */
export function createEmanationsUI() {
  // Assume there is a container in the HTML with id "emanations-mode"
  uiElement = document.getElementById('emanations-mode');
  if (uiElement) {
    uiElement.style.display = "flex";
    uiElement.style.flexDirection = "column";
    uiElement.style.alignItems = "center";
    uiElement.style.padding = "10px";
    updateSongInfo();
  } else {
    console.error('Emanations mode container not found');
  }
}
