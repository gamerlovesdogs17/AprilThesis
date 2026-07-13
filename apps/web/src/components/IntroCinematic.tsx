import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from './IntroCinematic.module.css';

const SCENES = [
  { id: 'darkness', duration: 12000 },
  { id: 'map', duration: 15000 },
  { id: 'newspapers', duration: 15000 },
  { id: 'congress', duration: 10000 },
  { id: 'meeting', duration: 12000 },
  { id: 'title', duration: 0 },
];

const LINES_DARKNESS = [
  '1917. The old order fell.',
  '1918–1920. Revolution became civil war.',
];

const LINES_MAP = [
  'By 1921, the armies were exhausted.',
  'The factories were silent.',
  'The villages resisted.',
  'The revolution had survived.',
  'Its promises had not.',
];

const HEADLINES = [
  'REVOLT AT KRONSTADT',
  'TENTH PARTY CONGRESS CONVENES',
  'GRAIN REQUISITIONS TO END',
  'NEW ECONOMIC POLICY PROPOSED',
  'FAMINE SPREADS ACROSS THE VOLGA',
  'PARTY UNITY RESOLUTION ADOPTED',
  'FACTIONS ORDERED TO DISSOLVE',
  'WORKERS\' OPPOSITION DENOUNCED',
];

export function IntroCinematic() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [stampVisible, setStampVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const setScreen = useGameStore(s => s.setScreen);
  const updatePreferences = useGameStore(s => s.updatePreferences);
  const reducedMotion = useGameStore(s => s.preferences.reducedMotion);
  const setAudioEnabled = useGameStore(s => s.setAudioEnabled);
  const audioCtx = useRef<AudioContext | null>(null);

  const skip = useCallback(() => {
    setSkipped(true);
    updatePreferences({ introViewed: true });
    setScreen('title');
  }, [setScreen, updatePreferences]);

  const enableAudio = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
      setAudioEnabled(true);
      playAmbience(audioCtx.current);
    }
  }, [setAudioEnabled]);

  useEffect(() => {
    if (skipped || reducedMotion) return;
    const scene = SCENES[sceneIndex];
    if (!scene || scene.id === 'title') {
      updatePreferences({ introViewed: true });
      return;
    }
    const timer = setTimeout(() => {
      setSceneIndex(i => Math.min(i + 1, SCENES.length - 1));
      setLineIndex(0);
    }, scene.duration);
    return () => clearTimeout(timer);
  }, [sceneIndex, skipped, reducedMotion, updatePreferences]);

  useEffect(() => {
    if (sceneIndex === 0 && lineIndex < LINES_DARKNESS.length) {
      const t = setTimeout(() => setLineIndex(i => i + 1), 3000);
      return () => clearTimeout(t);
    }
    if (sceneIndex === 1 && lineIndex < LINES_MAP.length) {
      const t = setTimeout(() => setLineIndex(i => i + 1), 2500);
      return () => clearTimeout(t);
    }
  }, [sceneIndex, lineIndex]);

  useEffect(() => {
    if (sceneIndex === 2 && headlineIndex < HEADLINES.length) {
      const t = setTimeout(() => setHeadlineIndex(i => i + 1), 1800);
      return () => clearTimeout(t);
    }
  }, [sceneIndex, headlineIndex]);

  useEffect(() => {
    if (sceneIndex === 3) {
      const t = setTimeout(() => setStampVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, [sceneIndex]);

  if (reducedMotion) {
    return (
      <div className={styles.staticIntro}>
        <div className={styles.staticContent}>
          <h1>APRIL THESIS</h1>
          <p className={styles.subtitle}>The Revolution After Victory</p>
          <blockquote>
            &ldquo;The revolution was won once. Now it must decide what it has become.&rdquo;
          </blockquote>
          <p className={styles.context}>
            March 1921. The Tenth Party Congress has banned organized factions.
            The Workers&apos; Opposition must decide what remains.
          </p>
          <button className="primary" onClick={skip}>Continue to Title Screen</button>
        </div>
      </div>
    );
  }

  const currentScene = SCENES[sceneIndex]?.id ?? 'title';

  return (
    <div className={styles.intro} role="region" aria-label="Introduction cinematic">
      <button className={styles.skipBtn} onClick={skip} aria-label="Skip introduction">
        Skip
      </button>

      {!audioCtx.current && (
        <button className={styles.audioBtn} onClick={enableAudio} aria-label="Enable audio">
          Enable Audio
        </button>
      )}

      {currentScene === 'darkness' && (
        <div className={styles.sceneDarkness}>
          <div className={styles.redLine} />
          {LINES_DARKNESS.slice(0, lineIndex).map((line, i) => (
            <p key={i} className={styles.lineText}>{line}</p>
          ))}
          <span className="sr-only" aria-live="polite">
            {LINES_DARKNESS[lineIndex - 1] ?? ''}
          </span>
        </div>
      )}

      {currentScene === 'map' && (
        <div className={styles.sceneMap}>
          <svg viewBox="0 0 640 400" className={styles.mapSvg} aria-hidden="true">
            <rect width="640" height="400" fill="#1a1410" />
            {Array.from({ length: 28 }).map((_, i) => (
              <path
                key={i}
                d={`M${60 + (i % 7) * 80},${80 + Math.floor(i / 7) * 70} L${120 + (i % 7) * 80},${70 + Math.floor(i / 7) * 70} L${130 + (i % 7) * 80},${120 + Math.floor(i / 7) * 70} L${70 + (i % 7) * 80},${130 + Math.floor(i / 7) * 70} Z`}
                fill="none"
                stroke="#4a3f30"
                strokeWidth="1"
                opacity={0.3 + (i / 28) * 0.5}
                className={styles.mapRegion}
              />
            ))}
            <line x1="0" y1="200" x2="640" y2="200" stroke="#8b1a1a" strokeWidth="2" opacity="0.5" className={styles.frontLine} />
          </svg>
          <div className={styles.mapText}>
            {LINES_MAP.slice(0, lineIndex).map((line, i) => (
              <p key={i} className={styles.lineText}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {currentScene === 'newspapers' && (
        <div className={styles.sceneNewspapers}>
          {HEADLINES.slice(0, headlineIndex).map((h, i) => (
            <div key={i} className={styles.newspaper} style={{ transform: `rotate(${(i % 3 - 1) * 5}deg) translateY(${i * 10}px)` }}>
              <div className={styles.newspaperHeader}>SOVIET PRESS — MARCH 1921</div>
              <div className={styles.newspaperHeadline}>{h}</div>
            </div>
          ))}
        </div>
      )}

      {currentScene === 'congress' && (
        <div className={styles.sceneCongress}>
          <div className={styles.congressHall}>
            <div className={styles.silhouettes}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.silhouette} style={{ left: `${10 + i * 7}%` }} />
              ))}
            </div>
            <div className={`${styles.stamp} ${stampVisible ? styles.stampVisible : ''}`}>
              ORGANIZED FACTIONS ARE HEREBY DISSOLVED
            </div>
          </div>
        </div>
      )}

      {currentScene === 'meeting' && (
        <div className={styles.sceneMeeting}>
          <div className={styles.meetingTable}>
            <div className={styles.dossiers}>
              {['Workers\' Opposition', 'Trade Unions', 'Party Unity', 'Food Supply', 'Surveillance', 'Petrograd', 'Moscow', 'Donbas'].map(label => (
                <span key={label} className={styles.dossier}>{label}</span>
              ))}
            </div>
            <div className={styles.telegram}>
              &ldquo;The resolution has passed. What remains of the organization must decide tonight.&rdquo;
            </div>
          </div>
        </div>
      )}

      {currentScene === 'title' && (
        <div className={styles.sceneTitle}>
          <h1 className={styles.gameTitle}>APRIL THESIS</h1>
          <p className={styles.subtitle}>The Revolution After Victory</p>
          <blockquote className={styles.quote}>
            &ldquo;The revolution was won once. Now it must decide what it has become.&rdquo;
          </blockquote>
          <button className="primary" onClick={() => { updatePreferences({ introViewed: true }); setScreen('title'); }}>
            Enter
          </button>
        </div>
      )}

      <div className={styles.captions} aria-live="polite">
        {currentScene === 'darkness' && '[Wind, telegraph clicks, distant railway]'}
        {currentScene === 'congress' && stampVisible && '[Stamp strikes paper]'}
        {currentScene === 'meeting' && '[Telegram arrives]'}
      </div>
    </div>
  );
}

function playAmbience(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.02;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
