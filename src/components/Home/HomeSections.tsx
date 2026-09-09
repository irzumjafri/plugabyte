import Link from 'next/link';
import { BUILD_TYPES, type BuildTypeId } from '@/lib/estimator';
import { TEARDOWNS } from '@/lib/teardowns';
import Diagram from '@/components/Diagram';
import styles from './HomeSections.module.css';

interface Props {
  onStartHere: (id: BuildTypeId) => void;
}

/**
 * The brand voice says to lead with the failure the reader has already lived,
 * named in specifics. These are those specifics — the section exists to be
 * recognised, not admired.
 */
const FAILURES = [
  { when: 'Tokens expire', then: 'and nobody finds out until a customer does.' },
  { when: 'A webhook drops', then: 'and the order is simply never created.' },
  { when: 'A retry fires twice', then: 'and now there are two of everything.' },
  { when: 'Traffic triples', then: 'and the bill triples with it, quietly.' },
  { when: 'Something breaks at 2am', then: 'and no one is watching the logs.' },
];

export default function HomeSections({ onStartHere }: Props) {
  return (
    <div className={styles.main}>
      {/* Facts as a single mono line, not three cards pretending to be metrics. */}
      <section className={styles.factLine} aria-label="At a glance">
        <span><strong>14</strong> builds shipped</span>
        <span className={styles.factDot} aria-hidden="true">·</span>
        <span><strong>6</strong> build types scoped</span>
        <span className={styles.factDot} aria-hidden="true">·</span>
        <span>discovery spikes open <strong>this quarter</strong></span>
      </section>

      {/* The light ground from the brand palette. It is the one break in the
          dark, and it carries the thesis the whole agency is built on. */}
      <section className={styles.failure}>
        <div className={styles.failureInner}>
          <p className={styles.eyebrowInk}>Where builds die</p>
          <h2 className={styles.failureTitle}>
            The first 80% is nearly free now.<br />
            The last 20% is the part that pages you.
          </h2>
          <ul className={styles.failureList}>
            {FAILURES.map(f => (
              <li key={f.when} className={styles.failureItem}>
                <span className={styles.failureWhen}>{f.when}</span>
                <span className={styles.failureThen}>{f.then}</span>
              </li>
            ))}
          </ul>
          <p className={styles.failureClose}>
            None of it shows in a demo. All of it shows in production.
          </p>
        </div>
      </section>

      {/* A taxonomy, not a sequence — so it is an index, and deliberately not
          numbered. Six identical cards read as a wireframe. */}
      <section id="work" className={styles.section}>
        <p className={styles.eyebrow}>What we build</p>
        <h2 className={styles.sectionTitle}>
          Most of it starts from <em className={styles.em}>an empty repo.</em>
        </h2>
        <p className={styles.sectionLead}>
          New builds are the main thing we do — a product, an internal tool, an agent that does
          real work. Integration is one branch, not the category.
        </p>
        <ul className={styles.index}>
          {BUILD_TYPES.map(bt => (
            <li key={bt.id}>
              <button className={styles.indexRow} onClick={() => onStartHere(bt.id)}>
                <span className={styles.indexName}>{bt.label}</span>
                <span className={styles.indexBlurb}>{bt.blurb}</span>
                <span className={styles.indexGo} aria-hidden="true">Start here →</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.advisory}>
        <div className={styles.advisoryInner}>
          <p className={styles.eyebrow}>Advisory</p>
          <h2 className={styles.sectionTitleSmall}>
            Not sure where AI belongs in your business? <em className={styles.em}>That is a
            conversation, not a build.</em>
          </h2>
          <p className={styles.advisoryLead}>
            We look at how the work actually runs today and tell you where a model earns its
            keep — and where it would just add a way to be wrong. You get that answer whether
            or not you hire us to build anything.
          </p>
          <ul className={styles.advisoryList}>
            <li className={styles.advisoryItem}>
              <span className={styles.advisoryTerm}>What to automate</span>
              The steps that are repetitive, high volume, and cheap to check.
            </li>
            <li className={styles.advisoryItem}>
              <span className={styles.advisoryTerm}>What to leave alone</span>
              Anything where being confidently wrong costs more than being slow.
            </li>
            <li className={styles.advisoryItem}>
              <span className={styles.advisoryTerm}>What it costs to run</span>
              Not the build — the monthly bill once real volume goes through it.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.teardowns}>
        <div className={styles.teardownHead}>
          <p className={styles.eyebrow}>Work</p>
          <h2 className={styles.sectionTitleSmall}>Real builds, ugly parts included.</h2>
          <Link href="/work" className={styles.textLink}>See all four →</Link>
        </div>
        <ul className={styles.teardownList}>
          {TEARDOWNS.map(t => (
            <li key={t.title} className={styles.teardownItem}>
              <div className={styles.teardownMeta}>
                <span className={styles.teardownType}>{t.type}</span>
                <span className={styles.teardownEffort}>{t.effort}</span>
              </div>
              <p className={styles.teardownTitle}>{t.title}</p>
              {/* The line a case study normally leaves out. It is the reason
                  anyone believes the rest of the page. */}
              <p className={styles.teardownUgly}>{t.ugly}</p>
              <Diagram id={t.diagram} className={styles.teardownDiagram} />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.teaserGrid}>
        <Link href="/rescue" className={styles.teaser}>
          <p className={styles.teaserLabel}>Rescue</p>
          <p className={styles.teaserBody}>
            Production-readiness triage for something that already exists — and isn&apos;t ready yet.
          </p>
          <span className={styles.teaserGo}>See the checklist →</span>
        </Link>
        <Link href="/about" className={styles.teaser}>
          <p className={styles.teaserLabel}>About</p>
          <p className={styles.teaserBody}>
            Who builds this, what handover looks like, and what we don&apos;t take on.
          </p>
          <span className={styles.teaserGo}>Read the about page →</span>
        </Link>
      </section>
    </div>
  );
}
