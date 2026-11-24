'use client';

import { ArrowLeft, RotateCcw, SlidersHorizontal, Search } from 'lucide-react';
import { CATEGORIES, STAGES, WEEKDAYS } from '../lib/constants';
import ActivityCard from './ActivityCard';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogView({
  items,
  cargando,
  etapaActiva,
  onEtapaChange,
  subcategoriaActiva,
  onSubcategoriaChange,
  categoriasDisponibles,
  diaActivo,
  onDiaChange,
  empresaActiva,
  onEmpresaChange,
  empresasDisponibles,
  orden,
  onOrdenChange,
  busqueda,
  onResetFilters,
  onBackToStages,
  plannerIds,
  onTogglePlanner,
  onOpenDetail,
  onShare,
  isAdmin,
  onAdminEdit,
  onAdminToggleActive,
  onAdminDelete,
}) {
  const hasActiveFilters =
    etapaActiva !== 'Todos' ||
    subcategoriaActiva !== 'Todas' ||
    diaActivo !== 'Todos' ||
    empresaActiva !== 'Todas' ||
    Boolean(busqueda);

  const stageTitle =
    etapaActiva === 'Todos'
      ? 'Catálogo completo'
      : STAGES.find((s) => s.id === etapaActiva)?.title || etapaActiva;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <button
            type="button"
            onClick={onBackToStages}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155f9e] dark:text-sky-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a selección por etapas</span>
          </button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#082448] dark:text-white">
              {stageTitle}
            </h2>
            {!cargando && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {items.length} {items.length === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#155f9e] self-start sm:self-auto transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Always-accessible Institutional Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
        {/* Stage Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Etapa
          </span>
          {[{ id: 'Todos', short: 'Todas' }, ...STAGES].map((st) => {
            const active = etapaActiva === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  onEtapaChange(st.id);
                  onSubcategoriaChange('Todas');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#082448] text-white dark:bg-[#155f9e]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.short}
              </button>
            );
          })}
        </div>

        {/* Category Chips + Day + Dynamic Company + Sort */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = categoriasDisponibles?.[cat.id] ?? 0;
              if (cat.id !== 'Todas' && count === 0) return null;
              const active = subcategoriaActiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSubcategoriaChange(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#155f9e] text-white border-[#155f9e]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selects: Day, Dynamic Company, Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>

            <select
              aria-label="Filtrar por día"
              value={diaActivo}
              onChange={(e) => onDiaChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
            >
              <option value="Todos">Todos los días</option>
              {WEEKDAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por entidad"
              value={empresaActiva}
              onChange={(e) => onEmpresaChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
            >
              <option value="Todas">Todas las entidades</option>
              {empresasDisponibles.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>

            <select
              aria-label="Ordenar actividades"
              value={orden}
              onChange={(e) => onOrdenChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
            >
              <option value="nombre">Orden alfabético (A–Z)</option>
              <option value="precio-asc">Cuota: menor a mayor</option>
              <option value="precio-desc">Cuota: mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto my-8 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#082448] dark:text-white">
            No se encontraron actividades
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No hay coincidencias con los filtros seleccionados. Prueba a cambiar la etapa, el día o el término de búsqueda.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#082448] hover:bg-[#155f9e] text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer filtros</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ActivityCard
              key={`${item.esClub ? 'club' : 'act'}-${item.id}`}
              item={item}
              inPlanner={plannerIds.includes(item.id)}
              onTogglePlanner={onTogglePlanner}
              onOpenDetail={onOpenDetail}
              onShare={onShare}
              isAdmin={isAdmin}
              onAdminEdit={onAdminEdit}
              onAdminToggleActive={onAdminToggleActive}
              onAdminDelete={onAdminDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
