# 02 — O que o teclado permite

Pesquisa realizada em 12/10/2026. Referência principal da instalação: saída enviada pelo proprietário.

```text
asusctl v6.4.0
Product family: TUF Gaming A16
Board name: FA607NUQ
Supported Keyboard Brightness: [Off, Low, Med, High]
Supported Aura Modes: [Static]
Supported Aura Zones: []
Supported Aura Power Zones: [Keyboard]
```

O proprietário também relatou sucesso na troca de cor fixa. O comando de serviço desta instalação é `sudo systemctl start asusd.service`; a unidade é ativada por udev e não tem configuração de `enable`. O aplicativo não precisa modificar isso automaticamente.

## Matriz da primeira instalação

| Ideia | Estado | Consequência prática |
| --- | --- | --- |
| Branco, cinza, azul etc. | Cor fixa confirmada pelo usuário | Uma cor para o teclado inteiro |
| Brilho | Quatro níveis anunciados | Usar seleção discreta; não representar como porcentagem medida |
| Gradiente espacial | Incompatível com o controle de zona única identificado | Não é possível ter lado esquerdo azul e lado direito roxo ao mesmo tempo |
| Cor por tecla / WASD separado | Sem controle independente identificado | Destaque visual do WASD não implica iluminação independente |
| Respiração, ciclo de cores, pulso nativos | Não anunciados pelo asusctl atual; pista externa de suporte | Investigar mapeamento e testar antes de habilitar |
| Transição gradual de azul para roxo no teclado inteiro | Viável como conceito via atualizações sucessivas | Ainda não implementada nem medida; não equivale a gradiente espacial |
| Padrão de piscar por software | Viável como conceito de alternância global | Exige processo ativo e controle adequado; sem garantia de suavidade |

`Aura Zones: []` não significa ausência de luz: significa que essa interface não anuncia zonas independentes. A evidência externa do TUFRGB descreve o FA607NUQ como `SingleZone`.

## Por que Static pode ser só uma limitação de detecção

O asusctl usa definições de suporte por modelo/controlador. Sua documentação explica que essas definições dependem de dados testados pela comunidade. O repositório TUFRGB inclui para `FA607NUQ` os modos `Static, Breathe, RainbowCycle, Pulse` e `Zoned([SingleZone])`.

Isso sugere investigar o mapeamento da instalação de Lucas. Não prova que todos os efeitos funcionam no firmware e kernel dele. Não vamos instalar um banco genérico nem trocar atributos do sistema em silêncio. Uma eventual correção deve ser específica, revisável, ter cópia do arquivo original e ser validada localmente.

## Animação nativa versus por software

**Nativa:** enviar o efeito uma vez; o controlador executa. Preferível quando suportada.

**Por software:** o app envia uma sequência de cores. Requer processo ativo, limite de atualizações, cancelamento e pausa ao suspender. Primeiro auditar se o caminho escolhido persiste cada atualização em disco; um loop de `asusctl aura effect static` não é uma implementação de produção.

A v0.1 usa apenas comandos pontuais. Futuras animações terão ensaio separado de latência, carga de CPU, tráfego e gravações. Não assumir 30/60 FPS nem prometer ganhos de bateria sem medir.

## Primeiro diagnóstico

Executar `bash scripts/diagnose.sh` no ASUS. O script só lê modelo, kernel, versão, estado do serviço e capacidades; não muda cores, arquivos ou serviços. Revisar o texto antes de compartilhar.

## Fontes primárias

- [asusctl: comandos e capacidades](https://github.com/OpenGamingCollective/asusctl/blob/main/docs/usage/asusctl.md).
- [rog-aura: banco de suporte e zonas](https://github.com/OpenGamingCollective/asusctl/blob/main/rog-aura/README.md).
- [TUFRGB: descrição do autor e matriz de hardware](https://github.com/YYOzcan/TUFRGB).
- [TUFRGB: entrada FA607NUQ](https://github.com/YYOzcan/TUFRGB/blob/main/asusd_user_ledmodes.ron).

As páginas consultadas usam a branch main e podem divergir da versão 6.4.0 instalada. Conferir `--help` e testes da versão local antes de implementar chamadas extras.
