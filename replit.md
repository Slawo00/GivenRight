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
  useAppState.ts       # Zustand store

/config                # Configuration
  env.ts               # Environment variables

/types                 # TypeScript type definitions
  common.ts            # Shared types
  relationship.ts      # Relationship types
  decision.ts          # Decision flow types

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
The app uses Zustand for global state management:
- `appReady`: Boolean indicating app initialization state
- `debugMode`: Boolean to show/hide debug panel (default: true)

### Debug Panel
When `debugMode` is true, a collapsible debug panel appears showing:
- Current app state
- Platform information

## Current Phase
**PHASE 0 - STEP 0.1 (Foundation)**
- Clean Expo project setup
- TypeScript configuration
- Expo Router navigation
- Global state with Zustand
- Debug infrastructure
- Type definitions

## User Preferences
- German language for communication
- Strict Expo Managed Workflow only
- No native code (Swift/Kotlin)
- Single codebase for iOS/Android/Web

## Recent Changes
- 2024-12-30: Initial clean build setup
- 2024-12-30: Added GivenRight logo
- 2024-12-30: Created folder structure (/store, /config, /types)
- 2024-12-30: Implemented Zustand global state
- 2024-12-30: Created DebugPanel component
- 2024-12-30: Added type definitions
