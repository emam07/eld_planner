'use client'

import type { Stop } from '@/types/trip'

interface Props {
  stops: Stop[]
  totalDistanceMiles: number
  estimatedDrivingHours: number
  totalTripDays: number
  warnings: string[]
}

const stopConfig: Record<string, { color: string; bg: string; label: string }> = {
  start:   { color: '#3B82F6', bg: '#0D1729', label: 'Start' },
  pickup:  { color: '#10B981', bg: '#0A1F18', label: 'Pickup' },
  dropoff: { color: '#F59E0B', bg: '#1C1508', label: 'Dropoff' },
  fuel:    { color: '#F59E0B', bg: '#1C1508', label: 'Fuel stop' },
  rest:    { color: '#8B5CF6', bg: '#130D1F', label: 'Rest' },
}

function Icon({ type }: { type: string }) {
  const paths: Record<string, React.ReactNode> = {
    start:   <circle cx="8" cy="8" r="3" fill="#3B82F6" />,
    pickup:  <polyline points="3 9 7 13 13 5" />,
    dropoff: <path d="M8 2l6 6-6 6M8 8H2" />,
    fuel:    <><rect x="3" y="4" width="7" height="8" rx="1" /><path d="M10 6h2l1 2v3" /></>,
    rest:    <path d="M3 8c0-2.8 2.2-5 5-5s5 2.2 5 5M5 13h6" />,
  }
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {paths[type] ?? paths.start}
    </svg>
  )
}

function minutesToTime(min: number): string {
  const total = Math.round(min)
  const days = Math.floor(total / (60 * 24))
  const rem = total % (60 * 24)
  const h = Math.floor(rem / 60).toString().padStart(2, '0')
  const m = (rem % 60).toString().padStart(2, '0')
  return days > 0 ? `Day ${days + 1} · ${h}:${m}` : `${h}:${m}`
}

export default function StopTimeline({ stops, totalDistanceMiles, estimatedDrivingHours, totalTripDays, warnings }: Props) {
  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.8px', color: '#52525B', textTransform: 'uppercase' }}>
        Trip summary
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Distance', value: `${Math.round(totalDistanceMiles).toLocaleString()}`, unit: 'mi' },
          { label: 'Drive time', value: estimatedDrivingHours.toFixed(1), unit: 'hrs' },
          { label: 'Trip days', value: String(totalTripDays), unit: 'days' },
          { label: 'Stops', value: String(stops.length), unit: 'total' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#18181B', borderRadius: 8, padding: '10px 12px',
          }}>
            <p style={{ fontSize: 10, color: '#52525B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.5px' }}>
              {s.value}<span style={{ fontSize: 11, color: '#71717A', fontWeight: 400, marginLeft: 3 }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div style={{
          background: '#1C1508', border: '1px solid #78350F',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3L1 14h14L8 3zM8 8v3M8 12.5v.5" />
            </svg>
            HOS Warnings
          </p>
          {warnings.map((w, i) => (
            <p key={i} style={{ fontSize: 12, color: '#D97706', lineHeight: 1.5 }}>· {w}</p>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid #27272A' }} />
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.8px', color: '#52525B', textTransform: 'uppercase', marginTop: -8 }}>
        Stop timeline
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {stops.map((stop, i) => {
          const cfg = stopConfig[stop.type] ?? stopConfig.start
          const isLast = i === stops.length - 1
          return (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cfg.color, zIndex: 1,
                }}>
                  <Icon type={stop.type} />
                </div>
                {!isLast && (
                  <div style={{ width: 1, flex: 1, background: '#27272A', marginTop: 3, minHeight: 20 }} />
                )}
              </div>

              <div style={{ flex: 1, paddingTop: 4, paddingBottom: isLast ? 0 : 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#FAFAFA', marginBottom: 3 }}>
                  {cfg.label}
                </p>
                <p style={{ fontSize: 12, color: '#71717A', marginBottom: 4 }}>{stop.location}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#18181B', border: '1px solid #27272A',
                    borderRadius: 4, padding: '1px 7px',
                    fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#71717A',
                  }}>
                    {minutesToTime(stop.arrivalMinute)}
                  </span>
                  <span style={{
                    background: '#18181B', border: '1px solid #27272A',
                    borderRadius: 4, padding: '1px 7px',
                    fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#71717A',
                  }}>
                    {stop.durationMinutes} min
                  </span>
                  <span style={{
                    background: '#18181B', border: '1px solid #27272A',
                    borderRadius: 4, padding: '1px 7px',
                    fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#52525B',
                  }}>
                    Day {stop.dayNumber}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
