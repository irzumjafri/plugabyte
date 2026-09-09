import type { DiagramId } from '@/components/Diagram';

export interface Teardown {
  type: string;
  effort: string;
  title: string;
  summary: string;
  /** The part a case study usually leaves out. */
  ugly: string;
  /** Schematic of the system described above. */
  diagram: DiagramId;
  /**
   * A real screenshot, once one is cleared to publish. When set it replaces the
   * schematic — a diagram is a stand-in for a photograph of the work, not a
   * preference. Put files in public/work/.
   */
  image?: { src: string; alt: string };
}

/**
 * Single source for the case studies. The homepage teaser used to carry its own
 * copy of the type/effort/title, so editing one silently desynced it from
 * /work — the teaser could advertise a build the page no longer described.
 */
export const TEARDOWNS: Teardown[] = [
  {
    type: 'AI agent',
    effort: '7 weeks',
    title: 'A WhatsApp agent that survives real volume',
    summary: "A support bot for a regional retailer that had already burned one build on prompt-only logic. We replaced it with grounded retrieval, an eval harness and a human handoff path for anything the model shouldn't touch.",
    ugly: "The eval harness took longer than the agent itself — and is the only reason it didn't regress silently after the third prompt change.",
    diagram: 'agent',
  },
  {
    type: 'Integration',
    effort: '4 weeks',
    title: 'Order sync between a storefront and a CRM that disagreed on "cancelled"',
    summary: 'Two systems that were supposed to be one workflow. Orders were duplicating on retries and refunds weren\'t reconciling.',
    ugly: 'Idempotency keys were missing on both ends. Fixing it meant a migration pass over three months of historical orders before the sync could go live.',
    diagram: 'sync',
  },
  {
    type: 'Product build',
    effort: '9 weeks',
    title: 'An internal claims tool for a small insurer',
    summary: 'Three roles, a real approval workflow, and an audit trail required by a regulator who does actually read the logs.',
    ugly: 'The permission model was the real product. The screens were the easy 20%.',
    diagram: 'roles',
  },
  {
    type: 'Prototype rescue',
    effort: '3 weeks',
    title: 'A Bolt-built booking app with no auth',
    summary: 'Worked perfectly in the demo. In production it had no rate limiting, no error states, and an admin route anyone could hit unauthenticated.',
    ugly: 'The database had been publicly readable for six weeks before anyone noticed. We rotated every credential on day one.',
    diagram: 'exposed',
  },
];
