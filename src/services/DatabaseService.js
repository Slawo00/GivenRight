import { createClient } from '@supabase/supabase-js';
import * as SQLite from 'expo-sqlite';

// Supabase Konfiguration
const SUPABASE_URL = 'https://aawfwtwufqenrdzqfmgw.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQLite für lokale Speicherung

/**
 * DatabaseService - Lokale SQLite + Supabase Sync
 * Privacy-First: Alle sensitiven Daten bleiben lokal!
 */
class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialisiere lokale SQLite Datenbank
   */
  async init() {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('silencenow.db');
      
      // Erstelle Tabellen
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS noise_events (
          id TEXT PRIMARY KEY,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          duration_seconds INTEGER,
          max_decibel REAL,
          avg_decibel REAL,
          min_decibel REAL,
          freq_band_125hz REAL,
          freq_band_250hz REAL,
          freq_band_500hz REAL,
          freq_band_1khz REAL,
          freq_band_2khz REAL,
          freq_band_4khz REAL,
          freq_band_8khz REAL,
          ai_classification TEXT,
          ai_confidence REAL,
          is_children_noise INTEGER DEFAULT 0,
          time_category TEXT,
          is_manual_entry INTEGER DEFAULT 0,
          notes TEXT,
          witness_name TEXT,
          witness_contact TEXT,
          synced_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_events_started ON noise_events(started_at);
        CREATE INDEX IF NOT EXISTS idx_events_classification ON noise_events(ai_classification);
        
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      this.isInitialized = true;
      console.log('[DatabaseService] Initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Init error:', error);
      throw error;
    }
  }

  /**
   * Speichere ein Lärm-Event lokal
   */
  async saveEvent(eventData) {
    await this.init();

    const id = eventData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.db.runAsync(
        `INSERT INTO noise_events (
          id, started_at, ended_at, duration_seconds,
          max_decibel, avg_decibel, min_decibel,
          freq_band_125hz, freq_band_250hz, freq_band_500hz,
          freq_band_1khz, freq_band_2khz, freq_band_4khz, freq_band_8khz,
          ai_classification, ai_confidence, is_children_noise, time_category,
          notes, witness_name, witness_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          eventData.startedAt,
          eventData.endedAt,
          eventData.duration,
          eventData.maxDecibel,
          eventData.avgDecibel,
          eventData.minDecibel,
          eventData.freqBands?.['125hz'],
          eventData.freqBands?.['250hz'],
          eventData.freqBands?.['500hz'],
          eventData.freqBands?.['1khz'],
          eventData.freqBands?.['2khz'],
          eventData.freqBands?.['4khz'],
          eventData.freqBands?.['8khz'],
          eventData.classification,
          eventData.confidence,
          eventData.isChildrenNoise ? 1 : 0,
          eventData.timeCategory,
          eventData.notes,
          eventData.witnessName,
          eventData.witnessContact
        ]
      );

      // Zur Sync-Queue hinzufügen
      await this.addToSyncQueue('noise_events', 'INSERT', { id, ...eventData });

      return id;
    } catch (error) {
      console.error('[DatabaseService] Save event error:', error);
      throw error;
    }
  }

  /**
   * Hole alle Events (neueste zuerst)
   */
  async getAllEvents(limit = 100) {
    await this.init();

    try {
      const events = await this.db.getAllAsync(
        `SELECT * FROM noise_events 
         WHERE is_manual_entry = 0 
         ORDER BY started_at DESC 
         LIMIT ?`,
        [limit]
      );

      return events.map(this._mapEventFromDb);
    } catch (error) {
      console.error('[DatabaseService] Get events error:', error);
      return [];
    }
  }

  /**
   * Hole Events für einen Zeitraum (für Reports)
   */
  async getEventsForPeriod(startDate, endDate) {
    await this.init();

    try {
      const events = await this.db.getAllAsync(
        `SELECT * FROM noise_events 
         WHERE started_at >= ? AND started_at <= ?
         AND is_manual_entry = 0
         ORDER BY started_at ASC`,
        [startDate.toISOString(), endDate.toISOString()]
      );

      return events.map(this._mapEventFromDb);
    } catch (error) {
      console.error('[DatabaseService] Get period events error:', error);
      return [];
    }
  }

  /**
   * Hole Statistiken für die letzten N Tage
   */
  async getStats(days = 14) {
    await this.init();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const result = await this.db.getFirstAsync(
        `SELECT 
          COUNT(*) as count,
          AVG(avg_decibel) as avg_db,
          MAX(max_decibel) as max_db,
          SUM(CASE WHEN time_category IN ('night', 'weekend_night') THEN 1 ELSE 0 END) as night_events
         FROM noise_events 
         WHERE started_at >= ?`,
        [startDate.toISOString()]
      );

      return {
        totalEvents: result?.count || 0,
        avgDecibel: Math.round(result?.avg_db || 0),
        maxDecibel: Math.round(result?.max_db || 0),
        nightEvents: result?.night_events || 0,
        daysMonitored: days
      };
    } catch (error) {
      console.error('[DatabaseService] Get stats error:', error);
      return { totalEvents: 0, avgDecibel: 0, maxDecibel: 0, nightEvents: 0, daysMonitored: days };
    }
  }

  /**
   * Zähle Events nach Klassifikation
   */
  async getClassificationBreakdown(days = 30) {
    await this.init();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const results = await this.db.getAllAsync(
        `SELECT ai_classification, COUNT(*) as count
         FROM noise_events 
         WHERE started_at >= ? AND ai_classification IS NOT NULL
         GROUP BY ai_classification`,
        [startDate.toISOString()]
      );

      const breakdown = {};
      results.forEach(row => {
        breakdown[row.ai_classification] = row.count;
      });
      return breakdown;
    } catch (error) {
      console.error('[DatabaseService] Classification breakdown error:', error);
      return {};
    }
  }

  /**
   * Füge zur Sync-Queue hinzu
   */
  async addToSyncQueue(tableName, operation, data) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, table_name, operation, data) VALUES (?, ?, ?, ?)`,
      [id, tableName, operation, JSON.stringify(data)]
    );
  }

  /**
   * Synchronisiere mit Supabase (Batch-Upload)
   */
  async syncWithSupabase() {
    if (!supabase) {
      console.warn('[DatabaseService] Supabase not configured');
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Hole ungesyncte Items
      const queueItems = await this.db.getAllAsync(
        `SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50`
      );

      if (queueItems.length === 0) {
        return { success: true, synced: 0 };
      }

      // Prüfe Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Batch-Insert zu Supabase
      const events = queueItems
        .filter(item => item.table_name === 'noise_events')
        .map(item => JSON.parse(item.data));

      if (events.length > 0) {
        const { error } = await supabase
          .from('noise_events')
          .upsert(events.map(e => ({ ...e, user_id: user.id })));

        if (error) throw error;

        // Lösche erfolgreich syncte Items
        for (const item of queueItems) {
          await this.db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
        }
      }

      // Update sync timestamp
      await this.db.runAsync(
        `UPDATE noise_events SET synced_at = ? WHERE synced_at IS NULL`,
        [new Date().toISOString()]
      );

      return { success: true, synced: events.length };
    } catch (error) {
      console.error('[DatabaseService] Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lösche alte Events (älter als X Tage)
   */
  async cleanupOldEvents(daysToKeep = 90) {
    await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      await this.db.runAsync(
        `DELETE FROM noise_events WHERE started_at < ? AND synced_at IS NOT NULL`,
        [cutoffDate.toISOString()]
      );
      console.log('[DatabaseService] Cleaned up old events');
    } catch (error) {
      console.error('[DatabaseService] Cleanup error:', error);
    }
  }

  /**
   * Exportiere Daten für PDF-Report
   */
  async exportForReport(startDate, endDate) {
    const events = await this.getEventsForPeriod(startDate, endDate);
    
    // Aggregiere Daten
    const stats = {
      totalEvents: events.length,
      eventsDuringNight: events.filter(e => 
        e.timeCategory === 'night' || e.timeCategory === 'weekend_night'
      ).length,
      avgDecibel: events.length > 0 
        ? events.reduce((sum, e) => sum + e.avgDecibel, 0) / events.length 
        : 0,
      maxDecibel: events.length > 0 
        ? Math.max(...events.map(e => e.maxDecibel)) 
        : 0,
      classifications: {}
    };

    events.forEach(event => {
      if (event.classification) {
        stats.classifications[event.classification] = 
          (stats.classifications[event.classification] || 0) + 1;
      }
    });

    return { events, stats };
  }

  /**
   * Mappe DB-Row zu Event-Objekt
   */
  _mapEventFromDb(row) {
    return {
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      duration: row.duration_seconds,
      maxDecibel: row.max_decibel,
      avgDecibel: row.avg_decibel,
      minDecibel: row.min_decibel,
      freqBands: {
        '125hz': row.freq_band_125hz,
        '250hz': row.freq_band_250hz,
        '500hz': row.freq_band_500hz,
        '1khz': row.freq_band_1khz,
        '2khz': row.freq_band_2khz,
        '4khz': row.freq_band_4khz,
        '8khz': row.freq_band_8khz,
      },
      classification: row.ai_classification,
      confidence: row.ai_confidence,
      isChildrenNoise: row.is_children_noise === 1,
      timeCategory: row.time_category,
      notes: row.notes,
      witnessName: row.witness_name,
      witnessContact: row.witness_contact,
      syncedAt: row.synced_at,
      createdAt: row.created_at
    };
  }
}

export default new DatabaseService();
