import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { decision_context, decision_option } = body;

    if (!decision_context || !decision_option) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `
You are GivenRight's Contextual Explainability Layer.

Your role is NOT to make decisions.
All decisions are already final and locked.

You receive:
- a locked gifting context
- a locked decision outcome (SAFE, EMOTIONAL, or BOLD)

Your task:
Make each decision option feel concrete, distinct, and situation-specific
without recommending products or judging quality.

You must:
- reflect the relationship, occasion, personality, and constraints
- help the user imagine what this option could look like in real life
- remain neutral and non-directive

You must NOT:
- recommend products or brands
- suggest that one option is better than another
- use marketing or sales language
- mention prices, deals, or marketplaces
- mention system logic, scoring, or rules

Tone:
- calm
- grounded
- human
- non-promotional

All outputs must be structured JSON only.
    `.trim();

    const contextSummary = buildContextSummary(decision_context);

    const userPrompt = `
Context:
${contextSummary}

Decision Option:
{
  confidence_type: "${decision_option.confidence_type}",
  pattern_id: "${decision_option.pattern_id}",
  explanation: {
    why_this_works: "${decision_option.explanation?.why_this_works || ''}",
    emotional_signal: "${decision_option.explanation?.emotional_signal || ''}",
    things_to_consider: ${JSON.stringify(decision_option.explanation?.things_to_consider || [])}
  }
}

Task:
1) Briefly adapt the language so it clearly fits this specific context.
2) Generate 3–5 concrete example object categories that illustrate
   what this decision option could look like in practice.

Rules for example categories:
- Categories must be generic and neutral
- No brands, products, prices, or marketplaces
- No evaluative language (no "best", "premium deal", etc.)
- Each category must include:
  - a short title
  - a one-sentence description
  - a semantic icon key

Output JSON schema:
{
  "enriched_explanation": {
    "why_this_works": string,
    "emotional_signal": string,
    "things_to_consider": string[],
    "concrete_example_categories": [
      {
        "title": string,
        "description": string,
        "icon_key": string
      }
    ]
  }
}
    `.trim();

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    const result = await openaiResponse.json();

    const content = result?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Enrichment failed:", error);
    return new Response(
      JSON.stringify({ error: "Enrichment service failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildContextSummary(context: Record<string, unknown>): string {
  const parts = [
    context.relationship_type,
    context.occasion_type,
    context.closeness_level === 5 ? 'Very close' : 
      (context.closeness_level as number) >= 3 ? 'Moderately close' : 'Not very close',
    Array.isArray(context.personality_traits) ? context.personality_traits.join(', ') : null,
    context.surprise_tolerance === 'high' ? 'Loves bold surprises' :
      context.surprise_tolerance === 'low' ? 'Prefers safe choices' : 'Open to surprises',
    context.time_constraint === 'flexible' ? 'Plenty of time' :
      context.time_constraint === 'urgent' ? 'Limited time' : 'Some time',
  ].filter(Boolean);

  return parts.join(' · ');
}
