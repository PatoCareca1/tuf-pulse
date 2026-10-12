# 04 — Direção visual

## Conceito

Um painel gamer sóbrio: fundo grafite, contraste bom, bordas discretas, ciano/verde como sinal de ação e roxo apenas como acento. Sem luzes piscando no próprio aplicativo por padrão. Evitar aparência de painel de overclock com dezenas de mostradores.

## Tela principal

1. Cabeçalho com dispositivo e estado da conexão.
2. Prévia central do teclado inteiro na mesma cor.
3. Seletor de cor e quatro níveis de brilho à direita.
4. Presets úteis: Branco frio, Grafite, Cyber e Neon.
5. Capacidades no rodapé: disponível, validar e indisponível.

UI em português; README também em inglês para abrir caminho para contribuições. Internacionalização completa virá quando houver outra pessoa usando o aplicativo.

## Acessibilidade

- Foco visível, navegação por teclado e rótulos explícitos.
- Cor não será o único indicador de seleção/erro.
- Brilho em níveis, sem porcentagens fictícias.
- Sem efeitos espaciais na prévia de um teclado de zona única.
- Respeitar prefers-reduced-motion e parar qualquer simulação ao ocultar a página.

## Protótipo entregue

`prototype/index.html` é autocontido e funciona sem servidor, CDN ou dependências. Simula escolha de cor/brilho, presets, salvar/excluir presets locais, e três ideias de animação global. O usuário abre deliberadamente o modo de simulação; ele não muda a capacidade do aparelho.

O botão Aplicar só confirma a simulação. A mensagem permanece explícita: **nenhuma alteração é enviada ao teclado**. Os presets usam localStorage do navegador; não são os arquivos XDG do aplicativo final. Layout é uma ilustração, não um mapa físico exato do FA607NUQ.
