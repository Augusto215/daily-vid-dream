import { useState, useCallback } from 'react';

interface YouTubeCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken: string;
  refreshToken?: string;
}

interface UploadMetadata {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
  categoryId?: string;
}

interface UploadResult {
  success: boolean;
  uploadId: string;
  youtube: {
    videoId: string;
    videoUrl: string;
    title: string;
    privacyStatus: string;
    uploadedAt: string;
  };
}

// Backend API configuration
const BACKEND_URL = 'http://localhost:3001/api';

export const useYouTubeUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null);

  // Adiciona log de upload
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setUploadLogs(prev => [...prev, logMessage]);
    console.log('YouTube Upload:', logMessage);
  }, []);

  // Upload video to YouTube
  const uploadToYouTube = useCallback(async (
    filename: string,
    metadata: UploadMetadata,
    youtubeCredentials: YouTubeCredentials
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setLastUploadResult(null);
    addLog(`🚀 Iniciando upload para YouTube: ${filename}`);

    try {
      if (!filename) {
        throw new Error('Nome do arquivo é obrigatório');
      }

      if (!metadata.title) {
        throw new Error('Título do vídeo é obrigatório');
      }

      if (!youtubeCredentials.accessToken) {
        throw new Error('Token de acesso do YouTube é obrigatório');
      }

      addLog(`📺 Título: ${metadata.title}`);
      addLog(`🔒 Privacidade: ${metadata.privacyStatus || 'private'}`);
      addLog(`🏷️ Tags: ${metadata.tags?.join(', ') || 'nenhuma'}`);
      addLog(`📝 Descrição: ${metadata.description?.length || 0} caracteres`);

      const payload = {
        filename,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        privacyStatus: metadata.privacyStatus || 'private',
        categoryId: metadata.categoryId || '22',
        youtubeCredentials
      };

      addLog(`📤 Enviando para o backend...`);
      
      const response = await fetch(`${BACKEND_URL}/upload-to-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Falha no upload para YouTube');
      }

      addLog(`✅ Upload concluído com sucesso!`);
      addLog(`🆔 Video ID: ${result.youtube.videoId}`);
      addLog(`🔗 URL: ${result.youtube.videoUrl}`);
      addLog(`👁️ Status: ${result.youtube.privacyStatus}`);
      addLog(`📅 Enviado em: ${new Date(result.youtube.uploadedAt).toLocaleString('pt-BR')}`);

      setLastUploadResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro no upload: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [addLog]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setUploadLogs([]);
  }, []);

  return {
    isUploading,
    uploadLogs,
    lastUploadResult,
    uploadToYouTube,
    clearLogs
  };
};
