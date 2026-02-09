/**
 * Gift Flow Controller
 * Orchestrates the complete gift recommendation pipeline:
 * Input → Confidence Score → AI Recommendations → Save & Display
 */

import { GiftAPI } from './supabaseClient';
import { AIRecommendationService } from './aiRecommendationService';

export class GiftFlowController {
  constructor(openaiApiKey = null) {
    this.aiService = new AIRecommendationService(openaiApiKey);
    this.currentSession = null;
    this.currentRecipient = null;
  }

  /**
   * STEP 1: Process user form input and create session
   */
  async processInput(formData) {
    try {
      // Save recipient
      this.currentRecipient = await GiftAPI.saveRecipient({
        name: formData.recipientName || 'Gift Recipient',
        relationship: formData.relationship,
        age_range: formData.age,
        gender: formData.gender,
        personality_type: formData.personalityType,
        interests: formData.interests,
        hobbies: formData.hobbies || [],
        lifestyle: formData.lifestyle || '',
      });

      // Create gift session
      this.currentSession = await GiftAPI.createSession({
        recipient_id: this.currentRecipient.id,
        occasion: formData.occasion,
        budget_min: formData.budget?.min || 0,
        budget_max: formData.budget?.max || 100,
        timing: formData.timing || 'flexible',
        special_notes: formData.specialNotes || '',
        session_data: {
          giftType: formData.giftType || [],
          avoidList: formData.avoidList || [],
          rawInput: formData,
        },
      });

      return {
        success: true,
        sessionId: this.currentSession.id,
        recipientId: this.currentRecipient.id,
      };
    } catch (error) {
      console.error('Failed to process input:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 2: Calculate confidence score
   */
  async calculateScore(formData) {
    try {
      // Call Supabase function for server-side scoring
      const score = await GiftAPI.calculateConfidence({
        personalityType: formData.personalityType,
        interests: formData.interests,
        relationship: formData.relationship,
        budgetMin: formData.budget?.min || 0,
        budgetMax: formData.budget?.max || 100,
        occasion: formData.occasion,
        specialNotes: formData.specialNotes || '',
      });

      // Build factor breakdown
      const breakdown = this.buildScoreBreakdown(formData);

      // Save confidence factors
      if (this.currentSession) {
        await GiftAPI.saveConfidenceFactors(
          this.currentSession.id,
          breakdown.factors
        );
      }

      return {
        score: score || breakdown.totalScore,
        breakdown: breakdown,
        factors: breakdown.factors,
      };
    } catch (error) {
      console.error('Score calculation failed, using client-side:', error);
      const breakdown = this.buildScoreBreakdown(formData);
      return {
        score: breakdown.totalScore,
        breakdown: breakdown,
        factors: breakdown.factors,
      };
    }
  }

  /**
   * STEP 3: Generate recommendations
   */
  async getRecommendations(formData, confidenceScore) {
    try {
      // Get matching categories
      let categories = [];
      try {
        categories = await GiftAPI.getRecommendedCategories(
          formData.personalityType,
          formData.occasion
        );
      } catch (e) {
        console.warn('Category lookup failed, using defaults');
      }

      // Generate AI recommendations
      const recommendations = await this.aiService.generateRecommendations(
        formData,
        confidenceScore,
        categories
      );

      // Save to database
      if (this.currentSession && recommendations.length > 0) {
        await GiftAPI.saveRecommendations(
          this.currentSession.id,
          recommendations.map(rec => ({
            title: rec.title,
            description: rec.description,
            category: rec.category,
            price_range: rec.price_range,
            confidence_score: rec.confidence_score,
            reasoning: rec.reasoning,
            purchase_links: rec.purchase_links,
            ai_generated: rec.ai_generated,
          }))
        );
      }

      return {
        success: true,
        recommendations: recommendations,
        categories: categories,
        sessionId: this.currentSession?.id,
      };
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      // Return rule-based fallback
      const fallback = this.aiService.getRuleBasedRecommendations(
        formData,
        confidenceScore,
        []
      );
      return {
        success: true,
        recommendations: fallback,
        categories: [],
        sessionId: this.currentSession?.id,
        isFallback: true,
      };
    }
  }

  /**
   * STEP 4: Submit user feedback
   */
  async submitFeedback(recommendationId, rating) {
    try {
      await GiftAPI.submitFeedback(recommendationId, rating);
      return { success: true };
    } catch (error) {
      console.error('Feedback submission failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * FULL PIPELINE: Run complete flow
   */
  async runFullPipeline(formData) {
    // Step 1: Process Input
    const inputResult = await this.processInput(formData);
    if (!inputResult.success) {
      return { success: false, step: 'input', error: inputResult.error };
    }

    // Step 2: Calculate Score
    const scoreResult = await this.calculateScore(formData);

    // Step 3: Get Recommendations
    const recResult = await this.getRecommendations(formData, scoreResult.score);

    return {
      success: true,
      sessionId: inputResult.sessionId,
      confidenceScore: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      recommendations: recResult.recommendations,
      categories: recResult.categories,
      isFallback: recResult.isFallback || false,
    };
  }

  /**
   * Build detailed score breakdown (client-side)
   */
  buildScoreBreakdown(formData) {
    const factors = [];
    let totalScore = 0;

    // Personality (max 25)
    let pScore = 0;
    if (formData.personalityType) {
      pScore = 15;
      const interestCount = (formData.interests || []).length;
      if (interestCount >= 3) pScore += 10;
      else if (interestCount >= 1) pScore += 5;
    }
    pScore = Math.min(25, pScore);
    totalScore += pScore;
    factors.push({
      factor_type: 'personality',
      factor_value: formData.personalityType || 'unknown',
      points_awarded: pScore,
      max_points: 25,
      reasoning: `${formData.personalityType || 'No type'}, ${(formData.interests || []).length} interests`,
    });

    // Relationship (max 20)
    const relScores = {
      partner: 20, best_friend: 16, family_close: 18,
      good_friend: 14, colleague: 10,
    };
    const rScore = relScores[formData.relationship] || 6;
    totalScore += rScore;
    factors.push({
      factor_type: 'relationship',
      factor_value: formData.relationship || 'unknown',
      points_awarded: rScore,
      max_points: 20,
      reasoning: `Relationship: ${formData.relationship}`,
    });

    // Budget (max 15)
    let bScore = 0;
    const budgetMin = formData.budget?.min || 0;
    const budgetMax = formData.budget?.max || 0;
    if (budgetMax > budgetMin) {
      bScore = 10;
      if ((budgetMax - budgetMin) <= 20) bScore += 5;
    }
    totalScore += bScore;
    factors.push({
      factor_type: 'budget',
      factor_value: `$${budgetMin}-$${budgetMax}`,
      points_awarded: bScore,
      max_points: 15,
      reasoning: `Budget range: $${budgetMin}-$${budgetMax}`,
    });

    // Occasion (max 20)
    const occScores = {
      Anniversary: 20, Wedding: 20, Birthday: 18,
      Christmas: 16, Graduation: 18,
    };
    const oScore = formData.occasion ? (occScores[formData.occasion] || 12) : 0;
    totalScore += oScore;
    factors.push({
      factor_type: 'occasion',
      factor_value: formData.occasion || 'none',
      points_awarded: oScore,
      max_points: 20,
      reasoning: `Occasion: ${formData.occasion}`,
    });

    // Notes (max 20)
    let nScore = 0;
    const notes = formData.specialNotes || '';
    if (notes.length > 50) nScore = 20;
    else if (notes.length > 10) nScore = 15;
    totalScore += nScore;
    factors.push({
      factor_type: 'preference',
      factor_value: notes.length > 0 ? 'provided' : 'none',
      points_awarded: nScore,
      max_points: 20,
      reasoning: `${notes.length} chars of additional context`,
    });

    return {
      totalScore: Math.min(100, totalScore),
      factors: factors,
      maxPossible: 100,
    };
  }

  /**
   * Get history of past sessions
   */
  async getHistory(limit = 20) {
    try {
      return await GiftAPI.getSessionHistory(limit);
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}

export default GiftFlowController;