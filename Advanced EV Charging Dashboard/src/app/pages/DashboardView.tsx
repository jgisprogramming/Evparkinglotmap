import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from "recharts";
import { MapPin, DollarSign, Activity, Wrench, BatteryCharging, AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import { getLtaMockApiDataFromCsv, LTA_Station, generateTrendData } from "../data/mockData";

export default function DashboardView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [stations, setStations] = useState<LTA_Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [occupancyTab, setOccupancyTab] = useState<"total" | "peak" | "off-peak">("total");

  // Fetch CSV & Map to URL parameter
  useEffect(() => {
    getLtaMockApiDataFromCsv("/ev_data.csv")
      .then((data) => {
        setStations(data);
        
        const urlLocationId = searchParams.get("locationId");
        if (urlLocationId && data.some(s => s.locationId === urlLocationId)) {
          setSelectedStationId(urlLocationId);
        } else if (data.length > 0) {
          setSelectedStationId(data[0].locationId);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load EV data:", err);
        setIsLoading(false);
      });
  }, [searchParams]);

  const selectedStation = useMemo(
    () => stations.find((s) => s.locationId === selectedStationId) ?? stations[0],
    [selectedStationId, stations]
  );

  const { availableCount, occupiedCount, outOfServiceCount } = useMemo(() => {
    let avail = 0; let occ = 0; let oos = 0;
    if (selectedStation) {
      selectedStation.chargingPoints.forEach((cp) => {
        cp.plugTypes.forEach((pt) => {
          pt.evIds.forEach((ev) => {
            if (ev.status === 1) avail++;
            else if (ev.status === 0) occ++;
            else oos++; 
          });
        });
      });
    }
    return { availableCount: avail, occupiedCount: occ, outOfServiceCount: oos };
  }, [selectedStation]);
  
  const currentBase = availableCount + occupiedCount;
  const totalPlugs = currentBase + outOfServiceCount;
  const uptimePercent = totalPlugs === 0 ? 0 : (currentBase / totalPlugs) * 100;

  const pieData = [
    { name: "Available", value: availableCount, color: "#10b981" },
    { name: "Occupied", value: occupiedCount, color: "#f59e0b" },
    { name: "Out of Service", value: outOfServiceCount, color: "#ef4444" },
  ];

  const monthlyRevenue = useMemo(() => {
    if (!selectedStation) return 0;
    const hash = selectedStation.locationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 4500 + ((hash * 123) % 6000); 
  }, [selectedStation]);

  const { chartData, fullDayChartData, overallOccupancyPercent } = useMemo(() => {
    if (!selectedStation) return { chartData: [], fullDayChartData: [], overallOccupancyPercent: 0 };
    const hourlyData = generateTrendData(selectedStation.locationId, totalPlugs, outOfServiceCount);
    const fullDayChartDataFormatted = [...hourlyData];
    const isPeakHour = (h: number) => (h >= 8 && h <= 10) || (h >= 17 && h <= 20);
    const chartDataFormatted = hourlyData.filter(d => {
      if (occupancyTab === "peak") return isPeakHour(d.hour);
      if (occupancyTab === "off-peak") return !isPeakHour(d.hour);
      return true;
    });
    const aggOcc = chartDataFormatted.reduce((acc, curr) => acc + curr.occ, 0);
    const aggAvail = chartDataFormatted.reduce((acc, curr) => acc + curr.avail, 0);
    const overallPercent = (aggOcc + aggAvail) === 0 ? 0 : (aggOcc / (aggOcc + aggAvail)) * 100;

    return { chartData: chartDataFormatted, fullDayChartData: fullDayChartDataFormatted, overallOccupancyPercent: overallPercent };
  }, [selectedStation, occupancyTab, totalPlugs, outOfServiceCount]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "#fafafa" }}>
        <Loader2 className="animate-spin" size={32} color="#a3a3a3" />
      </div>
    );
  }

  if (!selectedStation) return null;

  return (
    <div className="flex h-screen w-screen flex-col font-sans" style={{ background: "#fafafa", color: "#171717" }}>
      
      {/* ── HEADER WITH BACK BUTTON ── */}
      <header className="flex items-center justify-between px-8 py-5 shrink-0 bg-white" style={{ borderBottom: "1px solid #eaeaea" }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/map')}
            className="flex items-center justify-center p-2 mr-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Back to Map"
          >
            <ChevronLeft size={20} color="#171717" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mr-2 hidden sm:block"></div>
          
          <MapPin size={18} color="#171717" />
          <h1 className="text-lg font-semibold tracking-tight truncate max-w-[200px] sm:max-w-none" style={{ color: "#171717" }}>
            {selectedStation.name}
          </h1>
        </div>
        
        <select
          value={selectedStationId}
          onChange={(e) => {
            const newId = e.target.value;
            setSelectedStationId(newId);
            setSearchParams({ locationId: newId });
          }}
          className="px-3 py-2 rounded-md outline-none cursor-pointer transition-colors hover:bg-gray-50 max-w-[150px] sm:max-w-sm"
          style={{ background: "#ffffff", color: "#171717", border: "1px solid #e5e5e5", fontSize: "14px" }}
        >
          {stations.map((s) => (
            <option key={s.locationId} value={s.locationId}>
              {s.address}
            </option>
          ))}
        </select>
      </header>

      {/* ── MAIN DASHBOARD CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

          {/* ── ROW 1: METRIC CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 flex flex-col justify-center gap-2 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BatteryCharging size={16} color="#737373" />
                <span className="text-gray-500 text-[11px] font-semibold tracking-wider uppercase">Current Availability</span>
              </div>
              <span className="text-4xl font-semibold tracking-tight text-gray-900 leading-none">
                {availableCount} <span className="text-gray-400 text-2xl font-normal">/ {currentBase}</span>
              </span>
              <span className="text-gray-400 text-xs mt-1">Available vs Total Active</span>
            </div>

            <div className="rounded-2xl p-6 flex flex-col justify-center gap-2 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} color="#737373" />
                <span className="text-gray-500 text-[11px] font-semibold tracking-wider uppercase">Monthly Revenue</span>
              </div>
              <span className="text-4xl font-semibold tracking-tight text-gray-900 leading-none">
                ${monthlyRevenue.toLocaleString()}
              </span>
              <span className="text-gray-400 text-xs mt-1">Estimated MTD Earnings</span>
            </div>

            <div className="rounded-2xl p-6 flex flex-col justify-center gap-2 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={16} color="#737373" />
                <span className="text-gray-500 text-[11px] font-semibold tracking-wider uppercase">Network Uptime</span>
              </div>
              <span className="text-4xl font-semibold tracking-tight text-gray-900 leading-none">
                {uptimePercent.toFixed(1)}%
              </span>
              <span className="text-gray-400 text-xs mt-1">Active vs Total Hardware</span>
            </div>
          </div>

          {/* ── ROW 2: PIE CHART & OUT OF OPERATION TREND ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 flex flex-col bg-white border border-gray-200 shadow-sm lg:col-span-1 min-h-[300px]">
              <span className="text-gray-900 text-[15px] font-semibold tracking-tight">Plug Status Split</span>
              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#eaeaea', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#737373", paddingTop: "15px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-6 flex flex-col bg-white border border-gray-200 shadow-sm lg:col-span-2 min-h-[300px]">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle size={18} color="#ef4444" />
                <span className="text-gray-900 text-[15px] font-semibold tracking-tight">Out of Operation Trend (24h)</span>
              </div>
              <div className="flex-1 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fullDayChartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="time" stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} tickMargin={10} />
                    <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      formatter={(value: number) => [value, 'Offline Plugs']}
                    />
                    <Bar dataKey="outOfService" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── ROW 3: OCCUPANCY TREND ── */}
          <div className="rounded-2xl p-8 flex flex-col gap-8 bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Activity size={18} color="#171717" />
                <span className="text-gray-900 text-base font-semibold tracking-tight">Occupancy Trend & Rate</span>
              </div>
              <div className="flex p-1 rounded-lg bg-gray-50 border border-gray-200">
                {(["total", "peak", "off-peak"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setOccupancyTab(tab)}
                    className="flex-1 md:flex-none px-5 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
                    style={{ 
                      background: occupancyTab === tab ? "#ffffff" : "transparent",
                      color: occupancyTab === tab ? "#171717" : "#737373",
                      boxShadow: occupancyTab === tab ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="flex flex-col items-center lg:items-start shrink-0">
                <span className="text-gray-900 text-6xl font-semibold tracking-tight leading-none">
                  {overallOccupancyPercent.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-[13px] font-medium mt-3">
                  Avg. Actual Rate for {occupancyTab.charAt(0).toUpperCase() + occupancyTab.slice(1)} Hours
                </span>
              </div>

              <div className="flex-1 w-full min-w-0">
                <div className="w-full overflow-x-auto overflow-y-hidden pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
                  <div style={{ minWidth: "800px", height: "260px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#171717" stopOpacity={0.08}/>
                            <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.08}/>
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                        <XAxis dataKey="time" stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} tickMargin={12} />
                        <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                        />
                        <Legend verticalAlign="top" align="right" height={36} iconType="plainline" wrapperStyle={{ fontSize: "12px", color: "#737373" }} />
                        <Area type="monotone" dataKey="predictedRate" name="Predicted Rate" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" />
                        <Area type="monotone" dataKey="occupancyRate" name="Actual Rate" stroke="#171717" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOcc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}