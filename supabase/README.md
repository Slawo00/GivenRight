# Supabase Edge Functions - GivenRight

## enrich-explanation

Contextual Scenario Enrichment via ChatGPT.

### Purpose

Server-side ChatGPT call for explanation personalization and concrete example generation.
This keeps the OpenAI API key secure and the Expo app client-only.

### Deployment

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Set the OpenAI API key as a secret:
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

5. Deploy the function:
```bash
supabase functions deploy enrich-explanation
```

### API Contract

**Request (POST)**
```json
{
  "decision_context": {
    "relationship_type": "partner",
    "closeness_level": 5,
    "occasion_type": "birthday",
    "personality_traits": ["creative", "thoughtful"],
    "surprise_tolerance": "high",
    "values": [],
    "no_gos": [],
    "budget_range": "100_250",
    "gift_type_preference": "physical",
    "time_constraint": "flexible"
  },
  "decision_option": {
    "confidence_type": "EMOTIONAL",
    "pattern_id": "memory_gift",
    "explanation": {
      "why_this_works": "...",
      "emotional_signal": "...",
      "things_to_consider": ["..."]
    }
  }
}
```

**Response**
```json
{
  "enriched_explanation": {
    "why_this_works": "...",
    "emotional_signal": "...",
    "things_to_consider": ["..."],
    "concrete_example_categories": [
      {
        "title": "Custom-crafted keepsake",
        "description": "An item created specifically for this relationship or moment.",
        "icon_key": "gift"
      }
    ]
  }
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key (set via `supabase secrets set`) |

### Fallback Behavior

If the Edge Function fails or is not deployed, the Expo app will:
- Display base explanations without concrete example categories
- Never block the decision flow
