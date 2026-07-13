import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sampleRate = 22050;
const outRoot = resolve(import.meta.dirname, '../apps/web/public/assets/audio');

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = Math.imul(1664525, state) + 1013904223 >>> 0) / 0xffffffff) * 2 - 1;
}

function make(seconds, render, seed = 1) {
  const count = Math.floor(seconds * sampleRate);
  const samples = new Float32Array(count);
  const random = rng(seed);
  let low = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    low += (random() - low) * 0.025;
    samples[i] = Math.max(-1, Math.min(1, render(t, i, random, low)));
  }
  const fade = Math.min(Math.floor(sampleRate * 0.04), Math.floor(count / 2));
  for (let i = 0; i < fade; i += 1) {
    const gain = i / fade;
    samples[i] *= gain;
    samples[count - i - 1] *= gain;
  }
  return samples;
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
  ['music/title-cue.wav', make(4.5, (t, _i, _r, low) => low*.018 + [110,164.81,220].reduce((sum,f,index)=>sum+Math.sin(t*2*Math.PI*f)*(.018/(index+1)),0)*(Math.min(1,t/.8)*Math.min(1,(4.5-t)/1.2)), 154)],
];

for (const [relativePath, samples] of assets) {
  const file = resolve(outRoot, relativePath);
  await mkdir(resolve(file, '..'), { recursive: true });
  await writeFile(file, wav(samples));
}

console.log(`Generated ${assets.length} deterministic PCM WAV assets in ${outRoot}`);
