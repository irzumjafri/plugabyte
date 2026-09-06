import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const message = v.object({
  role: v.string(),
  content: v.string(),
});

/**
 * Everything the site records lives here: leads, the chat behind them, and raw
 * events. Convex stamps `_creationTime` on every document, so nothing carries
 * its own createdAt.
 */
export default defineSchema({
  /** A brief someone actually sent us. Contact details only exist here. */
  leads: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    // The PB-XXXXXX reference the prospect sees and quotes back at us.
    specId: v.optional(v.string()),
    buildType: v.optional(v.string()),
    answers: v.any(),
    effortLow: v.optional(v.number()),
    effortHigh: v.optional(v.number()),
    conversation: v.array(message),
    sessionId: v.optional(v.string()),
    channel: v.string(),
  })
    .index('by_spec', ['specId'])
    .index('by_email', ['email'])
    .index('by_session', ['sessionId']),

  /**
   * Every scoping conversation, including the ones nobody submits — which is
   * most of them, and the only way to see where the funnel actually loses
   * people. Keyed by an anonymous session id and holds no contact details.
   */
  chatSessions: defineTable({
    sessionId: v.string(),
    buildType: v.optional(v.string()),
    answers: v.any(),
    messages: v.array(message),
    // ready | disqualified | offerCall | submitted
    outcome: v.optional(v.string()),
    specId: v.optional(v.string()),
    effortLow: v.optional(v.number()),
    effortHigh: v.optional(v.number()),
    // False once the model drops out and the scripted branch takes over.
    aiDriven: v.optional(v.boolean()),
    questionCount: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('by_session', ['sessionId']),

  /** Raw event stream — page views, funnel steps, anything worth counting. */
  events: defineTable({
    name: v.string(),
    sessionId: v.optional(v.string()),
    path: v.optional(v.string()),
    props: v.optional(v.any()),
  })
    .index('by_name', ['name'])
    .index('by_session', ['sessionId']),
});
