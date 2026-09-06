import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Work | Plugabyte',
  description: 'Real builds, ugly parts included — one product, one AI agent, one integration, one rescue.',
};

const TEARDOWNS = [
  {
    type: 'AI agent',
    effort: '7 weeks',
    title: 'A WhatsApp agent that survives real volume',
    summary: "A support bot for a regional retailer that had already burned one build on prompt-only logic. We replaced it with grounded retrieval, an eval harness and a human handoff path for anything the model shouldn't touch.",
    ugly: "The eval harness took longer than the agent itself — and is the only reason it didn't regress silently after the third prompt change.",
  },
  {
    type: 'Integration',
    effort: '4 weeks',
    title: 'Order sync between a storefront and a CRM that disagreed on "cancelled"',
    summary: 'Two systems that were supposed to be one workflow. Orders were duplicating on retries and refunds weren\'t reconciling.',
    ugly: 'Idempotency keys were missing on both ends. Fixing it meant a migration pass over three months of historical orders before the sync could go live.',
  },
  {
    type: 'Product build',
    effort: '9 weeks',
    title: 'An internal claims tool for a small insurer',
    summary: 'Three roles, a real approval workflow, and an audit trail required by a regulator who does actually read the logs.',
    ugly: 'The permission model was the real product. The screens were the easy 20%.',
  },
  {
    type: 'Prototype rescue',
    effort: '3 weeks',
    title: 'A Bolt-built booking app with no auth',
    summary: 'Worked perfectly in the demo. In production it had no rate limiting, no error states, and an admin route anyone could hit unauthenticated.',
    ugly: 'The database had been publicly readable for six weeks before anyone noticed. We rotated every credential on day one.',
  },
];

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <p className={styles.pretitle}>Work</p>
        <h1 className={styles.title}>Real builds. Ugly parts included.</h1>
        <p className={styles.lead}>
          Four, spanning the range on purpose — a product, an agent, an integration, a rescue. Depth beats breadth; twelve thin case studies would say less than these four.
        </p>

        {TEARDOWNS.map(t => (
          <div key={t.title} className={styles.item}>
            <div className={styles.itemMeta}>
              <span className={styles.itemType}>{t.type}</span>
              <p className={styles.itemEffort}>{t.effort}</p>
            </div>
            <div>
              <h2 className={styles.itemTitle}>{t.title}</h2>
              <p className={styles.itemSummary}>{t.summary}</p>
              <p className={styles.itemUgly}><strong>The ugly part: </strong>{t.ugly}</p>
            </div>
          </div>
        ))}

        <Link href="/" className={styles.cta}>Start scoping yours →</Link>
      </main>
      <Footer />
    </div>
  );
}
