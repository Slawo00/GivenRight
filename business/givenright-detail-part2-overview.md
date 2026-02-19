# GivenRight - Detail Part 2 Overview

**Source:** Master Concept Part 2 - Operational Specifications (63 pages)

---

## Document Contents

This document contains the **complete operational specifications** for GivenRight, including:

### 27. Structured Question Routine – Operational Specification
**Full specification of the user question flow:**
- Every question presented to users
- All permitted answer options
- Technical meaning of each selection
- Complete standard prompt for implementation

**Design Principles:**
- Users select; they do not explain
- Free text avoided wherever possible
- Every option is semantically unambiguous
- Every answer reduces emotional or social risk
- Every question is necessary
- Fixed order of questions

---

### 28. Scoring Engine & Confidence Calculation
**Complete scoring algorithm:**

1. **Base Relationship Score (0–30)**
   - Based on relationship type & closeness
   - Emotional intensity mapping

2. **Personality Fit Score (0–20)**
   - Matches gift to recipient personality
   - Taste alignment

3. **Historical Success Score (–10 to +20)**
   - Learning from past gifts
   - Relationship-specific patterns
   - Fallback hierarchy:
     1. Relationship × Occasion history (strongest signal)
     2. Relationship-only history (fallback)
     3. Relationship-type prior (cold start only)

4. **Constraint Compliance Score (0–15)**
   - Budget alignment
   - No-go avoidance
   - Practical constraints

**Total Score:** 0-85 points → Maps to SAFE/EMOTIONAL/BOLD

---

### 29. Commerce Execution & Affiliate Integration
**How purchases are handled:**
1. Affiliate link generation
2. Retailer partnerships
3. Commission tracking
4. Purchase attribution

---

### 30. Localization, Language & Global Market Readiness
**How the system adapts to different markets:**
- Language localization
- Cultural occasion mapping
- Retailer integrations per market
- Currency handling

---

### 31. User Lifecycle & Confidence States

#### 31.1 Core Principle: Confidence Over Engagement
> "We optimize for confidence per decision, not time on site."

#### 31.2 Confidence States (Canonical)

**1. UNCONFIDENT (Trigger State)**
- User needs to make a gifting decision
- High anxiety, low clarity
- Entry point into system

**2. DECIDING (Active State)**
- User is in decision flow
- Answering questions
- Reviewing options

**3. CONFIDENT (Post-Decision State)**
- User has chosen an option
- Feels good about decision
- May proceed to purchase

**4. REINFORCED (Post-Outcome State)**
- Gift was given
- Feedback received
- Confidence validated (or not)
- System learns

#### 31.3 State Transitions (Explicit)
- UNCONFIDENT → DECIDING (user starts flow)
- DECIDING → CONFIDENT (user chooses option)
- CONFIDENT → REINFORCED (user gives feedback)
- REINFORCED → UNCONFIDENT (next gifting occasion)

#### 31.4 Re-Engagement Rules (Critical)
**When to nudge users:**
- Calendar-based (upcoming occasions)
- Relationship-based (haven't gifted in X months)
- Never during "confident" state (respect closure)

**When NOT to nudge:**
- Late night (23:00-08:00)
- Just after decision (give breathing room)
- Too frequently (max 1x/week)

#### 31.5 Monetization Alignment
- Free users: Stay in UNCONFIDENT longer (friction by design)
- Paid users: Faster confidence, more reinforcement
- Premium users: Proactive confidence (we reach out first)

---

### 32. User Journeys (Detailed)

#### 32.1 Journey A – First-Time Gifter (FREE Tier)

**1. Landing / Onboarding**
- Value prop: "Make confident gifting decisions"
- No account required to start (lower friction)
- Begin with first decision

**2. Relationship Setup**
- "Who is this gift for?"
- Structured questions begin
- Context captured

**3. Decision Flow**
- Answer 8-12 questions
- Receive 3 options (SAFE/EMOTIONAL/BOLD)
- Read explanations

**4. Decision Made**
- User selects option
- Feels confident
- Optional: Purchase via affiliate link

**5. Post-Gift Feedback**
- "How did it go?"
- Simple feedback (positive/neutral/negative)
- System learns

**6. Paywall Trigger**
- After 3-5 decisions
- "Want unlimited decisions?"
- Upsell to Confidence Plus

---

## Database Schema (Supabase-Ready!)

### Key Tables:

#### `users`
- Account & authentication
- Subscription tier
- Created date

#### `relationships`
- Who is the recipient?
- Relationship type & closeness
- Personality/taste data
- History

#### `occasions`
- What events need gifting?
- Date, recurrence
- Importance level

#### `decisions`
- Each gifting decision
- Questions answered
- Options presented
- Chosen option
- Confidence level

#### `gift_memory`
- What was gifted?
- To whom?
- For what occasion?
- How did it land? (feedback)
- Product fingerprint (hashed)

**Critical Note:**
> "Gift Memory is evaluated BEFORE scoring. Any candidate gift whose semantic profile overlaps with a previously successful gift for the same relationship and occasion must be suppressed or downgraded. This prevents successful but redundant gifting."

---

## Structured Question Routine (Example)

### Question 1: Relationship Type

**User Question:**  
"What is your relationship with the recipient?"

**Selection Options & Technical Mapping:**

| Selection | emotional_intensity | intimacy_allowed | risk_tolerance |
|-----------|---------------------|------------------|----------------|
| Partner | high | high | medium |
| Spouse | very_high | very_high | low |
| Sibling | high | medium | medium |
| Parent | high | medium | low |
| Child | very_high | high | medium |
| Close friend | high | medium | high |
| Friend | medium | medium | medium |
| Colleague | low | low | low |
| Manager | low | very_low | very_low |
| Acquaintance | low | low | low |

**System Interpretation:**
```
relationship_type = {
  emotional_intensity: [very_low, low, medium, high, very_high],
  intimacy_allowed: [very_low, low, medium, high, very_high],
  risk_tolerance: [very_low, low, medium, high]
}
```

---

### Question 2: Occasion Type

**User Question:**  
"What is the occasion?"

**Selection Options:**
- Birthday
- Anniversary (romantic)
- Anniversary (other)
- Wedding
- Christmas
- Valentine's Day
- Mother's/Father's Day
- Graduation
- New Job
- Apology
- Thank You
- Just Because

**Technical Mapping:**
Each occasion has:
- `formality_level` (casual → very_formal)
- `emotional_weight` (low → very_high)
- `price_expectation` (budget range)
- `surprise_tolerance` (how risky can you be?)

---

## Key Insights from Part 2

### 1. **This is production-ready specification**
Not conceptual. Every question, every option, every mapping is defined.

### 2. **Deterministic scoring is fully specified**
4 components, clear weights, fallback logic for cold start.

### 3. **Database schema is Supabase-compatible**
Can be directly implemented in Supabase (PostgreSQL).

### 4. **User lifecycle is explicitly defined**
Confidence states, transitions, re-engagement rules.

### 5. **Monetization is embedded in experience**
Free users experience friction (intentional).  
Paid users get smoother confidence.

---

## What This Means for Development

**MVP can be built from this spec:**
1. Supabase schema → directly implementable
2. Question routine → copy-paste ready
3. Scoring engine → algorithm is defined
4. User flows → step-by-step documented

**Gap analysis needed:**
- Is scoring engine already built? (Code exists?)
- Is ChatGPT integration ready? (Explanation generation)
- Are affiliate partnerships live? (Commerce layer)
- Is feedback loop tested? (Completion rate?)

---

## Next Steps

1. **Extract complete question routine** (all 8-12 questions)
2. **Build Supabase schema** (from spec)
3. **Implement scoring engine** (deterministic algorithm)
4. **Create MVP scope** (what's Phase 1 vs. Phase 2?)
5. **Validate with users** (before building everything)

---

**This document is implementation gold.** 🏆  
Most startups would kill for this level of specification clarity.

Should I:
- Extract complete database schema for Supabase?
- Document full question routine (all questions)?
- Build MVP definition from these specs?
- Create implementation roadmap?

---

*Document overview created: 2026-02-05*  
*Source: GivenRight Master Concept Part 2 (63 pages)*
