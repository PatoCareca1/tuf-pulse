# Validação local — implementação desktop

Data: 12/10/2026. Notebook identificado por DMI como TUF Gaming A16 FA607NUQ, kernel 7.2.5-3-omarchy. asusctl 6.4.0; asusd ativo, sem alterações no serviço ou banco de suporte.

## Implementado

- Janela Tauri 2 e painel React/TypeScript inspirado no protótipo.
- Diagnóstico real, cor fixa e quatro brilhos por argumentos separados ao asusctl.
- Chamadas assíncronas serializadas, timeout de 8 segundos por subprocesso, validação Rust e indicação de falha parcial.
- Perfis JSON versionados em XDG, escrita atômica, criação/atualização/renomeação/exclusão e seleção persistida.
- Estado solicitado, prévia e resultado do comando identificados separadamente; brilho confirmado por leitura, cor sem getter confiável.

## Verificado

- Build TypeScript/Vite, build executável Tauri sem bundle e Clippy sem warnings.
- 3 testes Vitest e 9 testes Rust passaram; teste de hardware ignorado na suíte padrão.
- Testes Rust: validação, fixture 6.4.0, formato multilinha atual, brilho, timeout, binário ausente, falha parcial, persistência após reabrir, exclusão/renomeação, arquivo inválido/versão futura preservados e falhas de escrita.
- Smoke test pelo núcleo Rust contra hardware real: Cyber (`4de8d1`) em off/low/med/high, sucesso dos comandos e leitura de cada brilho; restaurado `dce6ff`/High.
- Janela registrada no Hyprland via XWayland. Usuário confirmou painel renderizado, diagnóstico ready e brilho Alto.
- Wayland nativo falhou com erro GDK 71. XWayland inicialmente teve erros GBM; `GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1` funcionou sem alterações globais.

## Pendente de observação do usuário

- Conferir a cor e intensidade físicas ao aplicar pela interface.
- Salvar, renomear, excluir e selecionar perfil na janela, fechar e reabrir para confirmar a experiência completa (teste de persistência em disco já passou).
- Acessibilidade visual, zoom e layout nos tamanhos reais usados no desktop.

Não foram testados efeitos além de Static, desligamento do daemon real nem desinstalação do asusctl. Não houve simulação apresentada como controle real. CLI para alternar perfis, bandeja, autostart e empacotamento ficam para etapas posteriores; o atalho local de abertura foi adicionado depois. Use uma instância do app por vez nesta versão.

## Acesso rápido e seletor visual

- Seletor HSV por arraste e faixa de tonalidade, sem o diálogo nativo que extrapolava pequenas janelas. Conversões de cor cobertas por testes, incluindo cinzas e limites.
- Modal verificado em 360×460, 480×640 e 320×360: arraste, hexadecimal, foco, Escape e ausência de chamadas de hardware.
- Omarchy/Hyprland 0.56.2: regra Lua específica para Tuf-pulse flutuante/centralizado; Super+Shift+K livre antes da configuração, registrado depois. Configuração principal com backup; reload e configerrors sem erros.
- Escape/× fecham o painel; abrir e restaurar seleção não aplicam iluminação automaticamente.

- Verificação na sessão gráfica: janela `Tuf-pulse` com `floating: true`, tamanho 480×540 e posição centralizada [414,130]. Usuário informou que estava fechando as janelas de teste; não houve evidência de encerramento espontâneo.
- Cinco testes Vitest, nove testes Rust, build desktop e Clippy passaram após o seletor HSV e fechamento rápido.

## Painel compacto e brilho por arraste

- Janela inicial/regra local reduzidas para 400×360, mínimo 320×320; lista de perfis com rolagem própria.
- Rótulo Cores restaurado; brilho usa range com step=1, quatro posições e indicação do nível atual. Ajustes manuais seguem aguardando Aplicar.
- Navegador com adapter simulado: arraste até Alto, aplicação manual e seleção imediata de perfil verificados; layouts 320×320, 360×340, 400×360 e 480×360 sem overflow horizontal.

## Ícones e painel sem rolagem

- Ícone opcional por perfil: trabalho, programação, controle ou incógnito; nome preservado para tooltip/acessibilidade. Arquivos antigos sem icon continuam válidos.
- Edição em modal sem aplicar hardware; seis perfis por página, em vez de rolagem da lista. Altura da janela ajustada ao conteúdo com limite do monitor.
- Testes de salvar/reabrir ícone, rejeitar ícone desconhecido preservando arquivo e compatibilidade com dados antigos.
- Navegador com adapter simulado: seleção/gravação de ícone e painel sem rolagem em larguras 320, 360 e 400, usando altura ajustada.
