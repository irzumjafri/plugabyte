import styles from './Annotation.module.css';

/**
 * The marker-hand asides from the direction comps ("Big ideas. Working parts.").
 *
 * Decorative commentary on the artwork, so it is hidden from assistive tech —
 * whatever an annotation says is always already stated in the real copy nearby.
 * If one ever carries information the page does not, it belongs in the prose.
 */
export default function Annotation({
  children,
  arrow = 'none',
  onArt = false,
  className,
}: {
  children: React.ReactNode;
  arrow?: 'down-left' | 'down-right' | 'none';
  /** Sitting on a photographic plate, where it needs its own ground. */
  onArt?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.note} ${onArt ? styles.onArt : ''} ${className ?? ''}`}
    >
      {children}
      {arrow !== 'none' && (
        <svg
          className={arrow === 'down-left' ? styles.arrowLeft : styles.arrowRight}
          viewBox="0 0 48 40"
          fill="none"
        >
          <path d="M40 4C36 18 28 28 10 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 28l-8 4 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
