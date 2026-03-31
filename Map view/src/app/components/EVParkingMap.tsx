import { useState } from 'react';
import { Map, Overlay } from 'pigeon-maps';

export interface CarPark {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  totalEVSpots: number;
  availableEVSpots: number;
}

// Mock data for Singapore EV carparks
const mockCarParks: CarPark[] = [
  {
    id: '1',
    name: 'Marina Bay Sands',
    location: 'Marina Bay',
    lat: 1.2834,
    lng: 103.8607,
    totalEVSpots: 24,
    availableEVSpots: 8,
  },
  {
    id: '2',
    name: 'Orchard Central',
    location: 'Orchard Road',
    lat: 1.3012,
    lng: 103.8395,
    totalEVSpots: 18,
    availableEVSpots: 12,
  },
  {
    id: '3',
    name: 'Jewel Changi Airport',
    location: 'Changi',
    lat: 1.3594,
    lng: 103.9890,
    totalEVSpots: 32,
    availableEVSpots: 5,
  },
  {
    id: '4',
    name: 'VivoCity',
    location: 'HarbourFront',
    lat: 1.2644,
    lng: 103.8224,
    totalEVSpots: 20,
    availableEVSpots: 15,
  },
  {
    id: '5',
    name: 'Tampines Mall',
    location: 'Tampines',
    lat: 1.3526,
    lng: 103.9446,
    totalEVSpots: 16,
    availableEVSpots: 3,
  },
  {
    id: '6',
    name: 'Jurong Point',
    location: 'Jurong East',
    lat: 1.3396,
    lng: 103.7063,
    totalEVSpots: 22,
    availableEVSpots: 18,
  },
  {
    id: '7',
    name: 'Suntec City',
    location: 'Marina Centre',
    lat: 1.2952,
    lng: 103.8583,
    totalEVSpots: 28,
    availableEVSpots: 14,
  },
  {
    id: '8',
    name: 'Westgate',
    location: 'Jurong Gateway',
    lat: 1.3340,
    lng: 103.7425,
    totalEVSpots: 15,
    availableEVSpots: 7,
  },
  {
    id: '9',
    name: 'ION Orchard',
    location: 'Orchard',
    lat: 1.3041,
    lng: 103.8318,
    totalEVSpots: 30,
    availableEVSpots: 22,
  },
  {
    id: '10',
    name: 'Raffles City',
    location: 'City Hall',
    lat: 1.2930,
    lng: 103.8529,
    totalEVSpots: 20,
    availableEVSpots: 6,
  },
  {
    id: '11',
    name: 'Parkway Parade',
    location: 'Marine Parade',
    lat: 1.3019,
    lng: 103.9054,
    totalEVSpots: 14,
    availableEVSpots: 10,
  },
  {
    id: '12',
    name: 'Bugis Junction',
    location: 'Bugis',
    lat: 1.2990,
    lng: 103.8556,
    totalEVSpots: 12,
    availableEVSpots: 4,
  },
  {
    id: '13',
    name: 'Northpoint City',
    location: 'Yishun',
    lat: 1.4296,
    lng: 103.8356,
    totalEVSpots: 19,
    availableEVSpots: 16,
  },
  {
    id: '14',
    name: 'Compass One',
    location: 'Sengkang',
    lat: 1.3917,
    lng: 103.8951,
    totalEVSpots: 17,
    availableEVSpots: 9,
  },
  {
    id: '15',
    name: 'Clementi Mall',
    location: 'Clementi',
    lat: 1.3149,
    lng: 103.7645,
    totalEVSpots: 13,
    availableEVSpots: 11,
  },
];

const getColorByAvailability = (available: number) => {
  if (available >= 3) return '#22c55e'; // green
  if (available >= 1) return '#f59e0b'; // orange
  return '#ef4444'; // red
};

interface CustomMarkerProps {
  carpark: CarPark;
  onHover: (carpark: CarPark | null) => void;
}

function CustomMarker({ carpark, onHover }: CustomMarkerProps) {
  const color = getColorByAvailability(carpark.availableEVSpots);

  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: color,
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
        onHover(carpark);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
        onHover(null);
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      >
        <path d="M12 2 7 7l5 5-7 6 8-4-3-5 7-7z" />
      </svg>
    </div>
  );
}

export function EVParkingMap() {
  const [hoveredCarpark, setHoveredCarpark] = useState<CarPark | null>(null);

  return (
    <div className="absolute inset-0">
      <Map 
        defaultCenter={[1.3521, 103.8198]} 
        defaultZoom={12}
      >
        {mockCarParks.map((carpark) => (
          <Overlay
            key={carpark.id}
            anchor={[carpark.lat, carpark.lng]}
          >
            <CustomMarker carpark={carpark} onHover={setHoveredCarpark} />
          </Overlay>
        ))}
        
        {hoveredCarpark && (
          <Overlay anchor={[hoveredCarpark.lat, hoveredCarpark.lng]} offset={[0, -50]}>
            <div 
              className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]"
              style={{ pointerEvents: 'none' }}
            >
              <div className="font-semibold text-sm mb-1">{hoveredCarpark.name}</div>
              <div className="text-xs text-gray-600 mb-2">{hoveredCarpark.location}</div>
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium text-green-600">
                  {hoveredCarpark.availableEVSpots} available
                </div>
                <div className="text-gray-500">
                  / {hoveredCarpark.totalEVSpots} total
                </div>
              </div>
            </div>
          </Overlay>
        )}
      </Map>
    </div>
  );
}