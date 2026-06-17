'use client'

import { useState } from 'react'

interface TripFormValues {
  currentLocation: string
  pickupLocation: string
  dropoffLocation: string
  currentCycleUsedHours: number
}

interface Props {
  onSubmit: (values: TripFormValues) => void
  isLoading: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#18181B',
  border: '1px solid #27272A',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  color: '#FAFAFA',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#A1A1AA',
  marginBottom: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
}

export default function TripForm({ onSubmit, isLoading }: Props) {
  const [values, setValues] = useState<TripFormValues>({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsedHours: 0,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TripFormValues, string>>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  function validate(): boolean {
    const e: Partial<Record<keyof TripFormValues, string>> = {}
    if (!values.currentLocation.trim() || values.currentLocation.trim().length < 2)
      e.currentLocation = 'Enter a valid city (e.g. Chicago, IL)'
    if (!values.pickupLocation.trim() || values.pickupLocation.trim().length < 2)
      e.pickupLocation = 'Enter a valid city'
    if (!values.dropoffLocation.trim() || values.dropoffLocation.trim().length < 2)
      e.dropoffLocation = 'Enter a valid city'
    if (values.currentCycleUsedHours < 0 || values.currentCycleUsedHours > 70)
      e.currentCycleUsedHours = 'Must be between 0 and 70'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit(values)
  }

  const remaining = Math.max(0, 70 - values.currentCycleUsedHours)
  const pct = Math.min(100, (values.currentCycleUsedHours / 70) * 100)

  const fields: { key: keyof TripFormValues; label: string; placeholder: string; dot: string }[] = [
    { key: 'currentLocation', label: 'Current location', placeholder: 'e.g. Chicago, IL', dot: '#3B82F6' },
    { key: 'pickupLocation',  label: 'Pickup location',  placeholder: 'e.g. St. Louis, MO', dot: '#10B981' },
    { key: 'dropoffLocation', label: 'Dropoff location', placeholder: 'e.g. Nashville, TN', dot: '#F59E0B' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {fields.map(({ key, label, placeholder, dot }) => (
        <div key={key}>
          <label style={labelStyle}>
            <Dot color={dot} />
            {label}
          </label>
          <input
            type="text"
            placeholder={placeholder}
            value={values[key] as string}
            onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
            onFocus={() => setFocusedField(key)}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputStyle,
              borderColor: errors[key] ? '#7F1D1D' : focusedField === key ? '#3B82F6' : '#27272A',
            }}
          />
          {errors[key] && (
            <p style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors[key]}</p>
          )}
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Cycle used (hrs)</label>
          <input
            type="number"
            min={0} max={70} step={0.5}
            value={values.currentCycleUsedHours}
            onChange={e => setValues(v => ({ ...v, currentCycleUsedHours: parseFloat(e.target.value) || 0 }))}
            onFocus={() => setFocusedField('cycle')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputStyle,
              fontFamily: 'DM Mono, monospace',
              borderColor: errors.currentCycleUsedHours ? '#7F1D1D' : focusedField === 'cycle' ? '#3B82F6' : '#27272A',
            }}
          />
          {errors.currentCycleUsedHours && (
            <p style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors.currentCycleUsedHours}</p>
          )}
        </div>
        <div>
          <label style={labelStyle}>Remaining</label>
          <div style={{
            ...inputStyle,
            fontFamily: 'DM Mono, monospace',
            color: remaining < 15 ? '#F59E0B' : '#10B981',
            cursor: 'default',
            border: '1px solid #27272A',
          }}>
            {remaining.toFixed(1)} hrs
          </div>
        </div>
      </div>

      <div style={{
        background: '#18181B', border: '1px solid #27272A',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: '#52525B', marginBottom: 7,
        }}>
          <span>70-hr cycle usage</span>
          <span style={{ fontFamily: 'DM Mono, monospace', color: '#A1A1AA' }}>
            {values.currentCycleUsedHours} / 70 hrs
          </span>
        </div>
        <div style={{ height: 4, background: '#27272A', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct > 85 ? '#F59E0B' : '#3B82F6',
            borderRadius: 2, transition: 'width 0.2s, background 0.2s',
          }} />
        </div>
      </div>

      <div style={{
        background: '#0D0D0F', border: '1px solid #27272A',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: '#3F3F46', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          Fixed assumptions
        </p>
        {[
          'Property carrier · 70hr/8-day',
          'Fuel stop every 1,000 miles',
          '1 hr pickup + dropoff each',
          'No adverse driving conditions',
        ].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 12, color: '#71717A' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
              stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <polyline points="2 9 6 13 14 4" />
            </svg>
            {t}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{
          width: '100%', background: isLoading ? '#1D4ED8' : '#2563EB',
          border: 'none', color: '#fff',
          fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
          padding: '11px', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: isLoading ? 0.75 : 1,
          transition: 'background 0.15s, opacity 0.15s',
          letterSpacing: '-0.2px',
        }}
      >
        {isLoading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M8 2a6 6 0 1 0 6 6" />
            </svg>
            Planning route…
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
            </svg>
            Plan route
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
