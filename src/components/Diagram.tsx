import styles from './Diagram.module.css';

/**
 * Schematic illustrations for the case studies.
 *
 * Not decoration and not fake screenshots: each one draws the system the
 * teardown describes, with the point that hurt marked by the bolt.
 *
 * The personality is carried by two devices from the brand system, and nothing
 * else — the drawings stay hairline so those two read. Every node is cut with
 * the ghost hem, which the brand book calls "the only trace of the ghost", so a
 * plain box becomes one of ours; and the failure is pinned with the actual bolt
 * glyph from the mark rather than a red rectangle, since Shock is already the
 * brand's error state.
 */
export type DiagramId = 'agent' | 'sync' | 'roles' | 'exposed';

const TITLES: Record<DiagramId, string> = {
  agent: 'Diagram: messages reach the agent, which answers from grounded retrieval, is held to an eval harness, and hands off to a human when it should not answer.',
  sync: 'Diagram: a storefront and a CRM exchanging orders, where a retried order is written twice.',
  roles: 'Diagram: three roles feeding one approval step, with every action written to an audit trail.',
  exposed: 'Diagram: an app whose admin route and database are reachable without authentication.',
};

/**
 * A card with a rounded top and a three-lobed hem, i.e. the ghost silhouette
 * reduced to its bottom edge. Three lobes exactly — that is the mark's count,
 * and at these sizes a fourth just reads as noise.
 */
function hemPath(x: number, y: number, w: number, h: number, amp = 3.4, r = 3.5) {
  const lobe = w / 3;
  const base = y + h - amp;
  let d = `M${x} ${y + r}Q${x} ${y} ${x + r} ${y}L${x + w - r} ${y}Q${x + w} ${y} ${x + w} ${y + r}L${x + w} ${base}`;
  for (let i = 0; i < 3; i++) d += `q${-lobe / 2} ${amp * 1.95} ${-lobe} 0`;
  return `${d}L${x} ${y + r}Z`;
}

// The mark's bolt, lifted from the 3D rig's outline and flipped for SVG's
// y-down axis, so the badge is the same shape as the one in the logo.
const BOLT_PTS: [number, number][] = [
  [0.45, -1.15], [-0.55, 0.05], [-0.1, 0.05], [-0.4, 1.15], [0.6, -0.15], [0.12, -0.15],
];

function boltPath(cx: number, cy: number, s: number) {
  return BOLT_PTS.map(([px, py], i) => `${i ? 'L' : 'M'}${cx + px * s} ${cy + py * s}`).join('') + 'Z';
}

type Tone = 'quiet' | 'key' | 'alert';

function Box({ x, y, w, h, tone = 'quiet' }: { x: number; y: number; w: number; h: number; tone?: Tone }) {
  return <path className={styles[tone]} d={hemPath(x, y, w, h)} />;
}

/** Pins the failure. One per drawing — a second one halves the first. */
function Bolt({ x, y, s = 5.6 }: { x: number; y: number; s?: number }) {
  return (
    <g className={styles.boltPin}>
      <circle className={styles.boltDisc} cx={x} cy={y} r={s * 1.42} />
      <path className={styles.bolt} d={boltPath(x, y, s)} />
    </g>
  );
}

function Agent() {
  return (
    <>
      <Box x={8} y={70} w={66} h={34} />
      <text className={styles.label} x={41} y={89}>WhatsApp</text>

      <path className={styles.wire} d="M74 85h34" />
      <path className={styles.head} d="M102 81l6 4-6 4" />

      <Box x={108} y={62} w={74} h={50} tone="key" />
      <text className={styles.labelKey} x={145} y={82}>agent</text>
      <text className={styles.sub} x={145} y={97}>grounded</text>

      <path className={styles.wire} d="M145 62V34h44" />
      <Box x={189} y={20} w={86} h={30} />
      <text className={styles.label} x={232} y={37}>retrieval store</text>

      <path className={styles.wire} d="M145 112v30h44" />
      <Box x={189} y={128} w={86} h={30} />
      <text className={styles.label} x={232} y={145}>human handoff</text>

      <path className={styles.wireAlert} d="M182 85h24" />
      <Box x={206} y={71} w={84} h={30} tone="alert" />
      <text className={styles.labelAlert} x={248} y={88}>eval harness</text>
      <Bolt x={206} y={71} />
    </>
  );
}

function Sync() {
  return (
    <>
      <Box x={10} y={58} w={84} h={42} />
      <text className={styles.label} x={52} y={80}>storefront</text>

      <Box x={196} y={58} w={84} h={42} />
      <text className={styles.label} x={238} y={80}>CRM</text>

      <path className={styles.wire} d="M94 72h94" />
      <path className={styles.head} d="M182 68l6 4-6 4" />
      <text className={styles.sub} x={141} y={64}>order</text>

      {/* Two arrowheads landing on one row: the retry, drawn as the duplicate
          it actually produced. */}
      <path className={styles.wireAlert} d="M94 90h94" />
      <path className={styles.headAlert} d="M182 86l6 4-6 4" />
      <path className={styles.wireAlert} d="M94 90h94" strokeDasharray="3 4" />
      <text className={styles.subAlert} x={141} y={110}>retried — written twice</text>
      <Bolt x={188} y={90} />

      <text className={styles.sub} x={52} y={126}>&quot;cancelled&quot;</text>
      <text className={styles.sub} x={238} y={126}>≠ &quot;cancelled&quot;</text>
    </>
  );
}

function Roles() {
  return (
    <>
      {['adjuster', 'approver', 'auditor'].map((role, i) => (
        <g key={role}>
          <Box x={8} y={22 + i * 44} w={76} h={32} />
          <text className={styles.label} x={46} y={40 + i * 44}>{role}</text>
          <path className={styles.wire} d={`M84 ${36 + i * 44}h30`} />
        </g>
      ))}
      {/* One bus, so the three roles visibly converge rather than each drawing
          its own arithmetic at the approval box. */}
      <path className={styles.wire} d="M114 36v88" />
      <path className={styles.wire} d="M114 80h20" />
      <path className={styles.head} d="M128 76l6 4-6 4" />

      <Box x={134} y={56} w={80} h={48} tone="key" />
      <text className={styles.labelKey} x={174} y={77}>approval</text>
      <text className={styles.sub} x={174} y={92}>per role</text>

      <path className={styles.wire} d="M214 80h28" />
      <path className={styles.head} d="M236 76l6 4-6 4" />
      <Box x={242} y={22} w={66} h={118} tone="alert" />
      <text className={styles.labelAlert} x={275} y={74}>audit</text>
      <text className={styles.subAlert} x={275} y={89}>every write</text>
      <Bolt x={242} y={22} />
    </>
  );
}

function Exposed() {
  return (
    <>
      <Box x={10} y={26} w={88} h={32} />
      <text className={styles.label} x={54} y={44}>visitor</text>

      <path className={styles.wire} d="M98 40h40" />
      <path className={styles.head} d="M132 36l6 4-6 4" />
      <Box x={138} y={26} w={88} h={32} tone="key" />
      <text className={styles.labelKey} x={182} y={44}>app</text>

      {/* No auth gate on either line — the point of the drawing is the absence. */}
      {/* Drops off the same visitor: the second route is not a different
          caller, it is the same one walking straight in. */}
      <path className={styles.wireAlert} d="M54 58v39h84" strokeDasharray="4 4" />
      <path className={styles.headAlert} d="M132 93l6 4-6 4" />
      <text className={styles.subAlert} x={98} y={91}>no auth</text>
      <Box x={138} y={83} w={88} h={32} tone="alert" />
      <text className={styles.labelAlert} x={182} y={101}>/admin</text>

      <path className={styles.wireAlert} d="M182 115v20h60" strokeDasharray="4 4" />
      <Box x={242} y={118} w={66} h={32} tone="alert" />
      <text className={styles.labelAlert} x={275} y={136}>database</text>
      <text className={styles.subAlert} x={275} y={164}>publicly readable</text>
      <Bolt x={242} y={118} />
    </>
  );
}

const SHAPES: Record<DiagramId, { shape: () => React.JSX.Element; box: string }> = {
  agent: { shape: Agent, box: '0 12 296 154' },
  sync: { shape: Sync, box: '4 48 284 88' },
  roles: { shape: Roles, box: '0 12 314 138' },
  exposed: { shape: Exposed, box: '4 18 310 154' },
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
