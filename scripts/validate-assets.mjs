import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const publicRoot = resolve(root, 'apps/web/public');
const manifestPath = resolve(publicRoot, 'assets/assets-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const listed = new Set(manifest.assets.map(asset => asset.localPath.replaceAll('/', sep)));
const errors = [];

for (const asset of manifest.assets) {
  for (const field of ['localPath', 'source', 'creator', 'license', 'verificationStatus']) {
    if (!asset[field]) errors.push(`${asset.localPath ?? '<unknown>'}: missing ${field}`);
  }
  if (asset.external && asset.verificationStatus !== 'verified') errors.push(`${asset.localPath}: external asset is not verified`);
  try { await stat(resolve(root, asset.localPath)); }
  catch { errors.push(`${asset.localPath}: manifest record points to a missing file`); }
}

async function walk(dir) {
  try {
    for (const name of await readdir(dir)) {
      const path = resolve(dir, name);
      const info = await stat(path);
      if (info.isDirectory()) await walk(path);
      else {
        const rel = relative(root, path);
        if (path === manifestPath) continue;
        if (!listed.has(rel)) errors.push(`${rel}: file has no manifest record`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await walk(publicRoot);
if (errors.length) {
  console.error(`Asset validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Asset validation passed: ${manifest.assets.length} recorded assets; no untracked public files.`);
