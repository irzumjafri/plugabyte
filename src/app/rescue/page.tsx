import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Annotation from '@/components/Scene/Annotation';
import GhostStage from '@/components/Scene/GhostStage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SceneHero from '@/components/Scene/SceneHero';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Prototype rescue | Plugabyte',
  description: "Production-readiness triage for a prototype that already exists and isn't production-ready yet.",
};

const CHECKS = [
  { n: '01', title: 'Auth', desc: "Real sessions, not a client-side flag. Password reset that can't be used to take over an account." },
  { n: '02', title: 'Secrets', desc: 'Nothing in the client bundle, nothing in the repo history, nothing in a public bucket.' },
  { n: '03', title: 'Error states', desc: 'What the user sees when the network drops, the API 500s, or the payment fails mid-flow.' },
  { n: '04', title: 'Rate limits', desc: "What stops one script from taking down the app, or running up the AI bill." },
  { n: '05', title: 'Data integrity', desc: 'Idempotency on writes, constraints that actually constrain, backups that have been restored at least once.' },
  { n: '06', title: 'Observability', desc: 'Whether anyone finds out before the customer does.' },
  { n: '07', title: 'Behaviour at 100× volume', desc: 'What breaks first when ten users becomes a thousand, and whether it fails loud or fails quiet.' },
];

const AI_SET = [
  { title: 'Evals', desc: 'The line between a demo and a product.' },
  { title: 'Prompt versioning', desc: 'What happens to behaviour when a prompt changes.' },
  { title: 'Human handoff', desc: "The escalation path when the model shouldn't answer." },
  { title: 'Cost at volume', desc: 'Modelled at real traffic, not demo traffic.' },
  { title: 'Grounding & containment', desc: "What it does when it's wrong in front of a customer." },
];

export default function RescuePage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main>
        <SceneHero
        src="/scenes/rescue-bridge.jpg"
        alt=""
        side="left"
        minHeight="min(74vh, 620px)"
        objectPosition="70% 62%"
        scrim="heavy"
      >
        <div>
          <p className={styles.pretitle}>Prototype rescue</p>
          <h1 className={styles.title}>
            Good idea.
            <br />
            <span className={styles.titleAccent}>Rough landing?</span>
          </h1>
          <p className={styles.lead}>
            The demo worked. Then real users arrived. Let&apos;s get it back on its feet.
          </p>
          <Link href="/?type=rescue" className={styles.heroCta}>
            Tell us what&apos;s broken <span aria-hidden="true">↗</span>
          </Link>
          <ul className={styles.steps}>
            {['Debug', 'Stabilize', 'Scale', 'Get back to building'].map(x => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <Annotation className={styles.heroNote} arrow="down-left" onArt>
          Same idea.<br />Stronger tomorrow.
        </Annotation>
        </SceneHero>
        <div className={styles.main}>
        <section className={styles.checks}>
          <p className={styles.checksLabel}>Inside the fix</p>
          <h2 className={styles.checksTitle}>
            Under the hood.
            <br />
            <span className={styles.titleAccentInk}>Nothing skipped.</span>
          </h2>
          <div className={styles.checksLayout}>
            <Image
              className={styles.checksArt}
              src="/scenes/rescue-tower.jpg"
              alt="A system drawn as stacked floors: product and UI, API layer, business logic, data, infrastructure, monitoring."
              width={942}
              height={810}
              sizes="(max-width: 900px) 100vw, 420px"
            />
          <div className={styles.checksBox}>
            {CHECKS.map((c, i) => (
              <details key={c.n} className={styles.check} open={i === 0}>
                <summary className={styles.checkSummary}>
                  <span className={styles.checkNum}>{c.n}</span>
                  <span className={styles.checkTitle}>{c.title}</span>
                  <span className={styles.checkSign} aria-hidden="true" />
                </summary>
                <p className={styles.checkDesc}>{c.desc}</p>
              </details>
            ))}
          </div>
          </div>
          <Annotation className={styles.checksNote}>Details make ideas endure.</Annotation>
        </section>

        <div className={styles.aiBox}>
          <p className={styles.aiLabel}>For AI builds — the five-item set</p>
          <div className={styles.aiGrid}>
            {AI_SET.map(a => (
              <div key={a.title}>
                <p className={styles.aiTitle}>{a.title}</p>
                <p className={styles.aiDesc}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <section className={styles.realRescue}>
          <div className={styles.realCopy}>
            <p className={styles.pretitle}>A real rescue</p>
            <h2 className={styles.realTitle}>
              Keep the idea.
              <br />
              <span className={styles.titleAccent}>Fix the foundations.</span>
            </h2>
            <p className={styles.lead}>
              A promising booking product where real users exposed breaking issues. We
              stabilised the core, improved reliability and shipped a production-ready
              experience — without losing what made it special.
            </p>
          </div>
          <figure className={styles.realArt}>
            <Image
              src="/scenes/rescue-ba.jpg"
              alt="The same product before and after: a crashed error screen, then a working bookings calendar."
              width={1244}
              height={476}
              sizes="(max-width: 900px) 100vw, 640px"
            />
            <figcaption className={styles.realCaption}>Before, and after.</figcaption>
          </figure>
        </section>

        <div className={styles.ctaRow}>
          <GhostStage className={styles.ctaGhost} />
          <Link href="/?type=rescue" className={styles.cta}>Start the triage conversation →</Link>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
