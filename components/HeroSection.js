'use client';

import { Search, X, Megaphone, ArrowRight } from 'lucide-react';
import { SCHOOL_INFO, STAGES } from '../lib/constants';

export default function HeroSection({
  fotoFondoHeader,
  busqueda,
  onBusquedaChange,
  configAviso,
  onSelectStage,
  totalPublicadas,
}) {
  const avisoStyles = {
    info: 'bg-sky-500/15 border-sky-300/30 text-sky-100',
    plazo: 'bg-[#ffc629]/20 border-[#ffc629]/45 text-amber-100',
    importante: 'bg-red-500/20 border-red-300/40 text-red-100',
  };

  return (
    <section className="no-print relative overflow-hidden bg-gradient-to-br from-[#082448] via-[#0d305c] to-[#082448] text-white">
      {/* Subtle school silhouette */}
      {fotoFondoHeader && (
        <img
          src={fotoFondoHeader}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-15 grayscale pointer-events-none select-none"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#082448] via-[#082448]/70 to-transparent pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Editable Institutional Announcement Banner */}
        {configAviso?.avisoActivo && (configAviso.avisoTitulo || configAviso.avisoTexto) && (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm ${
              avisoStyles[configAviso.avisoTipo] || avisoStyles.plazo
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Megaphone className="w-4 h-4 shrink-0 mt-0.5 text-[#ffc629]" />
              <div className="text-sm leading-snug">
                {configAviso.avisoTitulo && (
                  <strong className="font-bold mr-1.5 text-white">{configAviso.avisoTitulo}</strong>
                )}
                {configAviso.avisoTexto && <span>{configAviso.avisoTexto}</span>}
              </div>
            </div>
            {configAviso.avisoEnlace && /^https?:\/\//i.test(configAviso.avisoEnlace) && (
              <a
                href={configAviso.avisoEnlace}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffc629] text-[#082448] text-xs font-bold whitespace-nowrap hover:bg-amber-300 transition-colors self-start sm:self-center"
              >
                <span>{configAviso.avisoEnlaceTexto || 'Más información'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffc629]">
              <span>{SCHOOL_INFO.name}</span>
              <span className="text-white/30">•</span>
              <span className="text-slate-200">{totalPublicadas} propuestas activas</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08]">
              Actividades Extraescolares
            </h1>

            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-xl">
              Consulta horarios, tarifas, puntos de recogida y organiza el calendario semanal de tus hijos de forma clara y centralizada.
            </p>

            {/* Instant Search Bar */}
            <div className="pt-1 max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => onBusquedaChange(e.target.value)}
                  placeholder="Buscar por actividad, deporte, idioma, día o empresa..."
                  aria-label="Buscar actividades extraescolares"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ffc629]"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => onBusquedaChange('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Stage Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-xs text-slate-300 mr-1">Acceso rápido:</span>
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => onSelectStage(stage.id)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                  >
                    {stage.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Institutional Crest (clean & balanced on desktop) */}
          <div className="hidden lg:flex flex-col items-end gap-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl">
              <img
                src={SCHOOL_INFO.crestUrl}
                alt={SCHOOL_INFO.name}
                className="w-28 h-28 object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle CSB gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#ffc629] via-[#155f9e] to-[#082448]" />
    </section>
  );
}
