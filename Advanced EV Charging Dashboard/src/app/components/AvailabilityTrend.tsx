import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { HistoryRecord } from "../data/mockData";
import { subHours } from "date-fns";

interface Props {
  historyData: HistoryRecord[];
  stationName: string;
  totalLots: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0d1b2a",
        border: "1px solid #1e3a5f",
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 160,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{p.name}</span>
          </div>
          <span style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AvailabilityTrend({ historyData, totalLots }: Props) {
  const now = new Date();
  const cutoff = subHours(now, 24);

  const last24h = useMemo(() => {
    return historyData
      .filter((r) => r.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      // Show 1 point per hour for clarity (take last record of each hour)
      .reduce<HistoryRecord[]>((acc, rec) => {
        const key = `${rec.day_of_week}-${rec.hour}`;
        const existing = acc.findIndex(
          (x) => x.day_of_week === rec.day_of_week && x.hour === rec.hour
        );
        if (existing === -1) acc.push(rec);
        else acc[existing] = rec; // keep last record in hour
        return acc;
      }, [])
      .map((r) => ({
        time: `${String(r.hour).padStart(2, "0")}:00`,
        Available: r.available_lots,
        Occupied: r.occupied_lots,
        label: r.timeLabel,
      }));
  }, [historyData]);

  const avgAvailable =
    last24h.length > 0
      ? (last24h.reduce((s, r) => s + r.Available, 0) / last24h.length).toFixed(1)
      : "—";

  const peakOccupied =
    last24h.length > 0 ? Math.max(...last24h.map((r) => r.Occupied)) : 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1a2744", border: "1px solid #1e3a5f" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>
            Availability Trend
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            Available vs Occupied lots — last 24 hours
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 700 }}>{avgAvailable}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>avg available</div>
          </div>
          <div className="text-right">
            <div style={{ color: "#f97316", fontSize: 18, fontWeight: 700 }}>{peakOccupied}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>peak occupied</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={last24h} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e3a5f" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, totalLots]}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {/* Half-capacity reference line */}
          <ReferenceLine
            y={Math.round(totalLots / 2)}
            stroke="#334155"
            strokeDasharray="4 4"
            label={{ value: "50%", fill: "#475569", fontSize: 10, position: "right" }}
          />
          <Line
            type="monotone"
            dataKey="Available"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Occupied"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#f97316", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
