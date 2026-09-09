export type Skill = 'interaction' | 'listening' | 'sounds' | 'letters' | 'syllables' | 'words' | 'sentences' | 'stories';
export type Choice = { id: string; label: string; icon?: string };
export type Activity = {
  id: string;
  kind: 'choice' | 'build';
  skill: Skill;
  prompt: string;
  instruction: string;
  stimulus?: string;
  picture?: string;
  text?: string;
  reading: boolean;
  options: Choice[];
  answer: string[];
  hint: string;
  explanation: string;
};
export type Lesson = {
  id: string;
  world: number;
  title: string;
  subtitle: string;
  concept: string;
  example: string;
  narration: string;
  skill: Skill;
  activities: Activity[];
};
export type World = { id: number; name: string; subtitle: string; icon: string; color: string };
export const WORLDS: World[] = [
  { id: 0, name: 'Jardim dos começos', subtitle: 'Escutar, descobrir e brincar', icon: '🌱', color: 'mint' },
  { id: 1, name: 'Bosque das letras', subtitle: 'Cada letra, uma descoberta', icon: '🌳', color: 'green' },
  { id: 2, name: 'Ponte dos pedacinhos', subtitle: 'Juntar para ler', icon: '🌉', color: 'peach' },
  { id: 3, name: 'Vila das palavras', subtitle: 'Palavras ganham sentido', icon: '🏡', color: 'purple' },
  { id: 4, name: 'Praia das frases', subtitle: 'Uma ideia de cada vez', icon: '⛵', color: 'blue' },
  { id: 5, name: 'Ilha das histórias', subtitle: 'Ler para descobrir', icon: '📖', color: 'pink' },
];
export const SKILL_NAMES: Record<Skill, string> = {
  interaction: 'Interação com o jogo', listening: 'Escuta e vocabulário', sounds: 'Partes sonoras das palavras',
  letters: 'Reconhecimento de letras', syllables: 'Combinação de sílabas', words: 'Leitura de palavras',
  sentences: 'Compreensão de frases', stories: 'Compreensão de pequenos textos',
};
export const PROFILE_ICONS = ['⭐', '🌙', '🌈', '🍀'] as const;
export const DECORATIONS = [
  { id: 'garden', name: 'Jardim', icon: '🌼', feeds: 0 },
  { id: 'flowers', name: 'Flores', icon: '🌷', feeds: 2 },
  { id: 'mushrooms', name: 'Cogumelos', icon: '🍄', feeds: 4 },
  { id: 'night', name: 'Estrelinhas', icon: '✨', feeds: 7 },
];

type Word = { word: string; icon: string; parts: string[] };
const word = (value: string, icon: string, parts: string): Word => ({ word: value, icon, parts: parts.split('-') });
const WORDS = [
  word('MALA', '🧳', 'MA-LA'), word('LUPA', '🔎', 'LU-PA'), word('PIPA', '🪁', 'PI-PA'),
  word('MAPA', '🗺️', 'MA-PA'), word('LUA', '🌙', 'LU-A'), word('LAMA', '🟫', 'LA-MA'),
  word('BOLA', '⚽', 'BO-LA'), word('BOTA', '🥾', 'BO-TA'), word('PATO', '🦆', 'PA-TO'),
  word('DADO', '🎲', 'DA-DO'), word('DEDO', '☝️', 'DE-DO'), word('BALA', '🍬', 'BA-LA'),
  word('SAPO', '🐸', 'SA-PO'), word('FADA', '🧚', 'FA-DA'), word('VACA', '🐄', 'VA-CA'),
  word('FOCA', '🦭', 'FO-CA'), word('FITA', '🎀', 'FI-TA'), word('SOPA', '🥣', 'SO-PA'),
  word('GATO', '🐈', 'GA-TO'), word('CASA', '🏠', 'CA-SA'), word('RATO', '🐀', 'RA-TO'),
  word('RODA', '🛞', 'RO-DA'), word('COCO', '🥥', 'CO-CO'), word('GALO', '🐓', 'GA-LO'),
  word('NAVE', '🚀', 'NA-VE'), word('NOVE', '9️⃣', 'NO-VE'), word('JOGO', '🎮', 'JO-GO'),
  word('JUBA', '🦁', 'JU-BA'), word('ZEBRA', '🦓', 'ZE-BRA'), word('ZERO', '0️⃣', 'ZE-RO'),
  word('CHAVE', '🔑', 'CHA-VE'), word('CHUVA', '🌧️', 'CHU-VA'), word('FOLHA', '🍃', 'FO-LHA'),
  word('MILHO', '🌽', 'MI-LHO'), word('NINHO', '🪺', 'NI-NHO'), word('BANHO', '🛁', 'BA-NHO'),
  word('PRATO', '🍽️', 'PRA-TO'), word('TREM', '🚂', 'TREM'), word('FLOR', '🌸', 'FLOR'),
  word('LIVRO', '📕', 'LI-VRO'), word('PÃO', '🍞', 'PÃO'), word('MÃO', '✋', 'MÃO'),
];
const getWord = (value: string): Word => {
  const item = WORDS.find(w => w.word === value);
  if (!item) throw new Error(`Palavra não cadastrada: ${value}`);
  return item;
};
function choice(id: string, skill: Skill, prompt: string, instruction: string, options: Choice[], answer: string, hint: string, extra: Partial<Activity> = {}): Activity {
  return { id, kind: 'choice', skill, prompt, instruction, reading: false, options, answer: [answer], hint,
    explanation: hint, ...extra };
}
const pic = (id: string, icon: string, label: string): Choice => ({ id, icon, label });
const txt = (label: string): Choice => ({ id: label, label });
const lessons: Lesson[] = [];
function add(world: number, title: string, subtitle: string, concept: string, example: string, narration: string, skill: Skill, activities: Activity[]): void {
  const id = `fase-${String(lessons.length + 1).padStart(2, '0')}`;
  lessons.push({ id, world, title, subtitle, concept, example, narration, skill,
    activities: activities.map((a, i) => ({ ...a, id: `${id}-a${i + 1}` })) });
}

// Primeiro contato: um alvo grande e uma ação, antes de introduzir escolhas.
add(0, 'Olá, Lumi!', 'Um toque já é uma descoberta.', 'Você pode tocar para brincar. Não precisa saber ler.',
  '👆  →  ⭐', 'Oi! Eu sou Lumi. Vamos brincar? Quando aparecer uma figura, toque nela.', 'interaction',
  [['⭐', 'estrela'], ['🌼', 'flor'], ['🌙', 'lua'], ['🎈', 'balão']].map(([icon, label]) =>
    choice('', 'interaction', 'Vamos tocar?', `Toque na figura: ${label}.`, [pic('alvo', icon!, label!)], 'alvo', 'Toque na única figura da tela.')));
add(0, 'Encontre o par', 'Duas figuras, uma de cada vez.', 'Olhe a figura de cima. Encontre outra igual.',
  '⭐  →  ⭐', 'Veja a estrela. Vamos encontrar uma figura igual a ela.', 'interaction',
  [['⭐', 'estrela', '🌙', 'lua'], ['🌼', 'flor', '⚽', 'bola'], ['🐈', 'gato', '🦆', 'pato'],
    ['🎈', 'balão', '🧳', 'mala'], ['🍎', 'maçã', '🚗', 'carro'], ['🦋', 'borboleta', '🌳', 'árvore']].map(([a, an, b, bn]) =>
    choice('', 'interaction', 'Qual é igual?', 'Toque na figura igual à de cima.', [pic('igual', a!, an!), pic('outra', b!, bn!)], 'igual', `Procure outra figura de ${an}.`, { picture: a })));
add(0, 'Escute e encontre', 'Uma palavra e duas figuras.', 'As palavras que falamos têm significado. Escute e encontre a figura.',
  '🔊  →  ⚽', 'Eu falo bola. Você encontra a figura da bola. Vamos escutar outras palavras?', 'listening',
  [['bola', '⚽', 'lua', '🌙'], ['gato', '🐈', 'pato', '🦆'], ['flor', '🌼', 'mala', '🧳'],
    ['pipa', '🪁', 'bola', '⚽'], ['uva', '🍇', 'casa', '🏠'], ['sol', '☀️', 'gato', '🐈']].map(([name, icon, other, oi]) =>
    choice('', 'listening', 'Escute. O que é?', 'Ouça a palavra e toque na figura.', [pic('alvo', icon!, name!), pic('outro', oi!, other!)], 'alvo', `A palavra é ${name}. Procure a figura de ${name}.`, { stimulus: name })));
add(0, 'O começo das palavras', 'Escute o primeiro pedacinho.', 'Podemos comparar o começo das palavras, sem olhar a escrita.',
  'MA-LA  ·  MA-PA', 'Mala e mapa começam com o mesmo pedacinho: ma. Ouça as palavras inteiras.', 'sounds',
  [
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como mala? Mapa ou sapo?', [pic('mapa', '🗺️', 'mapa'), pic('sapo', '🐸', 'sapo')], 'mapa', 'Mala e mapa começam com ma.'),
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como pato? Panela ou bola?', [pic('panela', '🍲', 'panela'), pic('bola', '⚽', 'bola')], 'panela', 'Pato e panela começam com pa.'),
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como bola? Bota ou vaca?', [pic('bota', '🥾', 'bota'), pic('vaca', '🐄', 'vaca')], 'bota', 'Bola e bota começam com bo.'),
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como sapo? Sacola ou gato?', [pic('sacola', '🛍️', 'sacola'), pic('gato', '🐈', 'gato')], 'sacola', 'Sapo e sacola começam com sa.'),
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como foca? Folha ou mala?', [pic('folha', '🍃', 'folha'), pic('mala', '🧳', 'mala')], 'folha', 'Foca e folha começam com fo.'),
    choice('', 'sounds', 'Qual começa parecido?', 'Qual palavra começa como casa? Capa ou dedo?', [pic('capa', '🦸', 'capa'), pic('dedo', '☝️', 'dedo')], 'capa', 'Casa e capa começam com ca.'),
  ]);
add(0, 'Palavras que combinam', 'Uma brincadeira com rimas.', 'Algumas palavras têm finais sonoros parecidos. Isso se chama rima.',
  '🐈  GATO  ·  PATO  🦆', 'Gato e pato rimam. Escute: gato, pato. Agora vamos brincar com outros pares.', 'sounds',
  [['mala', 'bala', '🍬', 'sapo', '🐸'], ['mão', 'pão', '🍞', 'fita', '🎀'], ['pato', 'gato', '🐈', 'lua', '🌙'],
    ['bola', 'cola', '🧴', 'vaca', '🐄'], ['foca', 'pipoca', '🍿', 'mala', '🧳'], ['pé', 'café', '☕', 'bola', '⚽']].map(([ref, right, ri, wrong, wi]) =>
    choice('', 'sounds', 'Qual palavra rima?', `O que rima com ${ref}? ${right} ou ${wrong}?`, [pic('rima', ri!, right!), pic('outra', wi!, wrong!)], 'rima', `${ref} e ${right} têm finais sonoros parecidos.`)));

function letters(title: string, items: [string, string, string][], example: string, note = ''): void {
  add(1, title, 'Letras em palavras conhecidas.', `Vamos reconhecer letras e observar como aparecem nas palavras. ${note}`,
    example, `Vamos conhecer estas letras: ${items.map(i => i[1]).join(', ')}. ${note}`, 'letters',
    items.flatMap(([letter, name, anchor], i) => {
      const other = items[(i + 1) % items.length]![0];
      return [
        choice('', 'letters', 'Encontre a letra', `Toque na letra ${name}.`, [txt(letter), txt(other)], letter,
          `Esta é a letra ${name}: ${letter}. Ela aparece no começo de ${anchor}.`),
        choice('', 'letters', 'Qual letra começa a palavra?', `Escute: ${anchor}. Qual é a primeira letra de ${anchor}?`, [txt(letter), txt(other)], letter,
          `${anchor} começa com a letra ${name}.`, { stimulus: anchor }),
      ];
    }));
}
letters('Olá, A e I!', [['A', 'á', 'ave'], ['I', 'i', 'ilha']], 'A  ·  AVE     I  ·  ILHA');
letters('Descobrindo O e U', [['O', 'ó', 'ovo'], ['U', 'u', 'uva']], 'O  ·  OVO     U  ·  UVA', 'O nome da letra não é sempre o som que ouvimos na palavra.');
letters('A turma das vogais', [['E', 'é', 'elefante'], ['A', 'á', 'ave'], ['I', 'i', 'ilha'], ['O', 'ó', 'ovo'], ['U', 'u', 'uva']], 'A   E   I   O   U', 'Uma letra pode representar sons diferentes em palavras diferentes.');
letters('M, L e P', [['M', 'eme', 'mala'], ['L', 'ele', 'lua'], ['P', 'pê', 'pipa']], 'MALA   LUA   PIPA');
letters('B, T e D', [['B', 'bê', 'bola'], ['T', 'tê', 'tatu'], ['D', 'dê', 'dado']], 'BOLA   TATU   DADO');
letters('F, V e S', [['F', 'efe', 'fada'], ['V', 'vê', 'vaca'], ['S', 'esse', 'sapo']], 'FADA   VACA   SAPO');
letters('C, G e R', [['C', 'cê', 'casa'], ['G', 'gê', 'gato'], ['R', 'erre', 'rato']], 'CASA   GATO   RATO', 'Vamos começar com o som dessas letras nestas palavras. Outros usos vêm depois.');
letters('N, J e Z', [['N', 'ene', 'nave'], ['J', 'jota', 'janela'], ['Z', 'zê', 'zebra']], 'NAVE   JANELA   ZEBRA');
letters('H, Q e X', [['H', 'agá', 'hoje'], ['Q', 'quê', 'queijo'], ['X', 'xis', 'xícara']], 'HOJE   QUEIJO   XÍCARA', 'Em hoje, o H não tem som próprio. Q aparece com U. X pode ter sons diferentes.');
add(1, 'Letras de muitos jeitos', 'Maiúsculas e minúsculas.', 'Uma mesma letra pode ter formas diferentes. Aqui vamos juntar maiúsculas e minúsculas de imprensa.',
  'A → a     M → m', 'Esta é a letra á maiúscula. Esta é a letra á minúscula. As duas representam a mesma letra.', 'letters',
  ['A', 'M', 'B', 'D', 'P', 'Q', 'F', 'N'].map((letter, i, all) =>
    choice('', 'letters', 'Encontre a mesma letra', 'Toque na letra minúscula que combina com a letra de cima.',
      [txt(letter.toLowerCase()), txt(all[(i + 1) % all.length]!.toLowerCase())], letter.toLowerCase(),
      `${letter} e ${letter.toLowerCase()} são duas formas da mesma letra.`, { text: letter })));
letters('K, W e Y também são letras', 'KWY'.split('').map((l, i) => [l, ['cá', 'dáblio', 'ípsilon'][i]!, ['kiwi', 'Wanda', 'Yuri'][i]!] as [string, string, string]), 'K  ·  W  ·  Y', 'Essas letras aparecem, por exemplo, em nomes e palavras de outras origens.');

function buildLesson(title: string, values: string[]): void {
  const sample = getWord(values[0]!);
  add(2, title, 'Toque nos pedacinhos, da esquerda para a direita.', 'Vamos juntar partes escritas para formar a palavra que ouvimos. Isso é uma atividade de montagem, não uma prova de leitura independente.',
    `${sample.parts.join(' + ')} → ${sample.word}`, `Veja: ${sample.word}. Vamos juntar seus pedacinhos na ordem.`, 'syllables',
    values.map(value => {
      const w = getWord(value);
      return { id: '', kind: 'build', skill: 'syllables', prompt: 'Vamos montar?', instruction: `Monte a palavra ${w.word}. Toque nos pedacinhos na ordem.`,
        stimulus: w.word, picture: w.icon, reading: false,
        options: w.parts.map((part, i) => ({ id: `peca-${i}`, label: part })), answer: w.parts.map((_, i) => `peca-${i}`),
        hint: `${w.word} fica assim: ${w.parts.join(' — ')}.`, explanation: `Você juntou ${w.parts.join(' e ')} e formou ${w.word}.` };
    }));
}
buildLesson('Os primeiros encontros', ['MALA', 'LUPA', 'PIPA', 'MAPA', 'LUA', 'LAMA']);
buildLesson('Novos pedacinhos', ['BOLA', 'BOTA', 'PATO', 'DADO', 'DEDO', 'BALA']);
buildLesson('Mais combinações', ['SAPO', 'FADA', 'VACA', 'FOCA', 'FITA', 'SOPA']);
buildLesson('Palavras para explorar', ['GATO', 'CASA', 'RATO', 'RODA', 'COCO', 'GALO']);

function readLesson(title: string, values: string[], note = ''): void {
  const words = values.map(getWord);
  add(3, title, 'Leia o cartão e encontre seu significado.', `A leitura ajuda a descobrir o que está escrito. ${note}`,
    `${words[0]!.word}  →  ${words[0]!.icon}`, `Veja a palavra ${words[0]!.word}. Ela representa ${words[0]!.word}. Agora você vai experimentar outras palavras.`, 'words',
    words.map((w, i) => choice('', 'words', 'O que está escrito?', 'Leia a palavra do cartão. Toque na figura que combina.',
      [w, words[(i + 1) % words.length]!, words[(i + 2) % words.length]!].map(p => pic(p.word, p.icon, p.word.toLowerCase())), w.word,
      `A palavra do cartão é ${w.word}. ${w.parts.join(' — ')}.`, { text: w.word, reading: true })));
}
readLesson('Minhas primeiras palavras', ['MALA', 'LUPA', 'PIPA', 'MAPA', 'LUA', 'LAMA']);
readLesson('A cesta de descobertas', ['BOTA', 'PATO', 'DADO', 'DEDO', 'BALA', 'BOLA']);
readLesson('Os amigos do jardim', ['SAPO', 'FADA', 'VACA', 'FOCA', 'SOPA', 'FITA']);
add(3, 'Uma letra muda tudo', 'Olhe cada pedacinho da escrita.', 'Palavras parecidas podem ter significados diferentes. Vamos observar todas as letras, não só a primeira.',
  'MALA  ≠  MAPA', 'Mala e mapa começam igual, mas têm uma letra diferente. Cada pedacinho importa.', 'words',
  [['MALA', 'MAPA'], ['BOLA', 'BOTA'], ['DADO', 'DEDO'], ['GATO', 'RATO'], ['NAVE', 'NOVE'], ['PATO', 'GATO']].map(([target, other]) => {
    const a = getWord(target!); const b = getWord(other!);
    return choice('', 'words', 'Qual é a palavra?', `Observe a figura. Toque na palavra ${a.word}.`, [txt(a.word), txt(b.word)], a.word,
      `A palavra é ${a.word}. Observe: ${a.parts.join(' — ')}.`, { picture: a.icon, reading: false });
  }));
readLesson('Letras que andam juntas', ['CHAVE', 'CHUVA', 'FOLHA', 'MILHO', 'NINHO', 'BANHO'], 'Em CH, LH e NH, duas letras trabalham juntas para representar um som.');
readLesson('Novos caminhos de leitura', ['PRATO', 'TREM', 'FLOR', 'LIVRO', 'PÃO', 'MÃO'], 'Há encontros de consoantes e sons nasais. Essa etapa precisa de acompanhamento e revisão pedagógica.');

type Sentence = [string, string, string, string, string, string];
function sentences(title: string, entries: Sentence[]): void {
  add(4, title, 'Leia uma ideia inteira.', 'Uma frase conta uma ideia. Leia com calma e procure o sentido, não apenas uma palavra.',
    'LUMI VIU A LUA.  🌙', 'Veja uma frase: Lumi viu a lua. Ela conta o que Lumi viu.', 'sentences',
    entries.map(([text, question, right, ri, wrong, wi]) => choice('', 'sentences', question, `Leia a frase. ${question}`,
      [pic('sim', ri, right), pic('outro', wi, wrong)], 'sim', `${text} A resposta é ${right}.`, { text, reading: true })));
}
sentences('Uma frase, uma ideia', [
  ['LUMI VIU A LUA.', 'O que Lumi viu?', 'lua', '🌙', 'bola', '⚽'], ['A MALA É DE LIA.', 'O que é de Lia?', 'mala', '🧳', 'bota', '🥾'],
  ['O PATO VIU A BOLA.', 'O que o pato viu?', 'bola', '⚽', 'flor', '🌼'], ['A FADA LEVA A PIPA.', 'O que a fada leva?', 'pipa', '🪁', 'dado', '🎲'],
  ['O GATO VIU A FOCA.', 'Quem o gato viu?', 'foca', '🦭', 'vaca', '🐄'], ['LIA PEGA A FITA.', 'O que Lia pega?', 'fita', '🎀', 'pão', '🍞'],
]);
sentences('Quem fez isso?', [
  ['O GATO VIU O PATO.', 'Quem viu o pato?', 'gato', '🐈', 'pato', '🦆'], ['O PATO VIU O GATO.', 'Quem viu o gato?', 'pato', '🦆', 'gato', '🐈'],
  ['A FADA LEVA A MALA.', 'Quem leva a mala?', 'fada', '🧚', 'vaca', '🐄'], ['A VACA VIU O SAPO.', 'Quem viu o sapo?', 'vaca', '🐄', 'sapo', '🐸'],
  ['A FOCA VIU A BOLA.', 'Quem viu a bola?', 'foca', '🦭', 'gato', '🐈'], ['O SAPO VIU A VACA.', 'Quem viu a vaca?', 'sapo', '🐸', 'vaca', '🐄'],
]);
sentences('Qual combina com a frase?', [
  ['A BOLA É AZUL.', 'Qual bola combina?', 'bola azul', '🔵', 'bola vermelha', '🔴'], ['A FLOR É VERMELHA.', 'Qual flor combina?', 'flor vermelha', '🌹', 'flor amarela', '🌻'],
  ['O GATO DORME.', 'O que o gato faz?', 'dorme', '💤', 'come', '🍽️'], ['O PATO NADA.', 'O que o pato faz?', 'nada', '🌊', 'dorme', '💤'],
  ['LIA VIU DUAS BOLAS.', 'Quantas bolas Lia viu?', 'duas', '⚽⚽', 'uma', '⚽'], ['A LUA BRILHA À NOITE.', 'Quando a lua brilha na frase?', 'à noite', '🌃', 'de dia', '☀️'],
]);

function story(title: string, text: string, entries: [string, string, string, string, string][]): void {
  add(5, title, 'Uma pequena história para descobrir.', 'Leia o texto. Você pode voltar a ele quantas vezes precisar. Ouvir a leitura é uma ajuda, e fica registrado como apoio.',
    '📖  →  💭', 'Agora vamos ler uma pequena história. Leia com calma. Depois, procure as respostas no texto.', 'stories',
    entries.map(([question, right, ri, wrong, wi]) => choice('', 'stories', question, `Leia a história. ${question}`,
      [pic('certa', ri, right), pic('outra', wi, wrong)], 'certa', `${text} A resposta é ${right}.`, { text, reading: true })));
}
story('O passeio de Lumi', 'LUMI LEVA UMA MALA.\nNA MALA HÁ UMA PIPA.\nLUMI VAI AO PARQUE.\nLÁ, A PIPA VOA.', [
  ['O que Lumi leva?', 'mala', '🧳', 'panela', '🍲'], ['O que está na mala?', 'pipa', '🪁', 'gato', '🐈'],
  ['Para onde Lumi vai?', 'parque', '🌳', 'praia', '🏖️'], ['O que voa no parque?', 'pipa', '🪁', 'mala', '🧳'],
]);
story('A semente de Lia', 'LIA PÕE UMA SEMENTE NA TERRA.\nELA REGA A TERRA COM ÁGUA.\nDEPOIS DE ALGUNS DIAS, NASCE UMA PLANTA.\nLIA CUIDA DA PLANTA.', [
  ['O que Lia põe na terra?', 'semente', '🌰', 'bola', '⚽'], ['Com o que Lia rega a terra?', 'água', '💧', 'leite', '🥛'],
  ['O que nasce depois de alguns dias?', 'planta', '🌱', 'pedra', '🪨'], ['O que Lia faz com a planta?', 'cuida dela', '🪴', 'joga no lixo', '🗑️'],
]);
story('O piquenique', 'LUMI E LIA VÃO FAZER UM PIQUENIQUE.\nLIA LEVA PÃO E UVA.\nLUMI LEVA ÁGUA.\nCOMEÇA A CHOVER. ELES VÃO PARA CASA.', [
  ['O que os amigos vão fazer?', 'piquenique', '🧺', 'nadar', '🏊'], ['Que fruta Lia leva?', 'uva', '🍇', 'banana', '🍌'],
  ['O que Lumi leva?', 'água', '💧', 'leite', '🥛'], ['Por que eles vão para casa?', 'começou a chover', '🌧️', 'começou a nevar', '🌨️'],
]);
// A trilha intercala letras, montagem e leitura: não espera o alfabeto inteiro.
// IDs são estáveis mesmo quando a ordem pedagógica muda.
const path = [1,2,3,4,5,6,7,8,9,17,21,10,18,22,11,19,23,12,20,13,15,14,16,24,25,26,27,28,29,30,31,32];
export const LESSONS: readonly Lesson[] = path.map(n => lessons[n - 1]!);
export const ACTIVITIES = new Map(LESSONS.flatMap(l => l.activities.map(a => [a.id, a] as const)));
export const LESSON_BY_ID = new Map(LESSONS.map(l => [l.id, l] as const));
