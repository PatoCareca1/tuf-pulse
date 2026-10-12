# 01 — Produto e MVP

## Decisão

Construir um aplicativo desktop focado em iluminação de teclados ASUS TUF no Arch/Omarchy. Nome provisório: **TUF Pulse**. O nome poderá mudar antes da divulgação; esta entrega não verifica disponibilidade de marca.

**Promessa:** escolher uma cor ou perfil em poucos cliques, entender o que o dispositivo suporta e trocar de perfil pelo teclado.

## Público inicial

Pessoas com ASUS TUF usando Arch, principalmente Omarchy/Hyprland. Primeiro aparelho validado: o FA607NUQ de Lucas. Arch é o sistema de distribuição, não uma garantia de compatibilidade RGB: marca, controlador, firmware, kernel e asusd determinam os recursos.

## MVP 0.1

| Recurso | Critério de aceite |
| --- | --- |
| Diagnóstico | Detectar ausência de asusctl/asusd e apresentar ação útil; não afirmar compatibilidade pelo nome do modelo apenas |
| Cor fixa | Seletor + hexadecimal; toda a zona usa a mesma cor; só confirmar após sucesso do comando |
| Brilho | Quatro níveis discretos confirmados; desligar/ligar preserva o último nível não nulo |
| Perfis locais | Criar, renomear, excluir e aplicar cor + brilho; restaurar preferências da interface; JSON versionado com escrita atômica |
| Prévia | Teclado esquemático, marcado como prévia; nenhuma promessa de cores idênticas aos LEDs |
| Atalhos Hyprland | CLI para aplicar e alternar perfis; gerar bindings para revisão e cópia; nada de sobrescrever configuração do usuário |
| Erros e estados | Mostrar em aplicação, aplicado e falha; erro não altera a representação do estado confirmado |

Cor e brilho podem exigir duas chamadas: se a segunda falhar, informar estado parcialmente aplicado e consultar o dispositivo. Não tratar essas operações como uma transação atômica inexistente.

## Fora do MVP

Controle de ventoinhas/GPU, overclock, RGB de outras marcas, sincronização com áudio/jogos, contas, nuvem, loja de temas, atualização automática, animações por software e suporte por tecla. Bandeja e autostart ficam para 0.2, para validar primeiro a janela e os atalhos.

## Efeitos: ordem de evolução

1. **0.1:** cor fixa + brilho + perfis + atalhos.
2. **0.2:** bandeja, autostart opcional e efeitos nativos realmente testados; documentação de instalação/release Arch.
3. **0.3:** integração de tema Omarchy, matriz pública de compatibilidade e importação/exportação de perfis.
4. **Experimental:** transições de cor e pulso gerados por software, somente após validar uma API adequada para atualizações transitórias.

Animações de interface no protótipo servem para discutir o visual. Não fazem parte da implementação de hardware entregue.

## Estratégia

Já existem rog-control-center e TUFRGB. O diferencial proposto é experiência bem acabada para Omarchy/Hyprland, atalhos simples, presets e diagnóstico confiável. Não há evidência de que a ASUS ou Omarchy tenham interesse comercial no projeto.

O primeiro objetivo mensurável é Lucas usar o app diariamente com instalação documentada. Depois: validar em três controladores/modelos distintos, reduzir os erros de instalação e publicar uma release reproduzível. Só então abordar mantenedores sobre contribuição/inclusão; eventual parceria depende de tração e interesse deles.

Licença inicial escolhida: MIT para o código próprio. Não copiar código ou banco de dados de outros projetos nesta base. Dependências externas serão inventariadas antes do empacotamento.
