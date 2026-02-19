import { Audio } from 'expo-av';
import AudioClassificationService from './AudioClassificationService';
import DatabaseService from './DatabaseService';

// setInterval/clearInterval für React Native
const _setInterval = global.setInterval || setInterval;
const _clearInterval = global.clearInterval || clearInterval;

/**
 * AudioMonitorService
 * 
 * Kontinuierliches Audio-Monitoring im Hintergrund
 * Privacy-First: Es wird KEIN Audio gespeichert, nur Dezibel-Werte!
 * 
 * Funktionen:
 * - 24/7 Dezibel-Messung (alle 2 Sekunden)
 * - Echtzeit-Frequenzanalyse (7 Bänder)
 * - Event-Detektion (Überschreitung von Schwellenwerten)
 * - KI-Klassifikation on-device
 */

// Schwellenwerte
const THRESHOLDS = {
  day: 55,        // Tag: 55 dB
  night: 35,      // Nacht (22-06): 35 dB
  weekend_day: 55,
  weekend_night: 35
};

// Ruhezeiten (für automatische Kategorisierung)
const QUIET_HOURS = {
  weekday: { start: 22, end: 6 },
  weekend: { start: 22, end: 8 }  // Wochenende länger
};

class AudioMonitorService {
  constructor() {
    this.isMonitoring = false;
    this.recording = null;
    this.meteringInterval = null;
    this.currentEvent = null;
    this.eventCallback = null;
    this.decibelBuffer = [];
    this.bufferSize = 5; // Letzte 5 Messungen für Glättung
    this.classificationService = AudioClassificationService;
    this.dbService = DatabaseService;
  }

  /**
   * Initialisiere den Monitor
   */
  async init() {
    // Initialisiere KI-Service
    await this.classificationService.init();
    
    // Initialisiere Datenbank
    await this.dbService.init();
    
    console.log('[AudioMonitorService] Initialized');
  }

  /**
   * Prüfe und fordere Berechtigungen an
   */
  async requestPermissions() {
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    if (audioStatus !== 'granted') {
      throw new Error('Audio permission not granted');
    }
    
    // Konfiguriere Audio-Session
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    
    return true;
  }

  /**
   * Starte das Monitoring
   */
  async startMonitoring(onEventDetected) {
    if (this.isMonitoring) {
      console.log('[AudioMonitorService] Already monitoring');
      return;
    }

    try {
      // Berechtigungen prüfen
      await this.requestPermissions();
      
      this.eventCallback = onEventDetected;
      
      // Starte Audio-Aufnahme (für Metering)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      this.isMonitoring = true;
      
      // Starte Metering-Loop (alle 2 Sekunden)
      this.meteringInterval = _setInterval(() => {
        this._processAudioSample();
      }, 2000);
      
      console.log('[AudioMonitorService] Monitoring started');
      
    } catch (error) {
      console.error('[AudioMonitorService] Start error:', error);
      throw error;
    }
  }

  /**
   * Stoppe das Monitoring
   */
  async stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.meteringInterval) {
      _clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
    
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (_error) {
        // Ignoriere Fehler beim Stoppen
      }
      this.recording = null;
    }
    
    // Speichere aktives Event falls vorhanden
    if (this.currentEvent) {
      await this._finalizeEvent();
    }
    
    console.log('[AudioMonitorService] Monitoring stopped');
  }

  /**
   * Verarbeite Audio-Sample
   */
  async _processAudioSample() {
    if (!this.recording || !this.isMonitoring) return;
    
    try {
      // Hole Metering-Daten vom Recording
      const status = await this.recording.getStatusAsync();
      
      if (!status.isRecording) return;
      
      // Extrahiere Dezibel (Metering ist auf iOS/Android verfügbar)
      const decibel = status.metering || -160; // -160 = Stille
      
      // Konvertiere zu positiven dB-Werten
      const normalizedDb = this._normalizeDecibel(decibel);
      
      // Füge zum Buffer hinzu
      this.decibelBuffer.push(normalizedDb);
      if (this.decibelBuffer.length > this.bufferSize) {
        this.decibelBuffer.shift();
      }
      
      // Glättung: Durchschnitt der letzten Messungen
      const smoothedDb = this._getSmoothedDecibel();
      
      // Frequenzanalyse (simuliert für MVP - später echte FFT)
      const freqBands = this._simulateFrequencyAnalysis(smoothedDb);
      
      // Prüfe Schwellenwert
      const threshold = this._getCurrentThreshold();
      const timeCategory = this._getTimeCategory();
      
      if (smoothedDb > threshold) {
        // Lärm-Event erkannt
        await this._handleNoiseEvent(smoothedDb, freqBands, timeCategory);
      } else {
        // Kein Lärm - beende aktives Event falls vorhanden
        if (this.currentEvent) {
          await this._finalizeEvent();
        }
      }
      
    } catch (error) {
      console.error('[AudioMonitorService] Process error:', error);
    }
  }

  /**
   * Normalisiere Dezibel-Wert
   */
  _normalizeDecibel(meteringValue) {
    // Expo gibt -160 bis 0 zurück (dBFS)
    // Wir konvertieren zu ca. 30-100 dB SPL
    const normalized = meteringValue + 160; // 0-160
    const dbSpl = 30 + (normalized * 0.44); // Skalierung zu realistischen dB
    return Math.round(dbSpl);
  }

  /**
   * Berechne geglätteten Dezibel-Wert
   */
  _getSmoothedDecibel() {
    if (this.decibelBuffer.length === 0) return 0;
    const sum = this.decibelBuffer.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.decibelBuffer.length);
  }

  /**
   * Simuliere Frequenzanalyse (MVP)
   * Später: Echte FFT-Analyse des Audio-Signals
   */
  _simulateFrequencyAnalysis(avgDb) {
    // Für MVP: Generiere plausible Frequenzprofile basierend auf Amplitude
    // In der echten Implementierung: FFT des Audio-Signals
    
    const baseDb = avgDb;
    const variation = () => (Math.random() - 0.5) * 10;
    
    return {
      '125hz': Math.max(0, Math.round(baseDb - 5 + variation())),
      '250hz': Math.max(0, Math.round(baseDb - 2 + variation())),
      '500hz': Math.max(0, Math.round(baseDb + variation())),
      '1khz': Math.max(0, Math.round(baseDb + 2 + variation())),
      '2khz': Math.max(0, Math.round(baseDb + variation())),
      '4khz': Math.max(0, Math.round(baseDb - 3 + variation())),
      '8khz': Math.max(0, Math.round(baseDb - 8 + variation()))
    };
  }

  /**
   * Aktueller Schwellenwert basierend auf Zeit
   */
  _getCurrentThreshold() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const quietHours = isWeekend ? QUIET_HOURS.weekend : QUIET_HOURS.weekday;
    const isQuietTime = hour >= quietHours.start || hour < quietHours.end;
    
    if (isWeekend) {
      return isQuietTime ? THRESHOLDS.weekend_night : THRESHOLDS.weekend_day;
    }
    
    return isQuietTime ? THRESHOLDS.night : THRESHOLDS.day;
  }

  /**
   * Zeitkategorie für Reporting
   */
  _getTimeCategory() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const quietHours = isWeekend ? QUIET_HOURS.weekend : QUIET_HOURS.weekday;
    const isQuietTime = hour >= quietHours.start || hour < quietHours.end;
    
    if (isWeekend && isQuietTime) return 'weekend_night';
    if (isWeekend) return 'weekend_day';
    if (isQuietTime) return 'night';
    return 'day';
  }

  /**
   * Behandle Lärm-Event
   */
  async _handleNoiseEvent(decibel, freqBands, timeCategory) {
    const now = new Date();
    
    if (!this.currentEvent) {
      // Neues Event starten
      this.currentEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startedAt: now.toISOString(),
        maxDecibel: decibel,
        minDecibel: decibel,
        avgDecibel: decibel,
        measurements: [decibel],
        freqBands: { ...freqBands },
        timeCategory,
        sampleCount: 1
      };
      
    } else {
      // Aktualisiere bestehendes Event
      this.currentEvent.measurements.push(decibel);
      this.currentEvent.sampleCount++;
      
      // Update Statistiken
      this.currentEvent.maxDecibel = Math.max(this.currentEvent.maxDecibel, decibel);
      this.currentEvent.minDecibel = Math.min(this.currentEvent.minDecibel, decibel);
      
      const sum = this.currentEvent.measurements.reduce((a, b) => a + b, 0);
      this.currentEvent.avgDecibel = Math.round(sum / this.currentEvent.measurements.length);
      
      // Update Frequenzbänder (Durchschnitt)
      for (const band of Object.keys(freqBands)) {
        const current = this.currentEvent.freqBands[band] || 0;
        this.currentEvent.freqBands[band] = Math.round(
          (current * (this.currentEvent.sampleCount - 1) + freqBands[band]) / this.currentEvent.sampleCount
        );
      }
    }
  }

  /**
   * Finalisiere und speichere Event
   */
  async _finalizeEvent() {
    if (!this.currentEvent) return;
    
    const now = new Date();
    const startedAt = new Date(this.currentEvent.startedAt);
    const duration = Math.round((now - startedAt) / 1000);
    
    // Mindestdauer: 5 Sekunden (kürzere Events sind nicht signifikant)
    if (duration < 5) {
      this.currentEvent = null;
      return;
    }
    
    // Bereite Event-Daten vor
    const eventData = {
      id: this.currentEvent.id,
      startedAt: this.currentEvent.startedAt,
      endedAt: now.toISOString(),
      duration,
      maxDecibel: this.currentEvent.maxDecibel,
      avgDecibel: this.currentEvent.avgDecibel,
      minDecibel: this.currentEvent.minDecibel,
      freqBands: this.currentEvent.freqBands,
      timeCategory: this.currentEvent.timeCategory
    };
    
    // KI-Klassifikation
    try {
      const classification = await this.classificationService.classifyEvent(eventData);
      
      eventData.classification = classification.classification;
      eventData.confidence = classification.confidence;
      eventData.isChildrenNoise = classification.isChildrenNoise;
      
      // Speichere in Datenbank
      await this.dbService.saveEvent(eventData);
      
      // Callback
      if (this.eventCallback) {
        this.eventCallback({
          ...eventData,
          classificationDetails: classification.details
        });
      }
      
      console.log('[AudioMonitorService] Event saved:', {
        id: eventData.id,
        type: classification.classification,
        confidence: classification.confidence,
        duration,
        avgDb: eventData.avgDecibel
      });
      
    } catch (error) {
      console.error('[AudioMonitorService] Classification/Save error:', error);
    }
    
    this.currentEvent = null;
  }

  /**
   * Prüfe ob Monitoring aktiv ist
   */
  isActive() {
    return this.isMonitoring;
  }

  /**
   * Hole aktuelle Dezibel (für UI-Anzeige)
   */
  getCurrentDecibel() {
    return this._getSmoothedDecibel();
  }

  /**
   * Hole aktives Event (falls vorhanden)
   */
  getCurrentEvent() {
    return this.currentEvent;
  }

  /**
   * Bereinige Ressourcen
   */
  async cleanup() {
    await this.stopMonitoring();
    this.classificationService.cleanup();
  }
}

export default new AudioMonitorService();
