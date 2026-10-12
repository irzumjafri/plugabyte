import Link from 'next/link';
import Image from 'next/image';
import { PROJECTS } from '@/lib/projects';
import { publishedTestimonials } from '@/lib/testimonials';
import Annotation from '@/components/Scene/Annotation';
import styles from './HomeSections.module.css';

/**
 * What we put around a model so it survives real users. These are the brand
 * book's own AI set, and they are the offer: not advice about AI, but the
 * engineering that makes an AI system reliable enough to run a business on.
 */
const AI_RELIABILITY = [
  { title: 'Grounded in your data', desc: 'Answers that come from your systems, not from what the model half-remembers.' },
  { title: 'Held to an eval harness', desc: 'The line between a demo and a product. It is how you know a prompt change did not quietly break it.' },
  { title: 'A human path out', desc: "The escalation route for anything the model should not be answering." },
  { title: 'Costed at real volume', desc: 'Modelled on the traffic you actually expect, not on a demo.' },
];

/** The three things the exploded plate is actually showing. */
const LAYERS = ['Auth that holds.', 'Retries that recover.', 'Someone watching.'];

export default function HomeSections() {
  const testimonials = publishedTestimonials();

  return (
    <div className={styles.main}>
      {/* Light ground, per the comps — the page alternates rather than running
          dark the whole way down. */}
      <section id="work" className={styles.concepts}>
        <div className={styles.conceptsHead}>
          <div>
            <p className={styles.eyebrowInk}>What we&apos;ve built</p>
            <h2 className={styles.titleInk}>
              Things you can
              <br />actually open.
            </h2>
          </div>
          <p className={styles.headAside}>
            Client work and our own products, each labelled for what it is.
            <span className={styles.rule} aria-hidden="true" />
          </p>
        </div>

        <ul className={styles.conceptGrid}>
          {PROJECTS.map((p, i) => (
            <li key={p.slug} className={i === 0 ? styles.conceptCardWide : styles.conceptCard}>
              {p.image && (
                <Image
                  className={styles.conceptShot}
                  src={p.image}
                  alt={`${p.name} — ${p.tagline}`}
                  width={1600}
                  height={956}
                  sizes="(max-width: 860px) 100vw, (max-width: 1200px) 50vw, 620px"
                />
              )}
              <div className={styles.conceptText}>
                <p className={styles.projectMeta}>
                  <span className={p.kind === 'Client work' ? styles.kindClient : styles.kindOwn}>
                    {p.kind}
                  </span>
                  <span className={styles.projectStatus}>{p.status}</span>
                </p>
                <p className={styles.conceptName}>{p.name}</p>
                <p className={styles.conceptTagline}>{p.tagline}</p>
                <p className={styles.conceptBlurb}>{p.blurb}</p>
                {p.detail && <p className={styles.projectDetail}>{p.detail}</p>}
                {p.href && (
                  <a className={styles.projectLink} href={p.href} target="_blank" rel="noopener noreferrer">
                    Open it <span aria-hidden="true">↗</span>
                  </a>
                )}
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

      {/* Renders only when there is something real to show — placeholders are
          filtered out of production builds, so an empty list means no section
          rather than an empty frame. */}
      {testimonials.length > 0 && (
        <section className={styles.voices}>
          <div className={styles.voicesInner}>
            <p className={styles.eyebrowLight}>What they said after</p>
            <ul className={styles.voiceList}>
              {testimonials.map(t => (
                <li key={`${t.company}-${t.name}`} className={styles.voice}>
                  <blockquote className={styles.voiceQuote}>
                    <span aria-hidden="true" className={styles.voiceMark}>&ldquo;</span>
                    {t.quote}
                  </blockquote>
                  <p className={styles.voiceWho}>
                    <span className={styles.voiceName}>{t.name}</span>
                    <span className={styles.voiceRole}>{t.role}, {t.company}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* The AI offer. Not advisory as a product — the brand book is explicit
          that AI is how the work gets done, not what is sold — but the
          engineering that makes an AI system hold up, with the "where does it
          belong" conversation as the way in. */}
      <section className={styles.ai}>
        <div className={styles.aiInner}>
          <p className={styles.eyebrowLight}>Building with AI</p>
          <h2 className={styles.titleLight}>
            Most AI projects don&apos;t fail on the model.
            <br />
            <span className={styles.em}>They fail on everything around it.</span>
          </h2>
          <p className={styles.aiLead}>
            We build AI systems that survive contact with real users — and we will tell you
            where a model genuinely earns its keep before anyone writes a line of it. Not
            sure where AI belongs in your business yet? That conversation is where we start.
          </p>
          <ul className={styles.aiGrid}>
            {AI_RELIABILITY.map(a => (
              <li key={a.title} className={styles.aiItem}>
                <p className={styles.aiTitle}>{a.title}</p>
                <p className={styles.aiDesc}>{a.desc}</p>
              </li>
            ))}
          </ul>
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
