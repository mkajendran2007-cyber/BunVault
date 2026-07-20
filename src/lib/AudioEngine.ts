// Singleton AudioEngine utilizing Web Audio API for zero-latency playback
import { getUserSetting, setUserSetting } from "@/lib/userSettings"

type SoundEffect = 
  | 'pop' 
  | 'tick' 
  | 'whoosh' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'trash' 
  | 'chime' 
  | 'swipe' 
  | 'cash';

const SOUND_SOURCES: Record<SoundEffect, string> = {
  pop: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  whoosh: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  warning: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  trash: 'https://assets.mixkit.co/active_storage/sfx/298/298-preview.mp3',
  chime: 'https://assets.mixkit.co/active_storage/sfx/2584/2584-preview.mp3',
  swipe: 'https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3',
  cash: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
};

class AudioEngine {
  private static instance: AudioEngine;
  private audioContext: AudioContext | null = null;
  private buffers: Map<SoundEffect, AudioBuffer> = new Map();
  private masterVolume: number = 0.3; // Default 30%
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences();
      this.syncCloudPreferences();
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // Must be called on first user interaction to satisfy autoplay policies
  public async init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.isInitialized = true;
        await this.preloadAll();
      }
    } catch (e) {
      console.warn('AudioContext not supported or failed to initialize', e);
    }
  }

  private loadPreferences() {
    try {
      const vol = localStorage.getItem('bun_vault_volume');
      if (vol) this.masterVolume = parseFloat(vol);
      const mute = localStorage.getItem('bun_vault_muted');
      if (mute) this.isMuted = mute === 'true';
    } catch (e) {
      // Ignore
    }
  }

  private async syncCloudPreferences() {
    try {
      const cloudVol = await getUserSetting('bun_vault_volume');
      if (cloudVol !== null) {
        this.masterVolume = parseFloat(cloudVol);
        localStorage.setItem('bun_vault_volume', cloudVol);
      }
      const cloudMute = await getUserSetting('bun_vault_muted');
      if (cloudMute !== null) {
        this.isMuted = cloudMute === 'true';
        localStorage.setItem('bun_vault_muted', cloudMute);
      }
    } catch (e) {
      // Ignore
    }
  }

  public savePreferences(volume: number, muted: boolean) {
    this.masterVolume = volume;
    this.isMuted = muted;
    try {
      setUserSetting('bun_vault_volume', volume.toString());
      setUserSetting('bun_vault_muted', muted.toString());
      localStorage.setItem('bun_vault_volume', volume.toString());
      localStorage.setItem('bun_vault_muted', muted.toString());
    } catch (e) {}
  }

  public getVolume() { return this.masterVolume; }
  public getMuted() { return this.isMuted; }

  private async preloadAll() {
    const promises = Object.entries(SOUND_SOURCES).map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.buffers.set(key as SoundEffect, audioBuffer);
        }
      } catch (e) {
        console.warn(`Failed to load sound: ${key}`);
      }
    });
    await Promise.allSettled(promises);
  }

  public play(effect: SoundEffect, volumeScale: number = 1.0) {
    if (this.isMuted || !this.audioContext || !this.buffers.has(effect)) return;

    try {
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(effect)!;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.masterVolume * volumeScale;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
    } catch (e) {
      console.warn('Playback failed:', e);
    }
  }

  // Helper mappings for the UI
  public playClick() { this.play('pop'); }
  public playTick() { this.play('tick', 0.5); }
  public playSwipe() { this.play('swipe'); }
  public playWhoosh() { this.play('whoosh'); }
  public playSuccess() { this.play('success'); }
  public playError() { this.play('error'); }
  public playWarning() { this.play('warning'); }
  public playTrash() { this.play('trash'); }
  public playChime() { this.play('chime'); }
  public playCash() { this.play('cash'); }
}

export const engine = AudioEngine.getInstance();
