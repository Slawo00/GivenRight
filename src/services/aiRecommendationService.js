/**
 * AI Recommendation Service
 * Generates personalized gift recommendations using OpenAI API
 * Falls back to rule-based recommendations if API unavailable
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class AIRecommendationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = 'gpt-4o-mini'; // Cost-effective for recommendations
  }

  /**
   * Generate gift recommendations using AI
   */
  async generateRecommendations(userInputs, confidenceScore, categories) {
    try {
      if (!this.apiKey) {
        console.log('No API key, using rule-based recommendations');
        return this.getRuleBasedRecommendations(userInputs, confidenceScore, categories);
      }

      const prompt = this.buildPrompt(userInputs, confidenceScore, categories);
      const response = await this.callOpenAI(prompt);
      const parsed = this.parseAIResponse(response);
      
      return parsed;
    } catch (error) {
      console.error('AI recommendation failed, falling back:', error.message);
      return this.getRuleBasedRecommendations(userInputs, confidenceScore, categories);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  buildPrompt(userInputs, confidenceScore, categories) {
    const topCategories = categories
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5)
      .map(c => `${c.category_name} (${c.match_score}% match)`)
      .join(', ');

    return `You are a world-class gift recommendation expert. Based on the following profile, suggest 5 specific, creative gift ideas.

RECIPIENT PROFILE:
- Personality: ${userInputs.personalityType || 'Not specified'}
- Interests: ${(userInputs.interests || []).join(', ') || 'Not specified'}
- Relationship: ${userInputs.relationship || 'Not specified'}
- Age: ${userInputs.age || 'Not specified'}
- Gender: ${userInputs.gender || 'Not specified'}

GIFT CONTEXT:
- Occasion: ${userInputs.occasion || 'Not specified'}
- Budget: $${userInputs.budget?.min || 0} - $${userInputs.budget?.max || 100}
- Timing: ${userInputs.timing || 'flexible'}
- Special Notes: ${userInputs.specialNotes || 'None'}

MATCHING CATEGORIES: ${topCategories}
CONFIDENCE SCORE: ${confidenceScore}%

INSTRUCTIONS:
Return exactly 5 gift recommendations as a JSON array. Each item must have:
{
  "title": "Specific product/experience name",
  "description": "2-3 sentence description of why this is perfect",
  "category": "One of the matching categories",
  "price_estimate": "$XX-$XX",
  "confidence": 70-99 (how confident this matches),
  "reasoning": "Brief explanation of the match logic",
  "search_terms": ["keyword1", "keyword2"] for finding this gift online
}

Focus on SPECIFIC, PURCHASABLE items — not generic categories. Be creative but practical.
Return ONLY the JSON array, no other text.`;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a gift recommendation expert. Always respond with valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse and validate AI response
   */
  parseAIResponse(responseText) {
    try {
      const parsed = JSON.parse(responseText);
      const recommendations = parsed.recommendations || parsed;
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }

      return recommendations.map((rec, index) => ({
        id: `ai-${Date.now()}-${index}`,
        title: rec.title || 'Gift Suggestion',
        description: rec.description || '',
        category: rec.category || 'general',
        price_range: rec.price_estimate || '$20-$50',
        confidence_score: Math.min(99, Math.max(50, rec.confidence || 75)),
        reasoning: rec.reasoning || '',
        purchase_links: this.generateSearchLinks(rec.search_terms || [rec.title]),
        ai_generated: true,
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
  }

  /**
   * Generate search/purchase links from keywords
   */
  generateSearchLinks(searchTerms) {
    const query = encodeURIComponent(searchTerms.join(' '));
    return [
      { store: 'Amazon', url: `https://www.amazon.com/s?k=${query}` },
      { store: 'Etsy', url: `https://www.etsy.com/search?q=${query}` },
      { store: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${query}` },
    ];
  }

  /**
   * Rule-based fallback recommendations (no API needed)
   */
  getRuleBasedRecommendations(userInputs, confidenceScore, categories) {
    const giftDatabase = {
      'Creative & Arts': [
        { title: 'Premium Watercolor Paint Set', description: 'Professional-grade 48-color watercolor set with brushes and mixing palette', price_range: '$35-$65' },
        { title: 'Online Masterclass Subscription', description: 'Access to world-class creative courses across painting, photography, and design', price_range: '$15-$30/month' },
        { title: 'Handmade Pottery Workshop', description: 'Local 3-hour pottery class with take-home creations', price_range: '$60-$90' },
      ],
      'Technology': [
        { title: 'Wireless Charging Stand', description: 'Elegant bamboo multi-device charging station for phone, watch, and earbuds', price_range: '$35-$55' },
        { title: 'Smart LED Light Strip Kit', description: 'App-controlled RGB light strip with music sync and voice assistant support', price_range: '$25-$45' },
        { title: 'Portable Bluetooth Speaker', description: 'Waterproof compact speaker with 24-hour battery and rich bass', price_range: '$40-$80' },
      ],
      'Experience': [
        { title: 'Escape Room Adventure', description: 'Immersive puzzle experience for 2-4 people with themed rooms', price_range: '$30-$50/person' },
        { title: 'Cooking Class for Two', description: 'Hands-on culinary experience with a professional chef — Italian, Sushi, or Thai', price_range: '$80-$150' },
        { title: 'Hot Air Balloon Ride', description: 'Sunrise flight with champagne toast and stunning views', price_range: '$150-$300' },
      ],
      'Food & Drink': [
        { title: 'Artisanal Spice Collection Box', description: 'Curated set of 12 exotic spices with recipe cards from around the world', price_range: '$40-$65' },
        { title: 'Wine Tasting Experience', description: 'Guided tasting of 6 premium wines with cheese pairings', price_range: '$50-$90' },
        { title: 'Gourmet Coffee Subscription', description: 'Monthly delivery of single-origin beans from top roasters worldwide', price_range: '$20-$35/month' },
      ],
      'Comfort & Wellness': [
        { title: 'Weighted Blanket', description: 'Premium 15lb cotton weighted blanket for deep relaxation and better sleep', price_range: '$50-$80' },
        { title: 'Aromatherapy Diffuser Set', description: 'Elegant ceramic diffuser with 6 essential oils and ambient lighting', price_range: '$35-$55' },
        { title: 'Spa Day Gift Card', description: 'Full spa experience with massage, facial, and relaxation lounge access', price_range: '$100-$200' },
      ],
      'Personal & Sentimental': [
        { title: 'Custom Star Map Print', description: 'Beautiful print showing the night sky from a meaningful date and location', price_range: '$30-$60' },
        { title: 'Personalized Photo Book', description: 'Premium hardcover book with curated photos and custom captions', price_range: '$40-$80' },
        { title: 'Engraved Jewelry Box', description: 'Handcrafted wooden box with personal message laser-engraved on lid', price_range: '$45-$75' },
      ],
      'Books & Learning': [
        { title: 'Kindle Paperwhite', description: 'Waterproof e-reader with warm adjustable light and weeks of battery', price_range: '$130-$150' },
        { title: 'Audible Gift Subscription', description: '3-month audiobook subscription with 1 credit per month', price_range: '$45' },
        { title: 'Curated Book Box', description: 'Monthly surprise of hand-picked books based on reading preferences', price_range: '$30-$50/month' },
      ],
      'Fashion & Style': [
        { title: 'Minimalist Watch', description: 'Elegant everyday watch with leather strap and sapphire crystal', price_range: '$80-$150' },
        { title: 'Silk Scarf Collection', description: 'Hand-designed silk scarf in gift box — versatile for any outfit', price_range: '$40-$70' },
        { title: 'Designer Sunglasses', description: 'Classic polarized sunglasses with UV protection and premium case', price_range: '$60-$120' },
      ],
      'Home & Garden': [
        { title: 'Indoor Herb Garden Kit', description: 'Smart self-watering planter with LED grow light for fresh herbs year-round', price_range: '$40-$80' },
        { title: 'Scented Candle Collection', description: 'Set of 4 hand-poured soy candles in seasonal fragrances', price_range: '$35-$55' },
        { title: 'Custom House Portrait', description: 'Watercolor illustration of their home — perfect for new homeowners', price_range: '$50-$120' },
      ],
      'Sports & Fitness': [
        { title: 'Smart Water Bottle', description: 'LED temperature display and hydration reminders throughout the day', price_range: '$30-$50' },
        { title: 'Resistance Band Set', description: 'Complete set of 5 bands with door anchor, handles, and workout guide', price_range: '$25-$45' },
        { title: 'Running Watch', description: 'GPS fitness tracker with heart rate, pace tracking, and 7-day battery', price_range: '$100-$200' },
      ],
    };

    // Get top matching categories
    const topCats = (categories || [])
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      .slice(0, 3)
      .map(c => c.category_name);

    // If no categories, use personality-based defaults
    if (topCats.length === 0) {
      topCats.push('Comfort & Wellness', 'Personal & Sentimental');
    }

    // Build recommendations from matching categories
    let recommendations = [];
    for (const cat of topCats) {
      const catGifts = giftDatabase[cat] || giftDatabase['Comfort & Wellness'];
      for (const gift of catGifts) {
        recommendations.push({
          id: `rule-${Date.now()}-${recommendations.length}`,
          title: gift.title,
          description: gift.description,
          category: cat,
          price_range: gift.price_range,
          confidence_score: Math.min(95, confidenceScore + Math.floor(Math.random() * 10)),
          reasoning: `Selected from ${cat} category based on personality and occasion match`,
          purchase_links: this.generateSearchLinks([gift.title]),
          ai_generated: false,
        });
      }
    }

    // Sort by confidence and return top 6
    return recommendations
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 6);
  }
}

export default AIRecommendationService;