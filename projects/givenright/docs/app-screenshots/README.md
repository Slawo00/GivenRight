# GivenRight App Screenshots - UI/UX Flow

**Captured:** 2026-02-08  
**Source:** Live App from Replit/ExpoGo

## User Flow Documentation

### 01. Splash Screen
- **File:** `01-splash-screen.jpg`
- **Content:** GivenRight logo, tagline "Find the perfect gift", CTA "Start Decision"
- **Purpose:** App entry point, clear value proposition

### 02. Relationship Selection
- **File:** `02-relationship-selection.jpg`  
- **Content:** "Who is this gift for?" with relationship categories
- **Options:** Romantic Partner, Spouse (selected), Sibling, Parent, Child, Close Friend, Friend, Colleague, Manager, Acquaintance, Client/Customer, Business Partner, Key Account/Strategic Client
- **Additional:** "How close are you?" - Very Close, Close, Neutral, Distant

### 03. Intimacy & Occasion
- **File:** `03-intimacy-occasion.jpg`
- **Content:** Occasion selection + importance rating
- **Occasions:** Birthday (selected), Anniversary, Christmas, Farewell, Spontaneous, Corporate, Thank You
- **Importance:** Important (selected), Optional, Very Important
- **CTA:** Continue button

### 04. Personality Profiling  
- **File:** `04-personality-profiling.jpg`
- **Content:** "Tell us a bit about them" - personality traits selection
- **Traits:** Practical, Emotional (selected), Creative, Minimalistic, Luxurious (selected), Humorous, Adventurous, Reserved
- **Surprise Tolerance:** Loves (selected), Likes, Prefers

### 05. Values, No-Gos & Budget
- **File:** `05-values-nogos-budget.jpg`
- **Content:** Values + restrictions + budget selection
- **Values:** Sustainable, Fair Trade, Regional, Vegan, Handmade, Luxury Brands (selected)
- **No-Gos:** No Alcohol (selected), No Animal, No Fast Fashion, No Tech, No Personal Gifts
- **Budget:** <20€, 20-50€, 50-100€, 100-250€ (selected), >250€

### 06. Decision Results
- **File:** `06-decision-results.jpg`
- **Content:** "Your Options" with decision engine results
- **Safe Choice:** "RECOMMENDED" - "A reliable choice that respects boundaries"
- **Emotional Choice:** "A choice that creates meaningful connection"
- **Features:** Reasoning ("Why this works"), Emotional signals, Risk assessment
- **CTA:** "Continue with ... Choice"

### 07. Gift Type & Timing
- **File:** `07-gift-type-timing.jpg`
- **Content:** Final refinement questions
- **Gift Types:** Practical (selected), Emotional, Experience, Mixed, Surprise
- **Timing:** <3 Days, 1-2 Weeks (selected)

## Technical Integration Points

### Data Flow:
1. **Input Collection:** Screens 2-7 collect user preferences
2. **Personality Fit Score:** Screen 4 feeds into `calculate_personality_fit_score()` function
3. **Decision Engine:** All inputs processed by confidence scoring system
4. **AI Generation:** Final data + confidence scores → gift recommendations

### Database Schema Mapping:
- **relationship_type** ← Screen 2 selection
- **occasion** ← Screen 3 selection  
- **personality_traits** ← Screen 4 multi-select array
- **budget_range** ← Screen 5 selection
- **gift_type_preference** ← Screen 7 selection
- **time_constraint** ← Screen 7 timing selection

### Missing Connections:
- [ ] Form data → Supabase integration
- [ ] Confidence scoring integration  
- [ ] AI prompt generation from results
- [ ] Final gift recommendations display

**Next Steps:** Implement data persistence and scoring pipeline integration.