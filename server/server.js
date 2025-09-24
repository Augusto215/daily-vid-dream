const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3001;

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
    
    // Prepare output filename
    const outputFilename = `combined_${jobId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    // Concatenate videos using FFmpeg
    await concatenateVideos(
      downloadedFiles.map(f => f.path),
      outputPath
    );
    
    // Calculate total duration and file size
    const totalDuration = downloadedFiles.reduce((sum, file) => sum + file.duration, 0);
    const outputStats = await fs.stat(outputPath);
    
    // Clean up temporary files
    await fs.remove(jobTempDir);
    
    console.log(`Job ${jobId} completed successfully - Output file: ${outputFilename}`);
    
    // Return the actual video file as response
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', outputStats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    const readStream = fs.createReadStream(outputPath);
    readStream.pipe(res);
    
    // Clean up the file after sending (optional)
    readStream.on('end', () => {
      console.log(`Combined video ${outputFilename} sent successfully`);
      // Optionally remove the file after sending
      setTimeout(() => {
        fs.remove(outputPath).catch(console.error);
      }, 60000); // Remove after 1 minute
    });
    
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
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = await fs.stat(filePath);
    
    res.setHeader('Content-Type', 'video/mp4');
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
