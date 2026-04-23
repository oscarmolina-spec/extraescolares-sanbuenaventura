export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* 🌍 ESTA ES LA LÍNEA MÁGICA PARA EL MAPA */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
