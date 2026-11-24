'use client';

import { useState } from 'react';
import { ChevronDown, Search, ExternalLink, Mail } from 'lucide-react';
import { DEFAULT_FAQS, SCHOOL_INFO } from '../lib/constants';
import { normalizeText } from '../lib/helpers';

export default function FaqView({ faqs }) {
  const [openId, setOpenId] = useState(null);
  const [queryText, setQueryText] = useState('');

  const list = Array.isArray(faqs) && faqs.length > 0 ? faqs : DEFAULT_FAQS;
  const filtered = list.filter((faq) =>
    normalizeText(`${faq.pregunta} ${faq.respuesta}`).includes(normalizeText(queryText)),
  );

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#155f9e] dark:text-sky-400">
          Información para familias
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#082448] dark:text-white mt-1">
          Preguntas frecuentes
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Resuelve de forma rápida las dudas habituales sobre inscripciones, bajas, recogidas y funcionamiento general.
        </p>

        <div className="relative mt-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Buscar una duda (bajas, recibos, lluvia, piscina...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            No se encontraron preguntas que coincidan con «{queryText}».
          </div>
        ) : (
          filtered.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base text-[#082448] dark:text-white leading-snug">
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#155f9e] dark:text-sky-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <p>{faq.respuesta}</p>
                    {faq.enlace && /^https?:\/\//i.test(faq.enlace) && (
                      <a
                        href={faq.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#155f9e] dark:text-sky-400 hover:underline"
                      >
                        <span>{faq.enlaceTexto || faq.enlace}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Callout */}
      <div className="mt-8 p-6 rounded-2xl bg-[#082448] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">¿Tienes otra consulta?</h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Escríbenos directamente a coordinación de actividades extraescolares.
          </p>
        </div>
        <a
          href={`mailto:${SCHOOL_INFO.email}?subject=${encodeURIComponent('Consulta sobre actividades extraescolares')}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffc629] hover:bg-amber-300 text-[#082448] text-sm font-bold whitespace-nowrap transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Contactar por correo</span>
        </a>
      </div>
    </section>
  );
}
