#!/usr/bin/env python3
"""
🛡️ Aegis Simple Telegram Voice Chat
Direkte Integration in bestehenden Clawdbot Workflow
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path

def transcribe_telegram_voice(audio_file_path):
    """Transkribiere Telegram Sprachnachricht"""
    print(f"🎤 Transkribiere: {audio_file_path}")
    
    try:
        # Konvertiere zu WAV
        temp_wav = f"/tmp/telegram_voice_{os.getpid()}.wav"
        
        subprocess.run([
            'ffmpeg', '-i', audio_file_path,
            '-ar', '16000', '-ac', '1',
            '-c:a', 'pcm_s16le',
            temp_wav, '-y'
        ], capture_output=True, check=True)
        
        # Verwende Python Speech Recognition
        import speech_recognition as sr
        
        r = sr.Recognizer()
        r.energy_threshold = 300
        r.dynamic_energy_threshold = True
        
        with sr.AudioFile(temp_wav) as source:
            r.adjust_for_ambient_noise(source, duration=0.2)
            audio = r.record(source)
        
        # Deutsch zuerst, dann Englisch
        try:
            text = r.recognize_google(audio, language='de-DE')
            print(f"✅ Verstanden (DE): {text}")
            return text
        except:
            try:
                text = r.recognize_google(audio, language='en-US')
                print(f"✅ Verstanden (EN): {text}")
                return text
            except:
                return None
                
    except Exception as e:
        print(f"❌ Transkription fehlgeschlagen: {e}")
        return None
    finally:
        # Cleanup
        if os.path.exists(temp_wav):
            os.remove(temp_wav)

def generate_ai_response(user_text):
    """Generiere intelligente Antwort"""
    responses = {
        'greeting': [
            f"Hallo Ironman! Du sagtest '{user_text}' - schön, dass wir jetzt per Sprache kommunizieren!",
            f"Hi! Das funktioniert ja perfekt. Zu '{user_text}' kann ich sagen: Endlich können wir richtig sprechen!",
            f"Hey! Super, dass das Voice System läuft. '{user_text}' - das ist ein guter Start!"
        ],
        'technical': [
            f"Interessante technische Frage zu '{user_text}'. Lass mich das systematisch angehen.",
            f"Bei '{user_text}' sehe ich verschiedene Lösungsansätze. Am besten wäre:",
            f"Gute Frage zu '{user_text}'! Aus Entwickler-Sicht würde ich empfehlen:"
        ],
        'voice_feedback': [
            f"Du meintest '{user_text}' - hoffentlich ist meine neue Stimme jetzt besser verständlich!",
            f"Zu '{user_text}': Die Coqui TTS sollte deutlich natürlicher klingen als vorhin.",
            f"'{user_text}' - endlich eine deutsche Stimme die nicht wie ein Roboter klingt, oder?"
        ],
        'general': [
            f"Du sagtest '{user_text}' - das ist ein wichtiger Punkt. Was denkst du weiter dazu?",
            f"Interessant! Zu '{user_text}' fällt mir ein: Das können wir gut ausbauen.",
            f"'{user_text}' - da stimme ich zu. Wie sollen wir das angehen?"
        ]
    }
    
    # Kategorisierung
    text_lower = user_text.lower()
    
    if any(word in text_lower for word in ['hallo', 'hi', 'hey', 'guten']):
        category = 'greeting'
    elif any(word in text_lower for word in ['stimme', 'sprache', 'hören', 'verstehen', 'klingen']):
        category = 'voice_feedback'
    elif any(word in text_lower for word in ['code', 'app', 'entwickl', 'programm', 'tech']):
        category = 'technical'
    else:
        category = 'general'
    
    import random
    return random.choice(responses[category])

def generate_speech_with_coqui(text, output_file):
    """Generiere Sprache mit Coqui TTS (falls verfügbar)"""
    try:
        from TTS.api import TTS
        
        print(f"🗣️ Generiere Coqui-Sprache: {text[:50]}...")
        
        # Verwende bestes deutsches Modell
        try:
            # Deutsches Thorsten-Modell (beste Qualität)
            tts = TTS(model_name="tts_models/de/thorsten/tacotron2-DDC")
            tts.tts_to_file(text=text, file_path=output_file)
            print("✅ Deutsche Stimme (Thorsten) verwendet")
            return True
        except:
            # Fallback: Multilingual
            try:
                tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
                tts.tts_to_file(text=text, file_path=output_file, language="de")
                print("✅ Multilingual Stimme verwendet")
                return True
            except Exception as e:
                print(f"❌ Coqui TTS fehlgeschlagen: {e}")
                return False
                
    except ImportError:
        print("⏳ Coqui TTS noch nicht verfügbar")
        return False

def generate_speech_with_espeak(text, output_file):
    """Fallback: eSpeak mit optimierten Einstellungen"""
    try:
        print(f"🗣️ Generiere eSpeak-Sprache: {text[:50]}...")
        
        # Beste eSpeak-Einstellungen für Deutsch
        subprocess.run([
            'espeak', 
            '-v', 'de+f3',    # Deutsche weibliche Stimme
            '-s', '120',      # Langsamer als vorhin
            '-p', '32',       # Tiefere Stimme
            '-a', '140',      # Lautstärke
            '-g', '12',       # Längere Pausen
            '-w', output_file,
            text
        ], check=True, capture_output=True)
        
        print("✅ eSpeak Sprache generiert")
        return True
        
    except Exception as e:
        print(f"❌ eSpeak fehlgeschlagen: {e}")
        return False

def process_telegram_voice_message(audio_file_path):
    """Hauptfunktion: Voice-to-Voice für Telegram"""
    print("\n🛡️ Aegis Voice Processing")
    print("=" * 40)
    
    # 1. Transkribieren
    transcription = transcribe_telegram_voice(audio_file_path)
    if not transcription:
        return None, None, "Spracherkennung fehlgeschlagen ❌"
    
    # 2. AI-Antwort generieren
    ai_response = generate_ai_response(transcription)
    print(f"🧠 AI Antwort: {ai_response}")
    
    # 3. Sprache generieren
    output_file = f"/tmp/aegis_response_{os.getpid()}.wav"
    
    # Versuche zuerst Coqui, dann eSpeak
    if generate_speech_with_coqui(ai_response, output_file):
        speech_engine = "Coqui TTS"
    elif generate_speech_with_espeak(ai_response, output_file):
        speech_engine = "eSpeak (optimiert)"
    else:
        return transcription, ai_response, "Sprachgenerierung fehlgeschlagen ❌"
    
    print(f"✅ Voice Processing abgeschlossen mit {speech_engine}")
    return transcription, ai_response, output_file

def main():
    """Test-Modus"""
    if len(sys.argv) != 2:
        print("Usage: python3 simple-telegram-voice.py <audio_file>")
        print("Beispiel: python3 simple-telegram-voice.py /path/to/voice.ogg")
        return 1
    
    audio_file = sys.argv[1]
    
    if not os.path.exists(audio_file):
        print(f"❌ Audio-Datei nicht gefunden: {audio_file}")
        return 1
    
    # Verarbeite Sprachnachricht
    transcription, response, audio_output = process_telegram_voice_message(audio_file)
    
    if audio_output and not audio_output.endswith("❌"):
        print(f"\n📝 Du: {transcription}")
        print(f"🛡️ Aegis: {response}")
        print(f"🔊 Audio: {audio_output}")
        
        # Versuche Wiedergabe
        try:
            subprocess.run(['aplay', audio_output], check=True, capture_output=True)
            print("🔊 Audio abgespielt!")
        except:
            print("ℹ️ Audio-Datei gespeichert (Wiedergabe nicht verfügbar)")
    else:
        print(f"❌ Fehler: {audio_output}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())