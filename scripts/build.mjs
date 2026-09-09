import { spawnSync } from 'node:child_process';
import { readdir, readFile, rm, cp, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
const compiler = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const build = spawnSync(compiler, ['-p', 'tsconfig.json'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (build.status !== 0) {
  console.error('Não foi possível compilar. Execute npm ci e confira os erros acima.');
  process.exit(build.status ?? 1);
}
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(directory, e.name)) : path.join(directory, e.name)));
  return result.flat().sort();
}
const entries = await files('dist');
const digest = createHash('sha256');
for (const file of entries) digest.update(file).update(await readFile(file));
const version = digest.digest('hex').slice(0, 16);
const list = ['./', ...entries.map(f => './' + path.relative('dist', f).split(path.sep).join('/'))];
const worker = `const PREFIX = 'lumi:' + self.registration.scope + ':';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify(list)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new URL(file, self.registration.scope).href))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match(new URL('./index.html', self.registration.scope).href))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
});
`;
await writeFile('dist/sw.js', worker);
console.log(`Lumi compilado em dist/ — versão offline ${version}, ${entries.length + 1} arquivos.`);
