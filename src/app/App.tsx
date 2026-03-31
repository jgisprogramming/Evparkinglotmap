import { EVParkingMap } from './components/EVParkingMap';

export default function App() {
  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 7 7l5 5-7 6 8-4-3-5 7-7z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">EV Parking Occupancy</h1>
            <p className="text-sm text-gray-600">Real-time availability across Singapore</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <EVParkingMap />
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
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          Hover over markers for details
        </div>
      </div>
    </div>
  );
}