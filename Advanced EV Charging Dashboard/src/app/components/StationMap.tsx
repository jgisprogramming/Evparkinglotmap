import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { StationConfig, ChargerUnit } from "../data/mockData";

interface FlyToProps {
  lat: number;
  lon: number;
}
function FlyTo({ lat, lon }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
}

interface Props {
  userLat: number;
  userLon: number;
  stations: StationConfig[];
  allUnits: ChargerUnit[];
  selectedStationId: string;
}

export function StationMap({ userLat, userLon, stations, allUnits, selectedStationId }: Props) {
  const selected = stations.find((s) => s.id === selectedStationId);

  const getAvailability = (stationId: string) => {
    const units = allUnits.filter((u) => u.station_id === stationId);
    const avail = units.filter((u) => u.status === 1).length;
    return { avail, total: units.length };
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ height: 340, border: "1px solid #1e3a5f", position: "relative" }}
    >
      {/* Map label */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "rgba(13,27,42,0.85)",
          border: "1px solid #1e3a5f",
          borderRadius: 8,
          padding: "4px 10px",
          color: "#94a3b8",
          fontSize: 11,
          pointerEvents: "none",
          backdropFilter: "blur(4px)",
        }}
      >
        🇸🇬 Singapore EV Network
      </div>

      <MapContainer
        center={[1.3521, 103.8198]}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0d1b2a" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fly to selected station */}
        {selected && <FlyTo lat={selected.latitude} lon={selected.longitude} />}

        {/* User location */}
        <CircleMarker
          center={[userLat, userLon]}
          radius={10}
          pathOptions={{
            fillColor: "#38bdf8",
            fillOpacity: 0.9,
            color: "#0ea5e9",
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ color: "#0f172a", fontWeight: 600, fontSize: 13 }}>
              📍 Your Location
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
              {userLat.toFixed(4)}, {userLon.toFixed(4)}
            </div>
          </Popup>
        </CircleMarker>

        {/* Pulse ring for user location */}
        <CircleMarker
          center={[userLat, userLon]}
          radius={18}
          pathOptions={{
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#38bdf8",
            weight: 1.5,
            opacity: 0.4,
          }}
        />

        {/* All stations */}
        {stations.map((station) => {
          const { avail, total } = getAvailability(station.id);
          const isSelected = station.id === selectedStationId;
          const hasAvailable = avail > 0;
          const color = hasAvailable ? "#22c55e" : "#ef4444";

          return (
            <React.Fragment key={station.id}>
              {isSelected && (
                <CircleMarker
                  center={[station.latitude, station.longitude]}
                  radius={22}
                  pathOptions={{
                    fillColor: "transparent",
                    fillOpacity: 0,
                    color: color,
                    weight: 2,
                    opacity: 0.5,
                  }}
                />
              )}
              <CircleMarker
                center={[station.latitude, station.longitude]}
                radius={isSelected ? 11 : 7}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: isSelected ? 0.95 : 0.75,
                  color: isSelected ? "#ffffff" : color,
                  weight: isSelected ? 2 : 1,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>
                      ⚡ {station.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>
                      {station.address}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: hasAvailable ? "#dcfce7" : "#fee2e2",
                        color: hasAvailable ? "#15803d" : "#b91c1c",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {avail} / {total} Available
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {station.operator} · ${station.price} {station.priceType}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}