  import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { descargarMensajesPDF } from "./qrUtils";
import { jsPDF } from 'jspdf';
import { db, auth } from "./firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { Routes, Route, useParams } from "react-router-dom";
import MensajesEvento from "./MensajesEvento";
import PropuestaCliente from "./PropuestaCliente";
import ReciboCliente from "./ReciboCliente";
import EncuestaCliente from "./EncuestaCliente";
import { generarQRPDF } from "./qrUtils";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";

/**
 * LUISINA BAGNAROLI - SISTEMA DE GESTIÓN DE EVENTOS 2026
 * ---------------------------------------------------------
 * CARACTERÍSTICAS INCLUIDAS:
 * 1. PERSISTENCIA: Guardado automático en LocalStorage.
 * 2. GESTIÓN DE INVITADOS: Importación masiva, borrado individual y buscador.
 * 3. GESTIÓN DE MESAS: Creación de mesas VIP y Estándar con desasignación.
 * 4. REPORTES (3 EN 1): Alfabético, Distribución por Mesa y Cartelería 9xA4.
 * 5. UI/UX: Diseño premium basado en la identidad visual de la marca.
 */

const injectStyles = () => {
  if (document.getElementById('style-lb-core-main')) return;
  const style = document.createElement('style');
  style.id = 'style-lb-core-main';
  style.innerHTML = `
@import url('https://fonts.cdnfonts.com/css/brittany-signature');    
    :root {
      --lb-gold: #c5a059;
      --lb-gold-dark: #a3844a;
      --lb-gold-light: #f4ece0;
      --lb-dark: #1a1a1a;
      --lb-gray-dark: #4a4a4a;
      --lb-gray-mid: #8e8e8e;
      --lb-gray-light: #f0f0f0;
      --lb-bg: #fdfcfb;
      --lb-white: #ffffff;
      --transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      --shadow-sm: 0 4px 12px rgba(0,0,0,0.03);
      --shadow-md: 0 10px 30px rgba(0,0,0,0.08);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
  font-family: 'Plus Jakarta Sans', sans-serif; 
  background: var(--lb-bg); 
  color: var(--lb-dark);
  line-height: 1.6;
  overflow-x: hidden;
}

    /* SCROLLBAR CUSTOM */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--lb-gray-light); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--lb-gray-mid); }

    /* LAYOUT ESTRUCTURAL */
    .app-container {
  display: flex;
  flex-direction: row;
}

/* MODO CELULAR */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
}

    .sidebar-brand {
      width: 320px; height: 100vh; 
      background: linear-gradient(180deg, #ffffff 0%, #f7f3ed 100%);
      position: fixed; left: 0; top: 0; 
      padding: 60px 40px; 
      border-right: 1px solid rgba(197, 160, 89, 0.1); 
      z-index: 100;
      display: flex; flex-direction: column;
    }
      @media (max-width: 768px) {
  .sidebar-brand {
    position: relative;
    width: 100%;
    height: auto;
    padding: 20px;
  }

  .main-wrapper {
    margin-left: 0;
    width: 100%;
  }
}

    .logo-box {
      width: 60px; height: 60px; 
      border: 2px solid var(--lb-gold); 
      color: var(--lb-gold); 
      display: flex; align-items: center; justify-content: center; 
      font-weight: 800; margin-bottom: 40px;
      font-size: 1.4rem;
      letter-spacing: 2px;
    }

    .brand-title {
      font-family: 'Brittany Signature', serif;
      font-size: 3.8rem; line-height: 1.2; 
      text-transform: none; margin-bottom: 5px;
    }

    .brand-sub {
      color: var(--lb-gray-mid); font-size: 1rem; 
      letter-spacing: 2px; font-weight: 300;
      text-transform: uppercase;
    }

    .main-wrapper { margin-left: 320px; width: calc(100% - 320px); }
    @media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0 !important;
    width: 100%;
  }
}

    /* DASHBOARD / HOME */
    .hero-banner { display: none; }
    .hero-text { display: none; }

    .projects-section { padding: 60px; }
    .grid-container { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
      gap: 40px; 
    }
      @media (max-width: 768px) {
  .projects-section {
    padding: 20px;
  }
}

    .project-card {
      background: var(--lb-white); border-radius: 30px; overflow: visible;
      box-shadow: var(--shadow-sm); transition: var(--transition);
      border: 1px solid rgba(0,0,0,0.02);
      position: relative;
    }
    .project-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-md); }
    .card-image { width: 100%; height: 240px; object-fit: cover; }
   .card-content { 
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
    .card-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; margin-bottom: 8px; }
    
    /* BOTONES */
    .btn-luxury {
      background: var(--lb-gold); color: white; border: none;
      padding: 16px 32px; border-radius: 14px; font-weight: 600;
      cursor: pointer; transition: var(--transition);
      text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.75rem;
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    }
    .btn-luxury:hover { background: var(--lb-dark); transform: scale(1.02); }
    .btn-outline {
      background: transparent; border: 1.5px solid var(--lb-gold); color: var(--lb-gold);
    }
    .btn-outline:hover { background: var(--lb-gold); color: white; }

    /* WORKSPACE EDITOR */
    .editor-layout {
  display: flex;
  min-height: 100vh;
}

/* RESPONSIVE CELULAR */
@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
    height: auto;
  }
}
    .editor-sidebar {
      width: 420px; background: var(--lb-white); border-right: 1px solid var(--lb-gray-light);
      display: flex; flex-direction: column; padding: 40px; overflow-y: auto;
    }

      /* RESPONSIVE CELULAR */
@media (max-width: 768px) {
  .editor-sidebar {
    width: 100%;
    padding: 20px;
    border-right: none;
    border-bottom: 1px solid var(--lb-gray-light);
  }
}
    .editor-canvas { flex: 1; padding: 60px; overflow-y: auto; background: #f9f7f4; }
    @media (max-width: 768px) {
  .editor-canvas {
    padding: 20px;
  }
}

    .input-field {
      width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--lb-gray-light);
      background: #fafafa; margin-bottom: 16px; font-family: inherit; font-size: 0.9rem;
      transition: var(--transition);
    }
    .input-field:focus { outline: none; border-color: var(--lb-gold); background: white; }

 .guest-list-container {
  margin-top: 30px;
  padding-right: 5px;
}
    .guest-item {
      display: flex; justify-content: space-between; align-items: center;
      background: white; padding: 12px 18px; border-radius: 14px;
      margin-bottom: 10px; border: 1px solid var(--lb-gray-light);
      transition: var(--transition);
    }
    .guest-item:hover { border-color: var(--lb-gold-light); transform: translateX(5px); }

    .mesa-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 30px;
    }

    .mesa-card {
      background: var(--lb-white); border-radius: 28px; padding: 35px;
      box-shadow: var(--shadow-sm); border: 1px solid rgba(0,0,0,0.03);
      position: relative; transition: var(--transition);
    }
    .mesa-card.vip-style {
      border: 2px solid var(--lb-gold);
      background: linear-gradient(145deg, #ffffff 0%, #fffbf2 100%);
    }
    .mesa-num { 
      font-size: 0.75rem; font-weight: 800; letter-spacing: 3px; 
      color: var(--lb-gold); margin-bottom: 20px; display: block;
    }

    .delete-btn {
      background: none; border: none; color: #ffbcbc; cursor: pointer;
      font-size: 1.2rem; transition: 0.2s;
    }
    .delete-btn:hover { color: #ff4d4d; }

    .badge-assigned {
      font-size: 0.65rem; font-weight: 800; color: var(--lb-gold);
      background: var(--lb-gold-light); padding: 4px 10px; border-radius: 20px;
    }
  /* ============================= */
/* SPLASH CLIENTE */
/* ============================= */

.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;

  background-image: url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 1.5s ease;
}
.splash-screen.fade-out {
  opacity: 0;
  filter: brightness(1.2) sepia(0.3);
}
.splash-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    rgba(0,0,0,0.85),
    rgba(120,100,50,0.4)
  );
}

.splash-content {
  position: relative;
  text-align: center;
  color: white;
  animation: fadeIn 1.2s ease;
}

.splash-logo {
  font-family: 'Brittany Signature', cursive !important;
  font-size: 5rem;
  margin-bottom: 20px;
  text-shadow: 0 0 50px rgba(255, 215, 120, 0.4);
}

.splash-sub {
  font-size: 1.5rem;
  margin-bottom: 40px;
  font-weight: 300;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
}

.splash-btn {
  position: relative;
  padding: 18px 40px;
  font-size: 0.8rem;
  letter-spacing: 2px;
  border-radius: 14px;

  background: linear-gradient(135deg, #d4af37, #b8962e);
  color: white;

  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);

  transition: all 0.3s ease;
}
  .splash-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.6),
    transparent
  );

  transform: skewX(-20deg);
  animation: shine 3s infinite;
}
  @keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
  .splash-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 40px rgba(212,175,55,0.5);
}
  
/* PARTÍCULAS DORADAS */

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.particles span {
  position: absolute;
  display: block;
  width: 6px;
  height: 6px;
  background: rgba(255, 215, 120, 0.8);
  border-radius: 50%;
  animation: floatParticles linear infinite;
}

.particles span:nth-child(1) { left: 10%; animation-duration: 8s; top: 90%; }
.particles span:nth-child(2) { left: 30%; animation-duration: 10s; top: 95%; }
.particles span:nth-child(3) { left: 50%; animation-duration: 7s; top: 85%; }
.particles span:nth-child(4) { left: 70%; animation-duration: 9s; top: 92%; }
.particles span:nth-child(5) { left: 85%; animation-duration: 11s; top: 88%; }
.particles span:nth-child(6) { left: 60%; animation-duration: 6s; top: 96%; }

@keyframes floatParticles {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(-120vh);
    opacity: 0;
  }
}`;
  document.head.appendChild(style);
};

injectStyles();

const AppContent = () => {
 const normalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};
const [pantallaPublica, setPantallaPublica] = useState(true);
const [fadeOut, setFadeOut] = useState(false);
const [logueado, setLogueado] = useState(false);
const [loginEmail, setLoginEmail] = useState("");
const [loginPassword, setLoginPassword] = useState("");
const [loginError, setLoginError] = useState("");
const [loginCargando, setLoginCargando] = useState(false);

// Escucha el estado real de autenticación de Firebase
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    setLogueado(!!user);
  });
  return () => unsub();
}, []);

// Cierre automático de sesión por inactividad (30 minutos)
useEffect(() => {
  const TIEMPO_LIMITE = 30 * 60 * 1000;
  let timer;
  const reiniciarTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { signOut(auth); }, TIEMPO_LIMITE);
  };
  const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  eventos.forEach(ev => window.addEventListener(ev, reiniciarTimer));
  reiniciarTimer();
  return () => {
    clearTimeout(timer);
    eventos.forEach(ev => window.removeEventListener(ev, reiniciarTimer));
  };
}, []);

  const { id } = useParams();
  const params = new URLSearchParams(window.location.search);
const esVistaLista = params.get("vista") === "lista";
const esVistaCheckin =
  params.get("vista") === "checkin";
  const esCliente = !!id;
  const [pantallaInicio, setPantallaInicio] = useState(esCliente);
  // ---------------------------------------------------------
  // ESTADO Y PERSISTENCIA
  // ---------------------------------------------------------
  const [eventos, setEventos] = useState([]);
  const eventoCliente = eventos.find(e => String(e.id) === id);
  const [eventoActivoId, setEventoActivoId] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
const [nuevaFecha, setNuevaFecha] = useState("");
const [invitadosTemp, setInvitadosTemp] = useState([]);
const [mesaActivaId, setMesaActivaId] = useState(null);
const [busquedaInvitado, setBusquedaInvitado] = useState("");
const [busquedaMesa, setBusquedaMesa] = useState("");
const [resultadoMesa, setResultadoMesa] = useState(null);
const [busquedaCheckin, setBusquedaCheckin] = useState("");
const [filtroCheckin, setFiltroCheckin] = useState("todos");
const [checkinActualizandoId, setCheckinActualizandoId] = useState(null);
const [errorCheckin, setErrorCheckin] = useState("");
const [brindisBulk, setBrindisBulk] = useState("");
const [busquedaBrindis, setBusquedaBrindis] = useState("");
const [editandoBrindisId, setEditandoBrindisId] = useState(null);
const [nombreBrindisEditado, setNombreBrindisEditado] = useState("");
const [busquedaCheckinBrindis, setBusquedaCheckinBrindis] = useState("");
const [filtroCheckinBrindis, setFiltroCheckinBrindis] = useState("todos");
const [brindisActualizandoId, setBrindisActualizandoId] = useState(null);
const [errorCheckinBrindis, setErrorCheckinBrindis] = useState("");
const [tagsInvitado, setTagsInvitado] = useState([]);
const [invitadosBulk, setInvitadosBulk] = useState("");
const [previewInvitados, setPreviewInvitados] = useState([]);
const [invitadoSeleccionado, setInvitadoSeleccionado] = useState(null);
const [mostrarInvitados, setMostrarInvitados] = useState(false);
const [mostrarBrindis, setMostrarBrindis] = useState(false);
const [mostrarCronograma, setMostrarCronograma] = useState(false);
const [cronogramaSeleccionId, setCronogramaSeleccionId] = useState("");
const [cronogramaHora, setCronogramaHora] = useState("");
const [cronogramaTitulo, setCronogramaTitulo] = useState("");
const [cronogramaTexto, setCronogramaTexto] = useState("");
const [cronogramaTipo, setCronogramaTipo] = useState("orden");
const [cronogramaEditandoUid, setCronogramaEditandoUid] = useState(null);
const [mesaExpandida, setMesaExpandida] = useState(null);
const [editandoInvitado, setEditandoInvitado] = useState(null);
const [nombreEditado, setNombreEditado] = useState("");
const textareaRef = useRef(null);
const [mostrarPropuesta, setMostrarPropuesta] = useState(false);
const [mostrarFormEvento, setMostrarFormEvento] = useState(false);
const [mostrarEventos, setMostrarEventos] = useState(false);
const [editandoPropuestaId, setEditandoPropuestaId] = useState(null);

const [tipoPropuesta, setTipoPropuesta] = useState("boda");

const [clientePropuesta, setClientePropuesta] = useState("");

const [fechaPropuesta, setFechaPropuesta] = useState("");

const [cantidadInvitados, setCantidadInvitados] = useState("");

const [espacioSalon, setEspacioSalon] = useState("");

const [lugarEvento, setLugarEvento] = useState("");

const [importePropuesta, setImportePropuesta] = useState("");
const [monedaPropuesta, setMonedaPropuesta] = useState("ARS");

const [anticipoPropuesta, setAnticipoPropuesta] = useState("");

const [cuotasPropuesta, setCuotasPropuesta] = useState("");

const [incluyePropuesta, setIncluyePropuesta] = useState("");

const [observacionesPropuesta, setObservacionesPropuesta] = useState("");

const [estilosPropuesta, setEstilosPropuesta] = useState([]);
const [propuestas, setPropuestas] = useState([]);
const [mostrarPropuestasCreadas, setMostrarPropuestasCreadas] = useState(false);
const [reciboPropuestaId, setReciboPropuestaId] = useState(null);
const [reciboEditandoId, setReciboEditandoId] = useState(null);
const [importeRecibo, setImporteRecibo] = useState("");
const [monedaRecibo, setMonedaRecibo] = useState("ARS");
const [cotizacionRecibo, setCotizacionRecibo] = useState("");
const [medioPagoRecibo, setMedioPagoRecibo] = useState("efectivo");
const [observacionRecibo, setObservacionRecibo] = useState("");
const [fechaRecibo, setFechaRecibo] = useState(() => new Date().toISOString().slice(0, 10));
const [nombrePagadorRecibo, setNombrePagadorRecibo] = useState("");
const [historialRecibosPropuestaId, setHistorialRecibosPropuestaId] = useState(null);
const [resenasPublicas, setResenasPublicas] = useState([]);
const [mostrarResenasAdmin, setMostrarResenasAdmin] = useState(false);
const [nuevaPropuesta, setNuevaPropuesta] =
useState({

  tipo: "boda",
  estilo: "verdeRustico",

  cliente: "",
  fecha: "",

  invitados: "",
  presupuesto: "",
  anticipo: "",
  cuotas: "",

  incluye: "",
  observaciones: "",

  salon: "",
  lugar: ""

});
const estilosXV = [

  {
    id:"personalizado",
    nombre:"Personalizado",
    img:"/propuestas/xv-personalizado/hero.webp"
  },

  {
    id:"moderno",
    nombre:"Moderno",
    img:"/propuestas/xv-moderno/hero.webp"
  },

  {
    id:"rustico",
    nombre:"Rústico",
    img:"/propuestas/xv-rustico-verde/hero.jpg"
  },

  {
    id:"romantico",
    nombre:"Romántico",
    img:"/propuestas/xv-romantico/grande-1.webp"
  },

  {
    id:"disco",
    nombre:"Cine/teatro",
    img:"/propuestas/xv-cine-teatro/hero.webp"
  }

];

const estilosBoda = [

  {
    id:"verdeRustico",
    nombre:"Verde/rústico",
    img:"/propuestas/boda-verde-rustico/hero.jpg"
  }

];

const estilosEmpresas = [

  {
    id:"corporativo",
    nombre:"Corporativo",
    img:"/propuestas/empresas-corporativo/hero.jpg"
  }

];

const estilosInfantil = [

  {
    id:"infantil",
    nombre:"Infantil",
    img:"/propuestas/festejo-infantil/hero.webp"
  }

];

const plantillaCronogramaBase = [
  {
    id: "fotos_familiares",
    activo: false,
    hora: "",
    titulo: "Fotos familiares",
    texto: "Fotos familiares en el salón.",
    tipo: "horario"
  },
  {
    id: "llegada_invitados",
    activo: false,
    hora: "",
    titulo: "Llegada de invitados",
    texto: "Los invitados esperan la llegada de {{nombre}}.",
    tipo: "horario"
  },
  {
    id: "ingreso",
    activo: false,
    hora: "",
    titulo: "Ingreso",
    texto: "Una vez que lleguen todos los invitados, se invita a disponerse en la pista para esperar la llegada de {{nombre}}.",
    tipo: "orden"
  },
  {
    id: "video_ingreso",
    activo: false,
    hora: "",
    titulo: "Video de ingreso",
    texto: "Ingresa {{nombre}} y saluda a sus invitados.",
    tipo: "orden"
  },
  {
    id: "recepcion",
    activo: false,
    hora: "",
    titulo: "Recepción",
    texto: "Se invita a los comensales a disponerse en el sector de la pista o en sus mesas para comenzar la recepción.",
    tipo: "orden"
  },
  {
    id: "tanda_fotos",
    activo: false,
    hora: "",
    titulo: "Momento tanda de fotos",
    texto: "Al finalizar la recepción se invita a los comensales a disponerse en sus mesas. Cada mesa se levanta para realizar su foto con {{nombre}}.",
    tipo: "orden"
  },
  {
    id: "cena",
    activo: false,
    hora: "",
    titulo: "Cena",
    texto: "Se dará comienzo a la cena. Una vez finalizada, se retoma la dinámica de baile o el siguiente momento del evento.",
    tipo: "orden"
  },
  {
    id: "baile_especial",
    activo: false,
    hora: "",
    titulo: "Baile especial",
    texto: "{{nombre}} comparte un baile especial con sus familiares y personas importantes.",
    tipo: "orden"
  },
  {
    id: "vals_novios",
    activo: false,
    hora: "",
    titulo: "Vals de los novios",
    texto: "Los novios realizan su primer baile y luego se invita a los invitados a acompañarlos en la pista.",
    tipo: "orden"
  },
  {
    id: "carta_amigas",
    activo: false,
    hora: "",
    titulo: "Carta de amigas",
    texto: "Momento especial para lectura de carta, palabras dedicadas o sorpresa para {{nombre}}.",
    tipo: "orden"
  },
  {
    id: "tanda_baile",
    activo: false,
    hora: "",
    titulo: "Tanda de baile",
    texto: "",
    tipo: "separador"
  },  {
    id: "postre_brindis",
    activo: false,
    hora: "",
    titulo: "Postre + brindis",
    texto: "Brindis, torta y fotos familiares.",
    tipo: "horario"
  },
  {
    id: "video_back",
    activo: false,
    hora: "",
    titulo: "Video back",
    texto: "Proyección de video o momento sorpresa.",
    tipo: "orden"
  },
  {
    id: "ingreso_brindis",
    activo: false,
    hora: "",
    titulo: "Ingreso invitados del brindis",
    texto: "Ingreso de invitados al brindis. Evitar retrasar este momento para mantener el desarrollo de la fiesta.",
    tipo: "horario"
  },
  {
    id: "barra_tragos",
    activo: false,
    hora: "",
    titulo: "Barra de tragos",
    texto: "Apertura de barra de tragos.",
    tipo: "horario"
  },
  {
    id: "mesa_dulce",
    activo: false,
    hora: "",
    titulo: "Mesa dulce",
    texto: "Se invita a los invitados a acercarse a la mesa dulce.",
    tipo: "orden"
  },
  {
    id: "show_infantil",
    activo: false,
    hora: "",
    titulo: "Show infantil / payaso",
    texto: "Momento de show para chicos, animación o intervención especial.",
    tipo: "orden"
  },
  {
    id: "show",
    activo: false,
    hora: "",
    titulo: "Show",
    texto: "Momento de show o intervención artística.",
    tipo: "orden"
  },
  {
    id: "cotillon",
    activo: false,
    hora: "",
    titulo: "Cotillón",
    texto: "Se reparte cotillón y se invita a todos a acercarse a la pista.",
    tipo: "orden"
  },
  {
    id: "trasnoche",
    activo: false,
    hora: "",
    titulo: "Trasnoche",
    texto: "Momento de trasnoche según la dinámica del evento.",
    tipo: "orden"
  },
  {
    id: "fin_fiesta",
    activo: false,
    hora: "",
    titulo: "Fin de fiesta",
    texto: "Invitar a todos a acercarse a la pista para bailar el último tema de la noche.",
    tipo: "horario"
  }
];
const estilosAlquiler = [

  {
    id:"mobiliario",
    nombre:"Mobiliario",
    img:"/propuestas/alquiler/banner-6.webp"
  }

];
const estilosPorTipo = {
  xv: estilosXV,
  boda: estilosBoda,
  empresas: estilosEmpresas,
  infantil: estilosInfantil,
  alquiler: estilosAlquiler
};

const estiloDefaultPorTipo = {
  xv: "personalizado",
  boda: "verdeRustico",
  empresas: "corporativo",
  infantil: "infantil",
  alquiler: "mobiliario"
};

const estilosDisponibles =
  estilosPorTipo[tipoPropuesta] || estilosXV;

const etiquetaTipoPropuesta = (tipo) => {
  if (tipo === "boda") return "BODA";
  if (tipo === "empresas") return "EMPRESAS";
  if (tipo === "infantil") return "FESTEJO INFANTIL";
  if (tipo === "alquiler") return "ALQUILER";
  return "CUMPLEAÑOS DE 15";
};

const formatearImportePropuesta = (importe, moneda = "ARS") => {
  if (!importe) return "-";
  return moneda === "USD" ? `US$ ${importe}` : `$${importe}`;
};



  useEffect(() => {

  const unsubEventos = onSnapshot(
    collection(db, "eventos"),
    (snapshot) => {

      const lista = [];

      snapshot.forEach(docSnap => {

        const data = docSnap.data();

        lista.push({
          ...data,
          _docId: docSnap.id
        });

      });

      setEventos(lista);

      console.log(" Sync en tiempo real");

    }
  );

  return () => unsubEventos();

}, []);

useEffect(() => {

  const unsubPropuestas = onSnapshot(
    collection(db, "propuestas"),
    (snapshot) => {

      const lista = [];

      snapshot.forEach(docSnap => {

        lista.push({
          ...docSnap.data(),
          _docId: docSnap.id
        });

      });

      setPropuestas(lista);

    }
  );

  return () => unsubPropuestas();

}, []);

 
  // Guardado automático

useEffect(() => {

  const unsubResenas = onSnapshot(
    query(
      collection(db, "resenas"),
      orderBy("creada", "desc"),
      limit(20)
    ),
    (snapshot) => {

      const lista = [];

      snapshot.forEach(docSnap => {
        lista.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      setResenasPublicas(lista);

    },
    (error) => {
      console.error("Error cargando reseñas:", error);
    }
  );

  return () => unsubResenas();

}, []);



  // Evento activo memorizado
  const eventoActual = useMemo(() => {

  if (esCliente && id) {
    return eventos.find(e => String(e.id) === id);
  }

  return eventos.find(e => e.id === eventoActivoId);

}, [eventos, eventoActivoId, id]);
const estaBloqueado = esCliente && eventoActual?.cerrado;
const normalizarBrindisInvitado = (inv = {}) => ({
  id: inv.id || Date.now() + Math.floor(Math.random() * 1000000),
  nombre: inv.nombre || "",
  pago: Boolean(inv.pago),
  metodoPago: inv.metodoPago || "",
  checkin: Boolean(inv.checkin),
  horaIngreso: inv.horaIngreso || null
});
const invitadosCheckin = eventoActual?.invitados || [];
const mesasCheckin = eventoActual?.mesas || [];
const invitadosBrindis = (eventoActual?.invitadosBrindis || [])
  .map(normalizarBrindisInvitado);
const brindisHabilitado = Boolean(eventoActual?.brindisHabilitado);
const guardarEvento = async (evento) => {
  try {
    const ref = doc(db, "eventos", evento._docId); // % CAMBIO CLAVE
    await updateDoc(ref, evento);
    console.log("💾 Evento guardado en Firebase");
  } catch (error) {
    console.error("L Error guardando evento:", error);
  }
};
// ---------------------------------------------------------
  // ACCIONES DE PROYECTO
  // ---------------------------------------------------------
  const reordenarMesas = (mesas) => {
  let contador = 1;

  return mesas.map(m => {
    if (m.esVIP) return m;

    return {
      ...m,
      numero: contador++
    };
  });
};
 const handleActualizarEvento = useCallback((nuevosDatos) => {
  setEventos(prev => {
    
    const actualizado = prev.map(e => {

      // % CLAVE: detectar si es cliente o admin
      const esElEvento = esCliente
        ? String(e.id) === id
        : e.id === eventoActivoId;

      return esElEvento ? { ...e, ...nuevosDatos } : e;
    });
    

    // % obtener el evento correcto
    const eventoActualizado = actualizado.find(e =>
      esCliente
        ? String(e.id) === id
        : e.id === eventoActivoId
    );

    if (eventoActualizado) {
      guardarEvento(eventoActualizado);
    }

    return actualizado;
  });

}, [eventoActivoId, id, esCliente]);

const handleToggleCheckin = async (invId) => {
  if (!eventoActual || checkinActualizandoId !== null) return;

  setErrorCheckin("");
  setCheckinActualizandoId(invId);

  const invitadosActuales = eventoActual.invitados || [];
  const nuevosInvitados = invitadosActuales.map(i => {
    if (String(i.id) !== String(invId)) return i;

    const nuevoEstado = !Boolean(i.checkin);

    return {
      ...i,
      checkin: nuevoEstado,
      horaIngreso: nuevoEstado ? Date.now() : null
    };
  });

  try {
    if (!eventoActual._docId) {
      throw new Error("No se encontró el documento del evento");
    }

    await updateDoc(doc(db, "eventos", eventoActual._docId), {
      invitados: nuevosInvitados
    });

    setEventos(prev =>
      prev.map(e =>
        String(e.id) === String(eventoActual.id)
          ? { ...e, invitados: nuevosInvitados }
          : e
      )
    );
  } catch (error) {
    console.error("Error en check-in:", error);
    setErrorCheckin("No se pudo guardar el ingreso. Revisá la conexión y volvé a intentar.");
  } finally {
    setCheckinActualizandoId(null);
  }
};

const actualizarInvitadosBrindis = (nuevosInvitadosBrindis) => {
  if (estaBloqueado) return;

  handleActualizarEvento({
    invitadosBrindis: nuevosInvitadosBrindis.map(normalizarBrindisInvitado)
  });
};

const handleImportarBrindis = () => {
  if (estaBloqueado) return;

  const lineas = brindisBulk
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lineas.length === 0) {
    alert("Pegá al menos un invitado al brindis");
    return;
  }

  const nuevos = lineas.map((nombre, index) => ({
    id: Date.now() + index + Math.floor(Math.random() * 100000),
    nombre,
    pago: false,
    metodoPago: "",
    checkin: false,
    horaIngreso: null
  }));

  actualizarInvitadosBrindis([
    ...invitadosBrindis,
    ...nuevos
  ]);

  setBrindisBulk("");
};

const handleEliminarBrindis = (invId) => {
  if (estaBloqueado) return;
  if (!window.confirm("¿Eliminar invitado al brindis?")) return;

  actualizarInvitadosBrindis(
    invitadosBrindis.filter(inv => String(inv.id) !== String(invId))
  );
};

const handleGuardarEdicionBrindis = (invId) => {
  if (estaBloqueado) return;

  const nombre = nombreBrindisEditado.trim();
  if (!nombre) {
    alert("El nombre no puede quedar vacío");
    return;
  }

  actualizarInvitadosBrindis(
    invitadosBrindis.map(inv =>
      String(inv.id) === String(invId)
        ? { ...inv, nombre }
        : inv
    )
  );

  setEditandoBrindisId(null);
  setNombreBrindisEditado("");
};

const handleTogglePagoBrindis = (invId, metodoPago = "") => {
  if (estaBloqueado) return;

  actualizarInvitadosBrindis(
    invitadosBrindis.map(inv => {
      if (String(inv.id) !== String(invId)) return inv;

      const nuevoPago = metodoPago ? true : !inv.pago;

      return {
        ...inv,
        pago: nuevoPago,
        metodoPago: nuevoPago
          ? (metodoPago || inv.metodoPago || "efectivo")
          : ""
      };
    })
  );
};

const handleToggleCheckinBrindis = async (invId, pagarAhora = false, metodoPago = "efectivo") => {
  if (!eventoActual || brindisActualizandoId !== null) return;

  setErrorCheckinBrindis("");
  setBrindisActualizandoId(invId);

  const nuevosInvitadosBrindis = invitadosBrindis.map(inv => {
    if (String(inv.id) !== String(invId)) return inv;

    const nuevoIngreso = !Boolean(inv.checkin) || pagarAhora;

    return {
      ...inv,
      pago: pagarAhora ? true : inv.pago,
      metodoPago: pagarAhora ? (metodoPago || "efectivo") : inv.metodoPago,
      checkin: nuevoIngreso,
      horaIngreso: nuevoIngreso ? Date.now() : null
    };
  });

  try {
    if (!eventoActual._docId) {
      throw new Error("No se encontró el documento del evento");
    }

    await updateDoc(doc(db, "eventos", eventoActual._docId), {
      invitadosBrindis: nuevosInvitadosBrindis
    });

    setEventos(prev =>
      prev.map(e =>
        String(e.id) === String(eventoActual.id)
          ? { ...e, invitadosBrindis: nuevosInvitadosBrindis }
          : e
      )
    );
  } catch (error) {
    console.error("Error en check-in de brindis:", error);
    setErrorCheckinBrindis("No se pudo guardar el ingreso del brindis. Revisá la conexión y volvé a intentar.");
  } finally {
    setBrindisActualizandoId(null);
  }
};

const exportarBrindisPDF = () => {
  const pdf = new jsPDF();
  const e = eventoActual;
  const lista = [...invitadosBrindis];
  let y = 28;

  pdf.setFontSize(18);
  pdf.setTextColor(197, 160, 89);
  pdf.text("INVITADOS AL BRINDIS", 105, 16, { align: "center" });

  pdf.setFontSize(12);
  pdf.setTextColor(26, 26, 26);
  pdf.text(e?.nombre || "Evento", 20, y);
  y += 8;
  pdf.text("Valor tarjeta: " + (e?.valorTarjetaBrindis || "-"), 20, y);
  y += 8;
  pdf.text("Alias: " + (e?.aliasBrindis || "-"), 20, y);
  y += 12;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("NOMBRE", 20, y);
  pdf.text("PAGO / IMPAGO", 130, y);
  y += 8;
  pdf.setFont("helvetica", "normal");
  lista
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
    .forEach((inv, index) => {
      const pago = inv.pago ? "PAGO " + (inv.metodoPago ? "(" + inv.metodoPago + ")" : "") : "IMPAGO";
      pdf.text((index + 1) + ". " + (inv.nombre || "Sin nombre"), 20, y);
      pdf.text(pago, 130, y);
      y += 8;

      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
    });

  pdf.save("BRINDIS_" + String(e?.nombre || "evento").replace(/\s+/g, "_") + ".pdf");
};

  
const limpiarFormularioPropuesta = () => {
  setClientePropuesta("");
  setFechaPropuesta("");
  setCantidadInvitados("");
  setEspacioSalon("");
  setLugarEvento("");
  setImportePropuesta("");
  setMonedaPropuesta("ARS");
  setAnticipoPropuesta("");
  setCuotasPropuesta("");
  setIncluyePropuesta("");
  setObservacionesPropuesta("");
  setEstilosPropuesta([]);
  setNuevaPropuesta(prev => ({
    ...prev,
    estilo: "moderno"
  }));
  setEditandoPropuestaId(null);
};

const handleCrearPropuesta = async () => {

  try {

    const datosPropuesta = {

      tipo: tipoPropuesta,

      cliente: clientePropuesta,

      fecha: fechaPropuesta,

      invitados: cantidadInvitados,

      espacioSalon,

      salon: espacioSalon,

      lugar: lugarEvento,

     presupuesto: importePropuesta,

moneda: monedaPropuesta,

anticipo: anticipoPropuesta,
      cuotas: cuotasPropuesta,

      incluye: incluyePropuesta,

      observaciones: observacionesPropuesta,

      estilo: nuevaPropuesta.estilo,

      actualizada: Date.now()

    };

    if (editandoPropuestaId) {

      await updateDoc(
        doc(db, "propuestas", editandoPropuestaId),
        datosPropuesta
      );

      alert(" Propuesta actualizada");

    } else {

      await addDoc(
        collection(db, "propuestas"),
        {
          ...datosPropuesta,
          creada: Date.now()
        }
      );

      alert(" Propuesta creada");

    }

    limpiarFormularioPropuesta();

    setMostrarPropuesta(false);

  } catch (error) {

    console.error(error);

    alert("Error guardando propuesta");

  }

};

const handleEditarPropuesta = (prop) => {

  setEditandoPropuestaId(prop._docId);

  setTipoPropuesta(prop.tipo || "xv");
  setClientePropuesta(prop.cliente || "");
  setFechaPropuesta(prop.fecha || "");
  setCantidadInvitados(prop.invitados || "");
  setEspacioSalon(prop.salon || prop.espacioSalon || "");
  setLugarEvento(prop.lugar || "");
  setImportePropuesta(prop.presupuesto || "");
  setMonedaPropuesta(prop.moneda || "ARS");
  setAnticipoPropuesta(prop.anticipo || "");
  setCuotasPropuesta(prop.cuotas || "");
  setIncluyePropuesta(prop.incluye || "");
  setObservacionesPropuesta(prop.observaciones || "");

  setNuevaPropuesta(prev => ({
    ...prev,
    tipo: prop.tipo || "xv",
    estilo: prop.estilo || estiloDefaultPorTipo[prop.tipo || "xv"] || "personalizado"
  }));

  setMostrarPropuesta(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};

const handleEliminarPropuesta = async (prop) => {

  const confirmar = window.confirm(
    "¿Seguro que querés eliminar esta propuesta?\n\nSe borrará de Firebase y el link dejará de funcionar."
  );

  if (!confirmar) return;

  try {

    await deleteDoc(
      doc(db, "propuestas", prop._docId)
    );

    if (editandoPropuestaId === prop._docId) {
      limpiarFormularioPropuesta();
      setMostrarPropuesta(false);
    }

    alert("🗑️ Propuesta eliminada");

  } catch (error) {

    console.error(error);

    alert("Error eliminando propuesta");

  }

};

const numeroDesdeTextoRecibo = (valor) => {
  if (typeof valor === "number") return valor;

  const limpio = String(valor || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : 0;
};

const formatearDineroRecibo = (valor, moneda = "ARS") => {
  const numero = numeroDesdeTextoRecibo(valor);
  const prefijo = moneda === "USD" ? "USD " : "$";

  return prefijo + numero.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatearFechaRecibo = (valor) => {
  if (!valor) return "-";

  const fecha = typeof valor === "number"
    ? new Date(valor)
    : new Date(String(valor).includes("T") ? valor : String(valor) + "T00:00:00");

  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleDateString("es-AR");
};

const calcularAplicadoRecibo = ({ monedaPresupuesto, monedaEntrega, importe, cotizacion }) => {
  const monto = numeroDesdeTextoRecibo(importe);
  const cambio = numeroDesdeTextoRecibo(cotizacion);

  if (monedaPresupuesto === monedaEntrega) return monto;
  if (!cambio) return 0;

  if (monedaPresupuesto === "USD" && monedaEntrega === "ARS") {
    return monto / cambio;
  }

  if (monedaPresupuesto === "ARS" && monedaEntrega === "USD") {
    return monto * cambio;
  }

  return monto;
};

const recalcularSaldosRecibos = (prop, recibos = []) => {
  const monedaPresupuesto = prop.moneda || "ARS";
  const presupuesto = numeroDesdeTextoRecibo(prop.presupuesto || prop.importe || prop.importePropuesta);
  let saldo = presupuesto;

  return [...recibos]
    .sort((a, b) => (a.creada || 0) - (b.creada || 0))
    .map(recibo => {
      const aplicado = calcularAplicadoRecibo({
        monedaPresupuesto,
        monedaEntrega: recibo.monedaEntrega || monedaPresupuesto,
        importe: recibo.importeEntrega,
        cotizacion: recibo.cotizacion
      });

      if (recibo.estado !== "anulado") {
        saldo = Math.max(saldo - aplicado, 0);
      }

      return {
        ...recibo,
        monedaPresupuesto,
        importePresupuesto: presupuesto,
        aplicadoPresupuesto: aplicado,
        saldoPosterior: saldo
      };
    });
};

const obtenerResumenRecibos = (prop) => {
  const monedaPresupuesto = prop.moneda || "ARS";
  const presupuesto = numeroDesdeTextoRecibo(prop.presupuesto || prop.importe || prop.importePropuesta);
  const recibos = prop.recibos || [];
  const totalEntregado = recibos
    .filter(recibo => recibo.estado !== "anulado")
    .reduce((total, recibo) => {
      return total + numeroDesdeTextoRecibo(recibo.aplicadoPresupuesto);
    }, 0);

  return {
    monedaPresupuesto,
    presupuesto,
    totalEntregado,
    saldo: Math.max(presupuesto - totalEntregado, 0)
  };
};

const limpiarFormularioRecibo = () => {
  setReciboEditandoId(null);
  setImporteRecibo("");
  setMonedaRecibo("ARS");
  setCotizacionRecibo("");
  setMedioPagoRecibo("efectivo");
  setObservacionRecibo("");
  setFechaRecibo(new Date().toISOString().slice(0, 10));
  setNombrePagadorRecibo("");
};

const abrirPanelRecibos = (prop) => {
  const abierto = reciboPropuestaId === prop._docId;

  setReciboPropuestaId(abierto ? null : prop._docId);
  setHistorialRecibosPropuestaId(null);
  limpiarFormularioRecibo();

  if (!abierto) {
    setMonedaRecibo(prop.moneda || "ARS");
  }
};

const handleEditarRecibo = (recibo) => {
  setReciboEditandoId(recibo.id);
  setImporteRecibo(String(recibo.importeEntrega || ""));
  setMonedaRecibo(recibo.monedaEntrega || "ARS");
  setCotizacionRecibo(String(recibo.cotizacion || ""));
  setMedioPagoRecibo(recibo.medioPago || "efectivo");
  setObservacionRecibo(recibo.observacion || "");
  setFechaRecibo(recibo.fechaEntrega || new Date().toISOString().slice(0, 10));
  setNombrePagadorRecibo(recibo.nombrePagador || "");
};

const handleGuardarRecibo = async (prop) => {
  const monedaPresupuesto = prop.moneda || "ARS";
  const importe = numeroDesdeTextoRecibo(importeRecibo);
  const cotizacion = numeroDesdeTextoRecibo(cotizacionRecibo);
  const requiereCotizacion = monedaRecibo !== monedaPresupuesto;

  if (!importe) {
    alert("Ingresá el importe entregado");
    return;
  }

  if (requiereCotizacion && !cotizacion) {
    alert("Ingresá la cotización para convertir la entrega");
    return;
  }

  const recibosActuales = prop.recibos || [];
  const existente = recibosActuales.find(recibo => recibo.id === reciboEditandoId);
  const idRecibo = reciboEditandoId || "REC-" + Date.now();

  const recibo = {
    ...(existente || {}),
    id: idRecibo,
    creada: existente?.creada || Date.now(),
    actualizada: Date.now(),
    estado: existente?.estado || "activo",
    monedaPresupuesto,
    importePresupuesto: numeroDesdeTextoRecibo(prop.presupuesto || prop.importe || prop.importePropuesta),
    monedaEntrega: monedaRecibo,
    importeEntrega: importe,
    cotizacion: cotizacion || "",
    medioPago: medioPagoRecibo,
    observacion: observacionRecibo,
    fechaEntrega: fechaRecibo || new Date().toISOString().slice(0, 10),
    nombrePagador: nombrePagadorRecibo.trim()
  };

  const nuevosRecibos = recibosActuales.some(item => item.id === idRecibo)
    ? recibosActuales.map(item => item.id === idRecibo ? recibo : item)
    : [...recibosActuales, recibo];

  const recibosRecalculados = recalcularSaldosRecibos(prop, nuevosRecibos);

  try {
    await updateDoc(
      doc(db, "propuestas", prop._docId),
      { recibos: recibosRecalculados }
    );

    limpiarFormularioRecibo();

    const link = window.location.origin + "/recibo/" + prop._docId + "/" + idRecibo;

    compartirLink({
      link,
      titulo: "Recibo Luisina Bagnaroli",
      texto: "Te comparto el recibo digital de tu entrega.",
      mensajeCopiado: "Link de recibo copiado"
    });
  } catch (error) {
    console.error(error);
    alert("Error guardando recibo");
  }
};

const handleAnularRecibo = async (prop, recibo) => {
  const motivo = window.prompt("Motivo de anulación del recibo:");

  if (motivo === null) return;

  const confirmar = window.confirm("¿Seguro que querés anular este recibo? Quedará guardado como anulado para mantener el historial.");

  if (!confirmar) return;

  const nuevosRecibos = (prop.recibos || []).map(item => {
    if (item.id !== recibo.id) return item;

    return {
      ...item,
      estado: "anulado",
      motivoAnulacion: motivo || "Sin motivo informado",
      anuladoEn: Date.now()
    };
  });

  const recibosRecalculados = recalcularSaldosRecibos(prop, nuevosRecibos);

  try {
    await updateDoc(
      doc(db, "propuestas", prop._docId),
      { recibos: recibosRecalculados }
    );

    alert("Recibo anulado");
  } catch (error) {
    console.error(error);
    alert("Error anulando recibo");
  }
};

const handleCompartirRecibo = (prop, recibo) => {
  const link = window.location.origin + "/recibo/" + prop._docId + "/" + recibo.id;

  compartirLink({
    link,
    titulo: "Recibo Luisina Bagnaroli",
    texto: "Te comparto el recibo digital de tu entrega.",
    mensajeCopiado: "Link de recibo copiado"
  });
};

const handleCrearProyecto = async () => {  if (!nuevoNombre) {
  alert("Poné un nombre al evento");
  return;
}

const nuevoId = Date.now();

const terminos = ['event-hall', 'party-decor', 'celebration', 'wedding-venue'];
const fotoAzar = terminos[Math.floor(Math.random() * terminos.length)];

const nuevo = {
  
  id: nuevoId,
  nombre: nuevoNombre,
  fecha: nuevaFecha || "",
  cerrado: false,
  img: `https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800&sig=${nuevoId}&q=${fotoAzar}`,
  invitados: [],
  mesas: [],
  brindisHabilitado: false,
  valorTarjetaBrindis: "",
  aliasBrindis: "",
  invitadosBrindis: [],
};

try {
  // 🔥 primero guarda en Firebase
  const docRef = await addDoc(collection(db, "eventos"), nuevo);

await updateDoc(docRef, { id: docRef.id });

nuevo.id = docRef.id;

  console.log(" Guardado en Firebase");

  // 🔥 después guarda en tu app (local)


  setNuevoNombre("");
  setNuevaFecha("");

setEventoActivoId(docRef.id);

} catch (error) {
  console.error("L Error Firebase:", error);
  alert("Error al guardar en Firebase");
}
};

const handleEliminarProyecto = async (docId, eventoId, e) => {
  e.stopPropagation();

  if(window.confirm("¿Seguro que deseas eliminar este evento por completo?\n\nSe borrarán invitados, mesas, brindis y mensajes asociados. Esta acción no se puede deshacer.")) {

    try {
      // 🔥 BORRAR MENSAJES RELACIONADOS
const mensajesRef = collection(db, "mensajes");

const q = query(
  mensajesRef,
  where("eventoId", "==", eventoId)
);

const snapshot = await getDocs(q);

for (const mensaje of snapshot.docs) {
  await deleteDoc(doc(db, "mensajes", mensaje.id));
}
      await deleteDoc(doc(db, "eventos", docId));

      setEventos(prev => prev.filter(ev => ev._docId !== docId));

      setEventoActivoId(null);

      console.log("🗑️ Evento eliminado correctamente");

    } catch (error) {
      console.error("L Error al eliminar:", error);
      alert("Error al eliminar el evento");
    }
  }
};
const calcularDias = (fecha) => {
  if (!fecha) return "";

  const hoy = new Date();
  const evento = new Date(fecha);

  hoy.setHours(0,0,0,0);
  evento.setHours(0,0,0,0);

  const diferencia = Math.ceil((evento - hoy) / (1000 * 60 * 60 * 24));

  if (diferencia === 0) return "HOY";
  if (diferencia > 0) return `Faltan ${diferencia} días`;
  return "Evento pasado";
};
  // ---------------------------------------------------------
  // GESTIÓN DE INVITADOS
  // ---------------------------------------------------------
  const handleImportarMasivo = () => {

  if (estaBloqueado) return;

  // SI HAY PREVIEW: USA PREVIEW
  if (previewInvitados.length > 0) {

    const nuevosInvitados = previewInvitados.map(inv => ({
      id: Math.floor(Math.random() * 1000000) + Date.now(),
nombre: inv.nombre,
mesaId: null,
tags: inv.tags || [],
checkin: false,
horaIngreso: null
    }));

    handleActualizarEvento({
      invitados: [
        ...(eventoActual.invitados || []),
        ...nuevosInvitados
      ]
    });

    setPreviewInvitados([]);
    setInvitadoSeleccionado(null);
    setInvitadosBulk("");

    return;
  }

  // SI NO HAY PREVIEW: IMPORTACION SIMPLE
  const lineas = invitadosBulk
    .split("\n")
    .filter(l => l.trim() !== "");

  const nuevosInvitados = lineas.map(nombre => ({
    id: Math.floor(Math.random() * 1000000) + Date.now(),
nombre: nombre.trim(),
mesaId: null,
tags: [],
checkin: false,
horaIngreso: null
  }));

  handleActualizarEvento({
    invitados: [
      ...(eventoActual.invitados || []),
      ...nuevosInvitados
    ]
  });

  setInvitadosBulk("");

};

  // ---------------------------------------------------------
  // GESTIÓN DE MESAS
  // ---------------------------------------------------------
  const handleAgregarMesa = (vip = false) => {
    if (vip) {
  const yaExisteVIP = eventoActual.mesas.some(m => m.esVIP);
  if (yaExisteVIP) {
    alert("Ya existe una mesa principal");
    return;
  }
}
    if (estaBloqueado) return;

    const numeroMesa = eventoActual.mesas.filter(m => !m.esVIP).length + 1;

const nuevaMesa = {
  id: Date.now(),
  numero: vip ? "MESA PRINCIPAL" : numeroMesa,
  esVIP: vip,
  invitadosIds: []
};

    let nuevasMesas;

if (vip) {
  nuevasMesas = [nuevaMesa, ...eventoActual.mesas];
} else {
  nuevasMesas = [...eventoActual.mesas, nuevaMesa];
}

handleActualizarEvento({
  mesas: reordenarMesas(nuevasMesas)
});
  };

  const handleEliminarMesa = (mId) => {
    if (estaBloqueado) return;
    if(!window.confirm("¿Eliminar mesa? Los invitados volverán a la lista de espera.")) return;
    
    const invitadosDesasignados = eventoActual.invitados.map(i => 
      i.mesaId === mId ? { ...i, mesaId: null } : i
    );

    const nuevasMesas = eventoActual.mesas.filter(m => m.id !== mId);

handleActualizarEvento({
  mesas: reordenarMesas(nuevasMesas),
  invitados: invitadosDesasignados
});
  };

  const handleAsignarMesa = (invId, mesaId) => {
    if (estaBloqueado) return;
    if (!invId) return;
    
    // 1. Actualizar mesa
    const nuevasMesas = eventoActual.mesas.map(m => {
      if (m.id === mesaId) return { ...m, invitadosIds: [...(m.invitadosIds || []), invId] };
      return m;
    });

    // 2. Actualizar estado del invitado
    const nuevosInvitados = eventoActual.invitados.map(i => 
      i.id === invId ? { ...i, mesaId: mesaId } : i
    );

    handleActualizarEvento({ mesas: nuevasMesas, invitados: nuevosInvitados });
  };

   const handleEliminarInvitadoTotal = (invId) => {

  if (estaBloqueado) return;

  const confirmar = window.confirm(
    "¿Eliminar invitado?"
  );

  if (!confirmar) return;

  // limpiar invitado de mesas
  const nuevasMesas = eventoActual.mesas.map(m => ({
    ...m,
    invitadosIds: (m.invitadosIds || [])
      .filter(id => id !== invId)
  }));

  // eliminar invitado
  const nuevosInvitados =
    eventoActual.invitados.filter(
      inv => inv.id !== invId
    );

  handleActualizarEvento({
    mesas: nuevasMesas,
    invitados: nuevosInvitados
  });

};
  const compartirLink = async ({ link, titulo, texto, mensajeCopiado }) => {
    const nav = window.navigator;
    const datosCompartir = {
      title: titulo || "Luisina Bagnaroli",
      text: texto || "Te comparto este enlace",
      url: link
    };

    const esDispositivoMovil =
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      /Android|iPhone|iPad|iPod/i.test(nav?.userAgent || "");

    if (esDispositivoMovil && nav?.share) {
      try {
        await nav.share(datosCompartir);
        return;
      } catch (error) {
        // Si el compartir nativo no abre, seguimos con copiar enlace.
      }
    }

    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(link);
      } else {
        const inputTemporal = document.createElement("textarea");
        inputTemporal.value = link;
        inputTemporal.setAttribute("readonly", "");
        inputTemporal.style.position = "fixed";
        inputTemporal.style.left = "-9999px";
        inputTemporal.style.top = "0";
        document.body.appendChild(inputTemporal);
        inputTemporal.focus();
        inputTemporal.select();

        const copiado = document.execCommand("copy");
        document.body.removeChild(inputTemporal);

        if (!copiado) {
          throw new Error("No se pudo copiar automaticamente");
        }
      }

      alert((mensajeCopiado || "Link copiado") + ":\n\n" + link);
    } catch (error) {
      window.prompt("No pudimos copiarlo automaticamente. Copia este enlace:", link);
    }
  };
  const handleQuitarDeMesa = (invId, mesaId) => {
   
    if (estaBloqueado) return;
    const nuevasMesas = eventoActual.mesas.map(m => {
      if (m.id === mesaId) return { ...m, invitadosIds: m.invitadosIds.filter(id => id !== invId) };
      return m;
    });

    const nuevosInvitados = eventoActual.invitados.map(i => 
      i.id === invId ? { ...i, mesaId: null } : i
    );

    handleActualizarEvento({ mesas: nuevasMesas, invitados: nuevosInvitados });
  };

  const crearItemCronograma = (item = {}) => ({
    uid:
      item.uid ||
      `${item.id || "momento"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
    id: item.id || "personalizado",
    activo: Boolean(item.activo),
    hora: item.hora || "",
    titulo: item.titulo || "Nuevo momento",
    texto: item.texto || "",
    tipo: item.tipo || "orden"
  });

  const obtenerNombreCronograma = () => {
    const nombreGuardado = eventoActual?.cronogramaNombre?.trim();
    if (nombreGuardado) return nombreGuardado;

    const nombreEvento = eventoActual?.nombre || "";
    const sinPrefijo = nombreEvento
      .replace(/^(15\s*años|quince\s*años|cumpleaños\s*de\s*15|boda|casamiento|evento|festejo)\s*/i, "")
      .trim();

    return sinPrefijo || nombreEvento || "el agasajado";
  };

  const textoCronograma = (texto) =>
    String(texto || "").replaceAll("{{nombre}}", obtenerNombreCronograma());

  const cargarPlantillaCronograma = () => {
    const actuales = eventoActual?.cronograma || [];

    if (
      actuales.length > 0 &&
      !window.confirm(
        "Esto reemplazará el cronograma actual por la plantilla base. ¿Deseás continuar?"
      )
    ) {
      return;
    }

    handleActualizarEvento({
      cronograma: plantillaCronogramaBase.map(item => crearItemCronograma(item)),
      cronogramaNombre: obtenerNombreCronograma()
    });
  };

  const actualizarCronogramaNombre = (valor) => {
    handleActualizarEvento({ cronogramaNombre: valor });
  };

  const actualizarItemCronograma = (uid, cambios) => {
    const actuales = eventoActual?.cronograma || [];
    const nuevos = actuales.map(item =>
      item.uid === uid ? { ...item, ...cambios } : item
    );

    handleActualizarEvento({ cronograma: nuevos });
  };

  const agregarItemCronograma = () => {
    const nuevo = crearItemCronograma({
      activo: true,
      titulo: "Nuevo momento",
      texto: "Descripción del momento.",
      tipo: "orden"
    });

    handleActualizarEvento({
      cronograma: [...(eventoActual?.cronograma || []), nuevo]
    });
  };

  const eliminarItemCronograma = (uid) => {
    if (!window.confirm("¿Eliminar este momento del cronograma?")) return;

    handleActualizarEvento({
      cronograma: (eventoActual?.cronograma || []).filter(item => item.uid !== uid)
    });
  };

  const moverItemCronograma = (uid, direccion) => {
    const actuales = [...(eventoActual?.cronograma || [])];
    const index = actuales.findIndex(item => item.uid === uid);
    const nuevoIndex = index + direccion;

    if (index < 0 || nuevoIndex < 0 || nuevoIndex >= actuales.length) return;

    const [item] = actuales.splice(index, 1);
    actuales.splice(nuevoIndex, 0, item);

    handleActualizarEvento({ cronograma: actuales });
  };

  const limpiarFormularioCronograma = () => {
    setCronogramaSeleccionId("");
    setCronogramaHora("");
    setCronogramaTitulo("");
    setCronogramaTexto("");
    setCronogramaTipo("orden");
    setCronogramaEditandoUid(null);
  };

  const seleccionarMomentoCronograma = (id) => {
    setCronogramaSeleccionId(id);

    if (!id) {
      limpiarFormularioCronograma();
      return;
    }

    if (id === "otro") {
      setCronogramaHora("");
      setCronogramaTitulo("");
      setCronogramaTexto("");
      setCronogramaTipo("orden");
      setCronogramaEditandoUid(null);
      return;
    }

    const plantilla = plantillaCronogramaBase.find(item => item.id === id);

    if (!plantilla) return;

    setCronogramaHora(plantilla.hora || "");
    setCronogramaTitulo(plantilla.titulo || "");
    setCronogramaTexto(plantilla.texto || "");
    setCronogramaTipo(plantilla.tipo || "orden");
    setCronogramaEditandoUid(null);
  };

  const guardarMomentoCronograma = () => {
    const titulo = cronogramaTitulo.trim();

    if (!titulo) {
      alert("Ingresá el nombre del momento");
      return;
    }

    const item = crearItemCronograma({
      uid: cronogramaEditandoUid || undefined,
      id: cronogramaSeleccionId || "personalizado",
      activo: true,
      hora: cronogramaHora,
      titulo,
      texto: cronogramaTexto,
      tipo: cronogramaTipo
    });

    const actuales = eventoActual?.cronograma || [];
    const nuevos = cronogramaEditandoUid
      ? actuales.map(actual => actual.uid === cronogramaEditandoUid ? item : actual)
      : [...actuales, item];

    handleActualizarEvento({
      cronograma: nuevos,
      cronogramaNombre: eventoActual?.cronogramaNombre || obtenerNombreCronograma()
    });

    limpiarFormularioCronograma();
  };

  const editarMomentoCronograma = (item) => {
    setCronogramaSeleccionId(item.id || "otro");
    setCronogramaHora(item.hora || "");
    setCronogramaTitulo(item.titulo || "");
    setCronogramaTexto(item.texto || "");
    setCronogramaTipo(item.tipo || "orden");
    setCronogramaEditandoUid(item.uid);
  };
  const exportarCronogramaPDF = () => {
    const items = (eventoActual?.cronograma || []).filter(item => item.activo);

    if (items.length === 0) {
      alert("Activá al menos un momento para generar el cronograma");
      return;
    }

    const pdf = new jsPDF();
    const nombreEvento = eventoActual?.nombre || "Evento";
    const nombre = obtenerNombreCronograma();
    const marginX = 18;
    const pageW = 210;
    const pageH = 297;
    let y = 18;

    const pintarFondo = () => {
      pdf.setFillColor(248, 246, 242);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setFillColor(231, 221, 208);
      pdf.rect(184, 0, 14, pageH, "F");
      pdf.setDrawColor(214, 200, 184);
      pdf.setLineWidth(0.2);
      pdf.line(176, 18, 176, pageH - 18);
      pdf.setTextColor(210, 202, 192);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(46);
      pdf.text("LB", 176, pageH - 18, { align: "right" });
    };

    const agregarPaginaSiHaceFalta = (alto = 18) => {
      if (y + alto <= pageH - 24) return;
      pdf.addPage();
      pintarFondo();
      y = 22;
    };

    pintarFondo();

    pdf.setTextColor(42, 42, 42);
    pdf.setFont("times", "italic");
    pdf.setFontSize(34);
    pdf.text("Luisina Bagnaroli", pageW / 2, y, { align: "center" });

    y += 10;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(92, 92, 92);
    pdf.text("PLANIFICADORA DE EVENTOS", pageW / 2, y, { align: "center" });

    y += 11;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(44, 44, 48);
    pdf.text("CRONOGRAMA DEL EVENTO", pageW / 2, y, { align: "center" });

    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(105, 105, 105);
    pdf.text(`${nombreEvento} · ${nombre}`, pageW / 2, y, { align: "center" });

    y += 12;

    const anchoTextoCronograma = 152;
    const altoDisponible = pageH - 22 - y;
    const estilosCompactos = [
      { titulo: 10.2, texto: 8.8, linea: 4.7, tituloPaso: 5.7, separador: 9.2, separadorAlto: 10, espacio: 2.5 },
      { titulo: 9.2, texto: 7.8, linea: 4.1, tituloPaso: 5.1, separador: 8.4, separadorAlto: 9, espacio: 2 },
      { titulo: 8.2, texto: 6.8, linea: 3.6, tituloPaso: 4.5, separador: 7.8, separadorAlto: 8, espacio: 1.6 },
      { titulo: 7.2, texto: 5.9, linea: 3.1, tituloPaso: 3.9, separador: 7, separadorAlto: 7.2, espacio: 1.2 },
      { titulo: 6.4, texto: 5.2, linea: 2.7, tituloPaso: 3.2, separador: 6.2, separadorAlto: 6.2, espacio: 0.8 }
    ];

    const lineasParaItem = (item, estilo) => {
      if (item.tipo === "separador") return [];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(estilo.texto);

      return textoCronograma(item.texto)
        .split("\n")
        .filter(linea => linea.trim() !== "")
        .flatMap(linea => pdf.splitTextToSize(linea, anchoTextoCronograma));
    };

    const medirCronograma = (estilo) =>
      items.reduce((total, item) => {
        if (item.tipo === "separador") return total + estilo.separadorAlto;
        const lineas = lineasParaItem(item, estilo);
        return total + estilo.tituloPaso + Math.max(1, lineas.length) * estilo.linea + estilo.espacio;
      }, 0);

    const baseEstiloPDF =
      estilosCompactos.find(estilo => medirCronograma(estilo) <= altoDisponible) ||
      estilosCompactos[estilosCompactos.length - 1];

    const factorAjuste = Math.min(
      1,
      altoDisponible / Math.max(1, medirCronograma(baseEstiloPDF))
    );

    const estiloPDF = Object.fromEntries(
      Object.entries(baseEstiloPDF).map(([clave, valor]) => [
        clave,
        typeof valor === "number" ? valor * factorAjuste : valor
      ])
    );

    items.forEach((item) => {
      const titulo = String(item.titulo || "Momento").trim();
      const hora = String(item.hora || "").trim();

      if (item.tipo === "separador") {
        pdf.setFillColor(235, 229, 220);
        pdf.roundedRect(marginX, y - 4.5, 150, estiloPDF.separadorAlto - 1.5, 2, 2, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(estiloPDF.separador);
        pdf.setTextColor(64, 64, 64);
        pdf.text(`*** ${titulo.toUpperCase()} ***`, marginX + 75, y + 0.8, { align: "center" });
        y += estiloPDF.separadorAlto;
        return;
      }

      const encabezado = hora ? `${hora}  ${titulo}` : titulo;
      const lineasTexto = lineasParaItem(item, estiloPDF);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(estiloPDF.titulo);
      pdf.setTextColor(42, 42, 42);
      pdf.text(encabezado.toUpperCase(), marginX, y);
      y += estiloPDF.tituloPaso;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(estiloPDF.texto);
      pdf.setTextColor(48, 48, 48);

      lineasTexto.forEach(linea => {
        pdf.text(linea, marginX, y);
        y += estiloPDF.linea;
      });

      y += estiloPDF.espacio;
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Luisina Bagnaroli · Diseño y producción de eventos", pageW / 2, pageH - 10, { align: "center" });

    pdf.save(`cronograma-${nombreEvento.replace(/\s+/g, "-")}.pdf`);
  };
  // ---------------------------------------------------------
  // MOTOR DE EXPORTACIÓN (LOS 3 LISTADOS)
  // ---------------------------------------------------------
  const exportarDocumentacionMaestra = () => {
    const doc = new jsPDF();
    const e = eventoActual;
    const margin = 20;
    let y = 30;

    // --- SECCIÓN 1: LISTADO ALFABÉTICO ---
    doc.setFontSize(22); doc.setTextColor(197, 160, 89);
    doc.text(`PLANIFICACIÓN: ${e.nombre.toUpperCase()}`, 105, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(14); doc.setTextColor(26, 26, 26);
    doc.text("I. LISTADO ALFABÉTICO DE INVITADOS", margin, y);
    y += 10; doc.setFontSize(10);

    const listaAlfabetica = [...e.invitados].sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    listaAlfabetica.forEach((inv, index) => {
      const mesa = e.mesas.find(m => m.id === inv.mesaId);
      const condiciones = (inv.tags || [])
  .map(t => {

    if (t === "bebe") return "BEBÉ";
    if (t === "infantil") return "INFANTIL";
    if (t === "vegano") return "VEGANO";
    if (t === "sintacc") return "SIN TACC";
    if (t === "diabetico") return "DIABÉTICO";

    return t.toUpperCase();

  })
  .join(" · ");

doc.setFontSize(10);
doc.setTextColor(26,26,26);

const textoPrincipal =
  `${index + 1}. ${inv.nombre}`;

doc.text(
  textoPrincipal,
  margin,
  y
);

if (condiciones) {

  const anchoTexto =
    doc.getTextWidth(textoPrincipal);

  doc.setFontSize(7);
  doc.setTextColor(140);

  doc.text(
    condiciones.toLowerCase(),
    margin + anchoTexto + 4,
    y
  );

  // % RESTAURAR ESTILO
  doc.setFontSize(10);
  doc.setTextColor(26,26,26);

}
      doc.text(mesa ? `Mesa: ${mesa.numero}` : "SIN ASIGNAR", 150, y);
      y += 8;
      if (y > 275) { doc.addPage(); y = 20; }
    });

    // --- SECCIÓN 2: DISTRIBUCIÓN POR MESAS ---
    doc.addPage(); y = 20;
    doc.setFontSize(14); doc.text("II. DISTRIBUCIÓN POR MESAS", margin, y);
    y += 15;

    const mesasOrden = [...e.mesas].sort((a, b) => (a.esVIP === b.esVIP ? 0 : a.esVIP ? -1 : 1));
    
    mesasOrden.forEach(m => {
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(`MESA ${m.numero}`, margin, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      y += 8;

      const invs = e.invitados.filter(inv => inv.mesaId === m.id);
      if (invs.length === 0) {
        doc.text("   (Mesa sin invitados asignados)", margin, y);
        y += 8;
      } else {
        invs.forEach(i => {
          const condiciones = (i.tags || [])
  .map(t => {

    if (t === "bebe") return "BEBÉ";
    if (t === "infantil") return "INFANTIL";
    if (t === "vegano") return "VEGANO";
    if (t === "sintacc") return "SIN TACC";
    if (t === "diabetico") return "DIABÉTICO";

    return t.toUpperCase();

  })
  .join(" · ");

doc.setFontSize(10);
doc.setTextColor(26,26,26);

const textoMesa =
  `• ${i.nombre}`;

doc.text(
  textoMesa,
  margin,
  y
);

if (condiciones) {

  const anchoTexto =
    doc.getTextWidth(textoMesa);

  doc.setFontSize(7);
  doc.setTextColor(140);

  doc.text(
    condiciones.toLowerCase(),
    margin + anchoTexto + 4,
    y
  );

  // restaurar estilo
  doc.setFontSize(10);
  doc.setTextColor(26,26,26);

}
          y += 7;
          if (y > 275) { doc.addPage(); y = 20; }
        });
      }
      y += 5;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    // --- SECCIÓN 3: CUADRÍCULA CARTELERÍA (9 x A4) ---
    doc.addPage();
    doc.setFontSize(14); doc.text("III. TARJETAS DE MESA (PARA CORTE)", margin, 20);

    const cW = 60, cH = 80; // Medidas tarjeta
    const sX = 15, sY = 30; // Inicio
    const gap = 5;

    mesasOrden.forEach((m, i) => {
      const p = i % 9;
      if (i > 0 && p === 0) doc.addPage();
      
      const col = p % 3;
      const row = Math.floor(p / 3);
      const x = sX + (col * (cW + gap));
      const yP = sY + (row * (cH + gap));

      // Rectángulo guía
      doc.setDrawColor(220, 220, 220);
      doc.rect(x, yP, cW, cH);

      // Marca de agua / Título corto
      doc.setFontSize(6); doc.setTextColor(150);
      doc.text(e.nombre.slice(0, 25), x + (cW/2), yP + 10, { align: 'center' });

      // Número de Mesa Gigante
      doc.setFontSize(35); doc.setTextColor(197, 160, 89);
      doc.text(`${m.numero}`.replace("MESA ", ""), x + (cW/2), yP + (cH/2) + 5, { align: 'center' });
      
      // Detalle inferior
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text(`${(m.invitadosIds || []).length} Invitados`, x + (cW/2), yP + cH - 10, { align: 'center' });
    });

    doc.save(`PLANIFICACION_${e.nombre.replace(/\s+/g, '_')}.pdf`);
  };
 


  // ---------------------------------------------------------
  // RENDER: PANTALLA DE INICIO (DASHBOARD)
  // ---------------------------------------------------------
  if (!esCliente && (!eventoActivoId || !eventoActual)) {
    
    if (pantallaPublica) {return (
  <div className="inicio-publico-page" style={{
    opacity: fadeOut ? 0 : 1,
    transition: "opacity 1.4s ease",
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    overflowX: "hidden",
    fontFamily: "Plus Jakarta Sans, sans-serif"
  }}>

    <section className="inicio-publico-hero" style={{
      minHeight: "100vh",
      position: "relative",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.86fr)",
      alignItems: "center",
      gap: "46px",
      padding: "52px clamp(22px, 6vw, 82px) 42px",
      background:
        "radial-gradient(circle at 16% 24%, rgba(197,160,89,0.18), transparent 28%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.07), transparent 24%), linear-gradient(135deg, #050505 0%, #111 55%, #070707 100%)"
    }}>

      <div style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 22% 26%, rgba(215,180,106,0.16), transparent 30%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.08), transparent 26%)",
        opacity: 1
      }} />

      <div className="inicio-publico-hero-contenido" style={{
        position: "relative",
        zIndex: 2,
        maxWidth: "760px"
      }}>

        <div style={{
          fontSize: "0.72rem",
          letterSpacing: "5px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.62)",
          marginBottom: "26px",
          fontWeight: 700
        }}>
          Diseño y producción de eventos
        </div>

        <h1 style={{
          fontFamily: "Brittany Signature, cursive",
          fontSize: "clamp(3.7rem, 11.5vw, 8.4rem)",
          lineHeight: 0.88,
          color: "rgba(215,180,106,0.78)",
          fontWeight: 300,
          letterSpacing: "1px",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textShadow: "none",
          margin: "0 0 20px"
        }}>
          Luisina Bagnaroli
        </h1>

        <h2 style={{
          fontFamily: "Playfair Display, Georgia, serif",
          fontSize: "clamp(2.1rem, 5vw, 5.2rem)",
          lineHeight: 1.02,
          maxWidth: "720px",
          margin: "0 0 28px",
          fontWeight: 400
        }}>
          Celebraciones pensadas para emocionar desde el primer instante.
        </h2>

        <p style={{
          maxWidth: "660px",
          color: "rgba(255,255,255,0.74)",
          fontSize: "1.08rem",
          lineHeight: 1.85,
          marginBottom: "34px"
        }}>
          Diseñamos eventos con una mirada sensible, estética y profundamente personal. Cada mesa, cada luz y cada rincón se construyen para que quienes nos eligen puedan vivir una experiencia única, cuidada y memorable.
        </p>

        <div className="inicio-publico-acciones" style={{
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>

          <a
            href="https://wa.me/543404597725"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "16px 28px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #d7b46a, #f3d889, #b99245)",
              color: "#111",
              fontWeight: 800,
              letterSpacing: "1.5px",
              textDecoration: "none",
              textTransform: "uppercase",
              fontSize: "0.76rem",
              boxShadow: "0 18px 48px rgba(215,180,106,0.22)"
            }}
          >
            Hablemos de tu evento
          </a>

          <a
            href="https://www.instagram.com/armalocomoquieras/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "15px 24px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.24)",
              color: "#fff",
              textDecoration: "none",
              textTransform: "uppercase",
              fontSize: "0.76rem",
              letterSpacing: "1.5px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)"
            }}
          >
            Ver Instagram
          </a>

          <button
            onClick={() => {
              setFadeOut(true);

              setTimeout(() => {
                setPantallaPublica(false);
              }, 900);
            }}
            style={{
              padding: "15px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(215,180,106,0.38)",
              color: "#d7b46a",
              background: "transparent",
              cursor: "pointer",
              textTransform: "uppercase",
              fontSize: "0.72rem",
              letterSpacing: "1.5px",
              fontWeight: 700
            }}
          >
            Acceso privado
          </button>

        </div>
      </div>

      <div className="inicio-publico-mosaico" style={{
        position: "relative",
        zIndex: 2,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
        alignItems: "stretch"
      }}>

        {[
          { img: "/propuestas/xv-rustico-verde/grande-1.jpg", tall: true },
          { img: "/propuestas/boda-verde-rustico/grande-1.jpg" },
          { img: "/propuestas/empresas-corporativo/grande-1.jpg" },
          { img: "/propuestas/xv-personalizado/grande-3.webp", wide: true }
        ].map((item, index) => (
          <div
            key={index}
            style={{
              minHeight: item.tall ? "420px" : "210px",
              gridRow: item.tall ? "span 2" : "span 1",
              gridColumn: item.wide ? "span 2" : "span 1",
              borderRadius: "28px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.34)"
            }}
          >
            <img
              src={item.img}
              alt="Evento diseñado por Luisina Bagnaroli"
              loading={index === 0 ? "eager" : "lazy"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(0.92) contrast(1.04)"
              }}
            />
          </div>
        ))}

      </div>

    </section>

    <section style={{
      padding: "86px clamp(22px, 6vw, 82px)",
      background: "#0b0b0b"
    }}>
      <div className="inicio-publico-equipo" style={{
        maxWidth: "1180px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "0.95fr 1.05fr",
        gap: "58px",
        alignItems: "center"
      }}>
        <div>
          <div style={{
            color: "#d7b46a",
            letterSpacing: "4px",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            fontWeight: 800,
            marginBottom: "20px"
          }}>
            Nuestra forma de trabajar
          </div>
          <h2 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "clamp(2.2rem, 4.7vw, 4.6rem)",
            lineHeight: 1.05,
            fontWeight: 400,
            margin: "0 0 26px"
          }}>
            No organizamos solamente un evento. Creamos una experiencia para recordar.
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.9,
            fontSize: "1.05rem",
            margin: 0
          }}>
            Nos involucramos en cada detalle para que la celebración tenga identidad, calidez y sentido. Escuchamos, interpretamos y diseñamos espacios que hablan de las personas, de sus historias y de ese momento que merece vivirse con emoción.
          </p>
        </div>

        <div className="inicio-publico-equipo-galeria" style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: "18px",
          alignItems: "stretch"
        }}>
          <div style={{
            minHeight: "560px",
            borderRadius: "34px",
            overflow: "hidden",
            boxShadow: "0 26px 80px rgba(0,0,0,0.34)"
          }}>
            <img
              src="/propuestas/equipo/equipo-principal.jpg"
              alt="Luisina Bagnaroli trabajando en un evento"
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
                filter: "grayscale(100%) contrast(1.04)"
              }}
            />
          </div>

          <div className="inicio-publico-equipo-mini" style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "14px"
          }}>
            {[
              "/propuestas/equipo/equipo-1.jpg",
              "/propuestas/equipo/equipo-2.jpg",
              "/propuestas/equipo/equipo-3.jpg",
              "/propuestas/equipo/equipo-4.jpg",
              "/propuestas/equipo/equipo-6.webp"
            ].map((img, index) => (
              <div
                key={img}
                style={{
                  minHeight: index === 4 ? "174px" : "176px",
                  gridColumn: index === 4 ? "span 2" : "span 1",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 18px 54px rgba(0,0,0,0.28)"
                }}
              >
                <img
                  src={img}
                  alt="Equipo Luisina Bagnaroli"
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center center",
                    display: "block",
                    filter: "grayscale(100%) contrast(1.04)"
                  }}
                />
              </div>
            ))}
          </div>
        </div>      </div>
    </section>

    <section style={{
      padding: "86px clamp(22px, 6vw, 82px) 108px",
      background:
        "radial-gradient(circle at 18% 18%, rgba(215,180,106,0.12), transparent 30%), linear-gradient(180deg, #0b0b0b 0%, #111 100%)",
      textAlign: "center"
    }}>
      <div style={{
        maxWidth: "1180px",
        margin: "0 auto"
      }}>
        <div style={{
          fontFamily: "Brittany Signature, cursive",
          fontSize: "clamp(3.4rem, 9vw, 7.4rem)",
          color: "#d7b46a",
          lineHeight: 1,
          marginBottom: "20px",
          textShadow: "0 0 34px rgba(215,180,106,0.22)"
        }}>
          El mejor momento para celebrar es siempre
        </div>

        <p style={{
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.8,
          fontSize: "1.06rem",
          margin: "0 auto 54px",
          maxWidth: "720px"
        }}>
          Hay celebraciones que no se explican solamente con una mesa linda o una buena ambientación. Se sienten en las miradas, en los abrazos y en esa emoción que aparece cuando todo está pensado para ese momento.
        </p>

        <div className="inicio-publico-emociones" style={{
          display: "grid",
          gridTemplateColumns: "0.78fr 1.32fr 0.78fr",
          gap: "18px",
          alignItems: "stretch",
          margin: "0 auto 58px"
        }}>
          <div className="inicio-publico-emociones-lateral" style={{
            display: "grid",
            gap: "18px"
          }}>
            {[
              "/propuestas/xv-rustico-verde/emocion-2.jpg",
              "/propuestas/boda-verde-rustico/emocion-4.jpg"
            ].map((img) => (
              <div key={img} style={{
                minHeight: "255px",
                borderRadius: "26px",
                overflow: "hidden",
                boxShadow: "0 18px 48px rgba(0,0,0,0.3)"
              }}>
                <img
                  src={img}
                  alt="Momentos emotivos de eventos"
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: "saturate(0.96) contrast(1.04)"
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{
            minHeight: "528px",
            borderRadius: "34px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 34px 96px rgba(0,0,0,0.44)"
          }}>
            <img
              src="/propuestas/boda-verde-rustico/banner.jpg"
              alt="Celebración emotiva creada por Luisina Bagnaroli"
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(1.02) contrast(1.02)"
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.58), transparent 58%)"
            }} />
            <div style={{
              position: "absolute",
              left: "34px",
              right: "34px",
              bottom: "32px",
              textAlign: "left"
            }}>
              <div style={{
                color: "#d7b46a",
                letterSpacing: "3px",
                textTransform: "uppercase",
                fontSize: "0.68rem",
                fontWeight: 800,
                marginBottom: "12px"
              }}>
                Emociones reales
              </div>
              <div style={{
                fontFamily: "Playfair Display, Georgia, serif",
                fontSize: "clamp(1.75rem, 3vw, 3.1rem)",
                lineHeight: 1.08,
                color: "#fff"
              }}>
                Diseñamos atmósferas para que cada instante tenga sentido.
              </div>
            </div>
          </div>

          <div className="inicio-publico-emociones-lateral" style={{
            display: "grid",
            gap: "18px"
          }}>
            {[
              "/propuestas/xv-personalizado/emocion-1.webp",
              "/propuestas/boda-verde-rustico/emocion-6.jpg"
            ].map((img) => (
              <div key={img} style={{
                minHeight: "255px",
                borderRadius: "26px",
                overflow: "hidden",
                boxShadow: "0 18px 48px rgba(0,0,0,0.3)"
              }}>
                <img
                  src={img}
                  alt="Momentos emotivos de eventos"
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: "saturate(0.96) contrast(1.04)"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{
          maxWidth: "760px",
          margin: "0 auto 34px",
          padding: "34px 0 0",
          borderTop: "1px solid rgba(215,180,106,0.22)"
        }}>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.78)",
            fontSize: "1.12rem",
            lineHeight: 1.9
          }}>
            No armamos eventos iguales. Interpretamos historias, diseñamos atmósferas y cuidamos cada instante para que la celebración se sienta verdaderamente tuya.
          </p>
        </div>

        {resenasPublicas.filter(resena => resena.publicada !== false).length > 0 && (

          <div className="inicio-publico-resenas" style={{
            margin: "54px auto 34px",
            padding: "34px clamp(18px, 4vw, 42px)",
            borderRadius: "34px",
            background: "linear-gradient(180deg, #fffdf8 0%, #f5ecdc 100%)",
            color: "#171717",
            boxShadow: "0 26px 70px rgba(0,0,0,0.22)",
            textAlign: "left"
          }}>

            <div style={{
              textAlign: "center",
              marginBottom: "28px"
            }}>

              <div style={{
                color: "#c5a059",
                letterSpacing: "4px",
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: "10px"
              }}>
                Experiencias reales
              </div>

              <h2 style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(2rem,5vw,3.6rem)",
                lineHeight: 1.05,
                margin: 0
              }}>
                Lo que nuestros clientes vivieron
              </h2>

            </div>

            <div className="inicio-publico-resenas-lista" style={{
              display: "flex",
              gap: "18px",
              overflowX: "auto",
              padding: "4px 2px 18px",
              scrollSnapType: "x mandatory"
            }}>

              {resenasPublicas
                .filter(resena => resena.publicada !== false)
                .map(resena => (

                  <article
                    className="inicio-publico-resena-card"
                    key={resena.id}
                    style={{
                      minWidth: "min(390px, 86vw)",
                      scrollSnapAlign: "start",
                      background: "#fff",
                      border: "1px solid rgba(197,160,89,0.22)",
                      borderRadius: "24px",
                      padding: "26px",
                      boxShadow: "0 16px 34px rgba(0,0,0,0.08)"
                    }}
                  >

                    <div style={{
                      color: "#c5a059",
                      fontSize: "1.25rem",
                      letterSpacing: "3px",
                      marginBottom: "12px",
                      textShadow: "0 0 16px rgba(197,160,89,0.34)"
                    }}>
                      {"★".repeat(Math.max(1, Math.round(resena.promedio || 5)))}
                    </div>

                    <div style={{
                      fontSize: "0.72rem",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#a3844a",
                      fontWeight: 800,
                      marginBottom: "12px"
                    }}>
                      {resena.eventoTitulo || "Evento"}
                    </div>

                    <p style={{
                      fontSize: "1rem",
                      lineHeight: 1.75,
                      color: "#333",
                      margin: "0 0 18px"
                    }}>
                      “{resena.mensaje}”
                    </p>

                    <strong style={{ color: "#111" }}>
                      {resena.nombre}
                    </strong>

                  </article>

              ))}

            </div>

          </div>

        )}

        <a
          href="https://wa.me/543404597725"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            padding: "16px 30px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #d7b46a, #f3d889, #b99245)",
            color: "#111",
            textDecoration: "none",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            fontSize: "0.76rem",
            boxShadow: "0 18px 48px rgba(215,180,106,0.22)"
          }}
        >
          Contactar ahora
        </a>
      </div>
    </section>
    <style>{"\n      @media (max-width: 860px) {\n        .inicio-publico-page {\n          width: 100% !important;\n          max-width: 100% !important;\n          overflow-x: hidden !important;\n        }\n\n        .inicio-publico-hero {\n          grid-template-columns: 1fr !important;\n          padding: 34px 22px 42px !important;\n          gap: 34px !important;\n          text-align: center !important;\n          justify-items: center !important;\n        }\n\n        .inicio-publico-hero-contenido {\n          max-width: 100% !important;\n          text-align: center !important;\n        }\n\n        .inicio-publico-hero-contenido h1,\n        .inicio-publico-hero-contenido h2,\n        .inicio-publico-hero-contenido p {\n          margin-left: auto !important;\n          margin-right: auto !important;\n          text-align: center !important;\n        }\n\n        .inicio-publico-acciones {\n          justify-content: center !important;\n          width: 100% !important;\n        }\n\n        .inicio-publico-acciones a,\n        .inicio-publico-acciones button,\n        .inicio-publico-contacto-final {\n          width: min(100%, 462px) !important;\n          justify-content: center !important;\n          text-align: center !important;\n        }\n\n        .inicio-publico-mosaico {\n          width: 100% !important;\n          max-width: 560px !important;\n          grid-template-columns: 1fr 1fr !important;\n          gap: 12px !important;\n        }\n\n        .inicio-publico-mosaico > div {\n          min-height: 178px !important;\n          border-radius: 20px !important;\n        }\n\n        .inicio-publico-mosaico > div:first-child {\n          grid-row: span 2 !important;\n          min-height: 368px !important;\n        }\n\n        .inicio-publico-mosaico > div:last-child {\n          grid-column: 1 / -1 !important;\n          min-height: 188px !important;\n        }\n\n        .inicio-publico-equipo {\n          grid-template-columns: 1fr !important;\n          gap: 38px !important;\n          text-align: center !important;\n        }\n\n        .inicio-publico-equipo h2,\n        .inicio-publico-equipo p {\n          text-align: center !important;\n          margin-left: auto !important;\n          margin-right: auto !important;\n        }\n\n        .inicio-publico-equipo-galeria {\n          grid-template-columns: 1fr !important;\n          max-width: 560px !important;\n          margin: 0 auto !important;\n          width: 100% !important;\n        }\n\n        .inicio-publico-equipo-galeria > div:first-child {\n          min-height: 360px !important;\n          border-radius: 24px !important;\n        }\n\n        .inicio-publico-equipo-mini {\n          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;\n        }\n\n        .inicio-publico-equipo-mini > div {\n          min-height: 170px !important;\n          grid-column: span 1 !important;\n          border-radius: 18px !important;\n        }\n\n        .inicio-publico-equipo-mini > div:last-child:nth-child(odd) {\n          grid-column: 1 / -1 !important;\n          min-height: 220px !important;\n        }\n\n        .inicio-publico-emociones {\n          grid-template-columns: 1fr !important;\n          gap: 14px !important;\n        }\n\n        .inicio-publico-emociones > div {\n          min-height: 250px !important;\n          grid-row: auto !important;\n          border-radius: 20px !important;\n        }\n\n        .inicio-publico-resenas {\n          width: 100% !important;\n          max-width: 100% !important;\n          overflow: hidden !important;\n          text-align: center !important;\n          padding: 28px 16px !important;\n          border-radius: 26px !important;\n        }\n\n        .inicio-publico-resenas-lista {\n          width: 100% !important;\n          max-width: 100% !important;\n          overflow-x: auto !important;\n          padding: 4px 0 18px !important;\n        }\n\n        .inicio-publico-resena-card {\n          flex: 0 0 min(100%, calc(100vw - 64px)) !important;\n          min-width: 0 !important;\n          max-width: calc(100vw - 64px) !important;\n          padding: 22px !important;\n          text-align: left !important;\n          overflow: hidden !important;\n        }\n\n        .inicio-publico-resena-card,\n        .inicio-publico-resena-card * {\n          overflow-wrap: anywhere !important;\n          word-break: break-word !important;\n          white-space: normal !important;\n        }\n      }\n"}</style>
  </div>
  
);
}
 if (!logueado) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(160deg, #fdfcfb 0%, #f4ede0 100%)"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "52px 44px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center"
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #c5a059, #e8cfa0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: 1
        }}>LB</div>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "1.1rem", fontWeight: 700,
          color: "#1a1a1a", letterSpacing: "2px",
          textTransform: "uppercase", marginBottom: 6
        }}>Luisina Bagnaroli</h2>
        <p style={{ color: "#8e8e8e", fontSize: "0.82rem", marginBottom: 36 }}>
          Diseño de Eventos — Panel de administración
        </p>

        <input
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
          onKeyDown={(e) => e.key === "Enter" && document.getElementById("btn-login-lb").click()}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: "12px",
            border: "1.5px solid #e8e0d4", fontSize: "0.95rem",
            outline: "none", marginBottom: 12,
            background: "#fdfcfb", color: "#1a1a1a"
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={loginPassword}
          onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
          onKeyDown={(e) => e.key === "Enter" && document.getElementById("btn-login-lb").click()}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: "12px",
            border: "1.5px solid #e8e0d4", fontSize: "0.95rem",
            outline: "none", marginBottom: 8,
            background: "#fdfcfb", color: "#1a1a1a"
          }}
        />

        {loginError && (
          <p style={{ color: "#c0392b", fontSize: "0.82rem", marginBottom: 12 }}>
            {loginError}
          </p>
        )}

        <button
          id="btn-login-lb"
          disabled={loginCargando}
          onClick={async () => {
            if (!loginEmail || !loginPassword) {
              setLoginError("Completá email y contraseña.");
              return;
            }
            setLoginCargando(true);
            setLoginError("");
            try {
              await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            } catch (err) {
              setLoginError("Email o contraseña incorrectos.");
            } finally {
              setLoginCargando(false);
            }
          }}
          style={{
            width: "100%", padding: "14px",
            borderRadius: "30px", border: "none",
            background: loginCargando
              ? "#d4b97a"
              : "linear-gradient(145deg, #c9a86a, #b3935c)",
            color: "#fff", fontWeight: 700,
            fontSize: "0.9rem", letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: loginCargando ? "not-allowed" : "pointer",
            boxShadow: "0 10px 30px rgba(197,160,89,0.3)",
            transition: "0.3s", marginTop: 4
          }}
        >
          {loginCargando ? "Ingresando..." : "✨ Ingresar"}
        </button>
      </div>
    </div>
  );
}
    return (
      <div className="app-container">
        <aside className="sidebar-brand">
  <div className="logo-box">LB</div>
  <h1 className="brand-title">Luisina Bagnaroli</h1>
  <p className="brand-sub">Diseño de Eventos</p>

  <div style={{marginTop: 'auto'}}>

   <button
  className="btn-luxury"
  style={{width: '100%'}}
  onClick={() => setMostrarFormEvento(prev => !prev)}
>
  + Crear Evento
</button>

{mostrarFormEvento && (
  <div style={{marginTop: '12px'}}>
    <input
      className="input-field"
      placeholder="Nombre del evento"
      value={nuevoNombre}
      onChange={(e) => setNuevoNombre(e.target.value)}
    />
    <input
      type="date"
      className="input-field"
      value={nuevaFecha}
      onChange={(e) => setNuevaFecha(e.target.value)}
    />
    <button
      className="btn-luxury"
      style={{width: '100%', marginTop: '8px'}}
      onClick={() => { handleCrearProyecto(); setMostrarFormEvento(false); }}
    >
      ✓ Confirmar
    </button>
  </div>
)}
<button
  className="btn-luxury"
  style={{
    width: "100%",
    marginTop: "15px",
    background: "#1a1a1a"
  }}
  onClick={() =>
    setMostrarPropuesta(prev => !prev)
  }
>
  ✨ Crear propuesta
</button>

<button
  onClick={() => signOut(auth)}
  style={{
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    borderRadius: "30px",
    border: "1.5px solid rgba(197,160,89,0.3)",
    background: "transparent",
    color: "#8e8e8e",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "0.3s"
  }}
  onMouseOver={(e) => e.target.style.color = "#c5a059"}
  onMouseOut={(e) => e.target.style.color = "#8e8e8e"}
>
  Cerrar sesión
</button>
  </div>
</aside>

        <main className="main-wrapper">


          <section className="projects-section">
            {resenasPublicas.length > 0 && (

              <div style={{
                background: "#fff",
                padding: "28px",
                borderRadius: "24px",
                marginBottom: "32px",
                boxShadow: "0 10px 35px rgba(0,0,0,0.06)"
              }}>

                <button
                  className="btn-luxury btn-outline"
                  style={{ width: "100%" }}
                  onClick={() => setMostrarResenasAdmin(prev => !prev)}
                >
                  {mostrarResenasAdmin
                    ? "Ocultar reseñas"
                    : `Ver reseñas recibidas (${resenasPublicas.length})`}
                </button>

                {mostrarResenasAdmin && (

                  <div style={{
                    marginTop: "22px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                    gap: "16px"
                  }}>

                    {resenasPublicas.map(resena => (

                      <div
                        key={resena.id}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "18px",
                          padding: "18px",
                          background: resena.publicada === false ? "#f8f8f8" : "#fffdf8"
                        }}
                      >

                        <div style={{
                          color: "#c5a059",
                          marginBottom: "8px"
                        }}>
                          {"★".repeat(Math.max(1, Math.round(resena.promedio || 5)))}
                        </div>

                        <div style={{
                          fontWeight: 700,
                          marginBottom: "6px"
                        }}>
                          {resena.eventoTitulo || "Evento"}
                        </div>

                        <div style={{
                          fontSize: "0.9rem",
                          color: "#555",
                          lineHeight: 1.6,
                          marginBottom: "12px"
                        }}>
                          {resena.mensaje}
                        </div>

                        <div style={{
                          fontSize: "0.8rem",
                          color: "#888",
                          marginBottom: "12px"
                        }}>
                          {resena.nombre}
                        </div>

                        <div style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap"
                        }}>

                          <button
                            className="btn-luxury btn-outline"
                            style={{
                              padding: "9px 12px",
                              fontSize: "0.65rem"
                            }}
                            onClick={() =>
                              updateDoc(doc(db, "resenas", resena.id), {
                                publicada: resena.publicada === false ? true : false
                              })
                            }
                          >
                            {resena.publicada === false ? "Publicar" : "Ocultar"}
                          </button>

                          <button
                            type="button"
                            className="btn-luxury btn-outline"
                            style={{
                              padding: "9px 12px",
                              fontSize: "0.65rem",
                              color: "#ff6b6b",
                              borderColor: "#ffb3b3"
                            }}
                            onClick={async () => {
                              if (!window.confirm("¿Eliminar esta reseña definitivamente?")) return;

                              try {
                                await deleteDoc(doc(db, "resenas", resena.id));
                                setResenasPublicas(prev =>
                                  prev.filter(item => item.id !== resena.id)
                                );
                              } catch (error) {
                                console.error("Error eliminando reseña:", error);
                                alert("No se pudo eliminar la reseña. Revisá permisos de Firebase.");
                              }
                            }}
                          >
                            Eliminar
                          </button>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}

            {mostrarPropuesta && (

  <div style={{
    background: "#fff",
    padding: "35px",
    borderRadius: "30px",
    marginBottom: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.06)"
  }}>

    <h2 style={{
      fontFamily: "Playfair Display",
      marginBottom: "25px",
      fontSize: "2rem"
    }}>
      {editandoPropuestaId
  ? "Editar propuesta"
  : "✨ Nueva propuesta"}
    </h2>

    <div style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(250px,1fr))",
      gap: "15px"
    }}>

      <select
        className="input-field"
        value={tipoPropuesta}
        onChange={(e) => {
          const tipo = e.target.value;
          setTipoPropuesta(tipo);
          setNuevaPropuesta(prev => ({
            ...prev,
            tipo,
            estilo: estiloDefaultPorTipo[tipo] || "personalizado"
          }));
        }}
      >
        <option value="boda">
          Boda
        </option>

        <option value="xv">
          Cumpleaños de 15
        </option>

        <option value="empresas">
          Empresas
        </option>

        <option value="infantil">
          Festejo infantil
        </option>

        <option value="alquiler">
          Alquiler
        </option>
      </select>

      <input
        className="input-field"
        placeholder="Nombre cliente"
        value={clientePropuesta}
        onChange={(e) =>
          setClientePropuesta(e.target.value)
        }
      />

      <input
        type="date"
        className="input-field"
        value={fechaPropuesta}
        onChange={(e) =>
          setFechaPropuesta(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Cantidad invitados"
        value={cantidadInvitados}
        onChange={(e) =>
          setCantidadInvitados(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Espacio salón"
        value={espacioSalon}
        onChange={(e) =>
          setEspacioSalon(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Lugar"
        value={lugarEvento}
        onChange={(e) =>
          setLugarEvento(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Importe total"
        value={importePropuesta}
        onChange={(e) =>
          setImportePropuesta(e.target.value)
        }
      />
      <select
  className="input-field"
  value={monedaPropuesta}
  onChange={(e) =>
    setMonedaPropuesta(e.target.value)
  }
>
  <option value="ARS">
    Pesos argentinos
  </option>

  <option value="USD">
    Dólares
  </option>
</select>

      <input
        className="input-field"
        placeholder="Anticipo"
        value={anticipoPropuesta}
        onChange={(e) =>
          setAnticipoPropuesta(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Cuotas"
        value={cuotasPropuesta}
        onChange={(e) =>
          setCuotasPropuesta(e.target.value)
        }
      />

    </div>

    <textarea
      className="input-field"
      style={{
        height: "120px",
        marginTop: "15px"
      }}
      placeholder="Qué incluye..."
      value={incluyePropuesta}
      onChange={(e) =>
        setIncluyePropuesta(e.target.value)
      }
    />

   <textarea
  className="input-field"
  style={{
    height: "100px"
  }}
  placeholder="Observaciones..."
  value={observacionesPropuesta}
  onChange={(e) =>
    setObservacionesPropuesta(e.target.value)
  }
/>
<div style={{
  marginTop:"25px",
  marginBottom:"25px"
}}>

  <div style={{
    fontSize:"0.8rem",
    letterSpacing:"2px",
    marginBottom:"15px",
    opacity:0.7
  }}>
    ESTILO VISUAL
  </div>

  <div style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap:"15px"
  }}>

    {estilosDisponibles.map(estilo => {

      const activo =
        nuevaPropuesta.estilo === estilo.id;

      return (

        <div
          key={estilo.id}
          onClick={() =>
            setNuevaPropuesta(prev => ({
              ...prev,
              estilo: estilo.id
            }))
          }
          style={{
            cursor:"pointer",
            borderRadius:"22px",
            overflow:"hidden",
            border: activo
              ? "3px solid #c5a059"
              : "1px solid rgba(255,255,255,0.1)",
            transition:"0.3s",
            background:"#111",
            boxShadow: activo
              ? "0 10px 35px rgba(197,160,89,0.25)"
              : "0 5px 20px rgba(0,0,0,0.05)"
          }}
        >

          <div style={{
            height:"140px",
            backgroundImage:
              `url(${estilo.img})`,
            backgroundSize:"cover",
            backgroundPosition:"center"
          }} />

          <div style={{
            padding:"15px",
            textAlign:"center",
            fontWeight:600,
            color:"#fff"
          }}>
            {estilo.nombre}
          </div>

        </div>

      );

    })}

  </div>

</div>

<button
  className="btn-luxury"
  style={{
    marginTop: "20px"
  }}
  onClick={handleCrearPropuesta}
>
  {editandoPropuestaId
  ? "Guardar cambios"
  : "✨ Guardar propuesta"}
</button>
{editandoPropuestaId && (
  <button
    className="btn-luxury btn-outline"
    style={{
      marginTop: "10px",
      marginLeft: "10px"
    }}
    onClick={() => {
      limpiarFormularioPropuesta();
      setMostrarPropuesta(false);
    }}
  >
    Cancelar edición
  </button>
)}

</div>

)}
{propuestas.length > 0 && (

  <div style={{
    marginBottom: "50px"
  }}>

    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "15px",
      flexWrap: "wrap",
      background: "#fff",
      padding: "22px 25px",
      borderRadius: "22px",
      boxShadow: "0 10px 35px rgba(0,0,0,0.05)",
      marginBottom: mostrarPropuestasCreadas ? "25px" : "0"
    }}>

      <div>
        <h2 style={{
          fontFamily: "Playfair Display",
          marginBottom: "4px",
          fontSize: "1.8rem"
        }}>
          Propuestas creadas
        </h2>

        <div style={{
          color: "#777",
          fontSize: "0.9rem"
        }}>
          {propuestas.length} {propuestas.length === 1 ? "propuesta guardada" : "propuestas guardadas"}
        </div>
      </div>

      <button
        type="button"
        className="btn-luxury btn-outline"
        style={{
          minWidth: "210px"
        }}
        onClick={() =>
          setMostrarPropuestasCreadas(prev => !prev)
        }
      >
        {mostrarPropuestasCreadas
          ? "Ocultar propuestas"
          : "Ver propuestas"}
      </button>

    </div>

    {mostrarPropuestasCreadas && (
    <div style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fill,minmax(320px,1fr))",
      gap: "25px"
    }}>

      {propuestas
        .sort((a,b) =>
          b.creada - a.creada
        )
        .map(prop => (

          <div
            key={prop._docId}
            style={{
              background:"#fff",
              padding:"30px",
              borderRadius:"25px",
              boxShadow:
                "0 10px 35px rgba(0,0,0,0.06)"
            }}
          >

            <div style={{
              fontSize:"0.7rem",
              letterSpacing:"2px",
              color:"var(--lb-gold)",
              fontWeight:700,
              marginBottom:"10px"
            }}>
              {etiquetaTipoPropuesta(prop.tipo)}
            </div>

            <h3 style={{
              fontSize:"1.5rem",
              marginBottom:"10px"
            }}>
              {prop.cliente}
            </h3>

            <div style={{
              color:"#777",
              marginBottom:"10px"
            }}>
              📅 {prop.fecha || "Sin fecha"}
            </div>

            <div style={{
              color:"#777",
              marginBottom:"20px"
            }}>
              👥 {prop.invitados} invitados
            </div>

            <div style={{
              fontSize:"2rem",
              fontWeight:700,
              marginBottom:"25px"
            }}>
              {formatearImportePropuesta(prop.presupuesto, prop.moneda)}
            </div>

           <button
  className="btn-luxury"
  style={{
    width:"100%"
  }}
  onClick={() => {

    window.open(
      `/propuesta/${prop._docId}`,
      "_blank"
    );

  }}
>
  ✨ Ver propuesta
</button>
<button
  className="btn-luxury btn-outline"
  style={{
    width:"100%",
    marginTop:"10px"
  }}
  onClick={() => {

    const link =
      window.location.origin +
      "/propuesta/" +
      prop._docId;

    compartirLink({
      link,
      titulo: "Propuesta Luisina Bagnaroli",
      texto: "Te comparto la propuesta personalizada para tu evento.",
      mensajeCopiado: "Link de propuesta copiado"
    });

  }}
>
  📲 Compartir propuesta
</button>
<button
  className="btn-luxury btn-outline"
  style={{
    width:"100%",
    marginTop:"10px",
    background: reciboPropuestaId === prop._docId ? "#f4ece0" : "transparent"
  }}
  onClick={() => abrirPanelRecibos(prop)}
>
  Recibos
</button>

{reciboPropuestaId === prop._docId && (() => {
  const resumenRecibos = obtenerResumenRecibos(prop);
  const recibosOrdenados = [...(prop.recibos || [])]
    .sort((a, b) => (b.creada || 0) - (a.creada || 0));
  const requiereCotizacion = monedaRecibo !== resumenRecibos.monedaPresupuesto;

  return (
    <div style={{
      marginTop:"15px",
      padding:"18px",
      borderRadius:"18px",
      background:"#f8f6f2",
      border:"1px solid #eadfce"
    }}>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:"8px",
        marginBottom:"15px"
      }}>
        <div style={{fontSize:"0.75rem", color:"#777"}}>
          Presupuesto<br />
          <strong style={{color:"#222"}}>{formatearDineroRecibo(resumenRecibos.presupuesto, resumenRecibos.monedaPresupuesto)}</strong>
        </div>
        <div style={{fontSize:"0.75rem", color:"#777"}}>
          Entregado<br />
          <strong style={{color:"#2f7d32"}}>{formatearDineroRecibo(resumenRecibos.totalEntregado, resumenRecibos.monedaPresupuesto)}</strong>
        </div>
        <div style={{fontSize:"0.75rem", color:"#777"}}>
          Saldo<br />
          <strong style={{color:"#9a6a1f"}}>{formatearDineroRecibo(resumenRecibos.saldo, resumenRecibos.monedaPresupuesto)}</strong>
        </div>
      </div>

      <input
        id={"formulario-recibo-" + prop._docId}
        className="input-field"
        type="date"
        value={fechaRecibo}
        onChange={(e) => setFechaRecibo(e.target.value)}
        style={{marginBottom:"10px"}}
      />

      <input
        className="input-field"
        placeholder="Nombre de quien realiza el pago"
        value={nombrePagadorRecibo}
        onChange={(e) => setNombrePagadorRecibo(e.target.value)}
      />

      <input
        className="input-field"
        placeholder="Importe entregado"
        value={importeRecibo}
        onChange={(e) => setImporteRecibo(e.target.value)}
      />

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gap:"10px"
      }}>
        <select
          className="input-field"
          value={monedaRecibo}
          onChange={(e) => setMonedaRecibo(e.target.value)}
        >
          <option value="ARS">Pesos argentinos</option>
          <option value="USD">Dólares</option>
        </select>

        <select
          className="input-field"
          value={medioPagoRecibo}
          onChange={(e) => setMedioPagoRecibo(e.target.value)}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <input
        className="input-field"
        placeholder="Valor del dólar tomado (cotización)"
        value={cotizacionRecibo}
        onChange={(e) => setCotizacionRecibo(e.target.value)}
      />

      <textarea
        className="input-field"
        placeholder="Observación opcional"
        value={observacionRecibo}
        onChange={(e) => setObservacionRecibo(e.target.value)}
        style={{height:"80px", resize:"none"}}
      />

      <button
        className="btn-luxury"
        style={{width:"100%"}}
        onClick={() => handleGuardarRecibo(prop)}
      >
        {reciboEditandoId ? "Actualizar y compartir recibo" : "Guardar y compartir recibo"}
      </button>

      {reciboEditandoId && (
        <button
          className="btn-luxury btn-outline"
          style={{width:"100%", marginTop:"8px"}}
          onClick={limpiarFormularioRecibo}
        >
          Cancelar edición
        </button>
      )}

      {recibosOrdenados.length > 0 && (
        <div style={{marginTop:"18px"}}>
          <button
            type="button"
            className="btn-luxury btn-outline"
            style={{width:"100%", padding:"10px 12px", fontSize:"0.7rem"}}
            onClick={() =>
              setHistorialRecibosPropuestaId(prev =>
                prev === prop._docId ? null : prop._docId
              )
            }
          >
            {historialRecibosPropuestaId === prop._docId
              ? "Ocultar historial de recibos"
              : `Ver historial de recibos (${recibosOrdenados.length})`}
          </button>

          {historialRecibosPropuestaId === prop._docId && (
          <div style={{marginTop:"12px"}}>
          <div style={{
            fontSize:"0.72rem",
            letterSpacing:"1.5px",
            color:"#777",
            marginBottom:"8px"
          }}>
            HISTORIAL DE ENTREGAS
          </div>

          {recibosOrdenados.map(recibo => (
            <div
              key={recibo.id}
              style={{
                background:"#fff",
                borderRadius:"14px",
                padding:"12px",
                marginBottom:"8px",
                border: recibo.estado === "anulado" ? "1px solid #e5b5b5" : "1px solid #e8e0d4",
                opacity: recibo.estado === "anulado" ? 0.62 : 1
              }}
            >
              <div style={{fontWeight:700, fontSize:"0.85rem"}}>
                {formatearDineroRecibo(recibo.importeEntrega, recibo.monedaEntrega)}
              </div>
              <div style={{fontSize:"0.75rem", color:"#777", marginTop:"3px"}}>
                {recibo.fechaEntrega ? new Date(recibo.fechaEntrega + "T00:00:00").toLocaleDateString("es-AR") : formatearFechaRecibo(recibo.creada)} · {recibo.medioPago || "Sin medio"} · aplicado {formatearDineroRecibo(recibo.aplicadoPresupuesto, resumenRecibos.monedaPresupuesto)}
              </div>
              <div style={{fontSize:"0.75rem", color:"#777", marginTop:"3px"}}>
                Saldo posterior: {formatearDineroRecibo(recibo.saldoPosterior, resumenRecibos.monedaPresupuesto)}
              </div>
              {recibo.estado === "anulado" && (
                <div style={{fontSize:"0.75rem", color:"#b04444", marginTop:"5px"}}>
                  Anulado: {recibo.motivoAnulacion || "sin motivo"}
                </div>
              )}

              <div style={{display:"flex", gap:"6px", marginTop:"10px", flexWrap:"wrap"}}>
                <button
                  type="button"
                  className="btn-luxury btn-outline"
                  style={{padding:"8px 10px", fontSize:"0.65rem"}}
                  onClick={() => handleCompartirRecibo(prop, recibo)}
                >
                  Compartir
                </button>

                {recibo.estado !== "anulado" && (
                  <button
                    type="button"
                    className="btn-luxury btn-outline"
                    style={{padding:"8px 10px", fontSize:"0.65rem"}}
                    onClick={() => {
                      handleEditarRecibo(recibo);
                      setReciboPropuestaId(prop._docId);
                      setHistorialRecibosPropuestaId(null);
                      setTimeout(() => {
                        document.getElementById("formulario-recibo-" + prop._docId)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}

                {recibo.estado !== "anulado" && (
                  <button
                    type="button"
                    className="delete-btn"
                    style={{fontSize:"0.75rem", color:"#b04444"}}
                    onClick={() => handleAnularRecibo(prop, recibo)}
                  >
                    Anular
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
})()}
<button
  className="btn-luxury btn-outline"
  style={{
    width:"100%",
    marginTop:"10px"
  }}
  onClick={() =>
    handleEditarPropuesta(prop)
  }
>
  ✏️ Editar propuesta
</button>

<button
  className="delete-btn"
  style={{
    width:"100%",
    marginTop:"15px",
    fontSize:"0.9rem",
    color:"#c44"
  }}
  onClick={() =>
    handleEliminarPropuesta(prop)
  }
>
  🗑️ Eliminar propuesta
</button>

          </div>

      ))}

    </div>
    )}

  </div>

)}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              background: "#fff",
              padding: "22px 25px",
              borderRadius: "22px",
              boxShadow: "0 10px 35px rgba(0,0,0,0.05)",
              marginBottom: mostrarEventos ? "25px" : "0"
            }}>
              <div>
                <h2 style={{
                  fontFamily: "Playfair Display",
                  marginBottom: "4px",
                  fontSize: "1.8rem"
                }}>
                  Eventos creados
                </h2>
                <div style={{ color: "#777", fontSize: "0.9rem" }}>
                  {eventos.length} {eventos.length === 1 ? "evento guardado" : "eventos guardados"}
                </div>
              </div>
              <button
                type="button"
                className="btn-luxury btn-outline"
                style={{ minWidth: "210px" }}
                onClick={() => setMostrarEventos(prev => !prev)}
              >
                {mostrarEventos ? "Ocultar eventos" : "Ver eventos"}
              </button>
            </div>

            {mostrarEventos && (
            <div className="grid-container">
             {[...eventos]
  .sort((a, b) => {
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return new Date(a.fecha) - new Date(b.fecha);
  })
  .map(e => (
                <div 
  className="project-card"
  style={{
    display: 'flex',
    flexDirection: 'column'
  }}
>

                  <div className="card-content">
                    <h3 className="card-title">{e.nombre}</h3>
                    {e.cerrado && (
  <div style={{
    marginTop: "10px",
    padding: "6px 12px",
    background: "rgba(197,160,89,0.1)",
    border: "1px solid rgba(197,160,89,0.3)",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--lb-gold)",
    display: "inline-block"
  }}>
    🔒 EVENTO CERRADO
  </div>
)}
                    


                    <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '15px'
}}>


  <button 
    className="btn-luxury btn-outline"
    style={{width: '100%'}}
    onClick={() => setEventoActivoId(e.id)}
  >
    Configurar
  </button>

 <button
  className="btn-luxury"
  style={{width: '100%'}}
  onClick={() => {
    const link = window.location.origin + "/evento/" + e.id;

    compartirLink({
      link,
      titulo: e.nombre || "Evento Luisina Bagnaroli",
      texto: "Te comparto el enlace para organizar las mesas del evento.",
      mensajeCopiado: "Link de evento copiado"
    });
  }}
>
  Compartir evento
</button>
<button
  className="btn-luxury btn-outline"
  style={{width: "100%"}}
  onClick={() => {
    const link = window.location.origin + "/encuesta/" + e.id;

    compartirLink({
      link,
      titulo: "Encuesta " + (e.nombre || "evento"),
      texto: "Te comparto la encuesta para contarnos cómo viviste el evento.",
      mensajeCopiado: "Link de encuesta copiado"
    });
  }}
>
  ★ Compartir encuesta
</button>
<button
  className="btn-luxury btn-outline"
  style={{ width: "100%" }}
 onClick={async () => {
  const snapshot = await getDocs(
    query(
      collection(db, "mensajes"),
      where("eventoId", "==", e.id)
    )
  );

  const mensajes = snapshot.docs.map(doc => doc.data());

  descargarMensajesPDF(mensajes, e.nombre);
}}
>
  📄 Descargar mensajes
</button>
<button
  className="btn-luxury btn-outline"
  style={{width: '100%'}}
  onClick={() => generarQRPDF(e.id)}
>
  📱 Descargar QR
</button>

  <button
    className="delete-btn"
    onClick={(event) => handleEliminarProyecto(e._docId, e.id, event)}
  >
    🗑️ Eliminar
  </button>
  

</div>
                  </div>
                </div>
              ))}
              {eventos.length === 0 && (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '100px', border: '2px dashed #eee', borderRadius: '30px'}}>
                  <p>No hay proyectos activos. Comienza creando uno nuevo.</p>
                </div>
              )}
            </div>
            )}
          </section>
        </main>
      </div>
    );
  }
  if (!eventoActual) {
  return (
    <div style={{padding: "40px", fontSize: "18px"}}>
      Cargando evento...
    </div>
  );
}

  // ---------------------------------------------------------
  // RENDER: EDITOR DE EVENTO (WORKSPACE)
  // ---------------------------------------------------------
 if (pantallaInicio && esCliente) {
  return (
    <div className="splash-screen">

      <div className="splash-overlay" />

      <div className="particles">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>
      <div className="splash-content">

        <h1 className="splash-logo">
          Luisina Bagnaroli
        </h1>

        <p className="splash-sub">
  El mejor momento para celebrar, es <strong>siempre</strong>
</p>

        <button 
          className="btn-luxury splash-btn"
          onClick={() => {
  const splash = document.querySelector('.splash-screen');

  if (splash) {
    splash.classList.add('fade-out');
    splash.style.background = "black"; // H esto es para probar
  }

  setTimeout(() => {
    setPantallaInicio(false);
  }, 1500);
}}
        >
          ✨ Continuar
        </button>

      </div>

    </div>
  );
}
if (esVistaCheckin && eventoActual) {

  const invitadosCheckin = eventoActual.invitados || [];
  const mesasCheckin = eventoActual.mesas || [];

  const presentes =
    invitadosCheckin.filter(
      i => Boolean(i.checkin)
    ).length;

  const faltan =
    invitadosCheckin.length - presentes;

  const totalBrindis = invitadosBrindis.length;
  const pagadosBrindis = invitadosBrindis.filter(i => i.pago).length;
  const impagosBrindis = totalBrindis - pagadosBrindis;
  const ingresadosBrindis = invitadosBrindis.filter(i => i.checkin).length;
  const valorBrindis = Number(eventoActual.valorTarjetaBrindis || 0);
  const pendienteBrindis = valorBrindis ? impagosBrindis * valorBrindis : null;

  return (

    <div style={{
      minHeight: "100vh",
      background: "#f4f1ea",
      padding: "20px"
    }}>

      <div style={{
        maxWidth: "700px",
        margin: "0 auto"
      }}>

        <h1 style={{
          fontFamily: "Brittany Signature",
          fontSize: "3rem",
          textAlign: "center",
          marginBottom: "10px"
        }}>
          Check-In
        </h1>

        <p style={{
          textAlign: "center",
          marginBottom: "30px"
        }}>
          {eventoActual.nombre}
        </p>

        {brindisHabilitado && (
          <button
            className="btn-luxury"
            style={{
              width: "100%",
              marginBottom: "20px",
              background: "#1a1a1a"
            }}
            onClick={() => {
              document
                .getElementById("checkin-brindis")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Check-in brindis
          </button>
        )}

        <div style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px"
        }}>

          <div style={{
            flex: 1,
            background: "#fff",
            padding: "20px",
            borderRadius: "20px",
            textAlign: "center"
          }}>
            <div style={{fontSize:"2rem"}}>
              OK
            </div>

            <div>
              PRESENTES
            </div>

            <strong>
              {presentes}
            </strong>
          </div>

          <div style={{
            flex: 1,
            background: "#fff",
            padding: "20px",
            borderRadius: "20px",
            textAlign: "center"
          }}>
            <div style={{fontSize:"2rem"}}>
              ⏳
            </div>

            <div>
              FALTAN
            </div>

            <strong>
              {faltan}
            </strong>
          </div>

        </div>

        <input
          type="text"
          placeholder="Buscar invitado..."
          value={busquedaCheckin}
          onChange={(e) =>
            setBusquedaCheckin(e.target.value)
          }
          className="input-field"
        />

        {errorCheckin && (
          <div style={{
            background: "#fff0f0",
            border: "1px solid #ffb4b4",
            color: "#9b1c1c",
            padding: "12px 14px",
            borderRadius: "14px",
            marginBottom: "15px",
            fontSize: "0.9rem"
          }}>
            {errorCheckin}
          </div>
        )}

        <div style={{
          display:"flex",
          gap:"10px",
          marginBottom:"20px"
        }}>

          <button
            className="btn-luxury btn-outline"
            onClick={() =>
              setFiltroCheckin("todos")
            }
          >
            Todos
          </button>

          <button
            className="btn-luxury btn-outline"
            onClick={() =>
              setFiltroCheckin("presentes")
            }
          >
            Presentes
          </button>

          <button
            className="btn-luxury btn-outline"
            onClick={() =>
              setFiltroCheckin("faltan")
            }
          >
            Faltan
          </button>

        </div>

        {invitadosCheckin

           .filter(inv =>
            String(inv.nombre || "")
              .toLowerCase()
              .includes(
                busquedaCheckin.toLowerCase()
              )
          )

          .filter(inv => {

            if (filtroCheckin === "presentes") {
              return inv.checkin;
            }

            if (filtroCheckin === "faltan") {
              return !inv.checkin;
            }

            return true;

          })

          .sort((a,b) =>
            String(a.nombre || "").localeCompare(String(b.nombre || ""))
          )

          .map(inv => {

            const mesa =
              mesasCheckin.find(
                m => m.id === inv.mesaId
              );

            return (

              <div
                key={inv.id}
                style={{
                  background:"#fff",
                  padding:"18px",
                  borderRadius:"18px",
                  marginBottom:"12px",
                  border: inv.checkin
                    ? "2px solid #6bbf59"
                    : "1px solid #eee"
                }}
              >

                <div style={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center"
                }}>

                  <div>

                    <div style={{
                      fontWeight:600
                    }}>
                      {inv.checkin ? "🟢 " : ""}
                      {inv.nombre || "Sin nombre"}
                    </div>

                    <div style={{
                      fontSize:"0.8rem",
                      color:"#777"
                    }}>
                      {mesa
                        ? `Mesa ${mesa.numero}`
                        : "Sin mesa"}
                    </div>

                    {inv.horaIngreso && !Number.isNaN(new Date(inv.horaIngreso).getTime()) && (
                      <div style={{
                        fontSize:"0.75rem",
                        color:"#999"
                      }}>
                        Ingresó:
                        {" "}
                        {new Date(
                          inv.horaIngreso
                        ).toLocaleTimeString()}
                      </div>
                    )}

                  </div>

                  <button
                    className="btn-luxury"
                    style={{
                      background: inv.checkin
                        ? "#999"
                        : "#c5a059"
                    }}
                    disabled={checkinActualizandoId !== null}
                    onClick={() => handleToggleCheckin(inv.id)}
                  >
                    {checkinActualizandoId === inv.id
                      ? "Guardando..."
                      : inv.checkin
                      ? "Desmarcar"
                      : "Ingresó"}
                  </button>

                </div>

              </div>

            );

          })}

        {brindisHabilitado && (
          <div
            id="checkin-brindis"
            style={{
            marginTop: "35px",
            paddingTop: "28px",
            borderTop: "2px solid rgba(197,160,89,0.25)"
          }}>
            <div style={{
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "22px",
              padding: "22px",
              marginBottom: "18px"
            }}>
              <div style={{
                fontSize: "0.75rem",
                letterSpacing: "2px",
                color: "#c5a059",
                fontWeight: 700,
                marginBottom: "8px"
              }}>
                BRINDIS
              </div>

              <h2 style={{
                fontSize: "1.4rem",
                marginBottom: "12px"
              }}>
                Invitados al brindis
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                gap: "10px",
                marginBottom: "14px"
              }}>
                <div>Total: <strong>{totalBrindis}</strong></div>
                <div>Pagos: <strong>{pagadosBrindis}</strong></div>
                <div>Impagos: <strong>{impagosBrindis}</strong></div>
                <div>Ingresaron: <strong>{ingresadosBrindis}</strong></div>
              </div>

              {(eventoActual.valorTarjetaBrindis || eventoActual.aliasBrindis) && (
                <div style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "12px",
                  fontSize: "0.9rem",
                  lineHeight: 1.7
                }}>
                  {eventoActual.valorTarjetaBrindis && (
                    <div>Valor tarjeta: <strong>{eventoActual.valorTarjetaBrindis}</strong></div>
                  )}
                  {pendienteBrindis !== null && (
                    <div>Pendiente estimado: <strong>{pendienteBrindis}</strong></div>
                  )}
                  {eventoActual.aliasBrindis && (
                    <div>Alias: <strong>{eventoActual.aliasBrindis}</strong></div>
                  )}
                </div>
              )}
            </div>

            {errorCheckinBrindis && (
              <div style={{
                background: "#fff0f0",
                border: "1px solid #ffb4b4",
                color: "#9b1c1c",
                padding: "12px 14px",
                borderRadius: "14px",
                marginBottom: "15px",
                fontSize: "0.9rem"
              }}>
                {errorCheckinBrindis}
              </div>
            )}

            <input
              type="text"
              placeholder="Buscar invitado al brindis..."
              value={busquedaCheckinBrindis}
              onChange={(e) => setBusquedaCheckinBrindis(e.target.value)}
              className="input-field"
            />

            <div
              onClick={() => setMostrarBrindis(prev => !prev)}
              style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap"
            }}>
              {[
                ["todos", "Todos"],
                ["pagos", "Pagos"],
                ["impagos", "Impagos"],
                ["ingresaron", "Ingresaron"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  className="btn-luxury btn-outline"
                  onClick={() => setFiltroCheckinBrindis(key)}
                  style={{
                    background: filtroCheckinBrindis === key ? "var(--lb-gold)" : "transparent",
                    color: filtroCheckinBrindis === key ? "#fff" : "var(--lb-gold)"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {invitadosBrindis
              .filter(inv =>
                String(inv.nombre || "")
                  .toLowerCase()
                  .includes(busquedaCheckinBrindis.toLowerCase())
              )
              .filter(inv => {
                if (filtroCheckinBrindis === "pagos") return inv.pago;
                if (filtroCheckinBrindis === "impagos") return !inv.pago;
                if (filtroCheckinBrindis === "ingresaron") return inv.checkin;
                return true;
              })
              .sort((a,b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
              .map(inv => (
                <div
                  key={inv.id}
                  style={{
                    background: inv.checkin
                      ? "#dff5dc"
                      : "#fff",
                    padding: "18px",
                    borderRadius: "18px",
                    marginBottom: "12px",
                    border: inv.checkin
                      ? "2px solid #2f9e44"
                      : inv.pago
                      ? "2px solid rgba(47,158,68,0.55)"
                      : "2px solid rgba(220,80,80,0.55)",
                    boxShadow: inv.checkin
                      ? "0 10px 28px rgba(47,158,68,0.18)"
                      : "none"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{fontWeight: 700}}>{inv.nombre || "Sin nombre"}</div>
                      <div style={{
                        marginTop: "5px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: inv.pago ? "#337a2f" : "#b43b3b"
                      }}>
                        {inv.pago
                          ? "PAGO" + (inv.metodoPago ? " - " + inv.metodoPago.toUpperCase() : "")
                          : "IMPAGO"}
                      </div>

                    </div>

                    <div style={{display: "flex", flexDirection: "column", gap: "8px", minWidth: "150px"}}>
                      {!inv.pago ? (
                        <>
                          <button
                            className="btn-luxury"
                            disabled={brindisActualizandoId !== null}
                            onClick={() => handleToggleCheckinBrindis(inv.id, true, "efectivo")}
                            style={{width: "100%"}}
                          >
                            Pagar EF e ingresar
                          </button>
                          <button
                            className="btn-luxury btn-outline"
                            disabled={brindisActualizandoId !== null}
                            onClick={() => handleToggleCheckinBrindis(inv.id, true, "transferencia")}
                            style={{width: "100%"}}
                          >
                            Pagar TR e ingresar
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-luxury"
                          disabled={brindisActualizandoId !== null}
                          onClick={() => handleToggleCheckinBrindis(inv.id)}
                          style={{
                            width: "100%",
                            background: inv.checkin ? "#2f9e44" : "#c5a059"
                          }}
                        >
                          {brindisActualizandoId === inv.id
                            ? "Guardando..."
                            : inv.checkin
                            ? "Desmarcar"
                            : "Ingresó"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

      </div>

    </div>

  );

}
if (esVistaLista && eventoActual) {
  return (
  <div style={{
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f4f1ea, #eae3d6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  }}>

    <div style={{
      width: "100%",
      maxWidth: "420px",
      padding: "40px 30px",
      borderRadius: "22px",
      background: "linear-gradient(145deg, #c9a86a, #b3935c)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
      textAlign: "center"
    }}>

      {/* NOMBRE EVENTO */}
      <h2 style={{
        fontFamily: "Brittany Signature",
        fontSize: "2.6rem",
        marginBottom: "10px"
      }}>
        {eventoActual.nombre}
      </h2>

      {/* SUBTITULO */}
      <div style={{
        fontSize: "0.85rem",
        letterSpacing: "2px",
        textTransform: "uppercase",
        opacity: 0.7,
        marginBottom: "25px"
      }}>
        Buscar mi mesa
      </div>

      {/* INPUT */}
      <input
        type="text"
        placeholder="Escribí tu nombre..."
        value={busquedaInvitado}
        onChange={(e) => setBusquedaInvitado(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          marginBottom: "15px",
          fontSize: "1rem",
          textAlign: "center",
          background: "#f9f7f4",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.1)"
        }}
      />

      {/* BOTÓN */}
      <button
        onClick={() => {

  const busqueda = normalizarTexto(busquedaInvitado)
    .split(" ")
    .filter(p => p.length > 0);

  const invitado = eventoActual.invitados.find(inv => {
    const nombreInvitado = normalizarTexto(inv.nombre)
      .split(" ")
      .filter(p => p.length > 0);

    return busqueda.every(palabraBuscada =>
      nombreInvitado.some(palabraInv =>
        palabraInv.includes(palabraBuscada)
      )
    );
  });

  if (!invitado) {
    setResultadoMesa("no");
    return;
  }

  if (!invitado.mesaId) {
    setResultadoMesa("sin");
    return;
  }

  const mesa = eventoActual.mesas.find(m => m.id === invitado.mesaId);

  if (!mesa) {
    setResultadoMesa("sin");
    return;
  }

  setResultadoMesa(mesa.numero);
}}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
          fontSize: "0.95rem",
          cursor: "pointer"
        }}
      >
        Buscar
      </button>

      {/* RESULTADO */}
      {resultadoMesa && (
        <div style={{
          marginTop: "25px",
          fontSize: "1.2rem",
          fontWeight: "600"
        }}>
          {resultadoMesa === "no"
            ? "No encontramos tu nombre"
            : resultadoMesa === "sin"
            ? "Todavía no tenés mesa asignada"
            : `Tu mesa es: ${resultadoMesa}`}
        </div>
      )}

      {/* FIRMA */}
      <div style={{
        marginTop: "40px",
        fontSize: "0.75rem",
        opacity: 0.8
      }}>
        <div style={{
          fontFamily: "Brittany Signature",
          fontSize: "1.5rem"
        }}>
          Luisina Bagnaroli
        </div>

        <div>
          El mejor momento para celebrar, es <strong>SIEMPRE</strong>
        </div>
      </div>

    </div>
  </div>
);
}
  return (
  <div className="app-container" style={{background: '#f9f7f4'}}>
    <div className="editor-layout">

    <aside className="editor-sidebar">
        {!esCliente && (
  <button 
    onClick={() => setEventoActivoId(null)} 
    style={{
      background:'none',
      border:'none',
      color:'var(--lb-gray-mid)',
      cursor:'pointer',
      marginBottom: '20px',
      textAlign:'left',
      fontWeight:700
    }}
  >
    ← VOLVER AL PANEL
  </button>
)}

        <h2 className="brand-title" style={{fontSize: '1.8rem', marginBottom: '30px'}}>{eventoActual.nombre}</h2>
        <input
  type="date"
  className="input-field"
  value={eventoActual.fecha || ""}
  onChange={(e) => handleActualizarEvento({ fecha: e.target.value })}
  style={{marginBottom: '20px'}}
  disabled={esCliente}
/>
{!eventoActual.cerrado && (
  <button
    className="btn-luxury"
    style={{marginBottom: '20px', background: 'var(--lb-dark)'}}
    onClick={() => {
      const confirmar = window.confirm(
        "Al cerrar la lista de invitados ya no podrás realizar cambios.\n\n¿Deseas continuar?"
      );
      if (confirmar) {
        handleActualizarEvento({ cerrado: true });
      }
    }}
  >
     Cerrar evento
    
  </button>
)}

{eventoActual.cerrado && !esCliente && (

  <div style={{
    marginBottom: '20px'
  }}>

    <p style={{
      fontSize: '0.8rem',
      color: 'var(--lb-gold)',
      fontWeight: 600,
      marginBottom: '15px'
    }}>
       Evento cerrado
    </p>

    <button
      className="btn-luxury"
      style={{
        width: "100%"
      }}
      onClick={() => {

        window.open(
          `/evento/${eventoActual.id}?vista=checkin`,
          "_blank"
        );

      }}
    >
      ✔ Abrir recepción
    </button>

    {brindisHabilitado && (
      <button
        className="btn-luxury btn-outline"
        style={{
          width: "100%",
          marginTop: "10px"
        }}
        onClick={() => {
          window.open(
            "/evento/" + eventoActual.id + "?vista=checkin#brindis",
            "_blank"
          );
        }}
      >
        Abrir recepción brindis
      </button>
    )}
    <button
  className="btn-luxury"
  style={{
    width: "100%",
    marginTop: "10px",
    background: "#1a1a1a"
  }}
  onClick={() => {

    const link =
      window.location.origin +
      "/evento/" +
      eventoActual.id +
      "?vista=checkin";

    compartirLink({
      link,
      titulo: "Recepcion " + (eventoActual.nombre || "del evento"),
      texto: "Te comparto el enlace de recepcion para hacer el check-in del evento.",
      mensajeCopiado: "Link de recepcion copiado"
    });

  }}
>
  📲 Compartir recepción
</button>

{brindisHabilitado && (
  <button
    className="btn-luxury btn-outline"
    style={{
      width: "100%",
      marginTop: "10px"
    }}
    onClick={() => {
      const link =
        window.location.origin +
        "/evento/" +
        eventoActual.id +
        "?vista=checkin#brindis";

      compartirLink({
        link,
        titulo: "Check-in brindis " + (eventoActual.nombre || "del evento"),
        texto: "Te comparto el enlace directo para hacer el check-in del brindis.",
        mensajeCopiado: "Link de check-in brindis copiado"
      });
    }}
  >
    Compartir brindis
  </button>
)}

  </div>

)}

        <div className="bulk-box">
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--lb-gold)', marginBottom: '10px'}}>IMPORTACIÓN RÁPIDA</p>
          <textarea 
          ref={textareaRef}
  id="bulk-guests"
  className="input-field"
  value={invitadosBulk}
onChange={(e) => setInvitadosBulk(e.target.value)}
  style={{height: '120px', resize: 'none'}}
  placeholder="Pega la lista separada por renglones..."
  disabled={estaBloqueado}
/>

{previewInvitados.length > 0 && (
  <div style={{
    marginBottom: "15px",
    border: "1px solid #eee",
    borderRadius: "14px",
    overflow: "hidden"
  }}>

    {previewInvitados.map(inv => {

      const seleccionado =
        invitadoSeleccionado === inv.tempId;

      return (

        <div
          key={inv.tempId}
          onClick={() =>
            setInvitadoSeleccionado(inv.tempId)
          }
          style={{
            padding: "12px 14px",
            cursor: "pointer",
            background: seleccionado
              ? "#f4ece0"
              : "#fff",
            borderBottom: "1px solid #eee",
            transition: "0.2s",
            boxShadow: seleccionado
              ? "inset 0 0 0 2px #c5a059"
              : "none"
          }}
        >

          <div style={{
            fontWeight: 500,
            fontSize: "0.9rem"
          }}>
            {inv.nombre}
          </div>

          {inv.tags.length > 0 && (
            <div style={{
              marginTop: "5px",
              fontSize: "0.7rem",
              color: "#888"
            }}>
              {inv.tags.map(t => {

                if (t === "bebe") return "BEBÉ";
                if (t === "infantil") return "INFANTIL";
                if (t === "vegano") return "VEGANO";
                if (t === "sintacc") return "SIN TACC";
                if (t === "diabetico") return "DIABÉTICO";

                return t;

              }).join(" · ")}
            </div>
          )}

        </div>

      );

    })}

  </div>
)}
<button
  className="btn-luxury btn-outline"
  style={{
    width: "100%",
    marginBottom: "15px"
  }}
  type="button"
  onClick={() => {

    const lineas = invitadosBulk
      .split("\n")
      .filter(l => l.trim() !== "");

    const invitados = lineas.map((nombre, index) => ({
      tempId: index,
      nombre: nombre.trim(),
      tags: []
    }));

    setPreviewInvitados(invitados);

  }}
>
  Agregar condiciones
</button>
<div style={{
  display: "flex",
  gap: "8px",
  marginTop: "12px",
  flexWrap: "nowrap",
  overflowX: "auto",
  paddingBottom: "5px"
}}>

  {[
    {
      key: "bebe",
      label: "👶 Bebé",
      color: "#dcecff"
    },
    {
      key: "infantil",
      label: "🧸 Infantil",
      color: "#ffe8d6"
    },
    {
      key: "vegano",
      label: "Vegano",
      color: "#e3f4dc"
    },
    {
      key: "sintacc",
      label: "Sin TACC",
      color: "#fff3cd"
    },
    {
      key: "diabetico",
      label: "Diabético",
      color: "#ffd6d6"
    }
  ].map(tag => {

    const activo = tagsInvitado.includes(tag.key);

    return (
      <button
        key={tag.key}
        type="button"
        onClick={() => {

  if (invitadoSeleccionado === null) {
    alert("Tocá un invitado primero");
    return;
  }

  setPreviewInvitados(prev =>
    prev.map(inv => {

      if (inv.tempId !== invitadoSeleccionado) {
        return inv;
      }

      const yaTiene =
        inv.tags.includes(tag.key);

      return {
        ...inv,
        tags: yaTiene
          ? inv.tags.filter(t => t !== tag.key)
          : [...inv.tags, tag.key]
      };

    })
  );

}}
        style={{
          border: activo
            ? "2px solid #000"
            : "1px solid #ddd",
          background: tag.color,
          padding: "8px 14px",
          borderRadius: "30px",
          cursor: "pointer",
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          fontWeight: 600,
          opacity: activo ? 1 : 0.7,
          transition: "0.2s"
        }}
      >
        {tag.label}
      </button>
    );
  })}

</div>
          <button 
  className="btn-luxury" 
  onClick={handleImportarMasivo}
  disabled={estaBloqueado}
  style={{
    width: '100%',
    marginBottom: '30px',
    opacity: estaBloqueado ? 0.5 : 1
  }}
>
  Cargar Invitados
</button>
        </div>

        <input 
  className="input-field" 
  placeholder="Buscar invitado..."
  value={terminoBusqueda}
  onChange={(e) => setTerminoBusqueda(e.target.value)}
  disabled={estaBloqueado}
/>
<button
  type="button"
  onClick={() =>
    setMostrarInvitados(prev => !prev)
  }
  className="btn-luxury btn-outline"
  style={{
    width: "100%",
    marginTop: "20px",
    marginBottom: "10px"
  }}
>
  {mostrarInvitados
    ? `▲ Ocultar invitados (${invitadosCheckin.length})`
    : `▼ Ver invitados (${invitadosCheckin.length})`}
</button>
        {mostrarInvitados && (
<div className="guest-list-container">
          {invitadosCheckin
            .filter(i => String(i.nombre || "").toLowerCase().includes(terminoBusqueda.toLowerCase()))
            .map(inv => (
  <div 
    key={inv.id} 
    className="guest-item" 
    style={{
      opacity: inv.mesaId ? 0.5 : 1,
      pointerEvents: estaBloqueado ? 'none' : 'auto'
    }}
  >
    <span style={{
      fontSize: '0.85rem',
      fontWeight: 500
    }}>
      <>
  {inv.nombre}

  {inv.tags?.length > 0 && (
    <span style={{
      display: "block",
      fontSize: "0.7rem",
      color: "#888",
      marginTop: "3px"
    }}>
      {inv.tags.map(tag => {

        if (tag === "bebe") return "BEBÉ";
        if (tag === "infantil") return "INFANTIL";
        if (tag === "vegano") return "VEGANO";
        if (tag === "sintacc") return "SIN TACC";
        if (tag === "diabetico") return "DIABÉTICO";

        return tag;

      }).join(" · ")}
    </span>
  )}
</>
    </span>

    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>

      {inv.mesaId && (
        <span className="badge-assigned">
          SENTADO
        </span>
      )}
      <button
  className="delete-btn"
  style={{
    fontSize:'0.9rem',
    color:'#c5a059'
  }}
  onClick={(e) => {

    e.stopPropagation();

    setEditandoInvitado(inv.id);
    setNombreEditado(inv.nombre);

  }}
>
  ✏️
</button>

      <button 
  className="delete-btn" 
  style={{fontSize:'0.9rem'}}
  onClick={(e) => {
    e.stopPropagation();
    handleEliminarInvitadoTotal(inv.id);
  }}
  disabled={estaBloqueado}
>
  ×
</button>

    </div>
    {editandoInvitado === inv.id && (

  <div style={{
    marginTop: "10px",
    padding: "12px",
    borderRadius: "12px",
    background: "#f8f6f2",
    border: "1px solid #ddd"
  }}>

    <input
      value={nombreEditado}
      onChange={(e) =>
        setNombreEditado(e.target.value)
      }
      className="input-field"
      style={{marginBottom: "10px"}}
    />

    <div style={{
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "10px"
    }}>

      {[
        "bebe",
        "infantil",
        "vegano",
        "sintacc",
        "diabetico"
      ].map(tag => {

        const activo =
          inv.tags?.includes(tag);

        return (

          <button
            key={tag}
            type="button"
            onClick={() => {

              const nuevosInvitados =
                eventoActual.invitados.map(i => {

                  if (i.id !== inv.id) return i;

                  const yaTiene =
                    i.tags?.includes(tag);

                  return {
                    ...i,
                    tags: yaTiene
                      ? i.tags.filter(t => t !== tag)
                      : [...(i.tags || []), tag]
                  };

                });

              handleActualizarEvento({
                invitados: nuevosInvitados
              });

            }}
            style={{
              padding: "6px 10px",
              borderRadius: "20px",
              border: activo
                ? "2px solid #000"
                : "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.7rem"
            }}
          >
            {tag}
          </button>

        );

      })}

    </div>

    <button
      className="btn-luxury"
      style={{width:"100%"}}
      onClick={() => {

        const nuevosInvitados =
          eventoActual.invitados.map(i =>
            i.id === inv.id
              ? {
                  ...i,
                  nombre: nombreEditado
                }
              : i
          );

        handleActualizarEvento({
          invitados: nuevosInvitados
        });

        setEditandoInvitado(null);

      }}
    >
      Guardar cambios
    </button>

  </div>

)}
  </div>
))
          }
        </div>
        )}

        {brindisHabilitado || !esCliente ? (
          <div style={{
            marginTop: "26px",
            padding: "22px",
            borderRadius: "22px",
            background: "#fff",
            border: "1px solid rgba(197,160,89,0.18)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.04)"
          }}>
            <div
              onClick={() => setMostrarBrindis(prev => !prev)}
              style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              marginBottom: "14px"
            }}>
              <div>
                <div style={{
                  fontSize: "0.7rem",
                  letterSpacing: "2px",
                  color: "var(--lb-gold)",
                  fontWeight: 800,
                  marginBottom: "5px"
                }}>
                  BRINDIS
                </div>
                <strong>{mostrarBrindis ? "Ocultar invitados al brindis" : "Ver invitados al brindis"}</strong>
                <div style={{fontSize: "0.78rem", color: "#777", marginTop: "5px"}}>
                  {brindisHabilitado
                    ? `${invitadosBrindis.length} invitados · ${invitadosBrindis.filter(i => i.pago).length} pagos`
                    : "No habilitado"}
                </div>
              </div>

              <div style={{display: "flex", gap: "8px", alignItems: "center"}}>
                {!esCliente && (
                  <button
                    type="button"
                    className="btn-luxury btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nuevoEstado = !brindisHabilitado;
                      const confirmar = window.confirm(
                        nuevoEstado
                          ? "¿Desea habilitar brindis?"
                          : "¿Está seguro que quiere deshabilitar brindis?"
                      );

                      if (!confirmar) return;

                      handleActualizarEvento({
                        brindisHabilitado: nuevoEstado,
                        invitadosBrindis: eventoActual.invitadosBrindis || []
                      });
                      setMostrarBrindis(nuevoEstado);
                    }}
                    style={{padding: "10px 14px"}}
                  >
                    {brindisHabilitado ? "Desactivar" : "Habilitar"}
                  </button>
                )}

                <span style={{
                  color: "var(--lb-gold)",
                  fontWeight: 800,
                  fontSize: "1rem"
                }}>
                  {mostrarBrindis ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {brindisHabilitado && mostrarBrindis && (
              <>
                {estaBloqueado && (
                  <div style={{
                    background: "#f8f6f2",
                    borderRadius: "14px",
                    padding: "10px",
                    marginBottom: "12px",
                    fontSize: "0.8rem",
                    color: "#777"
                  }}>
                    Evento cerrado. Solo el administrador puede modificar esta lista.
                  </div>
                )}

                <input
                  className="input-field"
                  placeholder="Valor tarjeta brindis"
                  value={eventoActual.valorTarjetaBrindis || ""}
                  onChange={(e) => handleActualizarEvento({ valorTarjetaBrindis: e.target.value })}
                  disabled={estaBloqueado}
                />

                <input
                  className="input-field"
                  placeholder="Alias para transferencia"
                  value={eventoActual.aliasBrindis || ""}
                  onChange={(e) => handleActualizarEvento({ aliasBrindis: e.target.value })}
                  disabled={estaBloqueado}
                />

                <textarea
                  className="input-field"
                  value={brindisBulk}
                  onChange={(e) => setBrindisBulk(e.target.value)}
                  placeholder="Pega invitados al brindis, uno por renglón..."
                  style={{height: "90px", resize: "none"}}
                  disabled={estaBloqueado}
                />

                <button
                  className="btn-luxury"
                  onClick={handleImportarBrindis}
                  disabled={estaBloqueado}
                  style={{width: "100%", marginBottom: "12px", opacity: estaBloqueado ? 0.5 : 1}}
                >
                  Cargar brindis
                </button>

                <input
                  className="input-field"
                  placeholder="Buscar en brindis..."
                  value={busquedaBrindis}
                  onChange={(e) => setBusquedaBrindis(e.target.value)}
                  disabled={estaBloqueado}
                />

                <div style={{fontSize: "0.8rem", color: "#777", marginBottom: "10px"}}>
                  Total: {invitadosBrindis.length} · Pagos: {invitadosBrindis.filter(i => i.pago).length} · Impagos: {invitadosBrindis.filter(i => !i.pago).length}
                </div>

                <div style={{display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px"}}>
                  {invitadosBrindis
                    .filter(inv => String(inv.nombre || "").toLowerCase().includes(busquedaBrindis.toLowerCase()))
                    .sort((a,b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
                    .map(inv => (
                      <div
                        key={inv.id}
                        style={{
                          border: inv.pago ? "1px solid rgba(107,191,89,0.55)" : "1px solid rgba(220,80,80,0.35)",
                          background: inv.pago ? "#f4fbf2" : "#fff7f7",
                          borderRadius: "16px",
                          padding: "12px"
                        }}
                      >
                        {editandoBrindisId === inv.id ? (
                          <>
                            <input
                              className="input-field"
                              value={nombreBrindisEditado}
                              onChange={(e) => setNombreBrindisEditado(e.target.value)}
                              style={{marginBottom: "8px"}}
                            />
                            <button
                              className="btn-luxury"
                              onClick={() => handleGuardarEdicionBrindis(inv.id)}
                              style={{width: "100%"}}
                            >
                              Guardar
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{display: "flex", justifyContent: "space-between", gap: "10px"}}>
                              <div>
                                <strong style={{fontSize: "0.9rem"}}>{inv.nombre || "Sin nombre"}</strong>
                                <div style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  color: inv.pago ? "#337a2f" : "#b43b3b",
                                  marginTop: "4px"
                                }}>
                                  {inv.pago
                                    ? "PAGO" + (inv.metodoPago ? " - " + inv.metodoPago.toUpperCase() : "")
                                    : "IMPAGO"}
                                </div>
                              </div>

                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => handleEliminarBrindis(inv.id)}
                                disabled={estaBloqueado}
                              >
                                ×
                              </button>
                            </div>

                            <div style={{display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap"}}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditandoBrindisId(inv.id);
                                  setNombreBrindisEditado(inv.nombre || "");
                                }}
                                disabled={estaBloqueado}
                                style={{padding: "7px 10px", borderRadius: "16px", border: "1px solid #ddd", background: "#fff", cursor: "pointer"}}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePagoBrindis(inv.id, "efectivo")}
                                disabled={estaBloqueado}
                                style={{padding: "7px 10px", borderRadius: "16px", border: inv.metodoPago === "efectivo" ? "2px solid #337a2f" : "1px solid #ddd", background: "#fff", cursor: "pointer"}}
                              >
                                EF
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePagoBrindis(inv.id, "transferencia")}
                                disabled={estaBloqueado}
                                style={{padding: "7px 10px", borderRadius: "16px", border: inv.metodoPago === "transferencia" ? "2px solid #337a2f" : "1px solid #ddd", background: "#fff", cursor: "pointer"}}
                              >
                                TR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePagoBrindis(inv.id)}
                                disabled={estaBloqueado}
                                style={{padding: "7px 10px", borderRadius: "16px", border: "1px solid #ddd", background: "#fff", cursor: "pointer"}}
                              >
                                {inv.pago ? "Marcar impago" : "Marcar pago"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>

                {!esCliente && (
                  <button
                    className="btn-luxury btn-outline"
                    onClick={exportarBrindisPDF}
                    style={{width: "100%"}}
                  >
                    Descargar listado brindis
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}

        {!esCliente && (
          <div style={{
            marginTop: "24px",
            background: "#fff",
            border: "1px solid rgba(197,160,89,0.18)",
            borderRadius: "22px",
            padding: "18px",
            boxShadow: "0 10px 35px rgba(0,0,0,0.05)"
          }}>
            <button
              type="button"
              className="btn-luxury btn-outline"
              onClick={() => setMostrarCronograma(prev => !prev)}
              style={{width: "100%"}}
            >
              {mostrarCronograma ? "Ocultar cronograma" : "Cronograma del evento"}
            </button>

            {mostrarCronograma && (
              <div style={{marginTop: "18px"}}>
                <label style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "2px",
                  color: "var(--lb-gold)",
                  marginBottom: "8px"
                }}>
                  NOMBRE A MENCIONAR
                </label>

                <input
                  className="input-field"
                  value={eventoActual.cronogramaNombre || obtenerNombreCronograma()}
                  onChange={(e) => actualizarCronogramaNombre(e.target.value)}
                  placeholder="Ej: Cata, Rufina, los novios..."
                />

                <div style={{
                  background: "#f8f6f2",
                  border: "1px solid #eee",
                  borderRadius: "18px",
                  padding: "14px",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "2px",
                    color: "var(--lb-gold)",
                    marginBottom: "10px"
                  }}>
                    CARGAR MOMENTO
                  </div>

                  <select
                    className="input-field"
                    value={cronogramaSeleccionId}
                    onChange={(e) => seleccionarMomentoCronograma(e.target.value)}
                  >
                    <option value="">Elegir momento...</option>
                    {plantillaCronogramaBase.map(item => (
                      <option
                        key={item.id}
                        value={item.id}
                        style={item.id === "tanda_baile" ? {fontWeight: 800, color: "#a3844a", background: "#f4ece0"} : undefined}
                      >
                        {item.id === "tanda_baile" ? "★★★ TANDA DE BAILE ★★★" : item.titulo}
                      </option>
                    ))}
                    <option value="otro">Otro momento...</option>
                  </select>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "110px 1fr",
                    gap: "10px"
                  }}>
                    <input
                      type="time"
                      className="input-field"
                      value={cronogramaHora}
                      onChange={(e) => setCronogramaHora(e.target.value)}
                      disabled={cronogramaTipo === "separador"}
                      style={{marginBottom: 0, padding: "12px"}}
                    />

                    <select
                      className="input-field"
                      value={cronogramaTipo}
                      onChange={(e) => setCronogramaTipo(e.target.value)}
                      style={{marginBottom: 0, padding: "12px"}}
                    >
                      <option value="horario">Con horario</option>
                      <option value="orden">Solo orden</option>
                      <option value="separador">Separador / tanda</option>
                    </select>
                  </div>

                  <input
                    className="input-field"
                    value={cronogramaTitulo}
                    onChange={(e) => setCronogramaTitulo(e.target.value)}
                    placeholder="Nombre del momento"
                    style={{marginTop: "10px", marginBottom: "10px"}}
                  />

                  {cronogramaTipo !== "separador" && (
                    <textarea
                      className="input-field"
                      value={cronogramaTexto}
                      onChange={(e) => setCronogramaTexto(e.target.value)}
                      placeholder="Detalle del momento. Podés usar {{nombre}}."
                      style={{height: "115px", resize: "vertical", marginBottom: "10px"}}
                    />
                  )}

                  <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                    <button
                      type="button"
                      className="btn-luxury"
                      onClick={guardarMomentoCronograma}
                      style={{flex: "1 1 180px", padding: "12px 14px"}}
                    >
                      {cronogramaEditandoUid ? "Guardar cambios" : "+ Agregar al cronograma"}
                    </button>

                    {cronogramaEditandoUid && (
                      <button
                        type="button"
                        className="btn-luxury btn-outline"
                        onClick={limpiarFormularioCronograma}
                        style={{flex: "1 1 120px", padding: "12px 14px"}}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "2px",
                  color: "var(--lb-gold)",
                  marginBottom: "10px"
                }}>
                  CRONOGRAMA ARMADO
                </div>

                {(eventoActual.cronograma || []).length === 0 && (
                  <p style={{
                    fontSize: "0.85rem",
                    color: "#777",
                    lineHeight: 1.6,
                    marginBottom: "16px"
                  }}>
                    Elegí un momento, revisá el texto y agregalo. Abajo se irá armando el orden final del PDF.
                  </p>
                )}

                <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                  {(eventoActual.cronograma || []).map((item, index) => (
                    <div
                      key={item.uid}
                      style={{
                        border: item.tipo === "separador"
                          ? "1px solid rgba(197,160,89,0.45)"
                          : "1px solid #eee",
                        borderRadius: "14px",
                        padding: "10px 12px",
                        background: item.tipo === "separador" ? "#f4ece0" : "#fff"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}>
                        <div style={{minWidth: 0}}>
                          <div style={{
                            fontSize: "0.78rem",
                            color: "#999",
                            fontWeight: 700,
                            marginBottom: "3px"
                          }}>
                            {String(index + 1).padStart(2, "0")}{item.hora ? ` · ${item.hora}` : ""}
                          </div>

                          <div style={{
                            fontWeight: 800,
                            fontSize: item.tipo === "separador" ? "0.82rem" : "0.9rem",
                            color: "#333",
                            textTransform: item.tipo === "separador" ? "uppercase" : "none"
                          }}>
                            {item.tipo === "separador" ? `*** ${item.titulo} ***` : item.titulo}
                          </div>

                          {item.tipo !== "separador" && item.texto && (
                            <div style={{
                              marginTop: "4px",
                              fontSize: "0.78rem",
                              color: "#777",
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {textoCronograma(item.texto)}
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: "flex",
                          gap: "5px",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                          minWidth: "122px"
                        }}>
                          <button type="button" onClick={() => editarMomentoCronograma(item)} style={{padding: "6px 8px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.7rem"}}>Editar</button>
                          <button type="button" onClick={() => moverItemCronograma(item.uid, -1)} disabled={index === 0} style={{padding: "6px 8px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.7rem"}}>Subir</button>
                          <button type="button" onClick={() => moverItemCronograma(item.uid, 1)} disabled={index === (eventoActual.cronograma || []).length - 1} style={{padding: "6px 8px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.7rem"}}>Bajar</button>
                          <button type="button" onClick={() => eliminarItemCronograma(item.uid)} style={{padding: "6px 8px", borderRadius: "10px", border: "1px solid #f0cccc", background: "#fff", color: "#cc5555", cursor: "pointer", fontSize: "0.7rem"}}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-luxury"
                  onClick={exportarCronogramaPDF}
                  style={{width: "100%", marginTop: "16px", background: "var(--lb-dark)"}}
                >
                  Descargar cronograma PDF
                </button>
              </div>
            )}
          </div>
        )}

        {!esCliente && (
  <button 
    className="btn-luxury"
    style={{marginTop: '20px', background: 'var(--lb-dark)'}}
    onClick={exportarDocumentacionMaestra}
  >
    Generar Reporte PDF
  </button>
)}
      </aside>

      <main className="editor-canvas">
        <div style={{
  display: 'flex',
  flexDirection: window.innerWidth < 768 ? 'column' : 'row',
  justifyContent: 'space-between',
  alignItems: window.innerWidth < 768 ? 'center' : 'center',
  marginBottom: '50px',
  gap: window.innerWidth < 768 ? '15px' : '0px',
  textAlign: window.innerWidth < 768 ? 'center' : 'left'
}}>
          <div>
            <h3 style={{fontFamily: 'Playfair Display', fontSize: '2.2rem' , textAlign: window.innerWidth < 768 ? 'center' : 'left'}}>Plano de Mesas</h3>
            {esCliente && (
  <button
    className="btn-luxury"
    style={{
      marginTop: "10px",
      background: "#000"
    }}
    onClick={async () => {
      const snapshot = await getDocs(
        query(
          collection(db, "mensajes"),
          where("eventoId", "==", eventoActual.id)
        )
      );

      const mensajes = snapshot.docs.map(doc => doc.data());

      descargarMensajesPDF(mensajes, eventoActual.nombre);
    }}
  >
    📄 Descargar mensajes
  </button>
)}
            {esCliente && (
  <button
    className="btn-luxury"
    style={{
      marginTop: "15px",
      background: "var(--lb-gold-dark)"
    }}
    onClick={() => {
      const link = window.location.origin + "/evento/" + eventoActual.id + "?vista=lista";

      compartirLink({
        link,
        titulo: "Lista de mesas " + (eventoActual.nombre || "del evento"),
        texto: "Te comparto el enlace para que puedas buscar tu mesa.",
        mensajeCopiado: "Link de lista copiado"
      });
    }}
  >
    📋 Compartir lista
  </button>
  
)}

            <p style={{color: 'var(--lb-gray-mid)'}}>Asigna tus invitados a las mesas del salón</p>
          </div>
          <div style={{
  display: 'flex',
  gap: '15px',
  justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start',
  flexWrap: 'wrap'
}}>
            <button className="btn-luxury btn-outline"
             onClick={() => handleAgregarMesa(false)}
              disabled={estaBloqueado}
             >+ Mesa Común</button>
            <button className="btn-luxury"
            onClick={() => handleAgregarMesa(true)}
            disabled={estaBloqueado}
              >✨ Mesa VIP</button>
              
          </div>
        </div>
{mostrarPropuesta && (

  <div style={{
    background: "#fff",
    padding: "30px",
    borderRadius: "30px",
    marginBottom: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.06)"
  }}>

    <h2 style={{
      fontFamily: "Playfair Display",
      marginBottom: "25px"
    }}>
      ✨ Nueva propuesta
    </h2>

    <div style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(250px,1fr))",
      gap: "15px"
    }}>

      <select
        className="input-field"
        value={tipoPropuesta}
        onChange={(e) => {
          const tipo = e.target.value;
          setTipoPropuesta(tipo);
          setNuevaPropuesta(prev => ({
            ...prev,
            tipo,
            estilo: estiloDefaultPorTipo[tipo] || "personalizado"
          }));
        }}
      >
        <option value="boda">
          Boda
        </option>

        <option value="xv">
          Cumpleaños de 15
        </option>

        <option value="empresas">
          Empresas
        </option>

        <option value="infantil">
          Festejo infantil
        </option>

        <option value="alquiler">
          Alquiler
        </option>
      </select>

      <input
        className="input-field"
        placeholder="Nombre cliente"
        value={clientePropuesta}
        onChange={(e) =>
          setClientePropuesta(e.target.value)
        }
      />

      <input
        type="date"
        className="input-field"
        value={fechaPropuesta}
        onChange={(e) =>
          setFechaPropuesta(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Cantidad invitados"
        value={cantidadInvitados}
        onChange={(e) =>
          setCantidadInvitados(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Espacio salón"
        value={espacioSalon}
        onChange={(e) =>
          setEspacioSalon(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Lugar"
        value={lugarEvento}
        onChange={(e) =>
          setLugarEvento(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Importe total"
        value={importePropuesta}
        onChange={(e) =>
          setImportePropuesta(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Anticipo"
        value={anticipoPropuesta}
        onChange={(e) =>
          setAnticipoPropuesta(e.target.value)
        }
      />

      <input
        className="input-field"
        placeholder="Cuotas"
        value={cuotasPropuesta}
        onChange={(e) =>
          setCuotasPropuesta(e.target.value)
        }
      />

    </div>

    <textarea
      className="input-field"
      style={{
        height: "120px",
        marginTop: "15px"
      }}
      placeholder="Qué incluye..."
      value={incluyePropuesta}
      onChange={(e) =>
        setIncluyePropuesta(e.target.value)
      }
    />

    <textarea
      className="input-field"
      style={{
        height: "100px"
      }}
      placeholder="Observaciones..."
      value={observacionesPropuesta}
      onChange={(e) =>
        setObservacionesPropuesta(e.target.value)
      }
    />

    <div style={{
      marginTop: "20px"
    }}>

      <div style={{
        fontWeight: 700,
        marginBottom: "10px"
      }}>
        Estilos / Temáticas
      </div>

      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
      }}>

        {[
          "Rústico",
          "Boho",
          "Vintage",
          "Industrial",
          "Glamour",
          "Flores",
          "Bosque",
          "Disco",
          "Flúor",
          "Animalitos",
          "Globos",
          "Circo",
          "Disney"
        ].map(estilo => {

          const activo =
            estilosPropuesta.includes(estilo);

          return (

            <button
              key={estilo}
              type="button"
              onClick={() => {

                if (activo) {

                  setEstilosPropuesta(prev =>
                    prev.filter(
                      e => e !== estilo
                    )
                  );

                } else {

                  setEstilosPropuesta(prev => [
                    ...prev,
                    estilo
                  ]);

                }

              }}
              style={{
                padding: "10px 14px",
                borderRadius: "30px",
                border: activo
                  ? "2px solid #000"
                  : "1px solid #ddd",
                background: activo
                  ? "#f4ece0"
                  : "#fff",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              {estilo}
            </button>

          );

        })}

      </div>

    </div>

  </div>

)}
        <div className="mesa-grid">
          {eventoActual.mesas.map(mesa => (
            <div key={mesa.id} className={`mesa-card ${mesa.esVIP ? 'vip-style' : ''}`}>
              <div
  onClick={() =>
    setMesaExpandida(
      mesaExpandida === mesa.id
        ? null
        : mesa.id
    )
  }
  style={{
    display:'flex',
    justifyContent:'space-between',
    cursor:'pointer'
  }}
>
                <span className="mesa-num">
  {mesa.esVIP
    ? `✨ PRINCIPAL (${mesa.invitadosIds?.length || 0})`
    : `MESA NÚMERO ${mesa.numero} (${mesa.invitadosIds?.length || 0})`}
</span>
                <button className="delete-btn"
                onClick={() => handleEliminarMesa(mesa.id)}
                disabled={estaBloqueado}
                  >×</button>
              </div>
                        
              {mesaExpandida === mesa.id && (
  <>
              <div style={{ position: "relative" }}>

  <button
    onClick={() => {
      const nombre = busquedaInvitado.toLowerCase().trim();

const invitado = eventoActual.invitados.find(inv =>
  inv.nombre.toLowerCase().includes(nombre)
);
      setMesaActivaId(mesa.id);
      setInvitadosTemp(mesa.invitadosIds || []);
    }}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      background: "#fff",
      cursor: "pointer",
      opacity: estaBloqueado ? 0.5 : 1,
pointerEvents: estaBloqueado ? "none" : "auto",
      
    }}
  >
    Ubicar invitados...
  </button>

  {mesaActivaId === mesa.id && (
    <div style={{
      position: "absolute",
      top: "45px",
      left: 0,
      width: "100%",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "10px",
      maxHeight: "200px",
      overflowY: "auto",
      zIndex: 10
      
    }}>
      <input
  type="text"
  placeholder="Buscar invitado..."
  value={busquedaMesa}
  onChange={(e) =>
    setBusquedaMesa(e.target.value)
  }
  style={{
    width: "100%",
    marginBottom: "10px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  }}
/>    

      {invitadosCheckin
  .filter(inv => {

    const yaAsignado = eventoActual.mesas.some(m =>
      m.id !== mesa.id &&
      m.invitadosIds.includes(inv.id)
    );

    const coincideBusqueda =
      inv.nombre
        .toLowerCase()
        .includes(busquedaMesa.toLowerCase());

    return !yaAsignado && coincideBusqueda;

  })

  .sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  )

  .map(inv => (
          <label key={inv.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              disabled={estaBloqueado}
              checked={invitadosTemp.includes(inv.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setInvitadosTemp(prev => [...prev, inv.id]);
                } else {
                  setInvitadosTemp(prev => prev.filter(id => id !== inv.id));
                }
              }}
            />
            {" "}{inv.nombre}
          </label>
        ))}

      <button
      disabled={estaBloqueado}
        onClick={() => {
         // % actualizar mesas
const nuevasMesas = eventoActual.mesas.map(m =>
  m.id === mesa.id
    ? { ...m, invitadosIds: invitadosTemp }
    : m
);

// % actualizar invitados (CLAVE)
const nuevosInvitados = eventoActual.invitados.map(inv => {

  if (invitadosTemp.includes(inv.id)) {
    return { ...inv, mesaId: mesa.id };
  }

  if (inv.mesaId === mesa.id && !invitadosTemp.includes(inv.id)) {
    return { ...inv, mesaId: null };
  }

  return inv;
});

handleActualizarEvento({
  mesas: nuevasMesas,
  invitados: nuevosInvitados
});

setBusquedaMesa("");
setMesaActivaId(null);
        }}
       style={{
  position: "sticky",
  bottom: "0",
  marginTop: "10px",
  width: "100%",
  padding: "10px",
  background: "#c9a86a",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  zIndex: 20,
  boxShadow: "0 -4px 10px rgba(0,0,0,0.08)"
}}
      >
        Confirmar
      </button>

    </div>
  )}

</div>

              <div style={{minHeight: '80px', marginTop: '10px'}}>
                {(mesa.invitadosIds || []).map(id => {
                  const g = eventoActual.invitados.find(inv => inv.id === id);
                  return g ? (
                    <div key={id} className="guest-item" style={{padding: '8px 12px', background: '#fcfcfc'}}>
                      <span style={{fontSize: '0.8rem'}}>{g.nombre}</span>
                      <button className="delete-btn" style={{fontSize: '0.8rem'}} onClick={() => !estaBloqueado && handleQuitarDeMesa(id, mesa.id)}>×</button>
                    </div>
                  ) : null;
                })}
              </div>

  </>
)}

            </div>
          ))}
        </div>
        </main>
    </div> {/* editor-layout */}
  </div>
);
};    
  const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/evento/:id" element={<AppContent />} />
      <Route path="/evento/:id/mensajes" element={<MensajesEvento />} />
      <Route
  path="/propuesta/:id"
  element={<PropuestaCliente />}
/>
<Route
  path="/recibo/:propuestaId/:reciboId"
  element={<ReciboCliente />}
/>
<Route
  path="/encuesta/:id"
  element={<EncuestaCliente />}
/>
    </Routes>
  );
};

export default App;
















