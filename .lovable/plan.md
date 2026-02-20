

# Correção dos Erros de Build

## Erro 1: `TS2589` em `ClientDashboard.tsx` (linha 46)
**Causa**: O `supabase` agora pode ser `null` (quando as env vars estao ausentes). Na linha 46, o codigo chama `supabase.from('users')` diretamente sem checar se e `null`, causando o erro de tipo infinito.

**Solucao**: Adicionar guard `if (!supabase)` no inicio do `fetchData`, igual ja foi feito em outros arquivos. Todas as chamadas diretas a `supabase` nesse arquivo precisam do cast `(supabase as any)` ou do guard.

## Erro 2: `npm:openai@^4.52.5` nas Edge Functions
**Causa**: O type-checker do Deno tenta resolver tipos de `npm:openai` referenciado nos tipos internos do `@supabase/functions-js`. Nenhuma das edge functions do projeto importa `openai` diretamente — elas usam fetch para chamar APIs. Este erro vem da resolucao de tipos do Supabase CLI.

**Solucao**: Isso nao afeta o front-end nem o runtime das functions. E um falso positivo do type-check do Deno. Nao requer mudanca de codigo — so a correcao do `ClientDashboard.tsx` resolve o build do Vite.

## Mudancas

### Arquivo: `src/pages/client/ClientDashboard.tsx`
- Adicionar early return com `if (!supabase)` dentro do `fetchData`
- Isso previne chamadas a `.from()` quando o client e `null`
- O dashboard mostrara estado de loading ou vazio quando Supabase nao esta conectado

### Teste
- Apos a correcao, o app deve carregar sem erros de build
- O modo beta (login sem Supabase) continua funcionando normalmente

