const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GoogleMeetVoiceInterface {
    constructor() {
        this.setupServer();
        this.conversationHistory = [];
    }
    
    setupServer() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });
        
        // Serve the voice interface
        this.app.use(express.static(path.join(__dirname, 'meet-interface')));
        
        // Socket handling
        this.io.on('connection', (socket) => {
            console.log('User connected to Google Meet Voice Interface');
            
            socket.on('user-speech', async (audioData) => {
                try {
                    const response = await this.processUserSpeech(audioData);
                    socket.emit('ai-response', response);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            
            socket.on('text-input', async (text) => {
                try {
                    const response = await this.processTextInput(text);
                    socket.emit('ai-response', response);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
        });
    }
    
    async processUserSpeech(audioData) {
        // Convert base64 audio to file
        const audioBuffer = Buffer.from(audioData, 'base64');
        const tempFile = `/tmp/user-speech-${Date.now()}.wav`;
        fs.writeFileSync(tempFile, audioBuffer);
        
        // Transcribe
        const transcription = await this.transcribeAudio(tempFile);
        
        if (transcription) {
            return await this.generateResponse(transcription);
        }
        
        throw new Error('Speech recognition failed');
    }
    
    async processTextInput(text) {
        return await this.generateResponse(text);
    }
    
    async transcribeAudio(audioFile) {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import speech_recognition as sr
try:
    r = sr.Recognizer()
    with sr.AudioFile('${audioFile}') as source:
        audio = r.record(source)
    text = r.recognize_google(audio, language='de-DE')
    print(text)
except:
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
        });
    }
    
    async generateResponse(userText) {
        // Enhanced contextual responses for natural conversation
        const responses = {
            greeting: [
                "Hallo Ironman! Schön, dass wir uns über Google Meet unterhalten können!",
                "Hi! Das ist eine großartige Lösung für unseren Voice Chat!",
                "Hey! Jetzt können wir endlich richtig flüssig sprechen!"
            ],
            technical: [
                `Interessante technische Frage zu "${userText}". Lass mich das systematisch angehen.`,
                `Bei "${userText}" sehe ich mehrere Lösungsansätze. Am besten wäre:`,
                `Gute Frage zu "${userText}"! Mein Entwickler-Ansatz dazu:`
            ],
            general: [
                `Du sagtest "${userText}" - das ist ein wichtiger Punkt.`,
                `Zu "${userText}" kann ich folgendes beisteuern:`,
                `Das bringt mich zum Nachdenken über "${userText}". Meine Sicht:`
            ]
        };
        
        // Simple categorization
        const lower = userText.toLowerCase();
        let category = 'general';
        
        if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey')) {
            category = 'greeting';
        } else if (lower.includes('code') || lower.includes('app') || lower.includes('entwickl') || 
                   lower.includes('programm') || lower.includes('tech') || lower.includes('system')) {
            category = 'technical';
        }
        
        const responseList = responses[category];
        const aiResponse = responseList[Math.floor(Math.random() * responseList.length)];
        
        // Generate speech
        const audioFile = await this.generateSpeech(aiResponse);
        const audioData = fs.readFileSync(audioFile).toString('base64');
        
        // Add to conversation history
        this.conversationHistory.push({
            user: userText,
            ai: aiResponse,
            timestamp: Date.now()
        });
        
        return {
            transcription: userText,
            response: aiResponse,
            audioData: audioData
        };
    }
    
    async generateSpeech(text) {
        return new Promise((resolve, reject) => {
            const outputFile = `/tmp/meet-speech-${Date.now()}.wav`;
            
            // Optimized espeak for Google Meet
            const espeak = spawn('espeak', [
                '-v', 'de+f3',     // German female voice
                '-s', '125',       // Slower for clarity
                '-p', '35',        // Lower pitch
                '-a', '140',       // Higher volume for Meet
                '-g', '6',         // More gaps between words
                '-w', outputFile,
                text
            ]);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error('Speech generation failed'));
                }
            });
        });
    }
    
    start(port = 3002) {
        this.server.listen(port, () => {
            console.log(`🛡️ Google Meet Voice Interface running on http://localhost:${port}`);
            console.log('Share your screen in Google Meet to show this interface');
        });
    }
}

module.exports = GoogleMeetVoiceInterface;

if (require.main === module) {
    const voiceInterface = new GoogleMeetVoiceInterface();
    voiceInterface.start();
}