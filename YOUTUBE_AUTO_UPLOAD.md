# 📺 Upload Automático para YouTube

## Visão Geral

O sistema agora faz upload automático dos vídeos gerados diretamente para o YouTube, sem necessidade de intervenção manual. O processo completo acontece automaticamente após a geração do vídeo, script e áudio.

## 🚀 Como Funciona

### Fluxo Automático
1. **Geração do Vídeo**: Sistema combina vídeos do Google Drive usando FFmpeg
2. **Geração do Script**: OpenAI cria script motivacional baseado nos vídeos
3. **Geração do Áudio**: ElevenLabs converte script em áudio narrado
4. **Combinação Final**: Vídeo é combinado com áudio (sem áudio original)
5. **🆕 Upload para YouTube**: Vídeo é automaticamente postado como público
6. **🆕 Geração de Título/Descrição**: OpenAI cria título e descrição otimizados

### Configuração das APIs

#### 1. YouTube API Key (Access Token)
- Configure no painel **Credentials** → **YouTube Configuration**
- Use o Access Token da Google Cloud Console
- **Importante**: O vídeo será postado como **público** automaticamente

#### 2. OpenAI API Key
- Necessária para gerar:
  - Script motivacional
  - Título do vídeo (máximo 60 caracteres)
  - Descrição do vídeo (máximo 200 caracteres)

#### 3. ElevenLabs API Key
- Para geração do áudio narrado
- O áudio substitui completamente o áudio original dos vídeos

## 📋 Processo Detalhado

### 1. Preparação do Vídeo
```
🎬 Selecionar vídeos curtos (≤1min) do Google Drive
📥 Download dos vídeos para o servidor
🔧 Normalização com FFmpeg (resolução, frame rate, codec)
🎞️ Concatenação dos vídeos
```

### 2. Geração de Conteúdo
```
🤖 OpenAI gera script motivacional (português brasileiro)
🎤 ElevenLabs converte script em áudio MP3
🎬 FFmpeg combina vídeo + áudio (ajusta duração)
```

### 3. Upload Automático para YouTube
```
📝 OpenAI gera título e descrição para YouTube
📺 Upload automático para YouTube como público
🔗 Retorna Video ID e URL do YouTube
✅ Disponibiliza links para visualização
```

## 🎯 Recursos Automáticos

### Título Gerado pela IA
- Máximo 60 caracteres
- Otimizado para SEO
- Baseado no script do vídeo

### Descrição Gerada pela IA
- Máximo 200 caracteres
- Inclui emojis e hashtags
- Contextual ao conteúdo

### Tags Automáticas
- `motivacional`
- `inspiração`
- `dailydream`
- `ai`
- `desenvolvimento pessoal`

### Configurações do YouTube
- **Privacidade**: Público
- **Categoria**: People & Blogs (ID: 22)
- **Idioma**: Português Brasileiro
- **Conteúdo Infantil**: Não

## 📊 Interface do Usuário

### Schedule Panel
- ✅ Indica quando vídeo foi postado no YouTube
- 🔗 Botão "Ver no YouTube" para vídeos publicados
- 📺 Mostra Video ID nos logs
- 📝 Exibe script gerado automaticamente

### Logs Detalhados
```
📺 === INICIANDO UPLOAD AUTOMÁTICO PARA YOUTUBE ===
✅ Título gerado: "Vídeo Motivacional Inspirador"
✅ Descrição gerada: "🌟 Conteúdo para seu crescimento pessoal..."
📺 Iniciando upload automático para YouTube...
✅ Upload para YouTube concluído!
📺 Video ID: dQw4w9WgXcQ
🔗 URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
🎉 UPLOAD PARA YOUTUBE CONCLUÍDO COM SUCESSO!
```

## ⚙️ Configuração

### 1. APIs Necessárias
- **OpenAI**: Para script, título e descrição
- **ElevenLabs**: Para áudio narrado
- **YouTube Data API v3**: Para upload de vídeos

### 2. Permissões YouTube
- Scope necessário: `https://www.googleapis.com/auth/youtube.upload`
- API habilitada: YouTube Data API v3
- Quota mínima: 1600 units por upload

### 3. Credenciais

#### YouTube OAuth Access Token:
1. **Google Cloud Console**: console.cloud.google.com
2. **Ativar YouTube Data API v3**
3. **Criar OAuth 2.0 Client ID**:
   - Tipo: Aplicação da Web
   - Redirect URI: `http://localhost:3001/auth/youtube/callback`
4. **Obter Access Token**:
   - Use OAuth 2.0 Playground: developers.google.com/oauthplayground
   - Scope: `https://www.googleapis.com/auth/youtube.upload`
   - **⚠️ Access Tokens expiram em ~1 hora**

#### Solução Temporária:
- Configure um Access Token válido no painel Credentials
- Para produção: implemente refresh token ou Service Account

## 🔧 Backend

### Endpoint: `/api/upload-to-youtube`
- Recebe filename, título, descrição
- Upload via Google APIs Node.js
- Retorna Video ID e URL

### Validações
- ✅ Arquivo de vídeo existe
- ✅ Access Token válido
- ✅ Título obrigatório
- ✅ Metadados corretos

## 📈 Benefícios

1. **Automação Completa**: Zero intervenção manual
2. **Conteúdo Otimizado**: Títulos e descrições por IA
3. **Publicação Imediata**: Vídeos públicos automaticamente
4. **Rastreabilidade**: Logs completos do processo
5. **Escalabilidade**: Processo automático para múltiplos vídeos

## 🚨 Considerações

- **Quota YouTube**: Cada upload consome ~1600 units
- **Limite Diário**: Quota padrão permite ~100 uploads/dia
- **Conteúdo**: Vídeos são postados como públicos
- **Moderação**: YouTube pode revisar vídeos automaticamente
- **Duração**: Vídeos ajustados para duração do áudio

## 🎪 Exemplo de Uso

1. Configure as 3 API keys (OpenAI, ElevenLabs, YouTube)
2. Crie um schedule no Schedule Panel
3. Sistema automaticamente:
   - Seleciona vídeos do Google Drive
   - Gera script motivacional
   - Cria áudio narrado
   - Combina vídeo + áudio
   - Gera título e descrição
   - Faz upload para YouTube como público
   - Fornece link para visualização

**Resultado**: Vídeo motivacional completo postado automaticamente no YouTube! 🎉
