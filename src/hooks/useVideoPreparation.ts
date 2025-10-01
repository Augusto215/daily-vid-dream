import { useState, useEffect, useCallback } from 'react';
import { useGoogleDrive } from './useGoogleDrive';

const numberVideos = 20;

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
  hasAudio?: boolean; // Indicates if the final video includes generated audio
  hasBackgroundMusic?: boolean; // Indicates if the final video includes background music
  hasSubtitles?: boolean; // Indicates if the final video includes automatic subtitles
  subtitles?: {
    mode: 'vtt' | 'burn' | 'none';
    vtt?: {
      filename: string;
      url: string; // ex.: "/api/subtitles/subs_<jobId>.vtt"
    } | null;
  };
  generatedScript?: {
    script: string;
    theme: string;
    tokensUsed: number;
    generatedAt: string;
  };
  // generatedAudio removed - audio files are now temporary and deleted after use
  youtubeUpload?: {
    videoId: string;
    videoUrl: string;
    title: string;
    description: string;
    privacyStatus: string;
    uploadedAt: string;
  };
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

export const useVideoPreparation = (
  schedules: ScheduleEntry[],
  openaiApiKey?: string,
  elevenLabsApiKey?: string,
  youtubeApiKey?: string,
  enableSubtitles: boolean = true,
  subtitleMode: 'vtt' | 'burn' | 'none' = 'vtt'
) => {
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

  // Função para gerar script automaticamente após preparação do vídeo
  const generateScriptForVideo = useCallback(async (videoNames: string[], scheduleId: string): Promise<any> => {
    if (!openaiApiKey) {
      addLog('⚠️ Chave da OpenAI não fornecida, pulando geração automática de script');
      return null;
    }

    try {
      addLog('🤖 Gerando script automaticamente para o vídeo...');
      
      // Cria um prompt baseado nos nomes dos vídeos usados
      const videoContext = videoNames.length > 0 
        ? `Baseado nos vídeos: ${videoNames.join(', ')}`
        : 'Vídeo motivacional geral';
      
      const prompt = `Crie um roteiro motivacional para um vídeo inspirador de média duração. ${videoContext}. 
      Desenvolva uma narrativa envolvente e concisa com 4000-6000 caracteres que resulte em 6-8 minutos de áudio motivacional. 
      O conteúdo deve ser positivo, inspirador e adequado para pessoas que buscam crescimento pessoal e desenvolvimento. 
      Inclua histórias, exemplos práticos, reflexões e conselhos aplicáveis. Mantenha o engajamento durante toda a narração com conteúdo direto e impactante.`;

      const response = await fetch(`${BACKEND_URL}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          openaiApiKey,
          theme: 'motivacional',
          duration: '6-8 minutos',
          style: 'inspiracional e envolvente',
          language: 'português brasileiro'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.script || 'Falha na geração do script');
      }

      addLog(`✅ Script gerado automaticamente! Tokens: ${result.metadata.tokensUsed}`);
      addLog(`📝 === SCRIPT GERADO ===`);
      
      // Divide o script em linhas para melhor formatação nos logs
      const scriptLines = result.script.split('\n');
      scriptLines.forEach((line, index) => {
        if (line.trim()) {
          addLog(`📝 ${line.trim()}`);
        } else if (index < scriptLines.length - 1) {
          addLog(`📝 `); // Linha em branco
        }
      });
      
      addLog(`📝 === FIM DO SCRIPT ===`);
      
      return {
        script: result.script,
        theme: result.options.theme,
        tokensUsed: result.metadata.tokensUsed,
        generatedAt: result.metadata.generatedAt
      };

    } catch (error) {
      addLog(`❌ Erro na geração automática do script: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  }, [openaiApiKey, addLog]);

  // Função para gerar título e descrição do YouTube usando OpenAI
  const generateYouTubeMetadata = useCallback(async (script: string): Promise<any> => {
    if (!openaiApiKey) {
      addLog('⚠️ Chave da OpenAI não fornecida, usando título e descrição padrão');
      return {
        title: `Vídeo Motivacional - ${new Date().toLocaleDateString()}`,
        description: `🌟 Vídeo motivacional gerado automaticamente\n\n🤖 Gerado por AI Video Studio\n\n#motivacional #dailydream #ai #inspiração`
      };
    }

    try {
      addLog('📺 Gerando título e descrição para YouTube...');
      
      const prompt = `Baseado no seguinte script de vídeo motivacional, crie:
1. Um título atrativo para YouTube (máximo 60 caracteres)
2. Uma descrição envolvente (máximo 200 caracteres)

Script: "${script}"

Formato da resposta:
TÍTULO: [título aqui]
DESCRIÇÃO: [descrição aqui]

O título deve ser chamativo e otimizado para SEO. A descrição deve incluir emojis e hashtags relevantes.`;

      const response = await fetch(`${BACKEND_URL}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          openaiApiKey,
          theme: 'youtube metadata',
          duration: 'breve',
          style: 'otimizado para redes sociais',
          language: 'português brasileiro'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Falha na geração do metadata');
      }

      // Parse da resposta
      const text = result.script;
      const titleMatch = text.match(/TÍTULO:\s*(.+)/i);
      const descriptionMatch = text.match(/DESCRIÇÃO:\s*(.+)/i);
      
      const title = titleMatch ? titleMatch[1].trim() : `Vídeo Motivacional - ${new Date().toLocaleDateString()}`;
      const description = descriptionMatch ? descriptionMatch[1].trim() : `🌟 Conteúdo motivacional\n\n#motivacional #inspiração #dailydream`;
      
      addLog(`✅ Título gerado: "${title}"`);
      addLog(`✅ Descrição gerada: "${description}"`);
      
      return { title, description };

    } catch (error) {
      addLog(`❌ Erro na geração do metadata do YouTube: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        title: `Vídeo Motivacional - ${new Date().toLocaleDateString()}`,
        description: `🌟 Vídeo motivacional gerado automaticamente\n\n🤖 Gerado por AI Video Studio\n\n#motivacional #dailydream #ai #inspiração`
      };
    }
  }, [openaiApiKey, addLog]);

  // Função para fazer upload do vídeo para o YouTube
  const uploadToYouTube = useCallback(async (videoFilename: string, title: string, description: string): Promise<any> => {
    if (!youtubeApiKey) {
      addLog('⚠️ Chave da API do YouTube não fornecida, pulando upload');
      return null;
    }

    try {
      addLog('📺 Iniciando upload automático para YouTube...');
      addLog(`🎬 Arquivo: ${videoFilename}`);
      addLog(`📝 Título: ${title}`);
      addLog(`📄 Descrição: ${description.substring(0, 100)}...`);
      
      const response = await fetch(`${BACKEND_URL}/upload-to-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: videoFilename,
          title,
          description,
          tags: ['motivacional', 'inspiração', 'dailydream', 'ai', 'desenvolvimento pessoal'],
          privacyStatus: 'public',
          categoryId: '22', // People & Blogs
          youtubeCredentials: {
            accessToken: youtubeApiKey,
            clientId: '', // Deixe vazio se não tiver
            clientSecret: '', // Deixe vazio se não tiver
            redirectUri: 'http://localhost:8080'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Falha no upload para YouTube');
      }

      addLog(`✅ Upload para YouTube concluído!`);
      addLog(`📺 Video ID: ${result.youtube.videoId}`);
      addLog(`🔗 URL: ${result.youtube.videoUrl}`);
      addLog(`🔒 Status: ${result.youtube.privacyStatus}`);
      
      return {
        videoId: result.youtube.videoId,
        videoUrl: result.youtube.videoUrl,
        title: result.youtube.title,
        description: result.youtube.description,
        privacyStatus: result.youtube.privacyStatus,
        uploadedAt: new Date().toISOString()
      };

    } catch (error) {
      addLog(`❌ Erro no upload para YouTube: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  }, [youtubeApiKey, addLog]);

  // Seleciona vídeos aleatórios (qualquer duração)
  const selectRandomVideos = useCallback((count: number = numberVideos) => {
    if (!videos || videos.length === 0) {
      addLog('Nenhum vídeo disponível no Google Drive');
      return [];
    }

    // Filtra apenas arquivos de vídeo válidos (sem restrição de duração)
    const videoFiles = videos.filter(video => {
      if (!video.mimeType?.startsWith('video/') || !video.webContentLink) {
        return false;
      }
      
      // Aceita qualquer vídeo com metadata ou sem metadata de duração
      return true;
    });

    if (videoFiles.length === 0) {
      addLog('Nenhum arquivo de vídeo encontrado no Google Drive');
      return [];
    }

    // Seleciona vídeos aleatórios
    const shuffled = [...videoFiles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, videoFiles.length));
    
    addLog(`Selecionados ${selected.length} arquivos de ${videoFiles.length} disponíveis`);
    selected.forEach((video, index) => {
      const duration = video.videoMediaMetadata?.durationMillis 
        ? `${Math.round(parseInt(video.videoMediaMetadata.durationMillis) / 1000)}s`
        : 'duração desconhecida';
      addLog(`  ${index + 1}. ${video.name} (${duration})`);
    });
    
    return selected;
  }, [videos, addLog]);

  // Combina vídeos usando FFmpeg real no backend
  const combineVideosWithFFmpeg = useCallback(async (selectedVideos: DriveVideo[], scheduleId: string): Promise<any> => {
    try {
      addLog('🚀 Iniciando combinação REAL com FFmpeg no backend...');
      
      // Debug: verificar se as chaves de API estão chegando
      addLog(`🔑 === DEBUGGING API KEYS NO FRONTEND ===`);
      addLog(`🔍 OpenAI API Key: ${openaiApiKey ? `✅ Exists (${openaiApiKey.length} chars)` : '❌ Missing/Undefined'}`);
      addLog(`🔍 ElevenLabs API Key: ${elevenLabsApiKey ? `✅ Exists (${elevenLabsApiKey.length} chars)` : '❌ Missing/Undefined'}`);
      if (openaiApiKey) {
        addLog(`🔑 OpenAI Preview: ${openaiApiKey.substring(0, 8)}...${openaiApiKey.substring(openaiApiKey.length - 4)}`);
      }
      if (elevenLabsApiKey) {
        addLog(`🔑 ElevenLabs Preview: ${elevenLabsApiKey.substring(0, 8)}...${elevenLabsApiKey.substring(elevenLabsApiKey.length - 4)}`);
      }
      addLog(`🔑 === END API KEYS DEBUG ===`);
      
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
        scheduleId,
        openaiApiKey, // Inclui a chave da OpenAI para geração automática de script
        elevenLabsApiKey, // Inclui a chave da ElevenLabs para geração de áudio
        enableSubtitles, // Inclui a opção de legendas automáticas
        subtitleMode: 'burn', 
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
      addLog(`⏱️  Duração total: ${result.totalDuration}s`);
      addLog(`🎬 Vídeos processados: ${result.videosProcessed}`);
      
      // Se um script foi gerado no backend, exibe nos logs
      if (result.generatedScript) {
        addLog(`📝 === SCRIPT GERADO NO BACKEND ===`);
        const scriptLines = result.generatedScript.script.split('\n');
        scriptLines.forEach((line: string) => {
          if (line.trim()) {
            addLog(`📝 ${line.trim()}`);
          } else {
            addLog(`📝 `); // Linha em branco
          }
        });
        addLog(`📝 === FIM DO SCRIPT ===`);
        addLog(`🤖 Tokens utilizados: ${result.generatedScript.tokensUsed}`);
      }
      
      // Informações sobre áudio (agora temporário)
      if (result.hasAudio && elevenLabsApiKey) {
        addLog(`🎵 === ÁUDIO GERADO E INTEGRADO ===`);
        addLog(`🎤 Áudio foi gerado e integrado ao vídeo final`);
        addLog(`🗑️ Arquivo de áudio temporário foi excluído após uso`);
        addLog(`� Apenas o vídeo final está disponível para download`);
        addLog(`🎵 === FIM DO ÁUDIO ===`);
      } else if (elevenLabsApiKey && !result.hasAudio) {
        addLog(`⚠️ ElevenLabs configurado mas áudio não foi usado no vídeo final (verifique logs do servidor)`);
      } else {
        addLog(`⚠️ ElevenLabs API key não fornecida - áudio não foi gerado`);
      }
      
      // Indica se o vídeo final inclui áudio gerado
      if (result.hasAudio) {
        addLog(`🎬🎵 Vídeo final combinado com áudio gerado! Duração ajustada automaticamente.`);
      }
      
      // Indica se o vídeo final inclui música de fundo
      if (result.hasBackgroundMusic) {
        addLog(`🎵🎶 Vídeo final inclui MÚSICA DE FUNDO gerada automaticamente!`);
        addLog(`🎼 Tom ambiente de 220Hz mixado com volume baixo para não interferir.`);
      } else {
        addLog(`⚠️ Música de fundo não foi adicionada (verifique logs do servidor)`);
      }
      
      // Legendas
      if (result.hasSubtitles) {
        if (result?.subtitles?.mode === 'vtt' && result?.subtitles?.vtt?.url) {
          const base = BACKEND_URL.replace('/api', '');
          const vttUrl = `${base}${result.subtitles.vtt.url}`;
          addLog(`📝✨ LEGENDAS VTT DISPONÍVEIS! Use <track src="${vttUrl}" kind="subtitles" ... /> no <video>`);
          addLog(`🔗 VTT: ${vttUrl}`);
        } else if (result?.subtitles?.mode === 'burn') {
          addLog(`📝🔥 Legenda QUEIMADA no arquivo final (não precisa <track>)`);
        } else {
          addLog(`📝 Legendas geradas.`);
        }
      } else if (enableSubtitles && result.hasAudio) {
        addLog(`⚠️ Legendas habilitadas mas não foram adicionadas (verifique se script foi gerado)`);
      } else if (!enableSubtitles) {
        addLog(`📝❌ Legendas desabilitadas nas configurações`);
      }
      
      // Usa a URL de download fornecida pelo backend
      const downloadUrl = `${BACKEND_URL.replace('/api', '')}${result.downloadUrl}`;
      addLog(`📥 URL de download: ${downloadUrl}`);
      
      // Retorna o objeto completo com todas as informações
      return {
        downloadUrl,
        hasAudio: result.hasAudio || false,
        hasBackgroundMusic: result.hasBackgroundMusic || false,
        hasSubtitles: result.hasSubtitles || false,
        subtitles: result.subtitles ?? undefined,
        generatedScript: result.generatedScript || null,
        // generatedAudio is no longer saved as it's temporary and deleted after use
        fileSize: result.fileSize,
        totalDuration: result.totalDuration,
        videosProcessed: result.videosProcessed
      };
      
    } catch (error) {
      addLog(`❌ Erro na combinação real dos arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  }, [addLog, getAccessToken, isAuthenticated, openaiApiKey, elevenLabsApiKey, enableSubtitles, subtitleMode]);

  // Prepara vídeo para um agendamento usando FFmpeg real
  const prepareVideoForSchedule = useCallback(async (schedule: ScheduleEntry) => {
    if (!isAuthenticated) {
      addLog('❌ Usuário não autenticado no Google Drive');
      return false;
    }

    setIsPreparingVideo(true);
    addLog(`🎬 Iniciando preparação REAL de vídeo para agendamento: ${schedule.id}`);

    try {
      // 1. Primeiro, gera o script motivacional usando OpenAI
      let generatedScript = null;
      if (openaiApiKey) {
        try {
          addLog('🤖 Gerando script motivacional antes do processamento de vídeo...');
          addLog(`🔑 OpenAI API Key disponível: ${openaiApiKey.substring(0, 8)}...`);
          
          const prompt = `Crie um roteiro motivacional para um vídeo inspirador de desenvolvimento pessoal. 
          O vídeo será usado em um agendamento de postagem automática para redes sociais. 
          Desenvolva uma narrativa envolvente e concisa com 4000-6000 caracteres que resulte em 6-8 minutos de áudio motivacional.
          Crie algo que motive, inspire e engaje o público interessado em crescimento pessoal e produtividade.
          Inclua histórias, exemplos práticos, reflexões e conselhos aplicáveis de forma direta e impactante.
          
          Agendamento: ${schedule.frequency} às ${schedule.time}
          Data próxima execução: ${new Date(schedule.nextRun).toLocaleDateString('pt-BR')}`;

          addLog(`📡 Enviando requisição para ${BACKEND_URL}/generate-script...`);
          
          const response = await fetch(`${BACKEND_URL}/generate-script`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              openaiApiKey,
              theme: 'motivacional',
              duration: '6-8 minutos',
              style: 'inspiracional e envolvente',
              language: 'português brasileiro'
            }),
          });

          addLog(`📡 Response status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const result = await response.json();
            addLog(`📋 Response data: success=${result.success}`);
            
            if (result.success) {
              generatedScript = {
                script: result.script,
                theme: result.options.theme,
                tokensUsed: result.metadata.tokensUsed,
                generatedAt: result.metadata.generatedAt
              };

              addLog(`✅ Script gerado com sucesso! Tokens: ${result.metadata.tokensUsed}`);
              addLog(`📝 === SCRIPT GERADO ===`);
              
              // Divide o script em linhas para melhor forma
              const scriptLines = result.script.split('\n');
              scriptLines.forEach((line, index) => {
                if (line.trim()) {
                  addLog(`📝 ${line.trim()}`);
                } else if (index < scriptLines.length - 1) {
                  addLog(`📝 `);
                }
              });
              
              addLog(`📝 === FIM DO SCRIPT ===`);
            } else {
              addLog(`❌ Backend retornou success=false: ${result.error || 'Erro desconhecido'}`);
            }
          } else {
            const errorText = await response.text();
            addLog(`❌ Erro HTTP ${response.status}: ${errorText}`);
          }
        } catch (scriptError) {
          addLog(`⚠️ Erro ao gerar script inicial: ${scriptError instanceof Error ? scriptError.message : 'Erro desconhecido'}`);
          addLog(`🔄 Continuando com processamento do vídeo...`);
        }
      } else {
        addLog('⚠️ Chave da OpenAI não fornecida - pulando geração de script inicial');
      }

      // 2. Seleciona até ${numberVideos} arquivos para combinação real
      const selectedVideos = selectRandomVideos(numberVideos);
      if (selectedVideos.length === 0) {
        throw new Error('Nenhum arquivo selecionado para combinação');
      }

      if (selectedVideos.length < 2) {
        addLog(`⚠️  Apenas ${selectedVideos.length} arquivo encontrado, mas continuando...`);
      } else if (selectedVideos.length === numberVideos) {
        addLog(`✅ Máximo de ${numberVideos} arquivos selecionados para combinação`);
      }

      // 3. Chama o backend para fazer download + combinação com FFmpeg real
      addLog('🔄 Enviando para backend: download + FFmpeg...');
      const result = await combineVideosWithFFmpeg(selectedVideos, schedule.id);
      
      if (!result || !result.downloadUrl) {
        throw new Error('Falha na combinação real dos arquivos com FFmpeg');
      }

      // 3. Script já foi gerado automaticamente no backend durante a combinação
      addLog('📝 Script gerado automaticamente no backend durante processamento FFmpeg');

      // 4. Salva informações do vídeo preparado (inclui script e áudio se disponíveis)
      const preparedVideo: PreparedVideo = {
        id: Date.now().toString(),
        scheduleId: schedule.id,
        outputPath: result.downloadUrl,
        downloadUrl: result.downloadUrl,
        status: 'ready',
        createdAt: new Date().toISOString(),
        sourceVideos: selectedVideos.map(v => v.name),
        totalDuration: result.totalDuration,
        videosProcessed: result.videosProcessed,
        hasAudio: result.hasAudio || false,
        hasBackgroundMusic: result.hasBackgroundMusic || false,
        hasSubtitles: result.hasSubtitles || false,
        subtitles: result.subtitles ?? undefined,
        generatedScript: result.generatedScript || generatedScript || undefined,
        // generatedAudio is no longer included as it's temporary
      };

      setPreparedVideos(prev => [...prev, preparedVideo]);
      addLog(`✅ Vídeo REAL preparado com sucesso! ID: ${preparedVideo.id}`);
      addLog(`🎯 Resultado: Concatenação real de ${selectedVideos.length} vídeos via FFmpeg`);
      
      if (preparedVideo.hasAudio) {
        addLog(`🎬🎵 VÍDEO COMBINADO COM ÁUDIO! O vídeo final inclui narração gerada automaticamente.`);
        addLog(`⏱️ Duração do vídeo foi ajustada para coincidir com a duração do áudio.`);
      }
      
      if (preparedVideo.hasBackgroundMusic) {
        addLog(`🎵🎶 MÚSICA DE FUNDO ADICIONADA! O vídeo inclui música ambiente de fundo.`);
      }
      
      if (preparedVideo.subtitles?.mode === 'vtt' && preparedVideo.subtitles?.vtt?.url) {
        const base = BACKEND_URL.replace('/api', '');
        addLog(`📝 VTT pronto: ${base}${preparedVideo.subtitles.vtt.url}`);
      } else if (preparedVideo.subtitles?.mode === 'burn') {
        addLog('📝🔥 Legenda foi QUEIMADA no arquivo final.');
      }

      if (preparedVideo.generatedScript || generatedScript) {
        const scriptToUse = preparedVideo.generatedScript || generatedScript;
        addLog(`📝 Script foi gerado com ${scriptToUse.tokensUsed} tokens!`);
        
        if (preparedVideo.hasAudio && preparedVideo.hasBackgroundMusic) {
          addLog(`🎬🎵🎤🎶 Vídeo + Áudio + Script + Música prontos! Vídeo completo com narração e música de fundo.`);
        } else if (preparedVideo.hasAudio) {
          addLog(`🎬🎵🎤 Vídeo + Áudio + Script prontos! O vídeo já tem narração incorporada.`);
        } else if (preparedVideo.hasBackgroundMusic) {
          addLog(`🎬📝🎶 Vídeo + Script + Música prontos! Use o script para legendas/descrição.`);
        } else {
          addLog(`🎬📝 Vídeo + Script prontos! Use o script para legendas/descrição.`);
        }
      } else {
        addLog(`⚠️ Script não foi gerado (verifique se a chave da OpenAI está configurada)`);
        
        if (preparedVideo.hasAudio && preparedVideo.hasBackgroundMusic) {
          addLog(`🎬🎵🎶 Vídeo completo com áudio e música pronto para download!`);
        } else if (preparedVideo.hasAudio) {
          addLog(`🎬🎵 Vídeo com áudio pronto para download!`);
        } else if (preparedVideo.hasBackgroundMusic) {
          addLog(`🎬🎶 Vídeo com música de fundo pronto para download!`);
        } else {
          addLog(`🎬 Vídeo pronto para download!`);
        }
      }
      
      // Audio files are no longer available for separate download (they're temporary)
      addLog(`🎤 Arquivo de áudio foi integrado ao vídeo e excluído (não disponível separadamente).`);
      
      // Log summary of all available files
      try {
        addLog(`\n📋 === LISTANDO TODOS OS ARQUIVOS DISPONÍVEIS ===`);
        const summaryResponse = await fetch(`${BACKEND_URL}/files/summary`);
        if (summaryResponse.ok) {
          const summaryData = await responseToJsonSafe(summaryResponse);
          if (summaryData?.success) {
            const { summary } = summaryData;
            addLog(`📊 Total de arquivos: ${summary.totalFiles}`);
            addLog(`📹 Vídeos: ${summary.videoCount} | 🎵 Com música: ${summary.withMusicCount} | 🔊 Áudios: ${summary.audioCount}`);
            addLog(`💾 Espaço total: ${summary.totalSizeMB.toFixed(1)}MB`);
            if (summary.newestFile) {
              addLog(`🆕 Arquivo mais recente: ${summary.newestFile.filename} (${summary.newestFile.sizeMB}MB)`);
            }
            addLog(`🔗 Acesse a aba "Downloads" para gerenciar todos os arquivos`);
          }
        }
        addLog(`📋 === FIM DA LISTA ===\n`);
      } catch (summaryError) {
        addLog(`⚠️ Erro ao obter resumo de arquivos: ${summaryError instanceof Error ? summaryError.message : 'Erro desconhecido'}`);
      }

      // 5. Upload automático para YouTube (se API key estiver disponível e válida)
      let youtubeUploadResult = null;
      if (youtubeApiKey && youtubeApiKey.length > 50 && (preparedVideo.generatedScript || generatedScript)) {
        try {
          addLog('📺 === INICIANDO UPLOAD AUTOMÁTICO PARA YOUTUBE ===');
          
          // Gerar título e descrição usando OpenAI
          const scriptToUse = preparedVideo.generatedScript || generatedScript;
          const youtubeMetadata = await generateYouTubeMetadata(scriptToUse.script);
          
          // Extrair nome do arquivo do outputPath
          const videoFilename = preparedVideo.outputPath 
            ? preparedVideo.outputPath.split('/').pop() || `video_${preparedVideo.scheduleId}_${preparedVideo.id}.mp4`
            : `video_${preparedVideo.scheduleId}_${preparedVideo.id}.mp4`;
          
          // Fazer upload para YouTube
          youtubeUploadResult = await uploadToYouTube(
            videoFilename,
            youtubeMetadata.title,
            youtubeMetadata.description
          );
          
          if (youtubeUploadResult) {
            addLog('🎉 UPLOAD PARA YOUTUBE CONCLUÍDO COM SUCESSO!');
            addLog(`📺 Vídeo público disponível em: ${youtubeUploadResult.videoUrl}`);
            
            // Atualizar o vídeo preparado com informações do YouTube
            preparedVideo.youtubeUpload = youtubeUploadResult;
            
            // Atualizar o state com as informações do YouTube
            setPreparedVideos(prev => 
              prev.map(pv => 
                pv.id === preparedVideo.id 
                  ? { ...pv, youtubeUpload: youtubeUploadResult }
                  : pv
              )
            );
          }
          
        } catch (youtubeError) {
          addLog(`❌ Erro no upload para YouTube: ${youtubeError instanceof Error ? youtubeError.message : 'Erro desconhecido'}`);
          addLog('⚠️ Vídeo foi preparado com sucesso, mas não foi postado no YouTube');
        }
      } else if (!youtubeApiKey) {
        addLog('⚠️ API key do YouTube não fornecida - pulando upload automático');
      } else {
        addLog('⚠️ Script não disponível - necessário para gerar título/descrição do YouTube');
      }
      
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
  }, [isAuthenticated, selectRandomVideos, combineVideosWithFFmpeg, addLog, generateScriptForVideo, generateYouTubeMetadata, uploadToYouTube, youtubeApiKey, openaiApiKey, elevenLabsApiKey]);

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

// Helper para parse seguro
async function responseToJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
