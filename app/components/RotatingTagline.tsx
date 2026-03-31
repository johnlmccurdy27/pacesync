'use client'

import { useState } from 'react'

const TAGLINES = [
  'Bring Structur to your training.',
  'Your coach. Your plan. Your watch.',
  'Structured training, delivered.',
  'Every session, perfectly planned.',
  'Train smart. Race faster.',
  'From coach to watch in seconds.',
  'Human coaching with Intelligent Analysis.',
]

export default function RotatingTagline({ className }: { className?: string }) {
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])
  return <p className={className}>{tagline}</p>
}
