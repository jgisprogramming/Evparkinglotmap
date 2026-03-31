import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { HistoryRecord } from "../data/mockData";

interface Props {
  historyData: HistoryRecord[];
}

const BINS = [
  { label: "0–15 min",   min: 0,   max: 15  },
  { label: "15–30 min",  min: 15,  max: 30  },
  { label: "30–45 min",  min: 30,  max: 45  },
  { label: "45–60 min",  min: 45,  max: 60  },
  { label: "1–1.5 hr",   min: 60,  max: 90  },
  { label: "1.5–2 hr",   min: 90,  max: 120 },
  { label: "> 2 hr",     min: 120, max: Infinity },
];

const BIN_COLORS = [
  "#38bdf8", "#34d399", "#a3e635", "#fbbf24",
  "#f97316", "#ef4444", "#a855f7",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string; count: number; pct: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#0d1b2a",
        border: "1px solid #1e3a5f",
        borderRadius: 10,
        padding: "10px 14px",
      }}
    >
      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        {d.label}
      </div>
      <div style={{ color: "#38bdf8", fontSize: 13 }}>
        {d.count} sessions
      </div>
      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
        {d.pct.toFixed(1)}% of total
      </div>
    </div>
  );
}

export function DurationHistogram({ historyData }: Props) {
  const { binnedData, median, mean } = useMemo(() => {
    const durations = historyData.map((r) => r.session_duration_mins);
    if (durations.length === 0) {
      return { binnedData: [], median: 0, mean: 0 };
    }

    const total = durations.length;
    const sorted = [...durations].sort((a, b) => a - b);
    const medianVal = sorted[Math.floor(sorted.length / 2)];
    const meanVal = durations.reduce((s, v) => s + v, 0) / total;

    const binnedData = BINS.map((bin, i) => {
      const count = durations.filter(
        (d) => d >= bin.min && d < bin.max
      ).length;
      return {
        label: bin.label,
        count,
        pct: (count / total) * 100,
        color: BIN_COLORS[i],
        binMid: bin.max === Infinity ? bin.min + 30 : (bin.min + bin.max) / 2,
      };
    });

    return { binnedData, median: medianVal, mean: meanVal };
  }, [historyData]);

  const maxCount = Math.max(...binnedData.map((b) => b.count), 1);

  // Find the bin that contains the median
  const medianBinLabel =
    BINS.find((b) => median >= b.min && median < b.max)?.label ?? "";

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1a2744", border: "1px solid #1e3a5f" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>
            Session Duration Turnover
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            Distribution of charging session durations — all 7 days
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div style={{ color: "#a78bfa", fontSize: 18, fontWeight: 700 }}>
              {Math.round(median)} min
            </div>
            <div style={{ color: "#64748b", fontSize: 10 }}>median</div>
          </div>
          <div className="text-right">
            <div style={{ color: "#38bdf8", fontSize: 18, fontWeight: 700 }}>
              {Math.round(mean)} min
            </div>
            <div style={{ color: "#64748b", fontSize: 10 }}>mean</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={binnedData}
          margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e3a5f" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Sessions",
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
              fontSize: 10,
              dy: 30,
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(56,189,248,0.06)" }} />

          {/* Median reference line */}
          <ReferenceLine
            x={medianBinLabel}
            stroke="#a78bfa"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: "Median",
              fill: "#a78bfa",
              fontSize: 10,
              position: "top",
            }}
          />

          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {binnedData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.color}
                fillOpacity={entry.count === maxCount ? 1 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Turnover insight */}
      <div
        className="mt-3 rounded-lg px-3 py-2 flex items-center gap-3"
        style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
      >
        <div style={{ fontSize: 18 }}>⚡</div>
        <div>
          <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>Turnover Insight: </span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {binnedData.slice(0, 3).reduce((s, b) => s + b.pct, 0).toFixed(0)}% of sessions complete within 45 minutes.
            {mean < 60
              ? " Rapid turnover — high lot cycling expected during peak hours."
              : mean < 90
              ? " Moderate turnover — typical for mixed AC/DC charging infrastructure."
              : " Extended sessions — predominantly AC slow-charging behaviour."}
          </span>
        </div>
      </div>
    </div>
  );
}
