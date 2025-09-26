/**
 * Modern Audio Manager with enhanced features
 */
export class AudioManager {
  constructor() {
    this.audioElements = new Map();
    this.currentSong = null;
    this.volume = 0.7;
    this.isEnabled = true;
    this.listeners = new Map();
    
    this.songs = [
      { id: 'darkanoid', src: 'assets/audio/DarkAnoid.mp3', title: 'Dark Android' },
      { id: 'wooden-path', src: 'assets/audio/WoodenPath.mp3', title: 'Wooden Path' },
      { id: '5gi-max', src: 'assets/audio/5GiMaxVision.mp3', title: '5Gi Max Vision' },
      { id: 'ineedsome', src: 'assets/audio/ineedsome.mp3', title: 'I Need Some' },
      { id: 'southern-belle', src: 'assets/audio/SouthernBelle.mp3', title: 'Southern Belle' },
      { id: 'whaviors', src: 'assets/audio/whaviors.mp3', title: 'Whaviors' },
      { id: 'afrojapanese', src: 'assets/audio/afrojapanesetwilight.mp3', title: 'Afro-Japanese Twilight' },
      { id: 'science', src: 'assets/audio/science.mp3', title: 'Science' }
    ];
    
    this.currentSongIndex = 0;
  }

  async init() {
    try {
      // Pre-load critical audio
      await this.loadAudio('background', 'assets/audio/DarkAnoid.mp3');
      await this.loadAudio('menu', 'assets/audio/WoodenPath.mp3');
      
      console.log('Audio system initialized');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.isEnabled = false;
    }
  }

  async loadAudio(id, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audio.preload = 'metadata';
      audio.volume = this.volume;
      
      audio.onloadedmetadata = () => {
        this.audioElements.set(id, audio);
        resolve(audio);
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load audio: ${src}`);
        reject(new Error(`Failed to load audio: ${src}`));
      };
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  async play(audioId, loop = false) {
    if (!this.isEnabled) return;

    const audio = this.audioElements.get(audioId);
    if (!audio) {
      console.warn(`Audio not found: ${audioId}`);
      return;
    }

    try {
      audio.loop = loop;
      await audio.play();
      console.log(`Playing audio: ${audioId}`);
    } catch (error) {
      console.warn(`Failed to play audio ${audioId}:`, error);
    }
  }

  stop(audioId) {
    const audio = this.audioElements.get(audioId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioElements.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  async playBackgroundMusic() {
    await this.play('background', true);
  }

  async playMenuMusic() {
    await this.play('menu', true);
  }

  async fadeInTitleMusic() {
    // Simple fade in effect
    const audio = this.audioElements.get('background');
    if (!audio) return;

    audio.volume = 0;
    await this.play('background', true);
    
    // Fade in over 2 seconds
    const fadeSteps = 20;
    const targetVolume = this.volume;
    const step = targetVolume / fadeSteps;
    
    for (let i = 0; i < fadeSteps; i++) {
      setTimeout(() => {
        if (audio.volume < targetVolume) {
          audio.volume = Math.min(targetVolume, audio.volume + step);
        }
      }, i * 100);
    }
  }

  async playSong(index) {
    if (index < 0 || index >= this.songs.length) return;
    
    const song = this.songs[index];
    this.currentSongIndex = index;
    
    // Load song if not already loaded
    if (!this.audioElements.has(song.id)) {
      try {
        await this.loadAudio(song.id, song.src);
      } catch (error) {
        console.warn('Failed to load song:', song.title);
        return;
      }
    }

    // Stop current song
    if (this.currentSong) {
      this.stop(this.currentSong.id);
    }

    this.currentSong = song;
    await this.play(song.id, true);
    this.emit('songChange', song);
  }

  nextSong() {
    const nextIndex = (this.currentSongIndex + 1) % this.songs.length;
    this.playSong(nextIndex);
  }

  previousSong() {
    const prevIndex = this.currentSongIndex === 0 ? this.songs.length - 1 : this.currentSongIndex - 1;
    this.playSong(prevIndex);
  }

  togglePlayPause() {
    if (!this.currentSong) return;
    
    const audio = this.audioElements.get(this.currentSong.id);
    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  getCurrentSong() {
    return this.currentSong;
  }

  getSongs() {
    return [...this.songs];
  }
}