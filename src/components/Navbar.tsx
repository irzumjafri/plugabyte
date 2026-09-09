'use client';

import { useEffect, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleGetStarted = () => {
    setMenuOpen(false);
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    router.push('/');
  };

  // Every link closes the menu itself, so navigating away never leaves it open.
  const close = () => setMenuOpen(false);
  const links = (
    <>
      {isHome ? (
        <a href="#work" className={styles.link} onClick={close}>Work</a>
      ) : (
        <Link href="/work" className={styles.link} onClick={close}>Work</Link>
      )}
      <Link href="/rescue" className={styles.link} onClick={close}>Rescue</Link>
      <Link href="/about" className={styles.link} onClick={close}>About</Link>
    </>
  );

  return (
    <nav className={`${styles.navbar} ${menuOpen ? styles.navbarOpen : ''}`}>
      <Link href="/" className={styles.logoLink}>
        <Wordmark />
      </Link>

      <div className={styles.links}>{links}</div>

      <div className={styles.actions}>
        <button className={styles.cta} onClick={handleGetStarted}>
          Start a project
        </button>
        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className={menuOpen ? styles.barTopOpen : styles.bar} />
          <span className={menuOpen ? styles.barHidden : styles.bar} />
          <span className={menuOpen ? styles.barBottomOpen : styles.bar} />
        </button>
      </div>

      <div id="nav-menu" className={styles.mobileMenu} hidden={!menuOpen}>
        {links}
      </div>
    </nav>
  );
}
