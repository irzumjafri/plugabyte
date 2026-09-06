import { mutation } from './_generated/server';
import { v } from 'convex/values';

/** Records one event. Fire-and-forget from the client via /api/events. */
export const track = mutation({
  args: {
    name: v.string(),
    sessionId: v.optional(v.string()),
    path: v.optional(v.string()),
    props: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('events', args);
  },
});
