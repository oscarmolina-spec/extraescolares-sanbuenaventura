'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const crearIcono = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

export default function MapaPuntosInteres({ puntos = [] }) {
  const [fotoGrande, setFotoGrande] = useState(null);
  const centroCole = [40.407937755274425, -3.7469348757382366];

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {fotoGrande && (
        <div
          onClick={() => setFotoGrande(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out',
          }}
        >
          <img src={fotoGrande} style={{ maxWidth: '90%', maxHeight: '85%', borderRadius: '15px', border: '4px solid white' }} alt="Zoom" />
        </div>
      )}

      <MapContainer center={centroCole} zoom={19} maxZoom={22} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          maxZoom={22}
          maxNativeZoom={19}
        />

        {/* 🛡️ FILTRO MÁGICO: Solo dibujamos si lat y lng son números de verdad */}
        {puntos.map((p) => {
          const lat = parseFloat(p.lat);
          const lng = parseFloat(p.lng);

          // Si el número no es válido, no dibujamos nada
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={p.id} position={[lat, lng]} icon={crearIcono(p.color || 'blue')}>
              <Popup>
                <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                  <strong style={{ color: '#3b82f6', fontSize: '1.1rem' }}>{p.nombre}</strong>
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>{p.descripcion}</span>
                  {p.foto && (
                    <img
                      src={p.foto}
                      alt={p.nombre}
                      onClick={() => setFotoGrande(p.foto)}
                      style={{ width: '100%', borderRadius: '12px', marginTop: '8px', cursor: 'zoom-in' }}
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}