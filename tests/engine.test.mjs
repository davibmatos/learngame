import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { LESSONS, ACTIVITIES, LESSON_BY_ID, WORLDS } from '../dist/app/content.js';
import { activeProfile, newSave, newProfile, parseSave, shuffled, isUnlocked, recommendedLesson, createSession, completeActivity, currentActivity, matches, finishSession, feed, setStartingPoint, readiness, isIndependent, dayKey, daysBetween } from '../dist/app/engine.js';

const now = new Date(2026, 8, 9, 10);
const solve = (profile, lessonId = recommendedLesson(profile).id, id = crypto.randomUUID(), helped = false, date = now) => {
  let session = createSession(profile, lessonId, date, id);
  session = { ...session, demoSeen: true };
  for (const activityId of session.activityIds) {
    const a = ACTIVITIES.get(activityId);
    session = completeActivity({ ...session, picked: a.answer, solved: true, tries: 1, helped }, true);
  }
  return finishSession(profile, session, date);
};

test('catálogo cobre seis lugares e 32 fases, com IDs estáveis', () => {
  assert.equal(LESSONS.length, 32); assert.equal(WORLDS.length, 6);
  assert.equal(new Set(LESSONS.map(l => l.id)).size, 32);
  assert.equal(ACTIVITIES.size, LESSONS.reduce((n, l) => n + l.activities.length, 0));
});
for (const lesson of LESSONS) {
  test(`${lesson.id}: conteúdo válido, com demonstração e pelo menos quatro atividades`, () => {
    assert.ok(lesson.concept && lesson.narration && lesson.example);
    assert.ok(lesson.activities.length >= 4);
    for (const a of lesson.activities) {
      assert.ok(a.prompt && a.instruction && a.hint && a.explanation);
      assert.equal(a.skill, lesson.skill);
      assert.equal(a.options.length, new Set(a.options.map(o => o.id)).size);
      assert.ok(a.answer.every(id => a.options.some(o => o.id === id)));
      assert.ok(matches(a, a.answer));
      if (a.kind === 'choice') assert.equal(a.answer.length, 1);
      if (a.reading) {
        assert.ok(a.text);
        assert.equal(a.stimulus, undefined);
        assert.ok(!a.instruction.includes(a.text), 'instrução não pode ler o cartão');
      }
    }
  });
}
test('primeiro contato não exige escolher entre alternativas', () => {
  assert.ok(LESSONS[0].activities.every(a => a.options.length === 1 && !a.text && !a.reading));
  assert.ok(LESSONS[1].activities.every(a => a.options.length === 2));
});
test('primeiras leituras aparecem antes de concluir todas as letras', () => {
  const firstRead = LESSONS.findIndex(l => l.skill === 'words');
  assert.ok(LESSONS.slice(firstRead + 1).some(l => l.skill === 'letters'));
});
test('letras do alfabeto são representadas no catálogo', () => {
  const letters = new Set(LESSONS.filter(l => l.skill === 'letters').flatMap(l => l.activities.flatMap(a => a.options.map(o => o.label))));
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') assert.ok(letters.has(letter), letter);
});
test('perfil novo abre somente a primeira fase', () => {
  const p = newProfile(); assert.equal(isUnlocked(p, LESSONS[0].id), true);
  assert.equal(isUnlocked(p, LESSONS[1].id), false); assert.equal(isUnlocked(p, 'unknown'), false);
  assert.equal(recommendedLesson(p).id, LESSONS[0].id);
});
test('sessão não abre fase bloqueada', () => {
  assert.throws(() => createSession(newProfile(), LESSONS[2].id), /disponível/);
});
test('sessão retorna aventura pendente sem descartá-la', () => {
  const p = newProfile(); p.pending = createSession(p, LESSONS[0].id, now, 's1');
  assert.equal(createSession(p, LESSONS[1].id, now, 's2'), p.pending);
});
test('embaralhamento é estável por sessão e preserva os elementos', () => {
  const list = [1,2,3,4,5,6,7];
  assert.deepEqual(shuffled(list,'a'), shuffled(list,'a'));
  assert.deepEqual(shuffled(list,'a').sort(), list);
  assert.notDeepEqual(shuffled(list,'a'), shuffled(list,'b'));
  assert.deepEqual(list,[1,2,3,4,5,6,7]);
});
test('um erro não é acerto independente', () => {
  assert.equal(isIndependent({correct:true, attempts:2, helped:false}), false);
  assert.equal(isIndependent({correct:true, attempts:1, helped:true}), false);
  assert.equal(isIndependent({correct:false, attempts:1, helped:false}), false);
  assert.equal(isIndependent({correct:true, attempts:1, helped:false}), true);
});
test('concluir o primeiro encontro libera o próximo sem exigir outro dia', () => {
  const result = solve(newProfile());
  assert.equal(result.newlyReady, true);
  assert.equal(isUnlocked(result.profile, LESSONS[1].id), true);
  assert.equal(result.profile.seeds, 1); assert.equal(result.summary.total, 4);
});
test('ajuda dá acolhimento e presente, mas não libera dificuldade prematuramente', () => {
  const result = solve(newProfile(), LESSONS[0].id, 'help', true);
  assert.equal(result.profile.seeds, 1);
  assert.equal(result.profile.progress[LESSONS[0].id].ready, false);
  assert.equal(result.summary.independent, 0); assert.equal(result.summary.supported, 4);
});
test('fases de letras exigem mais de uma sessão e exemplos diferentes', () => {
  let p = setStartingPoint(newProfile(), LESSONS.findIndex(l => l.id === 'fase-09'));
  const first = solve(p); assert.equal(first.newlyReady, false);
  p = solve(first.profile).profile;
  assert.equal(p.progress['fase-09'].ready, true);
});
test('banco prioriza itens menos vistos na sessão seguinte', () => {
  const p = setStartingPoint(newProfile(), LESSONS.findIndex(l => l.id === 'fase-09'));
  const session = createSession(p, 'fase-09', now, 'rotate1');
  const next = solve(p, 'fase-09', 'rotate1').profile;
  const second = createSession(next, 'fase-09', now, 'rotate2');
  assert.ok(second.activityIds.some(id => !session.activityIds.includes(id)));
});
test('montagem aceita peças iguais em outra ordem física', () => {
  const a = [...ACTIVITIES.values()].find(a => a.kind === 'build' && a.stimulus === 'COCO');
  assert.equal(matches(a, [...a.answer].reverse()), true);
  assert.equal(matches(a, [a.answer[0], a.answer[0]]), false);
});
test('montagem exige ordem correta e todas as peças', () => {
  const a = [...ACTIVITIES.values()].find(a => a.kind === 'build' && a.stimulus === 'MALA');
  assert.equal(matches(a, [...a.answer].reverse()), false);
  assert.equal(matches(a, [a.answer[0]]), false);
});
test('resultado não é registrado sem uma resposta conferida', () => {
  const p = newProfile(); const session = createSession(p, LESSONS[0].id, now, 'unchecked');
  assert.equal(completeActivity(session, true), session);
  assert.equal(completeActivity(session, false), session);
});
test('não recompensa uma aventura incompleta', () => {
  const p = newProfile(); const s = createSession(p, LESSONS[0].id, now, 'incomplete');
  assert.throws(() => finishSession(p,s), /não foi concluída/);
});
test('finalizar a mesma sessão é idempotente', () => {
  const p = newProfile(); let s = createSession(p, LESSONS[0].id, now, 'once');
  while (currentActivity(s)) s = completeActivity({...s, solved:true, tries:1, picked: currentActivity(s).answer}, true);
  const first = finishSession(p,s,now); const second = finishSession(first.profile,s,now);
  assert.equal(first.profile,second.profile); assert.equal(second.profile.seeds,1); assert.equal(second.profile.history.length,1);
});
test('ausência não retira conquistas, presentes ou decoração', () => {
  const p = solve(newProfile()).profile;
  const before = JSON.stringify(p);
  createSession(p, LESSONS[0].id, new Date(2027,1,1), 'later');
  assert.equal(JSON.stringify(p),before);
});
test('limite de três presentes por dia não bloqueia estudo', () => {
  let p = newProfile();
  for(let i=0;i<5;i++) p=solve(p,LESSONS[0].id,`present-${i}`).profile;
  assert.equal(p.seeds,3); assert.equal(p.history.length,5);
  assert.equal(solve(p,LESSONS[0].id,'tomorrow',false,new Date(2026,8,10)).profile.seeds,4);
});
test('lanche não deixa saldo negativo e não afeta aprendizagem', () => {
  const empty=newProfile(); assert.equal(feed(empty),empty);
  const p=solve(empty).profile; const after=feed(p);
  assert.equal(after.seeds,0); assert.equal(after.feeds,1); assert.deepEqual(after.progress,p.progress);
});
test('revisão vencida entra como um quinto item, sem reduzir a fase atual', () => {
  let p=solve(newProfile()).profile;
  const session=createSession(p,LESSONS[1].id,new Date(2026,8,12),'review');
  assert.equal(session.activityIds.length,5); assert.ok(session.activityIds[0].startsWith(LESSONS[0].id));
  assert.equal(session.activityIds.filter(id=>id.startsWith(LESSONS[1].id)).length,4);
});
test('ajuste de nível não inventa domínio das etapas anteriores', () => {
  const p=setStartingPoint(newProfile(),10);
  assert.equal(isUnlocked(p,LESSONS[10].id),true); assert.equal(isUnlocked(p,LESSONS[11].id),false);
  assert.deepEqual(p.progress,{}); assert.equal(recommendedLesson(p),LESSONS[10]);
  assert.throws(()=>setStartingPoint(p,-1)); assert.throws(()=>setStartingPoint(p,100));
});
test('critérios não somam resultados de outra habilidade', () => {
  const lesson=LESSONS[5];
  const results=LESSONS[0].activities.map(a=>({activityId:a.id, attempts:1,helped:false,correct:true}));
  assert.equal(readiness(lesson,results,5),false);
});
test('progresso já liberado não regride em uma revisão com ajuda',()=>{
  const first=solve(newProfile()); const next=solve(first.profile,LESSONS[0].id,'supported-review',true);
  assert.equal(next.profile.progress[LESSONS[0].id].ready,true);
});
test('backup reconstrói perfil e sessão pendente', () => {
  const save=newSave(); const p=activeProfile(save); p.pending=createSession(p,LESSONS[0].id,now,'pending');
  assert.deepEqual(parseSave(JSON.stringify(save)),save);
});
test('backup mantém perfis isolados', () => {
  const save=newSave(); save.profiles[0]=solve(save.profiles[0]).profile;
  const second=newProfile('🌙'); save.profiles.push(second); save.activeId=second.id;
  const parsed=parseSave(JSON.stringify(save)); assert.equal(activeProfile(parsed).seeds,0); assert.equal(parsed.profiles[0].seeds,1);
});
for (const [label, mutate] of [
  ['versão incompatível',s=>s.version=99], ['mais de quatro perfis',s=>s.profiles=Array(5).fill(s.profiles[0])],
  ['saldo negativo',s=>s.profiles[0].seeds=-1], ['fase desconhecida',s=>s.profiles[0].progress.bad={runs:0,recent:[],ready:false,lastDay:'2026-09-09'}],
  ['perfil ativo inexistente',s=>s.activeId='other'], ['símbolo com HTML',s=>s.profiles[0].icon='<script>bad</script>'],
  ['valor fracionário',s=>s.profiles[0].feeds=.5], ['estado ausente',s=>delete s.profiles[0].sound],
  ['perfil duplicado',s=>s.profiles.push(s.profiles[0])], ['decoração inexistente',s=>s.profiles[0].decoration='unknown'],
]) test(`importação rejeita ${label}`,()=>{const s=newSave();mutate(s);assert.throws(()=>parseSave(JSON.stringify(s)));});
test('importação rejeita JSON truncado e arquivos grandes',()=>{
  assert.throws(()=>parseSave('{')); assert.throws(()=>parseSave('x'.repeat(2000001)));
});
test('importação rejeita atividade pendente falsamente marcada como certa',()=>{
  const s=newSave();const p=activeProfile(s);p.pending=createSession(p,LESSONS[0].id,now,'bad');p.pending.solved=true;
  assert.throws(()=>parseSave(JSON.stringify(s)),/conferida/);
});
test('importação ignora propriedades extras em vez de renderizar HTML',()=>{
  const s=newSave();s.profiles[0].name='<img src=x onerror=alert(1)>';const parsed=parseSave(JSON.stringify(s));
  assert.equal('name' in parsed.profiles[0],false);
});
test('datas de rotina usam o calendário local, não UTC',()=>{
  const code="import {dayKey} from './dist/app/engine.js'; console.log(dayKey(new Date('2026-09-10T01:30:00Z')));";
  const result=execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:process.cwd(),env:{...process.env,TZ:'America/Fortaleza'}}).toString().trim();
  assert.equal(result,'2026-09-09'); assert.equal(dayKey(new Date(2026,0,1)),'2026-01-01');
  assert.equal(daysBetween('2026-09-09','2026-09-11'),2);
});

test('limite de presentes permanece quando o histórico de 200 aventuras é rotacionado',()=>{
  let p=newProfile(); for(let i=0;i<210;i++) p=solve(p,LESSONS[0].id,`long-${i}`).profile;
  assert.equal(p.seeds,3); assert.equal(p.rewardsToday,3); assert.equal(p.history.length,200);
});
