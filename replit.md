# GivenRight - Expo Cross-Platform App

## Overview
GivenRight is a cross-platform mobile application built with Expo (React Native).
The app helps users make gift decisions based on relationships, occasions, and preferences.

**Target Platforms:** iOS, Android, Web
**Framework:** Expo SDK 54 with React Native
**Navigation:** Expo Router

## Project Structure

```
/app                    # Expo Router pages
  _layout.tsx          # Root layout
  index.tsx            # Home screen
  +not-found.tsx       # 404 page

/components            # Reusable UI components
  DebugPanel.tsx       # Debug overlay (dev mode)

/store                 # Global state management
  useAppState.ts       # App-level state (appReady, debugMode)
  useDecisionState.ts  # Decision flow state machine + runTestScenario
  useConfigState.ts    # Supabase config loading state

/engine                # Decision logic
  mockDecisionEngine.ts  # Deterministic mock engine for testing

/config                # Configuration
  env.ts               # Environment variables
  supabase.ts          # Supabase client configuration

/database              # Database schemas
  schema.sql           # Table definitions with RLS policies
  seed.sql             # Initial data (ui_texts, decision_parameters)

/services/supabase     # Supabase data access layer
  index.ts             # Barrel export
  uiTextService.ts     # UI text fetching with caching
  decisionParameterService.ts  # Decision parameters from DB
  decisionExplanationService.ts # Explanations from DB
  objectPatternService.ts      # Gift patterns from DB

/types                 # TypeScript type definitions
  common.ts            # Shared types (ID, BudgetRange, LoadingState)
  relationship.ts      # Relationship types (RelationshipProfile)
  decision.ts          # Decision types (DecisionDirection, DecisionResult, etc.)

/assets                # Static assets
  /images
    givenright-logo.png  # App logo
```

## Commands

- **Start App (Tunnel):** `npx expo start --tunnel`
- **Start App (Web):** `npx expo start --web`
- **Start App (iOS):** `npx expo start --ios`
- **Start App (Android):** `npx expo start --android`

## Development

### Global State (Zustand)

**App State (useAppState.ts):**
- `appReady`: Boolean indicating app initialization state
- `debugMode`: Boolean to show/hide debug panel (default: true)

**Decision State (useDecisionState.ts):**
- Inputs: `relationship`, `occasion`, `budget`
- Outputs: `decisionResult`, `selectedDirection`
- Flow control: `step` (idle → collecting_inputs → decision_ready → direction_selected → completed)
- Actions: `setRelationship`, `setOccasion`, `setBudget`, `setDecisionResult`, `selectDirection`, `runTestScenario`, `runDecisionSimulation`, `resetDecision`

### Mock Decision Engine (STEP 0.3)

**Scoring Rules (engine/mockDecisionEngine.ts):**
- **Base scores**: safe=50, emotional=50, bold=50
- **Relationship modifiers**: partner (+15 emotional/bold), colleague (+20 safe, -10 bold), friend (+10 emotional)
- **Closeness**: High (4-5) boosts emotional/bold by 10-20; Low (1-2) boosts safe by 10-15
- **Surprise tolerance**: low (+15 safe), high (+15 bold)
- **Budget**: under_50 (+10 safe), 250_plus (+10 bold, +5 emotional)
- **Occasion**: birthday (+10 emotional), valentines (+15 emotional, +10 bold), wedding (+10 safe, +5 emotional), christmas (+5 safe)
- **Risk**: bold=high, emotional=medium, safe=low

### Canonical Types

**Decision Types:**
- `DecisionDirection`: "safe" | "emotional" | "bold"
- `RiskLevel`: "low" | "medium" | "high"
- `DecisionScore`: direction, score (0-100), risk, recommended
- `DecisionExplanation`: whyThisWorks, risks, emotionalSignal
- `DecisionResult`: scores[], explanationByDirection

**Relationship Types:**
- `RelationshipType`: partner, parent, child, friend, colleague, other
- `RelationshipProfile`: type, closeness (1-5), emotionalStyle[], surpriseTolerance

**Common Types:**
- `BudgetRange`: under_50, 50_100, 100_250, 250_plus

### Debug Panel
When `debugMode` is true, a collapsible debug panel appears showing:
- Current decision step
- Relationship type and closeness
- Budget selection
- Decision scores (safe/emotional/bold)
- Selected direction

### Supabase Configuration (STEP 0.4.A)

**Database Tables:**
- `ui_texts`: Multi-language UI texts (key, language, value)
- `decision_parameters`: Scoring parameters for decision engine
- `decision_explanations`: Explanations per direction (safe/emotional/bold)
- `object_patterns`: Gift pattern categories

**Environment Variables Required:**
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

**RLS Policies:** Read-only for anon + authenticated users

## Current Phase
**STEP B4.1 - Weltklasse Contextual Enrichment ✅**
- ChatGPT-powered explanation personalization via gpt-4o-mini
- READ-ONLY layer - preserves all engine data exactly (ordering, risk_level, expectation_frame)
- NO synthetic scores or fabricated metrics - pure enrichment only
- 3-5 concrete example categories per option with icons/hints
- First option from engine marked as "Recommended" (green badge)
- In-memory caching (context+result hash key)
- Graceful fallback if API fails - shows base explanations without examples
- **Weltklasse Prompts**: Context summary format (Partner · Birthday · Very close · Creative...)
- **Neutral & Human Tone**: calm, grounded, non-promotional language

### Supabase Edge Function (Backend)
- **Path**: `supabase/functions/enrich-explanation/index.ts`
- **Purpose**: Secure server-side OpenAI calls (API key not exposed to client)
- **Deployment**: See `supabase/README.md` for instructions
- **Required Secret**: `OPENAI_API_KEY` (set via `supabase secrets set`)

## User Preferences
- German language for communication
- Strict Expo Managed Workflow only
- No native code (Swift/Kotlin)
- Single codebase for iOS/Android/Web

## Recent Changes
- 2024-12-30: STEP 0.1 - Initial clean build setup
- 2024-12-30: STEP 0.1 - Added GivenRight logo
- 2024-12-30: STEP 0.1 - Created folder structure
- 2024-12-30: STEP 0.1 - Implemented app state with Zustand
- 2024-12-30: STEP 0.2 - Canonical decision types
- 2024-12-30: STEP 0.2 - Decision state machine
- 2024-12-30: STEP 0.2 - Enhanced DebugPanel
- 2024-12-30: STEP 0.3 - Mock decision engine created
- 2024-12-30: STEP 0.3 - runTestScenario action (deterministic)
- 2024-12-30: STEP 0.3 - DebugPanel with test scenarios & score visualization
- 2024-12-30: STEP 0.4.A - Supabase client configuration
- 2024-12-30: STEP 0.4.A - SQL schema (ui_texts, decision_parameters, etc.)
- 2024-12-30: STEP 0.4.A - Seed data for initial configuration
- 2024-12-30: STEP 0.4.B - Supabase data access layer (services)
- 2024-12-30: STEP 0.4.B - Config-driven decision engine
- 2024-12-30: STEP 0.4.B - useConfigState for config loading
- 2024-12-30: STEP 0.4.B - Debug Panel with Supabase status badge
- 2024-12-30: STEP 0.4.B - Fully config-driven engine (no hardcoded values)
- 2024-12-30: STEP 0.4.B - Expanded DecisionParameters for all types
- 2024-12-30: STEP 0.4.B - Updated seed.sql with complete parameter set
- 2024-12-30: STEP 0.5 - DecisionExplanationScreen created
- 2024-12-30: STEP 0.5 - DirectionCard component (Why/Signal/Risk)
- 2024-12-30: STEP 0.5 - emotional_signal field added to schema/seed
- 2024-12-30: STEP 0.5 - Config loading moved to app root layout
- 2024-12-30: STEP 0.5 - User-facing "Start Decision" button
- 2024-12-30: STEP 0.6 - ObjectPatternSelectionScreen created
- 2024-12-30: STEP 0.6 - PatternCard component (icon, intent, description)
- 2024-12-30: STEP 0.6 - objectPatternService extended with emotionalIntent, icon
- 2024-12-30: STEP 0.6 - Database schema with emotional_intent, icon fields
- 2024-12-30: STEP 0.6 - seed.sql with 9 rich patterns
- 2024-12-30: STEP 0.6 - selectedPattern state and selectPattern action
- 2024-12-30: STEP 0.6.1 - PatternExplanationScreen (Confidence Lock)
- 2024-12-30: STEP 0.6.1 - Extended schema: relationship_fit, things_to_consider
- 2024-12-30: STEP 0.6.1 - Rich educational seed data for all 9 patterns
- 2024-12-30: STEP 0.6.1 - pattern_explanation step in decision flow
- 2024-12-30: STEP 0.7 - Product type definitions (types/product.ts)
- 2024-12-30: STEP 0.7 - ProductResolverService with mock data
- 2024-12-30: STEP 0.7 - ProductCard component (neutral presentation)
- 2024-12-30: STEP 0.7 - CommercePreviewScreen with trust disclosure
- 2024-12-30: STEP 0.7 - commerce_preview and completed_with_execution steps
- 2024-12-30: STEP 0.8 - Gift Memory schema (gift_memory, historical_success, non_repetition_rules)
- 2024-12-30: STEP 0.8 - GiftMemoryService with local+Supabase sync
- 2024-12-30: STEP 0.8 - useGiftMemoryState Zustand store
- 2024-12-30: STEP 0.8 - Pattern suppression in ObjectPatternSelectionScreen
- 2024-12-30: STEP 0.8 - Memory recording on decision completion
- 2024-12-30: STEP 0.8 - PatternCard dimmed prop for cooldown patterns
- 2024-12-30: STEP B2 - Deterministic Decision Core with 8 phases
- 2024-12-30: STEP B2 - Types (DecisionContext, PhaseOutputs, DecisionResult)
- 2024-12-30: STEP B2 - Phase functions (uncertainty, socialExpectation, riskProfiling, personalityFit, patternFiltering, scoring, confidenceDerivation)
- 2024-12-30: STEP B2 - ExplanationBuilder (rule-based, no generation)
- 2024-12-30: STEP B2 - Decision Engine Orchestrator
- 2024-12-30: STEP B0 - Structured Input & Intent Lock
- 2024-12-30: STEP B0 - useInputCollectionState Zustand store
- 2024-12-30: STEP B0 - 4 Input Screens (Relationship, Person, Boundaries, Practical)
- 2024-12-30: STEP B0 - InputCollectionFlow component
- 2024-12-30: STEP B0 - Integration with Decision Engine
- 2024-12-30: STEP B4 - OpenAI Integration via Replit AI Integrations
- 2024-12-30: STEP B4 - ScenarioEnrichmentService with ChatGPT
- 2024-12-30: STEP B4 - Enrichment types (ConcreteExampleCategory)
- 2024-12-30: STEP B4 - useEnrichmentState Zustand store
- 2024-12-30: STEP B4 - EnrichedDirectionCard with example categories
- 2024-12-30: STEP B4 - EnrichedDecisionScreen integration
- 2024-12-30: STEP B4 FIX - Removed synthetic scores, preserved engine ordering
- 2024-12-30: STEP B4 FIX - EnrichedDecisionResult now READ-ONLY (decision_risk_level, expectation_frame)
- 2024-12-30: STEP B4 FIX - First option marked "Recommended" via badge, not computed score
- 2024-12-30: STEP B4.1 - Weltklasse Prompts (Context · Occasion · Closeness · Personality summary)
- 2024-12-30: STEP B4.1 - Refined System Prompt (neutral, non-directive, non-promotional)
- 2024-12-30: STEP B4.1 - Supabase Edge Function for secure OpenAI calls
- 2024-12-30: STEP B4.1 - Frontend updated to call Edge Function via fetch
- 2024-12-30: STEP B4.1 - Edge Function deployed with --no-verify-jwt for anon access
- 2024-12-30: STEP B4.1 - LIVE: Personalized examples showing in UI (Stylish Accessories, Cooking Class, etc.)
