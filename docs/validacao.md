# Validação da versão 0.1

## Executado em 09/09/2026

Ambiente: Node.js 22.16.0, TypeScript 5.8.3 e Chromium headless.

- Verificação de tipos com `tsc --noEmit`: aprovada.
- Compilação do código e geração do pacote estático/PWA: aprovadas.
- 78 testes automáticos: aprovados. Incluem consistência de todas as fases, opções/respostas, ordem da trilha, desbloqueio, distinção entre ajuda e acerto independente, montagem com peças repetidas, sessões incompletas, idempotência, recompensas, revisão, fuso horário e importação de backups.
- Service worker: precache de recursos, navegação sem rede e limpeza de versões testados com cache/rede simulados em uma VM JavaScript. Foram verificados raiz lógica e escopo em subpasta.
- 13 cenários de interface: aprovados no Chromium, incluindo telas de 320, 390, 768 e 1440 pixels, teclado, modais, pausa/retomada do estado, cuidado do mascote, perfis isolados, ajuste de início, ajuda em leitura e montagem corrigida. Não foram observadas exceções JavaScript nesses fluxos.
- Renderizações desktop e mobile inspecionadas visualmente.
- Servidor local respondeu HTTP 200 para a página inicial e forneceu os cabeçalhos configurados.

## Como interpretar esses testes

O ambiente não permitiu navegação do Chromium para URLs. Por isso os testes de interface carregaram o código compilado em um DOM isolado, com armazenamento e voz simulados. Não foram alteradas as políticas do navegador. As capturas mostram a interface executada, mas esses testes não equivalem a uso real em um site instalado.

A dependência TypeScript 5.8.3 estava pré-instalada no ambiente. O lockfile inclui a versão e a integridade da distribuição correspondente. A instalação limpa via `npm ci` não foi executada localmente por falta de acesso à rede; o workflow do repositório está configurado para fazê-la antes de repetir as verificações. O resultado de CI deve ser consultado no GitHub, sem presumir que a configuração implica aprovação.

## Ainda precisa ser verificado

1. Instalação PWA, atualização entre versões e reabertura sem rede em Android/Chrome e iOS/Safari, em HTTPS real.
2. Persistência real após fechar navegador, política de remoção de armazenamento do sistema, várias abas e restauração de backups em aparelhos diferentes.
3. Disponibilidade e pronúncia de vozes locais pt-BR; alguns sistemas não disponibilizam uma voz offline.
4. Uso por uma criança acompanhada, consistência das figuras e compreensão das instruções.
5. Revisão pedagógica da sequência e dos critérios; medidas de generalização da leitura para fora do jogo.
6. Auditoria de acessibilidade, incluindo leitores de tela, contraste de todos os textos e adaptações específicas.

Não há deploy público, testes de eficácia pedagógica, revisão jurídica de produto infantil ou alegação de acessibilidade universal nesta entrega.
