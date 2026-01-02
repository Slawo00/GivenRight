# GivenRight - Expo Cross-Platform App

## Overview
GivenRight is a cross-platform mobile application built with Expo (React Native) that assists users in making informed gift decisions. It achieves this by considering relationship dynamics, specific occasions, and personal preferences of the recipient. The app aims to provide personalized gift direction recommendations, enhanced with contextual enrichment, across iOS, Android, and Web platforms.

## User Preferences
- German language for communication
- Strict Expo Managed Workflow only
- No native code (Swift/Kotlin)
- Single codebase for iOS/Android/Web

## System Architecture
The application is built using Expo SDK 54 with React Native and Expo Router for navigation. Global state management is handled by Zustand, separating app-level state from decision-specific state. The core decision logic is driven by a deterministic engine that processes user inputs and configuration parameters from a Supabase backend to generate gift directions.

**UI/UX Decisions:**
- A collapsible Debug Panel is available in development mode to monitor application state and decision flow.
- Direction cards provide explanations, risks, and emotional signals for each gift direction.
- Contextual enrichment is provided by external AI, offering personalized examples without altering core engine data. The first recommended option is clearly badged.

**Technical Implementations:**
- **State Management:** Zustand is used for `useAppState` (app readiness, debug mode), `useDecisionState` (decision flow, inputs, results), `useConfigState` (Supabase configuration loading), `useInputCollectionState` (input screens), and `useEnrichmentState` (AI enrichment data).
- **Decision Engine:** A deterministic core with 8 phases (uncertainty, social expectation, risk profiling, personality fit, pattern filtering, scoring, confidence derivation) calculates `DecisionScore`s and `DecisionExplanation`s. It is fully configurable via Supabase.
- **Data Handling:** All input options for decision screens (relationship types, closeness, occasions, personality traits, budget ranges, etc.) are fetched dynamically from Supabase, with in-memory caching and hardcoded fallbacks. UI displays labels but stores codes for consistency.
- **AI Integration:** ChatGPT (gpt-4o-mini) is used for contextual enrichment to provide personalized examples for gift suggestions. This is a read-only layer that does not influence the core decision engine's output (scores, ordering).
- **Security:** OpenAI API calls are routed through a Supabase Edge Function to securely manage API keys and prevent client-side exposure.

**Feature Specifications:**
- **Gift Decision Flow:** Guides users through multiple input screens (Relationship, Person, Boundaries, Practical) to collect data.
- **Personalized Recommendations:** Generates "safe," "emotional," or "bold" gift directions based on user-provided context.
- **Contextual Enrichment:** AI-generated concrete examples and descriptions for each recommended gift direction, leveraging a refined "Weltklasse Prompt" structure.
- **Debug Panel:** Provides real-time insights into the decision-making process for development.
- **Input Forms:** Screens dynamically load options from Supabase and use string-based codes for selections.

## External Dependencies
- **Supabase:**
    - **Database:** PostgreSQL for storing UI texts (`ui_texts`), decision parameters (`decision_parameters`), explanations (`decision_explanations`), object patterns (`object_patterns`), and all dynamic options for input screens (`q_relationship_types`, `q_closeness_levels`, `q_occasion_types`, `q_occasion_importance_levels`, `q_personality_traits`, `q_surprise_tolerance_levels`, `q_value_constraints`, `q_budget_ranges`, `q_gift_type_preferences`, `q_time_constraints`).
    - **Edge Functions:** Used for secure server-side calls to OpenAI API (`enrich-explanation`).
    - **Authentication/Authorization:** RLS policies are set for read-only access for anonymous and authenticated users.
- **OpenAI:** ChatGPT (specifically `gpt-4o-mini`) API for contextual enrichment and generating personalized gift examples.
- **Zustand:** State management library for React.
- **Expo:** Cross-platform development framework for React Native.
- **Expo Router:** File-system based router for Expo applications.