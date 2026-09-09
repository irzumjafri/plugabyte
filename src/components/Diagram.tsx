import styles from './Diagram.module.css';

/**
 * Schematic illustrations for the case studies.
 *
 * Deliberately not decoration and deliberately not fake screenshots: each one
 * draws the system the teardown describes, with the failure point marked in
 * bolt. The drawing carries information the prose otherwise has to spend a
 * paragraph on, which is the only reason it earns its place on the page.
 *
 * Colour comes from currentColor and the two CSS vars, so the same markup sits
 * on the dark ground and on Chalk without a second set of assets.
 */
export type DiagramId = 'agent' | 'sync' | 'roles' | 'exposed';

const TITLES: Record<DiagramId, string> = {
  agent: 'Diagram: messages reach the agent, which answers from grounded retrieval, is held to an eval harness, and hands off to a human when it should not answer.',
  sync: 'Diagram: a storefront and a CRM exchanging orders, where a retried order is written twice.',
  roles: 'Diagram: three roles feeding one approval step, with every action written to an audit trail.',
  exposed: 'Diagram: an app whose admin route and database are reachable without authentication.',
};

function Agent() {
  return (
    <>
      <rect className={styles.node} x="8" y="70" width="66" height="34" rx="3" />
      <text className={styles.label} x="41" y="91">WhatsApp</text>

      <path className={styles.wire} d="M74 87h34" />
      <path className={styles.head} d="M102 83l6 4-6 4" />

      <rect className={styles.nodeKey} x="108" y="62" width="74" height="50" rx="3" />
      <text className={styles.labelKey} x="145" y="83">agent</text>
      <text className={styles.sub} x="145" y="99">grounded</text>

      <path className={styles.wire} d="M145 62V34h44" />
      <rect className={styles.node} x="189" y="20" width="86" height="28" rx="3" />
      <text className={styles.label} x="232" y="38">retrieval store</text>

      <path className={styles.wire} d="M145 112v28h44" />
      <rect className={styles.node} x="189" y="126" width="86" height="28" rx="3" />
      <text className={styles.label} x="232" y="144">human handoff</text>

      {/* The eval harness is the part that took longest and the part that keeps
          the rest honest, so it is the one thing drawn in bolt. */}
      <path className={styles.wireAlert} d="M182 87h24" />
      <rect className={styles.nodeAlert} x="206" y="73" width="84" height="28" rx="3" />
      <text className={styles.labelAlert} x="248" y="91">eval harness</text>
    </>
  );
}

function Sync() {
  return (
    <>
      <rect className={styles.node} x="10" y="58" width="84" height="40" rx="3" />
      <text className={styles.label} x="52" y="82">storefront</text>

      <rect className={styles.node} x="196" y="58" width="84" height="40" rx="3" />
      <text className={styles.label} x="238" y="82">CRM</text>

      <path className={styles.wire} d="M94 72h94" />
      <path className={styles.head} d="M182 68l6 4-6 4" />
      <text className={styles.sub} x="141" y="62">order</text>

      {/* Two arrowheads landing on one row: the retry, drawn as the duplicate
          it actually produced. */}
      <path className={styles.wireAlert} d="M94 92h94" />
      <path className={styles.headAlert} d="M182 88l6 4-6 4" />
      <path className={styles.wireAlert} d="M94 92h94" strokeDasharray="3 4" />
      <text className={styles.subAlert} x="141" y="112">retried — written twice</text>

      <text className={styles.sub} x="52" y="126">&quot;cancelled&quot;</text>
      <text className={styles.sub} x="238" y="126">≠ &quot;cancelled&quot;</text>
    </>
  );
}

function Roles() {
  return (
    <>
      {['adjuster', 'approver', 'auditor'].map((role, i) => (
        <g key={role}>
          <rect className={styles.node} x="8" y={22 + i * 44} width="76" height="30" rx="3" />
          <text className={styles.label} x="46" y={41 + i * 44}>{role}</text>
          <path className={styles.wire} d={`M84 ${37 + i * 44}h30`} />
        </g>
      ))}
      {/* One bus, so the three roles visibly converge rather than each drawing
          its own arithmetic at the approval box. */}
      <path className={styles.wire} d="M114 37v88" />
      <path className={styles.wire} d="M114 81h20" />
      <path className={styles.head} d="M128 77l6 4-6 4" />

      <rect className={styles.nodeKey} x="134" y="58" width="80" height="46" rx="3" />
      <text className={styles.labelKey} x="174" y="79">approval</text>
      <text className={styles.sub} x="174" y="95">per role</text>

      <path className={styles.wire} d="M214 81h28" />
      <path className={styles.head} d="M236 77l6 4-6 4" />
      <rect className={styles.nodeAlert} x="242" y="22" width="66" height="118" rx="3" />
      <text className={styles.labelAlert} x="275" y="76">audit</text>
      <text className={styles.subAlert} x="275" y="92">every write</text>
    </>
  );
}

function Exposed() {
  return (
    <>
      <rect className={styles.node} x="10" y="26" width="88" height="30" rx="3" />
      <text className={styles.label} x="54" y="45">visitor</text>

      <path className={styles.wire} d="M98 41h40" />
      <path className={styles.head} d="M132 37l6 4-6 4" />
      <rect className={styles.nodeKey} x="138" y="26" width="88" height="30" rx="3" />
      <text className={styles.labelKey} x="182" y="45">app</text>

      {/* No auth gate on either line — the point of the drawing is the absence. */}
      <path className={styles.wireAlert} d="M98 96h40" strokeDasharray="4 4" />
      <path className={styles.headAlert} d="M132 92l6 4-6 4" />
      <text className={styles.subAlert} x="118" y="88">no auth</text>
      <rect className={styles.nodeAlert} x="138" y="81" width="88" height="30" rx="3" />
      <text className={styles.labelAlert} x="182" y="100">/admin</text>

      <path className={styles.wireAlert} d="M182 111v22h60" strokeDasharray="4 4" />
      <rect className={styles.nodeAlert} x="242" y="119" width="66" height="30" rx="3" />
      <text className={styles.labelAlert} x="275" y="138">database</text>
      <text className={styles.subAlert} x="275" y="163">publicly readable</text>
    </>
  );
}

const SHAPES: Record<DiagramId, { shape: () => React.JSX.Element; box: string }> = {
  agent: { shape: Agent, box: '4 14 292 148' },
  sync: { shape: Sync, box: '4 48 284 88' },
  roles: { shape: Roles, box: '4 16 310 132' },
  exposed: { shape: Exposed, box: '4 20 310 150' },
};

export default function Diagram({ id, className }: { id: DiagramId; className?: string }) {
  const { shape: Shape, box } = SHAPES[id];
  return (
    <svg
      className={`${styles.svg}${className ? ' ' + className : ''}`}
      viewBox={box}
      role="img"
      aria-label={TITLES[id]}
    >
      <Shape />
    </svg>
  );
}
