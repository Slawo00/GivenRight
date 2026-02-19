-- SilenceNow Database Schema
-- Privacy-First Lärm-Dokumentations-App für Mieter
-- BGH-konform nach VIII ZR 155/11

-- ============================================
-- 1. PROFILES (User-Profile)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    
    -- Rechtliche Informationen (§536b BGB Check)
    noise_problem_since TEXT CHECK (noise_problem_since IN ('before_move_in', 'after_move_in', 'new_problem')),
    
    -- Gebäude-Info für Daten-Monopol
    building_id UUID REFERENCES buildings(id),
    apartment_floor INTEGER,
    apartment_side TEXT CHECK (apartment_side IN ('street', 'courtyard', 'mixed')),
    
    -- Einstellungen
    threshold_db INTEGER DEFAULT 55, -- Ab wann gilt es als "Event"
    night_mode_enabled BOOLEAN DEFAULT true,
    background_monitoring_enabled BOOLEAN DEFAULT true,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    
    -- Monetarisierung
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic_report', 'enforcement_pack', 'premium')),
    subscription_expires_at TIMESTAMPTZ
);

-- RLS: User sieht nur eigenes Profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. BUILDINGS (Gebäude für Daten-Monopol)
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Anonymisierte Adresse (nur PLZ + Stadt für Daten-Monopol)
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'DE',
    
    -- Gebäude-Typ
    building_type TEXT CHECK (building_type IN ('apartment', 'house', 'mixed')),
    construction_year INTEGER,
    
    -- Aggregierte Lärm-Daten (anonym)
    total_events_count INTEGER DEFAULT 0,
    average_noise_level DECIMAL(4,1),
    noise_score DECIMAL(3,2), -- 0.00 - 1.00
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Gebäude-Daten sind öffentlich (für Lärm-Scores)
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buildings are viewable by everyone" ON buildings
    FOR SELECT USING (true);

-- ============================================
-- 3. NOISE_EVENTS (Lärmereignisse - Privacy-First!)
-- ============================================
-- Wichtig: Keine Audio-Daten! Nur numerische Messwerte (§201 StGB-konform)
CREATE TABLE IF NOT EXISTS noise_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id),
    
    -- Zeit (BGH: "Tageszeiten, Zeitdauer")
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER, -- Berechnet aus started/ended
    
    -- Dezibel-Messungen (Privacy-First: nur Zahlen!)
    max_decibel DECIMAL(4,1),
    avg_decibel DECIMAL(4,1),
    min_decibel DECIMAL(4,1),
    
    -- Frequenzanalyse (für KI-Klassifikation)
    freq_band_125hz DECIMAL(4,2), -- Bass
    freq_band_250hz DECIMAL(4,2),
    freq_band_500hz DECIMAL(4,2),
    freq_band_1khz DECIMAL(4,2),  -- Sprache
    freq_band_2khz DECIMAL(4,2),
    freq_band_4khz DECIMAL(4,2),
    freq_band_8khz DECIMAL(4,2),  -- Höhen
    
    -- KI-Klassifikation (BGH: "Art der Störung")
    ai_classification TEXT CHECK (ai_classification IN (
        'music', 'drilling', 'dog', 'children', 'footsteps', 
        'shouting', 'tv', 'traffic', 'unknown', 'other'
    )),
    ai_confidence DECIMAL(3,2), -- 0.00 - 1.00
    
    -- Kinderlärm-Flag (BGH VIII ZR 226/16 Sonderregelung)
    is_children_noise BOOLEAN DEFAULT false,
    children_noise_flagged BOOLEAN DEFAULT false, -- Wenn ja: rechtlicher Hinweis nötig
    
    -- Zeit-Kategorie (für Reports)
    time_category TEXT CHECK (time_category IN (
        'day',        -- 6-22 Uhr
        'evening',    -- 22-23 Uhr  
        'night',      -- 23-6 Uhr (schwerwiegend)
        'weekend_day',
        'weekend_night'
    )),
    
    -- Zusätzliche Daten
    is_manual_entry BOOLEAN DEFAULT false, -- User hat es manuell hinzugefügt
    notes TEXT, -- Optional: subjektive Auswirkungen
    
    -- Zeugen (für Beweiskraft)
    witness_name TEXT,
    witness_contact TEXT,
    witness_notified BOOLEAN DEFAULT false,
    
    -- Korroboration (Multi-Device)
    corroborated_by UUID REFERENCES noise_events(id), -- Anderes Gerät hat gleichzeitig gemessen
    corroboration_match DECIMAL(3,2), -- Übereinstimmung in %
    
    -- Sync-Status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false -- Soft-Delete
);

-- Indexe für Performance
CREATE INDEX idx_noise_events_user_id ON noise_events(user_id);
CREATE INDEX idx_noise_events_started_at ON noise_events(started_at);
CREATE INDEX idx_noise_events_building_id ON noise_events(building_id);
CREATE INDEX idx_noise_events_classification ON noise_events(ai_classification);

-- RLS: User sieht nur eigene Events
ALTER TABLE noise_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON noise_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON noise_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON noise_events
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON noise_events
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. REPORTS (Gated Outputs - PDF-Protokolle)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Report-Typ (Gated Outputs)
    report_type TEXT NOT NULL CHECK (report_type IN (
        'basic',        -- €19.99 - Basis-Protokoll
        'enforcement',  -- €49.99 - Durchsetzungs-Paket
        'premium'       -- €79.99 - Alles + 6 Monate
    )),
    
    -- Zeitraum
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_days INTEGER NOT NULL,
    
    -- Aggregierte Statistiken (BGH-konform)
    total_events INTEGER,
    events_during_night INTEGER, -- 22-6 Uhr (besonders relevant)
    events_during_day INTEGER,
    avg_decibel_overall DECIMAL(4,1),
    max_decibel_recorded DECIMAL(4,1),
    
    -- Häufigkeit (BGH: "ungefähre Häufigkeit")
    frequency_score DECIMAL(3,2), -- 0.00 - 1.00 (wie oft pro Woche)
    
    -- Lärm-Typen Verteilung
    classification_breakdown JSONB, -- {"music": 12, "drilling": 3, ...}
    
    -- Rechtliche Daten
    rent_amount DECIMAL(8,2), -- Kaltmiete für Minderungsberechnung
    estimated_reduction_percent_min INTEGER,
    estimated_reduction_percent_max INTEGER,
    estimated_reduction_percent_median INTEGER,
    estimated_monthly_savings DECIMAL(8,2),
    
    -- §536b Hinweis (Vorkenntnis)
    vorkenntnis_disclaimer_included BOOLEAN DEFAULT false,
    
    -- Kinderlärm Hinweis
    children_noise_disclaimer_included BOOLEAN DEFAULT false,
    
    -- Datei
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Blockchain-Verankerung (optional, Premium)
    blockchain_tx_hash TEXT,
    blockchain_verified_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'error')),
    error_message TEXT,
    
    -- Payment
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_id TEXT, -- Store Transaction ID
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Reports können ablaufen (z.B. nach 1 Jahr)
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. IAP_PURCHASES (In-App Purchases Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS iap_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Store-Informationen
    store_type TEXT NOT NULL CHECK (store_type IN ('app_store', 'play_store')),
    product_id TEXT NOT NULL, -- z.B. "com.silencenow.basic_report"
    transaction_id TEXT UNIQUE NOT NULL,
    
    -- Preis
    price_amount DECIMAL(8,2),
    price_currency TEXT DEFAULT 'EUR',
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Verknüpfung zu Report
    report_id UUID REFERENCES reports(id),
    
    -- Original Receipt (für Validation)
    store_receipt TEXT,
    validated_at TIMESTAMPTZ,
    validation_response JSONB
);

-- RLS
ALTER TABLE iap_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON iap_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 6. MÄNGELANZEIGEN (§536c BGB-konform)
-- ============================================
CREATE TABLE IF NOT EXISTS mangelanzeigen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id),
    
    -- Adressat
    landlord_name TEXT NOT NULL,
    landlord_address TEXT NOT NULL,
    
    -- Inhalt (automatisch generiert)
    letter_content TEXT NOT NULL,
    
    -- Frist (§536c BGB: "unverzüglich")
    sent_at TIMESTAMPTZ,
    frist_days INTEGER DEFAULT 14,
    frist_end_date DATE,
    
    -- Tracking
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'no_response', 'landlord_responded')),
    
    -- Antwort des Vermieters (User kann dokumentieren)
    landlord_response TEXT,
    landlord_responded_at TIMESTAMPTZ,
    abhilfe_geschaffen BOOLEAN, -- Wurde der Lärm reduziert?
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE mangelanzeigen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own anzeigen" ON mangelanzeigen
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own anzeigen" ON mangelanzeigen
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. ANALYTICS_EVENTS (Privacy-First Tracking)
-- ============================================
-- Keine PII! Nur anonymisierte Nutzungsdaten
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Anonymisiert (keine User-ID!)
    anonymous_session_id TEXT,
    
    -- Event
    event_type TEXT NOT NULL CHECK (event_type IN (
        'app_open', 'monitoring_start', 'monitoring_stop', 
        'event_detected', 'report_generated', 'purchase_initiated',
        'purchase_completed', 'pdf_exported', 'letter_sent'
    )),
    
    -- Meta
    platform TEXT, -- ios, android
    app_version TEXT,
    
    -- Zeit
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keine RLS nötig - anonymisiert

-- ============================================
-- FUNCTIONS
-- ============================================

-- Funktion: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für noise_events  
CREATE TRIGGER update_noise_events_updated_at BEFORE UPDATE ON noise_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (für Reports)
-- ============================================

-- View: Wöchentliche Zusammenfassung pro User
CREATE OR REPLACE VIEW user_weekly_summary AS
SELECT 
    user_id,
    DATE_TRUNC('week', started_at) as week,
    COUNT(*) as event_count,
    AVG(avg_decibel) as avg_db,
    MAX(max_decibel) as max_db,
    COUNT(CASE WHEN time_category IN ('night', 'weekend_night') THEN 1 END) as night_events
FROM noise_events
WHERE is_deleted = false
GROUP BY user_id, DATE_TRUNC('week', started_at);

-- View: Gebäude-Lärm-Scores (für Daten-Monopol)
CREATE OR REPLACE VIEW building_noise_scores AS
SELECT 
    b.id,
    b.postal_code,
    b.city,
    COUNT(ne.id) as total_events,
    AVG(ne.avg_decibel) as avg_noise_level,
    COUNT(CASE WHEN ne.time_category IN ('night', 'weekend_night') THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) as night_noise_ratio,
    -- Score 0-1: Je höher, desto lärmiger
    LEAST(1.0, (AVG(ne.avg_decibel) - 40) / 40) as noise_score
FROM buildings b
LEFT JOIN noise_events ne ON b.id = ne.building_id AND ne.is_deleted = false
GROUP BY b.id, b.postal_code, b.city;

-- ============================================
-- EDGE FUNCTIONS (werden separat deployed)
-- ============================================
-- Diese Functions werden in TypeScript implementiert:
-- 
-- 1. generate-pdf-report
--    Input: report_id
--    Output: PDF-URL
--
-- 2. validate-iap-receipt  
--    Input: store_receipt, store_type
--    Output: validation_result
--
-- 3. ai-classify-noise
--    Input: freq_bands array
--    Output: classification, confidence
--
-- 4. generate-mangelanzeige
--    Input: user_id, event_ids
--    Output: letter_content
