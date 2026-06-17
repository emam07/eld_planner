/**
 * HOS (Hours of Service) Trip Planning Engine
 * Pure TypeScript - no React, no DOM, no imports except types
 */

import {
  DutyStatus,
  LogDay,
  RemarkEntry,
  RouteSegment,
  StatusBlock,
  Stop,
  TripInput,
  TripPlan,
} from '@/types/trip';
import { haversineDistanceMiles } from './geoUtils';

/**
 * Convert minutes from midnight to HH:MM string format
 */
export function minutesToTimeString(minuteFromMidnight: number): string {
  const hours = Math.floor(minuteFromMidnight / 60) % 24;
  const minutes = minuteFromMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get ISO date string for the nth day of trip
 */
export function dayIndexToDate(tripStartDate: Date, dayIndex: number): string {
  const d = new Date(tripStartDate);
  d.setDate(d.getDate() + dayIndex - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Insert a sleeper berth block into status blocks
 */
export function insertSleepBlock(
  blocks: StatusBlock[],
  startMinute: number,
  durationMinutes: number
): void {
  blocks.push({
    status: 'sleeper_berth',
    startMinute,
    endMinute: startMinute + durationMinutes,
    label: 'Sleeper Berth',
  });
}

/**
 * Check if a block crosses midnight
 */
export function crossesMidnight(
  startMinute: number,
  durationMinutes: number,
  dayStartMinute: number
): boolean {
  const endMinute = startMinute + durationMinutes;
  const dayEndMinute = dayStartMinute + 1440;
  return endMinute > dayEndMinute;
}

/**
 * Main trip planning function
 */
export function planTrip(input: TripInput, segments: RouteSegment[]): TripPlan {
  const tripStartDate = new Date();

  // Initialize state
  let currentMinute = 0;
  let drivingMinutesSinceLast30minBreak = 0;
  let drivingMinutesInWindow = 0;
  let onDutyMinutesInWindow = 0;
  let windowStartMinute = 0;
  let cycleMinutesUsed = Math.round(input.currentCycleUsedHours * 60);
  let odometerMiles = 0;

  let currentDayBlocks: StatusBlock[] = [];
  const logDays: LogDay[] = [];
  const stops: Stop[] = [];
  const warnings: string[] = [];
  const remarks: RemarkEntry[] = [];

  let currentDayNumber = 1;
  let currentDayStartMinute = 0;

  // Helper: finalize current log day
  const finalizeLogDay = (
    dayNumber: number,
    date: string,
    hoursAvailableStart: number
  ) => {
    // Pad to 1440 minutes if needed
    let totalMinutes = 0;
    for (const block of currentDayBlocks) {
      totalMinutes += block.endMinute - block.startMinute;
    }

    if (totalMinutes < 1440) {
      const padMinutes = 1440 - totalMinutes;
      currentDayBlocks.push({
        status: 'off_duty',
        startMinute: totalMinutes,
        endMinute: 1440,
        label: 'Off Duty (padding)',
      });
    }

    const totalDrivingMinutes = currentDayBlocks
      .filter((b) => b.status === 'driving')
      .reduce((sum, b) => sum + (b.endMinute - b.startMinute), 0);

    const totalOnDutyMinutes = currentDayBlocks
      .filter((b) =>
        ['driving', 'on_duty_not_driving'].includes(b.status)
      )
      .reduce((sum, b) => sum + (b.endMinute - b.startMinute), 0);

    const logDay: LogDay = {
      date,
      dayNumber,
      blocks: [...currentDayBlocks],
      totalDrivingMinutes,
      totalOnDutyMinutes,
      remarks: remarks.filter((r) => {
        const rDay = Math.floor(r.timeMinute / 1440);
        return rDay === dayNumber - 1;
      }),
      hoursAvailableStart,
    };

    logDays.push(logDay);
    currentDayBlocks = [];
  };

  // Helper: add status block
  const addBlock = (
    status: DutyStatus,
    durationMinutes: number,
    label?: string,
    location?: string
  ) => {
    const startMinute = currentMinute % 1440;
    let endMinute = startMinute + durationMinutes;

    if (endMinute > 1440) {
      // Block crosses midnight - finalize current day and start new one
      const dayDate = dayIndexToDate(tripStartDate, currentDayNumber);
      const hoursAvailable =
        (70 * 60 - cycleMinutesUsed) / 60;
      finalizeLogDay(currentDayNumber, dayDate, hoursAvailable);

      currentDayNumber++;
      currentDayStartMinute = currentMinute + durationMinutes;
      endMinute = durationMinutes;
      currentMinute += durationMinutes;

      currentDayBlocks.push({
        status,
        startMinute: 0,
        endMinute,
        label,
        location,
      });
    } else {
      currentDayBlocks.push({
        status,
        startMinute,
        endMinute,
        label,
        location,
      });
      currentMinute += durationMinutes;
    }

    // Update counters
    if (status === 'driving') {
      drivingMinutesSinceLast30minBreak += durationMinutes;
      drivingMinutesInWindow += durationMinutes;
      onDutyMinutesInWindow += durationMinutes;
      cycleMinutesUsed += durationMinutes;
    } else if (status === 'on_duty_not_driving') {
      onDutyMinutesInWindow += durationMinutes;
      cycleMinutesUsed += durationMinutes;
    } else if (status === 'sleeper_berth' || status === 'off_duty') {
      // Reset windows on 10-hour off/sleeper
      if (durationMinutes >= 600) {
        drivingMinutesInWindow = 0;
        onDutyMinutesInWindow = 0;
        windowStartMinute = currentMinute;
        drivingMinutesSinceLast30minBreak = 0;
      }
    }
  };

  // Start with pre-trip inspection on day 1
  remarks.push({
    timeMinute: 0,
    location: input.currentLocation,
    note: 'Trip start - Pre-trip inspection',
  });
  addBlock('on_duty_not_driving', 15, 'Pre-trip inspection', input.currentLocation);

  // Process each segment
  for (const segment of segments) {
    const segmentDriveTimeMinutes = Math.round((segment.distanceMiles / 55) * 60);

    // Check if 30-min break is needed
    if (drivingMinutesSinceLast30minBreak >= 480) {
      addBlock('off_duty', 30, '30-minute break');
      drivingMinutesSinceLast30minBreak = 0;
      remarks.push({
        timeMinute: currentMinute,
        location: segment.label,
        note: '30-minute break (required after 8 hours driving)',
      });
    }

    // Check if 11-hour driving limit would be exceeded
    if (drivingMinutesInWindow + segmentDriveTimeMinutes > 660) {
      // Drive until 11 hours (660 min)
      const remainingDriveTime = 660 - drivingMinutesInWindow;
      if (remainingDriveTime > 0) {
        addBlock('driving', remainingDriveTime, 'Driving', segment.label);
        odometerMiles += (remainingDriveTime / 60) * 55;
      }

      // Insert 10-hour rest
      addBlock('sleeper_berth', 600, '10-hour rest');
      drivingMinutesSinceLast30minBreak = 0;
      remarks.push({
        timeMinute: currentMinute,
        location: segment.label,
        note: '10-hour rest (11-hour driving limit reached)',
      });

      // Continue with remaining segment
      const remainingDistance = segment.distanceMiles - (odometerMiles % 1000);
      const remainingSegmentTime = Math.round(
        ((segment.distanceMiles - (remainingDriveTime / 60) * 55) / 55) * 60
      );
      addBlock('driving', remainingSegmentTime, 'Driving', segment.label);
      odometerMiles += (remainingSegmentTime / 60) * 55;
    } else {
      // Drive the segment
      addBlock('driving', segmentDriveTimeMinutes, 'Driving', segment.label);
      odometerMiles += segment.distanceMiles;
    }

    // Check if 14-hour window exceeded (stop driving)
    if (onDutyMinutesInWindow > 840) {
      remarks.push({
        timeMinute: currentMinute,
        location: segment.label,
        note: '14-hour window limit reached - no more driving',
      });
    }

    // Check for fuel stops (every 1000 miles)
    const segmentOdometerMarks = Math.floor(odometerMiles / 1000) -
      Math.floor((odometerMiles - segment.distanceMiles) / 1000) >
      0;
    if (
      segmentOdometerMarks ||
      (Math.floor(odometerMiles / 1000) > 0 &&
        Math.floor((odometerMiles - segment.distanceMiles) / 1000) <
          Math.floor(odometerMiles / 1000))
    ) {
      // Add fuel stop
      const fuelStopMinute = currentMinute;
      addBlock(
        'on_duty_not_driving',
        30,
        'Fuel stop',
        segment.label
      );
      stops.push({
        type: 'fuel',
        location: segment.label,
        coordinates: segment.toCoords,
        arrivalMinute: fuelStopMinute,
        durationMinutes: 30,
        dayNumber: currentDayNumber,
      });
      remarks.push({
        timeMinute: fuelStopMinute,
        location: segment.label,
        note: 'Fuel stop (1000-mile rule)',
      });
    }

    // Check 70-hour/8-day cycle
    if (cycleMinutesUsed > 4200) {
      warnings.push('70-hour/8-day cycle limit approaching');
      // Insert 34-hour restart
      addBlock('sleeper_berth', 2040, '34-hour restart');
      cycleMinutesUsed = 0;
      drivingMinutesInWindow = 0;
      onDutyMinutesInWindow = 0;
      drivingMinutesSinceLast30minBreak = 0;
      remarks.push({
        timeMinute: currentMinute,
        location: segment.label,
        note: '34-hour restart (70-hour cycle limit)',
      });
    }
  }

  // Add pickup stop
  stops.push({
    type: 'pickup',
    location: input.pickupLocation,
    coordinates: input.pickupCoords,
    arrivalMinute: currentMinute,
    durationMinutes: 60,
    dayNumber: currentDayNumber,
  });
  addBlock('on_duty_not_driving', 60, 'Pickup', input.pickupLocation);
  remarks.push({
    timeMinute: currentMinute - 60,
    location: input.pickupLocation,
    note: 'Pickup location',
  });

  // Add dropoff stop
  stops.push({
    type: 'dropoff',
    location: input.dropoffLocation,
    coordinates: input.dropoffCoords,
    arrivalMinute: currentMinute,
    durationMinutes: 60,
    dayNumber: currentDayNumber,
  });
  addBlock('on_duty_not_driving', 60, 'Dropoff', input.dropoffLocation);
  remarks.push({
    timeMinute: currentMinute - 60,
    location: input.dropoffLocation,
    note: 'Dropoff location',
  });

  // Finalize last day
  const lastDayDate = dayIndexToDate(tripStartDate, currentDayNumber);
  const finalHoursAvailable = (70 * 60 - cycleMinutesUsed) / 60;
  finalizeLogDay(currentDayNumber, lastDayDate, finalHoursAvailable);

  // Calculate totals
  const totalTripMinutes = currentMinute;
  const totalTripDays = currentDayNumber;
  const estimatedDrivingHours = logDays.reduce(
    (sum, day) => sum + day.totalDrivingMinutes,
    0
  ) / 60;

  // Build route coordinates
  const routeCoordinates: [number, number][] = [
    input.currentLocationCoords,
    input.pickupCoords,
    input.dropoffCoords,
  ];

  const tripPlan: TripPlan = {
    totalDistanceMiles: odometerMiles,
    estimatedDrivingHours,
    totalTripDays,
    stops,
    logDays,
    routeCoordinates,
    warnings,
  };

  return tripPlan;
}
