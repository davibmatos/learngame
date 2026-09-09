# Lumi — A Ilha das Palavras

Protótipo jogável de apoio à alfabetização em português brasileiro. A criança explora uma ilha com Lumi, realiza pequenas atividades e cuida do seu cantinho. O mascote nunca perde saúde, humor ou conquistas por ausência.

**Versão 0.1: conteúdo experimental.** A trilha vai do primeiro contato com a interface à compreensão de pequenos textos, mas não constitui um curso completo validado nem certifica alfabetização. O conteúdo precisa de revisão de um professor alfabetizador antes de uso em escala. Não há vínculo com o Kumon.

## Executar

Requisito: Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173/`. O servidor fica acessível apenas no próprio computador por padrão. Para testar na rede local, depois de compilar:

```sh
npm run preview -- --host 0.0.0.0
```

Nesse caso, abra no celular o endereço IP do computador, porta 5173. HTTP na rede local serve para experimentar o jogo, mas não valida instalação PWA/offline: esses recursos precisam de HTTPS ou localhost. Não abra `index.html` por duplo clique; o navegador precisa carregar os módulos por HTTP.

A versão em ZIP entregue com `dist/` já compilado também pode ser aberta executando `node scripts/serve.mjs`, sem instalar dependências. No Windows, `iniciar.bat` faz isso.

## O que está implementado

- 32 fases distribuídas por seis lugares, com demonstração antes das atividades. A trilha intercala letras, montagem e leitura.
- Primeiro contato com apenas uma figura e uma ação; depois duas alternativas, escuta, comparação de partes sonoras, letras, montagem, palavras, frases e histórias.
- Sessões com quatro atividades, podendo receber uma revisão adicional. Não há cronômetro, vidas ou ranking.
- Registro separado de acerto na primeira tentativa, novas tentativas e ajuda. O avanço depende desses registros, não da passagem de dias.
- Conteúdo pouco visto priorizado e revisão de uma fase já explorada após dois dias. Os critérios são provisórios, não parâmetros pedagógicos validados.
- Mascote, lanchinhos simbólicos, abraços gratuitos e quatro decorações. Até três presentes por dia, sem bloquear o estudo e sem sequência diária obrigatória.
- Até quatro perfis locais, modo de movimento reduzido, ajuste do ponto de partida, backup e restauração com validação.
- Retomada de uma aventura interrompida e preservação de um arquivo de progresso ilegível, sem substituí-lo silenciosamente.
- Manifesto de PWA e service worker com cache versionado, incluindo suporte a publicação em subpasta.

## Áudio e acompanhamento

A narração usa somente vozes **locais em português** disponibilizadas pelo dispositivo, preferindo pt-BR. Quando não há uma voz compatível, o aplicativo avisa e oferece o texto da instrução para um adulto ler. As vozes e sua pronúncia precisam ser verificadas no aparelho real.

O cartão-alvo de uma atividade de leitura não é narrado automaticamente. Pedir a leitura pela ajuda é registrado como apoio. A montagem por ditado e o reconhecimento de palavras ditadas não são registrados como leitura independente. Não há gravação, microfone ou avaliação automática da fala. Fonemas isolados não são produzidos artificialmente como se fossem áudios pedagógicos revisados.

## Estrutura

A base é TypeScript estrito, CSS e módulos nativos do navegador, **sem dependências de execução**. TypeScript é a única dependência de desenvolvimento. Esta versão não usa React: o motor e os dados são independentes das telas e podem ser reutilizados em outra interface.

```text
src/content.ts       catálogo, tipos, fases e ordem da trilha
src/engine.ts        sessões, avanço, revisões, recompensas e validação dos dados
src/audio.ts         narração local e cancelamento da fala
src/app.ts           interface e interações
public/              HTML, CSS, ícone e manifesto
scripts/build.mjs    compilação e geração do service worker
scripts/serve.mjs    servidor local para teste
```

## Verificação

```sh
npm run check
```

O comando verifica os tipos, compila e executa os testes de catálogo, progressão, montagem, backups, recompensas, datas locais e do service worker com rede/cache simulados.

O teste adicional de interface usa Playwright/Python:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/browser_smoke.py
```

`CHROMIUM_PATH` pode indicar um Chromium já instalado. Esse teste injeta a aplicação em um DOM isolado e usa armazenamento/voz simulados. Não substitui validação de instalação, armazenamento real, áudio ou offline em celulares. Os relatórios e capturas ficam em `test-results/`, fora do controle de versão.

Detalhes: [escopo pedagógico](docs/escopo-pedagogico.md) e [validação e pendências](docs/validacao.md).

## Publicação

```sh
npm run build
```

Publique **o conteúdo de `dist/`** em um servidor estático HTTPS. Os caminhos são relativos; a aplicação pode estar na raiz ou em uma subpasta, por exemplo `/learngame/`. Não requer banco de dados, PHP ou servidor de aplicação. Não há deploy automático configurado.

## Dados e limites

Os dados ficam no `localStorage` deste navegador. Não há conta online, sincronização, anúncios, rastreadores ou coleta de nome, foto e nascimento. Limpar os dados do site apaga o progresso; faça backups. A confirmação da área dos responsáveis é apenas uma barreira contra mudanças acidentais, não autenticação. Um usuário com acesso ao dispositivo pode ver ou alterar dados locais.

Os critérios do motor não identificam dificuldades de aprendizagem. Letras e palavras vistas no jogo não substituem escrita, leitura em livros, experiências fora da tela ou acompanhamento profissional. Ilustrações de alternativas usam emojis do sistema nesta versão e também precisam ser validadas com crianças e substituídas por figuras consistentes quando necessário.
