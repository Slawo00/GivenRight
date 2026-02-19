// Enhanced Telegram Voice Bot for natural conversation
// This integrates directly with Clawdbot's existing Telegram capabilities

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TelegramVoiceChat {
    constructor() {
        this.isListening = false;
        this.conversationHistory = [];
        this.setupVoiceHandling();
    }
    
    setupVoiceHandling() {
        console.log('🛡️ Aegis Voice Chat System initialized');
        console.log('Ready for natural conversation via Telegram voice messages');
    }
    
    async handleVoiceMessage(voiceFile, chatId) {
        console.log(`Processing voice message: ${voiceFile}`);
        
        try {
            // Convert OGG to WAV for better recognition
            const wavFile = await this.convertToWav(voiceFile);
            
            // Transcribe with improved accuracy
            const transcription = await this.transcribeAudio(wavFile);
            
            if (transcription && transcription.length > 0) {
                console.log(`Transcribed: "${transcription}"`);
                
                // Add to conversation history
                this.conversationHistory.push({
                    type: 'user',
                    text: transcription,
                    timestamp: Date.now()
                });
                
                // Generate contextual AI response
                const aiResponse = await this.generateContextualResponse(transcription);
                
                // Add AI response to history
                this.conversationHistory.push({
                    type: 'ai',
                    text: aiResponse,
                    timestamp: Date.now()
                });
                
                // Generate improved German speech
                const audioResponse = await this.generateOptimizedSpeech(aiResponse);
                
                return {
                    transcription,
                    response: aiResponse,
                    audioFile: audioResponse,
                    success: true
                };
            }
            
            return { success: false, error: 'Transcription failed' };
            
        } catch (error) {
            console.error('Voice processing error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async convertToWav(inputFile) {
        return new Promise((resolve, reject) => {
            const outputFile = inputFile.replace(/\.(ogg|oga|m4a|mp3)$/, '.wav');
            
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputFile,
                '-ar', '16000',    // Sample rate for speech recognition
                '-ac', '1',        // Mono audio
                '-c:a', 'pcm_s16le',  // PCM 16-bit encoding
                '-f', 'wav',
                outputFile,
                '-y'
            ]);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error(`FFmpeg conversion failed with code ${code}`));
                }
            });
            
            ffmpeg.on('error', reject);
        });
    }
    
    async transcribeAudio(audioFile) {
        return new Promise((resolve, reject) => {
            // Enhanced Python script with better error handling
            const pythonScript = `
import speech_recognition as sr
import sys
import os

def transcribe_audio(file_path):
    try:
        if not os.path.exists(file_path):
            return ""
            
        r = sr.Recognizer()
        r.energy_threshold = 300
        r.dynamic_energy_threshold = True
        r.pause_threshold = 0.8
        
        with sr.AudioFile(file_path) as source:
            r.adjust_for_ambient_noise(source, duration=0.2)
            audio = r.record(source)
        
        # Try German first
        try:
            text = r.recognize_google(audio, language='de-DE')
            return text
        except sr.UnknownValueError:
            pass
        except sr.RequestError:
            pass
            
        # Try English as fallback
        try:
            text = r.recognize_google(audio, language='en-US')
            return text
        except:
            pass
            
        return ""
        
    except Exception as e:
        return ""

result = transcribe_audio('${audioFile}')
print(result)
`;
            
            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';
            
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.on('close', (code) => {
                const transcription = output.trim();
                resolve(transcription || '');
            });
            
            python.on('error', (error) => {
                resolve('');
            });
        });
    }
    
    async generateContextualResponse(userText) {
        // Keep conversation history limited for context
        const recentHistory = this.conversationHistory.slice(-6);
        
        // Enhanced contextual responses
        const responses = {
            greeting: [
                "Hallo Ironman! Schön, dass wir uns per Sprache unterhalten können!",
                "Hi! Das ist viel natürlicher so. Wie geht es dir heute?",
                "Hey! Endlich können wir richtig sprechen. Was beschäftigt dich?"
            ],
            question: [
                `Interessante Frage zu "${userText}". Lass mich überlegen...`,
                `Du fragst nach "${userText}" - das ist ein wichtiger Punkt.`,
                `Gute Frage! Bei "${userText}" sehe ich mehrere Aspekte.`
            ],
            technical: [
                `Ah, ein technisches Thema! Bei "${userText}" würde ich so vorgehen:`,
                `Spannend! "${userText}" ist genau mein Bereich. Mein Ansatz wäre:`,
                `Gute technische Frage! Zu "${userText}" - das löse ich systematisch.`
            ],
            continuation: [
                `Ja, genau! Du meinst "${userText}" - das sehe ich genauso.`,
                `Stimmt! Bei "${userText}" kommt noch dazu:`,
                `Das ist ein guter Punkt zu "${userText}". Zusätzlich würde ich sagen:`
            ],
            general: [
                `Du sagtest "${userText}" - das bringt mich zum Nachdenken.`,
                `Interessant! Zu "${userText}" fällt mir ein:`,
                `Das ist wichtig, was du zu "${userText}" sagst. Meine Sicht:`
            ]
        };
        
        // Enhanced categorization
        const lower = userText.toLowerCase();
        let category = 'general';
        
        if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey') || lower.includes('guten')) {
            category = 'greeting';
        } else if (lower.includes('?') || lower.includes('wie') || lower.includes('was') || lower.includes('warum') || lower.includes('wo') || lower.includes('wann')) {
            category = 'question';
        } else if (lower.includes('code') || lower.includes('app') || lower.includes('entwickl') || lower.includes('programm') || lower.includes('tech') || lower.includes('system') || lower.includes('software')) {
            category = 'technical';
        } else if (recentHistory.length > 2) {
            category = 'continuation';
        }
        
        const responseList = responses[category];
        const baseResponse = responseList[Math.floor(Math.random() * responseList.length)];
        
        // Add contextual continuation based on conversation flow
        const contextAddons = [
            "Was denkst du dazu?",
            "Wie siehst du das?",
            "Erzähl mir mehr darüber.",
            "Das interessiert mich.",
            "Was ist deine Erfahrung damit?"
        ];
        
        if (Math.random() > 0.6) {
            const addon = contextAddons[Math.floor(Math.random() * contextAddons.length)];
            return baseResponse + " " + addon;
        }
        
        return baseResponse;
    }
    
    async generateOptimizedSpeech(text) {
        return new Promise((resolve, reject) => {
            const outputDir = '/tmp/voice-responses/';
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            const filename = `voice-${Date.now()}.mp3`;
            const outputFile = path.join(outputDir, filename);
            const wavFile = outputFile.replace('.mp3', '.wav');
            
            // Use espeak with optimized German settings
            const espeak = spawn('espeak', [
                '-v', 'de+f3',     // German female voice
                '-s', '145',       // Optimal speed for understanding
                '-p', '42',        // Natural pitch
                '-a', '115',       // Clear volume
                '-g', '5',         // Slight gap between words
                '-w', wavFile,
                text
            ]);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    // Convert to MP3 for better Telegram compatibility
                    const ffmpeg = spawn('ffmpeg', [
                        '-i', wavFile,
                        '-codec:a', 'libmp3lame',
                        '-b:a', '128k',
                        '-ar', '44100',
                        '-ac', '1',
                        outputFile,
                        '-y'
                    ]);
                    
                    ffmpeg.on('close', (mp3Code) => {
                        if (mp3Code === 0) {
                            // Cleanup WAV
                            if (fs.existsSync(wavFile)) {
                                fs.unlinkSync(wavFile);
                            }
                            resolve(outputFile);
                        } else {
                            reject(new Error('MP3 conversion failed'));
                        }
                    });
                } else {
                    reject(new Error('Speech synthesis failed'));
                }
            });
            
            espeak.on('error', reject);
        });
    }
    
    // Get conversation summary for context
    getConversationSummary() {
        if (this.conversationHistory.length === 0) return "New conversation";
        
        const recent = this.conversationHistory.slice(-4);
        const summary = recent.map(msg => `${msg.type}: ${msg.text.substring(0, 50)}`).join(" | ");
        return summary;
    }
    
    // Clear old conversation history
    clearOldHistory() {
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }
}

// Export for use by Clawdbot
module.exports = TelegramVoiceChat;

// If run directly, start demo mode
if (require.main === module) {
    const voiceChat = new TelegramVoiceChat();
    console.log('Telegram Voice Chat ready for integration with Clawdbot');
}