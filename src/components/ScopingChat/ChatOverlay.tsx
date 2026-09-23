'use client';

import { useCallback, useEffect, useRef } from 'react';
import Ghost, { type GhostHandle } from '@/components/Ghost/Ghost';
import styles from './ChatOverlay.module.css';

/**
 * Full-screen conversation with the ghost.
 *
 * The scoping chat used to sit in a band halfway down the page, which read as a
 * widget parked in the layout rather than a conversation. Here the rest of the
 * site drops away and the ghost is present at full size, so answering the
 * questions feels like talking to it.
 *
 * It is a modal, so it owes the usual debts: labelled dialog, focus moved in and
 * restored on close, Escape to leave, focus trapped while open, and the page
 * behind locked from scrolling.
 */
export default function ChatOverlay({
  open,
  onClose,
  ghostRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ghostRef?: React.RefObject<GhostHandle | null>;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const localGhost = useRef<GhostHandle>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  // Mirror the hero ghost's handle onto this one so callers that already hold a
  // ref (the chat drives wave/thinking through it) reach whichever is on screen.
  const setGhost = useCallback((h: GhostHandle | null) => {
    localGhost.current = h;
    if (ghostRef) ghostRef.current = h;
  }, [ghostRef]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    // Focus the first control inside rather than the panel, so a keyboard user
    // lands on the input they came here to type in.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(el => el.offsetParent !== null);

    const t = setTimeout(() => (focusables()[0] ?? panelRef.current)?.focus(), 60);

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.scrim} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Scope your build with Plugabyte"
      >
        <button type="button" className={styles.close} onClick={onClose}>
          <span className={styles.closeLabel}>Close</span>
          <span aria-hidden="true" className={styles.closeMark} />
        </button>

        {/* Ghost and conversation are one block, centred together — as two
            separate grid rows the ghost drifted to the top of a tall screen and
            the chat sank to the bottom, with a void between them. */}
        <div className={styles.dialogue}>
          <div className={styles.ghost}>
            <Ghost ref={setGhost} />
          </div>
          <div className={styles.conversation}>{children}</div>
        </div>
      </div>
    </div>
  );
}
