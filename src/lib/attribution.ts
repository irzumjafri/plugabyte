/**
 * Where a visit came from.
 *
 * Captured once per session and attached to every event after it, so a brief
 * submitted three pages deep can still be traced back to the search, campaign
 * or referral that started the visit. Without this, traffic is a pile of page
 * views with no way to tell organic search from a LinkedIn post.
 */
const ATTRIBUTION_KEY = 'pb_attribution';

export interface Attribution {
  /** organic | referral | direct | the utm_medium when a campaign is tagged. */
  channel: string;
  /** Search engine, referring host, or utm_source. */
  source: string;
  campaign?: string;
  term?: string;
  content?: string;
  /** The page the visit started on — the real SEO landing page. */
  landing: string;
}

/**
 * The engine has to be the registrable domain, not merely present in the host:
 * a bare `google\.` matched `google.com.evil.example`, which would have let
 * anyone forge organic-search credit by hosting a link on such a domain. The
 * tail allows one or two label TLDs, so google.com and google.co.uk both pass
 * while a third label does not.
 */
const SEARCH_HOSTS =
  /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|yandex|baidu)\.[a-z]{2,}(\.[a-z]{2,})?$/i;

export function classify(referrer: string, params: URLSearchParams, landing: string): Attribution {
  const utmSource = params.get('utm_source');
  // A tagged campaign always wins: it is the one signal someone set deliberately.
  if (utmSource) {
    return {
      channel: params.get('utm_medium') || 'campaign',
      source: utmSource,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
      landing,
    };
  }

  if (!referrer) return { channel: 'direct', source: 'direct', landing };

  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return { channel: 'direct', source: 'direct', landing };
  }

  if (typeof window !== 'undefined' && host === window.location.hostname) {
    return { channel: 'internal', source: host, landing };
  }
  if (SEARCH_HOSTS.test(host)) return { channel: 'organic', source: host, landing };
  return { channel: 'referral', source: host, landing };
}

/** Reads this session's attribution, computing and storing it on first call. */
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch {
    // Private mode can refuse storage; fall through and recompute each time.
  }

  const fresh = classify(
    document.referrer,
    new URLSearchParams(window.location.search),
    window.location.pathname,
  );
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fresh));
  } catch {
    /* not fatal — the event still carries it */
  }
  return fresh;
}
