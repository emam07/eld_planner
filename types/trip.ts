export type DutyStatus =
  | 'off_duty'
  | 'sleeper_berth'
  | 'driving'
  | 'on_duty_not_driving';

export interface StatusBlock {
  status: DutyStatus;
  startMinute: number; // minutes from midnight of this log day (0–1439)
  endMinute: number;
  label?: string; // e.g. "Fueling", "Pickup", "Pre-trip inspection"
  location?: string; // city name or coordinates string
}

export interface LogDay {
  date: string; // ISO date string "YYYY-MM-DD"
  dayNumber: number; // 1-indexed trip day
  blocks: StatusBlock[]; // all duty status blocks for this day
  totalDrivingMinutes: number;
  totalOnDutyMinutes: number;
  remarks: RemarkEntry[];
  hoursAvailableStart: number; // hours available in 70hr bank at start of day
}

export interface RemarkEntry {
  timeMinute: number; // minute from midnight
  location: string;
  note: string;
}

export interface Stop {
  type: 'pickup' | 'dropoff' | 'fuel' | 'rest' | 'start';
  location: string;
  coordinates: [number, number]; // [lat, lng]
  arrivalMinute: number; // minutes from trip start
  durationMinutes: number;
  dayNumber: number;
}

export interface TripPlan {
  totalDistanceMiles: number;
  estimatedDrivingHours: number;
  totalTripDays: number;
  stops: Stop[];
  logDays: LogDay[];
  routeCoordinates: [number, number][]; // polyline points [lat, lng]
  warnings: string[];
}

export interface TripInput {
  currentLocation: string;
  currentLocationCoords: [number, number];
  pickupLocation: string;
  pickupCoords: [number, number];
  dropoffLocation: string;
  dropoffCoords: [number, number];
  currentCycleUsedHours: number; // hours already used in 70hr/8day cycle
}

export interface RouteSegment {
  fromCoords: [number, number];
  toCoords: [number, number];
  distanceMiles: number;
  label: string;
}
