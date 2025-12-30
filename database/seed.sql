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
-- These match the mockDecisionEngine scoring rules
----------------------------------------------------
INSERT INTO decision_parameters (key, value, description) VALUES
-- Base Scores
('base.safe', 50, 'Base score for safe direction'),
('base.emotional', 50, 'Base score for emotional direction'),
('base.bold', 50, 'Base score for bold direction'),

-- Relationship Modifiers
('weight.relationship.partner.emotional', 15, 'Partner boosts emotional'),
('weight.relationship.partner.bold', 15, 'Partner boosts bold'),
('weight.relationship.colleague.safe', 20, 'Colleague boosts safe'),
('weight.relationship.colleague.bold', -10, 'Colleague reduces bold'),
('weight.relationship.friend.emotional', 10, 'Friend boosts emotional'),

-- Closeness Modifiers
('weight.closeness.high.emotional', 10, 'High closeness (4-5) boosts emotional'),
('weight.closeness.high.bold', 20, 'High closeness (4-5) boosts bold'),
('weight.closeness.low.safe', 15, 'Low closeness (1-2) boosts safe'),
('weight.closeness.low.bold', -10, 'Low closeness (1-2) reduces bold'),

-- Surprise Tolerance
('weight.surprise.low.safe', 15, 'Low surprise tolerance boosts safe'),
('weight.surprise.high.bold', 15, 'High surprise tolerance boosts bold'),

-- Budget Modifiers
('weight.budget.under_50.safe', 10, 'Low budget boosts safe'),
('weight.budget.250_plus.bold', 10, 'High budget boosts bold'),
('weight.budget.250_plus.emotional', 5, 'High budget boosts emotional'),

-- Occasion Modifiers
('weight.occasion.birthday.emotional', 10, 'Birthday boosts emotional'),
('weight.occasion.valentines.emotional', 15, 'Valentines boosts emotional'),
('weight.occasion.valentines.bold', 10, 'Valentines boosts bold'),
('weight.occasion.wedding.safe', 10, 'Wedding boosts safe'),
('weight.occasion.wedding.emotional', 5, 'Wedding boosts emotional'),
('weight.occasion.christmas.safe', 5, 'Christmas boosts safe')

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
