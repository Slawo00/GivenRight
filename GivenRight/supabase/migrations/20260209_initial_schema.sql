-- GivenRight Enhanced Schema
-- Created: 2026-02-09
-- Purpose: Add gift recommendation tables + enhanced confidence scoring
-- NOTE: Existing tables (users, recipients, gift_sessions, etc.) from v2 are preserved

-- ============================================
-- NEW TABLES (only if they don't exist yet)
-- ============================================

-- Gift recommendations table
CREATE TABLE IF NOT EXISTS gift_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price_range VARCHAR(50),
    confidence_score INTEGER NOT NULL DEFAULT 0,
    reasoning TEXT,
    purchase_links JSONB DEFAULT '[]',
    ai_generated BOOLEAN DEFAULT FALSE,
    user_feedback INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confidence scoring factors table
CREATE TABLE IF NOT EXISTS confidence_factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID,
    factor_type VARCHAR(100) NOT NULL,
    factor_value VARCHAR(255),
    points_awarded INTEGER DEFAULT 0,
    max_points INTEGER DEFAULT 0,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift categories lookup table
CREATE TABLE IF NOT EXISTS gift_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    typical_price_range VARCHAR(50),
    personality_matches TEXT[],
    occasion_matches TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO gift_categories (name, description, typical_price_range, personality_matches, occasion_matches) VALUES
('Creative & Arts', 'Art supplies, craft kits, creative workshops', '$20-150', ARRAY['Creative & Artistic', 'creative'], ARRAY['Birthday', 'Christmas', 'Just Because']),
('Technology', 'Gadgets, smart devices, tech accessories', '$25-200', ARRAY['Tech Enthusiast', 'analytical'], ARRAY['Birthday', 'Graduation', 'Christmas']),
('Experience', 'Classes, workshops, events, activities', '$30-300', ARRAY['Active & Adventurous', 'adventurous', 'Social & Outgoing'], ARRAY['Birthday', 'Anniversary', 'Graduation']),
('Food & Drink', 'Gourmet items, cooking supplies, beverages', '$15-100', ARRAY['Practical & Logical', 'practical'], ARRAY['Housewarming', 'Thank You', 'Christmas']),
('Comfort & Wellness', 'Relaxation items, self-care, cozy goods', '$20-120', ARRAY['Homebody & Cozy', 'Quiet & Thoughtful', 'introverted'], ARRAY['Thank You', 'Just Because']),
('Personal & Sentimental', 'Custom items, photo gifts, memory keepsakes', '$25-150', ARRAY['Quiet & Thoughtful', 'sentimental'], ARRAY['Anniversary', 'Wedding']),
('Books & Learning', 'Books, courses, educational materials', '$15-80', ARRAY['Quiet & Thoughtful', 'intellectual'], ARRAY['Graduation', 'Birthday', 'Just Because']),
('Fashion & Style', 'Clothing, accessories, jewelry', '$20-250', ARRAY['Social & Outgoing', 'trendy'], ARRAY['Birthday', 'Christmas']),
('Home & Garden', 'Home decor, plants, organization items', '$25-150', ARRAY['Homebody & Cozy', 'Nature Lover'], ARRAY['Housewarming', 'Wedding', 'Christmas']),
('Sports & Fitness', 'Exercise equipment, outdoor gear, sports items', '$30-200', ARRAY['Active & Adventurous', 'athletic'], ARRAY['Birthday', 'Graduation'])
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ENHANCED CONFIDENCE SCORING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_gift_confidence_score(
    p_personality_type VARCHAR,
    p_interests TEXT[],
    p_relationship VARCHAR,
    p_budget_min DECIMAL,
    p_budget_max DECIMAL,
    p_occasion VARCHAR,
    p_special_notes TEXT
) RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER := 0;
    personality_score INTEGER := 0;
    relationship_score INTEGER := 0;
    budget_score INTEGER := 0;
    occasion_score INTEGER := 0;
    preference_score INTEGER := 0;
BEGIN
    -- Personality Match Score (max 25 points)
    IF p_personality_type IS NOT NULL THEN
        personality_score := 15;
        IF p_interests IS NOT NULL AND array_length(p_interests, 1) >= 3 THEN
            personality_score := personality_score + 10;
        ELSIF p_interests IS NOT NULL AND array_length(p_interests, 1) >= 1 THEN
            personality_score := personality_score + 5;
        END IF;
    END IF;
    
    -- Relationship Score (max 20 points)
    relationship_score := CASE p_relationship
        WHEN 'partner' THEN 20
        WHEN 'best_friend' THEN 16
        WHEN 'family_close' THEN 18
        WHEN 'good_friend' THEN 14
        WHEN 'colleague' THEN 10
        ELSE 6
    END;
    
    -- Budget Score (max 15 points)
    IF p_budget_max > p_budget_min THEN
        budget_score := 10;
        IF (p_budget_max - p_budget_min) <= 20 THEN
            budget_score := budget_score + 5;
        END IF;
    END IF;
    
    -- Occasion Score (max 20 points)
    IF p_occasion IS NOT NULL THEN
        occasion_score := CASE p_occasion
            WHEN 'Anniversary' THEN 20
            WHEN 'Wedding' THEN 20
            WHEN 'Birthday' THEN 18
            WHEN 'Christmas' THEN 16
            WHEN 'Graduation' THEN 18
            ELSE 12
        END;
    END IF;
    
    -- Special Notes Bonus (max 20 points)
    IF p_special_notes IS NOT NULL AND length(p_special_notes) > 10 THEN
        preference_score := 15;
        IF length(p_special_notes) > 50 THEN
            preference_score := 20;
        END IF;
    END IF;
    
    total_score := personality_score + relationship_score + budget_score + occasion_score + preference_score;
    
    RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended gift categories
CREATE OR REPLACE FUNCTION get_recommended_categories(
    p_personality_type VARCHAR,
    p_occasion VARCHAR
) RETURNS TABLE(category_name VARCHAR, match_score INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.name,
        CASE 
            WHEN p_personality_type = ANY(gc.personality_matches) AND p_occasion = ANY(gc.occasion_matches) THEN 100
            WHEN p_personality_type = ANY(gc.personality_matches) THEN 80
            WHEN p_occasion = ANY(gc.occasion_matches) THEN 60
            ELSE 30
        END as match_score
    FROM gift_categories gc
    ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES (safe with IF NOT EXISTS pattern)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gift_recommendations_session_id ON gift_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_gift_recommendations_confidence ON gift_recommendations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_confidence_factors_session_id ON confidence_factors(session_id);
CREATE INDEX IF NOT EXISTS idx_gift_categories_name ON gift_categories(name);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE gift_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_categories ENABLE ROW LEVEL SECURITY;

-- Gift categories are public (read-only)
CREATE POLICY categories_public_read ON gift_categories FOR SELECT USING (true);

-- Recommendations and factors: allow all for now (refine with auth later)
CREATE POLICY recommendations_public ON gift_recommendations FOR ALL USING (true);
CREATE POLICY factors_public ON confidence_factors FOR ALL USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE gift_recommendations IS 'AI-generated and curated gift recommendations';
COMMENT ON TABLE confidence_factors IS 'Detailed breakdown of confidence scoring factors';
COMMENT ON TABLE gift_categories IS 'Predefined gift categories with matching criteria';
COMMENT ON FUNCTION calculate_gift_confidence_score IS 'Enhanced confidence scoring for gift recommendations';
COMMENT ON FUNCTION get_recommended_categories IS 'Returns gift categories ranked by personality+occasion match';