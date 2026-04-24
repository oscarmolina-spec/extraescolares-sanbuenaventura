'use client';
import { useState, useEffect } from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'; 
import L from 'leaflet';

// ✈️ Función interna para que el mapa vuele al destino
function ControladorVuelo({ destino }) {
  const map = useMap();
  useEffect(() => {
    if (destino && Array.isArray(destino) && typeof destino[0] === 'number') {
      map.flyTo(destino, 20, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [destino, map]);
  return null;
}

const crearIcono = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

export default function Mapa({
  posActividad,
  posMonitores,
  posFamilias,
  nombreAct,
  fotoAct,
  fotoMon,
  fotoFam,
  destinoVuelo, 
}) {
  const [iluminado, setIluminado] = useState(null);
  // ✨ NUEVO: Estado para saber qué foto queremos ver en grande
  const [fotoGrande, setFotoGrande] = useState(null);

  // 🔦 ESTA ES LA ÚNICA PIEZA NUEVA QUE AÑADIMOS
  useEffect(() => {
    if (destinoVuelo) {
      if (destinoVuelo[0] === posActividad?.[0]) setIluminado('act');
      else if (destinoVuelo[0] === posMonitores?.[0]) setIluminado('mon');
      else if (destinoVuelo[0] === posFamilias?.[0]) setIluminado('fam');
    }
  }, [destinoVuelo, posActividad, posMonitores, posFamilias]);

  const centroCole = [40.407937755274425, -3.7469348757382366];
  const esValida = (pos) =>
    pos && Array.isArray(pos) && typeof pos[0] === 'number' && !isNaN(pos[0]);
  const posicionCentral = esValida(posActividad) ? posActividad : centroCole;

  return (
    <div
      style={{
        height: '400px',
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '3px solid #3b82f6',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
    >
      {/* 🖼️ VISOR DE FOTO GRANDE (Solo aparece al pinchar) */}
      {fotoGrande && (
        <div
          onClick={() => setFotoGrande(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={fotoGrande}
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              borderRadius: '15px',
              border: '4px solid white',
              boxShadow: '0 0 30px rgba(255,255,255,0.2)',
            }}
            alt="Zoom"
          />
          <p
            style={{
              position: 'absolute',
              bottom: '20px',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            Toca en cualquier sitio para cerrar
          </p>
        </div>
      )}

      <MapContainer
        center={posicionCentral}
        zoom={19}
        maxZoom={22}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          maxZoom={22}
          maxNativeZoom={19}
        />

        {/* 🚀 EL CONTROLADOR DE VUELO */}
        <ControladorVuelo destino={destinoVuelo} />

        {/* 🔦 CÍRCULOS DE LUZ */}
        {iluminado === 'act' && esValida(posActividad) && (
          <Circle
            center={posActividad}
            radius={6}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#f87171',
              fillOpacity: 0.6,
            }}
          />
        )}
        {iluminado === 'mon' && esValida(posMonitores) && (
          <Circle
            center={posMonitores}
            radius={6}
            pathOptions={{
              color: '#eab308',
              fillColor: '#fde047',
              fillOpacity: 0.6,
            }}
          />
        )}
        {iluminado === 'fam' && esValida(posFamilias) && (
          <Circle
            center={posFamilias}
            radius={6}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#4ade80',
              fillOpacity: 0.6,
            }}
          />
        )}

        {/* 🔴 1. LUGAR DE LA ACTIVIDAD */}
        {esValida(posActividad) && (
          <Marker
            position={posActividad}
            icon={crearIcono('red')}
            eventHandlers={{ click: () => setIluminado('act') }}
          >
            <Popup>
              <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                <strong style={{ color: '#ef4444' }}>🏃 {nombreAct}</strong>
                <br />
                <span style={{ fontSize: '0.85rem' }}>
                  Lugar de realización
                </span>
                {fotoAct && (
                  
                  <img
                    src={fotoAct}
                    alt="Lugar"
                    onClick={() => setFotoGrande(fotoAct)}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      marginTop: '8px',
                      cursor: 'zoom-in',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 🟡 2. RECOGIDA MONITORES */}
        {esValida(posMonitores) && (
          <Marker
            position={posMonitores}
            icon={crearIcono('yellow')}
            eventHandlers={{ click: () => setIluminado('mon') }}
          >
            <Popup>
              <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                <strong style={{ color: '#eab308' }}>🙋‍♂️ Monitores</strong>
                <br />
                <span style={{ fontSize: '0.85rem' }}>Punto de recogida</span>
                {fotoMon && (
                  <img
                    src={fotoMon}
                    alt="Monitores"
                    onClick={() => setFotoGrande(fotoMon)}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      marginTop: '8px',
                      cursor: 'zoom-in',
                    }}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 🟢 3. ENTREGA A FAMILIAS */}
        {esValida(posFamilias) && (
          <Marker
            position={posFamilias}
            icon={crearIcono('green')}
            eventHandlers={{ click: () => setIluminado('fam') }}
          >
            <Popup>
              <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                <strong style={{ color: '#22c55e' }}>👨‍👩‍👧‍👦 Familias</strong>
                <br />
                <span style={{ fontSize: '0.85rem' }}>Punto de entrega</span>
                {fotoFam && (
                  <img
                    src={fotoFam}
                    alt="Familias"
                    onClick={() => setFotoGrande(fotoFam)}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      marginTop: '8px',
                      cursor: 'zoom-in',
                    }}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}