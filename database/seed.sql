-- GivenRight Initial Seed Data
-- STEP 0.4.A - Initial Configuration Data
-- Language: English (en)

----------------------------------------------------
-- UI TEXTS
----------------------------------------------------
INSERT INTO ui_texts (key, language, value, context) VALUES
-- Home Screen
('home.title', 'en', 'GivenRight', 'home'),
('home.subtitle', 'en', 'Find the perfect gift', 'home'),
('home.start_button', 'en', 'Start Decision', 'home'),

-- Decision Flow
('decision.step.relationship', 'en', 'Who is this gift for?', 'decision'),
('decision.step.occasion', 'en', 'What''s the occasion?', 'decision'),
('decision.step.budget', 'en', 'What''s your budget?', 'decision'),

-- Relationship Types
('relationship.partner', 'en', 'Partner', 'relationship'),
('relationship.parent', 'en', 'Parent', 'relationship'),
('relationship.child', 'en', 'Child', 'relationship'),
('relationship.friend', 'en', 'Friend', 'relationship'),
('relationship.colleague', 'en', 'Colleague', 'relationship'),
('relationship.other', 'en', 'Other', 'relationship'),

-- Occasions
('occasion.birthday', 'en', 'Birthday', 'occasion'),
('occasion.christmas', 'en', 'Christmas', 'occasion'),
('occasion.valentines', 'en', 'Valentine''s Day', 'occasion'),
('occasion.wedding', 'en', 'Wedding', 'occasion'),
('occasion.anniversary', 'en', 'Anniversary', 'occasion'),
('occasion.graduation', 'en', 'Graduation', 'occasion'),
('occasion.other', 'en', 'Other', 'occasion'),

-- Budget Ranges
('budget.under_50', 'en', 'Under $50', 'budget'),
('budget.50_100', 'en', '$50 - $100', 'budget'),
('budget.100_250', 'en', '$100 - $250', 'budget'),
('budget.250_plus', 'en', '$250+', 'budget'),

-- Direction Labels
('direction.safe', 'en', 'Safe Choice', 'direction'),
('direction.emotional', 'en', 'Emotional Choice', 'direction'),
('direction.bold', 'en', 'Bold Choice', 'direction'),

-- Risk Labels
('risk.low', 'en', 'Low Risk', 'risk'),
('risk.medium', 'en', 'Medium Risk', 'risk'),
('risk.high', 'en', 'High Risk', 'risk')

ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

----------------------------------------------------
-- DECISION PARAMETERS
-- Fully config-driven engine (STEP 0.4.B)
-- Format: weight.<category>.<type>.<direction>
----------------------------------------------------
INSERT INTO decision_parameters (key, value, description) VALUES
-- Base Scores
('base.safe', 50, 'Base score for safe direction'),
('base.emotional', 50, 'Base score for emotional direction'),
('base.bold', 50, 'Base score for bold direction'),

-- Relationship Modifiers - Partner
('weight.relationship.partner.safe', 0, 'Partner: safe modifier'),
('weight.relationship.partner.emotional', 15, 'Partner: emotional modifier'),
('weight.relationship.partner.bold', 15, 'Partner: bold modifier'),

-- Relationship Modifiers - Parent
('weight.relationship.parent.safe', 15, 'Parent: safe modifier'),
('weight.relationship.parent.emotional', 10, 'Parent: emotional modifier'),
('weight.relationship.parent.bold', 0, 'Parent: bold modifier'),

-- Relationship Modifiers - Child
('weight.relationship.child.safe', 0, 'Child: safe modifier'),
('weight.relationship.child.emotional', 15, 'Child: emotional modifier'),
('weight.relationship.child.bold', 5, 'Child: bold modifier'),

-- Relationship Modifiers - Friend
('weight.relationship.friend.safe', 0, 'Friend: safe modifier'),
('weight.relationship.friend.emotional', 10, 'Friend: emotional modifier'),
('weight.relationship.friend.bold', 15, 'Friend: bold modifier'),

-- Relationship Modifiers - Colleague
('weight.relationship.colleague.safe', 20, 'Colleague: safe modifier'),
('weight.relationship.colleague.emotional', -20, 'Colleague: emotional modifier'),
('weight.relationship.colleague.bold', -30, 'Colleague: bold modifier'),

-- Relationship Modifiers - Other
('weight.relationship.other.safe', 10, 'Other: safe modifier'),
('weight.relationship.other.emotional', 0, 'Other: emotional modifier'),
('weight.relationship.other.bold', 0, 'Other: bold modifier'),

-- Closeness Modifiers - High (4-5)
('weight.closeness.high.safe', 0, 'High closeness: safe modifier'),
('weight.closeness.high.emotional', 10, 'High closeness: emotional modifier'),
('weight.closeness.high.bold', 20, 'High closeness: bold modifier'),

-- Closeness Modifiers - Low (1-2)
('weight.closeness.low.safe', 15, 'Low closeness: safe modifier'),
('weight.closeness.low.emotional', 0, 'Low closeness: emotional modifier'),
('weight.closeness.low.bold', -10, 'Low closeness: bold modifier'),

-- Surprise Tolerance - Low
('weight.surprise.low.safe', 15, 'Low surprise: safe modifier'),
('weight.surprise.low.emotional', 0, 'Low surprise: emotional modifier'),
('weight.surprise.low.bold', -40, 'Low surprise: bold modifier'),

-- Surprise Tolerance - High
('weight.surprise.high.safe', 0, 'High surprise: safe modifier'),
('weight.surprise.high.emotional', 0, 'High surprise: emotional modifier'),
('weight.surprise.high.bold', 15, 'High surprise: bold modifier'),

-- Budget Modifiers - Under $50
('weight.budget.under_50.safe', 10, 'Under $50: safe modifier'),
('weight.budget.under_50.emotional', 0, 'Under $50: emotional modifier'),
('weight.budget.under_50.bold', -20, 'Under $50: bold modifier'),

-- Budget Modifiers - $50-$100
('weight.budget.50_100.safe', 0, '$50-$100: safe modifier'),
('weight.budget.50_100.emotional', 0, '$50-$100: emotional modifier'),
('weight.budget.50_100.bold', 0, '$50-$100: bold modifier'),

-- Budget Modifiers - $100-$250
('weight.budget.100_250.safe', 0, '$100-$250: safe modifier'),
('weight.budget.100_250.emotional', 0, '$100-$250: emotional modifier'),
('weight.budget.100_250.bold', 0, '$100-$250: bold modifier'),

-- Budget Modifiers - $250+
('weight.budget.250_plus.safe', 0, '$250+: safe modifier'),
('weight.budget.250_plus.emotional', 5, '$250+: emotional modifier'),
('weight.budget.250_plus.bold', 10, '$250+: bold modifier'),

-- Occasion Modifiers - Birthday
('weight.occasion.birthday.safe', 0, 'Birthday: safe modifier'),
('weight.occasion.birthday.emotional', 10, 'Birthday: emotional modifier'),
('weight.occasion.birthday.bold', 0, 'Birthday: bold modifier'),

-- Occasion Modifiers - Anniversary
('weight.occasion.anniversary.safe', 0, 'Anniversary: safe modifier'),
('weight.occasion.anniversary.emotional', 10, 'Anniversary: emotional modifier'),
('weight.occasion.anniversary.bold', 0, 'Anniversary: bold modifier'),

-- Occasion Modifiers - Valentine's
('weight.occasion.valentines.safe', 0, 'Valentines: safe modifier'),
('weight.occasion.valentines.emotional', 15, 'Valentines: emotional modifier'),
('weight.occasion.valentines.bold', 10, 'Valentines: bold modifier'),

-- Occasion Modifiers - Wedding
('weight.occasion.wedding.safe', 5, 'Wedding: safe modifier'),
('weight.occasion.wedding.emotional', 10, 'Wedding: emotional modifier'),
('weight.occasion.wedding.bold', 0, 'Wedding: bold modifier'),

-- Occasion Modifiers - Christmas
('weight.occasion.christmas.safe', 10, 'Christmas: safe modifier'),
('weight.occasion.christmas.emotional', 0, 'Christmas: emotional modifier'),
('weight.occasion.christmas.bold', 0, 'Christmas: bold modifier'),

-- Occasion Modifiers - Graduation
('weight.occasion.graduation.safe', 5, 'Graduation: safe modifier'),
('weight.occasion.graduation.emotional', 5, 'Graduation: emotional modifier'),
('weight.occasion.graduation.bold', 0, 'Graduation: bold modifier'),

-- Occasion Modifiers - Other
('weight.occasion.other.safe', 0, 'Other: safe modifier'),
('weight.occasion.other.emotional', 0, 'Other: emotional modifier'),
('weight.occasion.other.bold', 0, 'Other: bold modifier')

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

----------------------------------------------------
-- DECISION EXPLANATIONS
----------------------------------------------------
INSERT INTO decision_explanations (direction, language, title, body, emotional_signal, risk_note) VALUES
('safe', 'en', 'The Safe Choice', 
 'This gift is universally appreciated and unlikely to miss the mark. It shows thoughtfulness while staying within comfortable boundaries.',
 'You care about them and want to make them happy without overstepping.',
 'Minimal risk of disappointment, but may feel less personal.'),

('emotional', 'en', 'The Emotional Choice',
 'This gift creates a deeper connection and shows you truly understand the recipient. It carries more meaning and personal significance.',
 'You see them, you know them, and this gift proves it.',
 'Requires knowing the person well. May not land if relationship understanding is off.'),

('bold', 'en', 'The Bold Choice',
 'This gift makes a statement and creates a memorable moment. It shows confidence in your relationship and willingness to take a chance.',
 'You are not afraid to surprise them and create an unforgettable moment.',
 'Higher risk, higher reward. Best for strong relationships with adventurous recipients.')

ON CONFLICT (direction, language) DO UPDATE SET 
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  emotional_signal = EXCLUDED.emotional_signal,
  risk_note = EXCLUDED.risk_note;

----------------------------------------------------
-- OBJECT PATTERNS (Gift Pattern Categories)
-- Extended with relationship_fit and things_to_consider for STEP 0.6.1
----------------------------------------------------
INSERT INTO object_patterns (pattern_key, direction, language, title, description, emotional_intent, relationship_fit, things_to_consider, icon) VALUES
-- Safe Patterns
('daily_accessory', 'safe', 'en', 'Daily Accessory', 
 'Something they''ll reach for every single day. Reliable, beautiful, and unmistakably thoughtful. This type of gift integrates seamlessly into their existing life without demanding change.',
 'Shows you pay attention to their daily life and value their comfort.',
 'Perfect for relationships where you know their routines well. Works especially for partners, close friends, and family members whose daily patterns you observe naturally.',
 ARRAY['Choose quality over flash - this will be used daily', 'Consider their existing accessories to avoid redundancy', 'Think about their personal style - subtle or statement?', 'Durability matters more than trends'],
 '⌚'),
('practical_luxury', 'safe', 'en', 'Practical Luxury', 
 'A premium version of something they already use. Elevates the ordinary into something special. You''re not changing their life - you''re making the life they have feel more valuable.',
 'Tells them they deserve the best version of what they already enjoy.',
 'Ideal when you understand their habits but want to show you believe they deserve better. Strong choice for parents, partners, or anyone who puts others first.',
 ARRAY['Identify what they use often but wouldn''t upgrade themselves', 'Premium means quality, not necessarily expensive', 'Avoid anything that implies criticism of their current choices', 'Consider the learning curve - familiarity matters'],
 '✨'),
('ritual_object', 'safe', 'en', 'Ritual Object', 
 'Something that becomes part of their daily routine. Coffee, tea, morning light, evening calm. You''re giving them a moment of peace they''ll associate with your thoughtfulness.',
 'Creates a moment of daily joy and a small ritual of comfort.',
 'Works beautifully for people who value their quiet moments. Strong choice for parents, partners, or friends who need more calm in their lives.',
 ARRAY['Think about their existing routines - morning person or evening?', 'Choose something that enhances rather than adds complexity', 'Consider the sensory experience - how it feels, smells, sounds', 'Simplicity often lands better than elaborate ritual objects'],
 '☕'),

-- Emotional Patterns
('shared_experience', 'emotional', 'en', 'Shared Experience', 
 'Not a thing, but a moment together. Something that becomes a memory you''ll both carry. You''re investing in your relationship itself, not in an object.',
 'Says ''I want more moments with you'' and values connection over possession.',
 'Best for relationships where presence matters more than presents. Strong choice for partners, close friends, or family members you don''t see enough.',
 ARRAY['Choose something neither of you has done before', 'Consider their comfort zone - challenge gently, don''t overwhelm', 'Plan around their schedule, not just yours', 'Leave room for spontaneity within the experience'],
 '🎭'),
('symbolic_object', 'emotional', 'en', 'Symbolic Object', 
 'Something that represents your connection. An inside joke, a shared story, a meaningful reference. Only you two understand its full significance.',
 'Shows the depth of your understanding and the uniqueness of your bond.',
 'Perfect for relationships with shared history and private meaning. Strong choice for partners, long-time friends, or anyone who values sentiment over spectacle.',
 ARRAY['The symbol should reference something positive you''ve shared', 'Subtlety is powerful - others don''t need to understand', 'Consider how they''ll display or use it', 'Avoid references that might be painful or complicated'],
 '💫'),
('personal_artifact', 'emotional', 'en', 'Personal Artifact', 
 'A piece of their identity. Something that says ''I see who you really are.'' This gift validates something important about them that others might overlook.',
 'Validates who they are becoming and honors their authentic self.',
 'Works for people in transition or growth. Strong choice for anyone pursuing something meaningful - a hobby, career change, or personal development.',
 ARRAY['Focus on who they''re becoming, not who they were', 'Avoid assumptions - listen to what they actually say they want', 'Consider whether this aligns with their own self-image', 'The gift should empower, not define them'],
 '🎨'),

-- Bold Patterns
('bespoke_creation', 'bold', 'en', 'Bespoke Creation', 
 'Something made specifically for them. One of a kind, impossible to replicate, entirely theirs. This is not a product - it''s a declaration that they are singular.',
 'Declares they are irreplaceable and worth the effort of custom creation.',
 'Best for people who value uniqueness and effort over convenience. Strong choice for partners, close family, or anyone who feels undervalued by mass-market gifts.',
 ARRAY['Research artisans and makers carefully', 'Allow plenty of time - bespoke takes longer', 'Provide clear input without micromanaging', 'Consider how they''ll feel about the visibility of such a gift'],
 '💎'),
('statement_piece', 'bold', 'en', 'Statement Piece', 
 'Something that makes people ask ''Where did you get that?'' A gift that starts conversations and elevates how they present themselves to the world.',
 'Elevates how they see themselves and how others see them.',
 'Works for confident people who enjoy being noticed. Strong choice for partners, friends, or family members who embrace bold self-expression.',
 ARRAY['Know their comfort level with attention', 'Consider where and how they''ll use it', 'Bold doesn''t mean flashy - it can mean singular', 'Make sure it aligns with their personal brand'],
 '🌟'),
('transformative_experience', 'bold', 'en', 'Transformative Experience', 
 'Something that changes them. A skill, a journey, a perspective they didn''t have before. You''re investing in who they might become, not who they are today.',
 'Invests in who they''re becoming and believes in their potential.',
 'Perfect for people open to growth and new challenges. Strong choice for partners, close friends, or anyone who has expressed a desire to learn or change.',
 ARRAY['Listen for what they''ve said they want to try', 'Don''t project your own growth wishes onto them', 'Consider the time and energy commitment required', 'Frame it as an opportunity, not an assignment'],
 '🚀')

ON CONFLICT (pattern_key, direction, language) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  emotional_intent = EXCLUDED.emotional_intent,
  relationship_fit = EXCLUDED.relationship_fit,
  things_to_consider = EXCLUDED.things_to_consider,
  icon = EXCLUDED.icon;

----------------------------------------------------
-- NON-REPETITION RULES (STEP 0.8)
-- Cooldown periods to prevent pattern repetition
----------------------------------------------------
INSERT INTO non_repetition_rules (pattern_id, cooldown_days, applies_to_confidence_type) VALUES
('curated_classic', 120, NULL),
('thoughtful_consumable', 60, NULL),
('practical_upgrade', 90, NULL),
('shared_experience', 180, NULL),
('symbolic_object', 365, NULL),
('personal_artifact', 180, NULL),
('bespoke_creation', 365, NULL),
('statement_piece', 180, NULL),
('transformative_experience', 365, NULL)

ON CONFLICT (pattern_id, applies_to_confidence_type) DO UPDATE SET
  cooldown_days = EXCLUDED.cooldown_days;

----------------------------------------------------
-- SCREEN 1 OPTION TABLES (STEP SCREEN1)
-- Dynamic options loaded by the UI
----------------------------------------------------

-- Relationship Types
INSERT INTO q_relationship_types (code, label, description, sort_order) VALUES
('partner', 'Partner', 'Romantic partner, spouse, significant other', 1),
('parent', 'Parent', 'Mother, father, step-parent', 2),
('child', 'Child', 'Son, daughter, step-child', 3),
('sibling', 'Sibling', 'Brother, sister', 4),
('grandparent', 'Grandparent', 'Grandmother, grandfather', 5),
('friend', 'Friend', 'Close friend', 6),
('best_friend', 'Best Friend', 'Very close, long-term friend', 7),
('colleague', 'Colleague', 'Work colleague, professional contact', 8),
('boss', 'Boss', 'Manager, supervisor', 9),
('acquaintance', 'Acquaintance', 'Someone you know casually', 10),
('neighbor', 'Neighbor', 'Someone living nearby', 11),
('in_law', 'In-Law', 'Mother-in-law, father-in-law, etc.', 12),
('other', 'Other', 'Any other relationship', 99)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Closeness Levels
INSERT INTO q_closeness_levels (code, label, emotional_expectation) VALUES
('distant', 'Distant', 1),
('casual', 'Casual', 2),
('friendly', 'Friendly', 3),
('close', 'Close', 4),
('very_close', 'Very Close', 5),
('intimate', 'Intimate', 6)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  emotional_expectation = EXCLUDED.emotional_expectation;

-- Occasion Types
INSERT INTO q_occasion_types (code, label, sort_order) VALUES
('birthday', 'Birthday', 1),
('christmas', 'Christmas', 2),
('valentines', 'Valentine''s Day', 3),
('anniversary', 'Anniversary', 4),
('wedding', 'Wedding', 5),
('engagement', 'Engagement', 6),
('graduation', 'Graduation', 7),
('baby_shower', 'Baby Shower', 8),
('housewarming', 'Housewarming', 9),
('mothers_day', 'Mother''s Day', 10),
('fathers_day', 'Father''s Day', 11),
('thank_you', 'Thank You', 12),
('get_well', 'Get Well', 13),
('retirement', 'Retirement', 14),
('promotion', 'Promotion', 15),
('just_because', 'Just Because', 16),
('apology', 'Apology', 17),
('other', 'Other', 99)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- Occasion Importance Levels
INSERT INTO q_occasion_importance_levels (code, label, importance_level) VALUES
('low', 'Low Priority', 1),
('medium', 'Medium', 2),
('important', 'Important', 3),
('very_important', 'Very Important', 4),
('critical', 'Critical', 5)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  importance_level = EXCLUDED.importance_level;

----------------------------------------------------
-- SCREEN 4 OPTIONS
----------------------------------------------------

-- Gift Type Preferences
INSERT INTO q_gift_type_preferences (code, label) VALUES
('practical', 'Practical'),
('emotional', 'Emotional'),
('mixed', 'Mixed'),
('surprise', 'Surprise'),
('experience', 'Experience')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label;

-- Time Constraints
INSERT INTO q_time_constraints (code, label) VALUES
('relaxed', '> 2 Weeks'),
('normal', '1-2 Weeks'),
('urgent', '< 3 Days')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label;
