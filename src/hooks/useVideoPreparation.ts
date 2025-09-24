import { useState, useEffect, useCallback } from 'react';
import { useGoogleDrive } from './useGoogleDrive';

// Importa o tipo DriveVideo do hook
interface DriveVideo {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

interface PreparedVideo {
  id: string;
  scheduleId: string;
  outputPath: string;
  downloadUrl?: string;
  jobId?: string;
  status: 'preparing' | 'ready' | 'error';
  createdAt: string;
  sourceVideos: string[];
  totalDuration?: number;
  videosProcessed?: number;
  error?: string;
}

interface ScheduleEntry {
  id: string;
  time: string;
  frequency: string;
  status: 'active' | 'paused';
  nextRun: string;
  lastRun?: string;
}

// Backend API configuration
const BACKEND_URL = 'http://localhost:3001/api';

export const useVideoPreparation = (schedules: ScheduleEntry[]) => {
  const [preparedVideos, setPreparedVideos] = useState<PreparedVideo[]>([]);
  const [isPreparingVideo, setIsPreparingVideo] = useState(false);
  const [preparationLogs, setPreparationLogs] = useState<string[]>([]);
  const { videos, isAuthenticated, getAccessToken } = useGoogleDrive();

  // Adiciona log de preparação
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setPreparationLogs(prev => [...prev, logMessage]);
    console.log('Video Preparation:', logMessage);
  }, []);

  // Seleciona vídeos curtos para teste (máximo 1 minuto)
  const selectRandomVideos = useCallback((count: number = 2) => {
    if (!videos || videos.length === 0) {
      addLog('Nenhum vídeo disponível no Google Drive');
      return [];
    }

    // Filtra apenas vídeos muito curtos (máximo 1 minuto = 60.000 ms)
    const videoFiles = videos.filter(video => {
      if (!video.mimeType?.startsWith('video/') || !video.webContentLink) {
        return false;
      }
      
      // Verifica duração se disponível
      if (video.videoMediaMetadata?.durationMillis) {
        const durationMs = parseInt(video.videoMediaMetadata.durationMillis);
        const maxDuration = 1 * 60 * 1000; // 1 minuto em ms
        return durationMs <= maxDuration;
      }
      
      // Se não tem metadata de duração, não inclui (para garantir que seja curto)
      return false;
    });

    if (videoFiles.length === 0) {
      addLog('Nenhum vídeo curto (≤1min) encontrado no Google Drive');
      return [];
    }

    // Seleciona vídeos aleatórios
    const shuffled = [...videoFiles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, videoFiles.length));
    
    addLog(`Selecionados ${selected.length} vídeos curtos de ${videoFiles.length} disponíveis (≤1min)`);
    selected.forEach((video, index) => {
      const duration = video.videoMediaMetadata?.durationMillis 
        ? `${Math.round(parseInt(video.videoMediaMetadata.durationMillis) / 1000)}s`
        : 'duração desconhecida';
      addLog(`  ${index + 1}. ${video.name} (${duration})`);
    });
    
    return selected;
  }, [videos, addLog]);



  // Combina vídeos usando FFmpeg real no backend
  const combineVideosWithFFmpeg = useCallback(async (selectedVideos: DriveVideo[], scheduleId: string): Promise<string | null> => {
    try {
      addLog('🚀 Iniciando combinação REAL com FFmpeg no backend...');
      
      // Verificar se está autenticado
      if (!isAuthenticated) {
        throw new Error('Usuário não está autenticado no Google Drive');
      }
      
      addLog('📋 Verificando token de acesso do Google Drive...');
      
      // Obter token de acesso do Google usando o hook
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        addLog('❌ Falha ao obter token de acesso');
        throw new Error('Token de acesso não disponível');
      }
      
      addLog('✅ Token de acesso obtido com sucesso');
      addLog(`🔑 Token: ${accessToken.substring(0, 20)}...`);
      
      addLog(`📤 Enviando ${selectedVideos.length} vídeos para o backend...`);
      
      // Lista os vídeos que serão combinados
      selectedVideos.forEach((video, index) => {
        const duration = video.videoMediaMetadata?.durationMillis 
          ? `${Math.round(parseInt(video.videoMediaMetadata.durationMillis) / 1000)}s`
          : 'duração desconhecida';
        addLog(`  📹 Vídeo ${index + 1}: ${video.name} (${duration}) - ID: ${video.id}`);
      });
      
      // Prepara payload para o backend
      const payload = {
        videos: selectedVideos.map(video => ({
          id: video.id,
          name: video.name,
          duration: video.videoMediaMetadata?.durationMillis || '0'
        })),
        accessToken,
        scheduleId
      };
      
      addLog(`📦 Payload para backend: ${JSON.stringify(payload, null, 2).substring(0, 200)}...`);
      addLog(`🌐 URL do backend: ${BACKEND_URL}/combine-videos`);
      
      // Chama o backend para processar os vídeos
      const response = await fetch(`${BACKEND_URL}/combine-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha no processamento do backend');
      }
      
      addLog(`✅ FFmpeg concluído! Arquivo: ${result.filename}`);
      addLog(`📊 Tamanho: ${result.fileSize || 'desconhecido'}`);
      addLog(`⏱️  Duração total: ${result.totalDuration || 'desconhecida'}`);
      
      // Retorna URL completa para download
      const downloadUrl = `${BACKEND_URL.replace('/api', '')}/output/${result.filename}`;
      addLog(`📥 URL de download: ${downloadUrl}`);
      
      return downloadUrl;
      
    } catch (error) {
      addLog(`❌ Erro na combinação real dos vídeos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  }, [addLog, getAccessToken, isAuthenticated]);

  // Prepara vídeo para um agendamento usando FFmpeg real
  const prepareVideoForSchedule = useCallback(async (schedule: ScheduleEntry) => {
    if (!isAuthenticated) {
      addLog('❌ Usuário não autenticado no Google Drive');
      return false;
    }

    setIsPreparingVideo(true);
    addLog(`🎬 Iniciando preparação REAL de vídeo para agendamento: ${schedule.id}`);

    try {
      // 1. Seleciona apenas 2 vídeos muito curtos para combinação real
      const selectedVideos = selectRandomVideos(2);
      if (selectedVideos.length === 0) {
        throw new Error('Nenhum vídeo curto (≤1min) selecionado para combinação');
      }

      if (selectedVideos.length < 2) {
        addLog(`⚠️  Apenas ${selectedVideos.length} vídeo encontrado, mas continuando...`);
      }

      // 2. Chama o backend para fazer download + combinação com FFmpeg real
      addLog('🔄 Enviando para backend: download + FFmpeg...');
      const outputPath = await combineVideosWithFFmpeg(selectedVideos, schedule.id);
      
      if (!outputPath) {
        throw new Error('Falha na combinação real dos vídeos com FFmpeg');
      }

      // 3. Salva informações do vídeo preparado
      const preparedVideo: PreparedVideo = {
        id: Date.now().toString(),
        scheduleId: schedule.id,
        outputPath,
        status: 'ready',
        createdAt: new Date().toISOString(),
        sourceVideos: selectedVideos.map(v => v.name)
      };

      setPreparedVideos(prev => [...prev, preparedVideo]);
      addLog(`✅ Vídeo REAL preparado com sucesso! ID: ${preparedVideo.id}`);
      addLog(`🎯 Resultado: Concatenação real de ${selectedVideos.length} vídeos via FFmpeg`);
      
      return true;

    } catch (error) {
      addLog(`❌ Erro na preparação REAL do vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Salva erro
      const errorVideo: PreparedVideo = {
        id: Date.now().toString(),
        scheduleId: schedule.id,
        outputPath: '',
        status: 'error',
        createdAt: new Date().toISOString(),
        sourceVideos: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setPreparedVideos(prev => [...prev, errorVideo]);
      return false;
      
    } finally {
      setIsPreparingVideo(false);
    }
  }, [isAuthenticated, selectRandomVideos, combineVideosWithFFmpeg, addLog]);

  // Verifica se precisa preparar vídeos (1 hora antes)
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora à frente
      
      schedules.forEach(schedule => {
        if (schedule.status !== 'active') return;
        
        const nextRun = new Date(schedule.nextRun);
        
        // Verifica se está dentro da janela de 1 hora antes
        if (now <= nextRun && nextRun <= oneHourFromNow) {
          // Verifica se já existe vídeo preparado para este agendamento
          const hasPreppedVideo = preparedVideos.some(
            pv => pv.scheduleId === schedule.id && pv.status === 'ready'
          );
          
          if (!hasPreppedVideo && !isPreparingVideo) {
            addLog(`Agendamento ${schedule.id} precisa de preparação em 1 hora`);
            prepareVideoForSchedule(schedule);
          }
        }
      });
    };

    // Verifica a cada 5 minutos
    const interval = setInterval(checkSchedules, 5 * 60 * 1000);
    
    // Verifica imediatamente
    checkSchedules();
    
    return () => clearInterval(interval);
  }, [schedules, preparedVideos, isPreparingVideo, prepareVideoForSchedule, addLog]);

  // Função manual para preparar vídeo
  const manualPrepareVideo = useCallback((scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      prepareVideoForSchedule(schedule);
    }
  }, [schedules, prepareVideoForSchedule]);

  // Limpa logs antigos
  useEffect(() => {
    const cleanOldLogs = () => {
      setPreparationLogs(prev => prev.slice(-50)); // Mantém apenas os últimos 50 logs
    };
    
    const interval = setInterval(cleanOldLogs, 10 * 60 * 1000); // A cada 10 minutos
    return () => clearInterval(interval);
  }, []);

  return {
    preparedVideos,
    isPreparingVideo,
    preparationLogs,
    manualPrepareVideo,
    clearLogs: () => setPreparationLogs([])
  };
};
