from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json,os,shutil
ROOT=Path(__file__).resolve().parents[1]
ARTIFACTS=ROOT/'test-results'
ARTIFACTS.mkdir(exist_ok=True)

def bundle():
    sources=[]
    for name in ['content','engine','audio','app']:
        s=(ROOT/f'dist/app/{name}.js').read_text()
        s=re.sub(r'^import .*?;\n','',s,flags=re.M)
        s=re.sub(r'^export ','',s,flags=re.M)
        sources.append(s)
    return '(function(){\n'+ '\n'.join(sources) +'\nwindow.__lumiTest={LESSONS,ACTIVITIES,newSave,parseSave,createSession,matches,setStartingPoint,STORAGE_KEY};})();'

SHELL='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div><dialog id="modal" aria-label="Lumi, opções e orientações"></dialog></body></html>'
STORAGE="""window.__storage={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__storage[k]??null,setItem:(k,v)=>window.__storage[k]=String(v),removeItem:k=>delete window.__storage[k]}});"""

def load(page, saved=None):
    page.set_content(SHELL)
    page.add_style_tag(content=(ROOT/'dist/style.css').read_text())
    page.evaluate(STORAGE)
    if saved is not None:page.evaluate('s=>window.__storage["lumi.progress.v1"]=s', saved)
    page.add_script_tag(content=bundle())

def dismiss_audio(page):
    if page.locator('#modal[open] [data-action="close"]').count():page.locator('#modal[open] [data-action="close"]').click()


VOICE="""window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{localService:true,lang:'pt-BR'}],cancel:()=>{},speak:u=>window.__spoken.push(u.text)}});window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};"""

def run():
    with sync_playwright() as driver:
        browser=driver.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        errors=[]; results=[]
        def fresh(width=1280,saved=None,voice=True):
            page=browser.new_page(viewport={'width':width,'height':900})
            page.on('pageerror',lambda e:errors.append(str(e)))
            load(page,saved)
            if voice:page.evaluate("() => {"+VOICE+"}")
            return page
        def state(page):return page.evaluate('JSON.parse(localStorage.getItem("lumi.progress.v1"))')
        def parent(page):
            page.locator('.page-footer [data-action="parents"]').click()
            page.locator('#parent-answer').fill('15')
            page.locator('#parent-form button[type="submit"]').click()
        def configured(page,lesson_id):
            return page.evaluate("""id=>{const t=window.__lumiTest;const s=t.newSave();s.profiles[0]=t.setStartingPoint(s.profiles[0],t.LESSONS.findIndex(l=>l.id===id));return JSON.stringify(s)}""",lesson_id)
        def start(page):
            page.locator('[data-action="start"]').first.click();dismiss_audio(page)
            if page.locator('[data-action="demo-done"]').count():page.locator('[data-action="demo-done"]').click()
        def get_correct(page):
            return page.evaluate("""()=>{const t=window.__lumiTest;const s=JSON.parse(localStorage.getItem(t.STORAGE_KEY));const p=s.profiles.find(p=>p.id===s.activeId);return t.ACTIVITIES.get(p.pending.activityIds[p.pending.results.length]).answer;}""")
        def complete(page):
            guard=0
            while page.locator('.activity-card').count() and guard<8:
                guard+=1
                if page.locator('[data-action="piece"]').count():
                    for ident in get_correct(page):page.locator(f'[data-action="piece"][data-id="{ident}"]').click()
                    page.locator('[data-action="check-build"]').click()
                elif not page.locator('[data-action="next"]').count():page.locator(f'[data-action="answer"][data-id="{get_correct(page)[0]}"]').click()
                page.locator('[data-action="next"]').click()
            assert page.locator('.end-card').count()==1
        def record(label):results.append(label);print('OK',label)

        page=fresh(1440);assert page.locator('h1').count()==1
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(ARTIFACTS/'desktop.png'),full_page=True);record('início desktop, sem erros ou rolagem horizontal')
        for width in [320,390,768]:
            m=fresh(width);assert not m.evaluate('document.documentElement.scrollWidth>innerWidth')
            m.locator('[data-screen="map"]').first.click();assert m.locator('.world-card').count()==6
            assert not m.evaluate('document.documentElement.scrollWidth>innerWidth')
            m.screenshot(path=str(ARTIFACTS/f'mapa-{width}.png'),full_page=True)
            m.close()
        record('mapa responsivo em 320, 390 e 768 pixels')
        page.locator('[data-screen="map"]').first.click();page.locator('[data-action="world"][data-world="1"]').click()
        assert page.locator('#modal .lesson-list button:disabled').count()>0
        page.keyboard.press('Escape');record('modal de fases bloqueadas e fechamento por teclado')
        page.locator('[data-screen="home"]').first.click();start(page)
        assert page.locator('.choice').count()==1
        page.locator('.choice').focus();page.keyboard.press('Enter')
        assert page.locator('[data-action="next"]').count()==1
        saved=json.dumps(state(page)); resumed=fresh(saved=saved);start(resumed)
        assert resumed.locator('[data-action="next"]').count()==1
        complete(resumed);assert state(resumed)['profiles'][0]['seeds']==1
        assert state(resumed)['profiles'][0]['progress']['fase-01']['ready']
        record('primeira fase pelo teclado, retomada do estado e recompensa única')
        resumed.locator('.end-card [data-screen="house"]').click();resumed.locator('[data-action="feed"]').click()
        assert state(resumed)['profiles'][0]['seeds']==0
        assert resumed.locator('[data-action="feed"]').is_disabled()
        resumed.locator('[data-action="hug"]').click();record('cuidado com mascote sem saldo negativo e abraço livre')
        parent(resumed);resumed.locator('[data-action="add-profile"]').click()
        snapshot=state(resumed);assert len(snapshot['profiles'])==2 and snapshot['profiles'][1]['history']==[]
        record('área dos responsáveis e isolamento de perfis')
        resumed.locator('#calm-setting').check();assert 'calm' in resumed.locator('body').get_attribute('class')
        resumed.locator('#starting-point').select_option('9');resumed.locator('[data-action="apply-start"]').click()
        snapshot=state(resumed);assert snapshot['profiles'][1]['startAt']==9 and snapshot['profiles'][1]['progress']=={}
        record('modo tranquilo e ajuste de início sem inventar domínio')
        r=fresh(saved=configured(page,'fase-21'));r.locator('[data-action="start"]').first.click();r.evaluate('window.__spoken=[]');r.locator('[data-action="demo-done"]').click()
        target=r.locator('.reading-card').inner_text();spoken=r.evaluate('window.__spoken')
        assert not any(target in text for text in spoken)
        r.locator('[data-action="help"]').click();assert state(r)['profiles'][0]['pending']['helped']
        complete(r);assert state(r)['profiles'][0]['history'][0]['supported']>=1
        record('leitura não narrada automaticamente e ajuda registrada separadamente')
        b=fresh(saved=configured(page,'fase-17'));start(b)
        answer_ids=get_correct(b)
        for ident in answer_ids[::-1]:b.locator(f'[data-action="piece"][data-id="{ident}"]').click()
        b.locator('[data-action="check-build"]').click()
        assert not state(b)['profiles'][0]['pending']['solved']
        b.locator('[data-action="clear-pieces"]').click()
        for ident in answer_ids:b.locator(f'[data-action="piece"][data-id="{ident}"]').click()
        assert not state(b)['profiles'][0]['pending']['solved']
        b.locator('[data-action="check-build"]').click()
        assert state(b)['profiles'][0]['pending']['tries']==2
        b.locator('[data-action="next"]').click()
        assert state(b)['profiles'][0]['pending']['results'][0]['attempts']==2
        record('montagem corrigida exige nova conferência e não vira acerto na primeira tentativa')
        no_voice=fresh(voice=False);no_voice.locator('[data-action="start"]').first.click()
        assert 'Vamos com um adulto?' in no_voice.locator('#modal').inner_text()
        record('orientação explícita quando não há voz local em português')
        bad=fresh(saved='{invalid');assert 'preservado' in bad.locator('.warning').inner_text()
        assert bad.evaluate('localStorage.getItem("lumi.progress.v1")')=='{invalid'
        record('progresso ilegível preservado sem sobrescrever')
        st=fresh(390,saved=configured(page,'fase-32'));start(st)
        assert not st.evaluate('document.documentElement.scrollWidth>innerWidth')
        st.screenshot(path=str(ARTIFACTS/'historia-mobile.png'),full_page=True)
        record('história longa cabe na tela de celular')
        assert not errors, errors
        record('nenhuma exceção JavaScript nos fluxos executados')
        report={'passed':len(results),'scenarios':results,'mode':'Chromium com DOM isolado e armazenamento/voz simulados; não é validação de instalação PWA ou de voz real.'}
        (ARTIFACTS/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False));browser.close()

if __name__=='__main__':run()
