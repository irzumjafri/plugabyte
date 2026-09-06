import Link from 'next/link';
import Wordmark from './Wordmark';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Wordmark className={styles.wordmark} />
        <div className={styles.links}>
          <Link href="/rescue">Rescue</Link>
          <Link href="/work">Work</Link>
          <Link href="/about">About</Link>
          <a href="mailto:hello@plugabyte.com">hello@plugabyte.com</a>
        </div>
        <p className={styles.tagline}>Plug in. Light up. Ship it.</p>
      </div>
    </footer>
  );
}
