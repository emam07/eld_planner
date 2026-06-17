import type { Metadata } from 'next'
import '@fontsource/dm-sans/300.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'ELD Planner — HOS Trip Scheduler',
  description: 'DOT-compliant ELD log and route planner for property-carrying CMV drivers on the 70hr/8-day cycle.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
