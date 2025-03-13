/**
 * emanations.js
 *
 * This file contains the logic for the emanations functionality.
 * It includes functions to play songs from the repository.
 */

let currentSongIndex = 0;
let isPlaying = false;
const songs = ['DarkAnoid.mp3', 'WoodenPath.mp3', '5GiMaxVision.mp3', 'ineedsome.mp3'];
const audioElement = document.getElementById('emanations-audio');

/**
 * Plays a song from the repository.
 * @param {number} index - The index of the song to play.
 */
function playSong(index) {
  if (audioElement) {
    audioElement.src = songs[index];
    audioElement.play();
    isPlaying = true;
  } else {
    console.error('Audio element not found');
  }
}

/**
 * Stops the currently playing song.
 */
function stopSong() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
  } else {
    console.error('Audio element not found');
  }
}

/**
 * Plays the next song in the repository.
 */
function playNextSong() {
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
function playPreviousSong() {
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
      volume -= 0.1;
      audioElement.volume = volume;
    } else {
      clearInterval(fadeInterval);
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.volume = 1; // Reset volume for future use
      callback();
    }
  }, 100); // Adjust timing as needed
}

/**
 * Exports the UI for the music player.
 */
export function createMusicPlayerUI() {
  const container = document.createElement('div');
  container.id = 'music-player';

  const playButton = document.createElement('button');
  playButton.textContent = 'Play';
  playButton.addEventListener('click', () => playSong(currentSongIndex));

  const stopButton = document.createElement('button');
  stopButton.textContent = 'Stop';
  stopButton.addEventListener('click', stopSong);

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', playNextSong);

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.addEventListener('click', playPreviousSong);

  container.appendChild(playButton);
  container.appendChild(stopButton);
  container.appendChild(nextButton);
  container.appendChild(prevButton);

  document.body.appendChild(container);
}

/**
 * Adds keyboard event listeners for play, stop, next, and previous actions.
 */
function addKeyboardEventListeners() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      playPreviousSong();
    } else if (event.key === 'ArrowRight') {
      playNextSong();
    } else if (event.key === 'Space') {
      if (isPlaying) {
        stopSong();
      } else {
        playSong(currentSongIndex);
      }
    }
  });
}

// Initialize the music player UI and add keyboard event listeners
createMusicPlayerUI();
addKeyboardEventListeners();
