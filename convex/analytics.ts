import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Read-side for traffic. The events table was being written to and never read,
 * so nobody could answer "which pages get visits, and where do they come from"
 * without opening the Convex dashboard and eyeballing rows.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Views per path, plus how many distinct sessions reached each one. */
export const trafficByPath = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const since = Date.now() - days * DAY_MS;
    const events = await ctx.db
      .query('events')
      .filter(q => q.gte(q.field('_creationTime'), since))
      .collect();

    const byPath = new Map<string, { views: number; sessions: Set<string> }>();
    for (const e of events) {
      if (e.name !== 'page_view') continue;
      const path = e.path ?? '(unknown)';
      const row = byPath.get(path) ?? { views: 0, sessions: new Set<string>() };
      row.views++;
      if (e.sessionId) row.sessions.add(e.sessionId);
      byPath.set(path, row);
    }

    return [...byPath.entries()]
      .map(([path, r]) => ({ path, views: r.views, sessions: r.sessions.size }))
      .sort((a, b) => b.views - a.views);
  },
});

/** Where visits came from, and which page search actually landed them on. */
export const trafficBySource = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const since = Date.now() - days * DAY_MS;
    const events = await ctx.db
      .query('events')
      .filter(q => q.gte(q.field('_creationTime'), since))
      .collect();

    // One row per session, not per view, or a visitor who reads four pages
    // counts as four referrals from the same place.
    const perSession = new Map<string, { channel: string; source: string; landing: string }>();
    for (const e of events) {
      if (e.name !== 'page_view' || !e.sessionId) continue;
      if (perSession.has(e.sessionId)) continue;
      const p = (e.props ?? {}) as Record<string, string | undefined>;
      perSession.set(e.sessionId, {
        channel: p.channel ?? 'unknown',
        source: p.source ?? 'unknown',
        landing: p.landing ?? e.path ?? '(unknown)',
      });
    }

    const grouped = new Map<string, { channel: string; source: string; sessions: number; landings: Record<string, number> }>();
    for (const s of perSession.values()) {
      const key = `${s.channel}|${s.source}`;
      const row = grouped.get(key) ?? { channel: s.channel, source: s.source, sessions: 0, landings: {} };
      row.sessions++;
      row.landings[s.landing] = (row.landings[s.landing] ?? 0) + 1;
      grouped.set(key, row);
    }

    return [...grouped.values()].sort((a, b) => b.sessions - a.sessions);
  },
});

/**
 * How far people get: view → chat opened → spec produced → brief sent.
 *
 * These strings must match what src/lib/track.ts callers actually fire. The
 * canonical set today is: page_view, chat_started, question_answered,
 * answered_in_own_words, spec_generated, offered_call, disqualified,
 * lead_submitted, lead_submit_failed. This query asked for "spec_ready", which
 * nothing emits, so the spec stage silently read zero.
 */
export const funnel = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const since = Date.now() - days * DAY_MS;
    const events = await ctx.db
      .query('events')
      .filter(q => q.gte(q.field('_creationTime'), since))
      .collect();

    const stage = (name: string) =>
      new Set(events.filter(e => e.name === name && e.sessionId).map(e => e.sessionId!)).size;

    return {
      visited: stage('page_view'),
      startedChat: stage('chat_started'),
      gotSpec: stage('spec_generated'),
      sentBrief: stage('lead_submitted'),
    };
  },
});
