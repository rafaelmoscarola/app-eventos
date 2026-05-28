import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { db } from "./firebase";

const StarRating = ({ value, onChange, label }) => {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{
        color: "rgba(255,255,255,0.72)",
        fontSize: "0.78rem",
        letterSpacing: "2px",
        textTransform: "uppercase",
        marginBottom: "10px"
      }}>
        {label}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} estrellas`}
            style={{
              border: "none",
              background: "transparent",
              color: star <= value ? "#f2cf72" : "rgba(255,255,255,0.22)",
              fontSize: "2.25rem",
              lineHeight: 1,
              cursor: "pointer",
              textShadow: star <= value
                ? "0 0 16px rgba(242,207,114,0.55)"
                : "none",
              transition: "0.22s ease"
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

const EncuestaCliente = () => {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [cantidadResenasEvento, setCantidadResenasEvento] = useState(0);
  const [error, setError] = useState("");
  const [calificaciones, setCalificaciones] = useState({
    atencion: 0,
    organizacion: 0,
    decoracion: 0
  });

  useEffect(() => {
    const cargarEvento = async () => {
      try {
        const snap = await getDoc(doc(db, "eventos", id));
        if (snap.exists()) {
          setEvento({ ...snap.data(), _docId: snap.id });
        }

        const resenasEvento = await getDocs(
          query(collection(db, "resenas"), where("eventoId", "==", id))
        );
        setCantidadResenasEvento(resenasEvento.size);
      } catch (err) {
        console.error("Error cargando encuesta:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarEvento();
  }, [id]);

  const promedio = useMemo(() => {
    const valores = Object.values(calificaciones);
    if (valores.some((valor) => !valor)) return 0;
    return Number((valores.reduce((acc, valor) => acc + valor, 0) / valores.length).toFixed(1));
  }, [calificaciones]);

  const cambiarCalificacion = (campo, valor) => {
    setCalificaciones((prev) => ({ ...prev, [campo]: valor }));
  };

  const enviarEncuesta = async () => {
    setError("");

    if (!evento) {
      setError("Esta encuesta ya no se encuentra disponible.");
      return;
    }

    if (!nombre.trim() || !mensaje.trim()) {
      setError("Completá tu nombre y dejá un mensaje breve.");
      return;
    }

    if (!promedio) {
      setError("Marcá una calificación en las tres categorías.");
      return;
    }

    try {
      setEnviando(true);

      const snapshotEvento = await getDocs(
        query(collection(db, "resenas"), where("eventoId", "==", id))
      );

      if (snapshotEvento.size >= 3) {
        setError("Este evento ya recibió el máximo de 3 mensajes.");
        return;
      }

      await addDoc(collection(db, "resenas"), {
        eventoId: id,
        eventoTitulo: evento.nombre || "Evento",
        fechaEvento: evento.fecha || "",
        nombre: nombre.trim(),
        mensaje: mensaje.trim(),
        atencion: calificaciones.atencion,
        organizacion: calificaciones.organizacion,
        decoracion: calificaciones.decoracion,
        promedio,
        publicada: true,
        creada: Date.now()
      });

      const snapshot = await getDocs(
        query(collection(db, "resenas"), orderBy("creada", "desc"))
      );

      const sobrantes = snapshot.docs.slice(20);
      await Promise.all(
        sobrantes.map((item) => deleteDoc(doc(db, "resenas", item.id)))
      );

      setCantidadResenasEvento(snapshotEvento.size + 1);
      setEnviado(true);
      setNombre("");
      setMensaje("");
      setCalificaciones({
        atencion: 0,
        organizacion: 0,
        decoracion: 0
      });
    } catch (err) {
      console.error("Error enviando encuesta:", err);
      setError("No pudimos enviar la encuesta. Probá nuevamente en unos segundos.");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        color: "#fff"
      }}>
        Cargando encuesta...
      </div>
    );
  }

  if (!evento) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        color: "#fff",
        padding: "24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "520px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "18px" }}>Encuesta no disponible</h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            El evento ya no está activo o el enlace dejó de estar disponible.
          </p>
        </div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(197,160,89,0.2), transparent 42%), #080808",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "620px" }}>
          <div style={{
            color: "#f2cf72",
            fontSize: "3rem",
            marginBottom: "18px",
            textShadow: "0 0 22px rgba(242,207,114,0.5)"
          }}>
            ★★★★★
          </div>
          <h1 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(2.2rem, 8vw, 4.5rem)",
            lineHeight: 1.05,
            marginBottom: "22px"
          }}>
            Gracias por tu mensaje
          </h1>
          <p style={{ color: "rgba(255,255,255,0.74)", lineHeight: 1.9 }}>
            Tu opinión nos ayuda a seguir cuidando cada detalle de las celebraciones que acompañamos.
          </p>

          {cantidadResenasEvento < 3 ? (
            <button
              type="button"
              onClick={() => {
                setEnviado(false);
                setError("");
              }}
              style={{
                marginTop: "28px",
                border: "1px solid rgba(242,207,114,0.55)",
                borderRadius: "999px",
                padding: "14px 24px",
                background: "rgba(242,207,114,0.12)",
                color: "#f2cf72",
                fontWeight: 800,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                cursor: "pointer"
              }}
            >
              Enviar otro mensaje
            </button>
          ) : (
            <p style={{
              marginTop: "24px",
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.7
            }}>
              Ya recibimos los 3 mensajes disponibles para este evento.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 20% 0%, rgba(197,160,89,0.18), transparent 34%), radial-gradient(circle at 80% 18%, rgba(255,255,255,0.08), transparent 26%), #080808",
      color: "#fff",
      padding: "clamp(24px, 5vw, 70px)"
    }}>
      <div style={{
        maxWidth: "980px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.9fr) minmax(320px, 1fr)",
        gap: "clamp(28px, 5vw, 70px)",
        alignItems: "center"
      }} className="encuesta-layout">
        <div>
          <div style={{
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#f2cf72",
            fontSize: "0.76rem",
            marginBottom: "22px"
          }}>
            Luisina Bagnaroli
          </div>

          <h1 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(2.6rem, 8vw, 5.7rem)",
            lineHeight: 0.98,
            marginBottom: "24px"
          }}>
            Queremos saber cómo viviste tu evento
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "1.05rem",
            lineHeight: 1.9,
            maxWidth: "580px"
          }}>
            Tu mirada nos importa. Cada palabra nos ayuda a mejorar, crecer y seguir creando celebraciones con la misma emoción del primer día.
          </p>

          <div style={{
            marginTop: "34px",
            padding: "20px 0",
            borderTop: "1px solid rgba(242,207,114,0.24)",
            borderBottom: "1px solid rgba(242,207,114,0.24)",
            color: "rgba(255,255,255,0.78)"
          }}>
            <strong style={{ color: "#fff" }}>{evento.nombre}</strong>
            <br />
            {evento.fecha || "Evento realizado"}
          </div>

          <p style={{
            marginTop: "16px",
            color: "rgba(255,255,255,0.58)",
            fontSize: "0.88rem",
            lineHeight: 1.7
          }}>
            Mensajes recibidos para este evento: {cantidadResenasEvento}/3
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(242,207,114,0.28)",
          borderRadius: "28px",
          padding: "clamp(24px, 4vw, 38px)",
          boxShadow: "0 28px 90px rgba(0,0,0,0.35)",
          backdropFilter: "blur(14px)"
        }}>
          <StarRating
            label="Atención durante la organización"
            value={calificaciones.atencion}
            onChange={(valor) => cambiarCalificacion("atencion", valor)}
          />

          <StarRating
            label="Organización del evento"
            value={calificaciones.organizacion}
            onChange={(valor) => cambiarCalificacion("organizacion", valor)}
          />

          <StarRating
            label="Decoración del salón"
            value={calificaciones.decoracion}
            onChange={(valor) => cambiarCalificacion("decoracion", valor)}
          />

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            spellCheck={true}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.92)",
              marginBottom: "14px",
              fontFamily: "inherit",
              fontSize: "1rem"
            }}
          />

          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Dejanos tu mensaje..."
            spellCheck={true}
            style={{
              width: "100%",
              height: "150px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.92)",
              marginBottom: "14px",
              fontFamily: "inherit",
              fontSize: "1rem",
              resize: "vertical"
            }}
          />

          {error && (
            <div style={{
              color: "#ffd6d6",
              marginBottom: "14px",
              fontSize: "0.9rem"
            }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={enviarEncuesta}
            disabled={enviando}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "999px",
              padding: "16px 24px",
              background: "linear-gradient(135deg, #d7b46a, #f5dc91, #b88d3d)",
              color: "#111",
              fontWeight: 800,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              cursor: enviando ? "default" : "pointer",
              opacity: enviando ? 0.65 : 1,
              boxShadow: "0 18px 40px rgba(215,180,106,0.25)"
            }}
          >
            {enviando ? "Enviando..." : "Enviar calificación"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .encuesta-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EncuestaCliente;