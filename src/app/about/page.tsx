import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import SceneHero from '@/components/Scene/SceneHero';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About — AI & Software Studio in Dubai, UAE',
  description: "A small engineering studio in Dubai serving the Middle East. We started with circuits and kept the curiosity — building AI systems and software that survive production.",
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    title: 'About — AI & Software Studio in Dubai, UAE | Plugabyte',
    description: "A small engineering studio in Dubai serving the Middle East. We started with circuits and kept the curiosity — building AI systems and software that survive production.",
    images: [{ url: '/scenes/workbench.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — AI & Software Studio in Dubai, UAE | Plugabyte',
    description: "A small engineering studio in Dubai serving the Middle East. We started with circuits and kept the curiosity — building AI systems and software that survive production.",
    images: ['/scenes/workbench.jpg'],
  },
};

const BELIEFS = [
  {
    num: '01',
    title: 'Production from day one',
    desc: 'We write code that ships. Every architectural decision we make accounts for real-world load, failure modes, and maintenance from the first commit.',
  },
  {
    num: '02',
    title: 'AI should compound',
    desc: 'A system that gets smarter over time is worth ten that plateau. We build feedback loops, monitoring, and retraining pipelines into everything.',
  },
  {
    num: '03',
    title: 'Understand before you build',
    desc: 'The most expensive mistake in software is building the wrong thing well. We spend time understanding the actual problem before writing a single line.',
  },
  {
    num: '04',
    title: 'Tolerance stacks',
    desc: 'Hardware taught us this. A system is only as reliable as the product of its components. We design for that compounding from the architecture level.',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main>

      <SceneHero src="/scenes/workbench.jpg" alt="" side="left">
        <div>
          <p className={styles.heroEyebrow}>The people behind the ghost</p>
          <h1 className={styles.heroTitle}>
            We started with circuits.
            <br />
            <span className={styles.heroAccent}>We kept the curiosity.</span>
          </h1>
          <p className={styles.heroLead}>
            Same questions. Bigger systems. A more useful tomorrow.
          </p>
        </div>
      </SceneHero>

      {/* Origin */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.storyGrid}>
            <div className={styles.storyLeft}>
              <span className={styles.sectionLabel}>The origin</span>
              <h2 className={styles.storyHeading}>
                A failed startup that became a foundation
              </h2>
            </div>
            <div className={styles.storyBody}>
              <p>
                It started during university — a dream to build computers from the ground up. We prototyped, hustled, and shipped hardware. A small team, a big ambition, and every late night spent soldering and debugging felt like progress.
              </p>
              <p className={styles.storyPull}>
                The startup didn&apos;t make it. But everything we learned along the way did.
              </p>
              <p>
                The circuits, the architecture, the discipline of making physical things work reliably — it turned out to be the perfect foundation for building the intelligent software that runs <em>on</em> that hardware.
              </p>
              <p>
                When we made the pivot to software, we didn&apos;t leave the engineering rigour behind. We brought it with us. AI systems have tolerances just like circuits do. They drift, degrade, and fail quietly if nobody is watching. We knew what that looked like. We weren&apos;t going to build systems that did it.
              </p>
              <p>
                Plugabyte is what we built instead — an AI consultancy and product studio that treats software with the same standards we once gave to hardware. We partner with businesses to integrate AI, build production-grade systems from scratch, run the infrastructure that powers them, and ship our own tools alongside.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Director Keynote */}
      <section className={styles.keynote}>
        <div className={styles.keynoteGlow} />
        <div className={styles.keynoteInner}>
          <span className={styles.keynoteLabel}>A note from the director</span>

          <blockquote className={styles.keynoteQuote}>
            &ldquo;Most AI projects don&apos;t fail because the model is wrong.
            They fail because <span className={styles.keynoteQuoteAccent}>nothing around it was built to last.</span>&rdquo;
          </blockquote>

          <div className={styles.keynoteBody}>
            <p>
              The first AI system we ever deployed broke in production. Not spectacularly — in the slow, quiet way that erodes trust. The model drifted. The pipeline degraded silently. Nobody noticed for three weeks until a customer called.
            </p>
            <p>
              That incident changed how we think about building. We realised that most AI consulting firms are selling capabilities — what the model <em>can</em> do, in isolation, on a benchmark. Nobody was owning what it <em>does</em> in your system, under your load, six months after launch.
            </p>
            <p>
              That&apos;s the gap Plugabyte exists to close.
            </p>
            <p>
              Hardware taught us about tolerance stacks. Every component has a spec, every spec has a tolerance, and tolerances compound. A pipeline that&apos;s 99% reliable across five independent steps is 95% reliable end to end. We design AI systems with that math in mind from the first whiteboard session.
            </p>
            <p>
              We&apos;re a small team — and we intend to stay that way long enough to be excellent. We don&apos;t take every engagement. We take the ones where we can do the work properly, stay involved, and leave something better than we found.
            </p>
            <p>
              If you&apos;re building something that matters — something that needs to scale, survive, and keep improving — we&apos;d like to be the team behind it.
            </p>
          </div>

          <div className={styles.keynoteSig}>
            <div className={styles.keynoteLine} />
            <p className={styles.keynoteAuthor}>
              <span className={styles.keynoteAuthorName}>The Plugabyte team</span>
            </p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className={styles.beliefs}>
        <div className={styles.inner}>
          <span className={styles.beliefsLabel}>Our principles</span>
          <div className={styles.beliefsGrid}>
            {BELIEFS.map(b => (
              <div key={b.num} className={styles.beliefCard}>
                <p className={styles.beliefNum}>{b.num}</p>
                <h3 className={styles.beliefTitle}>{b.title}</h3>
                <p className={styles.beliefDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <Image
          className={styles.closingArt}
          src="/scenes/about-city.jpg"
          alt=""
          width={1130}
          height={524}
          sizes="100vw"
        />
        <div className={styles.closingCopy}>
          <h2 className={styles.closingTitle}>
            Still curious.
            <br />
            <span className={styles.closingAccent}>Still building.</span>
          </h2>
          <p className={styles.closingLead}>Good ideas deserve a life outside the demo.</p>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to build something that lasts?</h2>
        <p className={styles.ctaDesc}>
          Tell us what you&apos;re working on. We&apos;ll turn it into a brief and show you exactly how we&apos;d approach it.
        </p>
        <Link href="/" className={styles.ctaBtn}>
          Tell us what you&apos;re building →
        </Link>
      </section>
      </main>
      <Footer />
    </div>
  );
}
