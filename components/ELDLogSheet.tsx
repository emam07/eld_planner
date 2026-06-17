'use client'

import { useEffect, useRef } from 'react'
import type { DutyStatus, LogDay } from '@/types/trip'

interface Props {
  logDay: LogDay
  dayIndex?: number
}

const STATUS_ROWS: { status: DutyStatus; label: string; fill: string }[] = [
  { status: 'off_duty', label: 'Off Duty', fill: '#111113' },
  { status: 'sleeper_berth', label: 'Sleeper', fill: '#0D1729' },
  { status: 'driving', label: 'Driving', fill: '#0A1F18' },
  { status: 'on_duty_not_driving', label: 'On Duty (ND)', fill: '#1C1508' },
]

const CANVAS_W = 900
const CANVAS_H = 400
const LABEL_W = 72
const HEADER_H = 36
const GRID_TOP = 56
const GRID_BOTTOM = 310
const REMARKS_TOP = 318

function minuteToLabel(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export default function ELDLogSheet({ logDay, dayIndex = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gridLeft = LABEL_W + 8
    const gridRight = CANVAS_W - 12
    const gridWidth = gridRight - gridLeft
    const rowCount = STATUS_ROWS.length
    const rowHeight = (GRID_BOTTOM - GRID_TOP) / rowCount

    ctx.fillStyle = '#111113'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#111113'
    ctx.fillRect(0, 0, CANVAS_W, HEADER_H)
    ctx.strokeStyle = '#27272A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, HEADER_H)
    ctx.lineTo(CANVAS_W, HEADER_H)
    ctx.stroke()

    ctx.fillStyle = '#FAFAFA'
    ctx.font = '12px DM Sans, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Day ${logDay.dayNumber} — ${logDay.date}`, 12, 22)

    ctx.fillStyle = '#FAFAFA'
    ctx.font = '12px DM Sans, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(
      `Driving: ${(logDay.totalDrivingMinutes / 60).toFixed(1)}h · On-duty: ${(logDay.totalOnDutyMinutes / 60).toFixed(1)}h · Available: ${logDay.hoursAvailableStart.toFixed(1)}h`,
      CANVAS_W - 12,
      22,
    )

    for (let hour = 0; hour <= 24; hour++) {
      const x = gridLeft + (hour / 24) * gridWidth
      ctx.strokeStyle = '#27272A'
      ctx.lineWidth = hour % 6 === 0 ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(x, GRID_TOP)
      ctx.lineTo(x, GRID_BOTTOM)
      ctx.stroke()

      if (hour % 3 === 0) {
        ctx.fillStyle = '#52525B'
        ctx.font = '9px DM Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(hour), x, GRID_TOP - 6)
      }
    }

    STATUS_ROWS.forEach((row, rowIndex) => {
      const y = GRID_TOP + rowIndex * rowHeight

      ctx.strokeStyle = '#27272A'
      ctx.lineWidth = 1
      ctx.strokeRect(gridLeft, y, gridWidth, rowHeight)

      ctx.fillStyle = '#52525B'
      ctx.font = '9px DM Sans, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(row.label, LABEL_W, y + rowHeight / 2 + 3)
    })

    for (const block of logDay.blocks) {
      const rowIndex = STATUS_ROWS.findIndex(r => r.status === block.status)
      if (rowIndex < 0) continue

      const row = STATUS_ROWS[rowIndex]
      const y = GRID_TOP + rowIndex * rowHeight
      const startX = gridLeft + (block.startMinute / 1440) * gridWidth
      const endX = gridLeft + (block.endMinute / 1440) * gridWidth
      const blockWidth = Math.max(endX - startX, 1)

      ctx.fillStyle = row.fill
      ctx.fillRect(startX, y + 1, blockWidth, rowHeight - 2)

      ctx.strokeStyle = '#27272A'
      ctx.lineWidth = 1
      ctx.strokeRect(startX, y + 1, blockWidth, rowHeight - 2)

      if (blockWidth > 36 && block.label) {
        ctx.fillStyle = '#FAFAFA'
        ctx.font = '9px DM Sans, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(block.label, startX + blockWidth / 2, y + rowHeight / 2 + 3)
      }
    }

    ctx.strokeStyle = '#27272A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, REMARKS_TOP)
    ctx.lineTo(CANVAS_W, REMARKS_TOP)
    ctx.stroke()

    ctx.fillStyle = '#A1A1AA'
    ctx.font = 'bold 11px DM Sans, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('REMARKS', 12, REMARKS_TOP + 18)

    ctx.fillStyle = '#71717A'
    ctx.font = '10px DM Mono, monospace'
    logDay.remarks.slice(0, 3).forEach((remark, i) => {
      const text = `${minuteToLabel(remark.timeMinute)}  ${remark.location} — ${remark.note}`
      ctx.fillText(text.length > 110 ? `${text.slice(0, 107)}…` : text, 12, REMARKS_TOP + 36 + i * 14)
    })
  }, [logDay])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    function fitCanvas() {
      const scale = Math.min(
        container!.clientWidth / CANVAS_W,
        container!.clientHeight / CANVAS_H,
      )
      canvas!.style.width = `${CANVAS_W * scale}px`
      canvas!.style.height = `${CANVAS_H * scale}px`
    }

    fitCanvas()
    const observer = new ResizeObserver(fitCanvas)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `eld-log-day-${dayIndex + 1}-${logDay.date}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 6 }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        style={{
          marginTop: 0,
          background: '#18181B',
          border: '1px solid #27272A',
          color: '#A1A1AA',
          fontSize: 12,
          fontFamily: 'DM Sans, sans-serif',
          padding: '6px 14px',
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
        </svg>
        Download PNG
      </button>
    </div>
  )
}
