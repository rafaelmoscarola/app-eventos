import React from "react";

const MensajesPDFPremium = React.forwardRef(({ evento, mensajes }, ref) => {

  return (
    <div
      ref={ref}
      style={{
        width: "800px",
        background: "#f8f6f2",
        padding: "50px",
        fontFamily: "Arial",
        color: "#333"
      }}
    >

      {/* PORTADA */}
      <div style={{
        textAlign: "center",
        marginBottom: "50px"
      }}>

        <h1 style={{
          fontFamily: "Brittany Signature",
          fontSize: "52px",
          marginBottom: "10px",
          color: "#222"
        }}>
          {evento?.nombre}
        </h1>

        <p style={{
          fontSize: "18px",
          color: "#777"
        }}>
          Libro de mensajes del evento
        </p>

        <div style={{
          width: "80px",
          height: "2px",
          background: "#c9b37e",
          margin: "20px auto"
        }} />

        <p style={{ color: "#666" }}>
          💬 {mensajes.length} mensajes recibidos
        </p>

      </div>

      {/* MENSAJES */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>

        {mensajes.map((m) => (

          <div
            key={m.id}
            style={{
              background: "#dcf8c6",
              padding: "18px",
              borderRadius: "18px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
            }}
          >

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px"
            }}>

              <strong style={{
                fontSize: "16px"
              }}>
                {m.nombre}
              </strong>

              <span style={{
                fontSize: "12px",
                color: "#888"
              }}>
                {m.fecha?.toDate?.().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>

            </div>

            <p style={{
              fontSize: "15px",
              lineHeight: "1.6"
            }}>
              {m.mensaje}
            </p>

            <div style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#666"
            }}>
              👍 {m.likes || 0} &nbsp;&nbsp; 👎 {m.dislikes || 0}
            </div>

          </div>

        ))}

      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: "60px",
        textAlign: "center",
        color: "#999",
        fontSize: "12px"
      }}>
        Luisina Bagnaroli · Diseño de Eventos
      </div>

    </div>
  );
});

export default MensajesPDFPremium;