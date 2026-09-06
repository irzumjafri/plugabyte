import { query } from './_generated/server';

/**
 * The numbers an on-site admin will want first: how many conversations start,
 * how many reach an estimate, and how many turn into briefs. Reads only what it
 * counts, so it stays cheap while volume is low.
 */
export const funnel = query({
  args: {},
  handler: async ctx => {
    const sessions = await ctx.db.query('chatSessions').collect();
    const leads = await ctx.db.query('leads').collect();

    const byBuildType: Record<string, number> = {};
    for (const session of sessions) {
      const key = session.buildType ?? 'unclassified';
      byBuildType[key] = (byBuildType[key] ?? 0) + 1;
    }

    return {
      conversations: sessions.length,
      reachedEstimate: sessions.filter(s => s.specId).length,
      submitted: leads.length,
      abandoned: sessions.filter(s => s.outcome !== 'submitted').length,
      byBuildType,
    };
  },
});
