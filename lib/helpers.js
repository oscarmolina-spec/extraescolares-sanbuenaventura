import { SCHOOL_CENTER, WEEKDAYS } from './constants.js';

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isPublished(item) {
  return item?.activa !== false;
}

export function getItemStages(item) {
  if (!item) return [];
  if (Array.isArray(item.etapas) && item.etapas.length > 0) {
    return item.etapas.map((s) => String(s).trim()).filter(Boolean);
  }
  const derived = [];
  if (item.etapa) derived.push(String(item.etapa).trim());
  for (const key of ['Infantil', 'Primaria', 'ESO', 'Adultos']) {
    if (item[key] === true && !derived.includes(key)) derived.push(key);
  }
  if (item.esClub && !derived.includes('Clubes Amigos')) {
    derived.push('Clubes Amigos');
  }
  return derived;
}

export function matchesStage(item, stageId) {
  if (!stageId || stageId === 'Todos') return true;
  const target = normalizeText(stageId);
  const stages = getItemStages(item).map(normalizeText);
  const isClub = item.esClub || stages.includes('clubes amigos');

  if (target === 'clubes amigos') return isClub;
  if (isClub) return false;
  if (stages.includes(target)) return true;

  // Backwards compatibility for legacy items without explicit stage
  if (target === 'primaria' && stages.length === 0) return true;
  return false;
}

export function classifyCategory(item) {
  if (item?.categoria) return item.categoria;
  const text = normalizeText(`${item?.nombre || ''} ${item?.info || item?.descripcion || ''}`);

  const sports = [
    'futbol', 'baloncesto', 'judo', 'natacion', 'patinaje', 'deporte',
    'gimnasia', 'atletismo', 'tenis', 'padel', 'karate', 'taekwondo',
    'balonmano', 'voleibol', 'esgrima', 'multideporte', 'deportiva', 'pilates', 'yoga', 'zumba',
  ];
  const languages = [
    'ingles', 'english', 'idioma', 'frances', 'aleman', 'oratoria',
    'debate', 'chino', 'cambridge', 'kids&us',
  ];
  const arts = [
    'teatro', 'baile', 'danza', 'lectura', 'arte', 'expresion', 'musica',
    'pintura', 'dibujo', 'coro', 'guitarra', 'piano', 'flauta', 'violin', 'creatividad',
  ];
  const tech = [
    'robotica', 'ajedrez', 'digital', 'tecnologia', 'programacion', 'manualidades',
    'costura', 'cocina', 'lego', 'minecraft', 'scratch', 'ciencias', 'experimentos', 'taller',
  ];

  if (sports.some((kw) => text.includes(kw))) return 'Deportes';
  if (languages.some((kw) => text.includes(kw))) return 'Idiomas';
  if (arts.some((kw) => text.includes(kw))) return 'Arte/expresión';
  if (tech.some((kw) => text.includes(kw))) return 'Tecnología/manualidades';
  return 'Deportes';
}

/**
 * Extracts clean description text and any embedded image URL from legacy `info` strings,
 * replacing the old hardcoded futbol-pack URL bug.
 */
export function parseActivityDescription(item) {
  const raw = String(item?.info || item?.descripcion || '').trim();
  const urlRegex = /(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/i;
  const match = raw.match(urlRegex);
  const embeddedImageUrl = match ? match[1] : '';
  const cleanText = match ? raw.replace(urlRegex, '').trim() : raw;
  const extraImage = item?.imagenExtra || embeddedImageUrl || '';
  return { text: cleanText, extraImage };
}

export function getPrimaryEnrollmentUrl(item) {
  const url = String(item?.linkInscripcion || item?.enlace || '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

export function getValidMultipleLinks(item) {
  if (!Array.isArray(item?.linksMultiples)) return [];
  return item.linksMultiples
    .filter((l) => l && String(l.etiqueta || '').trim() && /^https?:\/\//i.test(String(l.url || '').trim()))
    .map((l) => ({
      etiqueta: String(l.etiqueta).trim(),
      url: String(l.url).trim(),
    }));
}

export function isValidCoord(lat, lng, excludeSchoolDefault = false) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return false;
  if (nLat === 0 && nLng === 0) return false;
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) return false;
  if (
    excludeSchoolDefault &&
    Math.abs(nLat - SCHOOL_CENTER[0]) < 1e-6 &&
    Math.abs(nLng - SCHOOL_CENTER[1]) < 1e-6
  ) {
    return false;
  }
  return true;
}

export function parseMonthlyPrice(priceRaw) {
  if (priceRaw === null || priceRaw === undefined || priceRaw === '') return null;
  const str = String(priceRaw).replace(',', '.');
  const match = str.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function formatPriceDisplay(priceRaw) {
  const str = String(priceRaw || '').trim();
  if (!str) return null;
  if (/consultar|gratis|incluido|€|\bmes\b/i.test(str)) {
    return str;
  }
  return `${str} €`;
}

/**
 * Parses days and time ranges from free-form Spanish strings like:
 * - dias: "Lunes y Miércoles" / "L, X" / "Martes\nJueves"
 * - horario: "16:00 a 17:00" / "17:15 - 18:15" / "De 16:00 a 17:30h"
 * Used by the Weekly Planner to render the Mon-Fri grid and detect schedule overlaps.
 */
export function parseScheduleSlots(item) {
  const daysSource = normalizeText(`${item?.dias || ''} ${item?.horario || ''}`);
  const matchedDays = [];

  for (const day of WEEKDAYS) {
    const normDay = normalizeText(day.id);
    if (daysSource.includes(normDay)) {
      matchedDays.push(day.id);
    }
  }

  // Fallback for shorthand "L y X", "M y J", "L-X", "M-J"
  if (matchedDays.length === 0) {
    const tokens = normalizeText(item?.dias || '').split(/[\s,;/\-y]+/);
    const map = { l: 'lunes', m: 'martes', x: 'miércoles', j: 'jueves', v: 'viernes' };
    for (const tok of tokens) {
      if (map[tok] && !matchedDays.includes(map[tok])) matchedDays.push(map[tok]);
    }
  }

  const timeSource = String(item?.horario || item?.dias || '');
  const timeMatch = timeSource.match(/(\d{1,2})[:.](\d{2})\s*(?:a|-|–|hasta|\/)\s*(\d{1,2})[:.](\d{2})/i);
  let startMin = null;
  let endMin = null;
  let label = String(item?.horario || '').trim() || 'Horario a consultar';

  if (timeMatch) {
    const sh = Number(timeMatch[1]);
    const sm = Number(timeMatch[2]);
    const eh = Number(timeMatch[3]);
    const em = Number(timeMatch[4]);
    if (sh >= 0 && sh <= 23 && eh >= 0 && eh <= 23 && sm < 60 && em < 60) {
      startMin = sh * 60 + sm;
      endMin = eh * 60 + em;
      const pad = (n) => String(n).padStart(2, '0');
      label = `${pad(sh)}:${pad(sm)} – ${pad(eh)}:${pad(em)}`;
    }
  }

  return matchedDays.map((dayId) => ({
    dayId,
    startMin,
    endMin,
    label,
  }));
}

export function detectScheduleConflicts(selectedItems) {
  const byDay = {};
  for (const d of WEEKDAYS) byDay[d.id] = [];

  for (const item of selectedItems) {
    const slots = parseScheduleSlots(item);
    for (const slot of slots) {
      byDay[slot.dayId].push({ item, ...slot });
    }
  }

  const conflicts = [];
  for (const day of WEEKDAYS) {
    const entries = byDay[day.id].sort((a, b) => (a.startMin ?? 9999) - (b.startMin ?? 9999));
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (
          a.startMin !== null &&
          a.endMin !== null &&
          b.startMin !== null &&
          b.endMin !== null &&
          a.startMin < b.endMin &&
          b.startMin < a.endMin
        ) {
          conflicts.push({
            dayId: day.id,
            dayLabel: day.label,
            a: a.item,
            b: b.item,
            slotA: a.label,
            slotB: b.label,
          });
        }
      }
    }
  }

  return { byDay, conflicts };
}

export function getActivityWarnings(item) {
  const warnings = [];
  if (!getPrimaryEnrollmentUrl(item) && getValidMultipleLinks(item).length === 0) {
    warnings.push('Sin enlace de inscripción');
  }
  if (!String(item?.precio || '').trim()) warnings.push('Sin precio');
  if (!String(item?.horario || '').trim()) warnings.push('Sin horario');
  if (!isValidCoord(item?.latAct, item?.lngAct, true)) warnings.push('Sin ubicación en mapa');
  return warnings;
}

export function exportCatalogCsv(items) {
  const headers = [
    'Tipo',
    'Estado',
    'Plazas',
    'Nombre',
    'Etapas',
    'Categoría',
    'Empresa',
    'Días',
    'Horario',
    'Precio',
    'Lugar',
    'Contacto',
    'Enlace inscripción',
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? '').replace(/\r?\n/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = items.map((item) => [
    item.esClub ? 'Club Amigo' : 'Actividad',
    isPublished(item) ? 'Activa' : 'Desactivada',
    item.estadoPlazas || 'disponible',
    item.nombre || '',
    getItemStages(item).join(' / '),
    classifyCategory(item),
    item.empresa || '',
    item.dias || '',
    item.horario || '',
    item.precio || '',
    item.lugar || '',
    item.contacto || '',
    getPrimaryEnrollmentUrl(item) ||
      getValidMultipleLinks(item)
        .map((l) => `${l.etiqueta}: ${l.url}`)
        .join(' | '),
  ]);

  const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `extraescolares-csb-${dateStr}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackupJson({ actividades, clubes, puntosInteres, config }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    school: 'Colegio San Buenaventura',
    actividades,
    clubes,
    puntosInteres,
    config,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `extraescolares-csb-respaldo-${dateStr}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
