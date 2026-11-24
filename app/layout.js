import './globals.css';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'https://extraescolares-sanbuenaventura.vercel.app'),
  ),
  title: 'Actividades Extraescolares · Colegio San Buenaventura',
  description:
    'Portal oficial de actividades extraescolares del Colegio San Buenaventura (Madrid). Consulta etapas, horarios, precios, puntos de recogida e inscripciones.',
  icons: {
    icon: '/escudo.png',
    apple: '/escudo.png',
  },
  openGraph: {
    title: 'Actividades Extraescolares · Colegio San Buenaventura',
    description:
      'Consulta la oferta oficial de actividades extraescolares, horarios, precios, mapa de recogida y planificador semanal del Colegio San Buenaventura.',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: '/escudo.png', alt: 'Colegio San Buenaventura' }],
  },
};

export const viewport = {
  themeColor: '#082448',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased bg-[#f6f7f4] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
