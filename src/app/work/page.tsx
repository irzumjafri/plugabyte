import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TEARDOWNS } from '@/lib/teardowns';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Work | Plugabyte',
  description: 'Real builds, ugly parts included — one product, one AI agent, one integration, one rescue.',
};


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
