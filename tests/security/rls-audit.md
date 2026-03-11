# Auditoria de RLS (Segurança) - Head de Bolso v3

**Status: Pendente (Esperando Deploy das Migrations na DB Prod)**
**Framework:** Supabase Postgres RLS

## Tabela: \`agent_conversations\`

### Teste de Acesso (Vendedor)
| Cenário | Resultado Esperado | Status |
|---------|--------------------|--------|
| Vendedor A lê seu histórico | Permitido (retorna > 0 linhas) | ⏳ A testar |
| Vendedor A tenta ler Histórico de Vendedor B (Select auth.uid != seller_id) | Bloqueado (retorna 0 linhas silenciosamente) | ⏳ A testar |
| Vendedor B injetando payload forjado no ID via REST API | Bloqueado por default na Rest API (PG RLS filter on insert) | ⏳ A testar |

## Tabela: \`seller_scripts\`

### Teste CRUD (Vendedor)
| Cenário | Resultado Esperado | Status |
|---------|--------------------|--------|
| Inserção via UI com proprio UID | Inserido OK | ⏳ A testar |
| Update de Script de Outro user | Erro RLS / 0 rows affected | ⏳ A testar |
| Deleção de Script da Base Pública | Erro RLS | ⏳ A testar |

## Edge Functions (SS e Closer)

| Cenário | Resultado Esperado | Status |
|---------|--------------------|--------|
| Request Header sem Bearer JWT | HTTP 401 Unauthorized imediato no Edge Runtime | ⏳ A testar |
| Payload Injection SQL \`input_data: "'; DROP Table;"\` | Seguro, pois Postgres/Supabase_js parametriza queries nativamente. | ⏳ A testar |
| Rate Limiting (Abusive Calls para LLM) | 429 Too Many Requests (Implementação dependente do NGINX do Supabase local) | ⏳ A testar |

> O RLS está montado na Migration (ver arquivo \`20260310224500_create_agent_tables.sql\`). O passo final é rodar os testes via um Client anon auth script (Ex: Jest) ou curl requests rodando fora da Role Administrativa.
