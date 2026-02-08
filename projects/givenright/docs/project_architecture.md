# GivenRight Project Architecture

## Overview
GivenRight is a decision support system for gift recommendations, utilizing a sophisticated scoring mechanism to evaluate gift suitability.

## Core Components
1. Confidence Score Calculation
2. Risk Penalty Assessment
3. Contextual Gift Evaluation
4. Prompt Engineering
5. Decision Table Mapping
6. Personality Fit Scoring

## Personality Fit Scoring Model

### Gift Type Classification
- Geschenktypen:
  1. Intern
  2. Praktisch
  3. Emotional (Objekt)
  4. Erlebnis
  5. Überraschung

### Personality-Gift Matching Matrix

#### Scoring Dimensionen
1. Funktionalitäts-Präferenz
2. Emotionale Orientierung
3. Neuigkeits-Toleranz
4. Erfahrungsbias
5. Ästhetische Sensitivität

#### Bewertungskriterien pro Geschenktyp

##### Practical (Praktisches Geschenk)
- Funktionalitäts-Präferenz: +10
- Emotionale Orientierung: -5 bis +5
- Novelty-Toleranz: niedrig

##### Emotional (Emotionales Objekt)
- Emotionale Orientierung: +10
- Funktionale Präferenz: -5
- Erfahrungsbias: moderat

##### Experience (Erlebnis)
- Novelty-Toleranz: hoch (+5 bis +10)
- Boldness: +5
- Time Constraint: Flexibel

##### Hybrid (Objekt + Erlebnis)
- Emotional-Balance
- Moderate Erfahrungsansprüche
- Mittlere Neuigkeitstoleranz

##### Surprise
- Hohe Novelty-Akzeptanz
- Risikobereitschaft
- Personalisierungsgrad entscheidend

### Scoring Mechanism
- Maximale Punktzahl pro Option: 20 Punkte
- Gewichtung nach Persönlichkeitskompatibilität
- Dynamische Anpassung basierend auf Kontextfaktoren

## Prompt Engineering
### Advanced Prompt Architecture
Umfassende Kontextanalyse mit mehrschichtiger Bewertungslogik

#### Prompt Komponenten
1. Relationship Context
- Beziehungstyp
- Emotionale Intensität
- Intimität
- Risikotoleranz

2. Closeness Dimension
- Emotionale Erwartungen
- Personalisierungsgrad

3. Occasion Evaluation
- Anlasstyp
- Wichtigkeitsstufe
- Öffentliche Sichtbarkeit
- Sozialer Druck

4. Recipient Personality
- Persönlichkeitsstile
- Überraschungstoleranz

5. Constraints & Values
- Wertekompatibilität
- No-Go Bereiche
- Budgetrahmen
- Zeitliche Einschränkungen

### Prompt Generierungsstrategie
- 3 Geschenkoptionen generieren
  1. SAFE CHOICE
  2. EMOTIONAL CHOICE
  3. BOLD CHOICE

#### Für jede Option:
- Konkretes Geschenk
- Emotionale Passung
- Zielgruppe
- Risikolevel

### Finale Bewertung
- Konfidenz-Bewertung (1-10)
- Hauptemotionales Risiko
- Kurze Handlungsempfehlung

## Decision Tables
### Beziehungstyp Mapping
- Partner: Höchste Sensitivität
- Familie: Traditionell, sicher
- Freunde: Flexibel, experimentierfreudig
- Kollegen: Professionell, zurückhaltend

### Kontextuelle Variablen
- Anlass-Bedeutung
- Zeitliche Flexibilität
- Öffentliche Sichtbarkeit
- Emotionale Tiefe

## Scoring Mechanism

### Base Relationship Score (0-30)
- Evaluates relationship type
- Includes: Partner, Family, Friends, Colleagues

### Personality Fit Score (0-20)
- Matches gift type with personality characteristics

### Historical Success Score (0-15)
- Tracks past gift reception patterns
- Positive/Negative historical trends

### Constraint Compliance Score (0-15)
- Checks adherence to contextual constraints
- Penalties for rule violations

### Risk Penalty (-30 to 0)
- Contextual risk factors
- Adjusts score based on:
  - Occasion importance
  - Public visibility
  - Time feasibility
  - Relationship sensitivity

## Calculation Formula
```
FINAL_SCORE = 
  BASE_RELATIONSHIP_SCORE +
  PERSONALITY_FIT_SCORE +
  HISTORICAL_SUCCESS_SCORE +
  CONSTRAINT_COMPLIANCE_SCORE -
  RISK_PENALTY

CONFIDENCE_SCORE = Math.min(100, Math.max(0, FINAL_SCORE))
```

## Technical Architecture (Preliminary)
- Frontend: React (Replit)
- Backend: Supabase
- Decision Engine: Custom PostgreSQL functions
- Core Logic: Scoring algorithm with multi-factor evaluation

## Next Steps
- Detailed database schema design
- Scoring function implementation
- Risk assessment logic refinement

## Open Questions
- Data storage for historical interactions
- Machine learning integration for personality matching
- Scalability of scoring mechanism