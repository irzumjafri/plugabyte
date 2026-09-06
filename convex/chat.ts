import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Upserts the running transcript for a session. Called as the conversation
 * progresses, so abandoned funnels are recorded too — those are the ones that
 * say where people drop out, and they never reach the leads table.
 */
export const record = mutation({
  args: {
    sessionId: v.string(),
    buildType: v.optional(v.string()),
    answers: v.any(),
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    outcome: v.optional(v.string()),
    specId: v.optional(v.string()),
    effortLow: v.optional(v.number()),
    effortHigh: v.optional(v.number()),
    aiDriven: v.optional(v.boolean()),
    questionCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('chatSessions')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .unique()
      .catch(() => null);

    if (existing) {
      // Never downgrade a converted session back to an in-progress outcome.
      const outcome = existing.outcome === 'submitted' ? 'submitted' : args.outcome ?? existing.outcome;
      await ctx.db.patch(existing._id, { ...args, outcome, updatedAt: Date.now() });
      return existing._id;
    }
    return ctx.db.insert('chatSessions', { ...args, updatedAt: Date.now() });
  },
});
