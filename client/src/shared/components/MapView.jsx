import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Stub component — real coordinates will come from geospatial API
export default function MapView({ origin, destination, className = '' }) {
  const center = [3.848, 11.502]; // Yaoundé, Cameroon

  return (
    <div className={`rounded-xl overflow-hidden border border-brand-border ${className}`}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {origin?.lat && (
          <Marker position={[origin.lat, origin.lng]}>
            <Popup>{origin.label ?? 'Départ'}</Popup>
          </Marker>
        )}
        {destination?.lat && (
          <Marker position={[destination.lat, destination.lng]}>
            <Popup>{destination.label ?? 'Arrivée'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
