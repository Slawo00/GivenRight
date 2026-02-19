/**
 * Quality Assurance Tests for AI Recommendation Service
 * Run with: npx jest services/giftRecommendation/__tests__/
 */

import {
  generateRecommendations,
  type RecommendationRequest,
} from '../aiService';
import {
  filterRecommendations,
  validateSet,
} from '../contentFilter';

// Test request fixtures
const baseRequest: RecommendationRequest = {
  personalityTraits: ['creative', 'adventurous'],
  occasion: 'birthday',
  relationship: 'friend',
  budgetMin: 30,
  budgetMax: 100,
};

describe('Rule-based Recommendations (no API key)', () => {
  it('should generate recommendations without API key', async () => {
    const results = await generateRecommendations(baseRequest);
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('should return recommendations with required fields', async () => {
    const results = await generateRecommendations(baseRequest);
    for (const rec of results) {
      expect(rec.id).toBeTruthy();
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.category).toBeTruthy();
      expect(rec.priceRange).toBeTruthy();
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(50);
      expect(rec.confidenceScore).toBeLessThanOrEqual(99);
      expect(rec.purchaseLinks.length).toBeGreaterThan(0);
      expect(rec.aiGenerated).toBe(false);
    }
  });

  it('should match personality traits to categories', async () => {
    const creativeReq = { ...baseRequest, personalityTraits: ['creative'] };
    const results = await generateRecommendations(creativeReq);
    const categories = results.map(r => r.category);
    expect(categories).toContain('creative');
  });

  it('should return max 6 results', async () => {
    const manyTraits = {
      ...baseRequest,
      personalityTraits: ['creative', 'analytical', 'adventurous', 'sentimental'],
    };
    const results = await generateRecommendations(manyTraits);
    expect(results.length).toBeLessThanOrEqual(6);
  });

  it('should sort by confidence score descending', async () => {
    const results = await generateRecommendations(baseRequest);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidenceScore).toBeGreaterThanOrEqual(
        results[i].confidenceScore
      );
    }
  });

  it('should generate purchase links for each recommendation', async () => {
    const results = await generateRecommendations(baseRequest);
    for (const rec of results) {
      expect(rec.purchaseLinks.length).toBe(3);
      const stores = rec.purchaseLinks.map(l => l.store);
      expect(stores).toContain('Amazon');
      expect(stores).toContain('Etsy');
      expect(stores).toContain('Google');
      for (const link of rec.purchaseLinks) {
        expect(link.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('should fallback to practical gifts for unknown traits', async () => {
    const unknownReq = {
      ...baseRequest,
      personalityTraits: ['xyz_nonexistent'],
    };
    const results = await generateRecommendations(unknownReq);
    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Content Filter', () => {
  it('should filter inappropriate content', () => {
    const recs = [
      {
        id: '1', title: 'Nice Book', description: 'Great read',
        category: 'books', priceRange: '$20', confidenceScore: 80,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
      {
        id: '2', title: 'Hunting Knife Set', description: 'Sharp weapon',
        category: 'outdoor', priceRange: '$50', confidenceScore: 75,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
    ];

    const filtered = filterRecommendations(recs);
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Nice Book');
  });

  it('should filter over-budget items', () => {
    const recs = [
      {
        id: '1', title: 'Affordable Gift', description: 'Budget friendly',
        category: 'general', priceRange: '$30-$50', confidenceScore: 80,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
      {
        id: '2', title: 'Luxury Item', description: 'Very expensive',
        category: 'luxury', priceRange: '$500-$1000', confidenceScore: 90,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
    ];

    const filtered = filterRecommendations(recs, 100);
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Affordable Gift');
  });

  it('should filter age-restricted content for minors', () => {
    const recs = [
      {
        id: '1', title: 'Board Game', description: 'Fun family game',
        category: 'games', priceRange: '$25', confidenceScore: 85,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
      {
        id: '2', title: 'Whiskey Tasting Set', description: 'Premium alcohol collection',
        category: 'drinks', priceRange: '$80', confidenceScore: 78,
        reasoning: '', searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
    ];

    const filtered = filterRecommendations(recs, undefined, '15');
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Board Game');
  });
});

describe('Validation', () => {
  it('should flag empty recommendation set', () => {
    const result = validateSet([]);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('No recommendations');
  });

  it('should flag too few recommendations', () => {
    const recs = [
      {
        id: '1', title: 'Gift', description: '', category: 'a',
        priceRange: '$20', confidenceScore: 80, reasoning: '',
        searchTerms: [], purchaseLinks: [], aiGenerated: false,
      },
    ];
    const result = validateSet(recs);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Too few suggestions');
  });

  it('should pass valid recommendation set', async () => {
    const recs = await generateRecommendations(baseRequest);
    const result = validateSet(recs);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });
});