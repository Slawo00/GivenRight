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
  relationship_fit TEXT,
  things_to_consider TEXT[],
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

----------------------------------------------------
-- STEP 0.8 - Gift Memory & Non-Repetition
----------------------------------------------------

----------------------------------------------------
-- 5) gift_memory
-- Purpose: Record of completed gift decisions per relationship.
-- Written ONLY when decision_state === completed_with_execution.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS gift_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  confidence_type TEXT NOT NULL CHECK (confidence_type IN ('safe', 'emotional', 'bold')),
  occasion_type TEXT NOT NULL,
  success_signal TEXT NOT NULL DEFAULT 'pending' CHECK (success_signal IN ('pending', 'positive', 'neutral', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE gift_memory IS 'Records of completed gift decisions per relationship';
COMMENT ON COLUMN gift_memory.success_signal IS 'Feedback status: pending until user provides feedback';

----------------------------------------------------
-- 6) historical_success
-- Purpose: Aggregated success weights per pattern and relationship.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS historical_success (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_key TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  confidence_type TEXT NOT NULL CHECK (confidence_type IN ('safe', 'emotional', 'bold')),
  success_weight NUMERIC NOT NULL DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(relationship_key, pattern_id)
);

COMMENT ON TABLE historical_success IS 'Aggregated success patterns per relationship';
COMMENT ON COLUMN historical_success.success_weight IS 'Weight from 0.0 (negative) to 1.0 (positive), starts at 0.5 (neutral)';

----------------------------------------------------
-- 7) non_repetition_rules
-- Purpose: Cooldown rules to prevent pattern repetition.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS non_repetition_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id TEXT NOT NULL,
  cooldown_days INTEGER NOT NULL DEFAULT 90,
  applies_to_confidence_type TEXT CHECK (applies_to_confidence_type IN ('safe', 'emotional', 'bold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pattern_id, applies_to_confidence_type)
);

COMMENT ON TABLE non_repetition_rules IS 'Cooldown rules to prevent pattern repetition';
COMMENT ON COLUMN non_repetition_rules.cooldown_days IS 'Days before same pattern can be recommended again';

----------------------------------------------------
-- RLS for memory tables
----------------------------------------------------
ALTER TABLE gift_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_success ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_repetition_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gift_memory_user_access" ON gift_memory
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "historical_success_user_access" ON historical_success
  FOR ALL
  TO authenticated
  USING (relationship_key LIKE auth.uid()::text || ':%');

CREATE POLICY "non_repetition_rules_read_only" ON non_repetition_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

----------------------------------------------------
-- INDEXES for memory tables
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gift_memory_user ON gift_memory(user_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_memory_relationship ON gift_memory(user_id, recipient_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_historical_success_key ON historical_success(relationship_key);
CREATE INDEX IF NOT EXISTS idx_non_repetition_pattern ON non_repetition_rules(pattern_id);

----------------------------------------------------
-- STEP SCREEN1 - Dynamic Option Tables
----------------------------------------------------

----------------------------------------------------
-- 8) q_relationship_types
-- Purpose: All relationship type options for Screen 1.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_relationship_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_relationship_types IS 'Relationship type options for Screen 1';

----------------------------------------------------
-- 9) q_closeness_levels
-- Purpose: All closeness level options for Screen 1.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_closeness_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emotional_expectation INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_closeness_levels IS 'Closeness level options for Screen 1';

----------------------------------------------------
-- 10) q_occasion_types
-- Purpose: All occasion type options for Screen 1.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_occasion_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_occasion_types IS 'Occasion type options for Screen 1';

----------------------------------------------------
-- 11) q_occasion_importance_levels
-- Purpose: All occasion importance level options for Screen 1.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_occasion_importance_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  importance_level INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_occasion_importance_levels IS 'Occasion importance level options for Screen 1';

----------------------------------------------------
-- RLS for Screen 1 option tables
----------------------------------------------------
ALTER TABLE q_relationship_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE q_closeness_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE q_occasion_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE q_occasion_importance_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "q_relationship_types_read_only" ON q_relationship_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "q_closeness_levels_read_only" ON q_closeness_levels
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "q_occasion_types_read_only" ON q_occasion_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "q_occasion_importance_levels_read_only" ON q_occasion_importance_levels
  FOR SELECT
  TO anon, authenticated
  USING (true);

----------------------------------------------------
-- INDEXES for Screen 1 option tables
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_q_relationship_types_sort ON q_relationship_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_q_closeness_levels_sort ON q_closeness_levels(emotional_expectation);
CREATE INDEX IF NOT EXISTS idx_q_occasion_types_sort ON q_occasion_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_q_importance_levels_sort ON q_occasion_importance_levels(importance_level);

----------------------------------------------------
-- STEP SCREEN4 - Practical Constraints Tables
----------------------------------------------------

----------------------------------------------------
-- 16) q_gift_type_preferences
-- Purpose: Gift type preference options for Screen 4.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_gift_type_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_gift_type_preferences IS 'Gift type preference options for Screen 4';

----------------------------------------------------
-- 17) q_time_constraints
-- Purpose: Time constraint options for Screen 4.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS q_time_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  urgency_level INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE q_time_constraints IS 'Time constraint options for Screen 4';

----------------------------------------------------
-- RLS for Screen 4 option tables
----------------------------------------------------
ALTER TABLE q_gift_type_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE q_time_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "q_gift_type_preferences_read_only" ON q_gift_type_preferences
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "q_time_constraints_read_only" ON q_time_constraints
  FOR SELECT
  TO anon, authenticated
  USING (true);

----------------------------------------------------
-- INDEXES for Screen 4 option tables
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_q_gift_type_preferences_sort ON q_gift_type_preferences(sort_order);
CREATE INDEX IF NOT EXISTS idx_q_time_constraints_urgency ON q_time_constraints(urgency_level);
