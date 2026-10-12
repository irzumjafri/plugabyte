import styles from './EmailLink.module.css';

export const CONTACT_EMAIL = 'hello@plugabyte.com';

/**
 * The way out of the funnel for people who do not want to talk to a bot.
 *
 * The scoping conversation was the only route in — anyone who distrusts a chat
 * widget, or just wants to send a paragraph and get on with their day, had
 * nothing but a mailto buried in the footer.
 */
export default function EmailLink({
  label = 'Or email us directly',
  subject,
  className,
}: {
  label?: string;
  subject?: string;
  className?: string;
}) {
  const href = subject
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${CONTACT_EMAIL}`;

  return (
    <a className={`${styles.link} ${className ?? ''}`} href={href}>
      {label} <span className={styles.address}>{CONTACT_EMAIL}</span>
    </a>
  );
}
