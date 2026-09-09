/**
 * Concept projects.
 *
 * Explicitly not client work — the comps frame these as "a few things we could
 * put into the world", and that framing is load-bearing: it lets us show
 * polished product surfaces without implying anyone paid for them. The real,
 * shipped builds live in `teardowns.ts` and stay on /work.
 */
export interface Concept {
  slug: string;
  name: string;
  kind: string;
  tagline: string;
  blurb: string;
  /** Set once a plate exists in public/scenes. */
  image?: string;
}

export const CONCEPTS: Concept[] = [
  {
    slug: 'folio',
    name: 'folio',
    kind: 'Claims platform',
    tagline: 'Less chasing. More claims closed.',
    blurb: 'An insurance claims workspace built for people. Clearer context, faster outcomes, happier everyone.',
    image: '/scenes/folio.jpg',
  },
  {
    slug: 'relay',
    name: 'relay',
    kind: 'Support platform',
    tagline: 'A more human kind of support.',
    blurb: 'WhatsApp-style support for growing brands. Fast answers, happier customers, healthier teams.',
  },
  {
    slug: 'conduit',
    name: 'conduit',
    kind: 'Integration platform',
    tagline: 'Two systems. Finally on speaking terms.',
    blurb: 'Connect your tools. Unblock your team. Less manual work, more momentum.',
  },
  {
    slug: 'daybreak',
    name: 'daybreak',
    kind: 'Booking platform',
    tagline: 'A fresh start for a promising product.',
    blurb: 'A modern booking experience for independent studios, coaches and creators.',
  },
];
