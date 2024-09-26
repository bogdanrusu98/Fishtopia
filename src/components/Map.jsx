import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon (default missing in React-Leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function Map({ position, setPosition }) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position); // Update marker position when new location is selected
  }, [position]);

  const MapComponent = () => {
    const map = useMap();
    useEffect(() => {
      if (markerPosition) {
        map.setView(markerPosition, 15); // Set view on the map when marker changes
      }
    }, [markerPosition, map]);
    return null;
  };

  const handleDragEnd = (e) => {
    const newLatLng = e.target.getLatLng();
    setMarkerPosition([newLatLng.lat, newLatLng.lng]);
    setPosition([newLatLng.lat, newLatLng.lng]); // Update the parent's state
  };

  return (
    <MapContainer center={position} zoom={7} style={{ height: '400px', width: '100%' }}>
      <MapComponent />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markerPosition && (
        <Marker
          position={markerPosition} // Set marker position
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        />
      )}
    </MapContainer>
  );
}

export default Map;
