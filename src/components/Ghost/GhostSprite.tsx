import styles from './GhostSprite.module.css';

interface Props {
  opacity: number;
  waving: boolean;
  thinking: boolean;
}

export default function GhostSprite({ opacity, waving, thinking }: Props) {
  return (
    <svg
      viewBox="0 0 158 108"
      className={styles.sprite}
      style={{ opacity }}
      aria-hidden="true"
    >
      <g transform="translate(6,-12)">
        <g
          className={waving ? styles.armWave : styles.armIdle}
          style={{ transformBox: 'view-box', transformOrigin: '24px 78px' }}
        >
          <path d="M 24 78 L 10 92" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" />
          <circle cx="8" cy="95" r="7" fill="currentColor" />
        </g>
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M 22 62 A 42 42 0 0 1 106 62 L 106 102 C 106 111 100 117 90 117 C 79 117 74 97 64 97 C 54 97 49 117 38 117 C 28 117 22 111 22 102 Z"
        />
        <g className={styles.blink} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <ellipse cx="49" cy="55" rx="9" ry="10.9" fill="var(--pb-void)" />
          <ellipse cx="85" cy="55" rx="9" ry="10.9" fill="var(--pb-void)" />
        </g>
        <g transform="rotate(-34 104 78)">
          <path d="M 104 78 L 126 60" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" />
          <circle cx="126" cy="60" r="7" fill="currentColor" />
          <g
            transform="translate(126,60) rotate(-46)"
            className={thinking ? styles.boltSpin : undefined}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <path fill="var(--pb-bolt)" d="M 4.8 -31.8 L -16.2 9 L -2.9 9 L -9.5 31.8 L 16.2 -10.9 L 1 -10.9 Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}
