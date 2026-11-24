'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ArrowUp, X } from 'lucide-react';
import { auth, db } from '../app/firebase';
import {
  classifyCategory,
  getItemStages,
  isPublished,
  matchesStage,
  normalizeText,
  parseMonthlyPrice,
} from '../lib/helpers';
import Header from './Header';
import HeroSection from './HeroSection';
import StageLanding from './StageLanding';
import CatalogView from './CatalogView';
import ActivityDetail from './ActivityDetail';
import WeeklyPlannerModal from './WeeklyPlannerModal';
import FaqView from './FaqView';
import Footer from './Footer';
import AdminLoginModal from './AdminLoginModal';
import AdminDashboard from './AdminDashboard';
import ToastStack from './ToastStack';

const CampusPointsMap = dynamic(
  () => import('./CampusMap').then((mod) => mod.CampusPointsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-sm text-slate-500">
        Cargando mapa del colegio...
      </div>
    ),
  },
);

const PLANNER_STORAGE_KEY = 'csb-extraescolares-planner-v1';
const THEME_STORAGE_KEY = 'csb-extraescolares-theme-v1';

export default function ExtraescolaresPortal() {
  // Navigation & view state
  const [vista, setVista] = useState('catalogo'); // catalogo | detalles | mapa | faq | panel
  const [mostrarMenuEtapas, setMostrarMenuEtapas] = useState(true);
  const [actividadSeleccionadaId, setActividadSeleccionadaId] = useState(null);

  // Filters
  const [busqueda, setBusqueda] = useState('');
  const [etapaActiva, setEtapaActiva] = useState('Todos');
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('Todas');
  const [diaActivo, setDiaActivo] = useState('Todos');
  const [empresaActiva, setEmpresaActiva] = useState('Todas');
  const [orden, setOrden] = useState('nombre');

  // Firestore data
  const [actividades, setActividades] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [puntosInteres, setPuntosInteres] = useState([]);
  const [configPortal, setConfigPortal] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Auth & Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [initialAdminEdit, setInitialAdminEdit] = useState(null);
  const [catalogDeleteTarget, setCatalogDeleteTarget] = useState(null);

  // Planner, theme, UI
  const [plannerIds, setPlannerIds] = useState([]);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const notify = useCallback((mensaje, tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load saved theme & planner from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') setDarkMode(true);
      const savedPlanner = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY) || '[]');
      if (Array.isArray(savedPlanner)) {
        setPlannerIds(savedPlanner.filter((id) => typeof id === 'string'));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerIds));
    } catch {
      // Ignore storage errors
    }
  }, [plannerIds]);

  // Scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(Boolean(user));
    });
    return () => unsub();
  }, []);

  // Real-time Firestore subscriptions
  useEffect(() => {
    setCargando(true);

    const unsubAct = onSnapshot(
      query(collection(db, 'actividades_cole')),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const realActivities = docs.filter(
          (item) =>
            item.id !== 'configuracion_header' &&
            item.id !== 'configuración header' &&
            !item.id.toLowerCase().includes('configuracio'),
        );
        setActividades(realActivities);
        setCargando(false);
      },
      (err) => {
        console.error('Error cargando actividades:', err);
        notify('No se pudo conectar con la base de datos de actividades.', 'error');
        setCargando(false);
      },
    );

    const unsubClubes = onSnapshot(
      query(collection(db, 'clubes_cole')),
      (snapshot) => {
        setClubes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error('Error cargando clubes:', err),
    );

    const unsubPuntos = onSnapshot(
      query(collection(db, 'puntos_interes_cole')),
      (snapshot) => {
        setPuntosInteres(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error('Error cargando puntos:', err),
    );

    const unsubConfig = onSnapshot(
      doc(db, 'actividades_cole', 'configuracion_header'),
      (snap) => {
        if (snap.exists()) setConfigPortal(snap.data());
      },
      (err) => console.error('Error cargando configuración:', err),
    );

    return () => {
      unsubAct();
      unsubClubes();
      unsubPuntos();
      unsubConfig();
    };
  }, [notify]);

  // Combined items
  const allCombinedItems = useMemo(
    () => [
      ...actividades.map((a) => ({ ...a, esClub: false })),
      ...clubes.map((c) => ({ ...c, esClub: true })),
    ],
    [actividades, clubes],
  );

  const visibleItems = useMemo(
    () => allCombinedItems.filter((item) => isAdmin || isPublished(item)),
    [allCombinedItems, isAdmin],
  );

  const publishedItems = useMemo(
    () => allCombinedItems.filter(isPublished),
    [allCombinedItems],
  );

  // Sync URL & Browser History (Back button works cleanly!)
  const pushUrlState = useCallback((paramsObj) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
    }
  }, []);

  const applyUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const actParam = params.get('act');
    const vistaParam = params.get('vista');
    const etapaParam = params.get('etapa');

    if (actParam) {
      setActividadSeleccionadaId(actParam);
      setVista('detalles');
      return;
    }
    setActividadSeleccionadaId(null);

    if (vistaParam === 'mapa' || vistaParam === 'faq') {
      setVista(vistaParam);
      return;
    }
    if (vistaParam === 'panel') {
      setVista('panel');
      return;
    }

    setVista('catalogo');
    if (etapaParam) {
      setEtapaActiva(etapaParam);
      setMostrarMenuEtapas(false);
    } else {
      setMostrarMenuEtapas(true);
    }
  }, []);

  useEffect(() => {
    applyUrlParams();
    window.addEventListener('popstate', applyUrlParams);
    return () => window.removeEventListener('popstate', applyUrlParams);
  }, [applyUrlParams]);

  // Selected activity resolved live from Firestore state
  const actividadSeleccionada = useMemo(() => {
    if (!actividadSeleccionadaId) return null;
    return visibleItems.find((item) => item.id === actividadSeleccionadaId) || null;
  }, [actividadSeleccionadaId, visibleItems]);

  // If a non-admin tries to open panel or a hidden activity, redirect safely
  useEffect(() => {
    if (vista === 'panel' && !isAdmin) {
      setVista('catalogo');
      setLoginModalOpen(true);
    }
  }, [vista, isAdmin]);

  useEffect(() => {
    if (!cargando && vista === 'detalles' && actividadSeleccionadaId && !actividadSeleccionada) {
      setVista('catalogo');
      setActividadSeleccionadaId(null);
    }
  }, [cargando, vista, actividadSeleccionadaId, actividadSeleccionada]);

  // Dynamic companies list from real data
  const empresasDisponibles = useMemo(() => {
    const map = new Map();
    for (const item of visibleItems) {
      const raw = String(item.empresa || '').trim();
      if (!raw) continue;
      const key = normalizeText(raw);
      if (!map.has(key)) map.set(key, raw);
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b, 'es'));
  }, [visibleItems]);

  // Items in active stage (for dynamic category counts)
  const itemsInActiveStage = useMemo(
    () => visibleItems.filter((item) => matchesStage(item, etapaActiva)),
    [visibleItems, etapaActiva],
  );

  const categoriasDisponibles = useMemo(() => {
    const counts = {
      Todas: itemsInActiveStage.length,
      Deportes: 0,
      Idiomas: 0,
      'Arte/expresión': 0,
      'Tecnología/manualidades': 0,
    };
    for (const item of itemsInActiveStage) {
      const cat = classifyCategory(item);
      if (cat in counts) counts[cat] += 1;
    }
    return counts;
  }, [itemsInActiveStage]);

  // Filtered & sorted catalog items
  const itemsFiltrados = useMemo(() => {
    const q = normalizeText(busqueda);
    const empTarget = normalizeText(empresaActiva);
    const dayTarget = normalizeText(diaActivo);

    const filtered = visibleItems.filter((item) => {
      if (!matchesStage(item, etapaActiva)) return false;

      if (subcategoriaActiva !== 'Todas' && classifyCategory(item) !== subcategoriaActiva) {
        return false;
      }

      if (empTarget !== 'todas') {
        const emp = normalizeText(item.empresa);
        if (emp !== empTarget) return false;
      }

      if (dayTarget !== 'todos') {
        const days = normalizeText(`${item.dias || ''} ${item.horario || ''}`);
        if (!days.includes(dayTarget)) return false;
      }

      if (q) {
        const searchable = normalizeText(
          `${item.nombre} ${item.empresa} ${item.dias} ${item.info} ${item.descripcion} ${getItemStages(item).join(' ')}`,
        );
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (orden === 'precio-asc') {
        const pa = parseMonthlyPrice(a.precio) ?? Number.POSITIVE_INFINITY;
        const pb = parseMonthlyPrice(b.precio) ?? Number.POSITIVE_INFINITY;
        return pa - pb || String(a.nombre).localeCompare(String(b.nombre), 'es');
      }
      if (orden === 'precio-desc') {
        const pa = parseMonthlyPrice(a.precio) ?? -1;
        const pb = parseMonthlyPrice(b.precio) ?? -1;
        return pb - pa || String(a.nombre).localeCompare(String(b.nombre), 'es');
      }
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
    });
  }, [visibleItems, etapaActiva, subcategoriaActiva, empresaActiva, diaActivo, busqueda, orden]);

  // Weekly planner selected items
  const plannerItems = useMemo(
    () =>
      plannerIds
        .map((id) => visibleItems.find((item) => item.id === id))
        .filter(Boolean),
    [plannerIds, visibleItems],
  );

  // Navigation handlers
  const handleNavigate = (nextVista, options = {}) => {
    setActividadSeleccionadaId(null);
    if (nextVista === 'catalogo') {
      setVista('catalogo');
      if (options.resetMenu) {
        setMostrarMenuEtapas(true);
        setEtapaActiva('Todos');
        setSubcategoriaActiva('Todas');
        setDiaActivo('Todos');
        setEmpresaActiva('Todas');
        setBusqueda('');
        pushUrlState({});
      } else {
        pushUrlState(mostrarMenuEtapas ? {} : { etapa: etapaActiva });
      }
    } else if (nextVista === 'panel') {
      if (!isAdmin) {
        setLoginModalOpen(true);
        return;
      }
      setVista('panel');
      pushUrlState({ vista: 'panel' });
    } else {
      setVista(nextVista);
      pushUrlState({ vista: nextVista });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStage = (stageId) => {
    setEtapaActiva(stageId);
    setSubcategoriaActiva('Todas');
    setMostrarMenuEtapas(false);
    setVista('catalogo');
    pushUrlState({ etapa: stageId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetail = (item) => {
    setActividadSeleccionadaId(item.id);
    setVista('detalles');
    pushUrlState({ act: item.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTogglePlanner = (item) => {
    setPlannerIds((prev) => {
      if (prev.includes(item.id)) {
        notify(`«${item.nombre}» eliminada de Mi horario.`, 'info');
        return prev.filter((id) => id !== item.id);
      }
      notify(`«${item.nombre}» añadida a Mi horario.`, 'exito');
      return [...prev, item.id];
    });
  };

  const handleShare = async (item) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?act=${item.id}`;
    const shareText = `Actividad extraescolar «${item.nombre}» · Colegio San Buenaventura`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.nombre, text: shareText, url: shareUrl });
        notify('Enlace compartido correctamente.', 'exito');
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Enlace copiado al portapapeles.', 'exito');
    } catch {
      notify('No se pudo copiar el enlace.', 'error');
    }
  };

  const handleLogoutAdmin = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      if (vista === 'panel') {
        setVista('catalogo');
        pushUrlState({});
      }
      notify('Sesión de coordinación cerrada.', 'info');
    } catch (err) {
      console.error(err);
      notify('No se pudo cerrar la sesión.', 'error');
    }
  };

  const handleAdminToggleActive = async (item) => {
    try {
      const col = item.esClub ? 'clubes_cole' : 'actividades_cole';
      const nextState = !isPublished(item);
      await updateDoc(doc(db, col, item.id), { activa: nextState });
      notify(
        nextState ? `«${item.nombre}» reactivada.` : `«${item.nombre}» ocultada del portal.`,
        'exito',
      );
    } catch (err) {
      console.error(err);
      notify('No se pudo actualizar el estado.', 'error');
    }
  };

  const handleConfirmCatalogDelete = async () => {
    if (!catalogDeleteTarget) return;
    try {
      const col = catalogDeleteTarget.esClub ? 'clubes_cole' : 'actividades_cole';
      await deleteDoc(doc(db, col, catalogDeleteTarget.id));
      notify(`«${catalogDeleteTarget.nombre}» eliminada permanentemente.`, 'exito');
      setCatalogDeleteTarget(null);
    } catch (err) {
      console.error(err);
      notify('No se pudo eliminar la ficha.', 'error');
    }
  };

  const fotosEtapas = {
    Infantil: configPortal?.fotoEtapaInfantil || '',
    Primaria: configPortal?.fotoEtapaPrimaria || '',
    ESO: configPortal?.fotoEtapaESO || '',
    Adultos: configPortal?.fotoEtapaAdultos || '',
    'Clubes Amigos': configPortal?.fotoEtapaClubes || '',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f4] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        vista={vista}
        onNavigate={handleNavigate}
        plannerCount={plannerItems.length}
        onOpenPlanner={() => setPlannerOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
      />

      <main className="flex-1">
        {vista === 'catalogo' && (
          <>
            <HeroSection
              fotoFondoHeader={configPortal?.fotoFondoHeader || ''}
              busqueda={busqueda}
              onBusquedaChange={(val) => {
                setBusqueda(val);
                if (val.trim()) setMostrarMenuEtapas(false);
              }}
              configAviso={configPortal}
              onSelectStage={handleSelectStage}
              totalPublicadas={publishedItems.length}
            />

            {mostrarMenuEtapas && !busqueda.trim() ? (
              <StageLanding
                publishedItems={publishedItems}
                fotosEtapas={fotosEtapas}
                onSelectStage={handleSelectStage}
                onExploreAll={() => handleSelectStage('Todos')}
                cargando={cargando}
              />
            ) : (
              <CatalogView
                items={itemsFiltrados}
                cargando={cargando}
                etapaActiva={etapaActiva}
                onEtapaChange={(et) => {
                  setEtapaActiva(et);
                  pushUrlState({ etapa: et });
                }}
                subcategoriaActiva={subcategoriaActiva}
                onSubcategoriaChange={setSubcategoriaActiva}
                categoriasDisponibles={categoriasDisponibles}
                diaActivo={diaActivo}
                onDiaChange={setDiaActivo}
                empresaActiva={empresaActiva}
                onEmpresaChange={setEmpresaActiva}
                empresasDisponibles={empresasDisponibles}
                orden={orden}
                onOrdenChange={setOrden}
                busqueda={busqueda}
                onResetFilters={() => {
                  setBusqueda('');
                  setEtapaActiva('Todos');
                  setSubcategoriaActiva('Todas');
                  setDiaActivo('Todos');
                  setEmpresaActiva('Todas');
                  setOrden('nombre');
                  pushUrlState({ etapa: 'Todos' });
                  notify('Filtros restablecidos.', 'info');
                }}
                onBackToStages={() => handleNavigate('catalogo', { resetMenu: true })}
                plannerIds={plannerIds}
                onTogglePlanner={handleTogglePlanner}
                onOpenDetail={handleOpenDetail}
                onShare={handleShare}
                isAdmin={isAdmin}
                onAdminEdit={(item) => {
                  setInitialAdminEdit(item);
                  setVista('panel');
                  pushUrlState({ vista: 'panel' });
                }}
                onAdminToggleActive={handleAdminToggleActive}
                onAdminDelete={(item) => setCatalogDeleteTarget(item)}
              />
            )}
          </>
        )}

        {vista === 'detalles' && actividadSeleccionada && (
          <ActivityDetail
            item={actividadSeleccionada}
            onBack={() => {
              setActividadSeleccionadaId(null);
              setVista('catalogo');
              pushUrlState(mostrarMenuEtapas ? {} : { etapa: etapaActiva });
            }}
            onShare={handleShare}
            inPlanner={plannerIds.includes(actividadSeleccionada.id)}
            onTogglePlanner={handleTogglePlanner}
            onNotify={notify}
            isAdmin={isAdmin}
            onAdminEdit={(item) => {
              setInitialAdminEdit(item);
              setVista('panel');
              pushUrlState({ vista: 'panel' });
            }}
          />
        )}

        {vista === 'mapa' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#155f9e] dark:text-sky-400">
                Instalaciones del colegio
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#082448] dark:text-white mt-1">
                Mapa de espacios y puntos clave
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Consulta los accesos, patios, pabellones y puntos de encuentro del centro.
              </p>
            </div>
            <CampusPointsMap puntos={puntosInteres} />
          </section>
        )}

        {vista === 'faq' && <FaqView faqs={configPortal?.faqs} />}

        {vista === 'panel' && isAdmin && (
          <AdminDashboard
            actividades={actividades}
            clubes={clubes}
            puntosInteres={puntosInteres}
            configPortal={configPortal}
            initialEditItem={initialAdminEdit}
            onClearInitialEdit={() => setInitialAdminEdit(null)}
            onBackToPortal={() => handleNavigate('catalogo', { resetMenu: true })}
            onNotify={notify}
          />
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
      />

      {/* Modals & Global UI */}
      <WeeklyPlannerModal
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        selectedItems={plannerItems}
        onRemoveItem={(id) => setPlannerIds((prev) => prev.filter((x) => x !== id))}
        onClearAll={() => {
          setPlannerIds([]);
          notify('Planificador vaciado.', 'info');
        }}
        onOpenDetail={handleOpenDetail}
      />

      <AdminLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setVista('panel');
          pushUrlState({ vista: 'panel' });
        }}
        onNotify={notify}
      />

      {catalogDeleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setCatalogDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <button
                type="button"
                onClick={() => setCatalogDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ¿Deseas eliminar permanentemente <strong>«{catalogDeleteTarget.nombre}»</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatalogDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCatalogDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          className="no-print fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#082448] hover:bg-[#155f9e] text-white shadow-lg border border-white/15 transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
