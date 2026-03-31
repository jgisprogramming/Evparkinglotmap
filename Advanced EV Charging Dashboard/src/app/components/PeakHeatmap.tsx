import React, { useMemo, useState } from "react";
import type { HistoryRecord } from "../data/mockData";

interface Props {
  historyData: HistoryRecord[];
  totalLots: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Convert occupancy rate (0–1) to HSL colour on a blue→green→orange→red thermal scale */
function heatColor(rate: number): string {
  // 0 → dark blue, 0.5 → cyan/green, 1 → hot orange-red
  const hue = 240 - rate * 240; // 240 (blue) → 0 (red)
  const sat = 80;
  const light = 20 + rate * 35; // 20 → 55
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

interface TooltipState {
  day: number;
  hour: number;
  rate: number;
  x: number;
  y: number;
}

export function PeakHeatmap({ historyData, totalLots }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Aggregate: for each (day, hour) compute average occupancy rate
  const heatMatrix = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {};

    for (const rec of historyData) {
      const key = `${rec.day_of_week}-${rec.hour}`;
      if (!sums[key]) sums[key] = { total: 0, count: 0 };
      sums[key].total += totalLots > 0 ? rec.occupied_lots / totalLots : 0;
      sums[key].count += 1;
    }

    const matrix: number[][] = DAYS.map(() => HOURS.map(() => 0));
    for (const [key, { total, count }] of Object.entries(sums)) {
      const [d, h] = key.split("-").map(Number);
      if (d < 7 && h < 24) {
        matrix[d][h] = count > 0 ? total / count : 0;
      }
    }
    return matrix;
  }, [historyData, totalLots]);

  const maxRate = Math.max(...heatMatrix.flat());

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1a2744", border: "1px solid #1e3a5f" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>
            Peak Utilisation Heatmap
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            Average occupancy by day × hour — last 7 days
          </div>
        </div>
        {/* Colour scale legend */}
        <div className="flex items-center gap-2">
          <span style={{ color: "#64748b", fontSize: 10 }}>Low</span>
          <div
            style={{
              width: 80,
              height: 10,
              borderRadius: 4,
              background: "linear-gradient(to right, hsl(240,80%,20%), hsl(120,80%,35%), hsl(0,80%,55%))",
            }}
          />
          <span style={{ color: "#64748b", fontSize: 10 }}>High</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 520 }}>
          {/* Day column headers */}
          <div className="flex" style={{ marginLeft: 32, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid rows (one per hour) */}
          {HOURS.map((hour) => (
            <div key={hour} className="flex items-center" style={{ marginBottom: 2 }}>
              {/* Hour label */}
              <div
                style={{
                  width: 28,
                  flexShrink: 0,
                  color: "#64748b",
                  fontSize: 9,
                  textAlign: "right",
                  paddingRight: 4,
                }}
              >
                {formatHour(hour)}
              </div>

              {/* Day cells */}
              {DAYS.map((_, dayIdx) => {
                const rate = heatMatrix[dayIdx]?.[hour] ?? 0;
                const normRate = maxRate > 0 ? rate / maxRate : 0;
                const bg = heatColor(normRate);

                return (
                  <div
                    key={dayIdx}
                    style={{
                      flex: 1,
                      height: 13,
                      borderRadius: 2,
                      background: bg,
                      margin: "0 1px",
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        day: dayIdx,
                        hour,
                        rate,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip (fixed portal-style) */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y - 60,
            left: tooltip.x - 80,
            background: "#0d1b2a",
            border: "1px solid #1e3a5f",
            borderRadius: 8,
            padding: "8px 12px",
            zIndex: 9999,
            pointerEvents: "none",
            minWidth: 160,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 700 }}>
            {DAYS[tooltip.day]} {String(tooltip.hour).padStart(2, "0")}:00
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
            Avg occupancy:{" "}
            <span style={{ color: "#f97316", fontWeight: 700 }}>
              {(tooltip.rate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div
        className="flex gap-6 mt-4 pt-3"
        style={{ borderTop: "1px solid #1e3a5f" }}
      >
        {[
          { label: "Mon–Fri Peak", value: "18:00–20:00", color: "#ef4444" },
          { label: "Lunch Rush", value: "12:00–13:00", color: "#f97316" },
          { label: "Morning Commute", value: "07:00–09:00", color: "#fbbf24" },
          { label: "Off-Peak", value: "01:00–05:00", color: "#1e3a5f" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
