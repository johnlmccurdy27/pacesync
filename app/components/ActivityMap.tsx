'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  coordinates: [number, number][]
}

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coordinates.length > 0) {
      map.fitBounds(coordinates as any, { padding: [20, 20] })
    }
  }, [coordinates, map])
  return null
}

export default function ActivityMap({ coordinates }: Props) {
  if (coordinates.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">No route data</p>
      </div>
    )
  }

  const center = coordinates[Math.floor(coordinates.length / 2)]

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%', minHeight: '200px' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={coordinates} color="#4f46e5" weight={3} opacity={0.85} />
      <FitBounds coordinates={coordinates} />
    </MapContainer>
  )
}
