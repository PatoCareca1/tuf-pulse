# 03 — Stack e arquitetura

## Escolha: Tauri 2 + React/TypeScript + Rust

React/TypeScript aproveita a experiência de Lucas e facilita uma interface bem acabada. Tauri usa a WebView do sistema e oferece a ponte para comandos nativos em Rust. No Linux isso adiciona dependência de WebKitGTK; devemos medir consumo e inicialização no notebook, não presumir que será menor que qualquer alternativa.

| Opção relevante | Vantagem | Custo | Decisão |
| --- | --- | --- | --- |
| Tauri + React | UI familiar, CSS flexível, núcleo nativo e distribuição desktop | Aprender Rust e empacotar dependências Linux | Escolhida |
| Python + PySide6 | Backend familiar e Qt maduro | Novo fluxo de UI/Qt, empacotamento de Python/Qt | Alternativa se a ponte Rust bloquear o progresso |

Usar CSS variables inicialmente. Não adicionar biblioteca de estado, servidor HTTP ou ORM para poucos controles. Persistência: JSON local versionado. Testes: Vitest no front, cargo test no núcleo; hardware em smoke tests documentados.

## Divisão de responsabilidades futura

| Parte | Responsabilidade |
| --- | --- |
| Interface React | Formulários, estados, acessibilidade e preview |
| Comandos Tauri | Validar entrada e chamar casos de uso do núcleo |
| Núcleo Rust compartilhado | Capacidades, aplicação de perfis e armazenamento |
| Adapter asusctl | Argumentos permitidos, timeout, resultado e detecção da versão |
| CLI tuf-pulse | Aplicar perfis pelo Hyprland usando o mesmo núcleo |
| asusd / kernel / controlador | Acesso ao hardware existente |

O núcleo expõe `getCapabilities`, `getState`, `applyStatic`, `setBrightness`, `listProfiles`, `saveProfile`, `applyProfile`. Os contratos iniciais estão em `contracts/control.ts`; ainda não são uma API implementada.

## Integração inicial

Usar asusctl para chamadas pontuais:

```text
asusctl info --show-supported
asusctl aura effect static -c RRGGBB
asusctl leds set off|low|med|high
```

Invocar o binário via lista de argumentos, sem `sh -c`, sem comando arbitrário vindo do frontend e sem root. Validar hexadecimal, enum de brilho e limites de perfil no Rust. Um caminho fixo para o binário da instalação Arch reduz ambiguidades. Executar fora da thread de UI, limitar duração, propagar stderr útil e consultar novamente após falha parcial.

O relatório atual de capacidades é texto, não um contrato JSON estável. O adapter deve ter fixtures da versão 6.4.0, tratar campos ausentes como desconhecidos e reconhecer mudança de formato sem habilitar recursos silenciosamente. Ler `--help` local e congelar versões compatíveis para a primeira release.

Migrar a D-Bus se melhorar leitura tipada/estado ou permitir atualizações transitórias seguras. Isso é uma evolução do adapter, não motivo para desenhar uma arquitetura de plugins completa agora.

## Estado e persistência

- Preferências da UI e perfis: `$XDG_CONFIG_HOME/tuf-pulse`, fallback `~/.config/tuf-pulse`.
- JSON com `schemaVersion`, validação e arquivo temporário + rename.
- Diferenciar perfil selecionado, solicitado e aplicado. Mudanças externas no teclado exigem refresh.
- Retomar o último perfil ao login só com autostart explicitamente escolhido; persistência da cor no controlador será testada no equipamento.
- Nenhum log de ambiente, credenciais ou inventário pessoal. Diagnóstico compartilhável é gerado a pedido.

## Atalhos no Omarchy

Hyprland executa a CLI e funciona com a janela fechada. Antes de sugerir bindings, verificar conflitos locais. O painel mostra um trecho para o usuário copiar; não edita seus arquivos automaticamente. Não depender de APIs de atalhos globais que variam em Wayland.

Exemplo futuro (a CLI ainda não existe):

```text
bind = SUPER SHIFT, K, exec, tuf-pulse profile next
```

## Empacotamento

Primeiro compilar e validar localmente no Omarchy. Depois pacote Arch com dependências explícitas, release GitHub e PKGBUILD testado. AUR é um canal de distribuição futuro, não um pacote criado nesta entrega. AppImage não elimina a dependência do asusd nem garante acesso a D-Bus em qualquer distro.

## Referências

- [Arquitetura Tauri](https://v2.tauri.app/concept/architecture/).
- [Pré-requisitos Tauri no Linux](https://v2.tauri.app/start/prerequisites/).
- [Arquitetura e asusd](https://github.com/OpenGamingCollective/asusctl).
