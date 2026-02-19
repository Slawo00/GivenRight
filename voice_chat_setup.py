#!/usr/bin/env python3
import json
import requests
import time
import subprocess
import os
from pathlib import Path

class VoiceChatSystem:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.telegram_session_active = True
        
    def setup_audio_processing(self):
        """Install required audio processing tools"""
        print("🎤 Setting up audio processing...")
        
        # Install FFmpeg and audio tools
        subprocess.run(['apt', 'update'], check=True)
        subprocess.run(['apt', 'install', '-y', 'ffmpeg', 'sox', 'alsa-utils', 'pulseaudio'], check=True)
        
        # Install Python audio libraries
        subprocess.run(['pip3', 'install', 'openai', 'pydub', 'speech-recognition', 'pyaudio'], check=True)
        
        print("✅ Audio processing tools installed")
        
    def transcribe_audio(self, audio_file_path):
        """Transcribe audio using OpenAI Whisper"""
        print(f"🎧 Transcribing: {audio_file_path}")
        
        try:
            # Convert OGG to WAV if needed
            if audio_file_path.endswith('.ogg'):
                wav_path = audio_file_path.replace('.ogg', '.wav')
                subprocess.run(['ffmpeg', '-i', audio_file_path, wav_path, '-y'], 
                             capture_output=True, check=True)
                audio_file_path = wav_path
            
            # Use OpenAI Whisper API
            with open(audio_file_path, 'rb') as audio_file:
                response = requests.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    headers={'Authorization': f'Bearer {self.openai_api_key}'},
                    files={'file': audio_file},
                    data={'model': 'whisper-1'}
                )
                
            if response.status_code == 200:
                transcription = response.json()['text']
                print(f"📝 Transcription: {transcription}")
                return transcription
            else:
                print(f"❌ Whisper API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Transcription failed: {e}")
            return None
    
    def text_to_speech(self, text, voice="nova"):
        """Convert text to speech using OpenAI TTS"""
        print(f"🔊 Converting to speech: {text[:50]}...")
        
        try:
            response = requests.post(
                'https://api.openai.com/v1/audio/speech',
                headers={'Authorization': f'Bearer {self.openai_api_key}'},
                json={
                    'model': 'tts-1',
                    'voice': voice,
                    'input': text
                }
            )
            
            if response.status_code == 200:
                audio_path = f'/tmp/response_{int(time.time())}.mp3'
                with open(audio_path, 'wb') as f:
                    f.write(response.content)
                print(f"🎵 Audio saved: {audio_path}")
                return audio_path
            else:
                print(f"❌ TTS API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ TTS failed: {e}")
            return None
    
    def monitor_telegram_audio(self):
        """Monitor for new audio messages from Telegram"""
        print("👂 Monitoring Telegram for audio messages...")
        
        # Check for recent audio files
        media_dir = Path('/root/.clawdbot/media/inbound/')
        if not media_dir.exists():
            print("❌ Media directory not found")
            return
            
        # Get recent OGG files
        audio_files = list(media_dir.glob('*.ogg'))
        audio_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        if audio_files:
            latest_audio = audio_files[0]
            # Check if file is recent (last 5 minutes)
            if time.time() - latest_audio.stat().st_mtime < 300:
                print(f"🎤 New audio detected: {latest_audio}")
                return str(latest_audio)
        
        return None
    
    def send_telegram_audio_response(self, audio_path):
        """Send audio response back via Telegram"""
        print(f"📱 Sending audio response via Telegram...")
        
        # Use the message tool to send audio
        try:
            # This would integrate with Clawdbot's message system
            print(f"🎵 Audio response ready: {audio_path}")
            print("📨 Use: message tool with media attachment")
            return True
        except Exception as e:
            print(f"❌ Failed to send audio: {e}")
            return False
    
    def start_voice_chat_loop(self):
        """Main voice chat loop"""
        print("🎙️ VOICE CHAT SYSTEM ACTIVATED")
        print("Listening for audio messages...")
        
        while True:
            try:
                # Check for new audio
                audio_file = self.monitor_telegram_audio()
                
                if audio_file:
                    # Transcribe audio
                    text = self.transcribe_audio(audio_file)
                    
                    if text:
                        print(f"👤 User said: {text}")
                        
                        # Generate response (this would use your normal AI processing)
                        response_text = f"I heard you say: {text}. This is a test response."
                        
                        # Convert response to audio
                        audio_response = self.text_to_speech(response_text)
                        
                        if audio_response:
                            # Send back via Telegram
                            self.send_telegram_audio_response(audio_response)
                            print("✅ Voice conversation completed")
                        
                    # Wait before checking again
                    time.sleep(10)
                else:
                    # No new audio, wait
                    time.sleep(5)
                    
            except KeyboardInterrupt:
                print("\n🛑 Voice chat stopped")
                break
            except Exception as e:
                print(f"❌ Voice chat error: {e}")
                time.sleep(5)

def main():
    print("🎙️ VOICE CHAT SYSTEM SETUP")
    
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ OPENAI_API_KEY not found in environment")
        print("Set it with: export OPENAI_API_KEY='your-key'")
        return
    
    chat_system = VoiceChatSystem()
    
    try:
        # Setup audio processing
        chat_system.setup_audio_processing()
        
        # Start voice chat
        chat_system.start_voice_chat_loop()
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")

if __name__ == "__main__":
    main()