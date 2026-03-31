import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ChargerUnit } from "../data/mockData";

interface Props {
  units: ChargerUnit[];
}

const SLICE_CONFIG = [
  { key: "available",    label: "Available",    statusCode: 1,   color: "#22c55e", icon: "●" },
  { key: "occupied",     label: "Occupied",     statusCode: 0,   color: "#f97316", icon: "●" },
  { key: "not_available",label: "Offline",      statusCode: 100, color: "#ef4444", icon: "●" },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      style={{
        background: "#0d1b2a",
        border: "1px solid #1e3a5f",
        borderRadius: 10,
        padding: "8px 14px",
      }}
    >
      <div style={{ color: p.payload.color, fontWeight: 700, fontSize: 13 }}>{p.name}</div>
      <div style={{ color: "#f1f5f9", fontSize: 13 }}>{p.value} plug{p.value !== 1 ? "s" : ""}</div>
    </div>
  );
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  value: number;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#f1f5f9"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function StatusDonut({ units }: Props) {
  const counts = SLICE_CONFIG.map((s) => ({
    name: s.label,
    value: units.filter((u) => u.status === s.statusCode).length,
    color: s.color,
  })).filter((d) => d.value > 0);

  const total = units.length;
  const available = units.filter((u) => u.status === 1).length;
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <div
      className="rounded-xl p-4 h-full flex flex-col"
      style={{ background: "#1a2744", border: "1px solid #1e3a5f" }}
    >
      <div>
        <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>Current Status</div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
          Real-time plug disposition
        </div>
      </div>

      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={counts}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
              strokeWidth={0}
            >
              {counts.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -54%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Available</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 mt-1">
        {counts.map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: c.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{c.name}</span>
            </div>
            <span style={{ color: c.color, fontSize: 12, fontWeight: 700 }}>
              {c.value} / {total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
