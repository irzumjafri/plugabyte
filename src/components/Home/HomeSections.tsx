import Link from 'next/link';
import Image from 'next/image';
import { CONCEPTS } from '@/lib/concepts';
import Annotation from '@/components/Scene/Annotation';
import styles from './HomeSections.module.css';

/** The three things the exploded plate is actually showing. */
const LAYERS = ['Auth that holds.', 'Retries that recover.', 'Someone watching.'];

export default function HomeSections() {
  return (
    <div className={styles.main}>
      {/* Light ground, per the comps — the page alternates rather than running
          dark the whole way down. */}
      <section id="work" className={styles.concepts}>
        <div className={styles.conceptsHead}>
          <div>
            <p className={styles.eyebrowInk}>Concept projects</p>
            <h2 className={styles.titleInk}>
              A few things we could<br />put into the world.
            </h2>
          </div>
          <Image
            className={styles.shelf}
            src="/scenes/work-shelf.jpg"
            alt="Four project volumes stacked on a desk: relay, folio, conduit, daybreak."
            width={1130}
            height={930}
            sizes="(max-width: 860px) 100vw, 340px"
          />
          <p className={styles.headAside}>
            Real problems. Thoughtful products.<br />Built end to end.
            <span className={styles.rule} aria-hidden="true" />
          </p>
        </div>

        <ul className={styles.conceptGrid}>
          {CONCEPTS.map((c, i) => (
            <li key={c.slug} className={i < 2 ? styles.conceptCardWide : styles.conceptCard}>
              {c.image && (
                <Image
                  className={styles.conceptShot}
                  src={c.image}
                  alt={`${c.name} — ${c.tagline}`}
                  width={1262}
                  height={668}
                  sizes="(max-width: 860px) 100vw, (max-width: 1200px) 50vw, 560px"
                />
              )}
              <div className={styles.conceptText}>
                <p className={styles.conceptName}>{c.name}</p>
                <p className={styles.conceptTagline}>{c.tagline}</p>
                <p className={styles.conceptBlurb}>{c.blurb}</p>
                <span className={styles.conceptKind}>{c.kind}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.lastTwenty}>
        <div className={styles.lastInner}>
          <div className={styles.lastCopy}>
            <h2 className={styles.titleLight}>
              The last 20%<br />is the job.
            </h2>
            <p className={styles.lastLead}>
              Ideas are easy. Shipping takes engineering. We handle the messy part — so it
              works in the real world, for real people.
            </p>
            <ul className={styles.layers}>
              {LAYERS.map(l => <li key={l}>{l}</li>)}
            </ul>
          </div>
          <div className={styles.lastArt}>
            <Image
              src="/scenes/exploded-layers.jpg"
              alt="A system shown as separated layers: enclosure, boards, power, storage."
              width={1672}
              height={941}
              sizes="(max-width: 900px) 100vw, 620px"
            />
          </div>
        </div>
      </section>

      {/* The light-blue close from the comps. */}
      <section className={styles.close}>
        <div className={styles.closeInner}>
          <p className={styles.eyebrowInk}>Let&apos;s build together</p>
          <h2 className={styles.titleInk}>
            Something in mind?<br />Let&apos;s make it real.
          </h2>
          <Link href="/?chat=1" className={styles.closeLink}>Get in touch →</Link>
        </div>
        <Annotation className={styles.closeNote}>Same<br />brighter<br />tomorrow.</Annotation>
      </section>
    </div>
  );
}
