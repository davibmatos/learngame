import { DECORATIONS, LESSONS, LESSON_BY_ID, PROFILE_ICONS, SKILL_NAMES, WORLDS, } from './content.js';
import { STORAGE_KEY, activeProfile, completeActivity, createSession, currentActivity, dayKey, feed, finishSession, isUnlocked, matches, newProfile, newSave, parseSave, recommendedLesson, setStartingPoint, shuffled, type Profile, type Save, type Summary } from './engine.js';
import { hasVoice, speak, stopSpeech } from './audio.js';

type Screen = 'home' | 'map' | 'play' | 'house' | 'parents' | 'end';
let save: Save = newSave();
let screen: Screen = 'home';
let storageMessage = '';
let corruptBackup: string | null = null;
let parentAccess = false;
let feedback = '';
let houseMessage = '';
let lastSummary: Summary | null = null;
let newlyReady = false;
let audioNoticeSeen = false;
const root = document.querySelector<HTMLDivElement>('#app')!;
const modal = document.querySelector<HTMLDialogElement>('#modal')!;
const esc = (s: string | number): string => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const glyph = (s: string): string => `<span aria-hidden="true">${s}</span>`;
function icon(name: string, size = 22): string {
  const paths: Record<string, string> = {
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/>',
    heart: '<path d="M20.5 4.5c-2.5-2.5-6-1.5-8.5 1-2.5-2.5-6-3.5-8.5-1-4 4 2.5 10 8.5 15 6-5 12.5-11 8.5-15Z"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-6 5H2v6h3l6 5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    leaf: '<path d="M4 20C0 5 14 2 21 3c-1 14-6 19-17 17Z"/><path d="M4 20 15 9"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.star}</svg>`;
}
function mascot(size = '', happy = false): string {
  return `<svg class="lumi ${size}" viewBox="0 0 300 290" role="img" aria-label="Lumi, um companheiro verde sorridente">
    <ellipse cx="150" cy="262" rx="77" ry="13" fill="#658766" opacity=".16"/>
    <path d="M116 77C87 27 55 39 79 108M180 77C207 29 235 44 215 111" fill="#a2cda0" stroke="#42765a" stroke-width="3"/>
    <path d="M129 62C131 36 143 26 156 19c10 22 5 39-10 48" fill="#5e9470"/>
    <path d="M110 235c-15 9-22 23-10 28 15 6 30-1 40-12M165 249c10 13 27 18 38 10 11-7 2-18-12-25" fill="#80b989" stroke="#42765a" stroke-width="3"/>
    <path d="M75 153c-32-2-33 25-17 36l25 2M218 151c34 2 34 28 13 37l-18-4" fill="#a2cda0" stroke="#42765a" stroke-width="3"/>
    <path d="M149 65c56 0 91 52 83 108-6 50-31 82-82 82-52 0-84-26-89-76-7-62 31-114 88-114Z" fill="#acd5a3" stroke="#42765a" stroke-width="3"/>
    <ellipse cx="150" cy="199" rx="47" ry="40" fill="#dcebc1"/>
    <ellipse cx="99" cy="155" rx="13" ry="7" fill="#e8afa0"/><ellipse cx="201" cy="155" rx="13" ry="7" fill="#e8afa0"/>
    ${happy ? '<path d="M107 137q8-11 16 0m54 0q8-11 16 0" fill="none" stroke="#294736" stroke-width="5" stroke-linecap="round"/>' : '<ellipse cx="117" cy="137" rx="6" ry="9" fill="#294736"/><ellipse cx="183" cy="137" rx="6" ry="9" fill="#294736"/><circle cx="119" cy="134" r="2" fill="#fff"/><circle cx="185" cy="134" r="2" fill="#fff"/>'}
    <path d="M137 158q13 14 26 0" fill="none" stroke="#294736" stroke-width="4" stroke-linecap="round"/>
    <path d="m150 193 4 8 9 1-6 7 1 9-8-4-8 4 1-9-6-7 9-1Z" fill="#e9bf60"/>
  </svg>`;
}
function scene(kind = 'garden'): string {
  return `<div class="scene scene-${esc(kind)}" aria-hidden="true"><div class="sun"></div><div class="cloud cloud-one"></div><div class="cloud cloud-two"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><span class="scene-flower flower-one">${kind === 'mushrooms' ? '🍄' : '🌼'}</span><span class="scene-flower flower-two">${kind === 'night' ? '✨' : '🌷'}</span><span class="scene-spark">✧</span>${mascot('scene-lumi', !!houseMessage)}<div class="scene-grass"></div></div>`;
}
function p(): Profile { return activeProfile(save); }
function persist(): void {
  if (corruptBackup !== null) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); storageMessage = ''; }
  catch { storageMessage = 'Não foi possível salvar neste navegador. O jogo continua nesta aba; faça um backup na área dos responsáveis.'; }
}
function updateProfile(profile: Profile): void {
  save = { ...save, profiles: save.profiles.map(item => item.id === profile.id ? profile : item) };
  persist();
}
function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { save = parseSave(raw); }
      catch { corruptBackup = raw; storageMessage = 'Encontramos um progresso que não conseguimos ler. Ele foi preservado. Abra a área dos responsáveis para recuperar ou iniciar de novo.'; }
    }
  } catch { storageMessage = 'O armazenamento está indisponível. O progresso ficará apenas nesta aba.'; }
}
function go(next: Screen): void {
  stopSpeech(); feedback = ''; screen = next;
  if (next !== 'parents') parentAccess = false;
  render(true);
}
function button(action: string, text: string, variant = 'primary', extra = ''): string {
  return `<button class="btn ${variant}" data-action="${action}" ${extra}>${text}</button>`;
}
function navItem(target: Screen, label: string, symbol: string): string {
  return `<button class="nav-item ${screen === target ? 'selected' : ''}" data-action="nav" data-screen="${target}" ${screen === target ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></button>`;
}
function render(focus = false): void {
  document.body.classList.toggle('calm', p().calm);
  const number = save.profiles.findIndex(profile => profile.id === p().id) + 1;
  root.innerHTML = `<a class="skip-link" href="#main">Ir para o conteúdo</a>
    <aside class="sidebar"><button class="brand" data-action="nav" data-screen="home" aria-label="Lumi, início"><span class="brand-symbol">✦</span><span>lumi<small>A ILHA DAS PALAVRAS</small></span></button>
    <div class="sidebar-caption">CADA DESCOBERTA CONTA</div><nav aria-label="Navegação principal">${navItem('home', 'Meu cantinho', 'home')}${navItem('map', 'Explorar a ilha', 'map')}${navItem('house', 'Casa do Lumi', 'heart')}</nav>
    <div class="sidebar-bottom"><div class="sidebar-note">${glyph('🌿')}<p>Sem pressa.<br>Do seu jeitinho.</p></div><button class="parent-link" data-action="parents">${icon('lock', 18)} Área dos responsáveis</button><span class="version">Protótipo · v0.1</span></div></aside>
    <div class="workspace"><header class="topbar"><span class="topbar-caption">UM MUNDO PARA DESCOBRIR</span><div class="topbar-actions"><span class="profile-pill">${glyph(esc(p().icon))}<span>Explorador ${number}</span></span><button class="round-button" data-action="sound" aria-label="${p().sound ? 'Desligar' : 'Ligar'} narração" title="${p().sound ? 'Desligar' : 'Ligar'} narração">${icon(p().sound ? 'sound' : 'muted')}</button></div></header>
    ${storageMessage ? `<div class="warning" role="alert">${esc(storageMessage)}</div>` : ''}
    <main id="main" tabindex="-1">${screen === 'home' ? home() : screen === 'map' ? mapPage() : screen === 'house' ? house() : screen === 'parents' && parentAccess ? parents() : screen === 'play' ? play() : screen === 'end' ? ending() : home()}</main>
    <footer class="page-footer"><span>Pequenos passos também levam longe.</span><button data-action="parents">Para quem cuida ${icon('heart', 14)}</button></footer></div>`;
  if (focus) root.querySelector<HTMLElement>('main h1, main h2')?.focus({ preventScroll: true });
}
function header(kicker: string, title: string, subtitle: string): string {
  return `<div class="page-heading"><p class="eyebrow">${kicker}</p><h1 tabindex="-1">${title}</h1><p>${subtitle}</p></div>`;
}
function home(): string {
  const lesson = p().pending ? LESSON_BY_ID.get(p().pending!.lessonId)! : recommendedLesson(p());
  const world = WORLDS[lesson.world]!;
  const practice = !!p().progress[lesson.id]?.runs;
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow"><span class="tiny-dot"></span> APRENDER É UMA AVENTURA</p><h1 tabindex="-1">Pequenos passos.<br><em>Grandes descobertas.</em></h1><p>Uma ilha de histórias. Um novo amigo.<br>E um mundo de palavras para explorar.</p><div class="welcome-tag">${icon('heart', 17)} No seu tempo, do seu jeitinho.</div></div><div class="hero-scene">${scene(p().decoration)}<span class="hello-bubble">Oi! Eu sou o Lumi. <span aria-hidden="true">👋</span></span></div></section>
    <section class="next-section"><div class="section-title"><div><p class="eyebrow">VAMOS DESCOBRIR?</p><h2>Seu próximo pequeno passo</h2></div><span class="soft-pill">${glyph('🌱')} Uma aventura curtinha</span></div>
    <div class="next-card"><div class="next-icon">${glyph(world.icon)}</div><div class="next-copy"><p>${esc(world.name)} <span>·</span> ${p().pending ? 'Continuar de onde parou' : practice ? 'Vamos praticar um pouquinho' : 'Uma nova descoberta'}</p><h3>${esc(lesson.title)}</h3><span>${esc(lesson.subtitle)}</span></div>${button('start', `${p().pending ? 'Continuar' : 'Vamos brincar'} ${icon('arrow')}`, 'primary', `data-lesson="${lesson.id}"`)}</div></section>
    <section class="places"><div class="section-title"><div><p class="eyebrow">UM LUGAR PARA CADA DESCOBERTA</p><h2>Conheça a nossa ilha</h2></div><button class="text-link" data-action="nav" data-screen="map">Ver a ilha toda ${icon('arrow', 18)}</button></div><div class="world-grid home-worlds">${WORLDS.slice(0, 3).map(w => worldCard(w.id)).join('')}</div></section>
    <section class="gentle-note">${glyph('💛')}<p>Aqui, o Lumi fica feliz de encontrar você.<br><strong>Mesmo depois de muitos dias longe.</strong></p><span class="handdrawn">um abraço em forma de jogo</span></section>`;
}
function worldCard(worldId: number): string {
  const w = WORLDS[worldId]!; const local = LESSONS.filter(l => l.world === worldId);
  const done = local.filter(l => p().progress[l.id]?.ready).length;
  const available = local.some(l => isUnlocked(p(), l.id));
  return `<button class="world-card ${w.color}" data-action="world" data-world="${worldId}"><div class="world-art"><span class="art-orbit"></span><span class="world-emoji" aria-hidden="true">${w.icon}</span><span class="art-star">✧</span><span class="world-label">${available ? 'UM LUGAR PARA EXPLORAR' : 'UM NOVO LUGAR MAIS ADIANTE'}</span></div><div class="world-info"><div><h3>${esc(w.name)}</h3><p>${esc(w.subtitle)}</p></div><span class="world-arrow">${icon(available ? 'arrow' : 'lock', 19)}</span><div class="mini-track"><span style="width:${Math.round(done / local.length * 100)}%"></span></div><small>${done ? `${done} de ${local.length} fases exploradas` : `${local.length} pequenas fases`}</small></div></button>`;
}
function mapPage(): string {
  return `${header('O MAPA DAS DESCOBERTAS', 'Uma ilha inteira pela frente.', 'Letras, palavras e histórias se encontram pelo caminho. Cada criança tem seu ritmo.')}<div class="map-intro">${icon('map')}<p>A trilha intercala letras e palavras. Você não precisa conhecer o alfabeto inteiro para começar a ler.</p></div><div class="world-grid">${WORLDS.map(w => worldCard(w.id)).join('')}</div><p class="small-print">As fases praticadas continuam disponíveis. Na área dos responsáveis, é possível ajustar o ponto de partida.</p>`;
}
function openWorld(worldId: number): void {
  const w = WORLDS[worldId]; if (!w) return;
  modal.innerHTML = `<div class="modal-heading"><span class="modal-emoji">${w.icon}</span><button class="round-button" data-action="close" aria-label="Fechar">${icon('close')}</button></div><h2>${esc(w.name)}</h2><p>${esc(w.subtitle)}</p><div class="lesson-list">${LESSONS.filter(l => l.world === worldId).map(l => {
    const ready = p().progress[l.id]?.ready; const unlocked = isUnlocked(p(), l.id); const runs = p().progress[l.id]?.runs ?? 0;
    return `<button data-action="start" data-lesson="${l.id}" ${!unlocked ? 'disabled' : ''}><span class="lesson-number">${ready ? icon('check', 18) : unlocked ? LESSONS.indexOf(l) + 1 : icon('lock', 17)}</span><span><strong>${esc(l.title)}</strong><small>${ready ? 'Pode revisitar' : runs ? 'Vamos praticar mais um pouquinho' : unlocked ? 'Disponível para descobrir' : 'Um passo de cada vez'}</small></span>${unlocked ? icon('arrow', 18) : ''}</button>`;
  }).join('')}</div><p class="small-print">O número indica a posição na trilha. Ela visita diferentes lugares para combinar letras, montagem e leitura.</p>`;
  modal.showModal();
}
function begin(id: string): void {
  if (corruptBackup !== null) { openParents(); return; }
  if (modal.open) modal.close();
  const next = createSession(p(), id); updateProfile({ ...p(), pending: next });
  screen = 'play'; parentAccess = false; feedback = ''; render(true);
  if (!hasVoice() && !audioNoticeSeen) {
    audioNoticeSeen = true;
    modal.innerHTML = `<span class="modal-emoji">🤝</span><h2>Vamos com um adulto?</h2><p>Este navegador não disponibilizou uma voz local em português. Um responsável pode ler as instruções em “Texto para acompanhar”.</p><p>Nas atividades de leitura, deixe a criança tentar ler o cartão. Use “Uma ajudinha” quando necessário.</p>${button('close', 'Combinado!')}`;
    modal.showModal();
  } else narrate();
}
function narrate(): void {
  const session = p().pending; if (!session) return;
  if (!session.demoSeen) { speak(LESSON_BY_ID.get(session.lessonId)!.narration, p().sound); return; }
  const a = currentActivity(session); if (!a) return;
  // Nunca lê o cartão-alvo automaticamente em uma atividade de leitura.
  speak(`${a.instruction}${a.stimulus ? ` ${a.stimulus}.` : ''}`, p().sound);
}
function play(): string {
  const session = p().pending;
  if (!session) return home();
  const lesson = LESSON_BY_ID.get(session.lessonId)!;
  if (!session.demoSeen) return `<div class="play-top">${button('pause', `${icon('back')} Voltar`, 'quiet')}<span class="soft-pill">Primeiro, vamos descobrir juntos</span></div><section class="lesson-demo"><div class="demo-mascot">${mascot('small')}</div><p class="eyebrow">LUMI MOSTRA COMO É</p><h1 tabindex="-1">${esc(lesson.title)}</h1><p>${esc(lesson.concept)}</p><div class="example-card">${esc(lesson.example)}</div><p class="small-print">Esse é um exemplo. Agora vamos experimentar.</p><div class="demo-buttons">${button('narrate', `${icon('sound')} Ouvir o Lumi`, 'secondary')}${button('demo-done', `Minha vez! ${icon('arrow')}`)}</div>${!hasVoice() ? `<details class="adult-script"><summary>Texto para acompanhar</summary><p>${esc(lesson.narration)}</p></details>` : ''}</section>`;
  const a = currentActivity(session);
  if (!a) return `<section class="lesson-demo"><h1 tabindex="-1">Sua aventura está pronta!</h1>${button('finish', 'Guardar descobertas')}</section>`;
  const solved = matchesCurrent();
  const percent = Math.round(session.results.length / session.activityIds.length * 100);
  const options = shuffled(a.options, `${session.id}:${a.id}`);
  return `<div class="play-top">${button('pause', `${icon('close')} Pausar`, 'quiet')}<div class="progress-wrap"><div class="session-track" role="progressbar" aria-label="Passos da aventura" aria-valuenow="${session.results.length}" aria-valuemin="0" aria-valuemax="${session.activityIds.length}"><span style="width:${percent}%"></span></div><span>${session.results.length + 1} de ${session.activityIds.length}</span></div><span class="soft-pill">${icon('leaf', 16)} Sem pressa</span></div>
    <section class="activity-card"><p class="eyebrow">${a.id.startsWith(session.lessonId) ? esc(lesson.title) : 'REVISITANDO UMA DESCOBERTA'}</p><h1 tabindex="-1">${esc(a.prompt)}</h1><div class="instruction-row">${button('narrate', `${icon('sound')} Ouvir`, 'listen')}<details class="adult-script"><summary>Texto para acompanhar</summary><p>${esc(a.instruction)} ${a.stimulus ? esc(a.stimulus) : ''}</p></details></div>
    ${a.picture ? `<div class="picture-stimulus" aria-hidden="true">${a.picture}</div>` : ''}${a.text ? `<div class="reading-card ${a.text.length > 45 ? 'story-card' : a.text.length > 8 ? 'sentence-card' : ''}" aria-label="Texto para ler">${esc(a.text).replaceAll('\n', '<br>')}</div>` : ''}
    ${a.kind === 'build' ? `<div class="word-slots" aria-label="Sua montagem">${a.answer.map((_, i) => {
      const id = session.picked[i]; const part = a.options.find(o => o.id === id);
      return part ? `<button class="word-slot filled" data-action="remove-piece" data-id="${esc(id!)}" ${solved ? 'disabled' : ''} aria-label="Retirar ${esc(part.label)}">${esc(part.label)}</button>` : '<span class="word-slot" aria-hidden="true">·</span>';
    }).join('')}</div>` : ''}
    <div class="choices ${a.kind === 'build' ? 'piece-choices' : ''} ${options.length === 1 ? 'single-choice' : ''}">${options.map(o => {
      const selected = session.picked.includes(o.id); const disabled = solved || (a.kind === 'build' && selected);
      return `<button class="choice ${o.icon ? 'picture-choice' : 'text-choice'} ${selected ? 'picked' : ''} ${selected && solved ? 'correct-choice' : ''}" data-action="${a.kind === 'build' ? 'piece' : 'answer'}" data-id="${esc(o.id)}" aria-label="${esc(o.label)}" ${disabled ? 'disabled' : ''}>${o.icon ? `<span class="choice-emoji" aria-hidden="true">${o.icon}</span><span class="${a.skill === 'sentences' || a.skill === 'stories' ? 'choice-caption' : 'sr-only'}">${esc(o.label)}</span>` : esc(o.label)}</button>`;
    }).join('')}</div>
    ${a.kind === 'build' && !solved ? `<div class="build-actions">${button('clear-pieces', 'Recomeçar montagem', 'quiet')}${button('check-build', `Conferir ${icon('check')}`, 'primary', session.picked.length !== a.answer.length ? 'disabled' : '')}</div>` : ''}
    <div class="feedback ${solved ? 'feedback-success' : ''}" role="status" tabindex="-1">${solved ? `${icon('check')} <span>Você encontrou! ${esc(a.explanation)}</span>` : feedback ? `<span>${esc(feedback)}</span>` : '<span>Cada tentativa é uma descoberta.</span>'}</div>
    <div class="activity-bottom">${button('help', `${glyph('💡')} Uma ajudinha`, 'quiet', solved ? 'disabled' : '')}${solved ? button('next', `${session.results.length + 1 === session.activityIds.length ? 'Guardar descobertas' : 'Próximo passo'} ${icon('arrow')}`) : `<span class="small-print">O Lumi está aqui com você.</span>`}</div></section>`;
}
function matchesCurrent(): boolean {
  const session = p().pending;
  return !!session?.solved;
}
function answer(id?: string): void {
  const session = p().pending; if (!session || matchesCurrent()) return;
  const a = currentActivity(session); if (!a) return;
  if (id && !a.options.some(o => o.id === id)) return;
  const picked = id ? [id] : session.picked;
  const next = { ...session, tries: session.tries + 1, picked, solved: matches(a, picked) };
  updateProfile({ ...p(), pending: next });
  if (!matchesCurrent()) {
    feedback = next.tries >= 2 ? a.hint : 'Vamos olhar com calma e tentar de outro jeito?';
    if (next.tries >= 2) updateProfile({ ...p(), pending: { ...next, helped: true } });
    speak(feedback, p().sound);
  } else { feedback = ''; speak('Você encontrou!', p().sound); }
  render(); root.querySelector<HTMLElement>('.feedback')?.focus({ preventScroll: true });
}
function finish(): void {
  const session = p().pending; if (!session) return;
  const result = finishSession(p(), session);
  lastSummary = result.summary; newlyReady = result.newlyReady;
  updateProfile(result.profile); go('end'); speak('Que bom descobrir com você! Nossa aventura terminou.', p().sound);
}
function ending(): string {
  return `<section class="end-card"><div class="end-stars" aria-hidden="true">✧　✦　✧</div>${mascot('end-lumi', true)}<p class="eyebrow">UM PEQUENO PASSO. UMA GRANDE DESCOBERTA.</p><h1 tabindex="-1">Foi bom brincar com você!</h1><p>Nossa aventura terminou.<br>Agora vamos guardar tudo o que descobrimos?</p>${lastSummary?.seed ? '<div class="reward-chip">🌱 Você ganhou uma sementinha para o Lumi.</div>' : '<div class="reward-chip">💛 Suas descobertas ficaram guardadas.</div>'}${newlyReady ? '<p class="new-path">Um novo caminho da ilha está disponível.</p>' : ''}<div class="end-buttons">${button('nav', `Visitar o Lumi ${icon('heart')}`, 'primary', 'data-screen="house"')}${button('nav', 'Guardar e sair', 'secondary', 'data-screen="home"')}</div><p class="small-print">Fora da tela também tem aventura: que tal procurar uma palavra em um livro com alguém?</p></section>`;
}
function house(): string {
  return `${header('SEU COMPANHEIRO DE AVENTURAS', 'Um cantinho para o Lumi.', 'Ele adora sua companhia. E está sempre bem, mesmo quando você não vem brincar.')}<div class="house-layout"><div class="house-scene">${scene(p().decoration)}<span class="house-bubble">${esc(houseMessage || 'Que bom ter você por aqui!')}</span></div><section class="care-card"><span class="care-icon">🌱</span><h2>Pequenos gestos de carinho</h2><p>As sementinhas viram lanchinhos de faz de conta. O Lumi nunca passa fome.</p><div class="seed-count"><strong>${p().seeds}</strong> sementinha${p().seeds === 1 ? '' : 's'} guardada${p().seeds === 1 ? '' : 's'}</div>${button('feed', 'Dar um lanchinho 🌱', 'primary', p().seeds ? '' : 'disabled')}${button('hug', `Dar um abraço ${icon('heart', 18)}`, 'secondary')}<p class="small-print">Abraços são sempre de graça.</p></section></div><section class="decor-section"><div class="section-title"><div><p class="eyebrow">UM CANTINHO DO SEU JEITO</p><h2>Pequenas decorações</h2></div></div><div class="decor-grid">${DECORATIONS.map(d => `<button class="decor-card ${p().decoration === d.id ? 'chosen' : ''}" data-action="decorate" data-id="${d.id}" ${p().feeds < d.feeds ? 'disabled' : ''} aria-pressed="${p().decoration === d.id}"><span>${d.icon}</span><strong>${d.name}</strong><small>${p().feeds < d.feeds ? `Depois de ${d.feeds} lanchinhos` : p().decoration === d.id ? 'No nosso cantinho' : 'Escolher'}</small></button>`).join('')}</div></section>`;
}
function openParents(): void {
  if (modal.open) modal.close();
  modal.innerHTML = `<span class="modal-emoji">🌿</span><h2>Área dos responsáveis</h2><p>Uma pequena confirmação para evitar mudanças sem querer.</p><form id="parent-form"><label for="parent-answer">Quanto é 8 + 7?</label><input id="parent-answer" name="answer" inputmode="numeric" autocomplete="off" required aria-describedby="parent-error"><p id="parent-error" role="alert"></p><div class="modal-actions">${button('close', 'Voltar', 'secondary', 'type="button"')}<button type="submit" class="btn primary">Entrar</button></div></form><p class="small-print">Esta confirmação não é uma senha nem protege dados em um dispositivo compartilhado.</p>`;
  modal.showModal();
}
function parents(): string {
  const profile = p(); const histories = profile.history;
  const total = histories.reduce((sum, h) => sum + h.total, 0);
  const independent = histories.reduce((sum, h) => sum + h.independent, 0);
  return `${header('ACOMPANHAR SEM COMPARAR', 'Cada criança, um caminho.', 'O jogo registra tentativas e apoios. Não emite diagnósticos nem certifica alfabetização.')}<div class="parent-notice"><strong>Conteúdo experimental</strong><p>Esta é uma trilha inicial de ${LESSONS.length} fases, não um curso completo validado. Antes de ampliar o uso, precisamos revisar a sequência, os áudios e as atividades com um professor alfabetizador. O jogo complementa livros, escrita e mediação adulta.</p></div>
    ${corruptBackup !== null ? `<section class="settings-card recovery"><h2>Recuperar o progresso preservado</h2><p>Nada foi sobrescrito. Baixe o arquivo original antes de iniciar um progresso novo.</p>${button('export-corrupt', 'Salvar arquivo original', 'secondary')}${button('new-after-corrupt', 'Iniciar de novo', 'danger')}</section>` : ''}
    <section class="settings-card"><h2>Quem está explorando?</h2><p>Até quatro perfis locais, sem nome, foto, e-mail ou data de nascimento.</p><div class="profile-list">${save.profiles.map((item, index) => `<button class="profile-choice ${item.id === profile.id ? 'chosen' : ''}" data-action="profile" data-id="${esc(item.id)}" aria-pressed="${item.id === profile.id}"><span>${item.icon}</span>Explorador ${index + 1}</button>`).join('')}${save.profiles.length < 4 ? button('add-profile', '+ Novo perfil', 'secondary') : ''}</div></section>
    <div class="parent-stats"><div><span>Aventuras registradas</span><strong>${histories.length}</strong></div><div><span>Atividades registradas</span><strong>${total}</strong></div><div><span>Sem ajuda, na primeira tentativa</span><strong>${total ? Math.round(independent / total * 100) : 0}%</strong></div></div><p class="small-print">Resumo das últimas 200 aventuras, misturando habilidades diferentes. Não representa “porcentagem de alfabetização”.</p>
    <div class="settings-grid"><section class="settings-card"><h2>Um começo confortável</h2><label for="starting-point">Ponto de partida</label><select id="starting-point">${LESSONS.map((l, i) => `<option value="${i}" ${i === profile.startAt ? 'selected' : ''}>${i + 1}. ${esc(l.title)}</option>`).join('')}</select><p class="small-print">Ajustar o início não marca etapas anteriores como aprendidas. Uma aventura em andamento será encerrada sem recompensa.</p>${button('apply-start', 'Salvar ponto de partida', 'secondary')}<label class="toggle-row"><input type="checkbox" id="calm-setting" ${profile.calm ? 'checked' : ''}><span>Modo tranquilo, com menos movimento</span></label><label class="toggle-row"><input type="checkbox" id="sound-setting" ${profile.sound ? 'checked' : ''}><span>Narração com voz local do dispositivo</span></label><p class="small-print">${hasVoice() ? 'Há uma voz local em português disponível. A pronúncia ainda precisa ser conferida no aparelho.' : 'Nenhuma voz local em português disponível. Use acompanhado de um adulto ou instale uma voz nas configurações do sistema.'} Sons isolados de letras não são sintetizados como se fossem fonemas revisados.</p></section>
    <section class="settings-card"><h2>Progresso e privacidade</h2><p>Os dados ficam neste navegador. Limpar os dados do site remove o progresso. Não há sincronização, anúncios, rastreadores, microfone nem conta online.</p><div class="backup-actions">${button('export', 'Baixar backup do progresso', 'secondary')}<label class="btn secondary file-label" for="import-save">Restaurar backup<input type="file" id="import-save" accept="application/json,.json"></label></div><p class="small-print">A restauração substitui todos os perfis após confirmação. Guarde o backup em local seguro.</p><h3>Instalar no dispositivo</h3><p class="small-print">Em um endereço HTTPS, use o menu do navegador para instalar ou adicionar à tela inicial. O funcionamento offline fica disponível após o primeiro carregamento completo; a voz depende do sistema.</p>${button('reset-profile', 'Apagar progresso deste perfil', 'danger')}</section></div>
    <section class="settings-card"><h2>Descobertas por fase</h2><p>Os critérios de avanço são provisórios e configurados no motor do jogo. Ajuda e tentativas adicionais não contam como acerto independente.</p><div class="progress-table"><table><thead><tr><th>Fase e habilidade</th><th>Aventuras</th><th>Observação</th></tr></thead><tbody>${LESSONS.map((l, i) => {
      const entry = profile.progress[l.id];
      return `<tr><td><strong>${i + 1}. ${esc(l.title)}</strong><small>${SKILL_NAMES[l.skill]}</small></td><td>${entry?.runs ?? '—'}</td><td><span class="status-badge ${entry?.ready ? 'ready' : ''}">${entry?.ready ? 'Pronta para avançar no jogo' : entry?.runs ? 'Em prática' : i < profile.startAt ? 'Anterior ao ponto de partida' : 'Ainda não praticada'}</span></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}
function download(name: string, data: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLButtonElement>('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action; const id = target.dataset.id ?? '';
  try {
    switch (action) {
      case 'nav': { const to = target.dataset.screen as Screen; if (['home', 'map', 'house'].includes(to)) go(to); break; }
      case 'sound': updateProfile({ ...p(), sound: !p().sound }); stopSpeech(); render(); break;
      case 'parents': openParents(); break;
      case 'close': modal.close(); break;
      case 'world': openWorld(Number(target.dataset.world)); break;
      case 'start': begin(target.dataset.lesson ?? recommendedLesson(p()).id); break;
      case 'narrate': narrate(); break;
      case 'demo-done': if (p().pending) { updateProfile({ ...p(), pending: { ...p().pending!, demoSeen: true } }); render(true); narrate(); } break;
      case 'pause': go('home'); break;
      case 'answer': answer(id); break;
      case 'check-build': answer(); break;
      case 'piece': {
        const session = p().pending; const a = session && currentActivity(session);
        if (session && a?.kind === 'build' && !matchesCurrent() && a.options.some(o => o.id === id) && !session.picked.includes(id) && session.picked.length < a.answer.length) {
          updateProfile({ ...p(), pending: { ...session, picked: [...session.picked, id] } }); feedback = ''; render();
        }
        break;
      }
      case 'remove-piece': case 'clear-pieces': {
        const session = p().pending; if (session && !matchesCurrent()) {
          updateProfile({ ...p(), pending: { ...session, picked: action === 'clear-pieces' ? [] : session.picked.filter(item => item !== id) } }); feedback = ''; render();
        }
        break;
      }
      case 'help': {
        const session = p().pending; const a = session && currentActivity(session);
        if (session && a && !matchesCurrent()) {
          updateProfile({ ...p(), pending: { ...session, helped: true } }); feedback = a.hint; speak(a.hint, p().sound); render(); root.querySelector<HTMLElement>('.feedback')?.focus({ preventScroll: true });
        }
        break;
      }
      case 'next': {
        if (p().pending && matchesCurrent()) {
          updateProfile({ ...p(), pending: completeActivity(p().pending!, true) }); feedback = '';
          if (!currentActivity(p().pending!)) finish(); else { render(true); narrate(); }
        }
        break;
      }
      case 'finish': finish(); break;
      case 'feed': if (p().seeds > 0) { updateProfile(feed(p())); houseMessage = 'Nhac! Um lanchinho de carinho. 💛'; render(); speak('Obrigada pelo carinho!', p().sound); } break;
      case 'hug': houseMessage = 'Um abraço bem quentinho para você! 💛'; render(); speak('Um abraço bem quentinho para você!', p().sound); break;
      case 'decorate': if (DECORATIONS.some(d => d.id === id && d.feeds <= p().feeds)) { updateProfile({ ...p(), decoration: id }); houseMessage = ''; render(); } break;
      case 'profile': if (parentAccess && save.profiles.some(item => item.id === id)) { save.activeId = id; persist(); render(); } break;
      case 'add-profile': if (parentAccess && save.profiles.length < 4) {
        const profile = newProfile(PROFILE_ICONS[save.profiles.length]!); save.profiles.push(profile); save.activeId = profile.id; persist(); render();
      } break;
      case 'apply-start': if (parentAccess) {
        const select = document.querySelector<HTMLSelectElement>('#starting-point')!;
        if (!p().pending || confirm('Isso vai encerrar a aventura em andamento, sem alterar as descobertas já salvas. Continuar?')) {
          updateProfile(setStartingPoint(p(), Number(select.value))); render();
        }
      } break;
      case 'export': if (parentAccess) download(`lumi-progresso-${dayKey()}.json`, JSON.stringify(save, null, 2)); break;
      case 'export-corrupt': if (parentAccess && corruptBackup !== null) download('lumi-progresso-preservado.json', corruptBackup); break;
      case 'new-after-corrupt': if (parentAccess && confirm('Você já guardou o arquivo original? Iniciar um progresso novo substituirá o arquivo preservado neste navegador.')) { corruptBackup = null; save = newSave(); persist(); render(); } break;
      case 'reset-profile': if (parentAccess && confirm('Apagar apenas o progresso do perfil ativo? Esta ação não pode ser desfeita sem um backup.')) {
        const replacement = newProfile(p().icon); replacement.id = p().id; updateProfile(replacement); render();
      } break;
    }
  } catch (error) { console.error(error); alert('Não conseguimos concluir essa ação. Seu progresso anterior foi mantido.'); }
});
document.addEventListener('submit', event => {
  if ((event.target as HTMLFormElement).id !== 'parent-form') return;
  event.preventDefault(); const input = document.querySelector<HTMLInputElement>('#parent-answer')!;
  if (input.value.trim() === '15') { modal.close(); parentAccess = true; screen = 'parents'; stopSpeech(); render(true); }
  else { document.querySelector('#parent-error')!.textContent = 'Vamos tentar de novo?'; input.focus(); }
});
document.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement; if (!parentAccess) return;
  if (input.id === 'calm-setting') { updateProfile({ ...p(), calm: input.checked }); render(); }
  if (input.id === 'sound-setting') { updateProfile({ ...p(), sound: input.checked }); stopSpeech(); render(); }
  if (input.id === 'import-save') {
    const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('Arquivo grande demais.');
      const imported = parseSave(await file.text());
      if (confirm('Substituir TODOS os perfis deste navegador pelos perfis do backup?')) { save = imported; corruptBackup = null; persist(); render(); }
    } catch { alert('Backup inválido ou incompatível. Nenhum progresso foi alterado.'); }
    input.value = '';
  }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return;
  if (event.newValue) {
    try { save = parseSave(event.newValue); stopSpeech(); screen = 'home'; parentAccess = false; storageMessage = 'O progresso foi atualizado em outra aba. Continue pelo botão da aventura.'; if (modal.open) modal.close(); render(); } catch { /* Mantém o progresso válido desta aba. */ }
  }
});
window.addEventListener('pagehide', stopSpeech);
load(); render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {
  // O jogo continua online; service workers exigem HTTPS ou localhost.
});
