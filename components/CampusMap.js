'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, MapPin, Search } from 'lucide-react';
import { SCHOOL_CENTER } from '../lib/constants';
import { isValidCoord, normalizeText } from '../lib/helpers';

const ESRI_SATELLITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const PIN_COLORS = {
  red: '#dc2626',
  gold: '#ca8a04',
  yellow: '#ca8a04',
  green: '#16a34a',
  blue: '#155f9e',
  violet: '#7c3aed',
};

function createPinIcon(colorKey = 'blue', label = '') {
  const hex = PIN_COLORS[colorKey] || colorKey || '#155f9e';
  const safeLabel = label ? `<span style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#082448;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</span>` : '';
  return L.divIcon({
    className: 'csb-custom-pin',
    html: `
      <div style="position:relative;width:28px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${safeLabel}
        <svg viewBox="0 0 28 36" width="28" height="36" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,0.38));">
          <path d="M14 1C7.1 1 1.5 6.6 1.5 13.5C1.5 22.8 14 35 14 35C14 35 26.5 22.8 26.5 13.5C26.5 6.6 20.9 1 14 1Z" fill="${hex}" stroke="#ffffff" stroke-width="2.2"/>
          <circle cx="14" cy="13.5" r="4.8" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 35],
    popupAnchor: [0, -34],
  });
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function LightboxModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen ampliada"
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={imageUrl}
        alt="Vista ampliada"
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[85vh] rounded-xl border-2 border-white/80 shadow-2xl object-contain cursor-default"
      />
    </div>
  );
}

/**
 * 1) ActivityMap — Used inside ActivityDetail to show:
 *    - Location of activity (red)
 *    - Monitors pickup point (gold)
 *    - Families pickup point (green)
 */
export function ActivityMap({
  posActividad,
  posMonitores,
  posFamilias,
  nombreAct,
  fotoAct,
  fotoMon,
  fotoFam,
  flyTarget,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const highlightCircleRef = useRef(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center =
      posActividad && isValidCoord(posActividad[0], posActividad[1])
        ? posActividad
        : SCHOOL_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: 19,
      maxZoom: 21,
      scrollWheelZoom: true,
    });

    L.tileLayer(ESRI_SATELLITE, {
      attribution: '&copy; Esri',
      maxZoom: 21,
      maxNativeZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    // Delegate click on popup images to open Lightbox
    const handlePopupClick = (e) => {
      const img = e.target?.closest?.('img[data-lightbox-src]');
      if (img) {
        setLightboxUrl(img.getAttribute('data-lightbox-src'));
      }
    };
    containerRef.current.addEventListener('click', handlePopupClick);
    const el = containerRef.current;

    return () => {
      el?.removeEventListener('click', handlePopupClick);
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      highlightCircleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const points = [
      {
        pos: posActividad,
        color: 'red',
        shortLabel: 'Actividad',
        title: nombreAct || 'Lugar de la actividad',
        subtitle: 'Espacio donde se realiza la actividad',
        photo: fotoAct,
      },
      {
        pos: posMonitores,
        color: 'gold',
        shortLabel: 'Monitores',
        title: 'Recogida de monitores',
        subtitle: 'Punto donde los monitores recogen a los alumnos',
        photo: fotoMon,
      },
      {
        pos: posFamilias,
        color: 'green',
        shortLabel: 'Familias',
        title: 'Entrega a familias',
        subtitle: 'Punto de salida y entrega al finalizar',
        photo: fotoFam,
      },
    ];

    const validCoords = [];
    for (const pt of points) {
      if (!pt.pos || !isValidCoord(pt.pos[0], pt.pos[1])) continue;
      validCoords.push(pt.pos);
      const photoHtml = pt.photo
        ? `<img src="${escapeHtml(pt.photo)}" data-lightbox-src="${escapeHtml(pt.photo)}" alt="${escapeHtml(pt.title)}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-top:8px;cursor:zoom-in;border:1px solid #e2e8f0;" />`
        : '';
      const popupHtml = `
        <div style="min-width:165px;max-width:210px;text-align:left;">
          <div style="font-weight:700;font-size:13px;color:#082448;margin-bottom:2px;">${escapeHtml(pt.title)}</div>
          <div style="font-size:11.5px;color:#475569;line-height:1.35;">${escapeHtml(pt.subtitle)}</div>
          ${photoHtml}
        </div>
      `;
      L.marker(pt.pos, { icon: createPinIcon(pt.color, pt.shortLabel) })
        .bindPopup(popupHtml)
        .addTo(group);
    }

    if (validCoords.length > 1) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [45, 45], maxZoom: 19 });
    } else if (validCoords.length === 1) {
      map.setView(validCoords[0], 19);
    }
  }, [posActividad, posMonitores, posFamilias, nombreAct, fotoAct, fotoMon, fotoFam]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget?.coords || !isValidCoord(flyTarget.coords[0], flyTarget.coords[1])) return;

    map.flyTo(flyTarget.coords, 20, { duration: 1.1, easeLinearity: 0.25 });

    if (highlightCircleRef.current) {
      highlightCircleRef.current.remove();
    }
    const color = PIN_COLORS[flyTarget.color] || '#155f9e';
    highlightCircleRef.current = L.circle(flyTarget.coords, {
      radius: 6,
      color,
      fillColor: color,
      fillOpacity: 0.35,
      weight: 2,
    }).addTo(map);
  }, [flyTarget]);

  return (
    <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <div ref={containerRef} className="w-full h-full" />
      <LightboxModal imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}

/**
 * 2) CampusPointsMap — Full campus map with searchable directory of key school points
 */
export function CampusPointsMap({ puntos = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const validPoints = puntos.filter((p) => isValidCoord(p.lat, p.lng));
  const filteredPoints = validPoints.filter((p) =>
    normalizeText(`${p.nombre} ${p.descripcion}`).includes(normalizeText(search)),
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: SCHOOL_CENTER,
      zoom: 19,
      maxZoom: 21,
      scrollWheelZoom: true,
    });
    L.tileLayer(ESRI_SATELLITE, {
      attribution: '&copy; Esri',
      maxZoom: 21,
      maxNativeZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    const handlePopupClick = (e) => {
      const img = e.target?.closest?.('img[data-lightbox-src]');
      if (img) setLightboxUrl(img.getAttribute('data-lightbox-src'));
    };
    const el = containerRef.current;
    el.addEventListener('click', handlePopupClick);

    return () => {
      el?.removeEventListener('click', handlePopupClick);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    for (const p of validPoints) {
      const photoHtml = p.foto
        ? `<img src="${escapeHtml(p.foto)}" data-lightbox-src="${escapeHtml(p.foto)}" alt="${escapeHtml(p.nombre)}" style="width:100%;max-height:125px;object-fit:cover;border-radius:8px;margin-top:8px;cursor:zoom-in;border:1px solid #e2e8f0;" />`
        : '';
      const popupHtml = `
        <div style="min-width:170px;max-width:220px;">
          <div style="font-weight:700;font-size:13.5px;color:#082448;margin-bottom:3px;">${escapeHtml(p.nombre)}</div>
          <div style="font-size:12px;color:#475569;line-height:1.4;">${escapeHtml(p.descripcion || 'Punto de interés del colegio')}</div>
          ${photoHtml}
        </div>
      `;
      const marker = L.marker([Number(p.lat), Number(p.lng)], {
        icon: createPinIcon(p.color || 'blue'),
      })
        .bindPopup(popupHtml)
        .addTo(map);

      marker.on('click', () => setSelectedId(p.id));
      markersRef.current.set(p.id, marker);
    }
  }, [puntos]);

  const focusPoint = (point) => {
    setSelectedId(point.id);
    const map = mapRef.current;
    const marker = markersRef.current.get(point.id);
    if (map) {
      map.flyTo([Number(point.lat), Number(point.lng)], 20, { duration: 0.9 });
    }
    if (marker) {
      setTimeout(() => marker.openPopup(), 350);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[560px]">
      <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 max-h-[640px]">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Directorio de espacios
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selecciona un punto para ubicarlo en el plano aéreo del colegio.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar espacio o acceso..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredPoints.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
              No hay puntos que coincidan con la búsqueda.
            </p>
          ) : (
            filteredPoints.map((p) => {
              const active = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => focusPoint(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                    active
                      ? 'bg-[#082448] text-white border-[#082448] shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      active ? 'text-[#ffc629]' : 'text-[#155f9e] dark:text-sky-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.nombre}</div>
                    {p.descripcion && (
                      <div
                        className={`text-xs line-clamp-2 mt-0.5 ${
                          active ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {p.descripcion}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm min-h-[420px] lg:min-h-[640px]">
        <div ref={containerRef} className="w-full h-full min-h-[420px] lg:min-h-[640px]" />
        <LightboxModal imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      </div>
    </div>
  );
}

/**
 * 3) CoordinatePickerMap — Embedded directly inside Admin forms!
 *    Supports picking 1 pin (single mode) or switching between Actividad / Monitores / Familias pins
 *    with click-to-place AND draggable markers. Zero page navigation or DOM hacks!
 */
export function CoordinatePickerMap({
  pins = [],
  activePinKey,
  onPick,
  heightClass = 'h-[300px]',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const onPickRef = useRef(onPick);
  const activeKeyRef = useRef(activePinKey);

  useEffect(() => {
    onPickRef.current = onPick;
    activeKeyRef.current = activePinKey;
  }, [onPick, activePinKey]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const firstValid = pins.find((p) => isValidCoord(p.lat, p.lng));
    const center = firstValid ? [Number(firstValid.lat), Number(firstValid.lng)] : SCHOOL_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: 19,
      maxZoom: 21,
      scrollWheelZoom: true,
    });

    L.tileLayer(ESRI_SATELLITE, {
      attribution: '&copy; Esri',
      maxZoom: 21,
      maxNativeZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      if (onPickRef.current && activeKeyRef.current) {
        onPickRef.current(
          activeKeyRef.current,
          e.latlng.lat.toFixed(6),
          e.latlng.lng.toFixed(6),
        );
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    for (const pin of pins) {
      if (!isValidCoord(pin.lat, pin.lng)) continue;
      const marker = L.marker([Number(pin.lat), Number(pin.lng)], {
        icon: createPinIcon(pin.color || 'blue', pin.label || ''),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onPickRef.current?.(pin.key, pos.lat.toFixed(6), pos.lng.toFixed(6));
      });
      markersRef.current.set(pin.key, marker);
    }
  }, [pins]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700`}>
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[400] bg-slate-900/85 text-white text-[11px] font-medium px-2.5 py-1 rounded-md backdrop-blur-sm">
        Haz clic en el mapa o arrastra una chincheta para fijar la posición exacta
      </div>
    </div>
  );
}
