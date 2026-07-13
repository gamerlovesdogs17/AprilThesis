import { readFile, writeFile } from 'node:fs/promises';

const source = new URL('../apps/web/public/assets/map/natural-earth-admin0-110m.geojson', import.meta.url);
const output = new URL('../packages/content/src/geography-context.json', import.meta.url);
const keep = new Set([
  'Russia', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Belarus', 'Ukraine', 'Poland',
  'Romania', 'Georgia', 'Armenia', 'Azerbaijan', 'Turkey', 'Iran', 'Afghanistan',
  'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Mongolia',
  'China', 'North Korea', 'Japan',
]);

const geojson = JSON.parse(await readFile(source, 'utf8'));
const project = ([longitude, latitude]) => [
  Number((((longitude - 18) / 162) * 1000).toFixed(2)),
  Number((((82 - latitude) / 57) * 560).toFixed(2)),
];

function ringToPath(ring) {
  const points = ring
    .filter(([lon, lat]) => lon >= 15 && lon <= 180 && lat >= 24 && lat <= 84)
    .map(project);
  if (points.length < 3) return '';
  return `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`;
}

const features = geojson.features
  .filter(feature => keep.has(feature.properties.NAME))
  .map(feature => {
    const polygons = feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
    return {
      id: feature.properties.ADM0_A3,
      name: feature.properties.NAME,
      path: polygons.map(polygon => ringToPath(polygon[0])).filter(Boolean).join(' '),
    };
  })
  .filter(feature => feature.path);

await writeFile(output, `${JSON.stringify({ source: 'Natural Earth 1:110m Admin 0, public domain', features }, null, 2)}\n`);
console.log(`Wrote ${features.length} geographic context features to ${output.pathname}`);
