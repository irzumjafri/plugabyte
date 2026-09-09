import Image from 'next/image';
import styles from './SceneHero.module.css';

/**
 * The full-bleed illustrated hero from the direction comps: an artwork plate,
 * a scrim, and the copy sitting in the plate's own negative space.
 *
 * The plates are lit dark on one side for exactly this, so the scrim only has
 * to deepen what the art already does rather than dim the whole image. `side`
 * says which way that negative space runs.
 */
export default function SceneHero({
  src,
  alt,
  side = 'left',
  children,
  ghost,
  minHeight = 'min(78vh, 660px)',
}: {
  src: string;
  /** Empty when the plate is atmosphere; real text when it carries meaning. */
  alt: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  /** Live ghost, composited over the plate. */
  ghost?: React.ReactNode;
  minHeight?: string;
}) {
  return (
    <section className={styles.hero} style={{ minHeight }}>
      <Image
        className={styles.plate}
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
      />
      <div className={side === 'left' ? styles.scrimLeft : styles.scrimRight} />
      {ghost && <div className={styles.ghost}>{ghost}</div>}
      <div className={`${styles.inner} ${side === 'left' ? styles.innerLeft : styles.innerRight}`}>
        {children}
      </div>
    </section>
  );
}
