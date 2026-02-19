#!/usr/bin/env python3
"""
🛡️ Aegis Voice Chat mit Coqui TTS
Kostenlose, hochwertige deutsche Sprachsynthese
"""

import os
import sys
import tempfile
import subprocess
import json
from pathlib import Path

class AegisVoiceChat:
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "aegis_voice"
        self.temp_dir.mkdir(exist_ok=True)
        self.conversation_history = []
        
    def setup_coqui_tts(self):
        """Initialisiere Coqui TTS mit deutschem Modell"""
        try:
            # Import erst nach Installation
            from TTS.api import TTS
            
            # Verfügbare deutsche Modelle anzeigen
            print("🔍 Suche deutsche TTS-Modelle...")
            
            # Bestes deutsches Modell laden
            # tts_models/de/thorsten/tacotron2-DDC ist speziell für Deutsch optimiert
            self.tts = TTS(model_name="tts_models/de/thorsten/tacotron2-DDC")
            
            print("✅ Coqui TTS mit deutschem Modell geladen!")
            return True
            
        except ImportError:
            print("❌ Coqui TTS noch nicht installiert. Warte auf Installation...")
            return False
        except Exception as e:
            print(f"❌ Fehler beim Laden des deutschen Modells: {e}")
            
            # Fallback: Multilingual Model
            try:
                self.tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ Multilingual XTTS v2 Modell geladen (Fallback)")
                return True
            except Exception as e2:
                print(f"❌ Auch Fallback fehlgeschlagen: {e2}")
                return False
    
    def transcribe_audio(self, audio_file):
        """Transkribiere Audio mit optimierter Spracherkennung"""
        try:
            # Konvertiere zu WAV falls nötig
            wav_file = self.convert_to_wav(audio_file)
            
            # Verwende verbesserte Python Speech Recognition
            import speech_recognition as sr
            
            r = sr.Recognizer()
            r.energy_threshold = 300
            r.dynamic_energy_threshold = True
            r.pause_threshold = 0.8
            r.operation_timeout = 10
            
            with sr.AudioFile(wav_file) as source:
                r.adjust_for_ambient_noise(source, duration=0.3)
                audio = r.record(source)
            
            # Versuche zuerst Deutsch, dann Englisch
            try:
                text = r.recognize_google(audio, language='de-DE')
                print(f"🎤 Verstanden (DE): {text}")
                return text
            except sr.UnknownValueError:
                try:
                    text = r.recognize_google(audio, language='en-US')
                    print(f"🎤 Verstanden (EN): {text}")
                    return text
                except:
                    return None
            except sr.RequestError as e:
                print(f"❌ Google Speech Recognition Fehler: {e}")
                return None
                
        except Exception as e:
            print(f"❌ Transkription fehlgeschlagen: {e}")
            return None
    
    def convert_to_wav(self, audio_file):
        """Konvertiere Audio zu WAV für bessere Erkennung"""
        wav_file = self.temp_dir / f"converted_{os.path.basename(audio_file)}.wav"
        
        try:
            subprocess.run([
                'ffmpeg', '-i', str(audio_file),
                '-ar', '16000',  # 16kHz Sample Rate
                '-ac', '1',      # Mono
                '-c:a', 'pcm_s16le',  # PCM 16-bit
                str(wav_file), '-y'
            ], check=True, capture_output=True)
            
            return str(wav_file)
        except subprocess.CalledProcessError as e:
            print(f"❌ Audio-Konvertierung fehlgeschlagen: {e}")
            return str(audio_file)  # Return original if conversion fails
    
    def generate_response(self, user_text):
        """Generiere kontextuelle AI-Antwort"""
        # Erweiterte kontextuelle Antworten
        responses = {
            'greeting': [
                f"Hallo Ironman! Schön dass wir jetzt mit Coqui TTS sprechen können. Du sagtest: '{user_text}' - das freut mich!",
                f"Hi! Endlich eine natürliche deutsche Stimme! Zu deiner Nachricht '{user_text}' kann ich sagen: Das ist ein guter Start!",
                f"Hey! Coqui TTS funktioniert! Du meintest '{user_text}' - lass uns das ausbauen!"
            ],
            'technical': [
                f"Spannende technische Frage zu '{user_text}'. Mit Coqui TTS können wir jetzt richtig entwickeln!",
                f"Bei '{user_text}' sehe ich mehrere Lösungsansätze. Die kostenlose TTS macht alles möglich!",
                f"Gute Frage zu '{user_text}'! Jetzt wo die Sprache funktioniert, können wir fokussiert arbeiten."
            ],
            'voice_quality': [
                f"Du fragst nach '{user_text}' - diese Coqui-Stimme ist definitiv besser als der chinesische Roboter von vorhin!",
                f"Zu '{user_text}': Die Qualität sollte jetzt viel natürlicher sein. Wie klingt das?",
                f"'{user_text}' - endlich eine verständliche deutsche Stimme! Ist das so besser?"
            ],
            'general': [
                f"Du sagtest '{user_text}' - das bringt mich zum Nachdenken. Was sind deine weiteren Pläne?",
                f"Interessant! Zu '{user_text}' fällt mir ein: Jetzt können wir endlich flüssig kommunizieren!",
                f"Das mit '{user_text}' sehe ich auch so. Wie sollen wir weitermachen?"
            ]
        }
        
        # Kategorisierung basierend auf Kontext
        text_lower = user_text.lower()
        
        if any(word in text_lower for word in ['hallo', 'hi', 'hey', 'guten']):
            category = 'greeting'
        elif any(word in text_lower for word in ['stimme', 'sprache', 'hören', 'klingen', 'verstehen']):
            category = 'voice_quality'
        elif any(word in text_lower for word in ['code', 'app', 'entwickl', 'programm', 'tech', 'system']):
            category = 'technical'
        else:
            category = 'general'
        
        import random
        response = random.choice(responses[category])
        
        # Füge zur Gesprächshistorie hinzu
        self.conversation_history.append({
            'user': user_text,
            'ai': response,
            'timestamp': str(subprocess.check_output(['date'], text=True).strip())
        })
        
        return response
    
    def speak_text(self, text, output_file=None):
        """Generiere Sprache mit Coqui TTS"""
        if not hasattr(self, 'tts'):
            print("❌ TTS nicht initialisiert!")
            return None
            
        if not output_file:
            output_file = self.temp_dir / f"response_{len(self.conversation_history)}.wav"
        
        try:
            print(f"🗣️ Generiere Sprache: {text[:50]}...")
            
            # Verwende deutsches Modell
            if "thorsten" in self.tts.model_name:
                # Deutsches Modell - direkt verwenden
                self.tts.tts_to_file(
                    text=text,
                    file_path=str(output_file)
                )
            else:
                # Multilingual Modell - Sprache spezifizieren
                self.tts.tts_to_file(
                    text=text,
                    file_path=str(output_file),
                    language="de"
                )
            
            print(f"✅ Audio gespeichert: {output_file}")
            return str(output_file)
            
        except Exception as e:
            print(f"❌ Sprachgenerierung fehlgeschlagen: {e}")
            return None
    
    def process_voice_message(self, input_audio_file):
        """Kompletter Voice-to-Voice Workflow"""
        print(f"\n🎤 Verarbeite Sprachnachricht: {input_audio_file}")
        
        # 1. Transkribieren
        transcription = self.transcribe_audio(input_audio_file)
        if not transcription:
            return None, None, "Spracherkennung fehlgeschlagen"
        
        # 2. AI-Antwort generieren
        ai_response = self.generate_response(transcription)
        
        # 3. Sprache generieren
        audio_file = self.speak_text(ai_response)
        if not audio_file:
            return transcription, ai_response, "Sprachgenerierung fehlgeschlagen"
        
        return transcription, ai_response, audio_file
    
    def start_interactive_mode(self):
        """Interaktiver Voice Chat Modus"""
        print("\n🛡️ Aegis Voice Chat gestartet!")
        print("Drücke Enter und gib den Pfad zu einer Audiodatei ein...")
        print("Oder 'quit' zum Beenden\n")
        
        while True:
            try:
                user_input = input("Audio-Datei Pfad (oder 'quit'): ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Auf Wiedersehen!")
                    break
                
                if not user_input:
                    continue
                    
                if not os.path.exists(user_input):
                    print(f"❌ Datei nicht gefunden: {user_input}")
                    continue
                
                # Verarbeite Sprachnachricht
                transcription, response, audio_file = self.process_voice_message(user_input)
                
                if audio_file and not audio_file.startswith("❌"):
                    print(f"\n✅ Antwort generiert!")
                    print(f"📝 Du: {transcription}")
                    print(f"🛡️ Aegis: {response}")
                    print(f"🔊 Audio: {audio_file}")
                    
                    # Versuche Audio abzuspielen (falls verfügbar)
                    try:
                        subprocess.run(['aplay', audio_file], check=True, capture_output=True)
                        print("🔊 Audio abgespielt!")
                    except:
                        print("ℹ️ Audio gespeichert (aplay nicht verfügbar)")
                else:
                    print(f"❌ Fehler: {audio_file}")
                
            except KeyboardInterrupt:
                print("\n👋 Auf Wiedersehen!")
                break
            except Exception as e:
                print(f"❌ Fehler: {e}")

def main():
    """Hauptprogramm"""
    print("🛡️ Aegis Voice Chat - Coqui TTS Edition")
    print("=" * 50)
    
    chat = AegisVoiceChat()
    
    # Initialisiere TTS
    if not chat.setup_coqui_tts():
        print("❌ TTS-Setup fehlgeschlagen. Installiere Coqui TTS...")
        return 1
    
    # Starte interaktiven Modus
    chat.start_interactive_mode()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())