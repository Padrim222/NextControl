# 🧠 Brainstorm: Call Upload Video -> Áudio -> Transcrição

### Contexto
Temos o "real desafio": o cliente precisa subir a gravação de uma Call (em `.mp4` ou similar, podendo chegar a 500MB+) para transcrevermos e analisarmos a venda. 
Entretanto:
1. **Não queremos entupir o Supabase Storage** com vídeos de 500MB+ de cada cliente (custos sobem, limites estouram).
2. **Não queremos depender profundamente da API do Google Drive** em Edge Functions (quebra de streams de arquivos grandes, falhas por falta de permissão).
3. **Não podemos piorar o UX do cliente** (eles não sabem converter arquivos sozinhos, tem que ser mágico para eles).

Como resolver o gargalo da nuvem e do processamento de vídeo de forma inteligente?

---

### Opção A: Processamento Client-Side (FFmpeg.wasm) 🔥 *Recomendado*

O usuário escolhe o vídeo `.mp4` dentro da plataforma da Next Control.
Magicamente, *o próprio navegador do usuário* utiliza uma biblioteca (FFmpeg.wasm) para rasgar o vídeo e **extrair apenas o áudio** `.mp3` localmente.
Após extrair (demora ~1 minuto), fazemos o upload *apenas do áudio de 20MB* para o Supabase e chamamos a Edge Function para transcrição.

✅ **Prós:**
- **Custo de storage do vídeo: ZERO.** Nunca armazenamos vídeos pesados.
- **Limites da Edge Function:** Como passa apenas 20MB de áudio, nunca vamos estourar limites de memória (256MB) no Supabase.
- **UX Perfeita:** Para o cliente, a tela diz "Lendo o vídeo..." e magicamente sobe a call. Sem Google Drive.

❌ **Contras:**
- Pode usar bateria/processamento do dispositivo do usuário (notebook). Mas extrair áudio é uma operação leve comparada a renderização de vídeo.
- Pode dar crash em celulares muito velhos (mas B2B sellers geralmente estão em desktops/laptops).

📊 **Esforço:** Médio (Requer configurar o `ffmpeg` package na UI React).

---

### Opção B: Upload Bruto + Worker Temporário (Immediate Deletion)

O usuário sobe o vídeo pesado (500MB) inteiro para o Supabase Storage. Um webhook aciona um Worker Externo dedicado (um VPS nosso ou serviço como Modal/AWS Lambda) que puxa o vídeo, separa o áudio, transcreve e **imediata e obrigatoriamente deleta o vídeo do Supabase** em seguida.

✅ **Prós:**
- Nenhum processamento no PC do cliente.
- Edge Functions não dão timeout porque usamos um servidor separado (Worker) para a conversão.

❌ **Contras:**
- **Tempo de Upload longo:** O cliente tem que esperar o upload de 500MB inteiro para a internet dele.
- Mais caro: Precisamos manter/pagar um servidor extra rodando Python/Node com limites altos apenas para fazer o parse diário dos vídeos.
- Overhead na internet (Supabase Egress Transfer limits).

📊 **Esforço:** Alto (Precisaríamos criar um worker externo/VPS DevOps).

---

### Opção C: Parse de Link Público do Google Drive (A Ideia Original)

O usuário sobe o vídeo no próprio Google Drive e gera um "Link Público" e cola no nosso form.
Nossa Edge Function tenta capturar a stream do Google Drive em pedaços e jogar o áudio pro Groq Whisper.

✅ **Prós:**
- Nenhum espaço usado no Supabase. O vídeo fica no drive do cliente.

❌ **Contras:**
- **Barreira de UX alta:** O cliente tem que subir, ir no GDrive, mexer nas permissões "Qualquer um" (clientes ruins de tecnologia se perdem aqui). Se enviarem privado, a pipeline falha.
- O Google adora bloquear automações em arquivos de GDrive com "Aviso de verificação de vírus" interrompendo a stream de conversão do Edge Function. Rate limits constantes.

📊 **Esforço:** Alto (Fazer stream chunk-by-chunk de vídeo no Deno Edge Function batendo no Drive).

---

## 💡 Recomendação da Orquestração (Product Owner + DevOps)

**Opção A (FFmpeg.wasm no Client-Side)** porque ela resolve 100% o problema do custo de storage e timeout de backend distribuindo o esforço computacional pela máquina dos vendedores, e a Experiência de Uso (UX) continua maravilhosa (eles só anexam o arquivo MP4 e esperam a tela terminar tudo).

O que você diz, Boss? Qual direção devemos seguir para matar esse desafio final da Sprint 1?
