import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sampleRate = 16000;
const outRoot = resolve(import.meta.dirname, '../apps/web/public/assets/audio');

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = Math.imul(1664525, state) + 1013904223 >>> 0) / 0xffffffff) * 2 - 1;
}

function make(seconds, render, seed = 1, fadeEdges = true) {
  const count = Math.floor(seconds * sampleRate);
  const samples = new Float32Array(count);
  const random = rng(seed);
  let low = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    low += (random() - low) * 0.025;
    samples[i] = Math.max(-1, Math.min(1, render(t, i, random, low)));
  }
  if (fadeEdges) {
    const fade = Math.min(Math.floor(sampleRate * 0.04), Math.floor(count / 2));
    for (let i = 0; i < fade; i += 1) {
      const gain = i / fade;
      samples[i] *= gain;
      samples[count - i - 1] *= gain;
    }
  }
  return samples;
}

function score(seconds, chords, options = {}) {
  const beat = options.beat ?? 3.4;
  const tension = options.tension ?? 0;
  const pulse = options.pulse ?? 0.006;
  const piano = options.piano ?? 0.02;
  const seed = options.seed ?? 200;
  return make(seconds, (t, _i, random, low) => {
    const chordIndex = Math.floor(t / (beat * 4)) % chords.length;
    const chord = chords[chordIndex];
    const chordTime = t % (beat * 4);
    const edge = Math.min(1, t / 1.8, (seconds - t) / 1.8);
    const breathe = .72 + .18 * Math.sin(t * Math.PI / 7) + .1 * Math.sin(t * Math.PI / 19);
    const drone = chord.reduce((sum, frequency, index) => sum + Math.sin(t * Math.PI * 2 * frequency + index * .3) * (.022 / (index + 1)), 0);
    const undertone = Math.sin(t * Math.PI * 2 * chord[0] / 2) * .018;
    const pianoStep = Math.floor((chordTime / beat) * 2) % 8;
    const pianoStart = pianoStep * beat / 2;
    const pluckTime = chordTime - pianoStart;
    const note = chord[pianoStep % chord.length] * (pianoStep > 4 ? 2 : 1);
    const pluck = pluckTime < 1.4 ? Math.sin(t * Math.PI * 2 * note) * Math.exp(-pluckTime * 3.2) * piano : 0;
    const industrial = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 / beat)), 24) * pulse * (1 + random() * .06);
    const dissonance = tension * Math.sin(t * Math.PI * 2 * (chord[0] * 1.067)) * (.009 + .004 * Math.sin(t / 5));
    return edge * (breathe * (drone + undertone) + pluck + industrial + dissonance + low * .0025);
  }, seed, false);
}

function envelope(t, start, duration, attack = 0.01, release = 0.08) {
  if (t < start || t > start + duration) return 0;
  const local = t - start;
  return Math.min(1, local / attack, (duration - local) / release);
}

function wav(samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataLength, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
  return buffer;
}

const assets = [
  ['ambience/winter-wind.wav', make(8, (t, _i, _r, low) => low * (0.22 + 0.09 * Math.sin(t * 0.7)) + Math.sin(t * 90) * 0.004, 11)],
  ['ambience/distant-railway.wav', make(8, (t, _i, _r, low) => low * 0.08 + Math.sin(t * 2 * Math.PI * 46) * 0.025 + Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.35)), 18) * 0.16, 22)],
  ['ambience/factory-floor.wav', make(8, (t, _i, _r, low) => low * 0.07 + Math.sin(t * 2 * Math.PI * 54) * 0.035 + Math.sin(t * 2 * Math.PI * 108) * 0.012 + Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.3)), 24) * 0.1, 33)],
  ['ambience/meeting-room.wav', make(8, (t, _i, random, low) => low * 0.035 + Math.sin(t * 2 * Math.PI * (82 + 8 * Math.sin(t * .7))) * 0.006 + random() * 0.002, 44)],
  ['cinematic/telegraph.wav', make(2.5, (t, _i, random) => [0.18,0.37,0.69,0.86,1.23,1.37,1.82,2.08].reduce((sum,start) => sum + envelope(t,start,.07,.002,.04) * (Math.sin(t*2*Math.PI*1150)*.18 + random()*.05),0), 55)],
  ['cinematic/printing-press.wav', make(4, (t, _i, random, low) => low*.035 + Math.pow(Math.max(0,Math.sin(t*Math.PI*1.55)),28)*(.21+random()*.025) + Math.sin(t*2*Math.PI*72)*.018, 66)],
  ['cinematic/paper-movement.wav', make(1.6, (t, _i, random) => envelope(t,.08,1.35,.12,.22) * random() * (.06 + .08*Math.abs(Math.sin(t*18))), 77)],
  ['cinematic/typewriter.wav', make(2.8, (t, _i, random) => Array.from({length:13},(_,n)=>.14+n*.19).reduce((sum,start)=>sum+envelope(t,start,.035,.002,.025)*(random()*.15+Math.sin(t*2*Math.PI*720)*.035),0), 88)],
  ['cinematic/stamp-impact.wav', make(.75, (t, _i, random, low) => envelope(t,.08,.34,.003,.28)*(random()*.22+low*.35+Math.sin(t*2*Math.PI*62)*.25), 99)],
  ['cinematic/telegram-arrival.wav', make(1.4, (t, _i, random) => envelope(t,.08,.18,.003,.12)*(Math.sin(t*2*Math.PI*980)*.14+random()*.03)+envelope(t,.55,.52,.01,.3)*Math.sin(t*2*Math.PI*620)*.12, 110)],
  ['interface/dossier-open.wav', make(.32, (t, _i, random) => envelope(t,.025,.23,.01,.1)*(random()*.07+Math.sin(t*2*Math.PI*210)*.025), 121)],
  ['interface/map-select.wav', make(.18, t => envelope(t,.01,.14,.004,.08)*Math.sin(t*2*Math.PI*440)*.055, 132)],
  ['interface/political-warning.wav', make(.9, t => envelope(t,.03,.7,.02,.2)*(Math.sin(t*2*Math.PI*180)+Math.sin(t*2*Math.PI*270)*.55)*.07, 143)],
  ['music/main-menu-theme.wav', score(128, [[55,82.41,110],[49,73.42,98],[46.25,69.3,92.5],[51.91,77.78,103.83]], { beat:3.9,piano:.017,pulse:.004,seed:154 })],
  ['music/campaign-planning.wav', score(192, [[55,65.41,82.41],[58.27,69.3,87.31],[49,61.74,73.42],[51.91,65.41,77.78],[55,69.3,82.41],[46.25,58.27,69.3]], { beat:4.6,piano:.012,pulse:.0035,seed:165 })],
  ['music/political-tension.wav', score(126, [[55,65.41,77.78],[51.91,61.74,73.42],[46.25,58.27,69.3],[49,58.27,69.3]], { beat:2.7,piano:.018,pulse:.011,tension:.8,seed:176 })],
  ['music/humanitarian-crisis.wav', score(116, [[46.25,55,69.3],[43.65,51.91,65.41],[41.2,49,61.74],[46.25,58.27,69.3]], { beat:5.2,piano:.01,pulse:.001,tension:.25,seed:187 })],
  ['music/outcome-hopeful.wav', score(28, [[55,69.3,82.41],[65.41,82.41,98],[73.42,92.5,110],[55,82.41,110]], { beat:2.1,piano:.025,pulse:.004,seed:198 })],
  ['music/outcome-ambiguous.wav', score(28, [[55,65.41,82.41],[51.91,61.74,77.78],[49,61.74,73.42],[55,65.41,82.41]], { beat:2.3,piano:.017,pulse:.005,tension:.3,seed:209 })],
  ['music/outcome-defeat.wav', score(28, [[46.25,55,69.3],[43.65,51.91,61.74],[41.2,49,58.27],[36.71,46.25,55]], { beat:2.6,piano:.012,pulse:.002,tension:.55,seed:220 })],
];

for (const [relativePath, samples] of assets) {
  const file = resolve(outRoot, relativePath);
  await mkdir(resolve(file, '..'), { recursive: true });
  await writeFile(file, wav(samples));
}

console.log(`Generated ${assets.length} deterministic PCM WAV assets in ${outRoot}`);
