/**
 * Share Service — Share gift recommendations via native share sheet
 */
import { Share, Platform } from 'react-native';
import type { GiftRecommendation } from '../giftRecommendation/aiService';
import type { Product } from '../../types/product';

export interface ShareResult {
  success: boolean;
  action?: string;
}

/**
 * Share a single AI recommendation
 */
export async function shareRecommendation(rec: GiftRecommendation): Promise<ShareResult> {
  const message = [
    `🎁 Gift Idea: ${rec.title}`,
    `💡 ${rec.description}`,
    `💰 ${rec.priceRange}`,
    `📊 Confidence: ${rec.confidenceScore}%`,
    '',
    rec.purchaseLinks.map(l => `${l.store}: ${l.url}`).join('\n'),
    '',
    'Found with GivenRight ✨',
  ].join('\n');

  return nativeShare(message, `Gift Idea: ${rec.title}`);
}

/**
 * Share a product from commerce preview
 */
export async function shareProduct(product: Product): Promise<ShareResult> {
  const message = [
    `🎁 ${product.title}`,
    `💰 $${product.price}`,
    `⭐ ${product.rating}/5 (${product.reviewCount} reviews)`,
    '',
    product.affiliateUrl,
    '',
    'Found with GivenRight ✨',
  ].join('\n');

  return nativeShare(message, product.title);
}

/**
 * Share entire gift list
 */
export async function shareGiftList(
  recommendations: GiftRecommendation[],
  occasion?: string
): Promise<ShareResult> {
  const header = occasion
    ? `🎁 Gift Ideas for ${occasion}`
    : '🎁 Gift Ideas from GivenRight';

  const items = recommendations
    .slice(0, 5)
    .map((rec, i) => `${i + 1}. ${rec.title} (${rec.priceRange}) — ${rec.confidenceScore}% match`)
    .join('\n');

  const message = [header, '', items, '', 'Found with GivenRight ✨'].join('\n');

  return nativeShare(message, header);
}

/**
 * Generate a shareable deep link (for future use)
 */
export function generateShareLink(sessionId: string): string {
  return `https://givenright.app/s/${sessionId}`;
}

// ---- Internal ----

async function nativeShare(message: string, title: string): Promise<ShareResult> {
  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url: '' }
        : { message, title },
      { dialogTitle: title }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, action: 'dismissed' };
    }

    return { success: true };
  } catch (error) {
    console.warn('Share failed:', error);
    return { success: false };
  }
}