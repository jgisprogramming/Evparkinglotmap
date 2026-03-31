// mockData.ts
import { format } from "date-fns";
import Papa from "papaparse";

// ── Types: Static Dataset (from CSV) ──────────────────────────────────────────
export interface StaticEVRow {
  "EV Charge": string;
  operator: string;
  "No. of Charging Outlets": number;
  evCpId: string;
  plugType: string;
  chargingSpeed: number;
  PostalCode: string;
  "Block/House No": string;
  "Street Name": string;
  "Building Name": string;
  "Floor No": string;
  "Lot No": string;
  "Is the char": string;
  longitude: number;
  latitude: number;
}

// ── Types: LTA Datamall API Specifications ────────────────────────────────────
export interface LTA_EvId {
  id: string;
  evCpId: string;
  status: 0 | 1 | ""; // 0: Occupied, 1: Available, "": Not Available
}

export interface LTA_PlugType {
  plugType: string;
  powerRating: string;
  chargingSpeed: number;
  price: number;
  priceType: string;
  evIds: LTA_EvId[];
}

export interface LTA_ChargingPoint {
  status: 0 | 1 | 100;
  operationHours: string;
  operator: string;
  position: string;
  name: string;
  id: string;
  plugTypes: LTA_PlugType[];
}

export interface LTA_Station {
  address: string;
  name: string;
  longtitude: number; // Keeping LTA API spelling
  latitude: number;
  locationId: string;
  status: 0 | 1 | 100;
  chargingPoints: LTA_ChargingPoint[];
}

export interface HourlyTrend {
  hour: number;
  time: string;
  occupancyRate: number;
  predictedRate: number;
  occ: number;
  avail: number;
  outOfService: number;
}

// ── Seeded PRNG (mulberry32) for Consistent Mocks ──────────────────────────────
function createRNG(seed: number) {
  let s = seed;
  return (): number => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const rng = createRNG(12345);

function mockEvStatus(): 0 | 1 | "" {
  const rand = rng();
  if (rand < 0.4) return 0;
  if (rand < 0.8) return 1;
  return "";
}

// ── Transformation Logic ───────────────────────────────────────────────────────
export function transformStaticToLtaApi(data: StaticEVRow[]): LTA_Station[] {
  const stationsMap = new Map<string, LTA_Station>();

  data.forEach((row) => {
    if (!row.longitude || !row.PostalCode) return; 

    const lonDecimals = (row.longitude.toString().split(".")[1] || "000000").padEnd(6, "0").substring(0, 6);
    const locationId = `${lonDecimals}${row.PostalCode}`;

    if (!stationsMap.has(locationId)) {
      stationsMap.set(locationId, {
        address: `${row["Block/House No"] || ""} ${row["Street Name"] || ""} Singapore ${row.PostalCode}`.trim(),
        name: row["Building Name"] || `${row["Block/House No"] || ""} ${row["Street Name"] || ""}`.trim(),
        longtitude: row.longitude,
        latitude: row.latitude,
        locationId: locationId,
        status: 100,
        chargingPoints: [],
      });
    }

    const station = stationsMap.get(locationId)!;
    const evStatus = mockEvStatus();
    
    const plugTypeStr = row.plugType || "";
    const isDC = plugTypeStr.includes("CCS") || plugTypeStr.includes("CHAdeMO") || row.chargingSpeed >= 50;
    
    const evIdObj: LTA_EvId = {
      id: row.evCpId,
      evCpId: row.evCpId,
      status: evStatus,
    };

    const plugTypeObj: LTA_PlugType = {
      plugType: row.plugType,
      powerRating: isDC ? "DC" : "AC",
      chargingSpeed: row.chargingSpeed,
      price: 0.55,
      priceType: "$/kWh",
      evIds: [evIdObj],
    };

    let cpStatus: 0 | 1 | 100 = 100; 
    if (evStatus === 1) cpStatus = 1;
    else if (evStatus === 0) cpStatus = 0;

    const chargingPoint: LTA_ChargingPoint = {
      status: cpStatus,
      operationHours: "24 Hours",
      operator: row.operator,
      position: `L${row["Floor No"] || "1"} Lot ${row["Lot No"] || "-"}`,
      name: row["Building Name"] || `${row["Block/House No"] || ""} ${row["Street Name"] || ""}`.trim(),
      id: row.evCpId,
      plugTypes: [plugTypeObj],
    };

    station.chargingPoints.push(chargingPoint);
  });

  const finalStations = Array.from(stationsMap.values());
  
  finalStations.forEach((station) => {
    let hasAvailable = false;
    let hasOccupied = false;

    station.chargingPoints.forEach((cp) => {
      if (cp.status === 1) hasAvailable = true;
      if (cp.status === 0) hasOccupied = true;
    });

    if (hasAvailable) {
      station.status = 1; 
    } else if (hasOccupied) {
      station.status = 0; 
    } else {
      station.status = 100; 
    }
  });

  return finalStations;
}

// ── CSV Loading Logic ──────────────────────────────────────────────────────────
export async function getLtaMockApiDataFromCsv(csvUrl: string): Promise<LTA_Station[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as StaticEVRow[];
          const transformedData = transformStaticToLtaApi(rawData);
          resolve(transformedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
    });
  });
}

// ── Time-Series Mocking Logic ──────────────────────────────────────────────────
export function generateTrendData(locationId: string, totalPlugs: number, outOfServiceCount: number): HourlyTrend[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const isPeakHour = (h: number) => (h >= 8 && h <= 10) || (h >= 17 && h <= 20);
    const baseOccRate = isPeakHour(hour) ? 0.65 : 0.25;
    
    // Seed based on locationId so the charts are stable for each station
    const seed = (locationId.charCodeAt(0) + hour) * 9.3;
    
    // Simulate Actual Occupancy Rate
    const actualNoise = ((seed % 100) / 100 - 0.5) * 0.2; // +/- 10%
    const actualRate = Math.min(1, Math.max(0, baseOccRate + actualNoise));

    // Simulate Predicted Occupancy Rate (Smoother, slightly offset)
    const predictedNoise = ((seed % 50) / 100 - 0.5) * 0.1; 
    const predictedRateRaw = Math.min(1, Math.max(0, baseOccRate + predictedNoise + 0.05));

    // Calculate active lots based on simulated out of service
    const oos = Math.floor(outOfServiceCount * (0.8 + ((seed % 50) / 100) * 0.4));
    const activeLots = Math.max(0, totalPlugs - oos);

    // Convert rates to raw numbers
    const occ = Math.round(activeLots * actualRate);
    const avail = activeLots - occ;
    const predictedOcc = Math.round(activeLots * predictedRateRaw);

    // Convert back to exact percentages based on whole numbers
    const actualPercent = activeLots === 0 ? 0 : (occ / activeLots) * 100;
    const predictedPercent = activeLots === 0 ? 0 : (predictedOcc / activeLots) * 100;

    return { 
      hour, 
      time: `${String(hour).padStart(2, '0')}:00`,
      occupancyRate: actualPercent,
      predictedRate: predictedPercent,
      occ, 
      avail, 
      outOfService: oos 
    };
  });
}