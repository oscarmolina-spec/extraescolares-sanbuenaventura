'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutList,
  Plus,
  MapPin,
  Megaphone,
  Image as ImageIcon,
  Download,
  DatabaseBackup,
  Search,
  Pencil,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/firebase';
import {
  AVAILABILITY_STATES,
  DEFAULT_FAQS,
  EMPTY_ACTIVITY,
  MAP_POINT_COLORS,
  SCHOOL_CENTER,
  STAGES,
} from '../lib/constants';
import {
  classifyCategory,
  exportBackupJson,
  exportCatalogCsv,
  getActivityWarnings,
  getItemStages,
  isPublished,
  normalizeText,
} from '../lib/helpers';
import ImageUploader from './ImageUploader';

const CoordinatePickerMap = dynamic(
  () => import('./CampusMap').then((mod) => mod.CoordinatePickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Cargando mapa interactivo...
      </div>
    ),
  },
);

const EMPTY_POINT = {
  id: null,
  nombre: '',
  descripcion: '',
  lat: String(SCHOOL_CENTER[0]),
  lng: String(SCHOOL_CENTER[1]),
  foto: '',
  color: 'blue',
};

export default function AdminDashboard({
  actividades,
  clubes,
  puntosInteres,
  configPortal,
  initialEditItem,
  onClearInitialEdit,
  onBackToPortal,
  onNotify,
}) {
  const [adminTab, setAdminTab] = useState('listado');
  const [saving, setSaving] = useState(false);

  // List filters
  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState('todos'); // todos | actividad | club
  const [listStatusFilter, setListStatusFilter] = useState('todos'); // todos | activas | ocultas | avisos

  // Delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: 'item'|'point', target }

  // Activity / Club Editor state
  const [editorMode, setEditorMode] = useState('actividad'); // 'actividad' | 'club'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_ACTIVITY });
  const [activeCoordPin, setActiveCoordPin] = useState('actividad');

  // Campus Map Point Editor state
  const [pointForm, setPointForm] = useState({ ...EMPTY_POINT });

  // Portal Appearance + Announcement + FAQ state
  const [portalForm, setPortalForm] = useState({
    fotoFondoHeader: '',
    fotoEtapaInfantil: '',
    fotoEtapaPrimaria: '',
    fotoEtapaESO: '',
    fotoEtapaAdultos: '',
    fotoEtapaClubes: '',
    avisoActivo: false,
    avisoTipo: 'plazo',
    avisoTitulo: '',
    avisoTexto: '',
    avisoEnlace: '',
    avisoEnlaceTexto: '',
    faqs: DEFAULT_FAQS,
  });

  useEffect(() => {
    if (!configPortal) return;
    setPortalForm({
      fotoFondoHeader: configPortal.fotoFondoHeader || '',
      fotoEtapaInfantil: configPortal.fotoEtapaInfantil || '',
      fotoEtapaPrimaria: configPortal.fotoEtapaPrimaria || '',
      fotoEtapaESO: configPortal.fotoEtapaESO || '',
      fotoEtapaAdultos: configPortal.fotoEtapaAdultos || '',
      fotoEtapaClubes: configPortal.fotoEtapaClubes || '',
      avisoActivo: Boolean(configPortal.avisoActivo),
      avisoTipo: configPortal.avisoTipo || 'plazo',
      avisoTitulo: configPortal.avisoTitulo || '',
      avisoTexto: configPortal.avisoTexto || '',
      avisoEnlace: configPortal.avisoEnlace || '',
      avisoEnlaceTexto: configPortal.avisoEnlaceTexto || '',
      faqs:
        Array.isArray(configPortal.faqs) && configPortal.faqs.length > 0
          ? configPortal.faqs
          : DEFAULT_FAQS,
    });
  }, [configPortal]);

  // Open editor if user clicked "Editar" directly from the catalog/detail page
  useEffect(() => {
    if (!initialEditItem) return;
    openEditorForItem(initialEditItem);
    onClearInitialEdit?.();
  }, [initialEditItem]);

  const allItems = useMemo(
    () => [
      ...actividades.map((a) => ({ ...a, esClub: false })),
      ...clubes.map((c) => ({ ...c, esClub: true })),
    ].sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')),
    [actividades, clubes],
  );

  const stats = useMemo(() => {
    const activeActivities = actividades.filter(isPublished).length;
    const activeClubs = clubes.filter(isPublished).length;
    const hiddenTotal = allItems.filter((item) => !isPublished(item)).length;
    const withWarnings = allItems.filter((item) => getActivityWarnings(item).length > 0).length;
    return { activeActivities, activeClubs, hiddenTotal, withWarnings };
  }, [actividades, clubes, allItems]);

  const filteredList = useMemo(() => {
    const q = normalizeText(listSearch);
    return allItems.filter((item) => {
      if (listTypeFilter === 'actividad' && item.esClub) return false;
      if (listTypeFilter === 'club' && !item.esClub) return false;
      if (listStatusFilter === 'activas' && !isPublished(item)) return false;
      if (listStatusFilter === 'ocultas' && isPublished(item)) return false;
      if (listStatusFilter === 'avisos' && getActivityWarnings(item).length === 0) return false;
      if (q) {
        const hay = normalizeText(
          `${item.nombre} ${item.empresa} ${item.dias} ${getItemStages(item).join(' ')}`,
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, listSearch, listTypeFilter, listStatusFilter]);

  function openNewEditor(mode = 'actividad') {
    setEditorMode(mode);
    setEditingId(null);
    setFormData({
      ...EMPTY_ACTIVITY,
      etapas: mode === 'club' ? ['Clubes Amigos'] : [],
    });
    setActiveCoordPin('actividad');
    setAdminTab('editor');
  }

  function openEditorForItem(item, asDuplicate = false) {
    const isClub = Boolean(item.esClub);
    setEditorMode(isClub ? 'club' : 'actividad');
    setEditingId(asDuplicate ? null : item.id);
    setFormData({
      ...EMPTY_ACTIVITY,
      ...item,
      nombre: asDuplicate ? `${item.nombre} (Copia)` : item.nombre || '',
      etapas: getItemStages(item),
      activa: asDuplicate ? true : isPublished(item),
      estadoPlazas: item.estadoPlazas || 'disponible',
      info: item.info || item.descripcion || '',
      enlace: item.linkInscripcion || item.enlace || '',
      linkInscripcion: item.linkInscripcion || item.enlace || '',
      linksMultiples: Array.isArray(item.linksMultiples)
        ? item.linksMultiples.map((l) => ({ etiqueta: l.etiqueta || '', url: l.url || '' }))
        : [],
      latAct: item.latAct ? String(item.latAct) : String(SCHOOL_CENTER[0]),
      lngAct: item.lngAct ? String(item.lngAct) : String(SCHOOL_CENTER[1]),
      latMon: item.latMon ? String(item.latMon) : '',
      lngMon: item.lngMon ? String(item.lngMon) : '',
      latFam: item.latFam ? String(item.latFam) : '',
      lngFam: item.lngFam ? String(item.lngFam) : '',
    });
    setActiveCoordPin('actividad');
    setAdminTab('editor');
  }

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      onNotify?.('Indica el nombre de la actividad o club.', 'advertencia');
      return;
    }
    if (!formData.etapas || formData.etapas.length === 0) {
      onNotify?.('Selecciona al menos una etapa escolar.', 'advertencia');
      return;
    }

    setSaving(true);
    try {
      const collectionName = editorMode === 'club' ? 'clubes_cole' : 'actividades_cole';
      const cleanLinks = (formData.linksMultiples || [])
        .filter((l) => l.etiqueta?.trim() && l.url?.trim())
        .map((l) => ({ etiqueta: l.etiqueta.trim(), url: l.url.trim() }));

      const payload = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria || '',
        etapas: formData.etapas,
        activa: formData.activa !== false,
        estadoPlazas: formData.estadoPlazas || 'disponible',
        destacada: Boolean(formData.destacada),
        dias: (formData.dias || '').trim(),
        horario: (formData.horario || '').trim(),
        lugar: (formData.lugar || '').trim(),
        precio: (formData.precio || '').trim(),
        info: (formData.info || '').trim(),
        descripcion: (formData.info || '').trim(),
        material: (formData.material || '').trim(),
        imagen: (formData.imagen || '').trim(),
        imagenExtra: (formData.imagenExtra || '').trim(),
        empresa: (formData.empresa || '').trim(),
        logoEmpresa: (formData.logoEmpresa || '').trim(),
        nombreContacto: (formData.nombreContacto || '').trim(),
        contacto: (formData.contacto || '').trim(),
        enlace: (formData.enlace || '').trim(),
        linkInscripcion: (formData.enlace || '').trim(),
        linksMultiples: cleanLinks,
        recogidaMonitores: (formData.recogidaMonitores || '').trim(),
        recogidaFamilias: (formData.recogidaFamilias || '').trim(),
        latAct: parseFloat(formData.latAct) || 0,
        lngAct: parseFloat(formData.lngAct) || 0,
        latMon: parseFloat(formData.latMon) || 0,
        lngMon: parseFloat(formData.lngMon) || 0,
        latFam: parseFloat(formData.latFam) || 0,
        lngFam: parseFloat(formData.lngFam) || 0,
        fotoAct: (formData.fotoAct || '').trim(),
        fotoMon: (formData.fotoMon || '').trim(),
        fotoFam: (formData.fotoFam || '').trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), payload);
        onNotify?.(
          editorMode === 'club'
            ? 'Club Amigo actualizado correctamente.'
            : 'Actividad actualizada correctamente.',
          'exito',
        );
      } else {
        await addDoc(collection(db, collectionName), payload);
        onNotify?.(
          editorMode === 'club'
            ? 'Club Amigo creado y publicado.'
            : 'Actividad creada y publicada.',
          'exito',
        );
      }

      setEditingId(null);
      setFormData({ ...EMPTY_ACTIVITY });
      setAdminTab('listado');
    } catch (err) {
      console.error('Error guardando ficha:', err);
      onNotify?.(`No se pudo guardar la ficha: ${err.message || 'error de conexión'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItemActive = async (item) => {
    try {
      const col = item.esClub ? 'clubes_cole' : 'actividades_cole';
      const nextState = !isPublished(item);
      await updateDoc(doc(db, col, item.id), { activa: nextState });
      onNotify?.(
        nextState ? `«${item.nombre}» reactivada en el portal.` : `«${item.nombre}» ocultada a las familias.`,
        'exito',
      );
    } catch (err) {
      console.error(err);
      onNotify?.('No se pudo cambiar el estado de visibilidad.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      if (confirmDelete.kind === 'item') {
        const item = confirmDelete.target;
        const col = item.esClub ? 'clubes_cole' : 'actividades_cole';
        await deleteDoc(doc(db, col, item.id));
        onNotify?.(`«${item.nombre}» eliminada permanentemente.`, 'exito');
      } else if (confirmDelete.kind === 'point') {
        const pt = confirmDelete.target;
        await deleteDoc(doc(db, 'puntos_interes_cole', pt.id));
        if (pointForm.id === pt.id) setPointForm({ ...EMPTY_POINT });
        onNotify?.(`Punto «${pt.nombre}» eliminado del mapa.`, 'exito');
      }
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      onNotify?.('Error al eliminar el elemento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMapPoint = async (e) => {
    e.preventDefault();
    if (!pointForm.nombre.trim()) {
      onNotify?.('Escribe el nombre del espacio o acceso.', 'advertencia');
      return;
    }
    const lat = parseFloat(pointForm.lat);
    const lng = parseFloat(pointForm.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      onNotify?.('Selecciona una ubicación válida en el mapa.', 'advertencia');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: pointForm.nombre.trim(),
        descripcion: (pointForm.descripcion || '').trim(),
        lat,
        lng,
        foto: (pointForm.foto || '').trim(),
        color: pointForm.color || 'blue',
      };
      if (pointForm.id) {
        await updateDoc(doc(db, 'puntos_interes_cole', pointForm.id), payload);
        onNotify?.('Punto del mapa actualizado.', 'exito');
      } else {
        await addDoc(collection(db, 'puntos_interes_cole'), payload);
        onNotify?.('Nuevo punto añadido al mapa del colegio.', 'exito');
      }
      setPointForm({ ...EMPTY_POINT });
    } catch (err) {
      console.error(err);
      onNotify?.('No se pudo guardar el punto del mapa.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePortalConfig = async (sectionLabel) => {
    setSaving(true);
    try {
      const cleanFaqs = (portalForm.faqs || [])
        .filter((f) => f.pregunta?.trim() && f.respuesta?.trim())
        .map((f, idx) => ({
          id: f.id || `faq-${idx + 1}`,
          pregunta: f.pregunta.trim(),
          respuesta: f.respuesta.trim(),
          enlace: (f.enlace || '').trim(),
          enlaceTexto: (f.enlaceTexto || '').trim(),
        }));

      await setDoc(
        doc(db, 'actividades_cole', 'configuracion_header'),
        {
          fotoFondoHeader: portalForm.fotoFondoHeader.trim(),
          fotoEtapaInfantil: portalForm.fotoEtapaInfantil.trim(),
          fotoEtapaPrimaria: portalForm.fotoEtapaPrimaria.trim(),
          fotoEtapaESO: portalForm.fotoEtapaESO.trim(),
          fotoEtapaAdultos: portalForm.fotoEtapaAdultos.trim(),
          fotoEtapaClubes: portalForm.fotoEtapaClubes.trim(),
          avisoActivo: Boolean(portalForm.avisoActivo),
          avisoTipo: portalForm.avisoTipo || 'plazo',
          avisoTitulo: portalForm.avisoTitulo.trim(),
          avisoTexto: portalForm.avisoTexto.trim(),
          avisoEnlace: portalForm.avisoEnlace.trim(),
          avisoEnlaceTexto: portalForm.avisoEnlaceTexto.trim(),
          faqs: cleanFaqs,
        },
        { merge: true },
      );
      onNotify?.(`${sectionLabel} guardada correctamente.`, 'exito');
    } catch (err) {
      console.error(err);
      onNotify?.('No se pudo guardar la configuración del portal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editorMapPins = useMemo(
    () => [
      { key: 'actividad', label: 'Actividad', color: 'red', lat: formData.latAct, lng: formData.lngAct },
      { key: 'monitores', label: 'Monitores', color: 'gold', lat: formData.latMon, lng: formData.lngMon },
      { key: 'familias', label: 'Familias', color: 'green', lat: formData.latFam, lng: formData.lngFam },
    ],
    [formData.latAct, formData.lngAct, formData.latMon, formData.lngMon, formData.latFam, formData.lngFam],
  );

  const handlePickEditorCoord = (pinKey, lat, lng) => {
    if (pinKey === 'actividad') {
      setFormData((prev) => ({ ...prev, latAct: lat, lngAct: lng }));
    } else if (pinKey === 'monitores') {
      setFormData((prev) => ({ ...prev, latMon: lat, lngMon: lng }));
    } else if (pinKey === 'familias') {
      setFormData((prev) => ({ ...prev, latFam: lat, lngFam: lng }));
    }
  };

  const tabs = [
    { id: 'listado', label: 'Catálogo y Clubes', icon: LayoutList },
    { id: 'editor', label: editingId ? 'Editando ficha' : 'Nueva ficha', icon: Plus },
    { id: 'mapa', label: 'Mapa del centro', icon: MapPin },
    { id: 'avisos', label: 'Avisos y FAQ', icon: Megaphone },
    { id: 'portada', label: 'Portada y copias', icon: ImageIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToPortal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155f9e] dark:text-sky-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al portal público</span>
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#082448] dark:text-white">
            Panel de coordinación
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona actividades, clubes colaboradores, puntos del mapa, avisos y preguntas frecuentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openNewEditor('actividad')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#082448] hover:bg-[#155f9e] text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-[#ffc629]" />
            <span>Nueva actividad</span>
          </button>
          <button
            type="button"
            onClick={() => openNewEditor('club')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[#155f9e] text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4 text-[#155f9e]" />
            <span>Nuevo Club Amigo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = adminTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setAdminTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#082448] text-white dark:bg-[#155f9e]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: LISTADO ==================== */}
      {adminTab === 'listado' && (
        <div className="space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Actividades activas
              </div>
              <div className="font-display text-3xl font-bold text-[#082448] dark:text-white mt-1">
                {stats.activeActivities}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Clubes Amigos activos
              </div>
              <div className="font-display text-3xl font-bold text-[#155f9e] dark:text-sky-400 mt-1">
                {stats.activeClubs}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ocultas / desactivadas
              </div>
              <div className="font-display text-3xl font-bold text-slate-600 dark:text-slate-300 mt-1">
                {stats.hiddenTotal}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/60">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Fichas con datos pendientes
              </div>
              <div className="font-display text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {stats.withWarnings}
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Buscar actividad, club, etapa o empresa..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={listTypeFilter}
                onChange={(e) => setListTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los tipos</option>
                <option value="actividad">Solo actividades</option>
                <option value="club">Solo Clubes Amigos</option>
              </select>

              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los estados</option>
                <option value="activas">Solo visibles</option>
                <option value="ocultas">Solo ocultas</option>
                <option value="avisos">Con datos pendientes</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  exportCatalogCsv(allItems);
                  onNotify?.('Listado CSV descargado para Excel.', 'exito');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Actividad / Club</th>
                    <th className="py-3.5 px-4">Etapas</th>
                    <th className="py-3.5 px-4">Horario y cuota</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-slate-400">
                        No hay fichas que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const warnings = getActivityWarnings(item);
                      const pub = isPublished(item);
                      const avail = AVAILABILITY_STATES[item.estadoPlazas] || AVAILABILITY_STATES.disponible;
                      return (
                        <tr
                          key={`${item.esClub ? 'c' : 'a'}-${item.id}`}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imagen || item.foto || '/fondo.jpg'}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.src = '/fondo.jpg';
                                }}
                                className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-[#082448] dark:text-white flex items-center gap-1.5 flex-wrap">
                                  <span>{item.nombre}</span>
                                  {item.esClub && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-white dark:bg-slate-700">
                                      Club
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.empresa || classifyCategory(item)}
                                </div>
                                {warnings.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {warnings.map((w) => (
                                      <span
                                        key={w}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                      >
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {getItemStages(item).map((st) => (
                                <span
                                  key={st}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.dias || '—'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {item.horario || '—'} · <strong>{item.precio || 'Sin cuota'}</strong>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  pub
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {pub ? 'Visible' : 'Oculta'}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {avail.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditorForItem(item, false)}
                                title="Editar ficha"
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#082448] dark:hover:text-white"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditorForItem(item, true)}
                                title="Duplicar ficha"
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#155f9e]"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleItemActive(item)}
                                title={pub ? 'Ocultar a familias' : 'Mostrar en portal'}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                {pub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ kind: 'item', target: item })}
                                title="Eliminar permanentemente"
                                className="p-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: EDITOR DE ACTIVIDAD / CLUB ==================== */}
      {adminTab === 'editor' && (
        <form onSubmit={handleSaveItem} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display text-xl font-bold text-[#082448] dark:text-white">
                  {editingId
                    ? `Editando ${editorMode === 'club' ? 'Club Amigo' : 'actividad'}`
                    : `Nueva ficha de ${editorMode === 'club' ? 'Club Amigo' : 'actividad'}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Colección de destino: <code className="font-mono">{editorMode === 'club' ? 'clubes_cole' : 'actividades_cole'}</code>
                </p>
              </div>

              {!editingId && (
                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEditorMode('actividad')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      editorMode === 'actividad'
                        ? 'bg-[#082448] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Actividad del colegio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('club');
                      setFormData((prev) => ({
                        ...prev,
                        etapas: prev.etapas.includes('Clubes Amigos')
                          ? prev.etapas
                          : [...prev.etapas, 'Clubes Amigos'],
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      editorMode === 'club'
                        ? 'bg-[#082448] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Club Amigo
                  </button>
                </div>
              )}
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Nombre de la actividad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Fútbol Sala, Inglés Cambridge, Judo..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Categoría
                </label>
                <select
                  value={formData.categoria || ''}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Clasificación automática</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Idiomas">Idiomas</option>
                  <option value="Arte/expresión">Arte y expresión</option>
                  <option value="Tecnología/manualidades">Tecnología y talleres</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Estado de plazas
                </label>
                <select
                  value={formData.estadoPlazas || 'disponible'}
                  onChange={(e) => setFormData({ ...formData, estadoPlazas: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {Object.values(AVAILABILITY_STATES).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stages Multi-select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
                Etapas donde aparece *
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((st) => {
                  const checked = (formData.etapas || []).includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        const list = formData.etapas || [];
                        setFormData({
                          ...formData,
                          etapas: checked ? list.filter((x) => x !== st.id) : [...list, st.id],
                        });
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        checked
                          ? 'bg-[#082448] text-white border-[#082448] dark:bg-[#155f9e] dark:border-[#155f9e]'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule & Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Días
                </label>
                <textarea
                  rows={2}
                  value={formData.dias || ''}
                  onChange={(e) => setFormData({ ...formData, dias: e.target.value })}
                  placeholder="Ej: Lunes y Miércoles"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Horario
                </label>
                <textarea
                  rows={2}
                  value={formData.horario || ''}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  placeholder="Ej: 16:00 a 17:00"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Cuota mensual
                </label>
                <input
                  type="text"
                  value={formData.precio || ''}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="Ej: 34€"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Description & Material */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Descripción para las familias
                </label>
                <textarea
                  rows={4}
                  value={formData.info || ''}
                  onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                  placeholder="Objetivos, niveles, observaciones..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Material necesario
                  </label>
                  <input
                    type="text"
                    value={formData.material || ''}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="Ej: Chándal del colegio, calzado deportivo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Lugar o aula
                  </label>
                  <input
                    type="text"
                    value={formData.lugar || ''}
                    onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                    placeholder="Ej: Pista polideportiva, Gimnasio, Aula 2..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Enrollment Links */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#082448] dark:text-sky-400">
                Enlaces de inscripción
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Enlace principal (formulario único)
                </label>
                <input
                  type="url"
                  value={formData.enlace || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, enlace: e.target.value, linkInscripcion: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Enlaces múltiples por categoría / curso (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        linksMultiples: [...(formData.linksMultiples || []), { etiqueta: '', url: '' }],
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#082448] text-white hover:bg-[#155f9e]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir enlace</span>
                  </button>
                </div>

                {(formData.linksMultiples || []).map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Prebenjamín (1.º y 2.º)"
                      value={link.etiqueta}
                      onChange={(e) => {
                        const next = [...formData.linksMultiples];
                        next[idx] = { ...next[idx], etiqueta: e.target.value };
                        setFormData({ ...formData, linksMultiples: next });
                      }}
                      className="sm:w-1/3 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => {
                        const next = [...formData.linksMultiples];
                        next[idx] = { ...next[idx], url: e.target.value };
                        setFormData({ ...formData, linksMultiples: next });
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          linksMultiples: formData.linksMultiples.filter((_, i) => i !== idx),
                        })
                      }
                      aria-label="Quitar fila"
                      className="px-2.5 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Company & Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploader
                label="Imagen de portada de la actividad"
                value={formData.imagen}
                onChange={(val) => setFormData({ ...formData, imagen: val })}
                folder="extraescolares/portadas"
                onNotify={onNotify}
              />
              <ImageUploader
                label="Imagen informativa adicional (opcional, ej. equipación)"
                value={formData.imagenExtra}
                onChange={(val) => setFormData({ ...formData, imagenExtra: val })}
                folder="extraescolares/extras"
                onNotify={onNotify}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#082448] dark:text-sky-400">
                Entidad gestora y contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Empresa o club (Ej: Alventus)"
                  value={formData.empresa || ''}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Persona de contacto (opcional)"
                  value={formData.nombreContacto || ''}
                  onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
                  className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Correo electrónico o teléfono"
                  value={formData.contacto || ''}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <ImageUploader
                label="Logo de la entidad (opcional)"
                value={formData.logoEmpresa}
                onChange={(val) => setFormData({ ...formData, logoEmpresa: val })}
                folder="extraescolares/logos"
                onNotify={onNotify}
                compact
              />
            </div>

            {/* Logistics & Embedded Coordinate Picker */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#082448] dark:text-sky-400">
                    Logística, recogida y ubicación en el mapa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Elige qué punto quieres colocar y haz clic directamente sobre el mapa aéreo.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'actividad', label: 'Actividad (rojo)', activeClass: 'bg-red-600 text-white' },
                    { key: 'monitores', label: 'Monitores (dorado)', activeClass: 'bg-amber-600 text-white' },
                    { key: 'familias', label: 'Familias (verde)', activeClass: 'bg-emerald-600 text-white' },
                  ].map((pin) => (
                    <button
                      key={pin.key}
                      type="button"
                      onClick={() => setActiveCoordPin(pin.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        activeCoordPin === pin.key
                          ? `${pin.activeClass} border-transparent`
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {pin.label}
                    </button>
                  ))}
                </div>
              </div>

              <CoordinatePickerMap
                pins={editorMapPins}
                activePinKey={activeCoordPin}
                onPick={handlePickEditorCoord}
                heightClass="h-[320px]"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Indicaciones de recogida por monitores
                  </label>
                  <textarea
                    rows={2}
                    value={formData.recogidaMonitores || ''}
                    onChange={(e) => setFormData({ ...formData, recogidaMonitores: e.target.value })}
                    placeholder="Ej: Los monitores recogen en el patio cubierto..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Indicaciones de entrega a familias
                  </label>
                  <textarea
                    rows={2}
                    value={formData.recogidaFamilias || ''}
                    onChange={(e) => setFormData({ ...formData, recogidaFamilias: e.target.value })}
                    placeholder="Ej: Entrega por la puerta principal de C/ El Greco..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ImageUploader
                  label="Foto lugar actividad"
                  value={formData.fotoAct}
                  onChange={(val) => setFormData({ ...formData, fotoAct: val })}
                  folder="extraescolares/mapa"
                  onNotify={onNotify}
                  compact
                />
                <ImageUploader
                  label="Foto recogida monitores"
                  value={formData.fotoMon}
                  onChange={(val) => setFormData({ ...formData, fotoMon: val })}
                  folder="extraescolares/mapa"
                  onNotify={onNotify}
                  compact
                />
                <ImageUploader
                  label="Foto entrega familias"
                  value={formData.fotoFam}
                  onChange={(val) => setFormData({ ...formData, fotoFam: val })}
                  folder="extraescolares/mapa"
                  onNotify={onNotify}
                  compact
                />
              </div>
            </div>

            {/* Visibility toggle + Save */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.activa !== false}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#082448]"
                />
                <span>Publicada y visible para las familias</span>
              </label>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setAdminTab('listado');
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#082448] hover:bg-[#155f9e] text-white disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingId ? 'Guardar cambios' : 'Publicar ficha'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================== TAB 3: MAPA DEL CENTRO ==================== */}
      {adminTab === 'mapa' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6">
          <form
            onSubmit={handleSaveMapPoint}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#082448] dark:text-white">
                {pointForm.id ? 'Editar punto del mapa' : 'Añadir punto de interés'}
              </h2>
              {pointForm.id && (
                <button
                  type="button"
                  onClick={() => setPointForm({ ...EMPTY_POINT })}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <CoordinatePickerMap
              pins={[
                {
                  key: 'point',
                  label: pointForm.nombre || 'Punto',
                  color: pointForm.color || 'blue',
                  lat: pointForm.lat,
                  lng: pointForm.lng,
                },
              ]}
              activePinKey="point"
              onPick={(_k, lat, lng) => setPointForm((prev) => ({ ...prev, lat, lng }))}
              heightClass="h-[280px]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Nombre del espacio *
                </label>
                <input
                  type="text"
                  required
                  value={pointForm.nombre}
                  onChange={(e) => setPointForm({ ...pointForm, nombre: e.target.value })}
                  placeholder="Ej: Puerta principal C/ El Greco, Pabellón..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={pointForm.descripcion}
                  onChange={(e) => setPointForm({ ...pointForm, descripcion: e.target.value })}
                  placeholder="Breve indicación para las familias"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Latitud
                </label>
                <input
                  type="text"
                  value={pointForm.lat}
                  onChange={(e) => setPointForm({ ...pointForm, lat: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Longitud
                </label>
                <input
                  type="text"
                  value={pointForm.lng}
                  onChange={(e) => setPointForm({ ...pointForm, lng: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Color del marcador
                </label>
                <div className="flex flex-wrap gap-2">
                  {MAP_POINT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPointForm({ ...pointForm, color: c.id })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                        pointForm.color === c.id
                          ? 'border-[#082448] dark:border-white bg-slate-100 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ImageUploader
              label="Fotografía del punto (opcional)"
              value={pointForm.foto}
              onChange={(val) => setPointForm({ ...pointForm, foto: val })}
              folder="extraescolares/mapa"
              onNotify={onNotify}
              compact
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#082448] hover:bg-[#155f9e] text-white text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{pointForm.id ? 'Actualizar punto' : 'Guardar punto en el mapa'}</span>
            </button>
          </form>

          {/* Points Directory */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#082448] dark:text-white">
              Puntos publicados ({puntosInteres.length})
            </h3>
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {puntosInteres.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  Aún no hay puntos guardados en el mapa maestro.
                </p>
              ) : (
                puntosInteres.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#082448] dark:text-white truncate">
                        {pt.nombre}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {pt.descripcion || `${pt.lat}, ${pt.lng}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPointForm({
                            id: pt.id,
                            nombre: pt.nombre || '',
                            descripcion: pt.descripcion || '',
                            lat: String(pt.lat ?? SCHOOL_CENTER[0]),
                            lng: String(pt.lng ?? SCHOOL_CENTER[1]),
                            foto: pt.foto || '',
                            color: pt.color || 'blue',
                          })
                        }
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ kind: 'point', target: pt })}
                        className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: AVISOS Y FAQ ==================== */}
      {adminTab === 'avisos' && (
        <div className="space-y-6">
          {/* Announcement Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#082448] dark:text-white">
                  Aviso institucional en portada
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ideal para campañas de inscripción, fechas límite de bajas o comunicados del colegio.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalForm.avisoActivo}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoActivo: e.target.checked })}
                  className="w-4 h-4 accent-[#082448]"
                />
                <span>Mostrar aviso</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Estilo
                </label>
                <select
                  value={portalForm.avisoTipo}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoTipo: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="plazo">Plazo / Campaña (dorado)</option>
                  <option value="info">Informativo (azul)</option>
                  <option value="importante">Importante (rojo)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Título breve
                </label>
                <input
                  type="text"
                  value={portalForm.avisoTitulo}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoTitulo: e.target.value })}
                  placeholder="Ej: Plazo de inscripción abierto:"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Mensaje
                </label>
                <input
                  type="text"
                  value={portalForm.avisoTexto}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoTexto: e.target.value })}
                  placeholder="Ej: Recuerda tramitar las bajas antes del día 25 del mes anterior."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Enlace opcional (https://...)
                </label>
                <input
                  type="url"
                  value={portalForm.avisoEnlace}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoEnlace: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">
                  Texto del botón
                </label>
                <input
                  type="text"
                  value={portalForm.avisoEnlaceTexto}
                  onChange={(e) => setPortalForm({ ...portalForm, avisoEnlaceTexto: e.target.value })}
                  placeholder="Ver circular"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dynamic FAQ Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#082448] dark:text-white">
                  Preguntas frecuentes ({portalForm.faqs.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Edita, añade o reordena las dudas que verán las familias sin tocar el código.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPortalForm({ ...portalForm, faqs: DEFAULT_FAQS })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar originales</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPortalForm({
                      ...portalForm,
                      faqs: [
                        ...portalForm.faqs,
                        { id: `faq-${Date.now()}`, pregunta: '', respuesta: '', enlace: '', enlaceTexto: '' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#082448] text-white hover:bg-[#155f9e]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir pregunta</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {portalForm.faqs.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">Pregunta {idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...portalForm.faqs];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setPortalForm({ ...portalForm, faqs: next });
                        }}
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === portalForm.faqs.length - 1}
                        onClick={() => {
                          const next = [...portalForm.faqs];
                          [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                          setPortalForm({ ...portalForm, faqs: next });
                        }}
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPortalForm({
                            ...portalForm,
                            faqs: portalForm.faqs.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1 rounded border border-red-200 dark:border-red-900 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Pregunta..."
                    value={faq.pregunta}
                    onChange={(e) => {
                      const next = [...portalForm.faqs];
                      next[idx] = { ...next[idx], pregunta: e.target.value };
                      setPortalForm({ ...portalForm, faqs: next });
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    placeholder="Respuesta..."
                    value={faq.respuesta}
                    onChange={(e) => {
                      const next = [...portalForm.faqs];
                      next[idx] = { ...next[idx], respuesta: e.target.value };
                      setPortalForm({ ...portalForm, faqs: next });
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSavePortalConfig('Configuración de avisos y FAQ')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#082448] hover:bg-[#155f9e] text-white text-sm font-bold disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Guardar avisos y preguntas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: PORTADA Y COPIAS DE SEGURIDAD ==================== */}
      {adminTab === 'portada' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#082448] dark:text-white">
                Imágenes de cabecera y etapas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puedes subir fotos directamente desde tu ordenador/móvil o pegar un enlace externo.
              </p>
            </div>

            <ImageUploader
              label="Imagen de fondo de la cabecera principal"
              value={portalForm.fotoFondoHeader}
              onChange={(val) => setPortalForm({ ...portalForm, fotoFondoHeader: val })}
              folder="extraescolares/portada"
              onNotify={onNotify}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <ImageUploader
                label="Portada Educación Infantil"
                value={portalForm.fotoEtapaInfantil}
                onChange={(val) => setPortalForm({ ...portalForm, fotoEtapaInfantil: val })}
                folder="extraescolares/etapas"
                onNotify={onNotify}
                compact
              />
              <ImageUploader
                label="Portada Educación Primaria"
                value={portalForm.fotoEtapaPrimaria}
                onChange={(val) => setPortalForm({ ...portalForm, fotoEtapaPrimaria: val })}
                folder="extraescolares/etapas"
                onNotify={onNotify}
                compact
              />
              <ImageUploader
                label="Portada Secundaria y Bachillerato (ESO)"
                value={portalForm.fotoEtapaESO}
                onChange={(val) => setPortalForm({ ...portalForm, fotoEtapaESO: val })}
                folder="extraescolares/etapas"
                onNotify={onNotify}
                compact
              />
              <ImageUploader
                label="Portada Adultos"
                value={portalForm.fotoEtapaAdultos}
                onChange={(val) => setPortalForm({ ...portalForm, fotoEtapaAdultos: val })}
                folder="extraescolares/etapas"
                onNotify={onNotify}
                compact
              />
              <ImageUploader
                label="Portada Clubes Amigos"
                value={portalForm.fotoEtapaClubes}
                onChange={(val) => setPortalForm({ ...portalForm, fotoEtapaClubes: val })}
                folder="extraescolares/etapas"
                onNotify={onNotify}
                compact
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSavePortalConfig('Configuración de portada')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#082448] hover:bg-[#155f9e] text-white text-sm font-bold disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Guardar imágenes</span>
              </button>
            </div>
          </div>

          {/* Export & Backup Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#082448] dark:text-white">
                Exportación y copia de seguridad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Descarga el catálogo completo en CSV compatible con Excel o un respaldo íntegro en JSON antes de iniciar cada curso.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  exportCatalogCsv(allItems);
                  onNotify?.('Archivo CSV descargado.', 'exito');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV (Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportBackupJson({ actividades, clubes, puntosInteres, config: configPortal });
                  onNotify?.('Copia de seguridad JSON descargada.', 'exito');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#082448] hover:bg-[#155f9e] text-white"
              >
                <DatabaseBackup className="w-4 h-4" />
                <span>Descargar respaldo JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (replaces window.confirm) */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ¿Deseas eliminar permanentemente <strong>«{confirmDelete.target.nombre}»</strong>? Esta acción no se puede deshacer. Si solo quieres ocultarla temporalmente, usa el botón de visibilidad.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
