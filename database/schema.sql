-- GivenRight Configuration Database Schema
-- STEP 0.4.A - Supabase Configuration Layer
-- This database stores ONLY configuration and content.
-- NO user data, NO learning, NO writes from the app yet.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1) ui_texts
-- Purpose: All UI texts, labels, explanations, multi-language.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS ui_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  value TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language)
);

COMMENT ON TABLE ui_texts IS 'UI texts for multi-language support';
COMMENT ON COLUMN ui_texts.key IS 'Unique key like home.title, decision.safe.label';
COMMENT ON COLUMN ui_texts.language IS 'Language code: en, de, fr';
COMMENT ON COLUMN ui_texts.context IS 'Screen or component name for organization';

----------------------------------------------------
-- 2) decision_parameters
-- Purpose: All numeric parameters for decision logic.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE decision_parameters IS 'Numeric parameters for decision engine';
COMMENT ON COLUMN decision_parameters.key IS 'Parameter key like weight.occasion.birthday';

----------------------------------------------------
-- 3) decision_explanations
-- Purpose: Text explanations per direction (SAFE / EMOTIONAL / BOLD).
----------------------------------------------------
CREATE TABLE IF NOT EXISTS decision_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  direction TEXT NOT NULL CHECK (direction IN ('safe', 'emotional', 'bold')),
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  emotional_signal TEXT,
  risk_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(direction, language)
);

COMMENT ON TABLE decision_explanations IS 'Explanations for each decision direction';

----------------------------------------------------
-- 4) object_patterns
-- Purpose: Pattern-level explanations BEFORE products.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS object_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_key TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('safe', 'emotional', 'bold')),
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  description TEXT,
  emotional_intent TEXT,
  icon TEXT DEFAULT '🎁',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pattern_key, direction, language)
);

COMMENT ON TABLE object_patterns IS 'Gift pattern explanations before specific products';

----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Read-only access for anon and authenticated users
----------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE ui_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_patterns ENABLE ROW LEVEL SECURITY;

-- ui_texts: Read-only for everyone
CREATE POLICY "ui_texts_read_only" ON ui_texts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- decision_parameters: Read-only for everyone
CREATE POLICY "decision_parameters_read_only" ON decision_parameters
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- decision_explanations: Read-only for everyone
CREATE POLICY "decision_explanations_read_only" ON decision_explanations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- object_patterns: Read-only for everyone
CREATE POLICY "object_patterns_read_only" ON object_patterns
  FOR SELECT
  TO anon, authenticated
  USING (true);

----------------------------------------------------
-- INDEXES for performance
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ui_texts_key_lang ON ui_texts(key, language);
CREATE INDEX IF NOT EXISTS idx_decision_params_key ON decision_parameters(key);
CREATE INDEX IF NOT EXISTS idx_explanations_direction ON decision_explanations(direction, language);
CREATE INDEX IF NOT EXISTS idx_patterns_key ON object_patterns(pattern_key, direction);
