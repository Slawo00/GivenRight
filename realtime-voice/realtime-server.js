const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Global state
let activeConversations = new Map();

// WebRTC signaling for real-time audio
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize conversation state
  activeConversations.set(socket.id, {
    isListening: false,
    audioBuffer: Buffer.alloc(0),
    lastActivity: Date.now()
  });
  
  // Handle audio stream start
  socket.on('start-listening', () => {
    console.log('Starting continuous listening for:', socket.id);
    const conversation = activeConversations.get(socket.id);
    if (conversation) {
      conversation.isListening = true;
      conversation.audioBuffer = Buffer.alloc(0);
      socket.emit('listening-started');
    }
  });
  
  // Handle incoming audio chunks
  socket.on('audio-chunk', async (audioData) => {
    const conversation = activeConversations.get(socket.id);
    if (!conversation || !conversation.isListening) return;
    
    try {
      // Accumulate audio data
      const chunk = Buffer.from(audioData, 'base64');
      conversation.audioBuffer = Buffer.concat([conversation.audioBuffer, chunk]);
      conversation.lastActivity = Date.now();
      
      // Process if we have enough data (about 2 seconds at 16kHz)
      if (conversation.audioBuffer.length > 32000) {
        await processAudioChunk(socket, conversation.audioBuffer);
        conversation.audioBuffer = Buffer.alloc(0);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      socket.emit('error', { message: 'Audio processing failed' });
    }
  });
  
  // Handle silence detection
  socket.on('silence-detected', async () => {
    const conversation = activeConversations.get(socket.id);
    if (!conversation || !conversation.isListening) return;
    
    if (conversation.audioBuffer.length > 8000) {
      await processAudioChunk(socket, conversation.audioBuffer);
      conversation.audioBuffer = Buffer.alloc(0);
    }
  });
  
  // Stop listening
  socket.on('stop-listening', () => {
    const conversation = activeConversations.get(socket.id);
    if (conversation) {
      conversation.isListening = false;
      socket.emit('listening-stopped');
    }
  });
  
  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    activeConversations.delete(socket.id);
  });
});

// Process audio chunk and respond
async function processAudioChunk(socket, audioBuffer) {
  try {
    // Save audio to temp file
    const tempFile = `/tmp/voice-chunk-${Date.now()}.wav`;
    fs.writeFileSync(tempFile, audioBuffer);
    
    // Transcribe audio
    const transcription = await transcribeAudio(tempFile);
    
    if (transcription && !transcription.includes('FAILED') && transcription.trim().length > 0) {
      console.log('Transcribed:', transcription);
      
      // Generate AI response
      const aiResponse = await generateRealtimeResponse(transcription.trim());
      
      // Convert to speech and stream back
      const audioResponse = await generateRealtimeSpeech(aiResponse);
      
      // Send response to client
      socket.emit('ai-response', {
        transcription: transcription.trim(),
        response: aiResponse,
        audioData: audioResponse
      });
    }
    
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    
  } catch (error) {
    console.error('Error in processAudioChunk:', error);
    socket.emit('error', { message: 'Processing failed: ' + error.message });
  }
}

// Fast transcription using local speech recognition
async function transcribeAudio(audioFile) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import speech_recognition as sr
import wave
import sys

try:
    # Read raw audio data and create proper WAV
    with open('${audioFile}', 'rb') as f:
        raw_data = f.read()
    
    # Create proper WAV file
    wav_file = '${audioFile.replace('.wav', '_proper.wav')}'
    with wave.open(wav_file, 'wb') as wav:
        wav.setnchannels(1)  # Mono
        wav.setsampwidth(2)  # 16-bit
        wav.setframerate(16000)  # 16kHz
        wav.writeframes(raw_data)
    
    # Transcribe
    r = sr.Recognizer()
    with sr.AudioFile(wav_file) as source:
        audio = r.record(source)
    
    # Try German first, then English
    try:
        text = r.recognize_google(audio, language='de-DE')
        print(text)
    except:
        try:
            text = r.recognize_google(audio, language='en-US')
            print(text)
        except:
            print('')
            
except Exception as e:
    print('')
`;

    const python = spawn('python3', ['-c', pythonScript]);
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', () => {
      resolve(output.trim());
    });
    
    python.on('error', () => {
      resolve('');
    });
  });
}

// Generate contextual AI responses
async function generateRealtimeResponse(userText) {
  // Context-aware responses for natural conversation
  const responses = {
    greeting: [
      "Hallo! Schön, dass wir uns unterhalten.",
      "Hi Ironman! Wie geht es dir heute?",
      "Hey! Was beschäftigt dich gerade?"
    ],
    question: [
      `Das ist eine gute Frage zu "${userText}". Lass mich überlegen...`,
      `Interessant! Zu "${userText}" kann ich sagen:`,
      `Das beschäftigt mich auch. Meine Gedanken zu "${userText}":`
    ],
    technical: [
      `Ah, ein technisches Thema! Zu "${userText}" - das ist mein Gebiet.`,
      `Spannend! Bei "${userText}" würde ich so vorgehen:`,
      `Gute technische Frage! "${userText}" löse ich normalerweise so:`
    ],
    general: [
      `Verstehe. Du meinst "${userText}" - das sehe ich auch so.`,
      `Ja, "${userText}" ist wirklich wichtig. Was denkst du weiter darüber?`,
      `Das bringt mich zum Nachdenken. Bei "${userText}" fällt mir auf:`
    ]
  };
  
  // Simple categorization
  const lower = userText.toLowerCase();
  let category = 'general';
  
  if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey')) {
    category = 'greeting';
  } else if (lower.includes('?') || lower.includes('wie') || lower.includes('was') || lower.includes('warum')) {
    category = 'question';
  } else if (lower.includes('code') || lower.includes('app') || lower.includes('entwickl') || lower.includes('programm') || lower.includes('tech')) {
    category = 'technical';
  }
  
  const responseList = responses[category];
  return responseList[Math.floor(Math.random() * responseList.length)];
}

// Generate German speech optimized for real-time
async function generateRealtimeSpeech(text) {
  return new Promise((resolve, reject) => {
    const outputFile = `/tmp/realtime-speech-${Date.now()}.wav`;
    
    // Use espeak for fast generation
    const espeak = spawn('espeak', [
      '-v', 'de+f3',     // German female voice
      '-s', '160',       // Slightly faster for natural conversation
      '-p', '40',        // Lower pitch
      '-a', '110',       // Good volume
      '-w', outputFile,  // Write to file
      text
    ]);
    
    espeak.on('close', (code) => {
      if (code === 0) {
        try {
          // Read and encode audio data
          const audioData = fs.readFileSync(outputFile);
          const base64Audio = audioData.toString('base64');
          
          // Cleanup
          fs.unlinkSync(outputFile);
          resolve(base64Audio);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Speech generation failed'));
      }
    });
    
    espeak.on('error', reject);
  });
}

// Cleanup old conversations
setInterval(() => {
  const now = Date.now();
  for (const [socketId, conversation] of activeConversations) {
    if (now - conversation.lastActivity > 300000) { // 5 minutes
      activeConversations.delete(socketId);
      console.log('Cleaned up inactive conversation:', socketId);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime Voice Server running on http://localhost:${PORT}`);
});