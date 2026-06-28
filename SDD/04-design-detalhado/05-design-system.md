# 05 — Design System (tema azul do TCC)

Tema visual derivado do TCC/sistema base (`base-projeto/exp-agrolab`) e dos prints. Centralizado em `packages/ui` (tokens + componentes).

## Paleta — azul do TCC
| Token | Hex | Uso |
|---|---|---|
| `--navy-900` | `#141B2D` | Sidebar / fundo mais escuro |
| `--navy-800` | `#1F2940` | Top bar, cabeçalhos de tabela (faixa T1/T2 dos tratamentos), títulos |
| `--navy-700` | `#2A2E3F` | Superfícies escuras secundárias |
| `--blue-600` | `#2D6CDF` | Cor de marca / links / foco primário |
| `--sky-500` | `#4EC2F0` | Accent / info / botões "Exportar" |
| `--slate-500` | `#7987A1` | Texto secundário |
| `--bg` | `#F9F9FB` | Fundo de página (web clara) |
| `--surface` | `#FFFFFF` | Cards |

### Semânticas (dos prints)
| Token | Hex | Uso |
|---|---|---|
| `--success` | `#6FA830` | Ações primárias (Editar, Lançar, Confirmar) — botões verdes |
| `--warning` | `#F3C17A` | Status "Inserindo" / avisos |
| `--danger` | `#F34343` | Excluir / recusar |
| `--info` | `#4EC2F0` | Exportar / informativo |

### Cores de croqui (por bloco/tratamento)
Tons suaves rotativos por coluna/bloco (como no print): rosa `#F6A6A6`, pêssego `#F8C99B`, amarelo `#F5E69B`, verde `#A8E0B0`… Gerados de forma estável por índice de tratamento.

## Tipografia
- Família: sistema/Inter (UI). Títulos em `--navy-800`, peso 600+.
- Tabelas densas (tratamentos/avaliações): fonte 13–14px, cabeçalho em faixa `--navy-800` com texto branco.

## Componentes-base
- **Botão** (variantes: success/info/danger/ghost), **Tabs** (abas do protocolo), **DataTable** (lista + filtros), **GridCroqui** (parcelas), **Badge de status**, **Form fields**.
- Acessibilidade: contraste AA; foco visível (`--blue-600`).

## Referência
- Cores extraídas de `base-projeto/exp-agrolab/assets/css/*` (navy `#1F2940`/`#141B2D`, sky `#4EC2F0`) e dos prints (`prints-projeto-exemplo/`).
