const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Replace with your bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Telegram Voice Bot started...');

// Handle voice messages
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.voice.file_id;
  
  try {
    // Send "processing" message
    const processingMsg = await bot.sendMessage(chatId, '🎤 Verstehe deine Nachricht...');
    
    // Get file info and download
    const file = await bot.getFile(fileId);
    const filePath = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Download the voice file
    const response = await fetch(filePath);
    const buffer = await response.arrayBuffer();
    const tempFile = `/tmp/voice-${Date.now()}.ogg`;
    
    fs.writeFileSync(tempFile, Buffer.from(buffer));
    
    // Convert to WAV for speech recognition
    const wavFile = tempFile.replace('.ogg', '.wav');
    await convertToWav(tempFile, wavFile);
    
    // Transcribe the audio
    const transcription = await transcribeAudio(wavFile);
    
    if (transcription && !transcription.includes('FAILED')) {
      // Generate AI response
      const aiResponse = await generateAIResponse(transcription);
      
      // Generate German speech
      const audioFile = await generateGermanSpeech(aiResponse);
      
      // Send response as voice message
      await bot.sendVoice(chatId, audioFile, {
        caption: `Du: "${transcription}"\n\nAegis: ${aiResponse}`
      });
      
      // Clean up temp files
      [tempFile, wavFile, audioFile].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      
    } else {
      await bot.sendMessage(chatId, '❌ Entschuldigung, ich konnte deine Stimme nicht verstehen. Versuche es nochmal.');
    }
    
    // Delete processing message
    await bot.deleteMessage(chatId, processingMsg.message_id);
    
  } catch (error) {
    console.error('Error processing voice:', error);
    await bot.sendMessage(chatId, '❌ Fehler beim Verarbeiten der Sprachnachricht: ' + error.message);
  }
});

// Handle text messages
bot.on('message', async (msg) => {
  if (msg.voice) return; // Already handled above
  
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text === '/start') {
    await bot.sendMessage(chatId, 
      '🛡️ *Aegis Voice Chat*\n\n' +
      'Hallo Ironman! Ich bin bereit für natürliche Gespräche.\n\n' +
      '🎤 *Sende mir eine Sprachnachricht* und ich antworte dir mit Sprache!\n\n' +
      'Jetzt können wir uns endlich richtig unterhalten! 🚀',
      { parse_mode: 'Markdown' }
    );
  } else if (text && text.startsWith('/')) {
    // Handle other commands
    return;
  } else if (text) {
    // Handle text input -> voice response
    try {
      const aiResponse = await generateAIResponse(text);
      const audioFile = await generateGermanSpeech(aiResponse);
      
      await bot.sendVoice(chatId, audioFile, {
        caption: `Du: "${text}"\n\nAegis: ${aiResponse}`
      });
      
      if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Fehler: ' + error.message);
    }
  }
});

// Convert OGG to WAV
function convertToWav(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputFile,
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      outputFile,
      '-y'
    ]);
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });
  });
}

// Transcribe audio using Python speech recognition
function transcribeAudio(audioFile) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import speech_recognition as sr
import sys
try:
    r = sr.Recognizer()
    with sr.AudioFile('${audioFile}') as source:
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
    
    const python = spawn('python3', ['-c', pythonScript]);
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      resolve(output.trim());
    });
    
    python.on('error', (error) => {
      reject(error);
    });
  });
}

// Generate AI response
async function generateAIResponse(userText) {
  // Enhanced responses based on context
  const responses = {
    greeting: [
      `Hallo Ironman! Schön, dass wir uns unterhalten können. Zu "${userText}" kann ich sagen: Das ist ein guter Punkt!`,
      `Hi! Du sagtest: "${userText}" - das finde ich interessant. Erzähl mir mehr darüber!`,
      `Freut mich, von dir zu hören! Zu "${userText}": Das beschäftigt mich auch. Was denkst du denn darüber?`
    ],
    technical: [
      `Interessante technische Frage zu "${userText}". Lass mich überlegen... Das könnte man so lösen: Mit einer systematischen Herangehensweise.`,
      `Zu "${userText}": Das ist ein komplexes Thema. Mein Ansatz wäre: Erst analysieren, dann implementieren.`,
      `Du fragst nach "${userText}" - das ist genau mein Bereich! Ich würde das so angehen: Architektur first, dann Code.`
    ],
    general: [
      `Du sagtest: "${userText}". Das ist wirklich interessant! Was sind deine Gedanken dazu?`,
      `Zu "${userText}" fällt mir ein: Das ist ein wichtiger Punkt, den viele übersehen.`,
      `Danke für "${userText}". Das bringt mich zum Nachdenken. Wie siehst du das denn?`
    ]
  };
  
  // Simple keyword detection for response type
  const lowerText = userText.toLowerCase();
  let responseType = 'general';
  
  if (lowerText.includes('hallo') || lowerText.includes('hi') || lowerText.includes('hey')) {
    responseType = 'greeting';
  } else if (lowerText.includes('code') || lowerText.includes('app') || lowerText.includes('entwickl') || lowerText.includes('programm')) {
    responseType = 'technical';
  }
  
  const responseArray = responses[responseType];
  return responseArray[Math.floor(Math.random() * responseArray.length)];
}

// Generate German speech
function generateGermanSpeech(text) {
  return new Promise((resolve, reject) => {
    const outputDir = '/tmp/voice-responses/';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `response-${Date.now()}.mp3`;
    const outputFile = path.join(outputDir, filename);
    const wavFile = outputFile.replace('.mp3', '.wav');
    
    // Use espeak with better German pronunciation
    const espeak = spawn('espeak', [
      '-v', 'de+f3',  // German female voice
      '-s', '140',     // Speed (slower for better understanding)
      '-p', '45',      // Pitch (lower, more natural)
      '-a', '120',     // Volume
      '-w', wavFile,
      text
    ]);
    
    espeak.on('close', (code) => {
      if (code === 0) {
        // Convert WAV to MP3 for Telegram
        const ffmpeg = spawn('ffmpeg', [
          '-i', wavFile,
          '-codec:a', 'libmp3lame',
          '-b:a', '128k',
          '-ar', '44100',
          outputFile,
          '-y'
        ]);
        
        ffmpeg.on('close', (mp3Code) => {
          if (mp3Code === 0) {
            // Clean up WAV file
            if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile);
            resolve(outputFile);
          } else {
            reject(new Error('MP3 conversion failed'));
          }
        });
      } else {
        reject(new Error('eSpeak failed'));
      }
    });
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});