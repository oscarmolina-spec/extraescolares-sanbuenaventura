'use client';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  deleteDoc,
  updateDoc, // 👈 ¡Añade esta palabra mágica aquí!
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
// ⭐ ESTE ES EL NUEVO: Mapa para los Puntos de Interés Generales
const MapaPuntosInteres = dynamic(() => import('./MapaPuntosInteres'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Cargando mapa maestro...</p>
    </div>
  ),
});

export default function Page() {
  const [vista, setVista] = useState('catalogo');
  const [etapaActiva, setEtapaActiva] = useState('Infantil');
  const [actividades, setActividades] = useState([]);
  const [puntosInteres, setPuntosInteres] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  // Este es el estado que le dirá al mapa a dónde volar
const [destino, setDestino] = useState(null);
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
  const [clubes, setClubes] = useState([]); // Aquí guardaremos la lista que viene de la nube
  const [empresaActiva, setEmpresaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [nuevoClub, setNuevoClub] = useState({
  nombre: '',
  etapas: [],
  horario: '',
  descripcion: '',
  imagen: '',          // Aquí irá el logo
  contacto: '',        // Teléfono o Email
  linkInscripcion: '', // El enlace directo general
  latAct: '',          // Punto de interés (latitud)
  lngAct: '',          // Punto de interés (longitud)
  linksMultiples: []   // 🌟 ¡NUEVO! Aquí guardaremos la lista de cursos y enlaces
});
// 🚀 ¡AQUÍ LAS PEGAS! LAS TRES FUNCIONES NUEVAS:
  const agregarFilaLink = () => {
    setNuevoClub({
      ...nuevoClub,
      linksMultiples: [...(nuevoClub.linksMultiples || []), { etiqueta: '', url: '' }]
    });
  };

  const manejarCambioLink = (index, campo, valor) => {
    const nuevosLinks = [...(nuevoClub.linksMultiples || [])];
    nuevosLinks[index][campo] = valor;
    setNuevoClub({ ...nuevoClub, linksMultiples: nuevosLinks });
  };

  const eliminarFilaLink = (index) => {
    const nuevosLinks = (nuevoClub.linksMultiples || []).filter((_, i) => i !== index);
    setNuevoClub({ ...nuevoClub, linksMultiples: nuevosLinks });
  };
  // 🏰 El enlace mágico de tu escudo desde Storage
  const URL_ESCUDO =
    'https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/San%20%20uenaventura.png?alt=media&token=c70def71-3920-425e-9d68-a3519ed51960';

    const [nuevaAct, setNuevaAct] = useState({
      nombre: '',
      etapas: [], // 👈 ¡Ahora es una lista para marcar varias!
      dias: '',
      horario: '',
      lugar: '',
      info: '',
      imagen: '',
      recogidaMonitores: '',
      recogidaFamilias: '',
      precio: '',
      latAct: '40.407937755274425',
      lngAct: '-3.7469348757382366',
      fotoAct: '', 
      fotoMon: '', 
      fotoFam: '', 
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
    cargarPuntosInteres();
    cargarClubes();
  }, []);
  // 📍 Esta función es la que va a buscar las chinchetas del Mapa Maestro
  const cargarPuntosInteres = async () => {
    try {
      const q = query(collection(db, 'puntos_interes_cole'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPuntosInteres(docs); // Guardamos las chinchetas en su estado
      console.log("¡Chinchetas cargadas!", docs.length);
    } catch (e) {
      console.error('Error cargando puntos de interés:', e);
    }
  };

  const guardarActividad = async () => {
    if (!nuevaAct.nombre) return alert('¡Escribe el nombre de la actividad! 📝');
    
    if (!nuevaAct.etapas || nuevaAct.etapas.length === 0) {
      return alert('¡Debes elegir al menos una etapa para que aparezca en la web! 🚩');
    }

    // 🚀 Preparamos el paquete limpiando los enlaces antiguos y nuevos
    const actividadFinal = {
      ...nuevaAct,
      etapas: nuevaAct.etapas,
      // 🌟 EL TRUCO DE LA PISCINA: Aseguramos que la casilla principal guarde la web en los dos campos posibles
      enlace: nuevaAct.enlace || '',
      linkInscripcion: nuevaAct.enlace || '',
      // 🌟 Añadimos también los links múltiples por si acaso
      linksMultiples: nuevaAct.linksMultiples || [],
      latAct: parseFloat(nuevaAct.latAct) || 0,
      lngAct: parseFloat(nuevaAct.lngAct) || 0,
      latMon: parseFloat(nuevaAct.latMon) || 0,
      lngMon: parseFloat(nuevaAct.lngMon) || 0,
      latFam: parseFloat(nuevaAct.latFam) || 0,
      lngFam: parseFloat(nuevaAct.lngFam) || 0,
    };

    delete actividadFinal.etapa;

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'actividades_cole', editandoId), actividadFinal);
        alert('¡Actividad actualizada con éxito! 🔄');
      } else {
        await addDoc(collection(db, 'actividades_cole'), actividadFinal);
        alert('¡Publicado con éxito! ✨');
      }

      // ✨ LIMPIEZA TOTAL (¡Actualizada con los enlaces!)
      setNuevaAct({
        nombre: '',
        etapas: [],
        empresa: '',
        logoEmpresa: '',
        nombreContacto: '',
        contacto: '', // Este es el email
        dias: '',
        horario: '',
        lugar: '',
        info: '',
        imagen: '',
        enlace: '',           // 🧹 Limpiamos el enlace principal antiguo
        linksMultiples: [],   // 🧹 Limpiamos la nueva lista de enlaces múltiples
        recogidaMonitores: '',
        recogidaFamilias: '',
        precio: '',
        latAct: '40.407937755274425',
        lngAct: '-3.7469348757382366',
        latMon: '',
        lngMon: '',
        latFam: '',
        lngFam: '',
        fotoAct: '',
        fotoMon: '',
        fotoFam: '',
      });

      setEditandoId(null);
      setVista('catalogo');
      cargarActividades();
    } catch (e) {
      console.error('Error al guardar:', e);
      alert('Vaya, parece que ha habido un error al conectar con la nube.');
    }
  };

  // 🚀 El "brazo robótico" para guardar Clubes Amigos (¡También actualizado!)
  const guardarClub = async () => {
    if (!nuevoClub.nombre) return alert('¡Escribe el nombre del club! 🥋');
    if (nuevoClub.etapas.length === 0) return alert('¡Marca al menos una etapa! 🏁');

    try {
      // 🚀 Preparamos el paquete como siempre
      const clubFinal = {
        nombre: nuevoClub.nombre,
        etapas: nuevoClub.etapas,
        horario: nuevoClub.horario || '',
        descripcion: nuevoClub.descripcion || '',
        imagen: nuevoClub.imagen || '',
        contacto: nuevoClub.contacto || '',
        linkInscripcion: nuevoClub.linkInscripcion || '',
        linksMultiples: nuevoClub.linksMultiples || [], // 🌟 ¡NUEVO! Añadimos esto para la nube de los clubes
        latAct: parseFloat(nuevoClub.latAct) || 0,
        lngAct: parseFloat(nuevoClub.lngAct) || 0
      };

      // ✨ ¡AQUÍ ESTÁ EL TRUCO!
      if (editandoId) {
        // ✏️ SI HAY UN ID: Usamos updateDoc para sobrescribir el viejo
        await updateDoc(doc(db, 'clubes_cole', editandoId), clubFinal);
        alert('¡Club Amigo actualizado! ✨');
      } else {
        // 🆕 SI NO HAY ID: Usamos addDoc para crear uno nuevo
        await addDoc(collection(db, 'clubes_cole'), clubFinal);
        alert('¡Club Amigo guardado con éxito! 🌟');
      }

      // 🧹 Limpiamos el cajón y reseteamos el ID de edición
      setNuevoClub({
        nombre: '', etapas: [], horario: '', descripcion: '',
        imagen: '', contacto: '', linkInscripcion: '', latAct: '', lngAct: '',
        linksMultiples: [] // 🌟 ¡NUEVO! También limpiamos la lista de los clubes al terminar
      });
      setEditandoId(null); // 👈 ¡Súper importante para que el siguiente no sea una edición!
      
      setVista('catalogo');
      if (typeof cargarClubes === 'function') cargarClubes();

    } catch (e) {
      console.error('Error al guardar/actualizar:', e);
      alert('¡Uy! Ha fallado el envío a la nube.');
    }
  };
  const cargarClubes = async () => {
    try {
      const q = query(collection(db, 'clubes_cole'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClubes(docs); // Esto llena la lista de clubes
      console.log("¡Clubes bajados de la nube!", docs.length);
    } catch (e) {
      console.error('Error cargando los clubes:', e);
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
    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    padding: '20px 20px 25px', // 👈 Reducimos aire arriba y abajo del header
    textAlign: 'center',
    borderRadius: '0 0 50px 50px',
    boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
  }}
>
  {/* 🕹️ BOTONES SUPERIORES (MAPA Y ADMIN) */}
  <div style={{
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    gap: '10px',
    zIndex: 100,
  }}>
    <button
      onClick={() => setVista('mapa')}
      style={{
        padding: '8px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        backdropFilter: 'blur(4px)',
      }}
    >
      📍 Mapa Cole
    </button>

    {!isAdmin ? (
      <button
        onClick={() => {
          const p = prompt('Clave:');
          if (p === 'admin') setIsAdmin(true);
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 'bold',
        }}
      >
        🔑 Admin
      </button>
    ) : (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setVista('panel')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10ac84',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
          }}
        >
          ➕ Añadir
        </button>
        <button
          onClick={() => setIsAdmin(false)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Salir
        </button>
      </div>
    )}
  </div>

  {/* Brillo decorativo */}
  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

  {/* ⭐ CONTENEDOR DEL ESCUDO REDUCIDO EN ESPACIOS */}
  <div style={{ 
    position: 'relative', 
    display: 'block', 
    margin: '-10px auto 0px', // 👈 ¡CLAVE! Quitamos los 50px de abajo y subimos 10px arriba
    width: 'fit-content', 
    padding: '0px' // 👈 Quitamos el padding de 20px que separaba todo
  }}>
    
    <img
      src="https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/colegio%20buena%20-%20Editada.png?alt=media&token=d30127c6-037e-47c5-a7e0-29d7cd5585fd"
      style={{
        width: '400px',
        height: 'auto',
        position: 'relative',
        zIndex: 1,
        filter: `drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(0 25px 35px rgba(0, 0, 0, 0.5))`
      }}
    />
  </div>

  {/* 🏆 TÍTULO SIMPLIFICADO Y CON ESPACIO */}
  <h1 style={{ 
    margin: '10px 0 0', // 👈 Un poco de margen arriba para que no choque con el escudo
    fontSize: '2.5rem', 
    fontWeight: '800', 
    color: '#ffffff', 
    letterSpacing: '-1px', 
    position: 'relative', 
    zIndex: 2 
  }}>
    Actividades Extraescolares
  </h1>

  <p style={{ 
    color: '#94a3b8', 
    marginTop: '8px', 
    fontSize: '0.95rem', 
    fontWeight: '500', 
    letterSpacing: '0.5px',
    fontStyle: 'italic'
  }}>
    "Estas actividades tienen carácter voluntario, no discriminatorio y no lucrativo"
  </p>
  {/* --- 🚀 AQUÍ PEGAS EL PASO 2 (EL BUSCADOR) --- */}
  <div style={{ maxWidth: '400px', margin: '20px auto', padding: '0 20px' }}>
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
      <input
        type="text"
        placeholder="Busca una actividad..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 15px 12px 45px',
          borderRadius: '15px',
          border: '2px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: 'white',
          fontSize: '1rem',
          outline: 'none'
        }}
      />
    </div>
  </div>

  {/* Selector de etapas (Más pegado arriba) */}
  <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
    {['Infantil', 'Primaria', 'ESO','Clubes Amigos'].map((e) => (
      <button key={e} onClick={() => setEtapaActiva(e)} style={{ padding: '12px 25px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', backgroundColor: etapaActiva === e ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '800', fontSize: '0.95rem', transition: 'all 0.3s ease' }}>
        {e}
      </button>
    ))}
  </div>

  {/* Selector de empresas (Más pegado arriba) */}
  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
    {['Todas', 'Alventus', '4life', 'Kids&Us', 'San Buenaventura'].map((emp) => (
      <button key={emp} onClick={() => setEmpresaActiva(emp)} style={{ padding: '6px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', backgroundColor: empresaActiva === emp ? '#60a5fa' : 'transparent', color: 'white', fontWeight: '600', fontSize: '0.8rem' }}>
        {emp}
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
          {/* 🌟 AQUÍ EMPIEZA LA MAGIA: JUNTAMOS TODO */}
        {(() => {
          // Juntamos todo en una sola lista para filtrar
          const todoJunto = [
            ...actividades.map(a => ({ ...a, esClub: false })),
            ...clubes.map(c => ({ ...c, esClub: true }))
          ];

// 🔍 FILTRO ULTRA-RESISTENTE (¡Ahora sin miedo a las tildes!)
const itemsFiltrados = todoJunto.filter((item) => {
  
  // FUNCIÓN MÁGICA: Quita tildes y pone en minúsculas
  const normalizar = (texto) => 
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // 0. REGLA DEL BUSCADOR (Limpia tildes en ambos lados)
  const nombreActividad = normalizar(item.nombre || "");
  const loQueEscribeLaFamilia = normalizar(busqueda);

  if (!nombreActividad.includes(loQueEscribeLaFamilia)) return false;

  // 1. Limpiamos las palabras para que no haya fallos de espacios o mayúsculas
  const etapaBoton = etapaActiva.trim().toLowerCase();
  const empresaBoton = empresaActiva.trim().toLowerCase();

  // 2. REGLA DE EMPRESA
  const empresaActividad = (item.empresa || "").trim().toLowerCase();
  const cumpleEmpresa = 
    empresaBoton === 'todas' || 
    empresaActividad === empresaBoton ||
    (empresaBoton === 'san buenaventura' && empresaActividad === 'colegio san buenaventura');

  if (!cumpleEmpresa) return false;

  // 3. REGLA DE CLUBES
  const esClub = item.etapas && item.etapas.includes('Clubes Amigos');
  if (etapaBoton === 'clubes amigos') return esClub;
  if (esClub) return false;

  // 4. REGLA DE ETAPAS (Primaria, ESO, Infantil...)
  // Miramos en 'etapa' y en la lista 'etapas'
  const etapaSimple = (item.etapa || "").trim().toLowerCase();
  const enListaEtapas = Array.isArray(item.etapas) && 
                        item.etapas.some(e => e.trim().toLowerCase() === etapaBoton);

  return etapaSimple === etapaBoton || enListaEtapas;
});

          return (
            <>
              {/* 🚩 Mensaje si no hay nada que enseñar */}
              {itemsFiltrados.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '20px' }}>
                  <p>No hay actividades de <strong>{empresaActiva === 'Todas' ? '' : empresaActiva}</strong> en <strong>{etapaActiva}</strong> todavía.</p>
                  {isAdmin && <p style={{ color: '#ff6b6b' }}>¡Usa el panel de admin para añadir una!</p>}
                </div>
              )}

              {/* 🎨 Dibujamos las tarjetas (sirve para los dos tipos: Cole y Clubes) */}
              {itemsFiltrados.map((item) => (

  <div
    key={item.id} 
    style={{
      backgroundColor: 'white',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s ease',
    }}
  >
    {/* 🖼️ IMAGEN / LOGO */}
    <div style={{ position: 'relative' }}>
      <img
        src={item.imagen || item.foto || 'https://via.placeholder.com/400x200?text=San+Buenaventura'}
        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Imagen+No+Disponible'; }}
      />
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        backgroundColor: item.esClub ? '#d946ef' : 'rgba(255, 255, 255, 0.9)',
        padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '800',
        color: item.esClub ? 'white' : '#1e293b',
        backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {/* Mostramos "CLUB" o la primera etapa que tenga la lista */}
        {item.esClub ? '🌟 CLUB AMIGO' : (item.etapas && item.etapas[0]) || item.etapa}
      </div>
    </div>

{/* 📝 CONTENIDO */}
<div style={{ padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
  <h3 style={{ margin: '0 0 5px', fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
    {item.nombre}
  </h3>
  
  {/* ⏰ HORARIO */}
  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 8px' }}>
    ⏰ {item.horario || 'Horario a consultar'}
  </p>

  {/* 🗓️ DÍAS DE LA SEMANA */}
  <div style={{ 
    backgroundColor: '#eff6ff', 
    color: '#1e40af', 
    fontSize: '0.8rem', 
    fontWeight: '800', 
    padding: '6px 12px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    alignSelf: 'flex-start',
    border: '1px solid #dbeafe',
    marginBottom: '15px'
  }}>
    <span>🗓️</span>
    <span>{item.dias ? item.dias.toUpperCase() : 'DÍAS A CONSULTAR'}</span>
  </div>

  <div style={{ marginTop: 'auto' }}>
    {/* 💰 PRECIO DESTACADO (Lo añadimos aquí antes del botón) */}
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'baseline', 
      marginBottom: '12px',
      padding: '0 5px'
    }}>
      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>PRECIO:</span>
      <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#3b82f6' }}>
        {item.precio ? `${item.precio}€` : '---'}
        <small style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: '3px' }}>/mes</small>
      </span>
    </div>

    <button
      onClick={() => {
        setActividadSeleccionada(item);
        setVista('detalles');
      }}
      style={{
        width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
        backgroundColor: '#f1f5f9', color: '#1e293b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px',
      }}
    >
          Ver información completa
        </button>

        {/* 🔗 SECCIÓN DE INSCRIPCIÓN INTELIGENTE CON DESPLEGABLE */}
<div style={{ marginTop: 'auto', width: '100%', paddingTop: '10px' }}>
  
  {item.linksMultiples && item.linksMultiples.length > 0 ? (
    // 🌟 SI TIENE VARIOS ENLACES: Mostramos el desplegable de categorías
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      <select
        id={`select-${item.id}`}
        defaultValue=""
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '12px',
          border: '2px solid #cbd5e1',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          outline: 'none',
          cursor: 'pointer'
        }}
        onChange={(e) => {
          // Guardamos temporalmente la URL elegida en el propio botón de abajo
          const botonIr = document.getElementById(`btn-ir-${item.id}`);
          if (botonIr) {
            botonIr.href = e.target.value;
            botonIr.style.opacity = e.target.value ? '1' : '0.5';
            botonIr.style.pointerEvents = e.target.value ? 'auto' : 'none';
          }
        }}
      >
        <option value="" disabled>👇 Selecciona tu categoría / curso</option>
        {item.linksMultiples.map((link, index) => (
          <option key={index} value={link.url}>
            {link.etiqueta}
          </option>
        ))}
      </select>

      {/* Botón de acción que se activa al elegir curso */}
      <a
        id={`btn-ir-${item.id}`}
        href=""
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'block', 
          padding: '11px', 
          backgroundColor: item.esClub ? '#d946ef' : '#ff6b6b',
          color: 'white', 
          borderRadius: '12px', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          fontSize: '0.9rem', 
          textAlign: 'center', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          opacity: '0.5',          // Empieza semi-transparente hasta elegir curso
          pointerEvents: 'none',   // Bloqueado hasta elegir curso
          transition: 'all 0.2s ease'
        }}
      >
        📝 ¡INSCRIBIRSE AHORA!
      </a>
    </div>

  ) : (
    // 🔄 SI NO TIENE ENLACES MÚLTIPLES: Tu botón clásico directo de siempre
(item.linkInscripcion || item.enlace) && (
  <a
    // 🌟 Cambiamos el orden aquí para que lea primero el link de inscripción actualizado
    href={item.linkInscripcion ? item.linkInscripcion : item.enlace}
    target="_blank" 
    rel="noopener noreferrer"
    style={{
      display: 'block', 
      padding: '12px', 
      backgroundColor: item.esClub ? '#d946ef' : '#ff6b6b',
      color: 'white', 
      borderRadius: '12px', 
      textDecoration: 'none', 
      fontWeight: 'bold',
      fontSize: '0.9rem', 
      textAlign: 'center', 
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    }}
  >
    📝 ¡INSCRIBIRSE AHORA!
  </a>
)
  )}

</div>

{/* BOTONES DE ADMIN */}
{isAdmin && (
  <div style={{ display: 'flex', gap: '8px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dotted #e2e8f0' }}>
    
   {/* ✏️ BOTÓN DE EDITAR COMPLETO Y BLINDADO */}
<button
  onClick={() => {
    // 📝 Cargamos TODO en el formulario único (setNuevaAct)
    setNuevaAct({
      ...item, // Mantenemos todo lo que ya traía el objeto
      nombre: item.nombre || '',
      etapas: item.etapas || [], // Casillas de verificación (Cole/Clubes)
      horario: item.horario || '',
      dias: item.dias || '',
      lugar: item.lugar || '',
      info: item.info || item.descripcion || '',
      imagen: item.imagen || '',
      precio: item.precio || '',
      
      // --- 🏢 Datos de empresa y contacto ---
      empresa: item.empresa || '',
      logoEmpresa: item.logoEmpresa || '',
      nombreContacto: item.nombreContacto || '',
      contacto: item.contacto || '', // Email de contacto
      
      // --- 📍 Coordenadas (Convertidas a NÚMERO para que el mapa no de error) ---
      latAct: item.latAct ? Number(item.latAct) : 40.407937755274425,
      lngAct: item.lngAct ? Number(item.lngAct) : -3.7469348757382366,
      latMon: item.latMon ? Number(item.latMon) : '',
      lngMon: item.lngMon ? Number(item.lngMon) : '',
      latFam: item.latFam ? Number(item.latFam) : '',
      lngFam: item.lngFam ? Number(item.lngFam) : '',
      
      // --- 📸 Fotos de los puntos de encuentro ---
      fotoAct: item.fotoAct || '',
      fotoMon: item.fotoMon || '',
      fotoFam: item.fotoFam || '',
      
      // --- 🚩 Textos de recogida y enlaces ---
      recogidaMonitores: item.recogidaMonitores || '',
      recogidaFamilias: item.recogidaFamilias || '',
      linkInscripcion: item.linkInscripcion || item.enlace || ''
    });

    setEditandoId(item.id); // Guardamos el ID para saber cuál actualizar al guardar
    setVista('panel');      // ¡Directos al panel con todo relleno!
  }}
  /* ✨ TU FORMATO ORIGINAL RECUPERADO ✨ */
  style={{ 
    flex: 1, 
    padding: '8px', 
    backgroundColor: '#fef3c7', // Amarillo suave de edición
    color: '#92400e',           // Marrón oscuro para el texto
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '0.8rem', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }}
>
  EDITAR
</button>

    {/* Y aquí debajo se queda tu botón de borrar como estaba */}
    <button
      onClick={async () => {
        if (confirm('¿Quieres borrar esto?')) {
          const coleccion = item.esClub ? 'clubes_cole' : 'actividades_cole';
          await deleteDoc(doc(db, coleccion, item.id));
          item.esClub ? cargarClubes() : cargarActividades();
        }
      }}
      style={{ flex: 1, padding: '8px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
    >
      BORRAR
    </button>
  </div>
)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          );
        })()}
        </main>
        {/* 🛡️ FOOTER ULTRA-ESTRECHO Y MINIMALISTA */}
        <footer style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '15px 20px',      // ↕️ ¡Súper estrecho! Solo 15px de aire
          marginTop: '40px',         // Menos separación con lo de arriba
          borderTop: '2px solid #3b82f6', // Línea más fina
          borderRadius: '20px 20px 0 0'    // Curva más suave
        }}>
          <div style={{ 
            maxWidth: '900px', 
            margin: '0 auto', 
            display: 'flex',         // ↔️ Usamos flex para que todo vaya en una línea
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',        // Por si en el móvil no cabe
            gap: '20px' 
          }}>
            
            {/* Logo y Nombre (Todo en uno para ahorrar espacio) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/colegio%20buena%20-%20Editada.png?alt=media&token=d30127c6-037e-47c5-a7e0-29d7cd5585fd" 
                style={{ 
                  width: '100px',      // 🛡️ Logo pequeñito
                  filter: 'brightness(0) invert(1)', 
                  opacity: '0.8' 
                }} 
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Colegio San Buenaventura, Madrid</span>
            </div>

            {/* Contacto rápido */}
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              📞 915 267 161  |  📧 extraescolares@sanbuenaventura.org
            </div>

            {/* Copyright pequeñito */}
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              © {new Date().getFullYear()} Extraescolares
            </div>

          </div>
        </footer>
</div>
);
}

// 🚩 ESTA ES LA "HABITACIÓN" DEL MAPA QUE FALTABA
if (vista === 'mapa') {
return (
<div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
<div style={{ 
  padding: '15px 20px', 
  backgroundColor: 'white', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
  zIndex: 1000 
}}>
  <button 
    onClick={() => setVista('catalogo')}
    style={{ 
      padding: '10px 20px', borderRadius: '12px', border: 'none', 
      backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' 
    }}
  >
    ← Volver al Inicio
  </button>
  <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>📍 Puntos Clave del Colegio</h2>
  <div style={{ width: '85px' }}></div>
</div>

<div style={{ flex: 1 }}>
  {/* Aquí cargamos tu componente pro con el mapa de satélite */}
  <MapaPuntosInteres puntos={puntosInteres} />
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
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div>
                {/* 🏷️ AQUÍ ESTÁN TODAS LAS ETAPAS JUNTAS */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {act.etapas && Array.isArray(act.etapas) ? (
                    act.etapas.map((et) => (
                      <span
                        key={et}
                        style={{
                          backgroundColor: et === 'Clubes Amigos' ? '#d946ef' : '#dbeafe',
                          color: et === 'Clubes Amigos' ? 'white' : '#1e40af',
                          padding: '6px 16px',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        {et === 'Clubes Amigos' ? '🌟 CLUB AMIGO' : et}
                      </span>
                    ))
                  ) : (
                    // Por si es una de las antiguas que no tenía lista de etapas
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
                  )}
                </div>

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

              {/* 💰 EL PRECIO A LA DERECHA */}
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
                    whiteSpace: 'pre-wrap', // 👈 ¡Esto permite los saltos de línea!
                    lineHeight: '1.4'       // Un poquito de espacio entre líneas para que se lea mejor
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
            <h4 style={{ color: '#1e293b', marginBottom: '10px' }}>
                Sobre la actividad
              </h4>
              <p
                style={{
                  color: '#475569',
                  lineHeight: '1.8',
                  fontSize: '1.05rem',
                  whiteSpace: 'pre-wrap', // 👈 ¡ESTA ES LA CLAVE! 
                  wordBreak: 'break-word' // Para que las palabras largas no se salgan
                }}
              >
                {act.info || item.descripcion} 
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
                destinoVuelo={destino}
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
              {/* 1. LUGAR (Vuela a la actividad) */}
              <div
                onClick={() => setDestino([act.latAct, act.lngAct])}
                style={{ display: 'flex', gap: '15px', marginBottom: '20px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>📍</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                    Lugar (Ver en mapa)
                  </p>
                  <p style={{ margin: 0, color: '#64748b' }}>{act.lugar}</p>
                </div>
              </div>

              {/* 2. MONITORES (Vuela al punto de monitores) */}
              <div
                onClick={() => setDestino([act.latMon, act.lngMon])}
                style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '20px',
                  cursor: 'pointer', // 👈 ¡Ahora es un botón mágico!
                  transition: 'transform 0.1s active'
                }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>👨‍🏫</div>
<div>
  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
    Monitores (Toca para ubicar 📍)
  </p>
  <p 
    style={{ 
      margin: 0, 
      color: '#64748b',
      // ✨ ¡ESTO ES LO QUE FALTA! ✨
      whiteSpace: 'pre-wrap', 
      lineHeight: '1.4' 
    }}
  >
    {act.recogidaMonitores || 'Consultar'}
  </p>
</div>
              </div>

              {/* 3. FAMILIAS (Vuela al punto de familias) */}
              <div 
                onClick={() => setDestino([act.latFam, act.lngFam])}
                style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '15px' 
                }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '35px' }}>👪</div>
                <div>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                    Familias (Toca para ubicar 📍)
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
  // 📍 NUEVA VISTA: MAPA DE PUNTOS DE INTERÉS
  if (vista === 'mapa') {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#0f172a' // Un fondo oscuro para que la carga sea suave
      }}>
        
        {/* 🔝 Barra superior elegante */}
        <div style={{ 
          padding: '15px 20px', 
          backgroundColor: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          zIndex: 1000 
        }}>
          <button 
            onClick={() => setVista('catalogo')}
            style={{ 
              padding: '10px 18px', 
              borderRadius: '12px', 
              border: 'none', 
              backgroundColor: '#3b82f6', 
              color: 'white',
              fontWeight: '800', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            ← Volver al Inicio
          </button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
            📍 Puntos Clave del Cole
          </h2>
          <div style={{ width: '100px' }}></div> 
        </div>

        {/* 🗺️ Tu nuevo Mapa de Puntos de Interés */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Aquí llamamos al componente que creamos antes */}
          <MapaPuntosInteres puntos={puntosInteres} />
        </div>
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
          {/* 📝 NOMBRE */}
          <input
            placeholder="Nombre de la Actividad"
            value={nuevaAct.nombre}
            onChange={(e) =>
              setNuevaAct({ ...nuevaAct, nombre: e.target.value })
            }
            style={estiloInput}
          />

          {/* 🏁 NUEVO SELECTOR MULTI-ETAPA (Sustituye al viejo <select>) */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '15px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            marginTop: '5px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>
              ¿DÓNDE DEBE APARECER? (MARCA VARIAS SI QUIERES)
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Infantil', 'Primaria', 'ESO', 'Adultos', 'Clubes Amigos'].map((et) => (
                <label 
                key={et} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer', 
                  padding: '8px 12px',
                  borderRadius: '10px',
                  // 🛡️ ESCUDO: Si 'nuevaAct.etapas' no existe, usamos el color gris claro (#f1f5f9)
                  backgroundColor: (nuevaAct.etapas && nuevaAct.etapas.includes(et)) ? '#3b82f6' : '#f1f5f9',
                  
                  // 🛡️ ESCUDO: Lo mismo para el color del texto
                  color: (nuevaAct.etapas && nuevaAct.etapas.includes(et)) ? 'white' : '#475569',
                  
                  transition: 'all 0.2s ease',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: '1px solid',
                  
                  // 🛡️ ESCUDO: Y para el borde
                  borderColor: (nuevaAct.etapas && nuevaAct.etapas.includes(et)) ? '#2563eb' : '#e2e8f0'
                }}
              >
                <input
                  type="checkbox"
                  style={{ cursor: 'pointer' }}
                  // 🛡️ ESCUDO: Aquí también para que el check no falle
                  checked={nuevaAct.etapas ? nuevaAct.etapas.includes(et) : false}
                  onChange={(e) => {
                    // 📝 Creamos una lista segura (si es undefined, usamos [])
                    const listaActual = nuevaAct.etapas || [];
                    const listaNueva = e.target.checked
                      ? [...listaActual, et]
                      : listaActual.filter((x) => x !== et);
                    setNuevaAct({ ...nuevaAct, etapas: listaNueva });
                  }}
                />
                {et}
              </label>
              ))}
            </div>
          </div>

          {/* 📅 Días - Ahora puedes poner uno debajo de otro */}
          <textarea
            placeholder="Días (ej: 
Lunes
Miércoles)"
            value={nuevaAct.dias}
            onChange={(e) => setNuevaAct({ ...nuevaAct, dias: e.target.value })}
            style={{ ...estiloInput, height: '80px', paddingTop: '10px' }}
          />

          {/* ⏰ Horario - También con espacio por si hay varios turnos */}
          <textarea
            placeholder="Horario (ej: 16:00 a 17:00)"
            value={nuevaAct.horario}
            onChange={(e) => setNuevaAct({ ...nuevaAct, horario: e.target.value })}
            style={{ ...estiloInput, height: '60px', paddingTop: '10px' }}
          />

          {/* 📍 Lugar - Para explicar bien dónde está el aula */}
          <textarea
            placeholder="Lugar o Aula"
            value={nuevaAct.lugar}
            onChange={(e) => setNuevaAct({ ...nuevaAct, lugar: e.target.value })}
            style={{ ...estiloInput, height: '60px', paddingTop: '10px' }}
          />

          {/* 💰 El Precio lo dejamos como input porque suele ser cortito */}
          <input
            placeholder="Precio mensual (ej: 34€)"
            value={nuevaAct.precio}
            onChange={(e) => setNuevaAct({ ...nuevaAct, precio: e.target.value })}
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

          {/* 🔗 SECCIÓN DE ENLACES MÚLTIPLES POR CATEGORÍA / CURSO */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '15px', 
            borderRadius: '15px', 
            border: '1px dashed #cbd5e1',
            textAlign: 'left'
          }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem', color: '#1e293b' }}>
              🔗 Enlaces por Categoría / Curso (Opcional)
            </label>
            
            {/* Dibujamos cada fila de enlace */}
            {(nuevaAct.linksMultiples || []).map((link, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Ej: Prebenjamín (1º/2º)"
                  value={link.etiqueta}
                  onChange={(e) => {
                    const nuevosLinks = [...(nuevaAct.linksMultiples || [])];
                    nuevosLinks[index].etiqueta = e.target.value;
                    setNuevaAct({ ...nuevaAct, linksMultiples: nuevosLinks });
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b' }}
                />
                <input
                  type="text"
                  placeholder="https://enlace-formulario.com"
                  value={link.url}
                  onChange={(e) => {
                    const nuevosLinks = [...(nuevaAct.linksMultiples || [])];
                    nuevosLinks[index].url = e.target.value;
                    setNuevaAct({ ...nuevaAct, linksMultiples: nuevosLinks });
                  }}
                  style={{ flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const nuevosLinks = (nuevaAct.linksMultiples || []).filter((_, i) => i !== index);
                    setNuevaAct({ ...nuevaAct, linksMultiples: nuevosLinks });
                  }}
                  style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setNuevaAct({
                  ...nuevaAct,
                  linksMultiples: [...(nuevaAct.linksMultiples || []), { etiqueta: '', url: '' }]
                });
              }}
              style={{
                marginTop: '5px', padding: '8px 12px', backgroundColor: '#e0f2fe', color: '#0369a1',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              ➕ Añadir otra categoría/enlace
            </button>
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
            {/* 📸 ¡NUEVO!: Enlace para el logo de la empresa */}
            <input
                placeholder="URL del Logo de la empresa (Ej: https://...)"
                value={nuevaAct.logoEmpresa || ''}
                onChange={(e) =>
                  setNuevaAct({ ...nuevaAct, logoEmpresa: e.target.value })
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

          {/* 🙋‍♂️ Recogida Monitores - Con espacio para explicarse bien */}
          <textarea
  placeholder="Punto de recogida Monitores (ej: 
- Puerta principal
- Patio cubierto)"
  value={nuevaAct.recogidaMonitores}
  onChange={(e) => setNuevaAct({ ...nuevaAct, recogidaMonitores: e.target.value })}
  style={{
    ...estiloInput,
    height: '100px',
    padding: '12px',
    lineHeight: '1.5',    // ↔️ Espacio justo entre líneas
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap' // 👈 Para que tú veas los saltos mientras escribes
  }}
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
            type="button"
            onClick={() => setVista('catalogo')}
            style={{
              padding: '10px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              width: '100%'
            }}
            
          >
            Volver sin guardar
          </button>

        </div> {/* 👈 AQUÍ CERRAMOS EL GRID DE LA ACTIVIDAD */}

        {/* 📍 AHORA EL MAPA ESTÁ FUERA, EN SU PROPIA ISLA AZUL */}
        <div style={{ 
          marginTop: '40px', 
          padding: '25px', 
          backgroundColor: '#eff6ff', 
          borderRadius: '20px',
          border: '2px dashed #3b82f6' 
        }}>
          <h3 style={{ color: '#1e293b', margin: '0 0 10px', textAlign: 'center' }}>📍 Gestionar Mapa Maestro</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
            (Estos puntos son independientes de las actividades)
          </p>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              placeholder="Nombre del sitio (Ej: Secretaría)"
              style={estiloInput}
              id="nuevoPuntoNombre"
            />
            <input
              placeholder="Breve descripción"
              style={estiloInput}
              id="nuevoPuntoDesc"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Latitud" style={estiloInput} id="nuevoPuntoLat" />
              <input placeholder="Longitud" style={estiloInput} id="nuevoPuntoLng" />
            </div>
            <input
              placeholder="URL de la foto del lugar"
              style={estiloInput}
              id="nuevoPuntoFoto"
            />
            
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation(); // 🛡️ ¡Súper escudo! Evita que el clic suba a la actividad
                
                const nombre = document.getElementById('nuevoPuntoNombre').value;
                const desc = document.getElementById('nuevoPuntoDesc').value;
                const lat = document.getElementById('nuevoPuntoLat').value;
                const lng = document.getElementById('nuevoPuntoLng').value;
                const foto = document.getElementById('nuevoPuntoFoto').value;

                if(!nombre || !lat || !lng) return alert('¡Oye! Faltan datos (Nombre, Lat y Lng)');

                try {
                    await addDoc(collection(db, 'puntos_interes_cole'), {
                      nombre,
                      descripcion: desc,
                      lat: parseFloat(lat),
                      lng: parseFloat(lng),
                      foto: foto || '',
                      color: 'red'
                    });
                    
                    alert('¡Chincheta guardada con éxito! 📍');
                    cargarPuntosInteres();
                    
                    // ✨ ¡ESTA ES LA LÍNEA MÁGICA! 
                    // Te saca del panel y te lleva al catálogo automáticamente
                    setVista('catalogo'); 
                    
                    // Limpiar los campos (por si acaso vuelves luego)
                    document.getElementById('nuevoPuntoNombre').value = '';
                    document.getElementById('nuevoPuntoDesc').value = '';
                    document.getElementById('nuevoPuntoLat').value = '';
                    document.getElementById('nuevoPuntoLng').value = '';
                    document.getElementById('nuevoPuntoFoto').value = '';
                    
                    if (typeof cargarPuntosInteres === 'function') cargarPuntosInteres();
                  } catch (error) {
                    console.error("Error al guardar punto:", error);
                    alert("¡Vaya! Algo ha fallado al guardar");
                  }
              }}
              style={{
                padding: '15px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              🚀 GUARDAR SOLO LA CHINCHETA
            </button>
            {/* 🗑️ LISTA PARA BORRAR PUNTOS (Pégalo justo aquí) */}
            <div style={{ 
              marginTop: '25px', 
              paddingTop: '20px', 
              borderTop: '1px solid #cbd5e1' 
            }}>
              <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '10px' }}>
                🗑️ Tus puntos actuales (Toca para borrar):
              </p>
              
              <div style={{ display: 'grid', gap: '8px' }}>
                {puntosInteres.map((p) => (
                  <div key={p.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: 'white',
                    padding: '10px 15px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#334155' }}>📍 {p.nombre}</span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (confirm(`¿Quieres borrar "${p.nombre}"?`)) {
                          try {
                            const { deleteDoc, doc } = await import('firebase/firestore');
                            await deleteDoc(doc(db, 'puntos_interes_cole', p.id));
                            alert('¡Punto borrado! ✨');
                            cargarPuntosInteres(); // Esto hace que la lista se actualice sola
                          } catch (error) {
                            alert('No se pudo borrar');
                          }
                        }
                      }}
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    >
                      ELIMINAR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div> // 👈 CIERRA EL CONTENEDOR BLANCO DEL PANEL
    );
  }
  
} // 👈 CIERRA LA FUNCIÓN PAGE


const estiloInput = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
};
