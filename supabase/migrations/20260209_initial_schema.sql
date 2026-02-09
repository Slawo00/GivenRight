-- GivenRight Initial Database Schema
-- Created: 2026-02-09
-- Purpose: Core tables for gift recommendation system with confidence scoring

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Users table for app users
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    total_recommendations INTEGER DEFAULT 0
);

-- Recipients table for gift recipients
CREATE TABLE IF NOT EXISTS recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    age_range VARCHAR(50),
    gender VARCHAR(50),
    personality_type VARCHAR(100),
    interests TEXT[],
    hobbies TEXT[],
    lifestyle VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift sessions table for each recommendation session
CREATE TABLE IF NOT EXISTS gift_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
    occasion VARCHAR(100) NOT NULL,
    budget_min DECIMAL(10,2) DEFAULT 0,
    budget_max DECIMAL(10,2) DEFAULT 100,
    timing VARCHAR(50) DEFAULT 'flexible',
    special_notes TEXT,
    confidence_score INTEGER DEFAULT 0,
    score_breakdown JSONB DEFAULT '{}',
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Gift recommendations table
CREATE TABLE IF NOT EXISTS gift_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES gift_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price_range VARCHAR(50),
    confidence_score INTEGER NOT NULL,
    reasoning TEXT,
    purchase_links JSONB DEFAULT '[]',
    ai_generated BOOLEAN DEFAULT FALSE,
    user_feedback INTEGER, -- 1-5 rating
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confidence scoring factors table
CREATE TABLE IF NOT EXISTS confidence_factors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES gift_sessions(id) ON DELETE CASCADE,
    factor_type VARCHAR(100) NOT NULL, -- 'personality', 'relationship', 'budget', 'occasion', 'preference'
    factor_value VARCHAR(255),
    points_awarded INTEGER DEFAULT 0,
    max_points INTEGER DEFAULT 0,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift categories lookup table
CREATE TABLE IF NOT EXISTS gift_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    typical_price_range VARCHAR(50),
    personality_matches TEXT[],
    occasion_matches TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default gift categories
INSERT INTO gift_categories (name, description, typical_price_range, personality_matches, occasion_matches) VALUES
('Creative & Arts', 'Art supplies, craft kits, creative workshops', '$20-150', ARRAY['Creative & Artistic'], ARRAY['Birthday', 'Christmas', 'Just Because']),
('Technology', 'Gadgets, smart devices, tech accessories', '$25-200', ARRAY['Tech Enthusiast'], ARRAY['Birthday', 'Graduation', 'Christmas']),
('Experience', 'Classes, workshops, events, activities', '$30-300', ARRAY['Active & Adventurous', 'Social & Outgoing'], ARRAY['Birthday', 'Anniversary', 'Graduation']),
('Food & Drink', 'Gourmet items, cooking supplies, beverages', '$15-100', ARRAY['Practical & Logical'], ARRAY['Housewarming', 'Thank You', 'Christmas']),
('Comfort & Wellness', 'Relaxation items, self-care, cozy goods', '$20-120', ARRAY['Homebody & Cozy', 'Quiet & Thoughtful'], ARRAY['Thank You', 'Just Because', 'Valentine''s Day']),
('Personal & Sentimental', 'Custom items, photo gifts, memory keepsakes', '$25-150', ARRAY['Quiet & Thoughtful'], ARRAY['Anniversary', 'Valentine''s Day', 'Wedding']),
('Books & Learning', 'Books, courses, educational materials', '$15-80', ARRAY['Quiet & Thoughtful'], ARRAY['Graduation', 'Birthday', 'Just Because']),
('Fashion & Style', 'Clothing, accessories, jewelry', '$20-250', ARRAY['Social & Outgoing'], ARRAY['Birthday', 'Christmas', 'Valentine''s Day']),
('Home & Garden', 'Home decor, plants, organization items', '$25-150', ARRAY['Homebody & Cozy', 'Nature Lover'], ARRAY['Housewarming', 'Wedding', 'Christmas']),
('Sports & Fitness', 'Exercise equipment, outdoor gear, sports items', '$30-200', ARRAY['Active & Adventurous'], ARRAY['New Year', 'Birthday', 'Graduation'])
ON CONFLICT (name) DO NOTHING;

-- Functions for confidence scoring
CREATE OR REPLACE FUNCTION calculate_confidence_score(
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
        IF array_length(p_interests, 1) >= 3 THEN
            personality_score := personality_score + 10;
        ELSIF array_length(p_interests, 1) >= 1 THEN
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
            budget_score := budget_score + 5; -- Specific budget
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

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_recipients_user_id ON recipients(user_id);
CREATE INDEX idx_gift_sessions_user_id ON gift_sessions(user_id);
CREATE INDEX idx_gift_sessions_created_at ON gift_sessions(created_at);
CREATE INDEX idx_gift_recommendations_session_id ON gift_recommendations(session_id);
CREATE INDEX idx_gift_recommendations_confidence_score ON gift_recommendations(confidence_score DESC);
CREATE INDEX idx_confidence_factors_session_id ON confidence_factors(session_id);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_factors ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY recipients_own_data ON recipients FOR ALL USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT id FROM users WHERE auth.uid() = id)
);
CREATE POLICY sessions_own_data ON gift_sessions FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (SELECT id FROM users WHERE auth.uid() = id)
);
CREATE POLICY recommendations_own_data ON gift_recommendations FOR ALL USING (
    session_id IN (SELECT id FROM gift_sessions WHERE user_id = auth.uid())
);
CREATE POLICY factors_own_data ON confidence_factors FOR ALL USING (
    session_id IN (SELECT id FROM gift_sessions WHERE user_id = auth.uid())
);

-- Gift categories are public (read-only)
CREATE POLICY categories_public_read ON gift_categories FOR SELECT USING (true);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'App users with their preferences and stats';
COMMENT ON TABLE recipients IS 'Gift recipients with personality and preference data';
COMMENT ON TABLE gift_sessions IS 'Individual gift-giving sessions with context and scoring';
COMMENT ON TABLE gift_recommendations IS 'AI-generated and curated gift recommendations';
COMMENT ON TABLE confidence_factors IS 'Detailed breakdown of confidence scoring factors';
COMMENT ON TABLE gift_categories IS 'Predefined gift categories with matching criteria';

COMMENT ON FUNCTION calculate_confidence_score IS 'Calculates overall confidence score based on user inputs';
COMMENT ON FUNCTION get_recommended_categories IS 'Returns recommended gift categories based on personality and occasion';