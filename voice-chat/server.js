const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Multer for file uploads
const upload = multer({ dest: '/tmp/voice-uploads/' });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle voice upload and transcription
app.post('/voice', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file received' });
  }

  try {
    // Convert audio to wav for better recognition
    const wavFile = `/tmp/voice-${Date.now()}.wav`;
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', req.file.path,
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      wavFile,
      '-y'
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Audio conversion failed' });
      }

      // Transcribe using Python speech recognition
      const pythonScript = `
import speech_recognition as sr
import sys
try:
    r = sr.Recognizer()
    with sr.AudioFile('${wavFile}') as source:
        audio = r.record(source)
    
    # Try German first
    try:
        text = r.recognize_google(audio, language='de-DE')
        print(text)
    except:
        # Fallback to English
        try:
            text = r.recognize_google(audio, language='en-US')
            print('EN: ' + text)
        except:
            print('RECOGNITION_FAILED')
except Exception as e:
    print('ERROR: ' + str(e))
`;

      const pythonProcess = spawn('python3', ['-c', pythonScript]);
      let transcription = '';
      
      pythonProcess.stdout.on('data', (data) => {
        transcription += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp files
        fs.unlinkSync(req.file.path);
        fs.unlinkSync(wavFile);

        if (transcription.trim() && !transcription.includes('FAILED') && !transcription.includes('ERROR')) {
          // Send transcription to AI and get response
          generateAIResponse(transcription.trim())
            .then(response => {
              // Convert response to speech with better German pronunciation
              generateGermanSpeech(response)
                .then(audioFile => {
                  res.json({
                    transcription: transcription.trim(),
                    response: response,
                    audioUrl: `/audio/${path.basename(audioFile)}`
                  });
                  
                  // Broadcast to all connected clients
                  io.emit('conversation', {
                    user: transcription.trim(),
                    ai: response,
                    audioUrl: `/audio/${path.basename(audioFile)}`
                  });
                })
                .catch(err => {
                  res.status(500).json({ error: 'Speech generation failed' });
                });
            })
            .catch(err => {
              res.status(500).json({ error: 'AI response failed' });
            });
        } else {
          res.status(400).json({ error: 'Speech recognition failed' });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve generated audio files
app.use('/audio', express.static('/tmp/voice-responses/'));

// Generate AI response using local Clawdbot
async function generateAIResponse(userText) {
  return new Promise((resolve, reject) => {
    // Simple AI response logic - replace with actual Clawdbot integration
    const responses = [
      `Verstanden! Du sagtest: "${userText}". Wie kann ich dir helfen?`,
      `Interessant! Zu "${userText}" fällt mir ein: Das ist ein wichtiger Punkt.`,
      `Danke für deine Nachricht: "${userText}". Lass mich darüber nachdenken.`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    resolve(response);
  });
}

// Generate German speech with better pronunciation
async function generateGermanSpeech(text) {
  return new Promise((resolve, reject) => {
    const outputDir = '/tmp/voice-responses/';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `response-${Date.now()}.mp3`;
    const outputFile = path.join(outputDir, filename);
    
    // Use system TTS with German voice settings
    const ttsCommand = spawn('espeak', [
      '-v', 'de+f3',  // German female voice
      '-s', '150',     // Speed
      '-p', '50',      // Pitch
      '-a', '100',     // Amplitude
      '-w', outputFile.replace('.mp3', '.wav'),
      text
    ]);

    ttsCommand.on('close', (code) => {
      if (code === 0) {
        // Convert WAV to MP3 for better compatibility
        const mp3Convert = spawn('ffmpeg', [
          '-i', outputFile.replace('.mp3', '.wav'),
          '-codec:a', 'libmp3lame',
          '-b:a', '128k',
          outputFile,
          '-y'
        ]);
        
        mp3Convert.on('close', (mp3Code) => {
          if (mp3Code === 0) {
            // Clean up WAV file
            fs.unlinkSync(outputFile.replace('.mp3', '.wav'));
            resolve(outputFile);
          } else {
            reject(new Error('MP3 conversion failed'));
          }
        });
      } else {
        reject(new Error('TTS generation failed'));
      }
    });

    ttsCommand.on('error', (error) => {
      reject(error);
    });
  });
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Voice Chat Server running on http://localhost:${PORT}`);
});