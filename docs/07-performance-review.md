# Revisão de desempenho e falhas — 12/10/2026

## Correções

- Seleção no editor por botões internos, sem popup nativo. O fechamento relatado do seletor WebKit não foi reproduzido; validar a substituição na janela real.
- Abrir o editor carrega também cor e brilho do perfil selecionado. Antes, alterações manuais no painel podiam ser gravadas inadvertidamente ao atualizar apenas o nome.
- Leitura de perfis limitada a 64 KiB + 1 byte, em vez de carregar o arquivo completo antes de rejeitar o tamanho.
- Testes de arquivo grande, campo desconhecido e valores hostis; arquivos existentes preservados.

## Achados pendentes

- Mutex único bloqueia perfis durante diagnóstico/hardware. Separar coordenação de arquivos e hardware pode melhorar responsividade sem remover validação.
- Não há coordenação entre instâncias: escritas atômicas evitam JSON incompleto, mas duas instâncias podem perder atualizações. O launcher de foco não substitui garantia de instância única.
- busy é estado React, não um bloqueio síncrono de operações. Revisar cliques concorrentes, transição entre persistir/aplicar e fechamento durante operações.
- Saída de subprocesso é capturada integralmente. Timeout limita duração, mas não quantidade de bytes; considerar limite se o modelo de ameaça incluir ferramenta local comprometida.
- Aplicação repete diagnóstico e confirma brilho. Medir cada etapa antes de mudar essas garantias.

## Comparação necessária

Construir release e comparar com debug, sem mudar o launcher inicialmente. Medir abertura fria/quente até janela visível e controles prontos; diagnóstico separado; aplicação somente com anúncio e valores de restauração. Medir RAM com PSS e RSS de Rust e todos os filhos WebKit, CPU em repouso e durante operações. RSS somado inclui memória compartilhada repetida. Abertura fria deve distinguir cache do sistema; não limpar caches globais indiscriminadamente.

Comparar com janela residente oculta e trazida ao foco: latência de retorno, memória e CPU em repouso. Implementar ocultação exige definir fechamento, saída definitiva, instância única e atualização de estado após suspensão.

Na redação inicial não havia baseline numérica. A medição posterior abaixo registra a primeira baseline; não há promessa de tempo de abertura. O tamanho debug não representa distribuição. Custos de desenvolvimento envolvem manutenção, testes no WebKit real e integração asusctl/Hyprland; custos financeiros dependem das ferramentas e planos usados. App atual não exige serviço em nuvem. Distribuição exige avaliar dependências GTK/WebKit, empacotamento e suporte às versões alvo.

## Ajustes de interface posteriores

- Salvar ao lado de Aplicar abre criação com cor/brilho atuais, nome e ícone; o editor pelo lápis somente atualiza/exclui existentes.
- Dispositivo e estado saiu do rodapé; clicar no título TUF PULSE abre diagnóstico em modal.
- Título com composição geométrica e realces âmbar. A fonte oficial ASUS não está embutida; há fallback local, sem afirmar equivalência à tipografia oficial.
- Seletor limita arraste ao botão primário, encerra captura no pointerup/cancel e mantém o último draft em ref para confirmação. Menu de contexto é suprimido no seletor.
- Tela cinza com “Inspect Element” relatada pelo usuário não foi reproduzida no Chromium; causa no WebKit real permanece por confirmar.
- Build frontend, seis testes frontend, build Tauri debug e diff check passaram. Chromium headless com backend simulado verificou três confirmações consecutivas de cor, criação preservando cor escolhida, editor sem criação e modal de diagnóstico; nenhuma chamada de aplicação ao hardware.

## Baseline local medida — 12/10/2026

| Medida | Debug | Release |
| --- | --- | --- |
| Executável (sem bibliotecas do sistema) | 193,99 MiB | 11,23 MiB |
| Janela mapeada, observada desde o lançamento | 0,44–0,85 s | 0,43–0,85 s |
| Controles prontos, desde início do Rust | 0,56–1,10 s | 0,56–1,07 s |
| RAM PSS total em repouso (mediana) | 254,40 MiB | 247,19 MiB |
| RAM PSS perto dos controles prontos | 253,71–257,14 MiB | 250,04–250,29 MiB |
| RSS somado em repouso (mediana; repete páginas compartilhadas) | 484,72 MiB | 477,26 MiB |
| CPU em repouso, por núcleo, amostra de 5 s | 0% detectável | 0–0,20% |
| CPU acumulada dos processos residentes até ready | 0,74–0,79 s de CPU | 0,73–0,76 s de CPU |
| Pedido de fechar até saída do processo principal | 40–41 ms | 40–41 ms |
| Filhos observados ainda presentes 2 s após fechar | nenhum em 3 execuções | nenhum em 3 execuções |

Release em repouso: processo TUF Pulse cerca de 72,4 MiB PSS, processo WebKitWeb cerca de 131,5 MiB, WebKitNetwork cerca de 43,3 MiB. O frontend não é o único custo: boa parte reside no motor WebKit e nas bibliotecas GTK. As duas builds usam o mesmo frontend Vite de produção. A diferença de tamanho do binário não equivale a redução proporcional de RAM.

Leituras isoladas do asusctl, cinco amostras por comando/build: mediana de `info --show-supported` 77–79 ms; `leds get` 75–76 ms. A inicialização usa ambas sequencialmente; estimativa de aproximadamente 0,15–0,16 s somente nessas leituras, sem atribuir esse resultado isolado ao tempo exato dentro do app.

Cache persistente observado: 4,1 MiB de blocos alocados em `~/.local/share/dev.tufpulse.desktop`, incluindo caches WebKit e dados auxiliares de navegação. Pode incluir conteúdo de versões/dev anteriores. Perfis ficam separados em `~/.config/tuf-pulse/profiles.json`. Cache em disco não é um processo residente. O cache de páginas do sistema também pode conservar executável/bibliotecas após fechar, sendo reutilizável sob pressão de memória; não foi quantificado individualmente nem limpo.

Método e limites:

- Três aberturas por build, sequenciais, sem compilação/testes concorrentes na série final. Desktop normal em uso; caches existentes. Não é teste de partida fria após reboot/cache eviction, nem estudo estatístico.
- Executável direto com workaround X11/DMA-BUF, sem tempo adicional do helper/atalho. Marker de ready após diagnóstico, leitura dos perfis e busy liberado, seguido de dois requestAnimationFrame. Mede oportunidade de renderização/controles prontos, não pixels visíveis fisicamente. O marker começa em Rust main, excluindo parte do carregador do processo.
- RAM soma PSS de Rust e filhos WebKit; amostras perto de ready e após 2 s de estabilização. Não é pico absoluto e não inclui VRAM ou memória atribuída a XWayland/compositor/daemon compartilhados.
- CPU em repouso é delta de utime/stime em /proc durante 5 s. A resolução é cerca de 0,2% de um núcleo; zero significa nenhum incremento detectado nesse intervalo. CPU acumulada até ready exclui subprocessos curtos já encerrados e trabalho do asusd.
- Fechamento por pedido direcionado do compositor à janela do teste, sem kill nas seis execuções concluídas; verificados PIDs e starttimes para evitar confusão por reutilização. Não é teste direto do botão × ou Escape, embora ambos chamem window.close no código.
- Duas tentativas iniciais de fechamento foram inválidas: faltava hl.dispatch para executar a ação Lua. Um conjunto exploratório teve compilação concorrente. Esses ensaios não entram nos JSON finais.
- Não houve aplicação de iluminação, gravação de perfis, limpeza de caches ou alteração do launcher. Na medição, o atalho ainda apontava para debug; posteriormente o usuário escolheu release como padrão.

Dados: [debug](measurements/2026-10-12-debug.json), [release](measurements/2026-10-12-release.json). Script reexecutável: `python3 scripts/measure-startup.py --build release --runs 3 --output /tmp/tuf-pulse-release.json` (abre e fecha as próprias janelas; recusa medir com outra instância aberta).

Release escolhido pelo usuário e configurado no launcher após a medição. Próximos pontos para discutir: manter fechamento completo, sem processo oculto; garantir instância única para evitar duplicar o custo e conflitos de perfis. Não remover diagnóstico ou confirmação de brilho sem medição do fluxo de aplicação. Redução grande de RAM exige avaliar o custo fixo do WebKit e possivelmente uma interface nativa, com nova comparação medida; não prometer ganhos de pequenas alterações CSS/React.

## Bloqueio de zoom

`zoomHotkeysEnabled: false` explícito, viewport limitado a escala 1, touch-action permitindo pan sem pinch, captura de atalhos Ctrl/Meta + +/−/0 e de Ctrl/Meta + wheel, além de cancelamento de gesturestart/gesturechange. Referência de configuração: [Tauri](https://v2.tauri.app/reference/config/#zoomhotkeysenabled). Chromium simulado verificou cancelamento dos atalhos e Ctrl+wheel, preservando wheel comum e os fluxos de cor/perfis/diagnóstico. Gestos físicos no WebKit real ainda dependem de confirmação do usuário.

Verificação: builds frontend/debug/release concluídas; seis testes frontend e onze Rust passaram (smoke que muda hardware ignorado); clippy sem warnings e diff check passaram. Marcadores de startup são pontuais; imprimem somente com `TUF_PULSE_MEASURE` presente, sem arquivo de log ou polling em uso normal.

## Release como padrão

Usuário autorizou usar release. `scripts/launch.sh` agora executa `src-tauri/target/release/tuf-pulse`; orientação de build ajustada para `npm run tauri build -- --no-bundle`. O atalho usa o mesmo script e não exigiu editar Hyprland. Workaround gráfico preservado.
