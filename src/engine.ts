import { ACTIVITIES, DECORATIONS, LESSONS, LESSON_BY_ID, PROFILE_ICONS, type Activity, type Lesson } from './content.js';
export const STORAGE_KEY = 'lumi.progress.v1';
export const SAVE_VERSION = 1;
export type Outcome = { activityId: string; attempts: number; helped: boolean; correct: boolean };
export type LessonProgress = { runs: number; recent: Outcome[]; ready: boolean; lastDay: string };
export type Session = { id: string; lessonId: string; day: string; activityIds: string[]; results: Outcome[]; demoSeen: boolean; tries: number; helped: boolean; solved: boolean; picked: string[] };
export type Summary = { id: string; day: string; lessonId: string; total: number; independent: number; supported: number; seed: boolean };
export type Profile = {
  id: string; icon: string; startAt: number; seeds: number; feeds: number; decoration: string; rewardDay: string | null; rewardsToday: number;
  sound: boolean; calm: boolean; progress: Record<string, LessonProgress>; history: Summary[];
  pending: Session | null;
};
export type Save = { version: 1; activeId: string; profiles: Profile[] };
export function uid(): string { return globalThis.crypto?.randomUUID?.() ?? `lumi-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function newProfile(icon: string = PROFILE_ICONS[0]): Profile {
  return { id: uid(), icon, startAt: 0, seeds: 0, feeds: 0, decoration: 'garden', rewardDay: null, rewardsToday: 0, sound: true, calm: false, progress: {}, history: [], pending: null };
}
export function newSave(): Save {
  const profile = newProfile();
  return { version: 1, activeId: profile.id, profiles: [profile] };
}
export function activeProfile(save: Save): Profile {
  return save.profiles.find(p => p.id === save.activeId) ?? save.profiles[0]!;
}
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
}
export function shuffled<T>(values: readonly T[], seed: string): T[] {
  let state = 2166136261;
  for (const ch of seed) state = Math.imul(state ^ ch.charCodeAt(0), 16777619) >>> 0;
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
export function isUnlocked(profile: Profile, lessonId: string): boolean {
  const index = LESSONS.findIndex(l => l.id === lessonId);
  if (index < 0) return false;
  if (index <= profile.startAt) return true;
  return LESSONS.slice(profile.startAt, index).every(l => profile.progress[l.id]?.ready);
}
export function recommendedLesson(profile: Profile): Lesson {
  return LESSONS.slice(profile.startAt).find(l => !profile.progress[l.id]?.ready) ??
    [...LESSONS].sort((a, b) => (profile.progress[a.id]?.lastDay ?? '').localeCompare(profile.progress[b.id]?.lastDay ?? ''))[0]!;
}
export function isIndependent(result: Outcome): boolean {
  return result.correct && result.attempts === 1 && !result.helped;
}
export function readiness(lesson: Lesson, recent: Outcome[], runs: number): boolean {
  const relevant = recent.filter(r => lesson.activities.some(a => a.id === r.activityId)).slice(-12);
  const unique = new Set(relevant.filter(isIndependent).map(r => r.activityId)).size;
  const easy = lesson.skill === 'interaction' || lesson.skill === 'listening';
  const minimumRuns = easy ? 1 : 2;
  const minimumUnique = Math.min(easy ? 3 : 4, lesson.activities.length);
  return runs >= minimumRuns && unique >= minimumUnique && relevant.length > 0 &&
    relevant.filter(isIndependent).length / relevant.length >= (easy ? 0.75 : 0.8);
}
export function createSession(profile: Profile, lessonId: string, now = new Date(), id = uid()): Session {
  if (profile.pending) return profile.pending;
  if (!isUnlocked(profile, lessonId)) throw new Error('Esta fase ainda não está disponível.');
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const day = dayKey(now);
  const recent = profile.progress[lessonId]?.recent ?? [];
  const pool = shuffled(lesson.activities, `${profile.id}:${lessonId}:${profile.progress[lessonId]?.runs ?? 0}`);
  // Itens menos vistos primeiro. O desempate varia entre sessões, não após cada toque.
  pool.sort((a, b) => recent.filter(r => r.activityId === a.id).length - recent.filter(r => r.activityId === b.id).length);
  const own = pool.slice(0, 4).map(a => a.id);
  const due = LESSONS.filter(l => l.id !== lessonId && profile.progress[l.id]?.ready &&
    daysBetween(profile.progress[l.id]!.lastDay, day) >= 2);
  const review = due.sort((a, b) => profile.progress[a.id]!.lastDay.localeCompare(profile.progress[b.id]!.lastDay))[0];
  // A revisão é adicional: nunca reduz o contato com a habilidade nova.
  if (review) own.unshift(shuffled(review.activities, `${day}:${id}`)[0]!.id);
  return { id, lessonId, day, activityIds: own, results: [], demoSeen: false, tries: 0, helped: false, solved: false, picked: [] };
}
export function currentActivity(session: Session): Activity | undefined {
  return ACTIVITIES.get(session.activityIds[session.results.length] ?? '');
}
export function matches(activity: Activity, selected: string[]): boolean {
  if (activity.kind === 'choice') return selected.length === 1 && selected[0] === activity.answer[0];
  if (new Set(selected).size !== selected.length || selected.length !== activity.answer.length) return false;
  const text = (ids: string[]) => ids.map(id => activity.options.find(o => o.id === id)?.label ?? '\u0000').join('|');
  // Peças com a mesma sílaba, como CO + CO, são intercambiáveis.
  return text(selected) === text(activity.answer);
}
export function completeActivity(session: Session, correct: boolean): Session {
  const activity = currentActivity(session);
  if (!activity || !correct || !session.solved || !matches(activity, session.picked)) return session;
  return { ...session, results: [...session.results, { activityId: activity.id, attempts: Math.max(1, session.tries), helped: session.helped, correct: true }], tries: 0, helped: false, solved: false, picked: [] };
}
export function finishSession(profile: Profile, session: Session, now = new Date()): { profile: Profile; summary: Summary; newlyReady: boolean } {
  const previous = profile.history.find(h => h.id === session.id);
  if (previous) return { profile, summary: previous, newlyReady: false };
  if (session.results.length !== session.activityIds.length || session.results.some((r, i) => r.activityId !== session.activityIds[i] || !r.correct)) {
    throw new Error('A aventura ainda não foi concluída.');
  }
  const day = dayKey(now);
  const next: Profile = structuredClone(profile);
  const affected = LESSONS.filter(l => session.results.some(r => l.activities.some(a => a.id === r.activityId)));
  const before = profile.progress[session.lessonId]?.ready ?? false;
  for (const lesson of affected) {
    const old = next.progress[lesson.id] ?? { runs: 0, recent: [], ready: false, lastDay: day };
    const fresh = session.results.filter(r => lesson.activities.some(a => a.id === r.activityId));
    const recent = [...old.recent, ...fresh].slice(-12);
    const runs = old.runs + (lesson.id === session.lessonId ? 1 : 0);
    next.progress[lesson.id] = { runs, recent, lastDay: day, ready: old.ready || readiness(lesson, recent, runs) };
  }
  // Até três presentes por dia, sem sequências diárias, perda por ausência ou bloqueio de estudo.
  if (next.rewardDay !== day) { next.rewardDay = day; next.rewardsToday = 0; }
  const seed = next.rewardsToday < 3;
  next.rewardsToday += Number(seed);
  const independent = session.results.filter(isIndependent).length;
  const summary: Summary = { id: session.id, day, lessonId: session.lessonId, total: session.results.length,
    independent, supported: session.results.length - independent, seed };
  next.history = [...next.history, summary].slice(-200);
  next.seeds += Number(seed);
  next.pending = null;
  return { profile: next, summary, newlyReady: !before && !!next.progress[session.lessonId]?.ready };
}
export function feed(profile: Profile): Profile {
  if (profile.seeds <= 0) return profile;
  return { ...profile, seeds: profile.seeds - 1, feeds: profile.feeds + 1 };
}
export function setStartingPoint(profile: Profile, index: number): Profile {
  if (!Number.isInteger(index) || index < 0 || index >= LESSONS.length) throw new Error('Ponto de partida inválido.');
  return { ...profile, startAt: index, pending: null };
}

// Reconstrói somente os campos permitidos; backups nunca são executados como código.
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Formato inválido.');
  return value as Record<string, unknown>;
};
const str = (value: unknown, max = 120): string => {
  if (typeof value !== 'string' || !value || value.length > max) throw new Error('Texto inválido.');
  return value;
};
const num = (value: unknown, max = 1000000): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) throw new Error('Número inválido.');
  return value;
};
const bool = (value: unknown): boolean => { if (typeof value !== 'boolean') throw new Error('Opção inválida.'); return value; };
const dateStr = (value: unknown): string => {
  const valueStr = str(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valueStr) || !Number.isFinite(Date.parse(`${valueStr}T12:00:00Z`))) throw new Error('Data inválida.');
  return valueStr;
};
const lessonId = (value: unknown): string => { const id = str(value); if (!LESSON_BY_ID.has(id)) throw new Error('Fase desconhecida.'); return id; };
function readOutcome(value: unknown): Outcome {
  const row = object(value); const id = str(row.activityId);
  if (!ACTIVITIES.has(id)) throw new Error('Atividade desconhecida.');
  return { activityId: id, attempts: Math.max(1, num(row.attempts)), helped: bool(row.helped), correct: bool(row.correct) };
}
export function parseSave(raw: string): Save {
  if (raw.length > 2000000) throw new Error('Arquivo grande demais.');
  const source = object(JSON.parse(raw) as unknown);
  if (source.version !== SAVE_VERSION) throw new Error('Versão de backup não suportada.');
  if (!Array.isArray(source.profiles) || source.profiles.length < 1 || source.profiles.length > 4) throw new Error('Perfis inválidos.');
  const profiles = source.profiles.map((value): Profile => {
    const row = object(value); const p = newProfile();
    p.id = str(row.id); p.icon = str(row.icon);
    if (!(PROFILE_ICONS as readonly string[]).includes(p.icon)) throw new Error('Símbolo inválido.');
    p.startAt = num(row.startAt, LESSONS.length - 1); p.seeds = num(row.seeds); p.feeds = num(row.feeds);
    p.decoration = str(row.decoration);
    p.rewardDay = row.rewardDay === null ? null : dateStr(row.rewardDay); p.rewardsToday = num(row.rewardsToday, 3);
    if (!DECORATIONS.some(d => d.id === p.decoration && d.feeds <= p.feeds)) throw new Error('Decoração inválida.');
    p.sound = bool(row.sound); p.calm = bool(row.calm);
    p.progress = {};
    for (const [id, v] of Object.entries(object(row.progress))) {
      const validId = lessonId(id); const progress = object(v);
      if (!Array.isArray(progress.recent) || progress.recent.length > 12) throw new Error('Histórico inválido.');
      const recent = progress.recent.map(readOutcome);
      if (recent.some(r => !LESSON_BY_ID.get(id)!.activities.some(a => a.id === r.activityId))) throw new Error('Atividade de outra fase.');
      p.progress[validId] = { runs: num(progress.runs), recent, ready: bool(progress.ready), lastDay: dateStr(progress.lastDay) };
    }
    if (!Array.isArray(row.history) || row.history.length > 200) throw new Error('Histórico inválido.');
    p.history = row.history.map(v => {
      const h = object(v); const total = num(h.total, 5); const independent = num(h.independent, total); const supported = num(h.supported, total);
      if (independent + supported !== total) throw new Error('Resumo inválido.');
      return { id: str(h.id), day: dateStr(h.day), lessonId: lessonId(h.lessonId), total, independent, supported, seed: bool(h.seed) };
    });
    if (new Set(p.history.map(h => h.id)).size !== p.history.length) throw new Error('Aventuras duplicadas.');
    p.pending = null;
    if (row.pending !== null) {
      const s = object(row.pending);
      if (!Array.isArray(s.activityIds) || s.activityIds.length < 1 || s.activityIds.length > 5 || !Array.isArray(s.results) || s.results.length > s.activityIds.length) throw new Error('Aventura inválida.');
      const ids = s.activityIds.map(id => str(id));
      if (new Set(ids).size !== ids.length || ids.some(id => !ACTIVITIES.has(id))) throw new Error('Atividades inválidas.');
      const results = s.results.map(readOutcome);
      if (results.some((r, i) => r.activityId !== ids[i] || !r.correct)) throw new Error('Respostas inválidas.');
      const pending: Session = { id: str(s.id), lessonId: lessonId(s.lessonId), day: dateStr(s.day), activityIds: ids, results,
        demoSeen: bool(s.demoSeen), tries: num(s.tries), helped: bool(s.helped), solved: bool(s.solved), picked: [] };
      const current = currentActivity(pending);
      if (!Array.isArray(s.picked) || s.picked.length > 12) throw new Error('Peças inválidas.');
      pending.picked = s.picked.map(id => str(id));
      if (new Set(pending.picked).size !== pending.picked.length || pending.picked.some(id => !current?.options.some(o => o.id === id))) throw new Error('Peças inválidas.');
      if (pending.solved && (!current || pending.tries === 0 || !matches(current, pending.picked))) throw new Error('Resposta não conferida.');
      if (!isUnlocked(p, pending.lessonId)) throw new Error('Fase indisponível.');
      p.pending = pending;
    }
    return p;
  });
  if (new Set(profiles.map(p => p.id)).size !== profiles.length) throw new Error('Perfis duplicados.');
  const activeId = str(source.activeId);
  if (!profiles.some(p => p.id === activeId)) throw new Error('Perfil ativo inválido.');
  return { version: 1, activeId, profiles };
}
