import type { Metadata } from 'next';
import Link from 'next/link';
import EmailLink from '@/components/EmailLink';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Diagram from '@/components/Diagram';
import Annotation from '@/components/Scene/Annotation';
import SceneHero from '@/components/Scene/SceneHero';
import GhostStage from '@/components/Scene/GhostStage';
import { TEARDOWNS } from '@/lib/teardowns';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Work',
  description: "Real builds, ugly parts included — one product, one AI agent, one integration, one rescue.",
  alternates: { canonical: '/work' },
  openGraph: {
    type: 'website',
    url: '/work',
    title: 'Work | Plugabyte',
    description: "Real builds, ugly parts included — one product, one AI agent, one integration, one rescue.",
    images: [{ url: '/scenes/about-boards.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Work | Plugabyte',
    description: "Real builds, ugly parts included — one product, one AI agent, one integration, one rescue.",
    images: ['/scenes/about-boards.jpg'],
  },
};

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main>
        <SceneHero
        src="/scenes/about-boards.jpg"
        alt=""
        side="left"
        objectPosition="78% center"
        note={<Annotation arrow="down-left" onArt>Small steps.<br />Bigger things.</Annotation>}
      >
        <div>
          <p className={styles.pretitle}>Work</p>
          <h1 className={styles.title}>
            Real builds.
            <br />
            <span className={styles.titleAccent}>Ugly parts included.</span>
          </h1>
          <p className={styles.lead}>
            Four, spanning the range on purpose — a product, an agent, an integration, a
            rescue. Depth beats breadth.
          </p>
        </div>
        </SceneHero>
        <div className={styles.main}>
        <div className={styles.studies}>
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
                <figure className={styles.itemFigure}>
                  {t.image
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={t.image.src} alt={t.image.alt} className={styles.itemShot} />
                    : <Diagram id={t.diagram} />}
                  <figcaption className={styles.itemCaption}>
                    {t.image ? t.image.alt : 'How it fits together — the part in red is the part that hurt.'}
                  </figcaption>
                </figure>
              </div>
            </div>
          ))}
        </div>

        </div>

        <section className={styles.close}>
          <div className={styles.closeInner}>
            <p className={styles.closeEyebrow}>Yours is next</p>
            <h2 className={styles.closeTitle}>
              Tell us what you&apos;re building.
              <br />
              <span className={styles.titleAccent}>We&apos;ll tell you what it takes.</span>
            </h2>
            <p className={styles.closeLead}>
              A few questions, then effort in weeks — and the ugly parts named up front,
              the way they are on this page.
            </p>
            <Link href="/?chat=1" className={styles.closeCta}>
              Start scoping yours <span aria-hidden="true">→</span>
            </Link>
            <EmailLink className={styles.closeEmail} subject={'Scoping a build'} />
          </div>
          <GhostStage className={styles.closeGhost} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
