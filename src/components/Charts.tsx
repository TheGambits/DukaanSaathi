import { formatCurrency, formatNumber } from '../lib/formatting';

interface DualBarDatum {
  label: string;
  primary: number;
  secondary: number;
}

export function DualBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  primaryColor = '#F59E0B',
  secondaryColor = '#0F766E',
}: {
  data: DualBarDatum[];
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  // Collapse 30-day data into 6 5-day buckets for clean visual labels if > 10 points
  const displayData: DualBarDatum[] =
    data.length > 10
      ? Array.from({ length: Math.ceil(data.length / 5) }, (_, idx) => {
          const slice = data.slice(idx * 5, idx * 5 + 5);
          return {
            label: slice[0]?.label ?? '',
            primary: slice.reduce((s, d) => s + d.primary, 0),
            secondary: slice.reduce((s, d) => s + d.secondary, 0),
          };
        })
      : data;

  const maxVal = Math.max(
    1,
    ...displayData.map((d) => Math.max(d.primary, d.secondary))
  );
  const hasAny = displayData.some((d) => d.primary > 0 || d.secondary > 0);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm font-medium text-[#263238]">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: primaryColor }}
          />
          {primaryLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: secondaryColor }}
          />
          {secondaryLabel}
        </span>
      </div>

      {!hasAny ? (
        <div className="flex h-44 items-center justify-center rounded-xl bg-[#F7F8F5] px-4 text-center text-sm text-[#607D8B]">
          Is period mein abhi tak koi entry record nahi hui hai.
        </div>
      ) : (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${Math.max(320, displayData.length * 58)} 190`}
            className="h-48 w-full overflow-visible"
            role="img"
            aria-label={`${primaryLabel} vs ${secondaryLabel}`}
          >
            {[0, 0.5, 1].map((ratio) => {
              const y = 145 - ratio * 120;
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={Math.max(320, displayData.length * 58)}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })}

            {displayData.map((d, idx) => {
              const step = Math.max(320, displayData.length * 58) / displayData.length;
              const cx = idx * step + step / 2;
              const h1 = (d.primary / maxVal) * 120;
              const h2 = (d.secondary / maxVal) * 120;
              const barW = Math.min(18, step * 0.28);

              return (
                <g key={`${d.label}-${idx}`}>
                  <rect
                    x={cx - barW - 2}
                    y={145 - h1}
                    width={barW}
                    height={Math.max(2, h1)}
                    rx="4"
                    fill={primaryColor}
                  >
                    <title>
                      {d.label} — {primaryLabel}: {formatCurrency(d.primary)}
                    </title>
                  </rect>
                  <rect
                    x={cx + 2}
                    y={145 - h2}
                    width={barW}
                    height={Math.max(2, h2)}
                    rx="4"
                    fill={secondaryColor}
                  >
                    <title>
                      {d.label} — {secondaryLabel}: {formatCurrency(d.secondary)}
                    </title>
                  </rect>
                  <text
                    x={cx}
                    y="170"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#546E7A"
                    fontWeight="600"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

export function TrendLineChart({
  data,
  strokeColor = '#0F766E',
  valueFormatter = formatCurrency,
  emptyLabel = 'Is period mein koi data nahi hai.',
}: {
  data: Array<{ label: string; value: number }>;
  strokeColor?: string;
  valueFormatter?: (val: number) => string;
  emptyLabel?: string;
}) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const minVal = Math.min(0, ...data.map((d) => d.value));
  const span = Math.max(1, maxVal - minVal);
  const hasNonZero = data.some((d) => d.value > 0);

  if (!hasNonZero) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-[#F7F8F5] px-4 text-center text-sm text-[#607D8B]">
        {emptyLabel}
      </div>
    );
  }

  const width = 460;
  const height = 180;
  const padX = 24;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const points = data.map((d, idx) => {
    const x =
      data.length === 1
        ? padX + plotW / 2
        : padX + (idx / (data.length - 1)) * plotW;
    const y = padTop + plotH - ((d.value - minVal) / span) * plotH;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padX},${padTop + plotH} ${polylinePoints} ${
    points[points.length - 1].x
  },${padTop + plotH}`;

  const labelIndices =
    data.length <= 7
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((data.length * 3) / 4), data.length - 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
        {[0, 0.5, 1].map((r) => {
          const y = padTop + plotH * (1 - r);
          return (
            <line
              key={r}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />
          );
        })}

        <polygon points={areaPoints} fill={strokeColor} fillOpacity="0.1" />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />

        {points.map((p, idx) => (
          <g key={`${p.label}-${idx}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.5">
              <title>
                {p.label}: {valueFormatter(p.value)}
              </title>
            </circle>
          </g>
        ))}

        {labelIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          return (
            <text
              key={`lbl-${idx}`}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#546E7A"
              fontWeight="600"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs font-medium text-[#607D8B]">
        <span>Min: {valueFormatter(Math.min(...data.map((d) => d.value)))}</span>
        <span>Peak: {valueFormatter(maxVal)}</span>
      </div>
    </div>
  );
}

export function HorizontalBarList({
  items,
  barColor = '#0F766E',
  emptyLabel = 'Koi data uplabdh nahi hai.',
  formatValue = formatCurrency,
}: {
  items: Array<{ label: string; subLabel?: string; value: number }>;
  barColor?: string;
  emptyLabel?: string;
  formatValue?: (val: number) => string;
}) {
  const maxVal = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0 || items.every((i) => i.value <= 0)) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-[#F7F8F5] px-4 text-center text-sm text-[#607D8B]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct = Math.max(4, Math.round((item.value / maxVal) * 100));
        return (
          <div key={`${item.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0 truncate font-semibold text-[#263238]">
                {item.label}{' '}
                {item.subLabel && (
                  <span className="text-xs font-normal text-[#607D8B]">({item.subLabel})</span>
                )}
              </div>
              <span className="shrink-0 font-bold text-[#12332F]">
                {formatValue(item.value)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ECEFF1]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StockMovementBarList({
  items,
}: {
  items: Array<{ name: string; soldQty: number; currentStock: number; unit: string }>;
}) {
  const maxVal = Math.max(1, ...items.map((i) => Math.max(i.soldQty, i.currentStock)));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs font-semibold text-[#546E7A]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#0F766E]" /> Available Stock
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" /> Sold in Period
        </span>
      </div>

      {items.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-[#263238]">{item.name}</span>
            <span className="text-xs font-medium text-[#546E7A]">
              Stock: {formatNumber(item.currentStock)} {item.unit} • Sold:{' '}
              {formatNumber(item.soldQty)} {item.unit}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-[#ECEFF1]">
              <div
                className="h-full rounded-full bg-[#0F766E]"
                style={{ width: `${Math.round((item.currentStock / maxVal) * 100)}%` }}
              />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ECEFF1]">
              <div
                className="h-full rounded-full bg-[#F59E0B]"
                style={{ width: `${Math.round((item.soldQty / maxVal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
