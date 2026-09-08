import type { LeveyJennings } from './types';

const STATUS_FILL: Record<string, string> = {
  IN_CONTROL: 'fill-success',
  WARNING: 'fill-warning',
  REJECTED: 'fill-danger',
};

/** Levey-Jennings chart: value vs run, with mean and ±1/2/3 SD reference lines. Pure SVG. */
export function LeveyJenningsChart({ data }: { data: LeveyJennings }) {
  const { mean, sd, points } = data;
  const W = 640;
  const H = 240;
  const padX = 36;
  const padY = 16;
  const span = sd * 3.6;
  const yFor = (v: number) => padY + ((mean + span - v) / (2 * span)) * (H - 2 * padY);
  const xFor = (i: number) =>
    padX + (points.length <= 1 ? 0 : (i / (points.length - 1)) * (W - 2 * padX));

  const lines = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({
    k,
    y: yFor(mean + k * sd),
    label: k === 0 ? 'x̄' : `${k > 0 ? '+' : ''}${k}s`,
  }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[520px]" role="img" aria-label="Levey-Jennings chart">
        {lines.map((l) => (
          <g key={l.k}>
            <line
              x1={padX}
              x2={W - padX}
              y1={l.y}
              y2={l.y}
              className={l.k === 0 ? 'stroke-foreground' : Math.abs(l.k) === 3 ? 'stroke-danger/50' : 'stroke-border'}
              strokeDasharray={l.k === 0 ? '' : '3 3'}
              strokeWidth={l.k === 0 ? 1 : 0.75}
            />
            <text x={4} y={l.y + 3} className="fill-muted text-[9px]">
              {l.label}
            </text>
          </g>
        ))}
        {points.length > 1 && (
          <polyline
            points={points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ')}
            className="fill-none stroke-primary/60"
            strokeWidth={1}
          />
        )}
        {points.map((p, i) => (
          <circle
            key={p.runId}
            cx={xFor(i)}
            cy={yFor(p.value)}
            r={3.5}
            className={STATUS_FILL[p.status] ?? 'fill-muted'}
          >
            <title>
              {new Date(p.runAt).toLocaleString()} · {p.value} (z {p.zScore ?? '—'})
              {p.violatedRules ? ` · ${p.violatedRules}` : ''}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
