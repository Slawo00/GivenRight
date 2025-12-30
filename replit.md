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
  useDecisionState.ts  # Decision flow state machine

/config                # Configuration
  env.ts               # Environment variables

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
- Actions: `setRelationship`, `setOccasion`, `setBudget`, `setDecisionResult`, `selectDirection`, `resetDecision`

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

## Current Phase
**PHASE 0 - STEP 0.2 (Canonical Types & Decision State) ✅**
- Canonical decision types defined
- Relationship profile types
- Budget range types
- Decision state machine (Zustand)
- Debug panel with decision state visibility

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
