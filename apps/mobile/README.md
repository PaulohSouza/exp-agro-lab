# @exp/mobile — coleta de campo (Expo, offline-first)

App React Native (Expo Router) para coleta de avaliações em campo, **offline-first**, consumindo as APIs `GET /sync/experimentos/:id` (pull) e `POST /sync/push` (push idempotente com resolução de conflito).

> ⚠️ **Fora do workspace pnpm** (evita atrito Metro+symlinks). Use **npm** aqui dentro. Os helpers de sync são uma cópia local de `packages/domain/src/sync.ts`.

## Rodar
```bash
cd apps/mobile
npm install                 # (use npm, não pnpm)
# aponte para o IP da sua máquina (não localhost) — a API deve estar em :3001
export EXPO_PUBLIC_API_BASE="http://SEU_IP_LAN:3001"
npx expo start              # abra no Expo Go (Android/iOS) ou emulador
```
Alternativa ao env: editar `app.json` → `expo.extra.apiBase`.

## Fluxo
1. **Login** (ex.: analista@demo.com / analista123).
2. **Protocolos** — lista (puxa de `/experimentos`); puxe para atualizar.
3. **Coleta** — escolhe a avaliação, digita o valor bruto por parcela → vai para a **fila local** (AsyncStorage), funciona offline.
4. **Sincronizar (N)** — envia a fila via `/sync/push`; conflitos são preservados no servidor e avisados.

## Notas
- Compila por typecheck; **runtime deve ser validado em device/emulador**.
- Coleta guarda **valor bruto** (a produtividade kg/ha é calculada só no relatório — web/API).
- Próximos: fotos por parcela, indicador de conectividade automático, persistência por SQLite.
