import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function fixture(scope = 'https://lumi.test/learngame/') {
  const listeners = {}; const stores = new Map(); let offline = false; let claimed = false;
  const key = request => typeof request === 'string' ? request : request.url;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name,new Map());
      const store=stores.get(name);
      return { addAll: async urls=>{ for(const url of urls)store.set(url,new Response(`cached:${url}`)); },
        match: async request=>store.get(key(request))?.clone() };
    },
  };
  const self={registration:{scope},location:{origin:'https://lumi.test'},addEventListener:(name,fn)=>listeners[name]=fn,
    skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true;}}};
  const context=vm.createContext({self,caches,URL,fetch:async request=>{
    if(offline)throw new Error('offline');return new Response(`network:${key(request)}`);
  }});
  vm.runInContext(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),context);
  const lifecycle=async name=>{let pending;listeners[name]({waitUntil:p=>pending=p});await pending;};
  const request=async(url,mode='navigate',method='GET')=>{
    let result;listeners.fetch({request:{url,mode,method},respondWith:p=>result=p});return result ? await result : undefined;
  };
  return {stores,caches,lifecycle,request,setOffline:()=>offline=true,isClaimed:()=>claimed};
}
test('worker precacheia HTML, código, estilo e ícone em subpasta',async()=>{
  const f=await fixture();await f.lifecycle('install');const store=[...f.stores.values()][0];
  for(const file of ['index.html','app/app.js','app/engine.js','app/content.js','app/audio.js','style.css','icon.svg','manifest.webmanifest'])assert.ok(store.has(`https://lumi.test/learngame/${file}`),file);
});
test('worker usa HTML e módulos locais quando a rede cai',async()=>{
  const f=await fixture();await f.lifecycle('install');await f.lifecycle('activate');f.setOffline();
  assert.ok(f.isClaimed());
  assert.match(await(await f.request('https://lumi.test/learngame/')).text(),/cached:.*index.html/);
  assert.match(await(await f.request('https://lumi.test/learngame/app/content.js','same-origin')).text(),/cached:/);
});
test('atualização remove somente caches antigos da mesma aplicação e escopo',async()=>{
  const f=await fixture();await f.caches.open('other-app');await f.caches.open('lumi:https://lumi.test/other/:old');await f.caches.open('lumi:https://lumi.test/learngame/:old');
  await f.lifecycle('install');await f.lifecycle('activate');
  assert.ok(f.stores.has('other-app'));assert.ok(f.stores.has('lumi:https://lumi.test/other/:old'));assert.equal(f.stores.has('lumi:https://lumi.test/learngame/:old'),false);
});
test('worker não intercepta outro domínio, outro escopo ou POST',async()=>{
  const f=await fixture();await f.lifecycle('install');
  assert.equal(await f.request('https://external.test/'),undefined);
  assert.equal(await f.request('https://lumi.test/elsewhere/'),undefined);
  assert.equal(await f.request('https://lumi.test/learngame/','navigate','POST'),undefined);
});
