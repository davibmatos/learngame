# Escopo pedagógico — versão inicial

## Propósito e limites

Apoiar o contato com a linguagem escrita por meio de brincadeiras curtas. A versão 0.1 é um protótipo de produto com uma amostra de progressão; não foi validada com crianças, alfabetizadores ou estudos de eficácia. Não há promessa de alfabetização em um número de dias.

O usuário pretende abranger crianças com pontos de partida diferentes. Por isso o início é ajustável por um responsável, sem atribuir domínio às etapas puladas. Não se infere estágio de leitura a partir da idade. O primeiro contato tem um alvo visual por vez e não exige letras, fala ao microfone, arrastar peças ou rapidez.

## Organização

Os seis lugares agrupam habilidades, mas não são blocos que precisam ser terminados isoladamente. A ordem em `content.ts` intercala letras, montagem e leitura: M/L/P, por exemplo, abrem palavras com essas letras antes das demais famílias.

| Lugar | Conteúdo inicial | Limite importante |
| --- | --- | --- |
| Jardim dos começos | Tocar, parear figuras, escutar vocabulário, comparar começos e rimas | Pareamento e vocabulário não são prova de leitura |
| Bosque das letras | Reconhecimento de letras em exemplos, nomes, maiúsculas e minúsculas | Nome da letra não equivale a fonema; faltam áudios fonêmicos revisados |
| Ponte dos pedacinhos | Montagem de palavras por partes escritas | É montagem apoiada por ditado, não leitura independente |
| Vila das palavras | Ler cartões, distinguir palavras próximas e explorar novas correspondências | Banco pequeno; familiaridade com itens não demonstra generalização |
| Praia das frases | Informação explícita e diferenças de sentido | Não mede fluência oral ou escrita |
| Ilha das histórias | Informação e uma inferência simples em textos curtos | É amostra de compreensão, não conclusão da alfabetização |

Alguns exemplos mais avançados contêm padrões ainda pouco trabalhados, como nasalização e encontros consonantais. Antes de uso independente, esses pontos precisam ser desdobrados em microetapas ensinadas e revisadas. O conjunto não cobre exaustivamente ortografia, todas as correspondências grafema-fonema, escrita, fluência, gêneros textuais ou leitura funcional.

## Ciclo de uma aventura

Demonstração falada e visual; tentativa; ajuda quando solicitada ou após erros; nova tentativa; encerramento explícito. A correção não retira vidas, tempo ou recompensas anteriores.

O avanço provisório considera uma janela de até 12 registros da própria fase. Para interação/escuta, pede uma sessão, pelo menos três itens distintos acertados sem ajuda e proporção mínima de 75% de acertos independentes. Nas demais fases, pede duas sessões, pelo menos quatro itens distintos e 80%. Esses valores são decisões de engenharia para experimentar o motor, **não pontos de corte validados**. As fases liberadas não voltam a ficar bloqueadas por desempenho em revisão.

“Independente” significa somente acertar aquela atividade na primeira tentativa e sem usar a ajuda do jogo. O software não sabe se outra pessoa forneceu a resposta. Uma escolha acertada ao acaso continua possível; o banco pequeno e os mesmos formatos limitam a interpretação. A área dos responsáveis explicita isso sem rotular a criança.

Cada aventura contém quatro atividades; uma revisão pode acrescentar um quinto item. Itens menos vistos são priorizados. Uma fase anteriormente explorada pode reaparecer após dois dias. Não existe obrigação de entrar diariamente e não há perda por ausência. O usuário pode praticar novamente, mas a experiência termina e oferece sair, em vez de começar outra sessão automaticamente.

## Linguagem, imagens e acessibilidade

A interface usa botões grandes, alternativas por toque ou teclado, texto legível, contraste nos elementos principais e respeito à preferência de movimento reduzido. Isso não é uma certificação de conformidade WCAG. A identificação de imagens por emojis varia entre sistemas e exige testes; figuras próprias consistentes são uma prioridade.

A narração tenta usar voz local pt-BR. A ausência de voz local ativa uma orientação para mediação adulta. A pronúncia deve ser revisada no aparelho. A versão não utiliza síntese de consoantes isoladas como substituto de fonemas gravados. Em leitura, o texto-alvo não é lido automaticamente; usar ajuda marca apoio.

Para crianças com necessidades visuais, auditivas, motoras ou de linguagem, será necessário projetar e testar adaptações específicas. Não se presume que esta primeira interface já atenda a todas elas. O limite de quatro perfis visa uso familiar inicial, não gestão de turmas.

## Revisão antes de ampliar o uso

Revisar a ordem e a granularidade das habilidades com alfabetizador; conferir pronúncia e exemplos em português brasileiro; produzir figuras e áudios consistentes; ampliar o banco para incluir exemplos não ensinados; avaliar se a criança entende o que fazer sem ajuda constante; observar se o progresso se transfere a palavras e livros fora do aplicativo. Estudos com crianças exigem planejamento, consentimento dos responsáveis e cuidado com dados; nenhum foi realizado nesta entrega.

## Referências de orientação

- Referencial Curricular do Paraná, Língua Portuguesa — 1º ano: habilidades de relações entre fala/escrita, segmentação oral, letras e leitura. https://www.referencialcurriculardoparana.pr.gov.br/Lingua-Portuguesa-1o-Ano
- Institute of Education Sciences, *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade*: linguagem, relações entre sons/letras, decodificação e textos. É uma referência em contexto de língua inglesa; não foi transposta como sequência pronta para português. https://ies.ed.gov/ncee/wwc/practiceguide/21
- MDN, `SpeechSynthesis.getVoices()`: disponibilidade das vozes no dispositivo. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices

Referências consultadas em 09/09/2026. Elas orientam decisões, mas não validam este aplicativo.
