import { NextRequest, NextResponse } from 'next/server';
import { TripInput, RouteSegment, TripPlan } from '@/types/trip';
import { planTrip } from '@/lib/hosEngine';
import {
  geocodeLocation,
  haversineDistanceMiles,
} from '@/lib/geoUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const {
      currentLocation,
      pickupLocation,
      dropoffLocation,
      currentCycleUsedHours,
    } = body;

    if (
      !currentLocation ||
      !pickupLocation ||
      !dropoffLocation ||
      currentCycleUsedHours === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (
      typeof currentCycleUsedHours !== 'number' ||
      currentCycleUsedHours < 0 ||
      currentCycleUsedHours > 70
    ) {
      return NextResponse.json(
        {
          error:
            'currentCycleUsedHours must be a number between 0 and 70',
        },
        { status: 400 }
      );
    }

    // Geocode all locations in parallel
    const [
      currentLocationCoords,
      pickupCoords,
      dropoffCoords,
    ] = await Promise.all([
      geocodeLocation(currentLocation),
      geocodeLocation(pickupLocation),
      geocodeLocation(dropoffLocation),
    ]);

    if (!currentLocationCoords) {
      return NextResponse.json(
        {
          error: `Could not find location: ${currentLocation}`,
        },
        { status: 400 }
      );
    }

    if (!pickupCoords) {
      return NextResponse.json(
        {
          error: `Could not find location: ${pickupLocation}`,
        },
        { status: 400 }
      );
    }

    if (!dropoffCoords) {
      return NextResponse.json(
        {
          error: `Could not find location: ${dropoffLocation}`,
        },
        { status: 400 }
      );
    }

    // Build route segments
    const segment1Distance = haversineDistanceMiles(
      currentLocationCoords,
      pickupCoords
    );
    const segment2Distance = haversineDistanceMiles(
      pickupCoords,
      dropoffCoords
    );

    const segments: RouteSegment[] = [
      {
        fromCoords: currentLocationCoords,
        toCoords: pickupCoords,
        distanceMiles: segment1Distance,
        label: pickupLocation,
      },
      {
        fromCoords: pickupCoords,
        toCoords: dropoffCoords,
        distanceMiles: segment2Distance,
        label: dropoffLocation,
      },
    ];

    // Build trip input
    const tripInput: TripInput = {
      currentLocation,
      currentLocationCoords,
      pickupLocation,
      pickupCoords,
      dropoffLocation,
      dropoffCoords,
      currentCycleUsedHours,
    };

    // Plan trip
    const tripPlan: TripPlan = planTrip(tripInput, segments);

    return NextResponse.json(tripPlan, { status: 200 });
  } catch (error) {
    console.error('Error planning trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
