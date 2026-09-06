'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Wordmark from './Wordmark';
import styles from './Navbar.module.css';

interface Props {
  onGetStarted?: () => void;
}

export default function Navbar({ onGetStarted }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logoLink}>
        <Wordmark />
      </Link>
      <div className={styles.links}>
        {isHome ? (
          <a href="#work" className={styles.link}>Work</a>
        ) : (
          <Link href="/work" className={styles.link}>Work</Link>
        )}
        <Link href="/rescue" className={styles.link}>Rescue</Link>
        <Link href="/about" className={styles.link}>About</Link>
      </div>
      <button className={styles.cta} onClick={handleGetStarted}>
        {isHome ? 'What are you shipping?' : 'Get started'}
      </button>
    </nav>
  );
}
