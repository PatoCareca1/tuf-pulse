# 05 — Backlog inicial

Executar uma etapa por vez. Só ampliar o escopo quando o aceite da etapa anterior estiver demonstrado.

## Issue 01 — Diagnóstico no notebook

**Objetivo:** confirmar as capacidades e investigar por que o asusctl anuncia somente Static.

**Entrega:** versão/kernel + relatório revisado + evidência do mapeamento específico encontrado. Consultar ajuda da versão instalada antes de executar outros modos. Se houver proposta de mudança do banco, registrar diff/backup e testar um efeito por vez no notebook.

**Aceite:** distinguir confirmado, candidato e não suportado; nenhum efeito extra prometido por inferência.

## Issue 02 — Scaffold desktop

**Objetivo:** abrir o painel React em uma janela Tauri no Omarchy.

**Entrega:** Vite/React/TypeScript, Tauri 2, lockfiles gerados pelas ferramentas, versões fixadas, modo mock com os contratos existentes e comandos de dev documentados.

**Aceite:** janela funcional no notebook, build local e estados de desconexão visíveis. Registrar RAM/CPU observados em repouso, sem limite inventado antes da medição.

## Issue 03 — Cor e brilho reais

**Objetivo:** conectar adapter asusctl ao núcleo Rust.

**Entrega:** validação, timeout, tratamento de falha parcial e chamadas fora da thread de UI.

**Aceite:** branco frio e outra cor testados visualmente; off/low/med/high; erros de daemon ausente e hex inválido. Testes unitários da validação e parser, sem exigir hardware no CI.

## Issue 04 — Perfis locais

**Objetivo:** salvar e aplicar perfis.

**Entrega:** JSON versionado, escrita atômica, CRUD e recuperação de arquivo inválido sem apagá-lo.

**Aceite:** reabrir mantém presets; renomear/excluir não deixa referências inválidas; falha de gravação informada.

## Issue 05 — CLI e Hyprland

**Objetivo:** trocar perfil sem abrir a janela.

**Entrega:** CLI compartilhando o núcleo, aplicação serializada entre GUI/CLI e exemplos de bindings após conferir conflitos.

**Aceite:** funciona com janela fechada; comandos simultâneos não corrompem JSON nem confundem estado confirmado.

## Issue 06 — Release 0.1

**Objetivo:** outra pessoa instalar e usar seguindo o README.

**Entrega:** pacote Arch, instruções para asusd, captura do painel, issue template de compatibilidade e CI apropriado ao código efetivamente implementado.

**Aceite:** instalação/remoção testadas, licença e dependências inventariadas, revisão por alguém que não desenvolveu o app.

## Depois

Bandeja/autostart, efeitos nativos validados, integração com tema Omarchy e presets exportáveis. Expansão para outros modelos exige relatos reais por controlador. Animações por software ficam em experimento separado.
