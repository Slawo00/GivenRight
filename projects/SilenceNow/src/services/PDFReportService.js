import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DatabaseService from './DatabaseService';

/**
 * PDFReportService
 * 
 * BGH-konforme PDF-Protokoll-Generierung
 * 
 * Anforderungen an gerichtsfeste Lärmprotokolle (BGH):
 * - Art der Lärmbeeinträchtigung (Musik, Bohren, etc.)
 * - Tageszeiten (besonders Ruhezeiten 22-06 Uhr)
 * - Dauer der Störungen
 * - Häufigkeit/Wiederholung
 * - Dezibel-Werte (optional aber hilfreich)
 * - Zeugen (falls vorhanden)
 */

// Rechtliche Grundlagen
const LEGAL_BASIS = {
  mietminderung: '§ 536 BGB (Mangel der Mietsache)',
  gebrauchsbeeintrachtigung: '§ 536 Abs. 1 S. 3 BGB (Abzug vom Mietzins)',
  ruhezeiten: 'Landesbauordnung (LBO) und kommunale Lärmschutzverordnungen',
  nachbarrecht: '§ 906 BGB (Übermaß der Nachbarrechte)'
};

// Mietminderungs-Richtwerte
const MIETMINDERUNG_RICHTWERTE = [
  { minDb: 5, maxDb: 10, percent: '5-10%' },
  { minDb: 10, maxDb: 20, percent: '10-20%' },
  { minDb: 20, maxDb: 30, percent: '20-30%' },
  { minDb: 30, maxDb: 999, percent: '30-50%' }
];

class PDFReportService {
  constructor() {
    this.dbService = DatabaseService;
  }

  /**
   * Generiere ein Basis-Lärmprotokoll
   */
  async generateBasicReport(startDate, endDate, userInfo = {}) {
    try {
      // Lade Events aus Datenbank
      const { events, stats } = await this.dbService.exportForReport(startDate, endDate);
      
      if (events.length === 0) {
        throw new Error('Keine Lärm-Events im angegebenen Zeitraum gefunden');
      }
      
      // Generiere HTML
      const html = this._generateBasicHTML(events, stats, startDate, endDate, userInfo);
      
      // Erstelle PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      return {
        uri,
        filename: `Laermprotokoll_Basis_${this._formatDateFile(startDate)}.pdf`,
        eventCount: events.length,
        stats
      };
      
    } catch (error) {
      console.error('[PDFReportService] Basic report error:', error);
      throw error;
    }
  }

  /**
   * Generiere ein Premium-Durchsetzungspaket
   */
  async generatePremiumReport(startDate, endDate, userInfo = {}, options = {}) {
    try {
      const { events, stats } = await this.dbService.exportForReport(startDate, endDate);
      
      if (events.length === 0) {
        throw new Error('Keine Lärm-Events im angegebenen Zeitraum gefunden');
      }
      
      // Berechne Mietminderungsempfehlung
      const rentReduction = this._calculateRentReduction(stats);
      
      // Generiere HTML
      const html = this._generatePremiumHTML(events, stats, startDate, endDate, userInfo, {
        ...options,
        rentReduction
      });
      
      // Erstelle PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      return {
        uri,
        filename: `Laermprotokoll_Premium_${this._formatDateFile(startDate)}.pdf`,
        eventCount: events.length,
        stats,
        rentReduction,
        includesMusterbriefe: true
      };
      
    } catch (error) {
      console.error('[PDFReportService] Premium report error:', error);
      throw error;
    }
  }

  /**
   * Teile PDF
   */
  async sharePDF(uri, filename) {
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: filename
      });
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename
      });
    }
  }

  /**
   * Speichere PDF lokal
   */
  async savePDF(uri, filename) {
    const directory = FileSystem.documentDirectory + 'reports/';
    
    // Erstelle Verzeichnis falls nicht vorhanden
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    
    const newUri = directory + filename;
    await FileSystem.copyAsync({ from: uri, to: newUri });
    
    return newUri;
  }

  /**
   * Generiere Basis-HTML
   */
  _generateBasicHTML(events, stats, startDate, endDate, userInfo) {
    const eventRows = events.map(event => `
      <tr>
        <td>${this._formatDateTime(event.startedAt)}</td>
        <td>${this._formatDuration(event.duration)}</td>
        <td>${event.avgDecibel} dB</td>
        <td>${this._translateClassification(event.classification)}</td>
        <td>${event.isChildrenNoise ? 'Ja' : 'Nein'}</td>
      </tr>
    `).join('');

    const classificationBreakdown = Object.entries(stats.classifications || {})
      .map(([type, count]) => `<li>${this._translateClassification(type)}: ${count}x</li>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header-info { margin: 20px 0; }
          .header-info p { margin: 5px 0; }
          .disclaimer { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #666; font-size: 11px; }
          .stats-box { background: #f0f0f0; padding: 15px; margin: 20px 0; }
          .stats-box h3 { margin-top: 0; }
        </style>
      </head>
      <body>
        <h1>LÄRMPROTOKOLL</h1>
        
        <div class="header-info">
          <h2>Mieterinformation</h2>
          <p><strong>Name:</strong> ${userInfo.name || '[Nicht angegeben]'}</p>
          <p><strong>Adresse:</strong> ${userInfo.address || '[Nicht angegeben]'}</p>
          <p><strong>Zeitraum:</strong> ${this._formatDateRange(startDate, endDate)}</p>
          <p><strong>Erstellt am:</strong> ${this._formatDateTime(new Date())}</p>
        </div>

        <div class="stats-box">
          <h3>Zusammenfassung</h3>
          <p><strong>Gesamtanzahl Störungen:</strong> ${stats.totalEvents}</p>
          <p><strong>Davon in Ruhezeiten (22-06 Uhr):</strong> ${stats.eventsDuringNight}</p>
          <p><strong>Durchschnittliche Lautstärke:</strong> ${Math.round(stats.avgDecibel)} dB</p>
          <p><strong>Maximale Lautstärke:</strong> ${Math.round(stats.maxDecibel)} dB</p>
          
          <h4>Störungsarten:</h4>
          <ul>
            ${classificationBreakdown || '<li>Keine Klassifikation verfügbar</li>'}
          </ul>
        </div>

        <h2>Detaillierte Störungsübersicht</h2>
        <table>
          <thead>
            <tr>
              <th>Datum & Uhrzeit</th>
              <th>Dauer</th>
              <th>Ø Dezibel</th>
              <th>Art</th>
              <th>Kinderlärm</th>
            </tr>
          </thead>
          <tbody>
            ${eventRows}
          </tbody>
        </table>

        <div class="disclaimer">
          <strong>Rechtlicher Hinweis:</strong><br>
          Dieses Protokoll wurde automatisch durch die SilenceNow-App erstellt. 
          Die Messung erfolgte nach bestem Wissen und Gewissen mittels standardisierter 
          Dezibel-Messung. Die Klassifikation der Lärmarten erfolgt durch künstliche Intelligenz 
          und dient der Orientierung. Für die Gerichtsverwertbarkeit wird empfohlen, 
          dieses Protokoll durch zusätzliche Zeugen zu untermauern.
          <br><br>
          Rechtsgrundlagen: ${LEGAL_BASIS.mietminderung}, ${LEGAL_BASIS.nachbarrecht}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generiere Premium-HTML mit Musterbriefen
   */
  _generatePremiumHTML(events, stats, startDate, endDate, userInfo, options) {
    const basicContent = this._generateBasicHTML(events, stats, startDate, endDate, userInfo);
    
    const musterbriefVermieter = this._generateMusterbriefVermieter(userInfo, stats, startDate, endDate);
    const musterbriefNachbar = this._generateMusterbriefNachbar(userInfo, stats);
    const fristenKalender = this._generateFristenKalender();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          h3 { color: #555; margin-top: 25px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header-info { margin: 20px 0; }
          .header-info p { margin: 5px 0; }
          .disclaimer { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #666; font-size: 11px; }
          .stats-box { background: #f0f0f0; padding: 15px; margin: 20px 0; }
          .musterbrief { background: #fafafa; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
          .musterbrief p { margin: 10px 0; }
          .highlight { background: #fff3cd; padding: 2px 5px; }
          .page-break { page-break-before: always; }
          .fristen-box { background: #e8f4f8; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        ${basicContent.replace(/<body>/, '').replace(/<\/body>/, '').replace(/<html>/, '').replace(/<\/html>/, '')}
        
        <div class="page-break"></div>
        
        <h1>DURCHSETZUNGSPAKET</h1>
        
        <div class="stats-box">
          <h2>Mietminderungseinschätzung</h2>
          <p><strong>Einschätzung:</strong> ${options.rentReduction.percent}</p>
          <p><strong>Begründung:</strong> ${options.rentReduction.reasoning}</p>
          <p><strong>Hinweis:</strong> Dies ist eine Orientierungshilfe. Die tatsächliche 
          Mietminderung hängt von der Schwere der Beeinträchtigung ab und muss individuell 
          geprüft werden.</p>
        </div>

        <div class="fristen-box">
          <h2>⏰ WICHTIGE FRISTEN</h2>
          ${fristenKalender}
        </div>

        <h2>📄 MUSTERBRIEF 1: An Vermieter</h2>
        <div class="musterbrief">
          ${musterbriefVermieter}
        </div>

        <div class="page-break"></div>

        <h2>📄 MUSTERBRIEF 2: An störenden Nachbarn</h2>
        <div class="musterbrief">
          ${musterbriefNachbar}
        </div>

        <div class="disclaimer">
          <strong>Wichtiger Hinweis:</strong><br>
          Die Musterbriefe dienen als Orientierung und ersetzen keine anwaltliche Beratung. 
          Für verbindliche Rechtsauskünfte konsultieren Sie bitte einen Rechtsanwalt oder 
          Mieterverein. SilenceNow übernimmt keine Haftung für die Richtigkeit oder 
          Vollständigkeit der bereitgestellten Informationen.
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Musterbrief an Vermieter
   */
  _generateMusterbriefVermieter(userInfo, stats, startDate, endDate) {
    const stunden = Math.round((stats.eventsDuringNight / stats.totalEvents) * 100) || 0;
    
    return `
      <p><strong>${userInfo.name || '[Ihr Name]'}</strong><br>
      ${userInfo.address || '[Ihre Adresse]'}</p>
      
      <p>${this._formatDate(new Date())}</p>
      
      <p><strong>Betreff: Lärmbeeinträchtigung in der Mietwohnung</strong></p>
      
      <p>Sehr geehrte Damen und Herren,</p>
      
      <p>ich bin Mieter der Wohnung ${userInfo.apartment || '[Wohnungsnr.]'} in Ihrem Objekt 
      ${userInfo.property || '[Objektadresse]'}.</p>
      
      <p>Seit ${this._formatDate(startDate)} werde ich durch erhebliche Lärmbeeinträchtigungen 
      in der Nutzung meiner Wohnung eingeschränkt. Ich habe die Störungen systematisch 
      dokumentiert:</p>
      
      <ul>
        <li><strong>Anzahl dokumentierter Störungen:</strong> ${stats.totalEvents}</li>
        <li><strong>Davon in Ruhezeiten (22-06 Uhr):</strong> ${stats.eventsDuringNight} (${stunden}%)</li>
        <li><strong>Maximale gemessene Lautstärke:</strong> ${Math.round(stats.maxDecibel)} dB</li>
        <li><strong>Durchschnittliche Lautstärke:</strong> ${Math.round(stats.avgDecibel)} dB</li>
      </ul>
      
      <p>Die Lärmbeeinträchtigung stellt einen Mangel der Mietsache dar (§ 536 BGB). 
      Ich setze Sie hiermit in Abhilfe und ersuche um unverzügliche Prüfung der 
      Situation und Unterbindung der Störungen.</p>
      
      <p>Bei weiteren Störungen behalte ich mir vor, eine Mietminderung geltend zu machen.</p>
      
      <p>Mit freundlichen Grüßen<br>
      ${userInfo.name || '[Ihr Name]'}</p>
      
      <p><em>Anlage: Lärmprotokoll (${stats.totalEvents} dokumentierte Störungen)</em></p>
    `;
  }

  /**
   * Musterbrief an Nachbarn (anonym/unkonfrontativ)
   */
  _generateMusterbriefNachbar(userInfo, stats) {
    return `
      <p>Betreff: Höfliche Bitte um Rücksichtnahme</p>
      
      <p>Hallo Nachbar,</p>
      
      <p>ich bin Ihr Nachbar aus der Wohnung ${userInfo.apartment || '[Nr.]'} in der 
      ${userInfo.address || '[Adresse]'}. Ich wende mich höflich an Sie, da ich in den 
      letzten Wochen vermehrt Lärm aus Ihrer Wohnung wahrgenommen habe.</p>
      
      <p>Besonders in den Ruhezeiten (abends/nachts) habe ich Störungen bemerkt. 
      Ich bin mir sicher, dass dies nicht böswillig geschieht, möchte Sie aber freundlich 
      bitten, auf die Lautstärke zu achten – besonders in den Abend- und Nachtstunden.</p>
      
      <p>Falls Sie gerade renovieren oder besondere Umstände vorliegen, würde ich mich 
      über eine kurze Rückmeldung freuen. Offene Kommunikation hilft oft, Missverständnisse 
      zu vermeiden.</p>
      
      <p>Vielen Dank für Ihr Verständnis!</p>
      
      <p>Ihr Nachbar aus der Wohnung ${userInfo.apartment || '[Nr.]'}</p>
    `;
  }

  /**
   * Fristen-Kalender
   */
  _generateFristenKalender() {
    return `
      <ul>
        <li><strong>Setzungsfrist für Vermieter:</strong> Nach Erhalt des Schreibens sollten 
        Sie dem Vermieter eine angemessene Frist (ca. 2-4 Wochen) zur Abhilfe einräumen.</li>
        
        <li><strong>Mietminderung:</strong> Erst nach Ablauf der Setzungsfrist und 
        weiteren Störungen können Sie die Miete mindern.</li>
        
        <li><strong>Kündigungsrecht:</strong> Bei schwerwiegenden, wiederholten Störungen 
        kann ein außerordentliches Kündigungsrecht bestehen (nach vorheriger Abmahnung).</li>
        
        <li><strong>Verjährung:</strong> Mietminderungsansprüche verjähren in 3 Jahren 
        (ab Kenntnis der Störung).</li>
      </ul>
    `;
  }

  /**
   * Berechne Mietminderungsempfehlung
   */
  _calculateRentReduction(stats) {
    const nightRatio = stats.eventsDuringNight / stats.totalEvents;
    const avgDb = stats.avgDecibel;
    
    let percent = '5-10%';
    let reasoning = 'Leichte Beeinträchtigung';
    
    if (nightRatio > 0.5 && avgDb > 55) {
      percent = '20-30%';
      reasoning = 'Erhebliche Beeinträchtigung, besonders in Ruhezeiten';
    } else if (nightRatio > 0.3 || avgDb > 60) {
      percent = '10-20%';
      reasoning = 'Mittlere Beeinträchtigung mit Nachtzeit-Anteil';
    } else if (stats.totalEvents > 50) {
      percent = '15-25%';
      reasoning = 'Häufige Wiederholung der Störungen';
    }
    
    return { percent, reasoning };
  }

  // Hilfsfunktionen
  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE');
  }

  _formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('de-DE');
  }

  _formatDateFile(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  _formatDateRange(start, end) {
    return `${this._formatDate(start)} - ${this._formatDate(end)}`;
  }

  _formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  _translateClassification(classification) {
    const translations = {
      music: 'Musik',
      drilling: 'Bohren/Hämmern',
      dog: 'Hundebellen',
      children: 'Kinderlärm',
      voices: 'Gespräche',
      traffic: 'Verkehr',
      footsteps: 'Schritte',
      unknown: 'Unbekannt'
    };
    return translations[classification] || classification;
  }
}

export default new PDFReportService();
