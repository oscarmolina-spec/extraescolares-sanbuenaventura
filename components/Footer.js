'use client';

import { Phone, Mail, MapPin, Lock, ArrowUp, ExternalLink } from 'lucide-react';
import { SCHOOL_INFO } from '../lib/constants';

export default function Footer({ onNavigate, isAdmin, onOpenAdminLogin }) {
  return (
    <footer className="no-print bg-[#082448] text-slate-300 border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Identity */}
          <div className="space-y-4">
            <img
              src={SCHOOL_INFO.whiteLogoUrl}
              alt={SCHOOL_INFO.name}
              onError={(e) => {
                e.currentTarget.src = SCHOOL_INFO.crestUrl;
              }}
              className="h-12 w-auto object-contain"
            />
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-xs">
              Portal oficial de actividades extraescolares del {SCHOOL_INFO.name}.
            </p>
            <p className="text-xs text-slate-400 italic leading-relaxed max-w-xs">
              «{SCHOOL_INFO.legalNotice}»
            </p>
          </div>

          {/* Direct Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffc629]">
              Contacto directo
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5 text-slate-200">
                <MapPin className="w-4 h-4 text-[#ffc629] shrink-0 mt-0.5" />
                <span>{SCHOOL_INFO.address}</span>
              </li>
              <li>
                <a
                  href={SCHOOL_INFO.phoneHref}
                  className="inline-flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#ffc629] shrink-0" />
                  <span>{SCHOOL_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SCHOOL_INFO.email}`}
                  className="inline-flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-[#ffc629] shrink-0" />
                  <span>{SCHOOL_INFO.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SCHOOL_INFO.poolEmail}`}
                  className="inline-flex items-center gap-2.5 text-slate-200 hover:text-white transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-[#ffc629] shrink-0" />
                  <span>{SCHOOL_INFO.poolEmail}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffc629]">
                Accesos rápidos
              </h3>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('catalogo', { resetMenu: true });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('mapa')}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Mapa del centro
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('faq')}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Preguntas frecuentes
                </button>
                <a
                  href={SCHOOL_INFO.poolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                >
                  <span>Portal Piscina</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Subir</span>
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onNavigate('panel')}
                  className="inline-flex items-center gap-1.5 text-[#ffc629] hover:text-white font-medium transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Panel de coordinación</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acceso coordinación</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} {SCHOOL_INFO.name} · Actividades Extraescolares.
          </span>
          <span>Madrid</span>
        </div>
      </div>
    </footer>
  );
}
