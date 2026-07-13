import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserPreferences } from '@april-thesis/shared-types';
import { AudioManager } from './audioManager';

const preferences: UserPreferences = {
  masterVolume: .8,
  musicVolume: .5,
  ambienceVolume: .4,
  interfaceVolume: .6,
  muted: false,
  reducedMotion: false,
  textScale: 1,
  introViewed: true,
  colorblindMode: false,
  enhancedInfluence: true,
  mapAnimation: true,
  ambientVisualEffects: true,
  audioPreload: 'minimal',
  beginnerHintMode: 'first_campaign',
  hiddenHintIds: [],
  campaignsStarted: 1,
  researchMode: false,
  allCityLabels: false,
  situationBoardEnabled: true,
};

class FakeAudio {
  static instances: FakeAudio[] = [];
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  paused = false;
  play = vi.fn(async () => undefined);
  pause = vi.fn(() => { this.paused = true; });
  load = vi.fn();
  addEventListener = vi.fn();
  constructor(public src: string) { FakeAudio.instances.push(this); }
}

describe('central audio manager', () => {
  afterEach(() => {
    FakeAudio.instances = [];
    vi.unstubAllGlobals();
  });

  it('requires activation and applies master and channel volume', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const manager = new AudioManager();
    expect(manager.play('dossier')).toBeNull();
    manager.activate(preferences);
    const element = manager.play('dossier') as unknown as FakeAudio;
    expect(element.src).toContain('dossier-open.wav');
    expect(element.volume).toBeCloseTo(.48);
  });

  it('prevents duplicate ambience loops and cleans every element up', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const manager = new AudioManager();
    manager.activate(preferences);
    const first = manager.play('wind') as unknown as FakeAudio;
    const second = manager.play('wind') as unknown as FakeAudio;
    expect(second).toBe(first);
    expect(FakeAudio.instances).toHaveLength(1);
    manager.cleanup();
    expect(first.pause).toHaveBeenCalledOnce();
    expect(first.currentTime).toBe(0);
  });

  it('mutes configured playback without destroying cue state', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const manager = new AudioManager();
    manager.activate({ ...preferences, muted: true });
    const element = manager.play('mainMenuMusic') as unknown as FakeAudio;
    expect(element.volume).toBe(0);
    expect(element.play).toHaveBeenCalledOnce();
  });

  it('crossfades adaptive music without restarting the same context', () => {
    vi.useFakeTimers();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('window', globalThis);
    const manager = new AudioManager();
    manager.activate(preferences);
    manager.setMusicContext('campaign');
    manager.setMusicContext('crisis',160);
    expect(FakeAudio.instances.some(item=>item.src.includes('campaign-planning.wav'))).toBe(true);
    expect(FakeAudio.instances.some(item=>item.src.includes('political-tension.wav'))).toBe(true);
    vi.advanceTimersByTime(200);
    const count=FakeAudio.instances.length;
    manager.setMusicContext('crisis');
    expect(FakeAudio.instances).toHaveLength(count);
    manager.destroy();
    vi.useRealTimers();
  });

  it('starts a pending music context on the first user activation', () => {
    vi.stubGlobal('Audio',FakeAudio);
    const manager=new AudioManager();manager.setMusicContext('title');expect(FakeAudio.instances).toHaveLength(0);
    manager.activate(preferences);expect(FakeAudio.instances.some(item=>item.src.includes('main-menu-theme.wav'))).toBe(true);manager.destroy();
  });

  it('pauses looping audio while the document is hidden and resumes it', async () => {
    vi.stubGlobal('Audio', FakeAudio);
    const listeners=new Map<string,()=>void>();
    const fakeDocument={hidden:false,addEventListener:vi.fn((name:string,handler:()=>void)=>listeners.set(name,handler)),removeEventListener:vi.fn()};
    vi.stubGlobal('document',fakeDocument);
    const manager=new AudioManager();manager.activate(preferences);const element=manager.play('wind') as unknown as FakeAudio;
    fakeDocument.hidden=true;listeners.get('visibilitychange')?.();expect(element.pause).toHaveBeenCalled();
    fakeDocument.hidden=false;listeners.get('visibilitychange')?.();await Promise.resolve();expect(element.play).toHaveBeenCalledTimes(2);
    manager.destroy();
  });

  it('contains a rejected or missing audio asset without an uncaught failure', async () => {
    class RejectingAudio extends FakeAudio {
      play = vi.fn(async () => { throw new Error('asset unavailable'); });
    }
    const close = vi.fn(async () => undefined);
    const oscillator = {
      type: 'sine', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(),
      addEventListener: vi.fn((_event: string, callback: () => void) => { oscillator.onended = callback; }),
      stop: vi.fn(() => oscillator.onended?.()), onended: undefined as (() => void) | undefined,
    };
    const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    class FakeAudioContext {
      currentTime = 0; destination = {};
      createOscillator = () => oscillator;
      createGain = () => gain;
      close = close;
    }
    vi.stubGlobal('Audio', RejectingAudio);
    vi.stubGlobal('window', { AudioContext: FakeAudioContext });
    const manager = new AudioManager();
    manager.activate(preferences);
    expect(() => manager.play('telegram')).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
    expect(() => manager.cleanup()).not.toThrow();
  });
});
