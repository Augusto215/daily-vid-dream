# 🎯 GUIA COMPLETO: Configurar Upload YouTube

## 📋 **PASSO A PASSO RÁPIDO**

### **1. Google Cloud Console**
1. Acesse: https://console.cloud.google.com
2. Crie projeto ou selecione existente
3. **APIs e Serviços** → **Biblioteca**
4. Busque "**YouTube Data API v3**" → **Ativar**

### **2. Criar Credenciais OAuth**
1. **APIs e Serviços** → **Credenciais**
2. **Criar Credenciais** → **ID do cliente OAuth 2.0**
3. **Tipo de aplicação**: Aplicação da Web
4. **URIs de redirecionamento autorizados**:
   ```
   http://localhost:3001/auth/youtube/callback
   ```
5. **Salvar** → Anote `Client ID` e `Client Secret`

### **3. Obter Access Token (MÉTODO RÁPIDO)**
1. Vá para: https://developers.google.com/oauthplayground
2. **Step 1**: 
   - No campo de input "Input your own scopes", digite:
   ```
   https://www.googleapis.com/auth/youtube.upload
   ```
   - Clique **Authorize APIs**
3. **Step 2**: 
   - Clique **Exchange authorization code for tokens**
   - **COPIE o Access Token** (começa com `ya29.`)

### **4. Configurar no Sistema**
1. Vá para **Credentials** no seu dashboard
2. Cole o **Access Token** no campo **YouTube OAuth Access Token**
3. Clique **Save YouTube OAuth Access Token**

## ✅ **TESTE RÁPIDO**
1. Vá para **Schedule** 
2. Crie um schedule ou clique **Prepare** em um existente
3. O sistema vai:
   - ✅ Gerar vídeo
   - ✅ Criar script com OpenAI
   - ✅ Gerar áudio com ElevenLabs  
   - ✅ **FAZER UPLOAD PARA YOUTUBE AUTOMATICAMENTE!**

## 🚨 **TROUBLESHOOTING**

### **Erro 401 - Invalid Credentials**
- ✅ Verifique se o Access Token está correto
- ✅ Token expira em ~1 hora, gere novo se necessário
- ✅ Confirme que YouTube Data API v3 está ativada

### **Erro 403 - Forbidden**
- ✅ Verifique se o scope `youtube.upload` foi autorizado
- ✅ Confirme que as quotas não foram excedidas

### **Quota Exceeded**
- ✅ YouTube API tem limite diário (~1600 units por upload)
- ✅ Aguarde reset diário ou solicite aumento de quota

## 📺 **O QUE ACONTECE NO UPLOAD**

1. **OpenAI gera título e descrição** baseados no script
2. **Vídeo é postado como PÚBLICO** automaticamente
3. **Tags automáticas**: motivacional, inspiração, dailydream, ai
4. **Categoria**: People & Blogs
5. **Idioma**: Português Brasileiro

## 🎉 **RESULTADO**
- Vídeo aparece no seu canal YouTube
- Link disponível nos logs e interface
- Botão "Ver no YouTube" aparece automaticamente

---

## 🔄 **Para Uso Contínuo (Produção)**

### **Service Account (Recomendado)**
1. Google Cloud Console → **IAM e Admin** → **Contas de serviço**
2. Criar conta de serviço com permissões YouTube
3. Baixar chave JSON
4. Usar no backend para autenticação permanente

### **Refresh Token**
1. No OAuth Playground, marque "Auto-refresh the token"
2. Salve o refresh token para renovação automática
3. Implemente renovação automática no backend

---

**🚀 PRONTO! Seu sistema agora faz upload automático para YouTube!**
