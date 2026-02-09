/**
 * Content Filter Service
 * Ensures gift recommendations are appropriate, safe, and helpful
 */

const BLOCKED_KEYWORDS = [
  'weapon', 'knife', 'gun', 'alcohol', 'tobacco', 'cigarette',
  'gambling', 'betting', 'adult', 'nsfw', 'inappropriate',
  'dangerous', 'illegal', 'drug', 'narcotic', 'explosive',
];

const AGE_RESTRICTED = {
  under_13: ['electronics_expensive', 'alcohol', 'sharp_objects', 'experience_extreme'],
  under_18: ['alcohol', 'gambling', 'tobacco', 'adult_content'],
};

const BUDGET_TOLERANCE = 0.15; // 15% over budget is acceptable

export class ContentFilter {
  /**
   * Filter a list of recommendations
   */
  static filterRecommendations(recommendations, userInputs) {
    return recommendations
      .filter(rec => ContentFilter.isAppropriate(rec))
      .filter(rec => ContentFilter.isAgeAppropriate(rec, userInputs.age))
      .filter(rec => ContentFilter.isBudgetAppropriate(rec, userInputs.budget))
      .map(rec => ContentFilter.sanitize(rec));
  }

  /**
   * Check for inappropriate content
   */
  static isAppropriate(recommendation) {
    const text = [
      recommendation.title,
      recommendation.description,
      recommendation.reasoning,
    ].join(' ').toLowerCase();

    return !BLOCKED_KEYWORDS.some(keyword => text.includes(keyword));
  }

  /**
   * Check age appropriateness
   */
  static isAgeAppropriate(recommendation, age) {
    if (!age) return true;

    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return true;

    const text = [recommendation.title, recommendation.description, recommendation.category]
      .join(' ').toLowerCase();

    if (ageNum < 13) {
      return !AGE_RESTRICTED.under_13.some(term => text.includes(term));
    }
    if (ageNum < 18) {
      return !AGE_RESTRICTED.under_18.some(term => text.includes(term));
    }

    return true;
  }

  /**
   * Check budget appropriateness
   */
  static isBudgetAppropriate(recommendation, budget) {
    if (!budget || !budget.max) return true;

    const priceStr = recommendation.price_range || recommendation.price_estimate || '';
    const prices = priceStr.match(/\$?(\d+)/g);
    if (!prices || prices.length === 0) return true;

    const maxPrice = Math.max(...prices.map(p => parseInt(p.replace('$', ''))));
    const budgetMax = budget.max * (1 + BUDGET_TOLERANCE);

    return maxPrice <= budgetMax;
  }

  /**
   * Sanitize recommendation text
   */
  static sanitize(recommendation) {
    return {
      ...recommendation,
      title: ContentFilter.cleanText(recommendation.title),
      description: ContentFilter.cleanText(recommendation.description),
      reasoning: ContentFilter.cleanText(recommendation.reasoning || ''),
    };
  }

  /**
   * Clean text of any problematic content
   */
  static cleanText(text) {
    if (!text) return '';
    // Remove any HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Cap length
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 497) + '...';
    }
    return cleaned;
  }

  /**
   * Validate entire recommendation set
   */
  static validateSet(recommendations) {
    const issues = [];

    if (recommendations.length === 0) {
      issues.push('No recommendations generated');
    }

    if (recommendations.length < 3) {
      issues.push('Too few recommendations — consider broadening criteria');
    }

    const categories = new Set(recommendations.map(r => r.category));
    if (categories.size < 2 && recommendations.length >= 4) {
      issues.push('Low category diversity — recommendations are too similar');
    }

    const avgConfidence = recommendations.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / recommendations.length;
    if (avgConfidence < 50) {
      issues.push('Low average confidence — user should provide more details');
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      stats: {
        count: recommendations.length,
        categories: categories.size,
        avgConfidence: Math.round(avgConfidence),
      },
    };
  }
}

export default ContentFilter;