'use client';

import { setConsent, useConsent } from '@/lib/consent';
import styles from './CookieConsent.module.css';

/**
 * Asks before any analytics cookie is set.
 *
 * Not a modal: it must not trap focus or block the page, because someone who
 * ignores it should still be able to read the site — and under GDPR, carrying
 * on browsing is not consent, so ignoring it has to mean "no analytics" rather
 * than "yes by default".
 */
export default function CookieConsent() {
  const consent = useConsent();

  // Only while undecided. A declined choice is remembered, not re-asked.
  if (consent !== null) return null;

  return (
    <section className={styles.bar} role="region" aria-label="Cookie choices">
      <p className={styles.copy}>
        We&apos;d like to use Google Analytics to see which pages people actually read.
        It sets cookies. Everything we need to run the site works without it.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.decline}
          onClick={() => setConsent('denied')}
        >
          No thanks
        </button>
        <button
          type="button"
          className={styles.accept}
          onClick={() => setConsent('granted')}
        >
          Allow analytics
        </button>
      </div>
    </section>
  );
}
