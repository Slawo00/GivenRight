import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as Speech from 'expo-speech';

/**
 * AudioClassificationService
 * 
 * On-Device KI-Klassifikation von Lärmtypen
 * Privacy-First: Kein Audio wird gespeichert oder hochgeladen!
 * 
 * Unterstützte Klassen:
 * - music (Musik/Bass)
 * - drilling (Bohren/Hämmern)
 * - dog (Hundebellen)
 * - children (Kinderlärm/Schreien)
 * - voices (Gespräche)
 * - traffic (Verkehr)
 * - footsteps (Schritte)
 * - unknown (Unbekannt)
 */

// Frequenzband-Gewichtungen für verschiedene Lärmtypen
const FREQUENCY_PROFILES = {
  music: {
    bands: ['125hz', '250hz', '500hz', '1khz', '2khz', '4khz', '8khz'],
    weights: [0.9, 1.0, 0.95, 0.9, 0.85, 0.7, 0.5],
    bassHeavy: true,
    threshold: 45
  },
  drilling: {
    bands: ['500hz', '1khz', '2khz', '4khz'],
    weights: [0.6, 0.9, 1.0, 0.95],
    highFreq: true,
    threshold: 50
  },
  dog: {
    bands: ['1khz', '2khz', '4khz'],
    weights: [0.8, 1.0, 0.9],
    midHighFreq: true,
    threshold: 55,
    pattern: 'intermittent'
  },
  children: {
    bands: ['500hz', '1khz', '2khz', '4khz'],
    weights: [0.7, 0.9, 1.0, 0.85],
    highPitch: true,
    threshold: 50,
    pattern: 'variable'
  },
  voices: {
    bands: ['250hz', '500hz', '1khz', '2khz'],
    weights: [0.8, 1.0, 0.95, 0.6],
    speechLike: true,
    threshold: 40
  },
  traffic: {
    bands: ['125hz', '250hz', '500hz'],
    weights: [0.9, 1.0, 0.7],
    lowFreq: true,
    threshold: 45,
    pattern: 'continuous'
  },
  footsteps: {
    bands: ['125hz', '250hz', '500hz'],
    weights: [1.0, 0.9, 0.5],
    lowFreq: true,
    threshold: 40,
    pattern: 'rhythmic'
  }
};

class AudioClassificationService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.tfReady = false;
    this.classificationHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Initialisiere TensorFlow.js
   */
  async init() {
    try {
      // Warte auf TF.js Bereitschaft
      await tf.ready();
      this.tfReady = true;
      
      console.log('[AudioClassificationService] TensorFlow.js ready');
      
      // Lade das lokale Modell (später: trainiertes TFLite Modell)
      await this.loadModel();
      
      return true;
    } catch (error) {
      console.error('[AudioClassificationService] Init error:', error);
      return false;
    }
  }

  /**
   * Lade das KI-Modell
   * Für MVP: Regelbasiertes System mit ML-Features
   * Später: TFLite Modell laden
   */
  async loadModel() {
    try {
      // MVP: Regelbasierte Klassifikation mit Frequenzanalyse
      // Dies ist ein hybrider Ansatz: Frequenzbasiert + Pattern-Erkennung
      
      this.isModelLoaded = true;
      console.log('[AudioClassificationService] Model ready (rule-based + frequency analysis)');
      
      return true;
    } catch (error) {
      console.error('[AudioClassificationService] Model load error:', error);
      this.isModelLoaded = false;
      return false;
    }
  }

  /**
   * Klassifiziere einen Lärm-Event basierend auf Frequenzdaten
   * 
   * @param {Object} eventData - Event Daten mit Frequenzbändern
   * @param {Object} eventData.freqBands - Dezibel-Werte pro Frequenzband
   * @param {number} eventData.avgDecibel - Durchschnittlicher Dezibel-Wert
   * @param {number} eventData.maxDecibel - Maximaler Dezibel-Wert
   * @param {number} eventData.duration - Dauer in Sekunden
   * @returns {Object} Klassifikation mit Confidence Score
   */
  async classifyEvent(eventData) {
    if (!this.tfReady) {
      await this.init();
    }

    const { freqBands, avgDecibel, maxDecibel, duration } = eventData;
    
    if (!freqBands || avgDecibel < 30) {
      return {
        classification: 'unknown',
        confidence: 0,
        isChildrenNoise: false,
        details: { reason: 'Too quiet or no frequency data' }
      };
    }

    // Berechne Scores für jede Klasse
    const scores = this._calculateClassScores(freqBands, avgDecibel, duration);
    
    // Finde beste Klassifikation
    const bestMatch = this._findBestMatch(scores);
    
    // Prüfe auf Kinderlärm (spezielle Logik)
    const isChildrenNoise = this._detectChildrenNoise(freqBands, avgDecibel, duration, bestMatch);
    
    // Füge zur History hinzu (für Pattern-Erkennung)
    this._addToHistory(bestMatch.classification, scores);
    
    // Verbessere Klassifikation durch Pattern-Analyse
    const refinedClassification = this._refineWithPattern(bestMatch, scores);

    return {
      classification: refinedClassification.classification,
      confidence: refinedClassification.confidence,
      isChildrenNoise,
      details: {
        allScores: scores,
        pattern: this._analyzePattern(),
        frequencyProfile: this._getDominantFrequencyProfile(freqBands)
      }
    };
  }

  /**
   * Berechne Match-Scores für alle Klassen
   */
  _calculateClassScores(freqBands, avgDecibel, duration) {
    const scores = {};
    
    for (const [className, profile] of Object.entries(FREQUENCY_PROFILES)) {
      let score = 0;
      let totalWeight = 0;
      
      // Frequenzbasierte Bewertung
      for (const band of profile.bands) {
        const bandValue = freqBands[band] || 0;
        const bandIndex = profile.bands.indexOf(band);
        const weight = profile.weights[bandIndex] || 1.0;
        
        // Normalisiere Band-Wert (0-1)
        const normalizedValue = Math.min(bandValue / 100, 1);
        score += normalizedValue * weight;
        totalWeight += weight;
      }
      
      // Durchschnittlicher Frequenz-Score
      let freqScore = totalWeight > 0 ? score / totalWeight : 0;
      
      // Amplitude-Check (muss über Threshold liegen)
      const amplitudeFactor = avgDecibel >= profile.threshold ? 1.0 : (avgDecibel / profile.threshold);
      
      // Dauer-Faktor (einige Lärmtypen haben typische Dauern)
      let durationFactor = 1.0;
      if (profile.pattern === 'intermittent' && duration > 30) {
        durationFactor = 0.7; // Hundegebell ist typischerweise kurz
      } else if (profile.pattern === 'continuous' && duration < 5) {
        durationFactor = 0.6; // Verkehr ist typischerweise länger
      }
      
      // Kombinierter Score
      const finalScore = freqScore * amplitudeFactor * durationFactor;
      
      scores[className] = {
        score: Math.round(finalScore * 100) / 100,
        freqScore: Math.round(freqScore * 100) / 100,
        amplitudeFactor: Math.round(amplitudeFactor * 100) / 100,
        durationFactor: Math.round(durationFactor * 100) / 100,
        threshold: profile.threshold,
        matched: finalScore > 0.5
      };
    }
    
    return scores;
  }

  /**
   * Finde die beste Übereinstimmung
   */
  _findBestMatch(scores) {
    let bestClass = 'unknown';
    let bestScore = 0;
    
    for (const [className, data] of Object.entries(scores)) {
      if (data.score > bestScore && data.matched) {
        bestScore = data.score;
        bestClass = className;
      }
    }
    
    // Confidence-Berechnung
    let confidence = 0;
    if (bestScore > 0.8) {
      confidence = 0.9 + (bestScore - 0.8) * 0.5; // 0.9 - 1.0
    } else if (bestScore > 0.6) {
      confidence = 0.7 + (bestScore - 0.6) * 1.0; // 0.7 - 0.9
    } else if (bestScore > 0.5) {
      confidence = 0.5 + (bestScore - 0.5) * 2.0; // 0.5 - 0.7
    } else {
      confidence = bestScore;
    }
    
    return {
      classification: bestClass,
      confidence: Math.min(Math.round(confidence * 100) / 100, 1.0),
      score: bestScore
    };
  }

  /**
   * Erkenne Kinderlärm spezifisch
   */
  _detectChildrenNoise(freqBands, avgDecibel, duration, bestMatch) {
    // Hohe Frequenzen (2kHz-4kHz) sind typisch für Kinder
    const highFreq2k = freqBands['2khz'] || 0;
    const highFreq4k = freqBands['4khz'] || 0;
    const midFreq1k = freqBands['1khz'] || 0;
    
    // Kinderlärm hat oft hohe Pitch + variable Lautstärke
    const highPitchScore = (highFreq2k + highFreq4k) / 2;
    const midRangeScore = midFreq1k;
    
    // Kinderlärm-Indikatoren
    const isHighPitch = highPitchScore > 50;
    const isVariable = Math.abs(highFreq2k - midFreq1k) > 10; // Variabilität
    const isLoudEnough = avgDecibel > 45;
    const isNotTooLong = duration < 300; // Kinderlärm ist selten > 5 Minuten am Stück
    
    // Spezifische Erkennung
    const childrenScore = [
      isHighPitch ? 0.3 : 0,
      isVariable ? 0.3 : 0,
      isLoudEnough ? 0.2 : 0,
      isNotTooLong ? 0.1 : 0,
      bestMatch.classification === 'children' ? 0.3 : 0
    ].reduce((a, b) => a + b, 0);
    
    return childrenScore >= 0.6;
  }

  /**
   * Verbessere Klassifikation durch Pattern-Erkennung
   */
  _refineWithPattern(bestMatch, scores) {
    if (this.classificationHistory.length < 3) {
      return bestMatch;
    }
    
    // Analysiere letzte Klassifikationen
    const recent = this.classificationHistory.slice(-5);
    const classCounts = {};
    
    recent.forEach(item => {
      classCounts[item.classification] = (classCounts[item.classification] || 0) + 1;
    });
    
    // Wenn aktuelle Klassifikation inkonsistent mit Pattern ist
    const currentCount = classCounts[bestMatch.classification] || 0;
    const patternStrength = currentCount / recent.length;
    
    // Boost Confidence wenn konsistentes Pattern
    let adjustedConfidence = bestMatch.confidence;
    if (patternStrength > 0.6) {
      adjustedConfidence = Math.min(bestMatch.confidence * 1.1, 1.0);
    } else if (patternStrength < 0.3 && bestMatch.confidence < 0.8) {
      // Verringere Confidence bei inkonsistentem Pattern
      adjustedConfidence = bestMatch.confidence * 0.9;
    }
    
    return {
      ...bestMatch,
      confidence: Math.round(adjustedConfidence * 100) / 100
    };
  }

  /**
   * Füge zur History hinzu
   */
  _addToHistory(classification, scores) {
    this.classificationHistory.push({
      classification,
      scores,
      timestamp: Date.now()
    });
    
    // Begrenze History-Größe
    if (this.classificationHistory.length > this.maxHistorySize) {
      this.classificationHistory.shift();
    }
  }

  /**
   * Analysiere Pattern in der History
   */
  _analyzePattern() {
    if (this.classificationHistory.length < 3) {
      return { type: 'insufficient_data' };
    }
    
    const recent = this.classificationHistory.slice(-5);
    const intervals = [];
    
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isRegular = intervals.every(interval => 
      Math.abs(interval - avgInterval) < avgInterval * 0.3
    );
    
    return {
      type: isRegular ? 'regular' : 'irregular',
      avgInterval: Math.round(avgInterval / 1000), // Sekunden
      eventCount: recent.length
    };
  }

  /**
   * Finde das dominante Frequenz-Profil
   */
  _getDominantFrequencyProfile(freqBands) {
    const values = Object.values(freqBands).filter(v => v > 0);
    if (values.length === 0) return null;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const dominantBand = Object.entries(freqBands)
      .find(([_, v]) => v === max)?.[0];
    
    return {
      average: Math.round(avg),
      maximum: Math.round(max),
      dominantBand,
      spread: Math.round(max - Math.min(...values))
    };
  }

  /**
   * Batch-Klassifikation für mehrere Events
   */
  async classifyBatch(events) {
    const results = [];
    
    for (const event of events) {
      const classification = await this.classifyEvent(event);
      results.push({
        eventId: event.id,
        ...classification
      });
    }
    
    return results;
  }

  /**
   * Get statistische Übersicht über Klassifikationen
   */
  getClassificationStats(classifications) {
    const stats = {
      total: classifications.length,
      byType: {},
      childrenNoiseCount: 0,
      avgConfidence: 0,
      highConfidenceCount: 0
    };
    
    let totalConfidence = 0;
    
    classifications.forEach(c => {
      // Zähle nach Typ
      stats.byType[c.classification] = (stats.byType[c.classification] || 0) + 1;
      
      // Kinderlärm
      if (c.isChildrenNoise) {
        stats.childrenNoiseCount++;
      }
      
      // Confidence
      totalConfidence += c.confidence;
      if (c.confidence > 0.8) {
        stats.highConfidenceCount++;
      }
    });
    
    stats.avgConfidence = classifications.length > 0 
      ? Math.round((totalConfidence / classifications.length) * 100) / 100
      : 0;
    
    return stats;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.classificationHistory = [];
    if (this.model) {
      this.model = null;
    }
    this.isModelLoaded = false;
  }
}

export default new AudioClassificationService();
