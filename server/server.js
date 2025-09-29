// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const OpenAI = require('openai');
const { ElevenLabs } = require('@elevenlabs/elevenlabs-js');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3001;

// OpenAI client will be initialized per request with the API key from frontend

// Middleware
app.use(cors());    
app.use(express.json());

// Diretórios temporários
const TEMP_DIR = path.join(__dirname, 'temp');
const OUTPUT_DIR = path.join(__dirname, 'output');
const AUDIOS_DIR = path.join(__dirname, 'audios');

// Ensure directories exist
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(AUDIOS_DIR);

// Helper function to download video from Google Drive
async function downloadVideoFromGoogleDrive(videoId, accessToken, filePath) {
  try {
    console.log(`[${videoId}] Starting download...`);
    console.log(`[${videoId}] Saving to: ${filePath}`);
    
    const response = await axios({
      method: 'GET',
      url: `https://www.googleapis.com/drive/v3/files/${videoId}?alt=media`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'stream',
      timeout: 60000 // 60 second timeout for initial connection
    });

    console.log(`[${videoId}] Response received, starting file write...`);
    
    const writer = fs.createWriteStream(filePath);
    let downloadedBytes = 0;
    
    // Track download progress
    let lastLoggedMB = 0;
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const currentMB = Math.round(downloadedBytes / (1024 * 1024));
      if (currentMB > lastLoggedMB && currentMB % 10 === 0) { // Log every 10MB
        console.log(`[${videoId}] Downloaded: ${currentMB}MB`);
        lastLoggedMB = currentMB;
      }
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        writer.destroy();
        reject(new Error(`Download timeout for video ${videoId}`));
      }, 300000); // 5 minute total timeout for large videos
      
      writer.on('finish', () => {
        clearTimeout(timeout);
        const sizeInMB = Math.round(downloadedBytes / (1024 * 1024));
        console.log(`[${videoId}] Download completed successfully - ${sizeInMB}MB`);
        resolve(filePath);
      });
      
      writer.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[${videoId}] Write error:`, err.message);
        reject(err);
      });
      
      response.data.on('error', (err) => {
        clearTimeout(timeout);
        writer.destroy();
        console.error(`[${videoId}] Stream error:`, err.message);
        reject(err);
      });
      
      response.data.on('end', () => {
        console.log(`[${videoId}] Stream ended, waiting for file write to finish...`);
      });
    });
  } catch (error) {
    console.error(`[${videoId}] Download failed:`, error.message);
    throw error;
  }
}

// Helper function to get video duration using FFmpeg
function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

// Helper function to get audio duration using FFmpeg
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
}

// Helper function to generate video script using OpenAI GPT
async function generateVideoScript(prompt, options = {}, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Initialize OpenAI client with the provided API key
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const {
      theme = 'motivacional',
      duration = '6-8 minutos',
      style = 'explicativo',
      language = 'português brasileiro'
    } = options;

    // Determinar o tamanho do roteiro baseado na duração
    const isDurationLong = duration.includes('15') || duration.includes('20') || duration.includes('longo');
    const targetLength = isDurationLong ? '12000-18000' : '4000-6000';
    const targetMinutes = isDurationLong ? '15-20' : '6-8';

    const systemPrompt = `Você é um especialista em criação de roteiros para áudio/narração de vídeos motivacionais e informativos. 
Crie textos que sejam:
- ${isDurationLong ? 'MUITO LONGOS E DETALHADOS' : 'CONCISOS E IMPACTANTES'}, com ${targetLength} caracteres para gerar ${targetMinutes} minutos de áudio
- Fluidos e naturais para leitura em voz alta
- Emocionalmente envolventes, motivacionais e inspiradores
- Ricos em exemplos, histórias e metáforas
- ${isDurationLong ? 'Com desenvolvimento profundo do tema' : 'Com conteúdo direto e focado'}
- Adequados para pessoas que buscam crescimento pessoal
- Com linguagem ${style}
- Em ${language}
- Com duração aproximada de ${duration} quando convertido em áudio
- SEM títulos, subtítulos ou formatação markdown
- APENAS texto corrido contínuo para ser lido como narração
- Com transições suaves entre ideias
- Incluindo reflexões, conselhos práticos e motivação`;

    const userPrompt = `Crie um roteiro ${isDurationLong ? 'extenso' : 'conciso'} e motivacional para narração de vídeo com tema: ${theme}
    
Baseado no seguinte contexto ou ideia: ${prompt}

REQUISITOS OBRIGATÓRIOS:
- ${isDurationLong ? 'MÍNIMO 12000-18000' : 'ENTRE 4000-6000'} CARACTERES para gerar ${targetMinutes} minutos de áudio
- ${isDurationLong ? 'Desenvolva o tema de forma profunda e abrangente' : 'Desenvolva o tema de forma focada e impactante'}
- Inclua histórias inspiradoras, exemplos práticos e reflexões
- Use linguagem envolvente ${isDurationLong ? 'que mantenha a atenção por muito tempo' : 'e direta que prenda a atenção'}
- Crie um fluxo narrativo que evolui naturalmente
- ${isDurationLong ? 'Adicione elementos de suspense e descoberta' : 'Seja direto mas envolvente'}
- Inclua conselhos práticos aplicáveis
- Use metáforas e analogias para ilustrar conceitos
- Mantenha tom motivacional e esperançoso do início ao fim
- Gere APENAS o texto corrido, sem títulos, sem formatação, sem estruturas markdown
- O texto deve fluir perfeitamente para leitura em voz alta
- Priorize fluidez, ritmo e engajamento para áudio ${isDurationLong ? 'longo' : 'de média duração'}
- Não use asteriscos, hashtags, números ou qualquer formatação especial
- Crie pausas naturais através de pontuação adequada`;

    console.log('Generating video script with OpenAI...');
    console.log(`Target length: ${targetLength} characters for ${targetMinutes} minutes`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: isDurationLong ? 15000 : 8000, // Adjusted tokens based on duration
      temperature: 0.8,
    });

    const script = completion.choices[0].message.content;
    console.log('Video script generated successfully');
    
    return {
      script,
      theme,
      duration,
      style,
      language,
      tokensUsed: completion.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('Error generating video script:', error.message);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

// Helper function to test ElevenLabs API key validity
async function testElevenLabsApiKey(apiKey) {
  try {
    console.log('🔑 Testing ElevenLabs API key connectivity...');
    
    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/user',
      headers: {
        'xi-api-key': apiKey,
        'User-Agent': 'DailyVidDream/1.0'
      },
      timeout: 30000, // Aumentado para 30 segundos
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Resolve para qualquer status abaixo de 500
      }
    });
    
    if (response.status === 200) {
      console.log('✅ ElevenLabs API key is valid');
      console.log('User info:', response.data);
      return { valid: true, user: response.data };
    } else {
      console.error(`❌ ElevenLabs API returned status ${response.status}:`, response.data);
      return { valid: false, error: `API returned status ${response.status}: ${JSON.stringify(response.data)}` };
    }
  } catch (error) {
    console.error('❌ ElevenLabs API key test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Connection timeout - check your internet connection');
      return { valid: false, error: 'Connection timeout - check your internet connection and try again' };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('Network connectivity issue');
      return { valid: false, error: 'Network connectivity issue - check your internet connection' };
    } else if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response data:', error.response.data);
      return { valid: false, error: error.response.data || `HTTP ${error.response.status}` };
    } else {
      return { valid: false, error: error.message };
    }
  }
}

// Helper function to generate audio from text using ElevenLabs
async function generateAudioFromText(text, outputPath, elevenLabsApiKey) {
  try {
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key is required');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    // Verificação de tamanho do texto
    if (text.length > 15000) {
      console.log(`⚠️ Text is very large (${text.length} chars). This may take longer to process.`);
      console.log(`💡 Consider breaking into smaller chunks for faster processing.`);
    }

    console.log('🎤 Generating audio with ElevenLabs...');
    console.log(`Text preview: "${text.substring(0, 100)}..."`);
    console.log(`Text length: ${text.length} characters`);
    console.log(`⏱️ Calculated timeout: ${getTimeoutForTextLength(text.length)/1000}s`);
    console.log(`Output path: ${outputPath}`);
    console.log(`API Key length: ${elevenLabsApiKey.length} characters`);
    console.log(`API Key preview: ${elevenLabsApiKey.substring(0, 8)}...${elevenLabsApiKey.substring(elevenLabsApiKey.length - 4)}`);

    // Test API key validity first
    console.log('Testing ElevenLabs API key...');
    const apiKeyTest = await testElevenLabsApiKey(elevenLabsApiKey);
    if (!apiKeyTest.valid) {
      throw new Error(`Invalid ElevenLabs API key: ${apiKeyTest.error}`);
    }

    // Usar axios para fazer a requisição diretamente (mais confiável)
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - voz masculina em português
    // Outras opções de vozes:
    // const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - voz feminina
    // const voiceId = 'ErXwobaYiN019PkySvjV'; // Antoni - voz masculina
    
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const requestBody = {
      text: text,
      model_id: 'eleven_multilingual_v2', // Modelo que suporta português
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true
      }
    };

    // Função de retry para tornar mais robusto
    const maxRetries = text.length > 5000 ? 5 : 3; // Mais tentativas para textos longos
    console.log(`🔄 Maximum retry attempts: ${maxRetries} (based on text length: ${text.length})`);
    
    const makeRequestWithRetry = async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Making request to ElevenLabs API (attempt ${attempt}/${maxRetries})...`);
          console.log(`Using voice ID: ${voiceId}`);
          console.log(`Request timeout: ${getTimeoutForTextLength(text.length)/1000}s`);
          console.log(`Text size: ${text.length} characters (${Math.round(text.length/1000)}k chars)`);

          const response = await axios({
            method: 'POST',
            url: url,
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': elevenLabsApiKey,
              'User-Agent': 'DailyVidDream/1.0'
            },
            data: requestBody,
            responseType: 'arraybuffer', // Importante para receber dados binários
            timeout: getTimeoutForTextLength(text.length), // Timeout dinâmico baseado no tamanho do texto
            maxRedirects: 5,
            validateStatus: function (status) {
              return status < 400; // Aceita apenas status de sucesso
            }
          });

          return response;
        } catch (error) {
          const errorInfo = {
            code: error.code,
            message: error.message,
            status: error.response?.status,
            timeout: getTimeoutForTextLength(text.length)/1000 + 's'
          };
          console.log(`❌ Attempt ${attempt} failed:`, errorInfo);
          
          if (attempt === maxRetries) {
            throw error; // Re-throw no último attempt
          }
          
          // Aguardar antes de tentar novamente (backoff exponencial mais agressivo para textos longos)
          const baseDelay = text.length > 5000 ? 2000 : 1000; // Delay maior para textos longos
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 15000); // Max 15s
          console.log(`⏳ Waiting ${delay}ms before retry... (longer delay for large text)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    const response = await makeRequestWithRetry();

    console.log('✅ Audio response received successfully!');
    console.log(`📦 Response size: ${Math.round(response.data.byteLength / 1024)}KB`);
    console.log('💾 Saving audio file...');

    // Converter para Buffer e salvar
    const audioBuffer = Buffer.from(response.data);
    await fs.writeFile(outputPath, audioBuffer);

    const stats = await fs.stat(outputPath);
    console.log(`✅ Audio generated successfully!`);
    console.log(`File size: ${Math.round(stats.size / 1024)}KB`);
    console.log(`Audio saved to: ${outputPath}`);

    return {
      success: true,
      filePath: outputPath,
      fileSize: stats.size,
      voiceId: voiceId
    };

  } catch (error) {
    console.error('❌ Error generating audio:', error.message);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error('ElevenLabs API Status:', error.response.status);
      console.error('ElevenLabs API Headers:', error.response.headers);
      
      // Converter buffer para string para ver a mensagem real
      let errorMessage = 'Unknown error';
      try {
        if (Buffer.isBuffer(error.response.data)) {
          const errorData = JSON.parse(error.response.data.toString());
          console.error('ElevenLabs API Error Details:', errorData);
          errorMessage = errorData.detail?.message || errorData.message || errorData.detail?.status || 'API Error';
        } else {
          console.error('ElevenLabs API Data:', error.response.data);
          errorMessage = error.response.data.detail?.message || error.response.data.message || 'API Error';
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError.message);
        console.error('Raw error data:', error.response.data);
      }
      
      if (error.response.status === 401) {
        throw new Error(`ElevenLabs API authentication failed: ${errorMessage}. Please check your API key.`);
      } else if (error.response.status === 429) {
        throw new Error(`ElevenLabs API rate limit exceeded: ${errorMessage}`);
      } else if (error.response.status === 422) {
        throw new Error(`Invalid request to ElevenLabs: ${errorMessage}`);
      } else {
        throw new Error(`ElevenLabs API error (${error.response.status}): ${errorMessage}`);
      }
    }
    
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
}

// Helper function to normalize video format before concatenation
function normalizeVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Normalizing video: ${path.basename(inputPath)}`);
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('1280x720') // Standardize resolution
      .fps(30) // Standardize frame rate
      .audioBitrate('128k')
      .videoBitrate('2000k')
      .outputOptions([
        '-preset', 'fast',
        '-pix_fmt', 'yuv420p', // Ensure compatible pixel format
        '-r', '30', // Force frame rate
        '-ar', '44100' // Standardize audio sample rate
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log(`Normalize command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Normalizing ${path.basename(inputPath)}: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`Video normalized: ${path.basename(inputPath)}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Normalization error for ${path.basename(inputPath)}:`, err.message);
        reject(err);
      })
      .run();
  });
}

// Helper function to replace video audio with generated audio and match video duration to audio duration
function combineVideoWithAudio(videoPath, audioPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎬🎤 Starting video audio replacement...');
      console.log(`Video: ${path.basename(videoPath)}`);
      console.log(`New Audio: ${path.basename(audioPath)}`);
      console.log(`Output: ${path.basename(outputPath)}`);
      
      // Get durations
      const videoDuration = await getVideoDuration(videoPath);
      const audioDuration = await getAudioDuration(audioPath);
      
      console.log(`Original video duration: ${videoDuration}s`);
      console.log(`New audio duration: ${audioDuration}s`);
      
      let ffmpegCommand = ffmpeg()
        .input(videoPath)  // Video input (will remove original audio)
        .input(audioPath); // New audio input
      
      if (videoDuration < audioDuration) {
        // Video é mais curto que o áudio - fazer loop do vídeo
        const loopCount = Math.ceil(audioDuration / videoDuration);
        console.log(`🔄 Video is shorter than audio - will loop video ${loopCount} times`);
        console.log(`📹 Video will maintain normal speed and loop to match audio duration`);
        
        // Use filter to loop video
        ffmpegCommand = ffmpegCommand
          .complexFilter([
            `[0:v]loop=loop=${loopCount - 1}:size=${Math.floor(videoDuration * 30)}[looped_video]` // Loop video (assuming 30 fps)
          ])
          .outputOptions([
            '-map', '[looped_video]',   // Use looped video
            '-map', '1:a:0',            // Map audio from second input (generated audio)
            '-c:v', 'libx264',          // Re-encode video for looping
            '-c:a', 'aac',              // Encode new audio
            '-preset', 'fast',
            '-crf', '23',
            '-t', audioDuration.toString(), // Limit to audio duration
            '-shortest'                 // End when the shortest input ends
          ]);
      } else {
        // Video é mais longo ou igual ao áudio - cortar na duração do áudio
        console.log(`✂️ Video is longer than or equal to audio - will trim video to match audio duration`);
        console.log(`� Video will maintain normal speed and be cut at audio end`);
        
        // Simply replace audio and cut video at audio duration
        ffmpegCommand = ffmpegCommand
          .outputOptions([
            '-map', '0:v:0',            // Map video from first input
            '-map', '1:a:0',            // Map audio from second input (generated audio)
            '-c:v', 'copy',             // Copy video stream without re-encoding (faster)
            '-c:a', 'aac',              // Encode new audio
            '-t', audioDuration.toString(), // Limit to audio duration
            '-shortest'                 // End when the shortest input ends
          ]);
      }
      
      ffmpegCommand
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg video+audio command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Combining video+audio: ${Math.round(progress.percent)}% done`);
          }
        })
        .on('end', () => {
          console.log('✅ Video audio replacement completed successfully');
          console.log(`🎬🎤 Final video now has generated audio narration`);
          console.log(`⏱️ Final video duration: ${audioDuration}s (matched to audio)`);
          console.log(`🔇 Original video audio has been removed`);
          console.log(`🎵 New generated audio has been added`);
          console.log(`📹 Video maintained normal speed - no acceleration/deceleration`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg video audio replacement error:', err.message);
          reject(err);
        })
        .run();
        
    } catch (error) {
      console.error('❌ Video audio replacement setup error:', error.message);
      reject(error);
    }
  });
}

// Helper function to concatenate videos using FFmpeg with file list method
function concatenateVideos(inputFiles, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Starting video concatenation...`);
      console.log(`Input files: ${inputFiles.join(', ')}`);
      console.log(`Output path: ${outputPath}`);
      
      // Create normalized versions of all input files
      const normalizedFiles = [];
      const tempDir = path.dirname(inputFiles[0]);
      
      for (let i = 0; i < inputFiles.length; i++) {
        const inputFile = inputFiles[i];
        const normalizedFile = path.join(tempDir, `normalized_${i + 1}.mp4`);
        
        try {
          await normalizeVideo(inputFile, normalizedFile);
          normalizedFiles.push(normalizedFile);
        } catch (error) {
          console.error(`Failed to normalize ${path.basename(inputFile)}:`, error.message);
          // Clean up any created normalized files
          for (const file of normalizedFiles) {
            try {
              await fs.remove(file);
            } catch (cleanupError) {
              console.error(`Failed to cleanup ${file}:`, cleanupError.message);
            }
          }
          throw error;
        }
      }
      
      console.log(`All videos normalized, starting concatenation...`);
      
      // Create file list for concat demuxer (more reliable than filter_complex)
      const fileListPath = path.join(tempDir, 'filelist.txt');
      const fileListContent = normalizedFiles.map(file => `file '${file}'`).join('\n');
      await fs.writeFile(fileListPath, fileListContent);
      
      // Use concat demuxer instead of filter_complex
      ffmpeg()
        .input(fileListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy' // Copy streams without re-encoding since they're already normalized
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg concat command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Concatenating: ${Math.round(progress.percent)}% done`);
          }
        })
        .on('end', async () => {
          console.log('Video concatenation completed successfully');
          
          // Clean up normalized files and file list
          try {
            for (const file of normalizedFiles) {
              await fs.remove(file);
            }
            await fs.remove(fileListPath);
            console.log('Cleanup of temporary normalized files completed');
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
          }
          
          resolve(outputPath);
        })
        .on('error', async (err) => {
          console.error('FFmpeg concatenation error:', err.message);
          
          // Clean up on error
          try {
            for (const file of normalizedFiles) {
              await fs.remove(file);
            }
            await fs.remove(fileListPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
          }
          
          reject(err);
        })
        .run();
        
    } catch (error) {
      console.error('Concatenation setup error:', error.message);
      reject(error);
    }
  });
}

// Helper function to upload video to YouTube
async function uploadVideoToYouTube(videoPath, metadata, credentials) {
  try {
    console.log('📺 Starting YouTube upload...');
    console.log(`Video file: ${path.basename(videoPath)}`);
    console.log(`Title: ${metadata.title}`);
    console.log(`Description length: ${metadata.description?.length || 0} characters`);

    // Initialize Google Auth
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    // Set credentials (access token and refresh token)
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });

    // Initialize YouTube API
    const youtube = google.youtube({ version: 'v3', auth });

    // Get video file stats
    const stats = await fs.stat(videoPath);
    const fileSizeMB = Math.round(stats.size / (1024 * 1024));
    
    console.log(`📁 Video file size: ${fileSizeMB}MB`);

    // Upload metadata
    const uploadMetadata = {
      snippet: {
        title: metadata.title,
        description: metadata.description || '',
        tags: metadata.tags || [],
        categoryId: metadata.categoryId || '22', // People & Blogs
        defaultLanguage: 'pt-BR',
        defaultAudioLanguage: 'pt-BR'
      },
      status: {
        privacyStatus: metadata.privacyStatus || 'private', // private, unlisted, public
        selfDeclaredMadeForKids: false
      }
    };

    console.log('🚀 Starting upload to YouTube...');
    console.log(`Privacy: ${uploadMetadata.status.privacyStatus}`);

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: uploadMetadata,
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log('✅ YouTube upload completed successfully!');
    console.log(`📺 Video ID: ${videoId}`);
    console.log(`🔗 Video URL: ${videoUrl}`);
    console.log(`👁️ Privacy: ${response.data.status.privacyStatus}`);

    return {
      success: true,
      videoId: videoId,
      videoUrl: videoUrl,
      title: response.data.snippet.title,
      privacyStatus: response.data.status.privacyStatus,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ YouTube upload failed:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('YouTube API Status:', error.response.status);
      console.error('YouTube API Error:', error.response.data);
    }

    throw new Error(`Failed to upload to YouTube: ${error.message}`);
  }
}

// API endpoint to generate video script with GPT
app.post('/api/generate-script', async (req, res) => {
  const requestId = uuidv4();
  console.log(`Starting script generation: ${requestId}`);
  
  try {
    const { 
      prompt, 
      openaiApiKey,
      elevenLabsApiKey,
      theme = 'informativo',
      duration = '10 minutos',
      style = 'casual e engajante',
      language = 'português brasileiro'
    } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Você precisa fornecer uma ideia ou contexto para o roteiro'
      });
    }

    if (!openaiApiKey) {
      return res.status(400).json({
        error: 'OpenAI API key is required',
        message: 'Chave da API do OpenAI é obrigatória'
      });
    }
    
    console.log(`Generating script with prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`Options: theme=${theme}, duration=${duration}, style=${style}`);
    
    const result = await generateVideoScript(prompt, {
      theme,
      duration,
      style,
      language
    }, openaiApiKey);
    
    console.log(`Script generation completed: ${requestId}`);
    console.log(`Tokens used: ${result.tokensUsed}`);
    
    // Generate audio if ElevenLabs API key is provided
    let audioResult = null;
    if (elevenLabsApiKey && result.script) {
      try {
        console.log(`Generating audio for script: ${requestId}`);
        
        const audioFilename = `script_audio_${requestId}.mp3`;
        const audioPath = path.join(OUTPUT_DIR, audioFilename);
        
        const audioGenResult = await generateAudioFromText(
          result.script, 
          audioPath, 
          elevenLabsApiKey
        );
        
        audioResult = {
          filename: audioFilename,
          downloadUrl: `/api/download/${audioFilename}`,
          fileSize: audioGenResult.fileSize,
          voiceId: audioGenResult.voiceId
        };
        
        console.log(`Audio generation completed: ${requestId}`);
        
      } catch (audioError) {
        console.error(`Audio generation failed for ${requestId}:`, audioError.message);
        // Continue without audio if it fails
      }
    }
    
    res.json({
      success: true,
      requestId,
      script: result.script,
      options: {
        theme: result.theme,
        duration: result.duration,
        style: result.style,
        language: result.language
      },
      metadata: {
        tokensUsed: result.tokensUsed,
        generatedAt: new Date().toISOString(),
        estimatedCost: Math.round(result.tokensUsed * 0.002 * 100) / 100 // Rough estimate for GPT-3.5
      },
      generatedAudio: audioResult
    });
    
  } catch (error) {
    console.error(`Script generation failed: ${requestId}`, error.message);
    
    res.status(500).json({
      error: 'Script generation failed',
      message: error.message,
      requestId
    });
  }
});

// API endpoint to combine videos (used by the frontend)
app.post('/api/combine-videos', async (req, res) => {
  const jobId = uuidv4();
  console.log(`Starting video combination job: ${jobId}`);
  
  try {
    const { videos, accessToken, scheduleId } = req.body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'No videos provided' });
    }
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    console.log(`Processing ${videos.length} videos for schedule ${scheduleId}`);
    
    // Create job-specific temp directory
    const jobTempDir = path.join(TEMP_DIR, jobId);
    fs.ensureDirSync(jobTempDir);
    
    const downloadedFiles = [];
    
    // Download all videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const filename = `video_${i + 1}_${video.id}.mp4`;
      const fullFilePath = path.join(jobTempDir, filename);
      
      try {
        console.log(`Starting download ${i + 1}/${videos.length}: ${video.name}`);
        const filePath = await downloadVideoFromGoogleDrive(
          video.id, 
          accessToken, 
          fullFilePath
        );
        
        // Verify the downloaded file exists and has content
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          throw new Error(`Downloaded file is empty: ${filename}`);
        }
        
        // Check video duration
        const duration = await getVideoDuration(filePath);
        console.log(`Video ${filename} duration: ${duration} seconds`);
        
        downloadedFiles.push({
          path: filePath,
          originalName: video.name,
          duration: duration
        });
        
      } catch (error) {
        console.error(`Failed to download video ${video.name}:`, error.message);
        // Continue with other videos instead of failing completamente
      }
    }
    
    if (downloadedFiles.length === 0) {
      throw new Error('No videos were successfully downloaded');
    }
    
    console.log(`Successfully downloaded ${downloadedFiles.length} videos`);
    
    // Calculate total duration for script context
    const totalDuration = downloadedFiles.reduce((sum, file) => sum + file.duration, 0);
    
    // Generate script and audio FIRST (before video concatenation) if API keys are provided
    let generatedScript = null;
    let generatedAudio = null;
    const { openaiApiKey, elevenLabsApiKey } = req.body;
    
    // Debug: Log API key availability and detailed info
    console.log(`🔑 === API KEYS DEBUGGING ===`);
    console.log(`📦 Request body keys:`, Object.keys(req.body));
    console.log(`🔍 OpenAI API Key:`, {
      exists: !!openaiApiKey,
      type: typeof openaiApiKey,
      length: openaiApiKey ? openaiApiKey.length : 0,
      preview: openaiApiKey ? `${openaiApiKey.substring(0, 8)}...${openaiApiKey.substring(openaiApiKey.length - 4)}` : 'NOT_PROVIDED'
    });
    console.log(`🔍 ElevenLabs API Key:`, {
      exists: !!elevenLabsApiKey,
      type: typeof elevenLabsApiKey,
      length: elevenLabsApiKey ? elevenLabsApiKey.length : 0,
      preview: elevenLabsApiKey ? `${elevenLabsApiKey.substring(0, 8)}...${elevenLabsApiKey.substring(elevenLabsApiKey.length - 4)}` : 'NOT_PROVIDED'
    });
    console.log(`🔑 === END API KEYS DEBUGGING ===\n`);
    
    if (openaiApiKey) {
      try {
        console.log(`\n=== GENERATING SCRIPT FOR COMBINED VIDEO (BEFORE PROCESSING) ===`);
        console.log(`Videos to be used: ${downloadedFiles.map(f => f.originalName).join(', ')}`);
        
        // Create a context-aware prompt based on video names and duration
        const videoContext = downloadedFiles.map(f => f.originalName).join(', ');
        const durationText = totalDuration > 60 ? `${Math.round(totalDuration/60)} minutos` : `${Math.round(totalDuration)} segundos`;
        
        // Modified prompt to generate medium-length scripts for 6-8 minute audio
        const prompt = `Crie um roteiro motivacional para um vídeo inspirador com os seguintes vídeos: ${videoContext}. 
        O vídeo tem duração de ${durationText}. 
        Desenvolva uma narrativa motivacional envolvente e concisa com 4000-6000 caracteres que, quando convertida em áudio, resulte em 6-8 minutos de narração inspiradora. 
        Inclua histórias, exemplos práticos, reflexões e conselhos aplicáveis de forma direta e impactante. 
        Mantenha o engajamento durante toda a narração com linguagem fluida e natural.`;
        
        const scriptResult = await generateVideoScript(prompt, {
          theme: 'motivacional',
          duration: '6-8 minutos', // Updated duration for medium content
          style: 'inspiracional e envolvente',
          language: 'português brasileiro'
        }, openaiApiKey);
        
        generatedScript = {
          script: scriptResult.script,
          theme: scriptResult.theme,
          tokensUsed: scriptResult.tokensUsed,
          generatedAt: new Date().toISOString()
        };
        
        console.log(`\n📝 === SCRIPT GERADO AUTOMATICAMENTE ===`);
        console.log(`🎬 Vídeos base: ${videoContext}`);
        console.log(`⏱️ Duração: ${durationText}`);
        console.log(`🤖 Tokens utilizados: ${scriptResult.tokensUsed}`);
        console.log(`📄 Caracteres do script: ${scriptResult.script.length}`);
        console.log(`\n📋 ROTEIRO COMPLETO:`);
        console.log(`${'='.repeat(60)}`);
        console.log(scriptResult.script);
        console.log(`${'='.repeat(60)}`);
        console.log(`📝 === FIM DO SCRIPT ===\n`);
        
        // Generate audio from the script if ElevenLabs API key is provided
        if (elevenLabsApiKey && scriptResult.script) {
          try {
            console.log(`\n🎤 === GENERATING AUDIO FROM SCRIPT (BEFORE VIDEO PROCESSING) ===`);
            
            const audioFilename = `audio_${jobId}.mp3`;
            const audioPath = path.join(OUTPUT_DIR, audioFilename);
            
            const audioResult = await generateAudioFromText(
              scriptResult.script, 
              audioPath, 
              elevenLabsApiKey
            );
            
            generatedAudio = {
              filename: audioFilename,
              downloadUrl: `/api/download/${audioFilename}`,
              fileSize: audioResult.fileSize,
              voiceId: audioResult.voiceId,
              generatedAt: new Date().toISOString()
            };
            
            console.log(`🎵 Audio gerado com sucesso ANTES do processamento de vídeo!`);
            console.log(`📁 Arquivo: ${audioFilename}`);
            console.log(`💾 Tamanho: ${Math.round(audioResult.fileSize / 1024)}KB`);
            console.log(`🎤 Voz utilizada: ${audioResult.voiceId}`);
            console.log(`🎤 === FIM DA GERAÇÃO DE ÁUDIO ===\n`);
            
          } catch (audioError) {
            console.error(`❌ Erro ao gerar áudio:`, audioError.message);
            console.error(`🔍 Detalhes do erro:`, {
              errorType: audioError.constructor.name,
              apiKeyProvided: !!elevenLabsApiKey,
              scriptLength: scriptResult.script?.length || 0,
              stack: audioError.stack?.split('\n').slice(0, 3).join('\n')
            });
            console.log(`⚠️ Script foi gerado com sucesso, mas áudio não foi gerado`);
            console.log(`💡 Possíveis causas: Chave ElevenLabs inválida, quota excedida, ou texto muito longo`);
          }
        } else if (!elevenLabsApiKey) {
          console.log(`⚠️ ElevenLabs API key não fornecida - áudio não será gerado`);
        }
        
      } catch (scriptError) {
        console.error(`❌ Erro ao gerar script automaticamente:`, scriptError.message);
        console.log(`⚠️ Continuando com processamento de vídeo mesmo sem script`);
      }
    } else {
      console.log(`⚠️ OpenAI API key não fornecida - script não será gerado automaticamente`);
    }
    
    // Now proceed with video concatenation
    console.log(`\n🎬 === STARTING VIDEO CONCATENATION ===`);
    
    // Prepare output filename
    const outputFilename = `combined_${jobId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    // Concatenate videos using FFmpeg
    await concatenateVideos(
      downloadedFiles.map(f => f.path),
      outputPath
    );
    
    console.log(`✅ Video concatenation completed successfully!`);
    console.log(`📁 Concatenated video saved at: ${outputPath}`);
    
    // If audio was generated, combine it with the video
    let finalVideoPath = outputPath;
    let finalVideoFilename = outputFilename;
    
    if (generatedAudio && generatedAudio.filename) {
      try {
        console.log(`\n🎬🎤 === REPLACING VIDEO AUDIO WITH GENERATED NARRATION ===`);
        
        const audioPath = path.join(OUTPUT_DIR, generatedAudio.filename);
        const combinedFilename = `final_with_narration_${jobId}.mp4`;
        const combinedPath = path.join(OUTPUT_DIR, combinedFilename);
        
        // Replace video audio with generated narration (video duration will match audio duration)
        await combineVideoWithAudio(outputPath, audioPath, combinedPath);
        
        // Update the final paths to the version with narration
        finalVideoPath = combinedPath;
        finalVideoFilename = combinedFilename;
        
        // Remove the original video file to save space
        await fs.remove(outputPath);
        
        // Clean up temporary audio file immediately after use
        try {
          await fs.remove(audioPath);
          console.log(`🗑️ Temporary audio file cleaned up: ${generatedAudio.filename}`);
        } catch (cleanupError) {
          console.error(`⚠️ Failed to clean up temporary audio file:`, cleanupError.message);
        }
        
        console.log(`🎉 Final video with narration created: ${combinedFilename}`);
        console.log(`🔇 Original video audio removed`);
        console.log(`🎤 Generated narration audio added`);
        console.log(`🎬🎤 === AUDIO REPLACEMENT COMPLETED ===\n`);
        
      } catch (combineError) {
        console.error(`❌ Erro ao substituir áudio do vídeo:`, combineError.message);
        console.log(`⚠️ Mantendo vídeo original com áudio original`);
        
        // Clean up temporary audio file even if combination failed
        try {
          const audioPath = path.join(OUTPUT_DIR, generatedAudio.filename);
          await fs.remove(audioPath);
          console.log(`🗑️ Temporary audio file cleaned up after failed combination: ${generatedAudio.filename}`);
        } catch (cleanupError) {
          console.error(`⚠️ Failed to clean up temporary audio file after error:`, cleanupError.message);
        }
        
        // Keep the original video if audio replacement fails
      }
    } else {
      console.log(`\n⚠️ === SKIPPING AUDIO REPLACEMENT ===`);
      if (!generatedAudio) {
        console.log(`📢 No audio was generated (ElevenLabs failed or not configured)`);
      } else if (!generatedAudio.filename) {
        console.log(`📢 Generated audio has no filename`);
      }
      
      // Clean up temporary audio file even if not used
      if (generatedAudio && generatedAudio.filename) {
        try {
          const audioPath = path.join(OUTPUT_DIR, generatedAudio.filename);
          await fs.remove(audioPath);
          console.log(`🗑️ Temporary audio file cleaned up (unused): ${generatedAudio.filename}`);
        } catch (cleanupError) {
          console.error(`⚠️ Failed to clean up unused temporary audio file:`, cleanupError.message);
        }
      }
      
      console.log(`🎬 Proceeding with original video: ${finalVideoFilename}`);
      console.log(`⚠️ === AUDIO REPLACEMENT SKIPPED ===\n`);
    }
    
    // Add background music to the final video (regardless of whether it has narration or not)
    let hasBackgroundMusic = false;
    try {
      console.log(`\n🎵 === ADDING BACKGROUND MUSIC ===`);
      console.log(`🎬 Current video file: ${finalVideoFilename}`);
      console.log(`📁 Current video path: ${finalVideoPath}`);
      
      const musicFilename = `final_with_music_${jobId}.mp4`;
      const musicPath = path.join(OUTPUT_DIR, musicFilename);
      
      console.log(`🎵 Target music video file: ${musicFilename}`);
      console.log(`📁 Target music video path: ${musicPath}`);
      
      // Get video duration for background music
      console.log(`⏱️ Getting video duration for background music...`);
      const videoDuration = await getVideoDuration(finalVideoPath);
      console.log(`⏱️ Video duration: ${videoDuration}s`);
      
      // Add background music
      console.log(`🎼 Starting background music generation and mixing...`);
      await addBackgroundMusicToVideo(finalVideoPath, musicPath, videoDuration);
      
      // Remove the version without background music
      await fs.remove(finalVideoPath);
      
      // Update final paths to version with background music
      finalVideoPath = musicPath;
      finalVideoFilename = musicFilename;
      
      hasBackgroundMusic = true;
      console.log(`🎵 Background music added successfully: ${musicFilename}`);
      console.log(`🎬🎵 === FINAL VIDEO WITH BACKGROUND MUSIC COMPLETED ===\n`);
      
    } catch (musicError) {
      console.error(`❌ Erro ao adicionar música de fundo:`, musicError.message);
      console.log(`⚠️ Mantendo vídeo sem música de fundo`);
      console.log(`📝 Stack trace: ${musicError.stack}`);
      // Keep the video without background music if it fails
    }
    
    // Get file size after final processing
    const outputStats = await fs.stat(finalVideoPath);
    
    // Clean up temporary files
    await fs.remove(jobTempDir);
    
    console.log(`Job ${jobId} completed successfully - Output file: ${finalVideoFilename}`);
    console.log(`Total duration: ${totalDuration}s, File size: ${Math.round(outputStats.size / (1024 * 1024))}MB`);
    
    // Return JSON response with file information instead of streaming the file directly
    res.json({
      success: true,
      jobId: jobId,
      filename: finalVideoFilename,
      downloadUrl: `/api/download/${finalVideoFilename}`,
      videosProcessed: downloadedFiles.length,
      totalDuration: Math.round(totalDuration),
      fileSize: `${Math.round(outputStats.size / (1024 * 1024))}MB`,
      hasAudio: !!generatedAudio, // Indicates if the final video includes generated audio
      hasBackgroundMusic: hasBackgroundMusic, // Indicates that the final video includes background music
      processedVideos: downloadedFiles.map(f => ({
        name: f.originalName,
        duration: Math.round(f.duration)
      })),
      generatedScript: generatedScript // Include the generated script in response
      // generatedAudio is not included as it's temporary and deleted after use
    });
    
    // Keep video files for 24 hours - no automatic cleanup for videos
    console.log(`📁 Video saved for 24h: ${finalVideoFilename}`);
    console.log(`💾 File will remain available for download at: /api/download/${finalVideoFilename}`);
    
    if (generatedAudio && generatedAudio.filename) {
      console.log(`🎵 Audio was used temporarily and cleaned up (not available for download)`);
    }
    
    // Print list of all available files for download
    try {
      console.log(`\n📋 === LISTA COMPLETA DE ARQUIVOS DISPONÍVEIS ===`);
      console.log(`ℹ️ Nota: Arquivos de áudio são temporários e excluídos após uso na combinação`);
      const allFiles = await fs.readdir(OUTPUT_DIR);
      const fileDetails = [];
      
      for (const filename of allFiles) {
        try {
          const filePath = path.join(OUTPUT_DIR, filename);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            let category = 'Outros';
            if (filename.includes('final_with_music_')) {
              category = '🎵 Vídeo com Música';
            } else if (filename.includes('final_with_narration_')) {
              category = '🎤 Vídeo com Narração';
            } else if (filename.includes('combined_')) {
              category = '🎬 Vídeo Concatenado';
            } else if (filename.endsWith('.mp3')) {
              category = '🔊 Áudio MP3';
            } else if (filename.endsWith('.mp4')) {
              category = '📹 Vídeo MP4';
            }
            
            fileDetails.push({
              filename,
              category,
              sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
              age: Math.round((Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60) * 100) / 100
            });
          }
        } catch (fileError) {
          // Skip files with errors
        }
      }
      
      // Sort by creation time (newest first)
      fileDetails.sort((a, b) => a.age - b.age);
      
      fileDetails.forEach((file, index) => {
        const isNew = index === 0 && file.filename === finalVideoFilename;
        const marker = isNew ? '🆕 ' : '   ';
        console.log(`${marker}${file.category}: ${file.filename} (${file.sizeMB}MB, ${file.age.toFixed(1)}h)`);
      });
      
      const totalSize = fileDetails.reduce((sum, file) => sum + file.sizeMB, 0);
      console.log(`📊 Total: ${fileDetails.length} arquivos, ${totalSize.toFixed(1)}MB`);
      console.log(`🔗 Acesse: http://localhost:3001/api/download/<filename>`);
      console.log(`📋 === FIM DA LISTA ===\n`);
      
    } catch (listError) {
      console.error('❌ Erro ao listar arquivos:', listError.message);
    }
    
    // Optional: Clean up old video files only after 24 hours (86400000 ms)
    setTimeout(() => {
      // Clean up the final video file after 24 hours
      fs.remove(finalVideoPath).catch(() => {
        // Ignore errors - file might have been manually deleted
      });
      console.log(`🗑️ Auto-cleanup: Removed ${finalVideoFilename} after 24 hours`);
      
      // Audio files are cleaned up immediately after use, no need for delayed cleanup
    }, 86400000); // Remove after 24 hours
    
  } catch (error) {
    console.error(`Combine videos job ${jobId} failed:`, error.message);
    
    // Clean up on error
    const jobTempDir = path.join(TEMP_DIR, jobId);
    if (await fs.pathExists(jobTempDir)) {
      await fs.remove(jobTempDir);
    }
    
    // Clean up temporary audio file if it was generated
    if (generatedAudio && generatedAudio.filename) {
      try {
        const audioPath = path.join(OUTPUT_DIR, generatedAudio.filename);
        await fs.remove(audioPath);
        console.log(`🗑️ Temporary audio file cleaned up after error: ${generatedAudio.filename}`);
      } catch (cleanupError) {
        console.error(`⚠️ Failed to clean up temporary audio file after error:`, cleanupError.message);
      }
    }
    
    res.status(500).json({
      error: 'Video combination failed',
      message: error.message,
      jobId: jobId
    });
  }
});

// API endpoint to prepare videos
app.post('/api/prepare-videos', async (req, res) => {
  const jobId = uuidv4();
  console.log(`Starting video preparation job: ${jobId}`);
  
  try {
    const { videos, accessToken } = req.body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'No videos provided' });
    }
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    console.log(`Processing ${videos.length} videos for job ${jobId}`);
    
    // Create job-specific temp directory
    const jobTempDir = path.join(TEMP_DIR, jobId);
    fs.ensureDirSync(jobTempDir);
    
    const downloadedFiles = [];
    
    // Download all videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const filename = `video_${i + 1}_${video.id}.mp4`;
      
      try {
        const filePath = await downloadVideoFromGoogleDrive(
          video.id, 
          accessToken, 
          path.join(jobId, filename)
        );
        
        // Verify the downloaded file exists and has content
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          throw new Error(`Downloaded file is empty: ${filename}`);
        }
        
        // Check video duration
        const duration = await getVideoDuration(filePath);
        console.log(`Video ${filename} duration: ${duration} seconds`);
        
        downloadedFiles.push({
          path: filePath,
          originalName: video.name,
          duration: duration
        });
        
      } catch (error) {
        console.error(`Failed to download video ${video.name}:`, error.message);
        // Continue with other videos instead of failing completamente
      }
    }
    
    if (downloadedFiles.length === 0) {
      throw new Error('No videos were successfully downloaded');
    }
    
    console.log(`Successfully downloaded ${downloadedFiles.length} videos`);
    
    // Prepare output filename
    const outputFilename = `concatenated_${jobId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    // Concatenate videos
    await concatenateVideos(
      downloadedFiles.map(f => f.path),
      outputPath
    );
    
    // Calculate total duration
    const totalDuration = downloadedFiles.reduce((sum, file) => sum + file.duration, 0);
    
    // Clean up temporary files
    await fs.remove(jobTempDir);
    
    console.log(`Job ${jobId} completed successfully`);
    
    res.json({
      success: true,
      jobId: jobId,
      outputFile: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`,
      videosProcessed: downloadedFiles.length,
      totalDuration: Math.round(totalDuration),
      processedVideos: downloadedFiles.map(f => ({
        name: f.originalName,
        duration: Math.round(f.duration)
      }))
    });
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error.message);
    
    // Clean up on error
    const jobTempDir = path.join(TEMP_DIR, jobId);
    if (await fs.pathExists(jobTempDir)) {
      await fs.remove(jobTempDir);
    }
    
    res.status(500).json({
      error: 'Video preparation failed',
      message: error.message,
      jobId: jobId
    });
  }
});

// API endpoint to download prepared video
app.get('/api/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(OUTPUT_DIR, filename);
    
    console.log(`Download request for: ${filename}`);
    console.log(`Looking for file at: ${filePath}`);
    
    if (!await fs.pathExists(filePath)) {
      console.log(`File not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = await fs.stat(filePath);
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (filename.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (filename.endsWith('.wav')) {
      contentType = 'audio/wav';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    
    // Clean up the file after download (optional)
    readStream.on('end', () => {
      console.log(`File ${filename} downloaded successfully`);
      // Optionally remove the file after download
      // fs.remove(filePath).catch(console.error);
    });
    
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ffmpegAvailable: true // You might want to actually check this
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`Daily Dream Server running on port ${PORT}`);
  console.log(`Temp directory: ${TEMP_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
});

// API endpoint to upload video to YouTube
app.post('/api/upload-to-youtube', async (req, res) => {
  const uploadId = uuidv4();
  console.log(`Starting YouTube upload: ${uploadId}`);
  
  try {
    const { 
      filename,
      title,
      description,
      tags,
      privacyStatus = 'private',
      categoryId = '22',
      youtubeCredentials
    } = req.body;
    
    if (!filename) {
      return res.status(400).json({ 
        error: 'Filename is required',
        message: 'Nome do arquivo é obrigatório'
      });
    }

    if (!title) {
      return res.status(400).json({
        error: 'Title is required',
        message: 'Título do vídeo é obrigatório'
      });
    }

    if (!youtubeCredentials || !youtubeCredentials.accessToken) {
      return res.status(400).json({
        error: 'YouTube credentials are required',
        message: 'Credenciais do YouTube são obrigatórias'
      });
    }

    // Check if video file exists
    const videoPath = path.join(OUTPUT_DIR, filename);
    if (!await fs.pathExists(videoPath)) {
      return res.status(404).json({
        error: 'Video file not found',
        message: 'Arquivo de vídeo não encontrado'
      });
    }

    console.log(`📺 Uploading video to YouTube: ${filename}`);
    console.log(`Title: ${title}`);
    console.log(`Privacy: ${privacyStatus}`);

    // Prepare metadata
    const metadata = {
      title,
      description,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      privacyStatus,
      categoryId
    };

    // Upload to YouTube
    const uploadResult = await uploadVideoToYouTube(videoPath, metadata, youtubeCredentials);

    console.log(`YouTube upload completed: ${uploadId}`);

    res.json({
      success: true,
      uploadId,
      youtube: uploadResult,
      metadata: {
        filename,
        title,
        description,
        tags: metadata.tags,
        privacyStatus,
        uploadedAt: uploadResult.uploadedAt
      }
    });

  } catch (error) {
    console.error(`YouTube upload failed: ${uploadId}`, error.message);
    
    res.status(500).json({
      error: 'YouTube upload failed',
      message: error.message,
      uploadId
    });
  }
});

// Helper function to add background music to video
function addBackgroundMusicToVideo(videoPath, outputPath, videoDuration) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎵 Adding background music to video...');
      console.log(`Video: ${path.basename(videoPath)}`);
      console.log(`Output: ${path.basename(outputPath)}`);
      console.log(`Video duration: ${videoDuration}s`);
      
      // Usar arquivo de música de fundo específico
      const backgroundMusicPath = path.join(AUDIOS_DIR, 'background.mp3');
      
      // Verificar se o arquivo de música existe
      if (!await fs.pathExists(backgroundMusicPath)) {
        throw new Error(`Background music file not found: ${backgroundMusicPath}`);
      }
      
      console.log(`🎼 Using background music file: ${backgroundMusicPath}`);
      
      // Obter duração da música de fundo
      const musicDuration = await getAudioDuration(backgroundMusicPath);
      console.log(`🎵 Background music duration: ${musicDuration}s`);
      console.log(`📹 Video duration: ${videoDuration}s`);
      
      // Preparar filtros de áudio baseado na duração
      let audioFilters = [];
      
      if (musicDuration < videoDuration) {
        // Se a música é mais curta que o vídeo, fazer loop
        const loopCount = Math.ceil(videoDuration / musicDuration);
        console.log(`🔄 Music will loop ${loopCount} times to match video duration`);
        audioFilters = [
          `[1:a]aloop=loop=${loopCount - 1}:size=${Math.floor(musicDuration * 44100)}[bg_music_loop]`,
          '[0:a]volume=1.0[main_audio]',
          '[bg_music_loop]volume=0.06[bg_music]',
          '[main_audio][bg_music]amix=inputs=2:duration=first[mixed_audio]'
        ];
      } else {
        // Se a música é mais longa ou igual ao vídeo, cortar na duração do vídeo
        console.log(`✂️ Music will be trimmed to match video duration`);
        audioFilters = [
          '[0:a]volume=1.0[main_audio]',
          `[1:a]atrim=0:${videoDuration},volume=0.05[bg_music]`,
          '[main_audio][bg_music]amix=inputs=2:duration=first[mixed_audio]'
        ];
      }
      
      console.log('🎬🎵 Mixing video with background music...');
      
      // Combinar vídeo com música de fundo
      ffmpeg()
        .input(videoPath) // Vídeo principal (já com narração se houver)
        .input(backgroundMusicPath) // Música de fundo específica
        .complexFilter(audioFilters)
        .outputOptions([
          '-map', '0:v', // Usar vídeo da primeira entrada
          '-map', '[mixed_audio]', // Usar áudio mixado
          '-c:v', 'copy', // Não recodificar vídeo para economizar tempo
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest' // Garantir que não ultrapasse a duração do vídeo
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎬🎵 Video + background music command:', commandLine.substring(0, 150) + '...');
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`🎵 Background music mixing: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', async () => {
          console.log('🎉 Video with background music created successfully!');
          console.log(`🎬🎵 Final video with background music: ${path.basename(outputPath)}`);
          console.log(`🎵 Used background music: ${path.basename(backgroundMusicPath)}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Background music mixing error:', err.message);
          reject(err);
        })
        .run();
        
    } catch (error) {
      console.error('❌ Background music setup error:', error.message);
      reject(error);
    }
  });
}

// API endpoint to list all available files for download
app.get('/api/files', async (req, res) => {
  try {
    console.log('📋 Listing all available files for download...');
    
    // Read all files in the output directory
    const files = await fs.readdir(OUTPUT_DIR);
    
    const fileList = [];
    
    for (const filename of files) {
      try {
        const filePath = path.join(OUTPUT_DIR, filename);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          // Get file type and category
          let fileType = 'unknown';
          let category = 'other';
          
          if (filename.endsWith('.mp4')) {
            fileType = 'video/mp4';
            if (filename.includes('combined_')) {
              category = 'concatenated';
            } else if (filename.includes('final_with_narration_')) {
              category = 'with_narration';
            } else if (filename.includes('final_with_music_')) {
              category = 'with_background_music';
            } else {
              category = 'video';
            }
          } else if (filename.endsWith('.mp3')) {
            fileType = 'audio/mpeg';
            category = 'audio';
          } else if (filename.endsWith('.wav')) {
            fileType = 'audio/wav';
            category = 'audio';
          }
          
          fileList.push({
            filename: filename,
            downloadUrl: `/api/download/${filename}`,
            fileSize: stats.size,
            fileSizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
            fileType: fileType,
            category: category,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            ageInHours: Math.round((Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60) * 100) / 100
          });
        }
      } catch (fileError) {
        console.warn(`⚠️ Error reading file ${filename}:`, fileError.message);
        // Continue processing other files
      }
    }
    
    // Sort files by creation time (newest first)
    fileList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📋 Found ${fileList.length} files available for download`);
    
    // Group files by category for better organization
    const groupedFiles = {
      with_background_music: fileList.filter(f => f.category === 'with_background_music'),
      with_narration: fileList.filter(f => f.category === 'with_narration'),
      concatenated: fileList.filter(f => f.category === 'concatenated'),
      audio: fileList.filter(f => f.category === 'audio'),
      video: fileList.filter(f => f.category === 'video'),
      other: fileList.filter(f => f.category === 'other')
    };
    
    const totalSizeMB = fileList.reduce((sum, file) => sum + file.fileSizeMB, 0);
    
    res.json({
      success: true,
      summary: {
        totalFiles: fileList.length,
        totalSizeMB: Math.round(totalSizeMB * 100) / 100,
        categories: {
          with_background_music: groupedFiles.with_background_music.length,
          with_narration: groupedFiles.with_narration.length,
          concatenated: groupedFiles.concatenated.length,
          audio: groupedFiles.audio.length,
          video: groupedFiles.video.length,
          other: groupedFiles.other.length
        }
      },
      files: fileList,
      grouped: groupedFiles,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error listing files:', error.message);
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// API endpoint to get a quick summary of available files
app.get('/api/files/summary', async (req, res) => {
  try {
    console.log('📊 Getting quick files summary...');
    
    // Read all files in the output directory
    const files = await fs.readdir(OUTPUT_DIR);
    
    let totalFiles = 0;
    let totalSizeMB = 0;
    let videoCount = 0;
    let audioCount = 0;
    let withMusicCount = 0;
    let newestFile = null;
    let newestFileDate = 0;
    
    for (const filename of files) {
      try {
        const filePath = path.join(OUTPUT_DIR, filename);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          totalFiles++;
          totalSizeMB += stats.size / (1024 * 1024);
          
          if (filename.endsWith('.mp4')) {
            videoCount++;
            if (filename.includes('final_with_music_')) {
              withMusicCount++;
            }
          } else if (filename.endsWith('.mp3') || filename.endsWith('.wav')) {
            audioCount++;
          }
          
          // Track newest file
          if (stats.birthtime.getTime() > newestFileDate) {
            newestFileDate = stats.birthtime.getTime();
            newestFile = {
              filename: filename,
              createdAt: stats.birthtime,
              sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100
            };
          }
        }
      } catch (fileError) {
        // Skip files with errors
        continue;
      }
    }
    
    console.log(`📊 Summary: ${totalFiles} files, ${Math.round(totalSizeMB)}MB total`);
    
    res.json({
      success: true,
      summary: {
        totalFiles,
        totalSizeMB: Math.round(totalSizeMB * 100) / 100,
        videoCount,
        audioCount,
        withMusicCount,
        newestFile,
        lastGenerated: newestFile ? newestFile.createdAt : null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting files summary:', error.message);
    res.status(500).json({
      error: 'Failed to get files summary',
      message: error.message
    });
  }
});

// API endpoint to delete a specific file
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(OUTPUT_DIR, filename);
    
    console.log(`🗑️ Deleting file: ${filename}`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: `Arquivo ${filename} não encontrado`
      });
    }
    
    // Get file stats before deletion
    const stats = await fs.stat(filePath);
    const fileSizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
    
    await fs.remove(filePath);
    
    console.log(`✅ File deleted successfully: ${filename} (${fileSizeMB}MB)`);
    
    res.json({
      success: true,
      message: `File ${filename} deleted successfully`,
      deletedFile: {
        filename: filename,
        fileSizeMB: fileSizeMB,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting file:', error.message);
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

// API endpoint to clean up old files (older than specified hours)
app.post('/api/cleanup', async (req, res) => {
  try {
    const { olderThanHours = 24 } = req.body;
    
    console.log(`🧹 Starting cleanup of files older than ${olderThanHours} hours...`);
    
    const files = await fs.readdir(OUTPUT_DIR);
    const deletedFiles = [];
    let totalSizeDeleted = 0;
    
    for (const filename of files) {
      try {
        const filePath = path.join(OUTPUT_DIR, filename);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const ageInHours = (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60);
          
          if (ageInHours > olderThanHours) {
            const fileSizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
            await fs.remove(filePath);
            
            deletedFiles.push({
              filename: filename,
              fileSizeMB: fileSizeMB,
              ageInHours: Math.round(ageInHours * 100) / 100
            });
            totalSizeDeleted += fileSizeMB;
            
            console.log(`🗑️ Deleted old file: ${filename} (${fileSizeMB}MB, ${Math.round(ageInHours)}h old)`);
          }
        }
      } catch (fileError) {
        console.warn(`⚠️ Error processing file ${filename}:`, fileError.message);
      }
    }
    
    console.log(`✅ Cleanup completed: ${deletedFiles.length} files deleted, ${Math.round(totalSizeDeleted * 100) / 100}MB freed`);
    
    res.json({
      success: true,
      summary: {
        filesDeleted: deletedFiles.length,
        totalSizeDeletedMB: Math.round(totalSizeDeleted * 100) / 100,
        olderThanHours: olderThanHours
      },
      deletedFiles: deletedFiles,
      cleanupAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

// Helper function to calculate timeout based on text length
function getTimeoutForTextLength(textLength) {
  // Base timeout: 30 segundos
  let timeout = 30000;
  
  if (textLength <= 1000) {
    timeout = 30000; // 30 segundos para textos curtos
  } else if (textLength <= 3000) {
    timeout = 60000; // 1 minuto para textos médios
  } else if (textLength <= 6000) {
    timeout = 120000; // 2 minutos para textos grandes
  } else if (textLength <= 10000) {
    timeout = 180000; // 3 minutos para textos muito grandes
  } else {
    timeout = 300000; // 5 minutos para textos extremamente grandes
  }
  
  console.log(`⏱️ Timeout calculado para ${textLength} caracteres: ${timeout/1000}s`);
  return timeout;
}
