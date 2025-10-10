import React, { useMemo } from 'react';
import './TrendsChart.css';
import '../../types/models'; // Import for JSDoc typedef visibility

/**
 * PUBLIC_INTERFACE
 * TrendsChart - SVG-based placeholder line/area chart for trends.
 * Props:
 * - data?: Array<{ ts: number, value: number }>
 * - title?: string
 * - loading?: boolean
 * - error?: { message: string } | null
 *
 * Note: This is a lightweight placeholder and not a full charting lib.
 */
export default function TrendsChart({ data = [], title = 'Alert Trends (Last 24h)', loading = false, error = null }) {
  // Precompute normalized SVG points regardless of render branch to satisfy hooks rules
  const computed = useMemo(() => {
    const w = 720;
    const h = 200;
    const padding = 12;
    const valid = Array.isArray(data) && data.length > 0;

    if (!valid) {
      return {
        hasData: false,
        points: [],
        areaPath: '',
        viewBox: `0 0 ${w} ${h}`,
      };
    }

    const xs = data.map(d => d.ts);
    const ys = data.map(d => d.value);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = 0;
    const maxY = Math.max(1, Math.max(...ys));
    const scaleX = (x) => {
      if (maxX === minX) return padding;
      return padding + ((x - minX) / (maxX - minX)) * (w - padding * 2);
    };
    const scaleY = (y) => {
      if (maxY === minY) return h - padding;
      const t = (y - minY) / (maxY - minY);
      return h - padding - t * (h - padding * 2);
    };
    const pts = data.map(d => [scaleX(d.ts), scaleY(d.value)]);
    const line = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
    const area = `${line} L ${pts[pts.length - 1][0]} ${h - padding} L ${pts[0][0]} ${h - padding} Z`;

    return {
      hasData: true,
      points: pts,
      areaPath: area,
      viewBox: `0 0 ${w} ${h}`,
    };
  }, [data]);

  if (loading) {
    return <div className="card trends-card skeleton" aria-busy="true" />;
  }
  if (error) {
    return (
      <div className="card trends-card" role="alert">
        <div className="trends-header">
          <h3 className="trends-title">{title}</h3>
        </div>
        <p className="text-muted">Failed to load: {error.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="card trends-card">
      <div className="trends-header">
        <h3 className="trends-title">{title}</h3>
      </div>

      {!computed.hasData ? (
        <p className="text-muted">No trend data.</p>
      ) : (
        <svg className="trends-svg" viewBox={computed.viewBox} role="img" aria-label="Alert trend chart">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(37,99,235,0.30)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
            </linearGradient>
          </defs>
          <path d={computed.areaPath} fill="url(#trendFill)" stroke="none" />
          <polyline
            points={computed.points.map(p => p.join(',')).join(' ')}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
          {computed.points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--color-primary)" />
          ))}
        </svg>
      )}
    </div>
  );
}
