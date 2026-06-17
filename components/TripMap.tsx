'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Stop } from '@/types/trip'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #09090B;box-shadow:0 0 0 1.5px ${color}"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

const stopColors: Record<string, string> = {
  start: '#3B82F6', pickup: '#10B981', dropoff: '#F59E0B', fuel: '#F59E0B', rest: '#8B5CF6',
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
    }
  }, [map, coords])
  return null
}

interface Props {
  routeCoordinates: [number, number][]
  stops: Stop[]
}

export default function TripMap({ routeCoordinates, stops }: Props) {
  const center: [number, number] = routeCoordinates.length > 0
    ? routeCoordinates[Math.floor(routeCoordinates.length / 2)]
    : [39.5, -98.35]

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {routeCoordinates.length > 1 && (
          <>
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: '#09090B', weight: 6, opacity: 0.8 }}
            />
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: '#3B82F6', weight: 3, opacity: 1 }}
            />
          </>
        )}

        {stops.map((stop, i) => (
          <Marker
            key={i}
            position={stop.coordinates}
            icon={makeIcon(stopColors[stop.type] ?? '#71717A')}
          >
            <Popup>
              <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: stopColors[stop.type] }}>
                  {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}
                </p>
                <p style={{ fontSize: 12, color: '#A1A1AA', marginBottom: 6 }}>{stop.location}</p>
                <p style={{ fontSize: 11, color: '#71717A', fontFamily: 'DM Mono, monospace' }}>
                  Duration: {stop.durationMinutes} min
                </p>
                <p style={{ fontSize: 11, color: '#71717A', fontFamily: 'DM Mono, monospace' }}>
                  Day {stop.dayNumber}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds coords={routeCoordinates} />
      </MapContainer>

      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {[
          { label: 'Stops', value: stops.length.toString() },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(9,9,11,0.88)', border: '1px solid #27272A',
            borderRadius: 8, padding: '8px 12px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ fontSize: 10, color: '#52525B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>
              {s.label}
            </p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.5px' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 1000,
        background: 'rgba(9,9,11,0.88)', border: '1px solid #27272A',
        borderRadius: 8, padding: '7px 12px',
        display: 'flex', gap: 14,
        backdropFilter: 'blur(8px)',
      }}>
        {Object.entries({ Start: '#3B82F6', Pickup: '#10B981', 'Dropoff/Fuel': '#F59E0B', Rest: '#8B5CF6' }).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#71717A' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
