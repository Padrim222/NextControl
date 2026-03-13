# Planejamento do Projeto: Upload de Vídeo com FFmpeg Client-Side

**Objetivo:** Implementar o processamento local (no navegador do vendedor) de vídeos `.mp4` pesados (ex: 500MB) para extrair apensas o áudio `.mp3` (ex: 20MB) utilizando a biblioteca `FFmpeg.wasm`. Isso eliminará custos de armazenamento de vídeos na nuvem e gargalos de processamento, enviando apenas o arquivo de áudio necessário para a transcrição.
**Nota Especial do Usuário:** É necessário "explicar depois como de fato ela funciona" para os vendedores, portanto, a UI precisa educar o usuário sobre o processo mágico que acontece no navegador dele.

---

## 🛠 Atribuição de Agentes
- `project-planner`: Definição detalhada do passo-a-passo (este documento).
- `frontend-specialist`: Implementação do WebAssembly (FFmpeg) na UI (React via Vite), gerenciamento de estado (progresso 0-100%), UI educativa no formulário.
- `backend-specialist`: Ajustes na rota existente de upload de áudio (`transcribe-audio` ou similar) no Supabase (se necessário tratar os metadados recebidos).
- `devops-engineer`: Liberação de headers requeridos por SharedArrayBuffer no deploy e configuração das dependências estáticas do ffmpeg core no Vite.

---

## 📋 Divisão de Tarefas (Task Breakdown)

### Fase 1: Infraestrutura WebAssembly (FFmpeg)
1. **[ ] 1.1 Configurar Headers de Cross-Origin Isolation no Vite:**
   - Para que o FFmpeg.wasm (multi-thread ou single-thread) atinja performance aceitável processando 500MB de vídeo no navegador do cliente, headers específicos são mandatórios:
     - `Cross-Origin-Embedder-Policy: require-corp`
     - `Cross-Origin-Opener-Policy: same-origin`
   - Tarefa: Configurar `vite.config.ts` para injetar esses headers no ambiente de desenvolvimento (`server.headers`).

2. **[ ] 1.2 Instalar Dependências no Frontend:**
   - Instalar libs core: `@ffmpeg/ffmpeg` e `@ffmpeg/util` (versão 0.12 ou superior).

### Fase 2: Serviço Angular do Frontend
3. **[ ] 2.1 Criar Serviço `lib/audio-extractor.ts`:**
   - Serviço ou custom hook React para inicializar o FFmpeg assincronamente (caregar dependências binárias `.wasm`).
   - Criar uma função para receber um `File` (.mp4, .mkv, .mov), gravá-lo no sistema de arquivos virtual do FFmpeg.
   - Executar o comando FFmpeg (ex: `-i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3`).
   - Monitorar o log output para calcular a porcentagem percentual de progresso do transcode.
   - Retornar um arquivo final Blob/File (`.mp3`) contendo apenas o áudio.

### Fase 3: Experiência Educativa do Usuário (UI)
4. **[ ] 3.1 Atualizar `SellerForm` / Upload UI:**
   - Modificar o widget de anexar chamada/arquivo de vendas.
   - **Educação do Usuário:** Adicionar um aviso educativo proativo e bonito: *"Para economizar sua internet e bater a transcrição Rápida, nós otimizamos seu vídeo na sua própria máquina antes do envio 🪄"*.
   - Renderizar barra de progresso em tempo real que exibe porcentagens ("Extraindo áudio da chamada... X%").
   - Bloquear a navegação aba/tab para evitar que o vendedor feche o site enquanto o FFmpeg tritura o vídeo.

5. **[ ] 3.2 Otimizar Tratamento de Sucesso/Falha:**
   - Lidar com navegadores que não suportam WASM (fallback elegante instruindo o vendedor ou rejeitando adequadamente).
   - Quando o arquivo .mp3 sair do FFmpeg, re-usar a infraestrutura atual que sobe *blobs* de áudio pro bucket do Supabase e inicia as submissões normais.

### Fase 4: Otimização Pós-Lançamento (Backend)
6. **[ ] 4.1 Segurança & CORS em Produção (Vercel ou Server):**
   - Garantir que os headers essenciais de isolamento (Feature 1.1) sejam provisionados no provedor de *hosting* final (exemplo: `headers` no `vercel.json` ou `_headers` do Cloudflare/Netlify) para o WebAssembly funcionar sem quebrar em Prod.
   - Desativar limitações massivas de upload de vídeo, dado que o `bucket` de chamadas agora receberá quase exclusivamente arquivos de áudio (<30MB) da interface do cliente.

---

## ✅ Check-list de Verificação (Verification Checklist)
- [ ] Pegar um arquivo `.mp4` de pelo menos 100MB; submetê-lo no frontend sem o console estourar erro de memória.
- [ ] O Storage do Supabase recebe e armazena **apenas** o arquivo final `.mp3` extraído e com tamanho radicalmente reduzido (< 20MB).
- [ ] O progresso (1 a 100%) da conversão aparece gradualmente na interface do cliente, de forma transparente.
- [ ] A chamada de API final de *transcrição* (`analyze-call`, Whisper) consegue compreender perfeitamente o som injetado da conversão para áudio.
