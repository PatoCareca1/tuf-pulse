# 06 — Estado desta entrega

## Criado

- Repositório Git local na branch main, com commit inicial e sem remote.
- README, licença MIT, escopo/MVP, arquitetura, pesquisa de hardware e backlog.
- Contratos TypeScript de design e fixture do relatório fornecido pelo usuário.
- Protótipo HTML offline, marcado explicitamente como simulação.
- Script de diagnóstico somente leitura.

## Verificação realizada

- Sintaxe Bash do script com `bash -n`.
- Sintaxe JavaScript do script inline com `node --check`.
- Integridade dos links locais de documentação e do arquivo ZIP.
- Integridade e estado limpo do repositório Git após o commit.

## Ainda precisa ser validado

- Renderização e interações em um navegador real: o ambiente desta entrega não tem navegador disponível; a tentativa de instalar Chromium falhou. Não há captura de tela nem aprovação visual real nesta entrega.
- Compilação de Tauri/Rust/React: o scaffold desktop ainda não foi gerado.
- Controle de hardware, persistência após reiniciar e atalhos Hyprland: exigem o notebook do proprietário.
- Respiração/ciclo/pulso: nenhuma alteração do banco asusd foi feita ou testada.

## Checklist ao abrir o protótipo

1. Abrir `prototype/index.html` e escolher Cyber; o teclado inteiro deve mudar junto.
2. Inserir hexadecimal inválido; o botão Aplicar deve ficar desabilitado.
3. Escolher branco frio e brilho baixo; salvar um perfil, recarregar e verificar sua presença.
4. Excluir o perfil salvo; ele deve desaparecer.
5. Abrir o laboratório, simular e parar; voltar à cor fixa escolhida.
6. Verificar 390 px e desktop, zoom e navegação por Tab.
7. Ativar preferência de movimento reduzido no sistema/browser; simulação deve ficar desabilitada.

O protótipo é uma referência de design para revisão; não é a release 0.1.
