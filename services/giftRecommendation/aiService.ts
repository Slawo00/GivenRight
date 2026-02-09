/**
 * AI Gift Recommendation Service
 * Integrates with existing GivenRight decision engine
 * Uses OpenAI for enhanced recommendations, with rule-based fallback
 */

import { supabase, isSupabaseConfigured } from '@/config/supabase';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface GiftRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priceRange: string;
  confidenceScore: number;
  reasoning: string;
  searchTerms: string[];
  purchaseLinks: { store: string; url: string }[];
  aiGenerated: boolean;
}

export interface RecommendationRequest {
  personalityTraits: string[];
  occasion: string;
  relationship: string;
  budgetMin: number;
  budgetMax: number;
  giftTypePreference?: string;
  specialNotes?: string;
  recipientAge?: string;
  recipientGender?: string;
}

/**
 * Generate gift recommendations using AI with rule-based fallback
 */
export async function generateRecommendations(
  request: RecommendationRequest,
  apiKey?: string
): Promise<GiftRecommendation[]> {
  // Try AI first if key available
  if (apiKey) {
    try {
      return await generateAIRecommendations(request, apiKey);
    } catch (error) {
      console.warn('AI recommendations failed, using fallback:', error);
    }
  }

  // Fallback to rule-based
  return generateRuleBasedRecommendations(request);
}

/**
 * Get matching categories from Supabase
 */
export async function getMatchingCategories(
  personalityType: string,
  occasion: string
): Promise<{ category_name: string; match_score: number }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase.rpc('get_recommended_categories', {
      p_personality_type: personalityType,
      p_occasion: occasion,
    });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Category lookup failed:', e);
    return [];
  }
}

/**
 * Save recommendations to Supabase
 */
export async function saveRecommendations(
  sessionId: string,
  recommendations: GiftRecommendation[]
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const rows = recommendations.map(rec => ({
      session_id: sessionId,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      price_range: rec.priceRange,
      confidence_score: rec.confidenceScore,
      reasoning: rec.reasoning,
      purchase_links: rec.purchaseLinks,
      ai_generated: rec.aiGenerated,
    }));

    const { error } = await supabase
      .from('gift_recommendations')
      .insert(rows);

    if (error) console.warn('Failed to save recommendations:', error);
  } catch (e) {
    console.warn('Save error:', e);
  }
}

// ============ AI Generation ============

async function generateAIRecommendations(
  request: RecommendationRequest,
  apiKey: string
): Promise<GiftRecommendation[]> {
  const prompt = buildPrompt(request);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a gift recommendation expert. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI ${response.status}`);

  const data = await response.json();
  const content = data.choices[0].message.content;
  return parseAIResponse(content);
}

function buildPrompt(req: RecommendationRequest): string {
  return `Suggest 5 specific gift ideas as JSON array.

RECIPIENT: ${req.personalityTraits.join(', ')} personality, ${req.recipientAge || 'adult'}, ${req.recipientGender || 'any gender'}
CONTEXT: ${req.occasion}, ${req.relationship} relationship
BUDGET: $${req.budgetMin}-$${req.budgetMax}
PREFERENCE: ${req.giftTypePreference || 'any'}
NOTES: ${req.specialNotes || 'none'}

Each item: {"title":"...", "description":"...", "category":"...", "price":"$XX-$XX", "confidence":70-99, "reasoning":"...", "searchTerms":["..."]}
Return ONLY the JSON array.`;
}

function parseAIResponse(text: string): GiftRecommendation[] {
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.recommendations || [];

  return items.map((item: any, i: number) => ({
    id: `ai-${Date.now()}-${i}`,
    title: item.title || 'Gift Idea',
    description: item.description || '',
    category: item.category || 'general',
    priceRange: item.price || '$20-$50',
    confidenceScore: Math.min(99, Math.max(50, item.confidence || 75)),
    reasoning: item.reasoning || '',
    searchTerms: item.searchTerms || [item.title],
    purchaseLinks: generateLinks(item.searchTerms || [item.title]),
    aiGenerated: true,
  }));
}

// ============ Rule-based Fallback ============

const GIFT_DB: Record<string, { title: string; desc: string; price: string }[]> = {
  creative: [
    { title: 'Premium Watercolor Paint Set', desc: 'Professional 48-color set with brushes and palette', price: '$35-$65' },
    { title: 'Online Masterclass Subscription', desc: 'World-class creative courses in painting, photography, design', price: '$15-$30/mo' },
    { title: 'Handmade Pottery Workshop', desc: 'Local 3-hour pottery class with take-home creations', price: '$60-$90' },
  ],
  analytical: [
    { title: 'Smart Home Starter Kit', desc: 'Hub + smart bulbs + sensors for home automation', price: '$50-$100' },
    { title: 'Wireless Charging Stand', desc: 'Bamboo multi-device charging station', price: '$35-$55' },
    { title: 'Coding Course Subscription', desc: '3-month access to premium coding platforms', price: '$40-$80' },
  ],
  adventurous: [
    { title: 'Escape Room Experience', desc: 'Immersive puzzle adventure for 2-4 people', price: '$30-$50/person' },
    { title: 'Hot Air Balloon Ride', desc: 'Sunrise flight with champagne toast', price: '$150-$300' },
    { title: 'National Park Annual Pass', desc: 'Year-long access to all national parks', price: '$80' },
  ],
  introverted: [
    { title: 'Kindle Paperwhite', desc: 'Waterproof e-reader with warm light', price: '$130-$150' },
    { title: 'Premium Noise-Cancelling Headphones', desc: 'Over-ear wireless headphones for deep focus', price: '$100-$200' },
    { title: 'Weighted Blanket', desc: 'Premium 15lb cotton blanket for deep relaxation', price: '$50-$80' },
  ],
  sentimental: [
    { title: 'Custom Star Map Print', desc: 'Night sky from a meaningful date and location', price: '$30-$60' },
    { title: 'Personalized Photo Book', desc: 'Premium hardcover with curated photos', price: '$40-$80' },
    { title: 'Engraved Jewelry Box', desc: 'Handcrafted wood with laser-engraved message', price: '$45-$75' },
  ],
  practical: [
    { title: 'Gourmet Spice Collection', desc: '12 exotic spices with recipe cards', price: '$40-$65' },
    { title: 'Smart Water Bottle', desc: 'LED temperature display + hydration reminders', price: '$30-$50' },
    { title: 'Indoor Herb Garden Kit', desc: 'Self-watering planter with LED grow light', price: '$40-$80' },
  ],
};

function generateRuleBasedRecommendations(req: RecommendationRequest): GiftRecommendation[] {
  const traits = req.personalityTraits.map(t => t.toLowerCase());
  const results: GiftRecommendation[] = [];

  // Match traits to gift categories
  for (const trait of traits) {
    const gifts = GIFT_DB[trait] || GIFT_DB.practical;
    for (const gift of gifts) {
      results.push({
        id: `rule-${Date.now()}-${results.length}`,
        title: gift.title,
        description: gift.desc,
        category: trait,
        priceRange: gift.price,
        confidenceScore: 70 + Math.floor(Math.random() * 20),
        reasoning: `Matched to "${trait}" personality trait for ${req.occasion}`,
        searchTerms: [gift.title],
        purchaseLinks: generateLinks([gift.title]),
        aiGenerated: false,
      });
    }
  }

  // If too few, add general gifts
  if (results.length < 3) {
    const general = GIFT_DB.practical;
    for (const gift of general) {
      results.push({
        id: `rule-${Date.now()}-${results.length}`,
        title: gift.title,
        description: gift.desc,
        category: 'general',
        priceRange: gift.price,
        confidenceScore: 65,
        reasoning: 'Universal gift recommendation',
        searchTerms: [gift.title],
        purchaseLinks: generateLinks([gift.title]),
        aiGenerated: false,
      });
    }
  }

  return results
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 6);
}

function generateLinks(terms: string[]): { store: string; url: string }[] {
  const q = encodeURIComponent(terms.join(' '));
  return [
    { store: 'Amazon', url: `https://www.amazon.com/s?k=${q}` },
    { store: 'Etsy', url: `https://www.etsy.com/search?q=${q}` },
    { store: 'Google', url: `https://www.google.com/search?tbm=shop&q=${q}` },
  ];
}