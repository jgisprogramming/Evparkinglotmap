import React, { useState } from "react";
import {
  Zap,
  MapPin,
  ChevronDown,
  ChevronUp,
  Activity,
  Wifi,
  Circle,
} from "lucide-react";
import type { StationConfig, ChargerUnit } from "../data/mockData";

interface Props {
  stations: StationConfig[];
  allUnits: ChargerUnit[];
  userLat: string;
  userLon: string;
  onLatChange: (v: string) => void;
  onLonChange: (v: string) => void;
  selectedStation: string;
  onStationChange: (v: string) => void;
  lastUpdated: Date;
}

export function DashboardSidebar({
  stations,
  allUnits,
  userLat,
  userLon,
  onLatChange,
  onLonChange,
  selectedStation,
  onStationChange,
  lastUpdated,
}: Props) {
  const [fleetOpen, setFleetOpen] = useState(true);

  // Fleet-wide stats
  const totalPlugs = allUnits.length;
  const availablePlugs = allUnits.filter((u) => u.status === 1).length;
  const occupiedPlugs = allUnits.filter((u) => u.status === 0).length;
  const offlinePlugs = allUnits.filter((u) => u.status === 100).length;
  const stationsWithAvailability = new Set(
    allUnits.filter((u) => u.status === 1).map((u) => u.station_name)
  ).size;

  const operatorCounts = allUnits.reduce<Record<string, number>>((acc, u) => {
    acc[u.operator] = (acc[u.operator] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 276,
        minWidth: 276,
        background: "#0d1b2a",
        borderRight: "1px solid #1e3a5f",
      }}
    >
      {/* ── Logo / Title ────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #1e3a5f" }}
      >
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            boxShadow: "0 0 16px rgba(14,165,233,0.4)",
          }}
        >
          <Zap size={20} color="#fff" fill="#fff" />
        </div>
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em" }}>
            EV Charge SG
          </div>
          <div style={{ color: "#64748b", fontSize: 11 }}>LTA DataMall Live Feed</div>
        </div>
      </div>

      {/* ── Live Indicator ───────────────────────────────────── */}
      <div
        className="flex items-center gap-2 mx-4 mt-3 mb-2 px-3 py-2 rounded-lg"
        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: "#22c55e" }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: "#22c55e" }}
          />
        </span>
        <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 600 }}>LIVE</span>
        <span style={{ color: "#64748b", fontSize: 11, marginLeft: "auto" }}>
          {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-3 flex-1">
        {/* ── Your Location ─────────────────────────────────── */}
        <section>
          <div
            className="flex items-center gap-2 mb-2"
            style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            <MapPin size={12} />
            Your Location
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Latitude", value: userLat, onChange: onLatChange, placeholder: "1.3521" },
              { label: "Longitude", value: userLon, onChange: onLonChange, placeholder: "103.8198" },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <label
                  style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 4 }}
                >
                  {label}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width: "100%",
                    background: "#0f2336",
                    border: "1px solid #1e3a5f",
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: "#38bdf8",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Station Selector ──────────────────────────────── */}
        <section>
          <div
            className="flex items-center gap-2 mb-2"
            style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            <Wifi size={12} />
            Select Station
          </div>
          <select
            value={selectedStation}
            onChange={(e) => onStationChange(e.target.value)}
            style={{
              width: "100%",
              background: "#0f2336",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: "8px 10px",
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Selected station quick info */}
          {(() => {
            const s = stations.find((x) => x.id === selectedStation);
            if (!s) return null;
            const stUnits = allUnits.filter((u) => u.station_id === selectedStation);
            const avail = stUnits.filter((u) => u.status === 1).length;
            return (
              <div
                className="mt-2 rounded-lg p-3"
                style={{ background: "#0f2336", border: "1px solid #1e3a5f" }}
              >
                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{s.address}</div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#64748b", fontSize: 11 }}>{s.operator}</span>
                  <span style={{ color: "#38bdf8", fontSize: 11, fontWeight: 600 }}>
                    ${s.price} {s.priceType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Circle
                    size={8}
                    fill={avail > 0 ? "#22c55e" : "#ef4444"}
                    color={avail > 0 ? "#22c55e" : "#ef4444"}
                  />
                  <span
                    style={{
                      color: avail > 0 ? "#22c55e" : "#ef4444",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {avail > 0 ? `${avail} plug${avail !== 1 ? "s" : ""} available` : "No plugs available"}
                  </span>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ── Fleet Summary (Expander) ───────────────────────── */}
        <section>
          <button
            onClick={() => setFleetOpen((v) => !v)}
            className="flex items-center justify-between w-full"
            style={{
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: fleetOpen ? 8 : 0,
            }}
          >
            <div className="flex items-center gap-2">
              <Activity size={12} />
              Fleet Summary
            </div>
            {fleetOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {fleetOpen && (
            <div
              className="rounded-xl p-3 flex flex-col gap-3"
              style={{ background: "#0f2336", border: "1px solid #1e3a5f" }}
            >
              {/* Overall plug grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Available", value: availablePlugs, color: "#22c55e" },
                  { label: "Occupied", value: occupiedPlugs, color: "#f97316" },
                  { label: "Offline", value: offlinePlugs, color: "#ef4444" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center rounded-lg py-2"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <span style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</span>
                    <span style={{ color: "#64748b", fontSize: 10 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Stacked bar */}
              <div className="flex rounded overflow-hidden" style={{ height: 6 }}>
                {totalPlugs > 0 && (
                  <>
                    <div
                      style={{
                        width: `${(availablePlugs / totalPlugs) * 100}%`,
                        background: "#22c55e",
                      }}
                    />
                    <div
                      style={{
                        width: `${(occupiedPlugs / totalPlugs) * 100}%`,
                        background: "#f97316",
                      }}
                    />
                    <div
                      style={{
                        width: `${(offlinePlugs / totalPlugs) * 100}%`,
                        background: "#ef4444",
                      }}
                    />
                  </>
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-between">
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {stationsWithAvailability} / {stations.length} stations online
                </span>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  {totalPlugs} total plugs
                </span>
              </div>

              {/* Operators */}
              <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 8 }}>
                <div style={{ color: "#64748b", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  By Operator
                </div>
                {Object.entries(operatorCounts).map(([op, count]) => (
                  <div key={op} className="flex justify-between items-center mb-1">
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{op}</span>
                    <span style={{ color: "#38bdf8", fontSize: 11, fontWeight: 600 }}>
                      {count} plugs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid #1e3a5f", color: "#334155", fontSize: 10 }}
      >
        Data: LTA DataMall EV Charging Points API · Mocked for demo
      </div>
    </aside>
  );
}
