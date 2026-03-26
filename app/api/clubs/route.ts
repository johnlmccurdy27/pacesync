import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export type Club = {
  name: string
  region: string
  county: string
  disciplines: string[]
}

const DISCIPLINE_COLS = [
  'Track And Field',
  'Cross Country',
  'Road Running',
  'Hill And Fell',
  'Race Walking',
  'Trail Running',
]

let cachedClubs: Club[] | null = null

function parseCSV(): Club[] {
  if (cachedClubs) return cachedClubs

  const filePath = path.join(process.cwd(), 'public', 'EA Running Clubs UK March 26.csv')
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '') // strip BOM
  const lines = raw.split('\n').filter(l => l.trim())
  const headers = lines[0].split(',').map(h => h.trim())

  const regionIdx = headers.indexOf('Region')
  const countyIdx = headers.indexOf('County')
  const nameIdx = headers.indexOf('Name')
  const discIndices = DISCIPLINE_COLS.map(d => headers.indexOf(d))

  const clubs: Club[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    const name = cols[nameIdx]
    if (!name) continue
    const disciplines = DISCIPLINE_COLS.filter((_, j) => cols[discIndices[j]] === 'Y')
    clubs.push({
      name,
      region: cols[regionIdx] || '',
      county: cols[countyIdx] || '',
      disciplines,
    })
  }

  cachedClubs = clubs.sort((a, b) => a.name.localeCompare(b.name))
  return cachedClubs
}

export async function GET() {
  try {
    const clubs = parseCSV()
    return NextResponse.json(clubs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 })
  }
}
