# ELD Trip Planner

A full-stack web application for planning HOS (Hours of Service) compliant trips for property-carrying CMV (Commercial Motor Vehicle) drivers using the 70hr/8-day cycle.

## Features

- **Interactive Route Planning**: Enter current location, pickup, and dropoff points
- **HOS-Compliant Scheduling**: Automatically calculates legal driving hours, breaks, and rest periods per DOT regulations
- **Visual ELD Logs**: Canvas-based Electronic Logging Device (ELD) daily logs with duty status visualization
- **Route Map**: Interactive Leaflet map showing trip route and stops
- **Stop Timeline**: Detailed timeline of all pickup, dropoff, fuel, and rest stops
- **Cycle Tracking**: Monitors 70-hour/8-day cycle usage and alerts when approaching limits

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Map**: Leaflet.js + OpenStreetMap (free, no API key required)
- **State Management**: React hooks (useState, useCallback)
- **Geocoding**: Nominatim (OpenStreetMap free geocoding service)
- **Deployment**: Vercel

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd eld-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build & Production

```bash
npm run build
npm run start
```

## Project Structure

```
eld-planner/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main page with trip planner UI
│   ├── globals.css          # Global styles
│   └── api/
│       └── plan-trip/
│           └── route.ts     # Trip planning API endpoint
├── components/
│   ├── TripForm.tsx         # Input form for trip details
│   ├── TripMap.tsx          # Leaflet map component
│   ├── ELDLogSheet.tsx      # Single day ELD log (canvas)
│   ├── ELDLogsPanel.tsx     # Multi-day log container
│   └── StopTimeline.tsx     # Timeline of trip stops
├── lib/
│   ├── hosEngine.ts         # HOS calculation engine (core logic)
│   └── geoUtils.ts          # Geographic utilities (geocoding, distance)
├── types/
│   └── trip.ts              # TypeScript interfaces
└── public/                  # Static assets
```

## Usage

1. **Enter Trip Details**:
   - Current Location (e.g., "Chicago, IL")
   - Pickup Location (e.g., "St. Louis, MO")
   - Dropoff Location (e.g., "Nashville, TN")
   - Hours already used in current 70-hour cycle (0-70)

2. **View Results**:
   - Route map showing waypoints
   - Stop timeline with duration details
   - Multi-day ELD log sheets with duty status breakdown

## Business Rules Implemented

### HOS (Hours of Service) - Property Carrier, 70hr/8-day

- **11-Hour Driving Limit**: Maximum 11 hours driving after 10 consecutive hours off duty
- **14-Hour Window**: Must stop driving 14 hours after coming on duty (non-driving work allowed)
- **30-Minute Break**: Required after 8 cumulative driving hours
- **10-Hour Off-Duty Reset**: Resets both 11hr and 14hr clocks
- **70-Hour/8-Day Limit**: Total on-duty hours cannot exceed 70 in rolling 8-day window
- **34-Hour Restart**: Optional 34+ consecutive hours off duty resets the 70hr/8-day counter

### Trip Assumptions

- Driver is property-carrying CMV on 70hr/8-day cycle
- No adverse driving conditions
- Fuel stop required every 1,000 miles (30 min, On Duty Not Driving)
- Pickup stop: 1 hour (On Duty Not Driving)
- Dropoff stop: 1 hour (On Duty Not Driving)
- Driving speed: 55 mph average
- Pre-trip inspection: 15 minutes at start of each day

## API Reference

### POST /api/plan-trip

**Request Body:**
```json
{
  "currentLocation": "Chicago, IL",
  "pickupLocation": "St. Louis, MO",
  "dropoffLocation": "Nashville, TN",
  "currentCycleUsedHours": 20
}
```

**Response:**
```json
{
  "totalDistanceMiles": 620,
  "estimatedDrivingHours": 11.3,
  "totalTripDays": 2,
  "stops": [...],
  "logDays": [...],
  "routeCoordinates": [...],
  "warnings": []
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository at [vercel.com](https://vercel.com)
3. Select "Next.js" as framework
4. Deploy (no environment variables needed)

### Manual Deployment

```bash
npm run build
npm start
```

## Testing Scenarios

**Short Trip (single day)**:
- Current: Chicago, IL
- Pickup: St. Louis, MO
- Dropoff: Nashville, TN
- Cycle Used: 0 hours

**Long Trip (multi-day)**:
- Current: Los Angeles, CA
- Pickup: Phoenix, AZ
- Dropoff: Dallas, TX
- Cycle Used: 55 hours

## Legal Disclaimer

This tool is for planning purposes only. Users must verify all trip plans comply with applicable DOT HOS regulations. Actual ELD devices must be certified and meet all federal requirements.

## License

MIT

