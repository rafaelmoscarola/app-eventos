import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

const reaccionar = async (mensajeId, tipo, valorActual) => {
  try {
    const ref = doc(db, "mensajes", mensajeId);

    await updateDoc(ref, {
      [tipo]: (valorActual || 0) + 1
    });

  } catch (error) {
    console.error("Error reaccionando:", error);
  }
};
const MensajesEvento = () => {
  const { id } = useParams();

  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [evento, setEvento] = useState(null);
  useEffect(() => {
  const obtenerEvento = async () => {
    try {
      const ref = doc(db, "eventos", id);
const snap = await getDoc(ref);

if (snap.exists()) {
  setEvento(snap.data());
}
    } catch (error) {
      console.error("Error cargando evento:", error);
    }
  };

  obtenerEvento();
}, [id]);

  // 🔥 ESCUCHAR MENSAJES EN TIEMPO REAL
  useEffect(() => {
    const q = query(
      collection(db, "mensajes"),
      where("eventoId", "==", id),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMensajes(datos);
    });

    return () => unsubscribe();
  }, [id]);

  // 💾 GUARDAR MENSAJE
  const guardarMensaje = async () => {const ahora = Date.now();
const ultimoEnvio = localStorage.getItem("ultimoMensaje");

if (ultimoEnvio && ahora - ultimoEnvio < 5 * 60 * 1000) {
  const restante = Math.ceil((5 * 60 * 1000 - (ahora - ultimoEnvio)) / 1000);

  alert(`Esperá ${Math.ceil(restante / 60)} minutos para enviar otro mensaje`);
  return;
}
    if (!nombre || !mensaje) {
      alert("Completá nombre y mensaje");
      return;
    }
   

    try {
      await addDoc(collection(db, "mensajes"), {
  nombre,
  mensaje,
  eventoId: id,
  fecha: serverTimestamp(),
  likes: 0,
  dislikes: 0
});

      setNombre("");
      setMensaje("");
      alert("Mensaje enviado 💚");
      localStorage.setItem("ultimoMensaje", Date.now());
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  return (
    <div
  style={{
    minHeight: "100vh",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden"
  }}
>
        <div
  style={{
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    zIndex: 1
  }}
>
        <h2 style={{
  textAlign: "center",
  marginBottom: "10px",
  color: "#2b2b2b",
  fontWeight: "500"
}}>
  Dejá tu mensaje
</h2>
        

        <h3 style={{
  textAlign: "center",
  marginBottom: "20px",
  fontFamily: "Brittany Signature",
  fontSize: "2.5rem",
  color: "#2b2b2b",
  textShadow: "0 4px 20px rgba(0,0,0,0.4)"
}}>
  {evento ? evento.nombre : "Cargando..."}
</h3>

        {/* 💬 LISTA DE MENSAJES */}
        <div
          style={{
           maxHeight: "300px",
overflowY: "auto",
display: "flex",
flexDirection: "column",
gap: "6px",
scrollBehavior: "smooth",
            marginBottom: "15px",
            padding: "10px",
            background: "rgba(255,255,255,0.6)",
backdropFilter: "blur(8px)",
            borderRadius: "10px"
          }}
        >
          {mensajes.map((m, index) => (
  <div
    key={m.id}
    style={{
      display: "flex",
      justifyContent: "flex-end"
    }}
  >
    <div
      style={{
        maxWidth: "75%",
        background: index % 2 === 0 ? "#ffffff" : "#dcf8c6",
        padding: "10px 12px",
        borderRadius: "18px",
        marginBottom: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "relative"
      }}
    >
      <div style={{
        fontSize: "12px",
        fontWeight: "bold",
        marginBottom: "4px",
        color: "#555"
      }}>
        {m.nombre}
      </div>

      <div style={{
        fontSize: "14px",
        color: "#222"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "8px" }}>
  
  <span style={{
    fontSize: "14px",
    color: "#222"
  }}>
    {m.mensaje}
    <div style={{
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "5px"
}}>

  <button
    onClick={() => reaccionar(m.id, "likes", m.likes)}
    style={{
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "12px"
    }}
  >
    👍 {m.likes || 0}
  </button>

  <button
    onClick={() => reaccionar(m.id, "dislikes", m.dislikes)}
    style={{
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "12px"
    }}
  >
    👎 {m.dislikes || 0}
  </button>

</div>
  </span>

  <span style={{
    fontSize: "10px",
    color: "#999"
  }}>
    {m.fecha?.toDate
      ? new Date(m.fecha.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ""}
  </span>

</div>
      </div>
    </div>
  </div>
))}
        </div>

        {/* INPUT NOMBRE */}
        <input
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            marginBottom: "10px"
          }}
        />

        {/* TEXTAREA MENSAJE */}
        <textarea
          placeholder="Escribí tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            marginBottom: "10px"
          }}
        />

        {/* BOTÓN */}
        <button
          onClick={guardarMensaje}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            background: "#25D366",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Enviar mensaje
        </button>
      </div>
    </div>
  );
};

export default MensajesEvento;