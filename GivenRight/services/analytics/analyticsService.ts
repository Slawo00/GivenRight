/**
 * Analytics Service — Track usage, patterns, and optimize recommendations
 * Privacy-first: all data stays on device via AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = 'givenright_analytics';

export interface AnalyticsEvent {
  type: EventType;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export type EventType =
  | 'session_start'
  | 'input_complete'
  | 'direction_selected'
  | 'pattern_selected'
  | 'product_viewed'
  | 'product_clicked'
  | 'ai_recommendation_viewed'
  | 'ai_recommendation_clicked'
  | 'share_initiated'
  | 'share_completed'
  | 'decision_completed'
  | 'decision_reset';

export interface AnalyticsSnapshot {
  totalSessions: number;
  totalDecisions: number;
  totalProductClicks: number;
  totalShares: number;
  avgSessionDurationMs: number;
  topPatterns: { pattern: string; count: number }[];
  topDirections: { direction: string; count: number }[];
  conversionRate: number; // sessions that reach product click / total sessions
  events: AnalyticsEvent[];
}

let sessionEvents: AnalyticsEvent[] = [];
let sessionStartTime: number = Date.now();

/**
 * Track an analytics event
 */
export function trackEvent(type: EventType, metadata?: Record<string, string | number>): void {
  const event: AnalyticsEvent = {
    type,
    timestamp: new Date().toISOString(),
    metadata,
  };
  sessionEvents.push(event);

  // Persist async (fire and forget)
  persistEvent(event).catch(() => {});
}

/**
 * Start a new analytics session
 */
export function startSession(): void {
  sessionEvents = [];
  sessionStartTime = Date.now();
  trackEvent('session_start');
}

/**
 * Get analytics snapshot (aggregated stats)
 */
export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const allEvents = await loadAllEvents();

  const sessions = allEvents.filter(e => e.type === 'session_start').length;
  const decisions = allEvents.filter(e => e.type === 'decision_completed').length;
  const productClicks = allEvents.filter(e => e.type === 'product_clicked').length;
  const shares = allEvents.filter(e => e.type === 'share_completed').length;

  // Top patterns
  const patternCounts: Record<string, number> = {};
  allEvents
    .filter(e => e.type === 'pattern_selected' && e.metadata?.pattern)
    .forEach(e => {
      const p = String(e.metadata!.pattern);
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    });
  const topPatterns = Object.entries(patternCounts)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top directions
  const dirCounts: Record<string, number> = {};
  allEvents
    .filter(e => e.type === 'direction_selected' && e.metadata?.direction)
    .forEach(e => {
      const d = String(e.metadata!.direction);
      dirCounts[d] = (dirCounts[d] || 0) + 1;
    });
  const topDirections = Object.entries(dirCounts)
    .map(([direction, count]) => ({ direction, count }))
    .sort((a, b) => b.count - a.count);

  // Avg session duration (rough estimate based on session_start → decision_completed pairs)
  let totalDuration = 0;
  let durationCount = 0;
  const sessionStarts = allEvents.filter(e => e.type === 'session_start');
  const sessionEnds = allEvents.filter(e => e.type === 'decision_completed');
  for (let i = 0; i < Math.min(sessionStarts.length, sessionEnds.length); i++) {
    const start = new Date(sessionStarts[i].timestamp).getTime();
    const end = new Date(sessionEnds[i].timestamp).getTime();
    if (end > start && end - start < 3600000) { // max 1h
      totalDuration += end - start;
      durationCount++;
    }
  }

  return {
    totalSessions: sessions,
    totalDecisions: decisions,
    totalProductClicks: productClicks,
    totalShares: shares,
    avgSessionDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    topPatterns,
    topDirections,
    conversionRate: sessions > 0 ? Math.round((productClicks / sessions) * 100) : 0,
    events: allEvents.slice(-50), // last 50 events
  };
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics(): Promise<void> {
  await AsyncStorage.removeItem(ANALYTICS_KEY);
  sessionEvents = [];
}

// ---- Persistence ----

async function persistEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events: AnalyticsEvent[] = existing ? JSON.parse(existing) : [];
    events.push(event);

    // Keep max 500 events
    const trimmed = events.length > 500 ? events.slice(-500) : events;
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Silent fail — analytics should never break the app
  }
}

async function loadAllEvents(): Promise<AnalyticsEvent[]> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}