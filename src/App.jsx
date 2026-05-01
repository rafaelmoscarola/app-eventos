import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
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
    }

    /* SCROLLBAR CUSTOM */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--lb-gray-light); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--lb-gray-mid); }

    /* LAYOUT ESTRUCTURAL */
    .app-container { display: flex; min-height: 100vh; }

    .sidebar-brand {
      width: 320px; height: 100vh; 
      background: linear-gradient(180deg, #ffffff 0%, #f7f3ed 100%);
      position: fixed; left: 0; top: 0; 
      padding: 60px 40px; 
      border-right: 1px solid rgba(197, 160, 89, 0.1); 
      z-index: 100;
      display: flex; flex-direction: column;
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

    /* DASHBOARD / HOME */
    .hero-banner {
      height: 400px;
background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://i.ibb.co/sd3B2NfM/Chat-GPT-Image-1-may-2026-07-21-43.png');      background-size: cover; background-position: center;
      padding: 80px; color: white;
      display: flex; flex-direction: column; justify-content: flex-end;
    }

    .hero-text { font-family: 'Playfair Display', serif; font-size: 4rem; margin-bottom: 10px; }

    .projects-section { padding: 60px; }
    .grid-container { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
      gap: 40px; 
    }

    .project-card {
      background: var(--lb-white); border-radius: 30px; overflow: hidden;
      box-shadow: var(--shadow-sm); transition: var(--transition);
      border: 1px solid rgba(0,0,0,0.02);
      position: relative;
    }
    .project-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-md); }
    .card-image { width: 100%; height: 240px; object-fit: cover; }
    .card-content { padding: 30px; }
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
    .editor-layout { display: flex; height: 100vh; }
    .editor-sidebar {
      width: 420px; background: var(--lb-white); border-right: 1px solid var(--lb-gray-light);
      display: flex; flex-direction: column; padding: 40px;
    }
    .editor-canvas { flex: 1; padding: 60px; overflow-y: auto; background: #f9f7f4; }

    .input-field {
      width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--lb-gray-light);
      background: #fafafa; margin-bottom: 16px; font-family: inherit; font-size: 0.9rem;
      transition: var(--transition);
    }
    .input-field:focus { outline: none; border-color: var(--lb-gold); background: white; }

    .guest-list-container {
      flex: 1; overflow-y: auto; margin-top: 30px; padding-right: 5px;
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
  `;
  document.head.appendChild(style);
};

injectStyles();

const App = () => {
  // ---------------------------------------------------------
  // ESTADO Y PERSISTENCIA
  // ---------------------------------------------------------
  const [eventos, setEventos] = useState([]);
  const [eventoActivoId, setEventoActivoId] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
const [nuevaFecha, setNuevaFecha] = useState("");

  useEffect(() => {
  const cargarEventos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "eventos"));
      const eventosFirebase = [];

      querySnapshot.forEach((doc) => {
        eventosFirebase.push(doc.data());
      });

      setEventos(eventosFirebase);

      console.log("📥 Eventos cargados desde Firebase");

    } catch (error) {
      console.error("❌ Error cargando Firebase:", error);
    }
  };

  cargarEventos();
}, []);

  // Guardado automático
  useEffect(() => {
    localStorage.setItem('LB_STUDIO_STORAGE_V3', JSON.stringify(eventos));
  }, [eventos]);

  // Evento activo memorizado
  const eventoActual = useMemo(() => 
    eventos.find(e => e.id === eventoActivoId), 
    [eventos, eventoActivoId]
  );

// ---------------------------------------------------------
  // ACCIONES DE PROYECTO
  // ---------------------------------------------------------
  const handleActualizarEvento = useCallback((nuevosDatos) => {
    setEventos(prev => prev.map(e => 
      e.id === eventoActivoId ? { ...e, ...nuevosDatos } : e
    ));
  }, [eventoActivoId]);

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
  img: `https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800&sig=${nuevoId}&q=${fotoAzar}`,
  invitados: [],
  mesas: [],
  contadorMesas: 1
};

try {
  // 🔥 primero guarda en Firebase
  await addDoc(collection(db, "eventos"), nuevo);

  console.log("✅ Guardado en Firebase");

  // 🔥 después guarda en tu app (local)
  setEventos(prev => [...prev, nuevo]);

  setNuevoNombre("");
  setNuevaFecha("");

  setTimeout(() => {
    setEventoActivoId(nuevoId);
  }, 100);

} catch (error) {
  console.error("❌ Error Firebase:", error);
  alert("Error al guardar en Firebase");
}
};
  const handleEliminarProyecto = (id, e) => {
  e.stopPropagation();
  if(window.confirm("¿Seguro que deseas eliminar este proyecto por completo?")) {
    setEventos(eventos.filter(ev => ev.id !== id));
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
    const nuevaMesa = {
      id: Date.now(),
      numero: vip ? "MESA PRINCIPAL" : eventoActual.contadorMesas,
      esVIP: vip,
      invitadosIds: []
    };

    handleActualizarEvento({
      mesas: [...eventoActual.mesas, nuevaMesa],
      contadorMesas: vip ? eventoActual.contadorMesas : eventoActual.contadorMesas + 1
    });
  };

  const handleEliminarMesa = (mId) => {
    if(!window.confirm("¿Eliminar mesa? Los invitados volverán a la lista de espera.")) return;
    
    const invitadosDesasignados = eventoActual.invitados.map(i => 
      i.mesaId === mId ? { ...i, mesaId: null } : i
    );

    handleActualizarEvento({
      mesas: eventoActual.mesas.filter(m => m.id !== mId),
      invitados: invitadosDesasignados
    });
  };

  const handleAsignarMesa = (invId, mesaId) => {
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
  if (!eventoActivoId || !eventoActual) {
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
                <div key={e.id} className="project-card" onClick={() => setEventoActivoId(e.id)} style={{cursor: 'pointer'}}>
                  <img src={e.img} className="card-image" alt="Wedding" />
                  <div className="card-content">
                    <h3 className="card-title">{e.nombre}</h3>
                    <p style={{color: 'var(--lb-gray-mid)', marginBottom: '10px'}}>
  📅 {e.fecha || "Sin fecha"}
</p>
<p style={{
  color: (() => {
    const texto = calcularDias(e.fecha);
    if (texto === "HOY") return 'red';
    if (texto.includes("Faltan")) {
      const dias = parseInt(texto.match(/\d+/));
      if (dias <= 3) return 'red';
      if (dias <= 10) return 'orange';
      return 'var(--lb-gold)';
    }
    return '#999';
  })(),
  fontSize: '0.8rem',
  marginBottom: '10px'
}}>
  {calcularDias(e.fecha)}
</p>
<p style={{color: 'var(--lb-gray-mid)', marginBottom: '20px'}}>
  {e.invitados.length} invitados • {e.mesas.length} mesas organizadas
</p>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button className="btn-luxury btn-outline" style={{flex: 1}}>Configurar</button>
                      <button className="delete-btn" onClick={(event) => handleEliminarProyecto(e.id, event)}>🗑️</button>
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

  // ---------------------------------------------------------
  // RENDER: EDITOR DE EVENTO (WORKSPACE)
  // ---------------------------------------------------------
  return (
    <div className="app-container" style={{background: '#f9f7f4'}}>
      <aside className="editor-sidebar">
        <button 
          onClick={() => setEventoActivoId(null)} 
          style={{background:'none', border:'none', color:'var(--lb-gray-mid)', cursor:'pointer', marginBottom: '20px', textAlign:'left', fontWeight:700}}
        >
          ← VOLVER AL PANEL
        </button>

        <h2 className="brand-title" style={{fontSize: '1.8rem', marginBottom: '30px'}}>{eventoActual.nombre}</h2>
        <input
  type="date"
  className="input-field"
  value={eventoActual.fecha || ""}
  onChange={(e) => handleActualizarEvento({ fecha: e.target.value })}
  style={{marginBottom: '20px'}}
/>

        <div className="bulk-box">
          <p style={{fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--lb-gold)', marginBottom: '10px'}}>IMPORTACIÓN RÁPIDA</p>
          <textarea 
            id="bulk-guests" 
            className="input-field" 
            style={{height: '120px', resize: 'none'}} 
            placeholder="Pega la lista separada por renglones..."
          />
          <button className="btn-luxury" style={{width: '100%', marginBottom: '30px'}} onClick={handleImportarMasivo}>Cargar Invitados</button>
        </div>

        <div className="search-box">
          <input 
            className="input-field" 
            placeholder="Buscar invitado..." 
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
        </div>

        <div className="guest-list-container">
          {eventoActual.invitados
            .filter(i => i.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()))
            .map(inv => (
              <div key={inv.id} className="guest-item" style={{opacity: inv.mesaId ? 0.6 : 1}}>
                <span style={{fontSize: '0.85rem', fontWeight: 500}}>{inv.nombre}</span>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  {inv.mesaId && <span className="badge-assigned">EN MESA</span>}
                  <button className="delete-btn" style={{fontSize:'0.9rem'}} onClick={() => handleEliminarInvitadoTotal(inv.id)}>×</button>
                </div>
              </div>
            ))
          }
        </div>

        <button 
          className="btn-luxury" 
          style={{marginTop: '20px', background: 'var(--lb-dark)'}} 
          onClick={exportarDocumentacionMaestra}
        >
          Generar Reporte PDF 
        </button>
      </aside>

      <main className="editor-canvas">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px'}}>
          <div>
            <h3 style={{fontFamily: 'Playfair Display', fontSize: '2.2rem'}}>Plano de Mesas</h3>
            <p style={{color: 'var(--lb-gray-mid)'}}>Asigna tus invitados a las mesas del salón</p>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            <button className="btn-luxury btn-outline" onClick={() => handleAgregarMesa(false)}>+ Mesa Común</button>
            <button className="btn-luxury" onClick={() => handleAgregarMesa(true)}>✨ Mesa VIP</button>
          </div>
        </div>

        <div className="mesa-grid">
          {eventoActual.mesas.map(mesa => (
            <div key={mesa.id} className={`mesa-card ${mesa.esVIP ? 'vip-style' : ''}`}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span className="mesa-num">{mesa.esVIP ? "✨ PRINCIPAL" : `MESA NÚMERO ${mesa.numero}`}</span>
                <button className="delete-btn" onClick={() => handleEliminarMesa(mesa.id)}>×</button>
              </div>

              <select 
                className="input-field" 
                style={{fontSize: '0.8rem', padding: '10px'}}
                onChange={(e) => handleAsignarMesa(Number(e.target.value), mesa.id)}
                value=""
              >
                <option value="">Ubicar invitado...</option>
                {eventoActual.invitados
  .filter(i => !i.mesaId)
  .sort((a, b) => a.nombre.localeCompare(b.nombre))
  .map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)
}
              </select>

              <div style={{minHeight: '80px', marginTop: '10px'}}>
                {(mesa.invitadosIds || []).map(id => {
                  const g = eventoActual.invitados.find(inv => inv.id === id);
                  return g ? (
                    <div key={id} className="guest-item" style={{padding: '8px 12px', background: '#fcfcfc'}}>
                      <span style={{fontSize: '0.8rem'}}>{g.nombre}</span>
                      <button className="delete-btn" style={{fontSize: '0.8rem'}} onClick={() => handleQuitarDeMesa(id, mesa.id)}>×</button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
  };
  export default App;