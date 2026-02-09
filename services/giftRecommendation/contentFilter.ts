/**
 * Content Filter for Gift Recommendations
 * Ensures all suggestions are appropriate, safe, and within budget
 */

import type { GiftRecommendation } from './aiService';

const BLOCKED_KEYWORDS = [
  'weapon', 'knife', 'gun', 'alcohol', 'tobacco', 'cigarette',
  'gambling', 'betting', 'adult', 'nsfw', 'dangerous', 'illegal',
  'drug', 'narcotic', 'explosive',
];

const BUDGET_TOLERANCE = 0.15; // 15% over budget acceptable

export function filterRecommendations(
  recommendations: GiftRecommendation[],
  budgetMax?: number,
  recipientAge?: string
): GiftRecommendation[] {
  return recommendations
    .filter(rec => isContentSafe(rec))
    .filter(rec => isAgeAppropriate(rec, recipientAge))
    .filter(rec => isBudgetOk(rec, budgetMax))
    .map(sanitize);
}

export function validateSet(recommendations: GiftRecommendation[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (recommendations.length === 0) issues.push('No recommendations');
  if (recommendations.length < 3) issues.push('Too few suggestions');

  const cats = new Set(recommendations.map(r => r.category));
  if (cats.size < 2 && recommendations.length >= 4) {
    issues.push('Low category diversity');
  }

  const avg =
    recommendations.reduce((s, r) => s + r.confidenceScore, 0) /
    (recommendations.length || 1);
  if (avg < 50) issues.push('Low average confidence');

  return { valid: issues.length === 0, issues };
}

// ---- helpers ----

function isContentSafe(rec: GiftRecommendation): boolean {
  const text = [rec.title, rec.description, rec.reasoning].join(' ').toLowerCase();
  return !BLOCKED_KEYWORDS.some(kw => text.includes(kw));
}

function isAgeAppropriate(rec: GiftRecommendation, age?: string): boolean {
  if (!age) return true;
  const n = parseInt(age, 10);
  if (isNaN(n)) return true;
  const text = [rec.title, rec.description].join(' ').toLowerCase();
  if (n < 18 && ['alcohol', 'gambling', 'tobacco'].some(t => text.includes(t))) return false;
  return true;
}

function isBudgetOk(rec: GiftRecommendation, max?: number): boolean {
  if (!max) return true;
  const nums = rec.priceRange.match(/\d+/g);
  if (!nums) return true;
  const highest = Math.max(...nums.map(Number));
  return highest <= max * (1 + BUDGET_TOLERANCE);
}

function sanitize(rec: GiftRecommendation): GiftRecommendation {
  return {
    ...rec,
    title: clean(rec.title),
    description: clean(rec.description),
    reasoning: clean(rec.reasoning),
  };
}

function clean(s: string): string {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}