'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Share2,
  ArrowRight,
  ExternalLink,
  CalendarPlus,
  CalendarCheck,
  Pencil,
  EyeOff,
  Eye,
  Trash2,
  Building2,
} from 'lucide-react';
import { AVAILABILITY_STATES, STAGES } from '../lib/constants';
import {
  formatPriceDisplay,
  getItemStages,
  getPrimaryEnrollmentUrl,
  getValidMultipleLinks,
  isPublished,
  parseActivityDescription,
} from '../lib/helpers';

export default function ActivityCard({
  item,
  inPlanner,
  onTogglePlanner,
  onOpenDetail,
  onShare,
  isAdmin,
  onAdminEdit,
  onAdminToggleActive,
  onAdminDelete,
}) {
  const [selectedLinkUrl, setSelectedLinkUrl] = useState('');
  const stages = getItemStages(item);
  const { text: cleanDesc } = parseActivityDescription(item);
  const multipleLinks = getValidMultipleLinks(item);
  const primaryUrl = getPrimaryEnrollmentUrl(item);
  const priceText = formatPriceDisplay(item.precio);
  const published = isPublished(item);
  const availability = AVAILABILITY_STATES[item.estadoPlazas] || null;
  const isClosed = item.estadoPlazas === 'cerrada';

  const getStageBadge = (stageName) => {
    const found = STAGES.find((s) => s.id.toLowerCase() === stageName.toLowerCase());
    return found
      ? found.badgeClass
      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <article
      className={`group bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
        published
          ? 'border-slate-200/90 dark:border-slate-800 hover:border-[#155f9e]/50'
          : 'border-amber-400/70 dark:border-amber-600/60 opacity-90'
      }`}
    >
      {/* Card Image */}
      <div
        onClick={() => onOpenDetail(item)}
        className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shrink-0"
      >
        <img
          src={item.imagen || item.foto || '/fondo.jpg'}
          alt={item.nombre}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/fondo.jpg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />

        {/* Stage Badges */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
          {stages.map((st) => (
            <span
              key={st}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border backdrop-blur-sm ${getStageBadge(st)}`}
            >
              {st}
            </span>
          ))}
        </div>

        {/* Availability / Hidden status */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          {!published ? (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-slate-950 shadow">
              Oculta (solo coordinación)
            </span>
          ) : availability && item.estadoPlazas !== 'disponible' ? (
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${availability.badgeClass}`}>
              {availability.label}
            </span>
          ) : (
            <span />
          )}

          {item.empresa && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-950/65 text-white backdrop-blur-sm truncate max-w-[160px]">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.empresa}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <h3
            onClick={() => onOpenDetail(item)}
            className="font-display text-lg font-bold text-[#082448] dark:text-white leading-snug cursor-pointer group-hover:text-[#155f9e] dark:group-hover:text-sky-400 transition-colors"
          >
            {item.nombre}
          </h3>

          {/* Schedule metadata */}
          <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#155f9e] dark:text-sky-400 shrink-0 mt-0.5" />
              <span className="font-medium line-clamp-2">
                {item.dias || 'Días a consultar'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="font-medium line-clamp-2">
                {item.horario || 'Horario a consultar'}
              </span>
            </div>
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {cleanDesc || 'Consulta la ficha completa para ver detalles, material y puntos de recogida.'}
        </p>

        {/* Bottom Price & Actions */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Cuota mensual
              </div>
              <div className="font-display text-xl font-bold text-[#082448] dark:text-white leading-tight">
                {priceText || 'Consultar'}
                {priceText && !/consultar|gratis|mes/i.test(priceText) && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                    /mes
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onTogglePlanner(item)}
                title={inPlanner ? 'Quitar de Mi horario' : 'Añadir a Mi horario'}
                className={`p-2 rounded-lg border transition-colors ${
                  inPlanner
                    ? 'bg-[#ffc629]/20 border-[#ffc629] text-[#082448] dark:text-[#ffc629]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-[#082448] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {inPlanner ? <CalendarCheck className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => onShare(item)}
                title="Compartir enlace directo"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-[#082448] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(item)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#082448] hover:text-white dark:hover:bg-[#155f9e] text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
              >
                <span>Detalles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Smart Enrollment Controls */}
          {!isClosed && multipleLinks.length > 0 && (
            <div className="space-y-2">
              <select
                value={selectedLinkUrl}
                onChange={(e) => setSelectedLinkUrl(e.target.value)}
                aria-label={`Seleccionar categoría para ${item.nombre}`}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
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
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#082448] hover:bg-[#155f9e] text-white text-xs font-bold transition-colors"
                >
                  <span>Ir a la inscripción</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                >
                  <span>Elige una categoría para inscribirte</span>
                </button>
              )}
            </div>
          )}

          {!isClosed && multipleLinks.length === 0 && primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#082448] hover:bg-[#155f9e] text-white text-xs font-bold transition-colors"
            >
              <span>Inscribirse</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Admin Quick Bar */}
          {isAdmin && (
            <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onAdminEdit(item)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => onAdminToggleActive(item)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{published ? 'Ocultar' : 'Activar'}</span>
              </button>
              <button
                type="button"
                onClick={() => onAdminDelete(item)}
                aria-label="Eliminar actividad"
                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
