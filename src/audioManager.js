export function fadeOut(audioEl, onDone) {
  let volume = audioEl.volume;
  const interval = setInterval(() => {
    if (volume > 0) {
      volume = Math.max(0, volume - 0.1);
      audioEl.volume = volume;
    } else {
      clearInterval(interval);
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.volume = 1;
      if (onDone) onDone();
    }
  }, 100);
}

export function stopAudio(audioEl) {
  audioEl.pause();
  audioEl.currentTime = 0;
}
