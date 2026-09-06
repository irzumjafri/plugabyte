import Link from 'next/link';
import { BUILD_TYPES, type BuildTypeId } from '@/lib/estimator';
import styles from './HomeSections.module.css';

interface Props {
  onStartHere: (id: BuildTypeId) => void;
}

const PROOF = [
  { value: '14', label: 'Builds shipped' },
  { value: 'Now booking', label: 'Discovery spikes for this quarter' },
  { value: 'Solo, expanding', label: 'Named agency, first line of support' },
];

const TEARDOWNS = [
  { type: 'AI agent', effort: '7 weeks', title: 'A WhatsApp agent that survives real volume' },
  { type: 'Integration', effort: '4 weeks', title: 'Order sync between a storefront and a CRM that disagreed on "cancelled"' },
  { type: 'Product build', effort: '9 weeks', title: 'An internal claims tool for a small insurer' },
  { type: 'Prototype rescue', effort: '3 weeks', title: 'A Bolt-built booking app with no auth' },
];

export default function HomeSections({ onStartHere }: Props) {
  return (
    <main className={styles.main}>
      <section className={styles.proof}>
        {PROOF.map(p => (
          <div key={p.label} className={styles.proofCard}>
            <p className={styles.proofValue}>{p.value}</p>
            <p className={styles.proofLabel}>{p.label}</p>
          </div>
        ))}
      </section>

      <section id="work" className={styles.section}>
        <p className={styles.pretitle}>What plugabyte builds</p>
        <h2 className={styles.sectionTitle}>Six types. Integration is one branch, not the category.</h2>
        <div className={styles.typesGrid}>
          {BUILD_TYPES.map(bt => (
            <div key={bt.id} className={styles.typeCard}>
              <p className={styles.typeTitle}>{bt.label}</p>
              <p className={styles.typeDesc}>{bt.blurb}</p>
              <button className={styles.typeLink} onClick={() => onStartHere(bt.id)}>Start here →</button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.teardownTeaser}>
        <div className={styles.teardownIntro}>
          <p className={styles.pretitle}>Work</p>
          <h2 className={styles.sectionTitleSmall}>Real builds, ugly parts included.</h2>
          <p className={styles.teardownDesc}>One product, one AI agent, one integration, one rescue — spanning the range on purpose.</p>
          <Link href="/work" className={styles.teardownAll}>See all four →</Link>
        </div>
        <div className={styles.teardownList}>
          {TEARDOWNS.map(t => (
            <div key={t.title} className={styles.teardownItem}>
              <span className={styles.teardownType}>{t.type}</span>
              <p className={styles.teardownTitle}>{t.title}</p>
              <span className={styles.teardownEffort}>{t.effort}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.teaserGrid}>
        <div className={styles.teaserCard}>
          <p className={styles.teaserLabel}>Rescue</p>
          <p className={styles.teaserBody}>Production-readiness triage for something that already exists — and isn&apos;t ready yet.</p>
          <Link href="/rescue" className={styles.teaserLink}>See the checklist →</Link>
        </div>
        <div className={styles.teaserCard}>
          <p className={styles.teaserLabel}>About</p>
          <p className={styles.teaserBody}>Who builds this, what handover looks like, and what we don&apos;t take on.</p>
          <Link href="/about" className={styles.teaserLink}>Read the about page →</Link>
        </div>
      </section>
    </main>
  );
}
