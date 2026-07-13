import type { UserPreferences } from '@april-thesis/shared-types';

export type AudioChannel = 'music' | 'ambience' | 'interface';
export type MusicContext = 'title' | 'campaign' | 'crisis' | 'vote' | 'famine' | 'ending_hopeful' | 'ending_ambiguous' | 'ending_defeat';
export type AudioCue =
  | 'wind' | 'railway' | 'factory' | 'meeting' | 'telegraph' | 'printingPress'
  | 'paper' | 'typewriter' | 'stamp' | 'telegram' | 'dossier' | 'mapSelect'
  | 'warning' | 'mainMenuMusic' | 'campaignMusic' | 'tensionMusic' | 'humanitarianMusic'
  | 'outcomeHopeful' | 'outcomeAmbiguous' | 'outcomeDefeat';

interface CueDefinition { src: string; channel: AudioChannel; loop?: boolean; maxVoices?: number }

export const AUDIO_CUES: Record<AudioCue, CueDefinition> = {
  wind: { src:'/assets/audio/ambience/winter-wind.wav', channel:'ambience', loop:true },
  railway: { src:'/assets/audio/ambience/distant-railway.wav', channel:'ambience', loop:true },
  factory: { src:'/assets/audio/ambience/factory-floor.wav', channel:'ambience', loop:true },
  meeting: { src:'/assets/audio/ambience/meeting-room.wav', channel:'ambience', loop:true },
  telegraph: { src:'/assets/audio/cinematic/telegraph.wav', channel:'interface' },
  printingPress: { src:'/assets/audio/cinematic/printing-press.wav', channel:'ambience', loop:true },
  paper: { src:'/assets/audio/cinematic/paper-movement.wav', channel:'interface', maxVoices:2 },
  typewriter: { src:'/assets/audio/cinematic/typewriter.wav', channel:'interface' },
  stamp: { src:'/assets/audio/cinematic/stamp-impact.wav', channel:'interface' },
  telegram: { src:'/assets/audio/cinematic/telegram-arrival.wav', channel:'interface' },
  dossier: { src:'/assets/audio/interface/dossier-open.wav', channel:'interface', maxVoices:2 },
  mapSelect: { src:'/assets/audio/interface/map-select.wav', channel:'interface', maxVoices:2 },
  warning: { src:'/assets/audio/interface/political-warning.wav', channel:'interface' },
  mainMenuMusic: { src:'/assets/audio/music/main-menu-theme.wav', channel:'music', loop:true },
  campaignMusic: { src:'/assets/audio/music/campaign-planning.wav', channel:'music', loop:true },
  tensionMusic: { src:'/assets/audio/music/political-tension.wav', channel:'music', loop:true },
  humanitarianMusic: { src:'/assets/audio/music/humanitarian-crisis.wav', channel:'music', loop:true },
  outcomeHopeful: { src:'/assets/audio/music/outcome-hopeful.wav', channel:'music', loop:true },
  outcomeAmbiguous: { src:'/assets/audio/music/outcome-ambiguous.wav', channel:'music', loop:true },
  outcomeDefeat: { src:'/assets/audio/music/outcome-defeat.wav', channel:'music', loop:true },
};

const MUSIC_FOR_CONTEXT: Record<MusicContext, AudioCue> = {
  title:'mainMenuMusic', campaign:'campaignMusic', crisis:'tensionMusic', vote:'tensionMusic', famine:'humanitarianMusic',
  ending_hopeful:'outcomeHopeful', ending_ambiguous:'outcomeAmbiguous', ending_defeat:'outcomeDefeat',
};

function channelVolume(preferences: UserPreferences, channel: AudioChannel) {
  if (preferences.muted) return 0;
  const local = channel === 'music' ? preferences.musicVolume : channel === 'ambience' ? preferences.ambienceVolume : preferences.interfaceVolume;
  return Math.max(0, Math.min(1, preferences.masterVolume * local));
}

export class AudioManager {
  private preferences: UserPreferences | null = null;
  private active = false;
  private loops = new Map<AudioCue, HTMLAudioElement>();
  private lastPlayed = new Map<AudioCue, number>();
  private allElements = new Set<HTMLAudioElement>();
  private volumeScales = new WeakMap<HTMLAudioElement, number>();
  private musicContext: MusicContext | null = null;
  private currentMusic: AudioCue | null = null;
  private fadeTimers = new Set<number>();
  private pausedForVisibility = new Set<HTMLAudioElement>();
  private visibilityBound = false;

  configure(preferences: UserPreferences) {
    this.preferences = preferences;
    for (const [cue, element] of this.loops) element.volume = channelVolume(preferences, AUDIO_CUES[cue].channel) * (this.volumeScales.get(element) ?? 1);
  }

  activate(preferences: UserPreferences) {
    if (this.active) { this.configure(preferences); return; }
    this.active = true;
    this.configure(preferences);
    this.bindVisibility();
    if (preferences.audioPreload === 'full' && typeof Audio !== 'undefined') {
      Object.values(AUDIO_CUES).forEach(definition => {
        const element = new Audio(definition.src);
        element.preload = 'auto';
        element.load();
      });
    }
    if (this.musicContext && !this.currentMusic) this.setMusicContext(this.musicContext,0);
  }

  isActive() { return this.active; }
  getMusicContext() { return this.musicContext; }

  private playFailureFallback(cue: AudioCue) {
    if (!this.preferences || this.preferences.muted || typeof window === 'undefined') return;
    const AudioContextConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    try {
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const definition = AUDIO_CUES[cue];
      const volume = channelVolume(this.preferences, definition.channel);
      const frequency = cue === 'stamp' ? 95 : cue === 'warning' ? 165 : cue === 'telegram' || cue === 'telegraph' ? 420 : 260;
      oscillator.type = cue === 'stamp' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .035), context.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .11);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.addEventListener('ended', () => void context.close(), { once:true });
      oscillator.start(); oscillator.stop(context.currentTime + .12);
    } catch {
      // The campaign remains fully playable and captioned if both file audio and Web Audio are unavailable.
    }
  }

  play(cue: AudioCue, options: { restart?: boolean; volumeScale?: number } = {}) {
    if (!this.active || !this.preferences || typeof Audio === 'undefined') return null;
    const definition = AUDIO_CUES[cue];
    const now = Date.now();
    if (!options.restart && now - (this.lastPlayed.get(cue) ?? 0) < 90) return this.loops.get(cue) ?? null;
    this.lastPlayed.set(cue, now);
    if (definition.loop && this.loops.has(cue)) return this.loops.get(cue) ?? null;
    const element = new Audio(definition.src);
    element.loop = Boolean(definition.loop);
    element.preload = 'auto';
    this.volumeScales.set(element, options.volumeScale ?? 1);
    element.volume = channelVolume(this.preferences, definition.channel) * (options.volumeScale ?? 1);
    this.allElements.add(element);
    if (definition.loop) this.loops.set(cue, element);
    element.addEventListener('ended', () => this.allElements.delete(element), { once:true });
    void element.play().catch(() => {
      this.allElements.delete(element);
      if (definition.loop) this.loops.delete(cue);
      this.playFailureFallback(cue);
    });
    return element;
  }

  stop(cue: AudioCue) {
    const element = this.loops.get(cue);
    if (!element) return;
    element.pause(); element.currentTime = 0;
    this.loops.delete(cue); this.allElements.delete(element);
  }

  setScene(cues: AudioCue[]) {
    const keep = new Set(cues);
    for (const cue of this.loops.keys()) if (AUDIO_CUES[cue].channel !== 'music' && !keep.has(cue)) this.stop(cue);
    cues.forEach(cue => this.play(cue));
  }

  setMusicContext(context: MusicContext, duration = 1200) {
    if (this.musicContext === context && this.currentMusic) return;
    this.musicContext = context;
    const nextCue = MUSIC_FOR_CONTEXT[context];
    if (!this.active || !this.preferences || typeof Audio === 'undefined') return;
    const previousCue = this.currentMusic;
    const previous = previousCue ? this.loops.get(previousCue) : null;
    const next = this.play(nextCue, { restart:true, volumeScale:previous ? 0 : 1 });
    if (!next) return;
    this.currentMusic = nextCue;
    if (!previous || previous === next || typeof window === 'undefined' || duration <= 0) {
      this.volumeScales.set(next,1); next.volume=channelVolume(this.preferences,'music');
      if (previousCue && previousCue!==nextCue)this.stop(previousCue);
      return;
    }
    const steps=16; let step=0; const previousScale=this.volumeScales.get(previous)??1;
    const timer=window.setInterval(()=>{
      step+=1; const progress=Math.min(1,step/steps);
      this.volumeScales.set(previous,previousScale*(1-progress)); this.volumeScales.set(next,progress);
      if(this.preferences){previous.volume=channelVolume(this.preferences,'music')*previousScale*(1-progress);next.volume=channelVolume(this.preferences,'music')*progress;}
      if(progress>=1){window.clearInterval(timer);this.fadeTimers.delete(timer);if(previousCue)this.stop(previousCue);}
    },duration/steps);
    this.fadeTimers.add(timer);
  }

  private handleVisibility = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      for (const element of this.allElements) if (!element.paused) { element.pause(); this.pausedForVisibility.add(element); }
    } else {
      for (const element of this.pausedForVisibility) if (this.allElements.has(element)) void element.play().catch(()=>undefined);
      this.pausedForVisibility.clear();
    }
  };

  private bindVisibility() {
    if (this.visibilityBound || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange',this.handleVisibility); this.visibilityBound=true;
  }

  private unbindVisibility() {
    if (!this.visibilityBound || typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange',this.handleVisibility); this.visibilityBound=false;
  }

  fadeOut(cue: AudioCue, duration = 350) {
    const element = this.loops.get(cue);
    if (!element || typeof window === 'undefined') return;
    const start = element.volume;
    const steps = 8;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1; element.volume = Math.max(0, start * (1 - step / steps));
      if (step >= steps) { window.clearInterval(timer); this.stop(cue); }
    }, duration / steps);
  }

  cleanup() {
    if (typeof window !== 'undefined') for (const timer of this.fadeTimers) window.clearInterval(timer);
    for (const element of this.allElements) { element.pause(); element.currentTime = 0; }
    this.loops.clear(); this.allElements.clear(); this.lastPlayed.clear(); this.fadeTimers.clear(); this.pausedForVisibility.clear(); this.currentMusic=null; this.musicContext=null;
  }

  destroy() { this.cleanup(); this.unbindVisibility(); this.active = false; this.preferences = null; }
}

export const audioManager = new AudioManager();
