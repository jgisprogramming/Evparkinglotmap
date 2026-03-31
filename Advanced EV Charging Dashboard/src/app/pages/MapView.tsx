import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Overlay } from 'pigeon-maps';
import { getLtaMockApiDataFromCsv, LTA_Station } from '../data/mockData';

interface CustomMarkerProps {
  station: LTA_Station;
  availableCount: number;
  onHover: (station: LTA_Station | null) => void;
  onClick: () => void;
}

function CustomMarker({ station, availableCount, onHover, onClick }: CustomMarkerProps) {
  const color = availableCount >= 3 ? '#22c55e' : availableCount >= 1 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onClick}
      style={{
        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color,
        border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transform: 'translate(-50%, -50%)', transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
        onHover(station);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
        onHover(null);
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
        <path d="M12 2 7 7l5 5-7 6 8-4-3-5 7-7z" />
      </svg>
    </div>
  );
}

export default function MapView() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<LTA_Station[]>([]);
  const [hoveredStation, setHoveredStation] = useState<LTA_Station | null>(null);

  useEffect(() => {
    getLtaMockApiDataFromCsv("/ev_data.csv")
      .then(setStations)
      .catch(console.error);
  }, []);

  const getSpotCounts = (station: LTA_Station) => {
    let available = 0; let total = 0;
    station.chargingPoints.forEach(cp => cp.plugTypes.forEach(pt => pt.evIds.forEach(ev => {
      total++; if (ev.status === 1) available++;
    })));
    return { available, total };
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 7 7l5 5-7 6 8-4-3-5 7-7z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 m-0">EV Parking Occupancy</h1>
            <p className="text-sm text-gray-600 m-0">Real-time availability across Singapore</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <div className="absolute inset-0">
          <Map defaultCenter={[1.3521, 103.8198]} defaultZoom={12}>
            {stations.map((station) => {
              const { available } = getSpotCounts(station);
              return (
                <Overlay key={station.locationId} anchor={[station.latitude, station.longtitude]}>
                  <CustomMarker 
                    station={station} availableCount={available} onHover={setHoveredStation}
                    onClick={() => {
                      // Navigate via Router instead of window.location
                      navigate(`/dashboard?locationId=${station.locationId}`);
                    }}
                  />
                </Overlay>
              );
            })}
            
            {hoveredStation && (
              <Overlay anchor={[hoveredStation.latitude, hoveredStation.longtitude]} offset={[0, -50]}>
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]" style={{ pointerEvents: 'none' }}>
                  <div className="font-semibold text-sm mb-1">{hoveredStation.name}</div>
                  <div className="text-xs text-gray-600 mb-2">{hoveredStation.address}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="font-medium text-green-600">{getSpotCounts(hoveredStation).available} available</div>
                    <div className="text-gray-500">/ {getSpotCounts(hoveredStation).total} total</div>
                  </div>
                </div>
              </Overlay>
            )}
          </Map>
        </div>
      </main>
      
      <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-[1000]">
        <div className="text-sm font-semibold mb-3 text-gray-900">Legend</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-700">3+ lots available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-700">1-2 lots available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-700">No lots available</span>
          </div>
        </div>
      </div>
    </div>
  );
}