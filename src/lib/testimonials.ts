/**
 * Client testimonials.
 *
 * Entries marked `placeholder` are template copy for laying the section out —
 * deliberately attributed to "Client name" rather than to an invented person,
 * so nothing here can be mistaken for a real endorsement. `publishedTestimonials`
 * drops them from production builds, so the section simply does not render until
 * real, permitted quotes replace them.
 *
 * To publish: replace the quote, name, role and company with the real ones and
 * delete the `placeholder` flag.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  placeholder?: true;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'They found the failure mode three other teams had walked past, and told us about it before we had signed anything.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    placeholder: true,
  },
  {
    quote:
      'The eval harness is the reason we trust it. We change a prompt and we know within minutes whether anything regressed.',
    name: 'Client name',
    role: 'Role',
    company: 'Company',
    placeholder: true,
  },
];

/** What the site is allowed to show. Placeholders never reach production. */
export function publishedTestimonials(
  all: Testimonial[] = TESTIMONIALS,
  isProduction: boolean = process.env.NODE_ENV === 'production',
): Testimonial[] {
  return isProduction ? all.filter(t => !t.placeholder) : all;
}
