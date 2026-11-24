'use client';

import { X, AlertTriangle, Trash2, Printer, CalendarClock, CheckCircle2 } from 'lucide-react';
import { WEEKDAYS } from '../lib/constants';
import { detectScheduleConflicts, parseMonthlyPrice, formatPriceDisplay } from '../lib/helpers';

export default function WeeklyPlannerModal({
  open,
  onClose,
  selectedItems,
  onRemoveItem,
  onClearAll,
  onOpenDetail,
}) {
  if (!open) return null;

  const { byDay, conflicts } = detectScheduleConflicts(selectedItems);
  const pricedItems = selectedItems
    .map((item) => ({ item, price: parseMonthlyPrice(item.precio) }))
    .filter((entry) => entry.price !== null);
  const estimatedTotal = pricedItems.reduce((sum, entry) => sum + entry.price, 0);
  const hasUnknownPrices = pricedItems.length < selectedItems.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Planificador semanal de actividades"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#082448] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <CalendarClock className="w-5 h-5 text-[#ffc629]" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold">
                Mi horario semanal
              </h2>
              <p className="text-xs text-slate-300">
                Comprueba si coinciden los horarios y calcula la cuota mensual estimada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar planificador"
            className="p-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {selectedItems.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarClock className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Todavía no has añadido actividades
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Pulsa el icono de calendario en cualquier tarjeta del catálogo para compararlas aquí y comprobar automáticamente si sus horarios son compatibles.
              </p>
            </div>
          ) : (
            <>
              {/* Conflict / Compatibility Alert */}
              {conflicts.length > 0 ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Se {conflicts.length === 1 ? 'ha detectado 1 solapamiento horario' : `han detectado ${conflicts.length} solapamientos horarios`}
                    </span>
                  </div>
                  <ul className="text-xs text-red-700 dark:text-red-200/90 space-y-1 pl-6 list-disc">
                    {conflicts.map((c, idx) => (
                      <li key={idx}>
                        <strong>{c.dayLabel}:</strong> «{c.a.nombre}» ({c.slotA}) coincide con «{c.b.nombre}» ({c.slotB}).
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 flex items-center gap-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Sin solapamientos detectados entre las actividades con horario definido.</span>
                </div>
              )}

              {/* Mon-Fri Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {WEEKDAYS.map((day) => {
                  const slots = byDay[day.id] || [];
                  const dayHasConflict = conflicts.some((c) => c.dayId === day.id);
                  return (
                    <div
                      key={day.id}
                      className={`rounded-xl border p-3 flex flex-col gap-2.5 min-h-[150px] ${
                        dayHasConflict
                          ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/15'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#082448] dark:text-slate-200">
                          {day.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {slots.length}
                        </span>
                      </div>

                      {slots.length === 0 ? (
                        <span className="text-xs text-slate-400 my-auto text-center">Libre</span>
                      ) : (
                        <div className="space-y-2">
                          {slots.map((slot, idx) => (
                            <button
                              key={`${slot.item.id}-${idx}`}
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenDetail(slot.item);
                              }}
                              className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#155f9e] shadow-xs transition-colors"
                            >
                              <div className="text-xs font-bold text-[#082448] dark:text-white leading-snug">
                                {slot.item.nombre}
                              </div>
                              <div className="text-[11px] font-medium text-[#155f9e] dark:text-sky-400 mt-1">
                                {slot.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Activities List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actividades seleccionadas ({selectedItems.length})
                </h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDetail(item);
                          }}
                          className="text-sm font-bold text-[#082448] dark:text-white hover:underline text-left truncate block"
                        >
                          {item.nombre}
                        </button>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.dias || 'Días a consultar'} · {item.horario || 'Horario a consultar'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-[#082448] dark:text-slate-200">
                          {formatPriceDisplay(item.precio) || 'Consultar'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label={`Quitar ${item.nombre}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary */}
        {selectedItems.length > 0 && (
          <div className="no-print px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estimación mensual total
              </div>
              <div className="font-display text-2xl font-bold text-[#082448] dark:text-white">
                {estimatedTotal.toFixed(estimatedTotal % 1 === 0 ? 0 : 2)} €
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1.5">
                  /mes {hasUnknownPrices ? '(sin incluir actividades sin tarifa)' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearAll}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Vaciar lista
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#082448] hover:bg-[#155f9e] text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir horario</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
