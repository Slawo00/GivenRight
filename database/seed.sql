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
INSERT INTO decision_explanations (direction, language, title, body, risk_note) VALUES
('safe', 'en', 'The Safe Choice', 
 'This gift is universally appreciated and unlikely to miss the mark. It shows thoughtfulness while staying within comfortable boundaries.',
 'Minimal risk of disappointment, but may feel less personal.'),

('emotional', 'en', 'The Emotional Choice',
 'This gift creates a deeper connection and shows you truly understand the recipient. It carries more meaning and personal significance.',
 'Requires knowing the person well. May not land if relationship understanding is off.'),

('bold', 'en', 'The Bold Choice',
 'This gift makes a statement and creates a memorable moment. It shows confidence in your relationship and willingness to take a chance.',
 'Higher risk, higher reward. Best for strong relationships with adventurous recipients.')

ON CONFLICT (direction, language) DO UPDATE SET 
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  risk_note = EXCLUDED.risk_note;

----------------------------------------------------
-- OBJECT PATTERNS (Gift Pattern Categories)
----------------------------------------------------
INSERT INTO object_patterns (pattern_key, direction, language, title, description) VALUES
-- Safe Patterns
('classic_gift', 'safe', 'en', 'Classic Gift', 'Traditional, universally appreciated items like flowers, chocolates, or wine.'),
('practical_item', 'safe', 'en', 'Practical Item', 'Useful everyday items they will definitely use.'),
('gift_card', 'safe', 'en', 'Gift Card', 'Let them choose exactly what they want.'),

-- Emotional Patterns
('memory_gift', 'emotional', 'en', 'Memory Gift', 'Something that captures a shared memory or inside joke.'),
('handmade', 'emotional', 'en', 'Handmade Gift', 'A personally crafted item showing time and effort.'),
('shared_experience', 'emotional', 'en', 'Shared Experience', 'An experience you can enjoy together.'),

-- Bold Patterns
('surprise_experience', 'bold', 'en', 'Surprise Experience', 'An unexpected adventure or unique experience.'),
('statement_piece', 'bold', 'en', 'Statement Piece', 'A memorable, conversation-starting gift.'),
('upgrade', 'bold', 'en', 'Luxury Upgrade', 'A premium version of something they love.')

ON CONFLICT (pattern_key, direction, language) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description;
