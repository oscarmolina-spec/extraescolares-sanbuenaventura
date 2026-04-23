'use client';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Esto es como un "escudo" para que el mapa cargue solo cuando la web esté lista
const MapaActividad = dynamic(() => import('./Mapa'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '350px',
        backgroundColor: '#f1f5f9',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      Cargando mapa interactivo...
    </div>
  ),
});

export default function Page() {
  const [vista, setVista] = useState('catalogo');
  const [etapaActiva, setEtapaActiva] = useState('Infantil');
  const [actividades, setActividades] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [editandoId, setEditandoId] = useState(null); // Para saber si estamos creando o editando
  const [pestaña, setPestaña] = useState('info'); // Puede ser 'info' o 'mapa'
  const [coordsTemp, setCoordsTemp] = useState({
    latA: '',
    lngA: '',
    latM: '',
    lngM: '',
    latF: '',
    lngF: '',
  });
  // 🏰 El enlace mágico de tu escudo desde Storage
  const URL_ESCUDO =
    'https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/San%20%20uenaventura.png?alt=media&token=c70def71-3920-425e-9d68-a3519ed51960';

  const [nuevaAct, setNuevaAct] = useState({
    nombre: '',
    etapa: 'Infantil',
    dias: '',
    horario: '',
    lugar: '',
    info: '',
    imagen: '',
    recogidaMonitores: '',
    recogidaFamilias: '',
    precio: '',
    // 📍 Coordenadas del cole ya puestas por defecto:
    latAct: '40.407937755274425',
    lngAct: '-3.7469348757382366',
    fotoAct: '', // Foto del aula/patio
    fotoMon: '', // Foto punto monitores
    fotoFam: '', // Foto punto familias
  });

  const cargarActividades = async () => {
    try {
      const q = query(collection(db, 'actividades_cole'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActividades(docs);
    } catch (e) {
      console.error('Error cargando:', e);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  const guardarActividad = async () => {
    if (!nuevaAct.nombre) return alert('¡Escribe el nombre de la actividad!');

    // 🚀 PASO MÁGICO: Convertimos las coordenadas de texto a números reales
    const actividadFinal = {
      ...nuevaAct,
      latAct: parseFloat(nuevaAct.latAct) || 0,
      lngAct: parseFloat(nuevaAct.lngAct) || 0,
      latMon: parseFloat(nuevaAct.latMon) || 0,
      lngMon: parseFloat(nuevaAct.lngMon) || 0,
      latFam: parseFloat(nuevaAct.latFam) || 0,
      lngFam: parseFloat(nuevaAct.lngFam) || 0,
    };

    try {
      if (editandoId) {
        const { updateDoc, doc } = await import('firebase/firestore');
        // 👇 Usamos 'actividadFinal' en lugar de 'nuevaAct'
        await updateDoc(
          doc(db, 'actividades_cole', editandoId),
          actividadFinal
        );
        alert('¡Actividad actualizada con éxito! 🔄');
      } else {
        // 👇 Usamos 'actividadFinal' en lugar de 'nuevaAct'
        await addDoc(collection(db, 'actividades_cole'), actividadFinal);
        alert('¡Publicado con éxito! ✨');
      }

      // Limpiamos todo (incluidas las nuevas coordenadas)
      setNuevaAct({
        nombre: '',
        etapa: 'Infantil',
        dias: '',
        horario: '',
        lugar: '',
        info: '',
        imagen: '',
        recogidaMonitores: '',
        recogidaFamilias: '',
        precio: '',
        latAct: '', // Limpiamos también estos...
        lngAct: '',
        latMon: '',
        lngMon: '',
        latFam: '',
        lngFam: '',
      });
      setEditandoId(null);
      setVista('catalogo');
      cargarActividades();
    } catch (e) {
      console.error('Error al guardar:', e);
      alert('Vaya, parece que ha habido un error al conectar con la nube.');
    }
  };

  if (vista === 'catalogo') {
    return (
      <div
        style={{
          fontFamily: 'sans-serif',
          backgroundColor: '#f1f5f9',
          minHeight: '100vh',
          paddingBottom: '100px',
        }}
      >
        <header
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', // Azul marino profundo
            padding: '60px 20px 50px',
            textAlign: 'center',
            borderRadius: '0 0 50px 50px',
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
            marginBottom: '30px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Un pequeño brillo decorativo en la esquina */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          ></div>

          {/* ⭐ CONTENEDOR DEL ESCUDO "ELITE" - MÁS GRANDE Y BRILLANTE */}
          <div
            style={{
              position: 'relative',
              display: 'block', // Cambiamos a block para controlar mejor el centro
              margin: '0 auto 50px', // Centrado y mucho espacio abajo para no pisar el título
              width: 'fit-content',
              padding: '20px',
            }}
          >
            {/* 💡 EL TRUCO: Resplandor Blanco Intenso (Aura Pro) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '320px', // Aura mucho más amplia
                height: '320px',
                // He subido la opacidad de 0.15 a 0.3 para que el blanco se note de verdad
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(59, 130, 246, 0) 70%)',
                borderRadius: '50%',
                filter: 'blur(20px)', // Más desenfoque para que parezca luz real
                zIndex: 0,
              }}
            ></div>

            {/* 🛡️ EL ESCUDO GIGANTE (260px) */}
            <img
              src="https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/colegio%20buena%20-%20Editada.png?alt=media&token=d30127c6-037e-47c5-a7e0-29d7cd5585fd"
              style={{
                width: '260px', // 💪 ¡GIGANTE! Casi el doble de lo normal
                height: 'auto',
                position: 'relative',
                zIndex: 1,
                // Sombra más profunda para que "salga" de la pantalla
                filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.5))',
                transition: 'all 0.4s ease',
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '2.4rem',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            Extraescolares
            <span
              style={{
                color: '#60a5fa',
                display: 'block',
                fontSize: '1.8rem',
                marginTop: '5px',
              }}
            >
              San Buenaventura
            </span>
          </h1>

          <p
            style={{
              color: '#94a3b8',
              marginTop: '10px',
              fontSize: '1rem',
              fontWeight: '500',
              letterSpacing: '1px',
            }}
          >
            PORTAL DE ACTIVIDADES 2026
          </p>

          {/* Selector de etapas moderno sobre fondo oscuro */}
          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {['Infantil', 'Primaria', 'ESO'].map((e) => (
              <button
                key={e}
                onClick={() => setEtapaActiva(e)}
                style={{
                  padding: '14px 30px',
                  borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor:
                    etapaActiva === e ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '1rem',
                  boxShadow:
                    etapaActiva === e
                      ? '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
                      : 'none',
                  transform: etapaActiva === e ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </header>

        <main
          style={{
            maxWidth: '1100px',
            margin: '40px auto',
            padding: '0 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {actividades.filter((a) => a.etapa === etapaActiva).length === 0 && (
            <div
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: '50px',
                backgroundColor: 'white',
                borderRadius: '20px',
              }}
            >
              <p>
                No hay actividades publicadas en <strong>{etapaActiva}</strong>{' '}
                todavía.
              </p>
              {isAdmin && (
                <p style={{ color: '#ff6b6b' }}>
                  ¡Pulsa el botón verde de abajo para añadir la primera!
                </p>
              )}
            </div>
          )}

          {actividades
            .filter((a) => a.etapa === etapaActiva)
            .map((act) => (
              <div
                key={act.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '24px', // Esquinas más modernas
                  overflow: 'hidden',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* 🖼️ IMAGEN CON ETAPA FLOTANTE */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={
                      act.imagen ||
                      'https://via.placeholder.com/400x200?text=San+Buenaventura'
                    }
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/400x200?text=San+Buenaventura';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px 12px',
                      borderRadius: '99px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#1e293b',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {act.etapa}
                  </div>
                </div>

                {/* 📝 CONTENIDO DE LA TARJETA */}
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 5px',
                      fontSize: '1.2rem',
                      color: '#0f172a',
                      fontWeight: '700',
                    }}
                  >
                    {act.nombre}
                  </h3>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '0.85rem',
                      margin: '0 0 15px',
                    }}
                  >
                    📅 {act.dias} · {act.horario}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    {/* Botón de Detalles (Principal) */}
                    <button
                      onClick={() => {
                        setActividadSeleccionada(act);
                        setVista('detalles');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#f1f5f9',
                        color: '#1e293b',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginBottom: '10px',
                      }}
                    >
                      Ver información completa
                    </button>

                    {/* BOTÓN ROJO DE INSCRIPCIÓN */}
                    {act.enlace && (
                      <a
                        href={act.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '12px',
                          backgroundColor: '#ff6b6b',
                          color: 'white',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          boxShadow: '0 4px 10px rgba(255, 107, 107, 0.2)',
                        }}
                      >
                        📝 ¡INSCRIBIRSE AHORA!
                      </a>
                    )}

                    {/* BOTONES DE ADMIN (Más discretos) */}
                    {isAdmin && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '15px',
                          paddingTop: '15px',
                          borderTop: '1px dotted #e2e8f0',
                        }}
                      >
                        <button
                          onClick={() => {
                            setNuevaAct(act);
                            setEditandoId(act.id);
                            setVista('panel');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Quieres borrar esta actividad?')) {
                              await deleteDoc(
                                doc(db, 'actividades_cole', act.id)
                              );
                              cargarActividades();
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          BORRAR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </main>

        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column', // Ponemos uno sobre otro para que no se amontonen
            alignItems: 'center',
            gap: '10px',
            zIndex: 100,
          }}
        >
          {/* 📍 BOTÓN DEL MAPA: Este lo verán siempre todos los papis */}
          <button
            onClick={() =>
              window.open(
                'https://view.genially.com/66f7b5afb6305cd7a7cb61e6',
                '_blank'
              )
            }
            style={{
              padding: '14px 28px',
              backgroundColor: '#3b82f6', // Un azul muy profesional
              color: 'white',
              border: 'none',
              borderRadius: '99px',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '1rem',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s ease',
            }}
          >
            <span>📍</span> VER MAPA DE ZONAS
          </button>

          {/* Aquí empieza la lógica de Admin que ya tenías */}
          {!isAdmin ? (
            <button
              onClick={() => {
                const p = prompt('Clave:');
                if (p === 'admin') setIsAdmin(true);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#cbd5e1',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                opacity: 0.7, // Lo hacemos más pequeñito y discreto
              }}
            >
              🔑 Acceso Admin
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setNuevaAct({
                    nombre: '',
                    etapa: 'Infantil',
                    dias: '',
                    horario: '',
                    lugar: '',
                    info: '',
                    imagen: '',
                    recogidaMonitores: '',
                    recogidaFamilias: '',
                    precio: '',
                    enlace: '',
                  });
                  setEditandoId(null);
                  setVista('panel');
                }}
                style={{
                  padding: '15px 30px',
                  backgroundColor: '#10ac84',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(16,172,132,0.4)',
                }}
              >
                + AÑADIR ACTIVIDAD
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                style={{
                  padding: '15px 20px',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (vista === 'detalles' && actividadSeleccionada) {
    const act = actividadSeleccionada;
    return (
      <div
        style={{
          maxWidth: '650px',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 🔙 Botón Volver Minimalista */}
        <button
          onClick={() => setVista('catalogo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '1rem',
          }}
        >
          ← Volver al catálogo
        </button>

        {/* 🖼️ Tarjeta Principal de Imagen */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
            marginBottom: '25px',
          }}
        >
          <img
            src={
              act.imagen ||
              'https://via.placeholder.com/800x400?text=San+Buenaventura'
            }
            style={{ width: '100%', height: '300px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/800x400?text=Revisar+Imagen';
            }}
          />
          <div style={{ padding: '30px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <span
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '6px 16px',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  {act.etapa}
                </span>
                <h2
                  style={{
                    fontSize: '2.2rem',
                    color: '#0f172a',
                    margin: '15px 0 5px',
                    fontWeight: '800',
                    letterSpacing: '-1px',
                  }}
                >
                  {act.nombre}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    color: '#3b82f6',
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    margin: 0,
                  }}
                >
                  {act.precio}€
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  al mes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 SELECTOR DE PESTAÑAS (Estilo Apple, muy moderno) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '25px',
            backgroundColor: '#f1f5f9',
            padding: '6px',
            borderRadius: '20px',
          }}
        >
          <button
            onClick={() => setPestaña('info')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '15px',
              border: 'none',
              backgroundColor: pestaña === 'info' ? 'white' : 'transparent',
              color: pestaña === 'info' ? '#1e293b' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s',
              boxShadow:
                pestaña === 'info' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            📝 Información
          </button>
          <button
            onClick={() => setPestaña('mapa')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '15px',
              border: 'none',
              backgroundColor: pestaña === 'mapa' ? 'white' : 'transparent',
              color: pestaña === 'mapa' ? '#1e293b' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s',
              boxShadow:
                pestaña === 'mapa' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            📍 Mapa y Recogida
          </button>
        </div>

        {/* 📦 CONTENIDO DINÁMICO */}
        {pestaña === 'info' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {/* 📅 Grid de Información Rápida */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '24px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  📅 Días
                </p>
                <p
                  style={{
                    margin: '5px 0 0',
                    fontWeight: '700',
                    color: '#1e293b',
                    fontSize: '1.1rem',
                  }}
                >
                  {act.dias}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '24px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  ⏰ Horario
                </p>
                <p
                  style={{
                    margin: '5px 0 0',
                    fontWeight: '700',
                    color: '#1e293b',
                    fontSize: '1.1rem',
                  }}
                >
                  {act.horario}
                </p>
              </div>
            </div>

            {/* 🎒 Material y Descripción */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '32px',
                border: '1px solid #f1f5f9',
                marginBottom: '25px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 15px',
                  color: '#0f172a',
                  fontSize: '1.2rem',
                  fontWeight: '800',
                }}
              >
                Sobre la actividad
              </h4>
              <p
                style={{
                  color: '#475569',
                  lineHeight: '1.8',
                  fontSize: '1.05rem',
                }}
              >
                {act.info}
              </p>
              {act.material && (
                <div
                  style={{
                    marginTop: '25px',
                    padding: '20px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '20px',
                    borderLeft: '6px solid #f97316',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: '800',
                      color: '#9a3412',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🎒</span> Material Necesario
                  </p>
                  <p
                    style={{
                      margin: '8px 0 0',
                      color: '#c2410c',
                      fontWeight: '600',
                    }}
                  >
                    {act.material}
                  </p>
                </div>
              )}
            </div>

            {/* 🏢 Empresa e Inscripción */}
            {act.empresa && (
              <div
                style={{
                  padding: '30px',
                  backgroundColor: '#ffffff',
                  borderRadius: '32px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  marginBottom: '30px',
                }}
              >
                {/* 📸 ¡Aquí vuelve a estar tu logo! */}
                {act.logoEmpresa && (
                  <img
                    src={act.logoEmpresa}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'contain',
                      marginBottom: '15px',
                      border: '3px solid #f1f5f9',
                      padding: '5px',
                    }}
                    alt="Logo empresa"
                  />
                )}

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Impartido por
                </p>
                <h4
                  style={{
                    margin: '5px 0 20px',
                    fontSize: '1.4rem',
                    color: '#1e293b',
                  }}
                >
                  {act.empresa}
                </h4>

                {act.contacto && (
                  <button
                    onClick={() => {
                      const mail = act.contacto
                        .replace(/\s/g, '')
                        .toLowerCase();
                      const asunto = encodeURIComponent(
                        `Consulta: ${act.nombre}`
                      );
                      window.open(
                        `https://mail.google.com/mail/?view=cm&fs=1&to=${mail}&su=${asunto}`,
                        '_blank'
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: '#f1f5f9',
                      color: '#3b82f6',
                      border: 'none',
                      borderRadius: '16px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                  >
                    ✉️ Contactar con la empresa
                  </button>
                )}
              </div>
            )}

            {act.enlace && (
              <a
                href={act.enlace}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '22px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  borderRadius: '24px',
                  textDecoration: 'none',
                  fontWeight: '800',
                  fontSize: '1.3rem',
                  boxShadow: '0 15px 30px rgba(255, 107, 107, 0.4)',
                  marginBottom: '60px',
                }}
              >
                📝 ¡INSCRIBIRSE AHORA!
              </a>
            )}
          </div>
        )}

        {pestaña === 'mapa' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ marginBottom: '25px' }}>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                📍 Localización en el centro
              </p>
              <MapaActividad
                posActividad={[
                  act.latAct || 40.407937755274425,
                  act.lngAct || -3.7469348757382366,
                ]}
                posMonitores={
                  act.latMon && act.latMon !== 40.407937755274425
                    ? [act.latMon, act.lngMon]
                    : null
                }
                posFamilias={
                  act.latFam && act.latFam !== 40.407937755274425
                    ? [act.latFam, act.lngFam]
                    : null
                }
                nombreAct={act.nombre}
                fotoAct={act.fotoAct}
                fotoMon={act.fotoMon}
                fotoFam={act.fotoFam}
              />
            </div>

            {/* 📍 Logística (Recogidas) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '25px',
                borderRadius: '28px',
                border: '1px solid #f1f5f9',
                marginBottom: '60px',
              }}
            >
              <div
                style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>📍</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                    Lugar
                  </p>
                  <p style={{ margin: 0, color: '#64748b' }}>{act.lugar}</p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '20px',
                }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>👨‍🏫</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                    Monitores
                  </p>
                  <p style={{ margin: 0, color: '#64748b' }}>
                    {act.recogidaMonitores || 'Consultar'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>👪</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                    Familias
                  </p>
                  <p style={{ margin: 0, color: '#64748b' }}>
                    {act.recogidaFamilias || 'Consultar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (vista === 'panel') {
    return (
      <div
        style={{
          padding: '30px',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'sans-serif',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#1e293b' }}>
          {editandoId ? 'Editar Actividad' : 'Nueva Actividad'}
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <input
            placeholder="Nombre de la Actividad"
            value={nuevaAct.nombre}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, nombre: e.target.value })
            }
            style={estiloInput}
          />
          <select
            value={nuevaAct.etapa}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, etapa: e.target.value })
            }
            style={estiloInput}
          >
            <option>Infantil</option>
            <option>Primaria</option>
            <option>ESO</option>
          </select>
          <input
            placeholder="Días (ej: Lunes y Miércoles)"
            value={nuevaAct.dias}
            onChange={(e) => setNuevaAct({ ...nuevaAct, dias: e.target.value })}
            style={estiloInput}
          />
          <input
            placeholder="Horario (ej: 16:00 a 17:00)"
            value={nuevaAct.horario}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, horario: e.target.value })
            }
            style={estiloInput}
          />
          <input
            placeholder="Lugar o Aula"
            value={nuevaAct.lugar}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, lugar: e.target.value })
            }
            style={estiloInput}
          />
          <input
            placeholder="Precio mensual (ej: 34€)"
            value={nuevaAct.precio}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, precio: e.target.value })
            }
            style={estiloInput}
          />

          {/* 🔗 ENLACE DE INSCRIPCIÓN */}
          <div
            style={{
              backgroundColor: '#f5f3ff',
              padding: '15px',
              borderRadius: '15px',
              border: '2px dashed #7c3aed',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#5b21b6',
              }}
            >
              🔗 Enlace al formulario (Google Forms):
            </p>
            <input
              placeholder="Pega aquí el link del formulario"
              value={nuevaAct.enlace || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, enlace: e.target.value })
              }
              style={estiloInput}
            />
          </div>

          {/* 📁 FOTO */}
          <div
            style={{
              backgroundColor: '#fff7ed',
              padding: '15px',
              borderRadius: '15px',
              border: '2px dashed #f97316',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#9a3412',
              }}
            >
              🖼️ Foto de la actividad:
            </p>
            <input
              placeholder="Enlace de la foto"
              value={nuevaAct.imagen || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, imagen: e.target.value })
              }
              style={estiloInput}
            />
          </div>

          <textarea
            placeholder="Información para las familias..."
            value={nuevaAct.info}
            onChange={(e) => setNuevaAct({ ...nuevaAct, info: e.target.value })}
            style={{ ...estiloInput, height: '80px' }}
          />

          {/* 🎒 MATERIAL */}
          <div
            style={{
              backgroundColor: '#eff6ff',
              padding: '15px',
              borderRadius: '15px',
              border: '2px dashed #3b82f6',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#1e40af',
              }}
            >
              🎒 Material necesario:
            </p>
            <input
              placeholder="Ej: Raqueta..."
              value={nuevaAct.material || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, material: e.target.value })
              }
              style={estiloInput}
            />
          </div>

          {/* 🏢 EMPRESA */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              padding: '15px',
              borderRadius: '15px',
              border: '2px dashed #22c55e',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#166534',
              }}
            >
              🏢 Empresa y Contacto:
            </p>
            <input
              placeholder="Nombre empresa"
              value={nuevaAct.empresa || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, empresa: e.target.value })
              }
              style={estiloInput}
            />
            <input
              placeholder="Email contacto"
              value={nuevaAct.contacto || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, contacto: e.target.value })
              }
              style={estiloInput}
            />
          </div>

          <input
            placeholder="Punto de recogida Monitores"
            value={nuevaAct.recogidaMonitores}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, recogidaMonitores: e.target.value })
            }
            style={estiloInput}
          />
          <input
            placeholder="Punto de entrega a Familias"
            value={nuevaAct.recogidaFamilias}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, recogidaFamilias: e.target.value })
            }
            style={estiloInput}
          />

          {/* 📍 SECCIÓN DE COORDENADAS (POR FIN LIBRES Y FUERA DEL BOTÓN) */}
          <div
            style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '15px',
              border: '2px solid #3b82f6',
              display: 'grid',
              gap: '10px',
            }}
          >
            <p
              style={{
                margin: '0',
                fontWeight: 'bold',
                color: '#1e293b',
                fontSize: '0.9rem',
              }}
            >
              📍 Coordenadas exactas para el mapa:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <input
                placeholder="Lat. Actividad"
                value={nuevaAct.latAct || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, latAct: e.target.value })
                }
                style={estiloInput}
              />
              <input
                placeholder="Long. Actividad"
                value={nuevaAct.lngAct || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, lngAct: e.target.value })
                }
                style={estiloInput}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <input
                placeholder="Lat. Monitores"
                value={nuevaAct.latMon || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, latMon: e.target.value })
                }
                style={estiloInput}
              />
              <input
                placeholder="Long. Monitores"
                value={nuevaAct.lngMon || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, lngMon: e.target.value })
                }
                style={estiloInput}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <input
                placeholder="Lat. Familias"
                value={nuevaAct.latFam || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, latFam: e.target.value })
                }
                style={estiloInput}
              />
              <input
                placeholder="Long. Familias"
                value={nuevaAct.lngFam || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, lngFam: e.target.value })
                }
                style={estiloInput}
              />
            </div>
          </div>
          {/* 📸 FOTOS DE LOS PUNTOS */}
          <div
            style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: '#f0f9ff',
              borderRadius: '15px',
              border: '2px solid #0ea5e9',
              display: 'grid',
              gap: '10px',
            }}
          >
            <p
              style={{
                margin: '0',
                fontWeight: 'bold',
                color: '#0369a1',
                fontSize: '0.9rem',
              }}
            >
              📸 Fotos para los globos del mapa (URLs):
            </p>
            <input
              placeholder="URL Foto Actividad"
              value={nuevaAct.fotoAct || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, fotoAct: e.target.value })
              }
              style={estiloInput}
            />
            <input
              placeholder="URL Foto Monitores"
              value={nuevaAct.fotoMon || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, fotoMon: e.target.value })
              }
              style={estiloInput}
            />
            <input
              placeholder="URL Foto Familias"
              value={nuevaAct.fotoFam || ''}
              onChange={(e) =>
                setNuevaAct({ ...nuevaAct, fotoFam: e.target.value })
              }
              style={estiloInput}
            />
          </div>

          {/* 🚀 BOTÓN DE GUARDAR (FUERA DE TODO, SIN MOLESTAR) */}
          <button
            type="button"
            onClick={guardarActividad}
            style={{
              padding: '18px',
              backgroundColor: '#10ac84',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1.1rem',
              width: '100%',
              marginTop: '10px',
            }}
          >
            🚀 GUARDAR ACTIVIDAD
          </button>

          <button
            onClick={() => setVista('catalogo')}
            style={{
              padding: '10px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Volver sin guardar
          </button>
        </div>
      </div>
    );
  }
}

const estiloInput = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
};
