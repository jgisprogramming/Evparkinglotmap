import React from "react";
import { Navigation2, DollarSign, Plug, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  delta?: string;
  deltaPositive?: boolean;
  accentColor: string;
  glowColor: string;
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
  delta,
  deltaPositive,
  accentColor,
  glowColor,
}: MetricCardProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-4 flex-1"
      style={{
        background: "#1a2744",
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 24px ${glowColor}18`,
        minWidth: 0,
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 32,
            height: 32,
            background: `${accentColor}18`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <span style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        {subValue && (
          <span style={{ color: "#64748b", fontSize: 13, marginLeft: 6 }}>{subValue}</span>
        )}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1">
          {deltaPositive ? (
            <TrendingUp size={12} color="#22c55e" />
          ) : (
            <TrendingDown size={12} color="#f97316" />
          )}
          <span style={{ color: deltaPositive ? "#22c55e" : "#f97316", fontSize: 11 }}>
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}

interface MetricsRowProps {
  distanceKm: number;
  price: number;
  priceType: string;
  availablePlugs: number;
  totalPlugs: number;
  operator: string;
  stationName: string;
}

export function MetricsRow({
  distanceKm,
  price,
  priceType,
  availablePlugs,
  totalPlugs,
  operator,
}: MetricsRowProps) {
  const availabilityPct = totalPlugs > 0 ? Math.round((availablePlugs / totalPlugs) * 100) : 0;
  const isGoodAvailability = availabilityPct >= 50;

  const distStr =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(2)} km`;

  return (
    <div className="flex gap-4">
      <MetricCard
        icon={<Navigation2 size={16} />}
        label="Distance"
        accentColor="#38bdf8"
        glowColor="#38bdf8"
        value={distStr}
        subValue="straight-line"
        delta="Geodesic (Haversine)"
        deltaPositive={true}
      />
      <MetricCard
        icon={<DollarSign size={16} />}
        label="Charging Price"
        accentColor="#a78bfa"
        glowColor="#a78bfa"
        value={`$${price.toFixed(2)}`}
        subValue={priceType}
        delta={operator}
        deltaPositive={true}
      />
      <MetricCard
        icon={<Plug size={16} />}
        label="Plug Availability"
        accentColor={isGoodAvailability ? "#22c55e" : "#f97316"}
        glowColor={isGoodAvailability ? "#22c55e" : "#f97316"}
        value={`${availablePlugs} / ${totalPlugs}`}
        subValue="Plugs Available"
        delta={`${availabilityPct}% utilisation capacity`}
        deltaPositive={isGoodAvailability}
      />
    </div>
  );
}
