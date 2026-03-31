import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { ChargerUnit } from "../data/mockData";

interface Props {
  units: ChargerUnit[];
}

const PLUG_COLORS: Record<string, string> = {
  "CCS2": "#38bdf8",
  "CHAdeMO": "#a78bfa",
  "Type 2": "#34d399",
  "Type 1": "#fbbf24",
};

const SPEED_CATEGORY = (kw: number) =>
  kw >= 100 ? "Ultra-Fast DC" : kw >= 40 ? "Fast DC" : kw >= 10 ? "AC Level 2" : "AC Level 1";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { plugType: string; chargingSpeed: number; status: string; category: string } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
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
        {label}
      </div>
      <div style={{ color: "#38bdf8", fontSize: 13 }}>{d.chargingSpeed} kW</div>
      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{d.category}</div>
      <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Status: {d.status}</div>
    </div>
  );
}

export function HardwareChart({ units }: Props) {
  const data = units.map((u, i) => ({
    name: `${u.plugType} #${i + 1}`,
    chargingSpeed: u.chargingSpeed,
    plugType: u.plugType,
    category: SPEED_CATEGORY(u.chargingSpeed),
    status: u.status === 1 ? "Available" : u.status === 0 ? "Occupied" : "Offline",
    color: PLUG_COLORS[u.plugType] ?? "#94a3b8",
  }));

  return (
    <div
      className="rounded-xl p-4 h-full"
      style={{ background: "#1a2744", border: "1px solid #1e3a5f" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>
            Hardware Profile
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            Charging speed (kW) per plug type
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-1">
          {Object.entries(PLUG_COLORS).map(([pt, color]) => (
            <div key={pt} className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ color: "#64748b", fontSize: 10 }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 24 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e3a5f"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e3a5f" }}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v} kW`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(56,189,248,0.06)" }} />
          <Bar dataKey="chargingSpeed" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={entry.status === "Offline" ? 0.35 : 0.85} />
            ))}
            <LabelList
              dataKey="chargingSpeed"
              position="top"
              formatter={(v: number) => `${v}kW`}
              style={{ fill: "#94a3b8", fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
