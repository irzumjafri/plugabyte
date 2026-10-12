import { describe, it, expect } from 'vitest';
import { TESTIMONIALS, publishedTestimonials, type Testimonial } from './testimonials';

const real: Testimonial = {
  quote: 'A real quote.', name: 'A Person', role: 'CTO', company: 'Somewhere',
};
const placeholder: Testimonial = { ...real, placeholder: true };

describe('publishedTestimonials', () => {
  // The whole point: template copy must not be able to ship as an endorsement.
  it('drops placeholders in production', () => {
    expect(publishedTestimonials([real, placeholder], true)).toEqual([real]);
  });

  it('keeps them in development so the section can be laid out', () => {
    expect(publishedTestimonials([real, placeholder], false)).toHaveLength(2);
  });

  it('publishes nothing while every entry is still a placeholder', () => {
    expect(publishedTestimonials(TESTIMONIALS, true)).toEqual([]);
  });

  it('every entry carries an attribution', () => {
    for (const t of TESTIMONIALS) {
      expect(t.quote.length).toBeGreaterThan(20);
      expect(t.name).toBeTruthy();
      expect(t.company).toBeTruthy();
    }
  });
});
