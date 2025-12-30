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
**PHASE 0 - STEP 0.6.1 (Pattern Explanation - Confidence Lock) ✅**
- PatternExplanationScreen as a CONFIDENCE LOCK before commerce
- Shows: Why This Works, Why This Fits Your Relationship, Emotional Signal, Things to Consider
- Calm, reflective, non-commercial design
- CTA: "Show concrete examples" → leads to STEP 0.7 (Commerce)
- Database schema extended with relationship_fit and things_to_consider fields
- seed.sql with rich educational content per pattern
- Decision flow: pattern_explanation step added between object_class_selection and completed
- Full flow: Home → Start Decision → See Explanations → Select Direction → Object Patterns → Pattern Explanation → Ready for Commerce

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
