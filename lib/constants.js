export const SCHOOL_CENTER = [40.407937755274425, -3.7469348757382366];

export const SCHOOL_INFO = {
  name: 'Colegio San Buenaventura',
  shortName: 'CSB Madrid',
  address: 'Calle de El Greco, 16 · 28011 Madrid',
  phone: '915 267 161',
  phoneHref: 'tel:915267161',
  email: 'extraescolares@sanbuenaventura.org',
  poolEmail: 'extraescolarespiscina@sanbuenaventura.org',
  poolUrl: 'https://piscina-csb.vercel.app/',
  crestUrl: '/escudo.png',
  crestStorageUrl:
    'https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/colegio%20buena%20-%20Editada.png?alt=media&token=d30127c6-037e-47c5-a7e0-29d7cd5585fd',
  whiteLogoUrl:
    'https://firebasestorage.googleapis.com/v0/b/extraescolarescsb.firebasestorage.app/o/logo%20BLANCO.png?alt=media&token=753d085f-d9d1-4b78-9d54-26e88578c35b',
  legalNotice:
    'Estas actividades tienen carácter voluntario, no discriminatorio y no lucrativo.',
};

export const STAGES = [
  {
    id: 'Infantil',
    title: 'Educación Infantil',
    short: 'Infantil',
    accent: '#15803d',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
    defaultImage:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=80',
    description:
      'Iniciación deportiva, psicomotricidad, idiomas y creatividad adaptadas a los primeros cursos.',
  },
  {
    id: 'Primaria',
    title: 'Educación Primaria',
    short: 'Primaria',
    accent: '#155f9e',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dotClass: 'bg-[#155f9e]',
    defaultImage:
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=700&q=80',
    description:
      'Oferta completa en deportes, idiomas, expresión artística y talleres tecnológicos.',
  },
  {
    id: 'ESO',
    title: 'Secundaria y Bachillerato',
    short: 'ESO y Bach.',
    accent: '#c2410c',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-600',
    defaultImage:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80',
    description:
      'Deporte escolar, refuerzo lingüístico, oratoria y habilidades tecnológicas avanzadas.',
  },
  {
    id: 'Adultos',
    title: 'Actividades para Adultos',
    short: 'Adultos',
    accent: '#6d28d9',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    dotClass: 'bg-violet-600',
    defaultImage:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=700&q=80',
    description:
      'Espacios de bienestar físico, salud y práctica deportiva para familias y personal del centro.',
  },
  {
    id: 'Clubes Amigos',
    title: 'Clubes Amigos',
    short: 'Clubes Amigos',
    accent: '#082448',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    dotClass: 'bg-[#082448]',
    defaultImage:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=700&q=80',
    description:
      'Convenios con clubes deportivos colaboradores y modalidades federadas vinculadas al colegio.',
  },
];

export const CATEGORIES = [
  { id: 'Todas', label: 'Todas' },
  { id: 'Deportes', label: 'Deportes' },
  { id: 'Idiomas', label: 'Idiomas' },
  { id: 'Arte/expresión', label: 'Arte y expresión' },
  { id: 'Tecnología/manualidades', label: 'Tecnología y talleres' },
];

export const WEEKDAYS = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miércoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
];

export const AVAILABILITY_STATES = {
  disponible: {
    id: 'disponible',
    label: 'Plazas disponibles',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  ultimas: {
    id: 'ultimas',
    label: 'Últimas plazas',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  lista_espera: {
    id: 'lista_espera',
    label: 'Lista de espera',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  },
  cerrada: {
    id: 'cerrada',
    label: 'Inscripción cerrada',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export const MAP_POINT_COLORS = [
  { id: 'blue', label: 'Azul institucional', hex: '#155f9e' },
  { id: 'red', label: 'Rojo (actividad / pista)', hex: '#dc2626' },
  { id: 'green', label: 'Verde (acceso familias)', hex: '#16a34a' },
  { id: 'gold', label: 'Dorado (recogida monitores)', hex: '#ca8a04' },
  { id: 'violet', label: 'Morado (servicios)', hex: '#7c3aed' },
];

export const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    pregunta: '¿Cómo recogen los monitores a los alumnos y dónde se entregan?',
    respuesta:
      'Dentro de la ficha de cada actividad, en la pestaña «Mapa y recogida», se detalla el lugar exacto de realización, el punto donde los monitores recogen a los alumnos y el punto de entrega a las familias al finalizar.',
  },
  {
    id: 'faq-2',
    pregunta: '¿Cuándo se pasan los recibos mensuales de las actividades?',
    respuesta:
      'Los recibos de las actividades extraescolares se emiten de forma mensual al inicio de cada mes.',
  },
  {
    id: 'faq-3',
    pregunta: '¿Cómo puedo solicitar la baja de una actividad?',
    respuesta:
      'Las bajas deben solicitarse siempre antes del día 25 del mes anterior. El trámite se realiza a través de la página web de Alventus, salvo en las actividades de piscina, que se gestionan desde el portal propio de la piscina.',
  },
  {
    id: 'faq-4',
    pregunta: '¿Qué ocurre los días de lluvia si la actividad es al aire libre?',
    respuesta:
      'En caso de lluvia o meteorología adversa, el centro dispone de espacios cubiertos alternativos (aulas asignadas, porches o gimnasio) para desarrollar la sesión con seguridad.',
  },
  {
    id: 'faq-5',
    pregunta: '¿Cómo accedo a las actividades y reservas de la Piscina?',
    respuesta:
      'Las actividades acuáticas y de natación del colegio cuentan con un portal propio para consultar niveles, reservar pruebas de nivel y formalizar inscripciones.',
    enlace: 'https://piscina-csb.vercel.app/',
    enlaceTexto: 'Abrir portal de Piscina CSB',
  },
  {
    id: 'faq-6',
    pregunta: '¿Puedo inscribir a mi hijo si el curso ya ha comenzado?',
    respuesta:
      'Sí. Las inscripciones permanecen abiertas durante todo el curso escolar (de octubre a mayo) siempre que existan vacantes. No se aplican descuentos ni prorrateos por incorporación a mitad de mes, aunque puede solicitarse el inicio el primer día del mes siguiente. Al inicio de curso, la apertura de cada grupo requiere alcanzar un mínimo de inscritos.',
  },
  {
    id: 'faq-7',
    pregunta: '¿Qué equipamiento o ropa necesita llevar el alumno?',
    respuesta:
      'En la ficha detallada de cada actividad se indica el material técnico específico necesario. Con carácter general, para las actividades deportivas se recomienda ropa cómoda o el chándal oficial del colegio.',
  },
  {
    id: 'faq-8',
    pregunta: '¿Hay actividades extraescolares los días festivos o no lectivos?',
    respuesta:
      'No. Las actividades extraescolares siguen estrictamente el calendario escolar oficial del centro, por lo que no se imparten en festivos, vacaciones escolares ni días no lectivos.',
  },
  {
    id: 'faq-9',
    pregunta: '¿Existen descuentos por hermanos o por varias actividades?',
    respuesta:
      'Las condiciones tarifarias y posibles descuentos dependen de cada entidad gestora (Alventus o los clubes deportivos colaboradores). Consulte la ficha detallada de cada actividad o contacte con la empresa responsable.',
  },
  {
    id: 'faq-10',
    pregunta: '¿Se puede cambiar de actividad a mitad de curso?',
    respuesta:
      'Sí. Debe tramitarse la baja de la actividad actual antes del día 25 del mes y realizar una nueva inscripción en la actividad deseada, sujeta a disponibilidad de plazas.',
  },
];

export const EMPTY_ACTIVITY = {
  nombre: '',
  categoria: '',
  etapas: [],
  activa: true,
  estadoPlazas: 'disponible',
  destacada: false,
  dias: '',
  horario: '',
  lugar: '',
  precio: '',
  info: '',
  material: '',
  imagen: '',
  imagenExtra: '',
  empresa: '',
  logoEmpresa: '',
  nombreContacto: '',
  contacto: '',
  enlace: '',
  linkInscripcion: '',
  linksMultiples: [],
  recogidaMonitores: '',
  recogidaFamilias: '',
  latAct: String(SCHOOL_CENTER[0]),
  lngAct: String(SCHOOL_CENTER[1]),
  latMon: '',
  lngMon: '',
  latFam: '',
  lngFam: '',
  fotoAct: '',
  fotoMon: '',
  fotoFam: '',
};
