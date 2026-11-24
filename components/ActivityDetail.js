'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Share2,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Backpack,
  Mail,
  Copy,
  ExternalLink,
  CalendarPlus,
  CalendarCheck,
  Building2,
  Info,
  Pencil,
} from 'lucide-react';
import { AVAILABILITY_STATES, SCHOOL_CENTER, STAGES } from '../lib/constants';
import {
  formatPriceDisplay,
  getItemStages,
  getPrimaryEnrollmentUrl,
  getValidMultipleLinks,
  isValidCoord,
  parseActivityDescription,
} from '../lib/helpers';

const ActivityMap = dynamic(
  () => import('./CampusMap').then((mod) => mod.ActivityMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-sm text-slate-500">
        Cargando mapa del colegio...
      </div>
    ),
  },
);

export default function ActivityDetail({
  item,
  onBack,
  onShare,
  inPlanner,
  onTogglePlanner,
  onNotify,
  isAdmin,
  onAdminEdit,
}) {
  const [tab, setTab] = useState('info');
  const [selectedLinkUrl, setSelectedLinkUrl] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);

  const stages = getItemStages(item);
  const { text: cleanDesc, extraImage } = parseActivityDescription(item);
  const multipleLinks = getValidMultipleLinks(item);
  const primaryUrl = getPrimaryEnrollmentUrl(item);
  const priceText = formatPriceDisplay(item.precio);
  const availability = AVAILABILITY_STATES[item.estadoPlazas] || AVAILABILITY_STATES.disponible;
  const isClosed = item.estadoPlazas === 'cerrada';

  const hasActCoord = isValidCoord(item.latAct, item.lngAct, true);
  const hasMonCoord = isValidCoord(item.latMon, item.lngMon, true);
  const hasFamCoord = isValidCoord(item.latFam, item.lngFam, true);

  const posActividad = isValidCoord(item.latAct, item.lngAct)
    ? [Number(item.latAct), Number(item.lngAct)]
    : SCHOOL_CENTER;
  const posMonitores = hasMonCoord ? [Number(item.latMon), Number(item.lngMon)] : null;
  const posFamilias = hasFamCoord ? [Number(item.latFam), Number(item.lngFam)] : null;

  const contactClean = String(item.contacto || '').trim();
  const isEmailContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactClean);

  const copyContact = async () => {
    try {
      await navigator.clipboard.writeText(contactClean);
      onNotify?.('Contacto copiado al portapapeles.', 'exito');
    } catch {
      onNotify?.('No se pudo copiar el contacto.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#082448] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onAdminEdit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar ficha</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onTogglePlanner(item)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              inPlanner
                ? 'bg-[#ffc629]/20 border-[#ffc629] text-[#082448] dark:text-[#ffc629]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#155f9e]'
            }`}
          >
            {inPlanner ? <CalendarCheck className="w-3.5 h-3.5" /> : <CalendarPlus className="w-3.5 h-3.5" />}
            <span>{inPlanner ? 'En mi horario' : 'Añadir a mi horario'}</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#155f9e] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#155f9e] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-6">
        <div className="relative h-56 sm:h-72 w-full bg-slate-100 dark:bg-slate-800">
          <img
            src={item.imagen || item.foto || '/fondo.jpg'}
            alt={item.nombre}
            onError={(e) => {
              e.currentTarget.src = '/fondo.jpg';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {stages.map((st) => {
                const found = STAGES.find((s) => s.id.toLowerCase() === st.toLowerCase());
                return (
                  <span
                    key={st}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      found ? found.badgeClass : 'bg-white/90 text-slate-800 border-white'
                    }`}
                  >
                    {st}
                  </span>
                );
              })}
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${availability.badgeClass}`}>
                {availability.label}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#082448] dark:text-white tracking-tight">
              {item.nombre}
            </h1>
            {item.empresa && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#155f9e] dark:text-sky-400" />
                <span>Impartido por {item.empresa}</span>
              </p>
            )}
          </div>

          <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/70 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cuota mensual
            </div>
            <div className="font-display text-2xl font-bold text-[#082448] dark:text-white">
              {priceText || 'Consultar'}
              {priceText && !/consultar|gratis|mes/i.test(priceText) && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">/mes</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-2 p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setTab('info')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === 'info'
              ? 'bg-white dark:bg-slate-800 text-[#082448] dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Información y matrícula</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('mapa')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === 'mapa'
              ? 'bg-white dark:bg-slate-800 text-[#082448] dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mapa y puntos de recogida</span>
        </button>
      </div>

      {/* TAB 1: INFO */}
      {tab === 'info' && (
        <div className="space-y-6">
          {/* Quick Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-[#155f9e] dark:text-sky-400" />
                <span>Días de actividad</span>
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                {item.dias || 'Días a consultar'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Horario</span>
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                {item.horario || 'Horario a consultar'}
              </p>
            </div>
          </div>

          {/* Description & Material */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#082448] dark:text-white mb-2">
                Descripción de la actividad
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                {cleanDesc || 'No hay descripción adicional disponible para esta actividad.'}
              </p>
            </div>

            {extraImage && (
              <div className="pt-2">
                <img
                  src={extraImage}
                  alt={`Información adicional de ${item.nombre}`}
                  className="max-w-full max-h-[420px] rounded-xl border border-slate-200 dark:border-slate-700 mx-auto object-contain"
                />
              </div>
            )}

            {item.material && (
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
                  <Backpack className="w-4 h-4" />
                  <span>Material necesario</span>
                </div>
                <p className="mt-1.5 text-sm text-amber-900/90 dark:text-amber-200/90 whitespace-pre-wrap">
                  {item.material}
                </p>
              </div>
            )}
          </div>

          {/* Enrollment Box (supports BOTH single link and multipleLinks + Clubs!) */}
          {!isClosed && (multipleLinks.length > 0 || primaryUrl) && (
            <div className="no-print bg-[#082448] text-white rounded-2xl p-6 sm:p-7 shadow-md space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">Inscripción oficial</h2>
                <p className="text-sm text-slate-300 mt-1">
                  {multipleLinks.length > 0
                    ? 'Selecciona la categoría o curso correspondiente para acceder al formulario de inscripción.'
                    : 'Accede directamente al formulario oficial de alta de esta actividad.'}
                </p>
              </div>

              {multipleLinks.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedLinkUrl}
                    onChange={(e) => setSelectedLinkUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffc629]"
                  >
                    <option value="">Selecciona categoría / curso...</option>
                    {multipleLinks.map((link, idx) => (
                      <option key={idx} value={link.url}>
                        {link.etiqueta}
                      </option>
                    ))}
                  </select>
                  {selectedLinkUrl ? (
                    <a
                      href={selectedLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ffc629] hover:bg-amber-300 text-[#082448] text-sm font-bold whitespace-nowrap transition-colors"
                    >
                      <span>Inscribirse ahora</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/15 text-white/60 text-sm font-semibold cursor-not-allowed"
                    >
                      <span>Inscribirse ahora</span>
                    </button>
                  )}
                </div>
              ) : (
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ffc629] hover:bg-amber-300 text-[#082448] text-sm font-bold transition-colors w-full sm:w-auto"
                >
                  <span>Acceder al formulario de inscripción</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {isClosed && (
            <div className="rounded-2xl p-5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
              La inscripción para esta actividad se encuentra temporalmente cerrada. Para consultar vacantes, contacta con la entidad responsable o coordinación.
            </div>
          )}

          {/* Company & Contact */}
          {(item.empresa || contactClean) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.logoEmpresa && (
                  <img
                    src={item.logoEmpresa}
                    alt={item.empresa || 'Entidad organizadora'}
                    className="w-14 h-14 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white p-1.5 shrink-0"
                  />
                )}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Entidad responsable
                  </div>
                  <div className="font-display text-lg font-bold text-[#082448] dark:text-white">
                    {item.empresa || 'Colegio San Buenaventura'}
                  </div>
                  {item.nombreContacto && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Coordinación: {item.nombreContacto}
                    </div>
                  )}
                  {contactClean && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-all">
                      {contactClean}
                    </div>
                  )}
                </div>
              </div>

              {contactClean && (
                <div className="no-print flex items-center gap-2 shrink-0">
                  {isEmailContact && (
                    <a
                      href={`mailto:${contactClean}?subject=${encodeURIComponent(`Consulta sobre ${item.nombre}`)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#155f9e] hover:bg-[#082448] text-white text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar correo</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={copyContact}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAP & LOGISTICS (without "Cómo llegar" button per user instruction) */}
      {tab === 'mapa' && (
        <div className="space-y-5">
          <ActivityMap
            posActividad={posActividad}
            posMonitores={posMonitores}
            posFamilias={posFamilias}
            nombreAct={item.nombre}
            fotoAct={item.fotoAct}
            fotoMon={item.fotoMon}
            fotoFam={item.fotoFam}
            flyTarget={flyTarget}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Location */}
            <button
              type="button"
              disabled={!hasActCoord}
              onClick={() => hasActCoord && setFlyTarget({ coords: posActividad, color: 'red', ts: Date.now() })}
              className={`text-left p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                hasActCoord
                  ? 'border-slate-200 dark:border-slate-800 hover:border-red-400 cursor-pointer'
                  : 'border-slate-200/70 dark:border-slate-800/70 cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                <MapPin className="w-4 h-4" />
                <span>Lugar de la actividad</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {item.lugar || 'Espacio asignado en el colegio'}
              </p>
              {hasActCoord && (
                <span className="inline-block mt-2 text-xs font-semibold text-[#155f9e] dark:text-sky-400">
                  Ver en el mapa →
                </span>
              )}
            </button>

            {/* Monitors Pickup */}
            <button
              type="button"
              disabled={!hasMonCoord}
              onClick={() => hasMonCoord && setFlyTarget({ coords: posMonitores, color: 'gold', ts: Date.now() })}
              className={`text-left p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                hasMonCoord
                  ? 'border-slate-200 dark:border-slate-800 hover:border-amber-400 cursor-pointer'
                  : 'border-slate-200/70 dark:border-slate-800/70 cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <UserCheck className="w-4 h-4" />
                <span>Recogida monitores</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {item.recogidaMonitores || 'Punto de recogida general'}
              </p>
              {hasMonCoord && (
                <span className="inline-block mt-2 text-xs font-semibold text-[#155f9e] dark:text-sky-400">
                  Ver en el mapa →
                </span>
              )}
            </button>

            {/* Families Pickup */}
            <button
              type="button"
              disabled={!hasFamCoord}
              onClick={() => hasFamCoord && setFlyTarget({ coords: posFamilias, color: 'green', ts: Date.now() })}
              className={`text-left p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                hasFamCoord
                  ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 cursor-pointer'
                  : 'border-slate-200/70 dark:border-slate-800/70 cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Users className="w-4 h-4" />
                <span>Entrega a familias</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {item.recogidaFamilias || 'Punto de entrega general'}
              </p>
              {hasFamCoord && (
                <span className="inline-block mt-2 text-xs font-semibold text-[#155f9e] dark:text-sky-400">
                  Ver en el mapa →
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
