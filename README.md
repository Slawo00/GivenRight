# SilenceNow - React Native App

Privacy-First Lärm-Dokumentation für Mietminderungen.

## Features
- 24/7 Dezibel-Monitoring
- KI-Klassifikation (Musik, Bohren, Hund, Kinder)
- BGH-konforme PDF-Reports
- On-Device Verarbeitung (keine Audio-Speicherung)

## Setup
```bash
npm install
npx expo start
```

## Struktur
- `src/services/` - AudioMonitor, KI-Klassifikation, PDF-Reports
- `src/screens/` - Onboarding, Main Screen
- `supabase/migrations/` - Datenbank Schema
