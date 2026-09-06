import styles from './Wordmark.module.css';

interface Props {
  className?: string;
}

/**
 * The brand lockup. The "a" is a ghost glyph, not a tinted letter — a
 * single-storey bowl on the baseline with the eyes cut out of it, and the bolt
 * hanging into the descender space where a "g" tail would fall. Geometry and
 * metrics are lifted from Plugabyte_Brand_System_v2.1.html (symbol #pbA), which
 * calls a full-height mark set between the two words incorrect: the bowl has to
 * match the x-height of the type around it and sit on the baseline.
 */
export default function Wordmark({ className }: Props) {
  return (
    <span className={`${styles.wordmark} ${className ?? ''}`}>
      plug
      <span className={styles.srOnly}>a</span>
      <svg viewBox="0 0 100 158" className={styles.glyph} aria-hidden="true" focusable="false">
        <g transform="translate(6,8)">
          <path
            fillRule="evenodd"
            fill="currentColor"
            d="M 0 44 A 44 44 0 0 1 88 44 L 88 86 C 88 95 82 101 71 101 C 60 101 55 81 44 81 C 33 81 28 101 17 101 C 6 101 0 95 0 86 Z M 18.5 36.6 a 9.5 11.5 0 1 0 19 0 a 9.5 11.5 0 1 0 -19 0 Z M 56.2 36.6 a 9.5 11.5 0 1 0 19 0 a 9.5 11.5 0 1 0 -19 0 Z"
          />
          <path fill="var(--pb-bolt)" d="M 82 81 L 60 124 L 74 124 L 67 148 L 94 103 L 78 103 Z" />
        </g>
      </svg>
      byte
    </span>
  );
}
