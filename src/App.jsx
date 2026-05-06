import { descargarMensajesPDF } from "./qrUtils";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { Routes, Route, useParams } from "react-router-dom";
import MensajesEvento from "./MensajesEvento";
import { generarQRPDF } from "./qrUtils";

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

/* 📱 MODO CELULAR */
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
    .hero-banner {
  height: 400px;
  background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://i.ibb.co/sd3B2NfM/Chat-GPT-Image-1-may-2026-07-21-43.png');
  background-size: cover;
  background-position: center;
  padding: 80px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
  @media (max-width: 768px) {
  .hero-banner {
    margin-left: -20px;
    margin-right: -20px;
    width: calc(100% + 40px);
    padding: 20px;
    height: 220px;
  }
}

/* 📱 MOBILE */
@media (max-width: 768px) {
  .hero-banner {
    height: 220px;
    padding: 20px;
  }
}

    .hero-text { font-family: 'Playfair Display', serif; font-size: 4rem; margin-bottom: 10px; }
    @media (max-width: 768px) {
  .hero-text {
    font-size: 1.8rem;
  }
}

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

/* 📱 RESPONSIVE CELULAR */
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

      /* 📱 RESPONSIVE CELULAR */
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

..splash-sub {
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

const [pinInput, setPinInput] = useState("");
const PIN_CORRECTO = "1417"; // después lo cambiamos

  const { id } = useParams();
  const params = new URLSearchParams(window.location.search);
const esVistaLista = params.get("vista") === "lista";
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
const [resultadoMesa, setResultadoMesa] = useState(null);



  useEffect(() => {

  const unsub = onSnapshot(collection(db, "eventos"), (snapshot) => {
    
    const lista = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      lista.push({
        ...data,
        _docId: docSnap.id
      });
    });

    setEventos(lista);

    console.log("🔄 Sync en tiempo real");
  });

  return () => unsub();

}, []);
  // Guardado automático

  // Evento activo memorizado
  const eventoActual = useMemo(() => {

  if (esCliente && id) {
    return eventos.find(e => String(e.id) === id);
  }

  return eventos.find(e => e.id === eventoActivoId);

}, [eventos, eventoActivoId, id]);
const estaBloqueado = esCliente && eventoActual?.cerrado;
const guardarEvento = async (evento) => {
  try {
    const ref = doc(db, "eventos", evento._docId); // 🔥 CAMBIO CLAVE
    await updateDoc(ref, evento);
    console.log("💾 Evento guardado en Firebase");
  } catch (error) {
    console.error("❌ Error guardando evento:", error);
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

      // 🔥 CLAVE: detectar si es cliente o admin
      const esElEvento = esCliente
        ? String(e.id) === id
        : e.id === eventoActivoId;

      return esElEvento ? { ...e, ...nuevosDatos } : e;
    });
    

    // 🔥 obtener el evento correcto
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
};

try {
  // 🔥 primero guarda en Firebase
  const docRef = await addDoc(collection(db, "eventos"), nuevo);

await updateDoc(docRef, { id: docRef.id });

nuevo.id = docRef.id;

  console.log("✅ Guardado en Firebase");

  // 🔥 después guarda en tu app (local)


  setNuevoNombre("");
  setNuevaFecha("");

setEventoActivoId(docRef.id);

} catch (error) {
  console.error("❌ Error Firebase:", error);
  alert("Error al guardar en Firebase");
}
};

const handleEliminarProyecto = async (docId, eventoId, e) => {
  e.stopPropagation();

  if(window.confirm("¿Seguro que deseas eliminar este proyecto por completo?")) {

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
      console.error("❌ Error al eliminar:", error);
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
    const textarea = document.getElementById('bulk-guests');
    const texto = textarea.value;
    if (!texto.trim()) return;

    const lineas = texto.split('\n').filter(l => l.trim() !== "");
    const nuevosInvitados = lineas.map(nombre => ({
      id: Math.floor(Math.random() * 1000000) + Date.now(),
      nombre: nombre.trim(),
      mesaId: null
    }));

    handleActualizarEvento({
      invitados: [...(eventoActual.invitados || []), ...nuevosInvitados]
    });
    textarea.value = "";
  };

  const handleEliminarInvitadoTotal = (id) => {
    const invitadosFiltrados = eventoActual.invitados.filter(i => i.id !== id);
    const mesasLimpias = eventoActual.mesas.map(m => ({
      ...m, invitadosIds: (m.invitadosIds || []).filter(mid => mid !== id)
    }));

    handleActualizarEvento({
      invitados: invitadosFiltrados,
      mesas: mesasLimpias
    });
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
      doc.text(`${index + 1}. ${inv.nombre}`, margin, y);
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
          doc.text(`   • ${i.nombre}`, margin, y);
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
  <div style={{
    opacity: fadeOut ? 0 : 1,
transition: "opacity 2s ease",
    minHeight: "100vh",
    position: "relative",
    backgroundImage: "url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#fff"
    
  }}>
    <div className="particles">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span><span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>

    {/* CAPA OSCURA PARA CONTRASTE */}
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.4)"
    }} />

    {/* CONTENIDO */}
    <div style={{
      position: "relative",
      zIndex: 2 
      
    }}>

      {/* NOMBRE */}
      <h1 style={{
        fontFamily: "Brittany Signature",
        fontSize: "3.5rem",
        marginBottom: "10px"
      }}>
        Luisina Bagnaroli
      </h1>

      {/* FRASE */}
      <p style={{
        marginBottom: "30px",
        fontSize: "1rem"
      }}>
        El mejor momento para celebrar, es <strong>siempre</strong>
      </p>

      {/* BOTÓN */}
      <button
        onClick={() => {
  setFadeOut(true);

  setTimeout(() => {
    setPantallaPublica(false);
  }, 2000);
}}
        style={{
          padding: "14px 30px",
          borderRadius: "30px",
          background: "linear-gradient(145deg, #c9a86a, #b3935c)",
          border: "none",
          color: "#fff",
          fontWeight: "600",
          letterSpacing: "1px",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
        }}
      >
        ✨ CONTINUAR
      </button>
      

    </div>
    <div style={{
  position: "absolute",
bottom: "50px",
left: "0",
width: "100%",
display: "flex",
justifyContent: "center",
gap: "15px",
padding: "0 0 25px 0",
zIndex: 5,
}}>

  {/* INSTAGRAM */}
  <a
    href="https://www.instagram.com/armalocomoquieras/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding: "10px 18px",
      borderRadius: "20px",
      background: "rgba(255, 255, 255, 0.12)",
border: "1px solid rgba(255, 255, 255, 0.35)",
color: "#ffffff",
backdropFilter: "blur(6px)",
      fontSize: "0.8rem",
      letterSpacing: "1px",
      textDecoration: "none",
      transition: "0.3s"
    }}
  >
     Instagram
  </a>

  {/* WHATSAPP */}
  <a
    href="https://wa.me/543404597725"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding: "10px 18px",
      borderRadius: "20px",
      background: "rgba(255, 255, 255, 0.12)",
border: "1px solid rgba(255, 255, 255, 0.35)",
color: "#ffffff",
backdropFilter: "blur(6px)",
      fontSize: "0.8rem",
      letterSpacing: "1px",
      textDecoration: "none",
      transition: "0.3s"
    }}
  >
     WhatsApp
  </a>

</div>
  </div>
  
);
}
 if (!logueado) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      background: "#f4f1ea"
    }}>

      <div style={{
        textAlign: "center"
      }}>

        <h2>INGRESE PIN</h2>

        <input
          type="password"
          maxLength={4}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          style={{
            fontSize: "2rem",
            textAlign: "center",
            letterSpacing: "10px"
          }}
        />

        <br /><br />

        <button
  onClick={() => {
    if (pinInput === PIN_CORRECTO) {
      setLogueado(true);
    } else {
      alert("PIN incorrecto");
    }
  }}
  style={{
    padding: "14px 30px",
    borderRadius: "30px",
    background: "linear-gradient(145deg, #c9a86a, #b3935c)",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    letterSpacing: "1px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    transition: "0.3s"
  }}
>
  ✨ INGRESAR
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
  style={{width: '100%'}} 
  onClick={() => {
    console.log("CLICK OK");
    handleCrearProyecto();
  }}
>
  + Crear Evento
</button>
  </div>
</aside>

        <main className="main-wrapper">
          <header className="hero-banner">
            <h2 className="hero-text">Gestión de Espacios</h2>
            <p style={{fontSize: '1.2rem', fontWeight: 200}}>Visualiza y organiza tus eventos</p>
          </header>

          <section className="projects-section">
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
                  <img src={e.img} className="card-image" alt="Wedding" />
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
    const link = window.location.origin + "/evento/" + e.id 
    navigator.clipboard.writeText(link);
    alert("🔗 Link copiado:\n\n" + link);
  }}
>
  Compartir evento
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
    splash.style.background = "black"; // 👈 esto es para probar
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
    🔒 Cerrar evento
    
  </button>
)}

{eventoActual.cerrado && (
  <p style={{
    fontSize: '0.8rem',
    color: 'var(--lb-gold)',
    fontWeight: 600,
    marginBottom: '20px'
  }}>
    🔒 Evento cerrado
  </p>
)}

        <div className="bulk-box">
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--lb-gold)', marginBottom: '10px'}}>IMPORTACIÓN RÁPIDA</p>
          <textarea 
  id="bulk-guests"
  className="input-field"
  style={{height: '120px', resize: 'none'}}
  placeholder="Pega la lista separada por renglones..."
  disabled={estaBloqueado}
/>
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

        <div className="guest-list-container">
          {(eventoActual.invitados || [])
            .filter(i => i.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()))
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
      {inv.nombre}
    </span>

    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>

      {inv.mesaId && (
        <span className="badge-assigned">
          SENTADO
        </span>
      )}

      <button 
        className="delete-btn" 
        style={{fontSize:'0.9rem'}}
        onClick={() => handleEliminarInvitadoTotal(inv.id)}
        disabled={estaBloqueado}
      >
        ×
      </button>

    </div>
  </div>
))
          }
        </div>

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
      navigator.clipboard.writeText(link);
      alert("🔗 Link de lista copiado:\n\n" + link);
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

        <div className="mesa-grid">
          {eventoActual.mesas.map(mesa => (
            <div key={mesa.id} className={`mesa-card ${mesa.esVIP ? 'vip-style' : ''}`}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="mesa-num">{mesa.esVIP ? "✨ PRINCIPAL" : `MESA NÚMERO ${mesa.numero}`}</span>
                <button className="delete-btn"
                onClick={() => handleEliminarMesa(mesa.id)}
                disabled={estaBloqueado}
                  >×</button>
              </div>

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
      cursor: "pointer"
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

      {(eventoActual.invitados || [])
        .filter(inv => {
          const yaAsignado = eventoActual.mesas.some(m =>
            m.id !== mesa.id && m.invitadosIds.includes(inv.id)
          );
          return !yaAsignado;
        })
        .map(inv => (
          <label key={inv.id} style={{ display: "block" }}>
            <input
              type="checkbox"
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
        onClick={() => {
         // 🔥 actualizar mesas
const nuevasMesas = eventoActual.mesas.map(m =>
  m.id === mesa.id
    ? { ...m, invitadosIds: invitadosTemp }
    : m
);

// 🔥 actualizar invitados (CLAVE)
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
          setMesaActivaId(null);
        }}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "8px",
          background: "#c9a86a",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
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
    </Routes>
  );
};

export default App;