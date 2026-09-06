import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Stores a submitted brief. Called from the server route, which has already
 * validated the email and capped the transcript.
 */
export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    specId: v.optional(v.string()),
    buildType: v.optional(v.string()),
    answers: v.any(),
    effortLow: v.optional(v.number()),
    effortHigh: v.optional(v.number()),
    conversation: v.array(v.object({ role: v.string(), content: v.string() })),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert('leads', { ...args, channel: 'web' });

    // Mark the conversation as converted so funnel counts do not have to join
    // across tables to work out which sessions ended in a brief.
    if (args.sessionId) {
      const session = await ctx.db
        .query('chatSessions')
        .withIndex('by_session', q => q.eq('sessionId', args.sessionId!))
        .unique()
        .catch(() => null);
      if (session) await ctx.db.patch(session._id, { outcome: 'submitted', updatedAt: Date.now() });
    }

    await ctx.db.insert('events', {
      name: 'lead_submitted',
      sessionId: args.sessionId,
      props: { specId: args.specId, buildType: args.buildType },
    });

    return leadId;
  },
});
