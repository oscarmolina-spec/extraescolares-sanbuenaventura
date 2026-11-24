'use client';

import { ArrowRight, LayoutGrid } from 'lucide-react';
import { STAGES } from '../lib/constants';
import { matchesStage } from '../lib/helpers';

export default function StageLanding({
  publishedItems,
  fotosEtapas,
  onSelectStage,
  onExploreAll,
  cargando,
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#155f9e] dark:text-sky-400">
            Oferta educativa por etapas
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#082448] dark:text-white mt-1">
            Selecciona una etapa escolar
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Explora las actividades disponibles, sus horarios y los enlaces oficiales de inscripción.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreAll}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#082448] hover:bg-[#103563] text-white text-sm font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <LayoutGrid className="w-4 h-4 text-[#ffc629]" />
          <span>Ver todo el catálogo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAGES.map((stage) => {
          const items = publishedItems.filter((item) => matchesStage(item, stage.id));
          const preview = items.slice(0, 4);
          const image = fotosEtapas?.[stage.id] || stage.defaultImage;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className="group text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#155f9e]/50 dark:hover:border-sky-500/40 transition-all flex flex-col"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={image}
                  alt={stage.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#082448] shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${stage.dotClass}`} />
                    {stage.short}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <h3 className="font-display text-xl font-bold leading-tight">{stage.title}</h3>
                  <span className="text-xs font-semibold bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-md shrink-0">
                    {cargando ? '...' : `${items.length} ${items.length === 1 ? 'actividad' : 'actividades'}`}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stage.description}
                  </p>

                  {preview.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {preview.map((act) => (
                        <span
                          key={act.id}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {act.nombre}
                        </span>
                      ))}
                      {items.length > 4 && (
                        <span className="text-xs font-semibold px-2 py-1 text-[#155f9e] dark:text-sky-400">
                          +{items.length - 4} más
                        </span>
                      )}
                    </div>
                  ) : (
                    !cargando && (
                      <p className="text-xs italic text-slate-400">
                        Próximamente nuevas propuestas para esta etapa.
                      </p>
                    )
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold text-[#155f9e] dark:text-sky-400">
                  <span>Explorar oferta</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
