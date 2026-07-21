interface DonutSegment {
  value: number;
  colorClass: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

/** Anillo de progreso construido con SVG puro (sin dependencias externas). */
export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * circumference;
      const dashArray = `${dash} ${circumference - dash}`;
      const dashOffset = -offset;
      offset += dash;
      return { ...s, dashArray, dashOffset, key: i };
    });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-stone-800"
        />
        {total === 0 ? null : (
          arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              className={arc.colorClass}
            />
          ))
        )}
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <span className="text-2xl font-bold">{centerLabel}</span>}
          {centerSubLabel && (
            <span className="text-xs text-stone-500">{centerSubLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
