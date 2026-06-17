'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import TripForm from '@/components/TripForm'
import StopTimeline from '@/components/StopTimeline'
import ELDLogsPanel from '@/components/ELDLogsPanel'
import type { TripPlan } from '@/types/trip'

const TripMap = dynamic(() => import('@/components/TripMap'), { ssr: false })

function LogoIcon() {
  return (
    <div style={{
      width: 28, height: 28,
      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
      borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
        stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M3 8h10M8 3l5 5-5 5" />
      </svg>
    </div>
  )
}

function Topbar({ hasResults, onReset }: { hasResults: boolean; onReset: () => void }) {
  return (
    <header style={{
      height: 56, background: '#09090B',
      borderBottom: '1px solid #27272A',
      padding: '0 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LogoIcon />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px', color: '#FAFAFA' }}>
          ELD Planner
        </span>
        <span style={{
          background: '#18181B', border: '1px solid #27272A',
          color: '#52525B', fontSize: 10,
          fontFamily: 'DM Mono, monospace',
          padding: '2px 7px', borderRadius: 4, letterSpacing: '0.5px',
        }}>
          HOS 70/8
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {hasResults && (
          <button onClick={onReset} style={{
            background: 'transparent', border: '1px solid #27272A',
            color: '#A1A1AA', fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
            padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            New trip
          </button>
        )}
        <a href="https://www.fmcsa.dot.gov/regulations/hours-of-service"
          target="_blank" rel="noopener noreferrer"
          style={{
            background: 'transparent', border: '1px solid #27272A',
            color: '#A1A1AA', fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
            padding: '5px 14px', borderRadius: 6,
            textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
          HOS Docs
        </a>
      </div>
    </header>
  )
}

export default function Home() {
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: {
    currentLocation: string
    pickupLocation: string
    dropoffLocation: string
    currentCycleUsedHours: number
  }) {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      const plan: TripPlan = await res.json()
      setTripPlan(plan)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!tripPlan) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', overflowY: 'auto' }}>
        <Topbar hasResults={false} onReset={() => {}} />
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 56px)',
          padding: '40px 16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 480 }}>
            <p style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '1px',
              color: '#52525B', textTransform: 'uppercase', marginBottom: 12,
            }}>
              DOT-COMPLIANT · 70HR/8-DAY CYCLE
            </p>
            <h1 style={{
              fontSize: 32, fontWeight: 600, letterSpacing: '-0.8px',
              color: '#FAFAFA', lineHeight: 1.2, marginBottom: 12,
            }}>
              Plan your ELD trip
            </h1>
            <p style={{ fontSize: 14, color: '#71717A', lineHeight: 1.6 }}>
              Enter your locations and available hours. We handle the HOS rules —
              11-hour limit, 30-min breaks, rest windows, and daily log sheets.
            </p>
          </div>

          <div style={{
            width: '100%', maxWidth: 440,
            background: '#111113',
            border: '1px solid #27272A',
            borderRadius: 12, padding: '28px 28px 24px',
          }}>
            <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
            {error && (
              <div style={{
                marginTop: 14,
                background: '#1C1010', border: '1px solid #7F1D1D',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 12, color: '#FCA5A5', lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', gap: 24, marginTop: 28,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {[
              '11-hr driving limit',
              '30-min break rule',
              '10-hr rest enforcement',
              'Canvas ELD logs',
            ].map(t => (
              <div key={t} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#52525B',
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                  stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="2 9 6 13 14 4" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090B', overflow: 'hidden' }}>
      <Topbar hasResults onReset={() => { setTripPlan(null); setError(null) }} />

      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '340px 1fr',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div style={{
          background: '#09090B',
          borderRight: '1px solid #27272A',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          <StopTimeline
            stops={tripPlan.stops}
            totalDistanceMiles={tripPlan.totalDistanceMiles}
            estimatedDrivingHours={tripPlan.estimatedDrivingHours}
            totalTripDays={tripPlan.totalTripDays}
            warnings={tripPlan.warnings}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <TripMap
              routeCoordinates={tripPlan.routeCoordinates}
              stops={tripPlan.stops}
            />
          </div>

          <div style={{
            height: 240,
            flexShrink: 0,
            borderTop: '1px solid #27272A',
            background: '#09090B',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <ELDLogsPanel logDays={tripPlan.logDays} />
          </div>
        </div>
      </div>
    </div>
  )
}
