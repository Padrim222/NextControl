# Instruções de Deploy (Fase P3) 🚀

A Fase P3 (Pocket Consultant) está concluída no código. Agora precisamos colocar no ar.

## 1. Deploy das Edge Functions
Execute no terminal:

```bash
# Função de Notificação (Email/Log)
npx supabase functions deploy notify-client --project-ref fgokyxoukehyfpdaglnf --no-verify-jwt

# Função de Análise (Persona "Treinador")
npx supabase functions deploy analyze-submission --project-ref fgokyxoukehyfpdaglnf --no-verify-jwt
```

## 2. Configurar Segredos (Opcional)
Se você tiver uma chave do Resend (para emails reais), configure-a:

```bash
npx supabase secrets set RESEND_API_KEY=re_123456789 --project-ref fgokyxoukehyfpdaglnf
```
*Se não configurar, o sistema apenas simulará o envio no log da função.*

## 3. Testar
1. Acesse o App (localhost ou produção).
2. Faça uma submissão como Vendedor.
3. Acesse o Painel do CS.
4. Clique em "Aprovar".
5. Verifique se o Toast "Cliente notificado" aparece.
6. Verifique os logs da função `notify-client` no Dashboard do Supabase.

## Próximo Passo (P4)
- Criar Agente Estrategista (Iori) para gerar scripts de conteúdo.
