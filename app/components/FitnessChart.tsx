type DataPoint = { week: string; score: number }

const dummyData: DataPoint[] = [
  { week: 'W1', score: 42 }, { week: 'W2', score: 48 }, { week: 'W3', score: 45 },
  { week: 'W4', score: 52 }, { week: 'W5', score: 58 }, { week: 'W6', score: 55 },
  { week: 'W7', score: 62 }, { week: 'W8', score: 67 }, { week: 'W9', score: 64 },
  { week: 'W10', score: 70 }, { week: 'W11', score: 74 }, { week: 'W12', score: 72 },
]

export default function FitnessChart({ data = dummyData }: { data?: DataPoint[] }) {
  const W = 500
  const H = 180
  const pad = { top: 24, right: 24, bottom: 28, left: 36 }
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom

  const scores = data.map(d => d.score)
  const maxS = Math.max(...scores)
  const minS = Math.min(...scores) - 8

  const xOf = (i: number) => pad.left + (i / (data.length - 1)) * iW
  const yOf = (s: number) => pad.top + iH - ((s - minS) / (maxS - minS)) * iH

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.score), ...d }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.top + iH} L${pts[0].x},${pad.top + iH} Z`
  const latest = pts[pts.length - 1]

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3730a3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3730a3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 33, 66, 100].map(pct => {
          const y = pad.top + (pct / 100) * iH
          return <line key={pct} x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
        })}

        {/* Area + line */}
        <path d={areaPath} fill="url(#fg)" />
        <path d={linePath} fill="none" stroke="#3730a3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3730a3" />
        ))}

        {/* Latest score callout */}
        <circle cx={latest.x} cy={latest.y} r="5.5" fill="#3730a3" />
        <text x={latest.x} y={latest.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#3730a3">
          {latest.score}
        </text>

        {/* X labels */}
        {pts.map((p, i) =>
          i % 2 === 0 ? (
            <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{p.week}</text>
          ) : null
        )}
      </svg>
    </div>
  )
}
