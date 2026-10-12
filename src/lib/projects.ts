/**
 * Real work. Every entry here is something that exists and can be opened.
 *
 * This replaced a set of invented "concept products" — fictional names with
 * fabricated UI mockups — which looked convincing and proved nothing. Status is
 * stated on every card rather than implied, because the difference between a
 * paying client and our own product matters to someone deciding whether to
 * hire us, and blurring it would be the exact dishonesty the rest of the site
 * argues against.
 */
export type ProjectKind = 'Client work' | 'Plugabyte product';

export interface Project {
  slug: string;
  name: string;
  kind: ProjectKind;
  /** Where it actually is: shipped, in beta, still being built. */
  status: string;
  tagline: string;
  blurb: string;
  /** What is technically interesting — the reason an engineer would care. */
  detail?: string;
  image?: string;
  href?: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'biobyte',
    name: 'Bio-Byte Life Sciences',
    kind: 'Client work',
    status: 'Live',
    tagline: 'Where biology meets commerce.',
    blurb:
      'A site for a multichannel healthcare company reaching 9,000+ healthcare professionals through 100+ field reps across 12 countries. Built to carry a pharmaceutical portfolio and a commercial story without reading like a brochure.',
    detail: 'Next.js, scroll-driven sections, a services model that survives a growing portfolio.',
    image: '/work/biobyte.jpg',
    href: 'https://biobyte-sage.vercel.app',
  },
  {
    slug: 'saluki',
    name: 'Saluki',
    kind: 'Plugabyte product',
    status: 'Pre-launch · waitlist open',
    tagline: 'Your backend, watched while you sleep.',
    blurb:
      "An AI QA engineer that lives in your cloud and notices the jobs that quietly stop running. Most outages never throw an error — a cron stops after a deploy and the dashboards stay green.",
    detail:
      'Learns each cron, Lambda and queue worker’s normal duration and volume, then flags missed, empty and slow runs on Slack or WhatsApp within a minute.',
    image: '/work/saluki.jpg',
    href: 'https://saluki-qa.vercel.app',
  },
  {
    slug: 'blueprint',
    name: 'Construction Blueprint',
    kind: 'Client work',
    status: 'In progress',
    // Client name withheld at their request. The screenshot is the design
    // system view with the job reference redacted and the title block — which
    // carried the job number, estimator and client badge — cropped away.
    tagline: 'From a drawing pack to a priced quote.',
    blurb:
      'An estimating tool for a UK construction firm: organise drawing sheets, calibrate scale, measure by hand, price from a rate library through approved assemblies, resolve queries, pass a review gate, and export the quote.',
    detail:
      'AI proposes, the human decides — every proposal carries a confidence level and a plain reason, and nothing reaches a quote until someone accepts it.',
    image: '/work/blueprint.jpg',
  },
  {
    slug: 'invincible-xi',
    name: 'Invincible XI',
    kind: 'Plugabyte product',
    status: 'In development',
    tagline: 'Pack. Pick. Prove it.',
    blurb:
      'Draft a legendary XI from a real season, then play out a full league or knockout run and see how close you get to a perfect record. Ten leagues, any era, online multiplayer.',
    detail:
      'A five-layer simulation engine — possession-by-possession matches, seeded so a shared seed replays identically for both players. Multiplayer runs on Postgres and Realtime.',
    image: '/work/invincible-xi.jpg',
  },
];
