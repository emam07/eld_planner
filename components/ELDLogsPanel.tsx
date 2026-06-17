'use client'

import { useState } from 'react'
import ELDLogSheet from './ELDLogSheet'
import type { LogDay } from '@/types/trip'

interface Props { logDays: LogDay[] }

export default function ELDLogsPanel({ logDays }: Props) {
  const [active, setActive] = useState(0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid #27272A',
        padding: '0 20px', background: '#09090B',
        flexShrink: 0, overflowX: 'auto',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.8px',
          color: '#52525B', textTransform: 'uppercase',
          padding: '10px 14px 10px 0', display: 'flex', alignItems: 'center',
          borderBottom: '2px solid transparent', flexShrink: 0,
        }}>
          ELD Logs
        </span>
        {logDays.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              background: 'transparent', border: 'none',
              fontSize: 12, fontWeight: 500,
              color: active === i ? '#FAFAFA' : '#52525B',
              padding: '10px 14px', cursor: 'pointer',
              borderBottom: active === i ? '2px solid #3B82F6' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              fontFamily: 'DM Sans, sans-serif',
              flexShrink: 0,
            }}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1, overflow: 'hidden', padding: '8px 20px 10px',
        minHeight: 0, display: 'flex', flexDirection: 'column',
      }}>
        {logDays[active] && (
          <ELDLogSheet logDay={logDays[active]} dayIndex={active} />
        )}
      </div>
    </div>
  )
}
