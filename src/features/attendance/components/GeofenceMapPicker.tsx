import { useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER: [number, number] = [19.0760, 72.8777]

function FixLeafletIcon() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])
  return null
}

function MapEvents({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prev = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!prev.current || prev.current.lat !== lat || prev.current.lng !== lng) {
      map.flyTo([lat, lng], map.getZoom())
      prev.current = { lat, lng }
    }
  }, [lat, lng, map])

  return null
}

type Props = {
  latitude: number
  longitude: number
  radiusMeters: number
  onLatitudeChange: (lat: number) => void
  onLongitudeChange: (lng: number) => void
  onRadiusChange: (radius: number) => void
}

export function GeofenceMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
}: Props) {
  const hasLocation = latitude !== 0 || longitude !== 0

  const center: [number, number] = hasLocation ? [latitude, longitude] : DEFAULT_CENTER

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      onLatitudeChange(Math.round(lat * 1e7) / 1e7)
      onLongitudeChange(Math.round(lng * 1e7) / 1e7)
    },
    [onLatitudeChange, onLongitudeChange]
  )

  const handleMarkerDrag = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker
      const pos = marker.getLatLng()
      onLatitudeChange(Math.round(pos.lat * 1e7) / 1e7)
      onLongitudeChange(Math.round(pos.lng * 1e7) / 1e7)
    },
    [onLatitudeChange, onLongitudeChange]
  )

  return (
    <div className="space-y-3">
      <div className="h-[350px] rounded-lg overflow-hidden border">
        <MapContainer center={center} zoom={15} className="h-full w-full" scrollWheelZoom={true}>
          <FixLeafletIcon />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onClick={handleMapClick} />
          <FlyToCenter lat={center[0]} lng={center[1]} />
          {hasLocation && (
            <>
              <Marker
                position={center}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDrag }}
              />
              <Circle center={center} radius={radiusMeters} pathOptions={{ color: '#3b82f6', fillOpacity: 0.15 }} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">Click on the map to place the center, or drag the marker to adjust.</p>
      <div className="space-y-2">
        <label className="text-sm font-medium">Radius: {radiusMeters}m</label>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={radiusMeters}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>10m</span>
          <span className="flex-1 text-center">{radiusMeters}m</span>
          <span>1000m</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>Lat: {hasLocation ? latitude.toFixed(6) : '—'}</div>
        <div>Lng: {hasLocation ? longitude.toFixed(6) : '—'}</div>
      </div>
    </div>
  )
}
