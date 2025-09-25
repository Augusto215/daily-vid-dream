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

// Ensure directories exist
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(OUTPUT_DIR);

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
      duration = '60 segundos',
      style = 'casual e engajante',
      language = 'português brasileiro'
    } = options;

    const systemPrompt = `Você é um especialista em criação de roteiros para áudio/narração de vídeos motivacionais curtos. 
Crie textos que sejam:
- CONCISOS e diretos (máximo 300-400 caracteres)
- Fluidos e naturais para leitura em voz alta
- Emocionalmente envolventes e motivacionais
- Adequados para redes sociais
- Com linguagem ${style}
- Em ${language}
- Com duração aproximada de ${duration}
- SEM títulos, subtítulos ou formatação markdown
- APENAS texto corrido para ser lido como narração`;

    const userPrompt = `Crie um texto motivacional CONCISO para narração de vídeo com tema: ${theme}
    
Baseado no seguinte contexto ou ideia: ${prompt}

IMPORTANTE: 
- MÁXIMO 300-400 CARACTERES (texto bem curto)
- Gere APENAS o texto corrido, sem títulos, sem formatação, sem estruturas markdown
- O texto deve fluir naturalmente para ser lido em voz alta
- Seja direto, impactante e motivacional
- Foque no essencial da mensagem
- O texto será convertido em áudio, então priorize fluidez na leitura
- Não use asteriscos, hashtags, números ou qualquer formatação especial`;

    console.log('Generating video script with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 200, // Reduced to generate shorter scripts
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
    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/user',
      headers: {
        'xi-api-key': apiKey
      },
      timeout: 10000
    });
    
    console.log('✅ ElevenLabs API key is valid');
    console.log('User info:', response.data);
    return { valid: true, user: response.data };
  } catch (error) {
    console.error('❌ ElevenLabs API key test failed:', error.response?.status, error.response?.data);
    return { valid: false, error: error.response?.data || error.message };
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

    console.log('🎤 Generating audio with ElevenLabs...');
    console.log(`Text preview: "${text.substring(0, 100)}..."`);
    console.log(`Text length: ${text.length} characters`);
    console.log(`Output path: ${outputPath}`);
    console.log(`API Key length: ${elevenLabsApiKey.length} characters`);
    console.log(`API Key preview: ${elevenLabsApiKey.substring(0, 8)}...${elevenLabsApiKey.substring(elevenLabsApiKey.length - 4)}`);

    // Test API key validity first
    console.log('Testing ElevenLabs API key...');
    const apiKeyTest = await testElevenLabsApiKey(elevenLabsApiKey);
    if (!apiKeyTest.valid) {
      throw new Error(`Invalid ElevenLabs API key: ${JSON.stringify(apiKeyTest.error)}`);
    }

    // Usar axios para fazer a requisição diretamente (mais confiável)
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - voz feminina
    // Outras opções de vozes em português:
    // const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - voz masculina
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

    console.log('Making request to ElevenLabs API...');
    console.log(`Using voice ID: ${voiceId}`);

    const response = await axios({
      method: 'POST',
      url: url,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey
      },
      data: requestBody,
      responseType: 'arraybuffer', // Importante para receber dados binários
      timeout: 30000 // 30 segundos timeout
    });

    console.log('Audio response received, saving file...');

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
      
      // Calculate speed adjustment needed to match audio duration
      const speedFactor = videoDuration / audioDuration;
      console.log(`Video speed adjustment factor: ${speedFactor.toFixed(3)}`);
      
      let ffmpegCommand = ffmpeg()
        .input(videoPath)  // Video input (will remove original audio)
        .input(audioPath); // New audio input
      
      if (Math.abs(speedFactor - 1.0) > 0.05) { // Only adjust if difference is > 5%
        console.log(`🎬 Adjusting video speed by factor ${speedFactor.toFixed(3)} to match new audio duration`);
        console.log(`📹 Video will be sped up/slowed down to sync with audio narration`);
        
        // Adjust video speed to match audio duration and replace audio
        ffmpegCommand = ffmpegCommand
          .videoFilter(`setpts=${(1/speedFactor).toFixed(3)}*PTS`) // Adjust video speed
          .outputOptions([
            '-c:v', 'libx264',      // Re-encode video with speed adjustment
            '-c:a', 'aac',          // Encode new audio
            '-map', '0:v:0',        // Map video from first input (original video)
            '-map', '1:a:0',        // Map audio from second input (generated audio)
            '-shortest',            // End when the shortest input ends
            '-preset', 'fast',
            '-crf', '23'
          ]);
      } else {
        console.log('🎬 Video and audio durations are similar, no speed adjustment needed');
        console.log('🔄 Simply replacing original audio with generated audio');
        
        // Just replace audio without speed adjustment
        ffmpegCommand = ffmpegCommand
          .outputOptions([
            '-c:v', 'copy',         // Copy video stream without re-encoding
            '-c:a', 'aac',          // Encode new audio
            '-map', '0:v:0',        // Map video from first input (no audio)
            '-map', '1:a:0',        // Map audio from second input (generated audio)
            '-shortest'             // End when the shortest input ends
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
      theme = 'motivacional',
      duration = '60 segundos',
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
        // Continue with other videos instead of failing completely
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
    
    if (openaiApiKey) {
      try {
        console.log(`\n=== GENERATING SCRIPT FOR COMBINED VIDEO (BEFORE PROCESSING) ===`);
        console.log(`Videos to be used: ${downloadedFiles.map(f => f.originalName).join(', ')}`);
        
        // Create a context-aware prompt based on video names and duration
        const videoContext = downloadedFiles.map(f => f.originalName).join(', ');
        const durationText = totalDuration > 60 ? `${Math.round(totalDuration/60)} minutos` : `${Math.round(totalDuration)} segundos`;
        
        // Modified prompt to generate shorter scripts for ElevenLabs quota
        const prompt = `Crie um roteiro CONCISO para um vídeo motivacional com os seguintes vídeos: ${videoContext}. 
        O vídeo tem duração de ${durationText}. 
        Crie uma mensagem motivacional impactante e direta em no máximo 300 caracteres.`;
        
        const scriptResult = await generateVideoScript(prompt, {
          theme: 'motivacional',
          duration: '30 segundos', // Force shorter duration for smaller text
          style: 'direto e impactante',
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
            console.log(`⚠️ Script foi gerado com sucesso, mas áudio não foi gerado`);
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
    
    // If audio was generated, combine it with the video
    let finalVideoPath = outputPath;
    let finalVideoFilename = outputFilename;
    
    if (generatedAudio && generatedAudio.filename) {
      try {
        console.log(`\n🎬� === REPLACING VIDEO AUDIO WITH GENERATED NARRATION ===`);
        
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
        
        console.log(`🎉 Final video with narration created: ${combinedFilename}`);
        console.log(`🔇 Original video audio removed`);
        console.log(`🎤 Generated narration audio added`);
        console.log(`🎬� === AUDIO REPLACEMENT COMPLETED ===\n`);
        
      } catch (combineError) {
        console.error(`❌ Erro ao substituir áudio do vídeo:`, combineError.message);
        console.log(`⚠️ Mantendo vídeo original com áudio original`);
        // Keep the original video if audio replacement fails
      }
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
      processedVideos: downloadedFiles.map(f => ({
        name: f.originalName,
        duration: Math.round(f.duration)
      })),
      generatedScript: generatedScript, // Include the generated script in response
      generatedAudio: generatedAudio // Include the generated audio in response
    });
    
    // Clean up the files after some time (but not immediately since user might download them)
    setTimeout(() => {
      // Clean up the final video file
      fs.remove(finalVideoPath).catch(console.error);
      console.log(`Cleaned up final video ${finalVideoFilename} after timeout`);
      
      // Also clean up audio file if it was generated
      if (generatedAudio && generatedAudio.filename) {
        const audioPath = path.join(OUTPUT_DIR, generatedAudio.filename);
        fs.remove(audioPath).catch(console.error);
        console.log(`Cleaned up generated audio ${generatedAudio.filename} after timeout`);
      }
    }, 300000); // Remove after 5 minutes
    
  } catch (error) {
    console.error(`Combine videos job ${jobId} failed:`, error.message);
    
    // Clean up on error
    const jobTempDir = path.join(TEMP_DIR, jobId);
    if (await fs.pathExists(jobTempDir)) {
      await fs.remove(jobTempDir);
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
        // Continue with other videos instead of failing completely
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
