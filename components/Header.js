'use client';

import {
  MapPin,
  HelpCircle,
  Waves,
  CalendarClock,
  Sun,
  Moon,
  LayoutGrid,
  Settings,
  LogOut,
} from 'lucide-react';
import { SCHOOL_INFO } from '../lib/constants';

export default function Header({
  vista,
  onNavigate,
  plannerCount,
  onOpenPlanner,
  darkMode,
  onToggleDarkMode,
  isAdmin,
  onLogoutAdmin,
}) {
  const navItems = [
    { id: 'catalogo', label: 'Catálogo', icon: LayoutGrid },
    { id: 'mapa', label: 'Mapa del centro', icon: MapPin },
    { id: 'faq', label: 'Preguntas frecuentes', icon: HelpCircle },
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Institutional Brand */}
        <button
          type="button"
          onClick={() => onNavigate('catalogo', { resetMenu: true })}
          className="flex items-center gap-3 text-left group min-w-0"
        >
          <img
            src={SCHOOL_INFO.crestUrl}
            alt={SCHOOL_INFO.name}
            className="h-10 w-auto object-contain shrink-0"
          />
          <div className="leading-tight min-w-0">
            <div className="font-display font-bold text-sm sm:text-base text-[#082448] dark:text-white tracking-tight truncate">
              Extraescolares CSB
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              Colegio San Buenaventura · Madrid
            </div>
          </div>
        </button>

        {/* Primary Desktop Navigation */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = vista === item.id || (item.id === 'catalogo' && vista === 'detalles');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#082448] text-white dark:bg-[#155f9e]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#082448] dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <a
            href={SCHOOL_INFO.poolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#155f9e] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
          >
            <Waves className="w-4 h-4" />
            <span>Piscina</span>
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Weekly Planner Trigger */}
          <button
            type="button"
            onClick={onOpenPlanner}
            className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#082448]/15 dark:border-slate-700 bg-[#f6f7f4] dark:bg-slate-900 text-[#082448] dark:text-slate-100 hover:border-[#155f9e] transition-colors"
          >
            <CalendarClock className="w-4 h-4 text-[#155f9e] dark:text-sky-400" />
            <span className="hidden sm:inline">Mi horario</span>
            {plannerCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-[#ffc629] text-[#082448]">
                {plannerCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={darkMode ? 'Tema claro' : 'Tema oscuro'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Only visible once already authenticated as Admin */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onNavigate(vista === 'panel' ? 'catalogo' : 'panel')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  vista === 'panel'
                    ? 'bg-[#ffc629] text-[#082448]'
                    : 'bg-[#082448] text-white hover:bg-[#103563]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {vista === 'panel' ? 'Ver portal' : 'Gestión'}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogoutAdmin}
                aria-label="Cerrar sesión de coordinación"
                title="Cerrar sesión"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <div className="md:hidden border-t border-slate-100 dark:border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = vista === item.id || (item.id === 'catalogo' && vista === 'detalles');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                active
                  ? 'bg-[#082448] text-white dark:bg-[#155f9e]'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <a
          href={SCHOOL_INFO.poolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-[#155f9e] dark:text-sky-400"
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Piscina</span>
        </a>
      </div>
    </header>
  );
}
