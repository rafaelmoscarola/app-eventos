import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "./firebase";

const numeroDesdeTexto = (valor) => {
  if (typeof valor === "number") return valor;

  const limpio = String(valor || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : 0;
};

const formatoMoneda = (valor, moneda = "ARS") => {
  const numero = numeroDesdeTexto(valor);
  const prefijo = moneda === "USD" ? "USD " : "$";

  return prefijo + numero.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatoFecha = (valor) => {
  if (!valor) return "-";

  const fecha = typeof valor === "number"
    ? new Date(valor)
    : new Date(String(valor).includes("T") ? valor : String(valor) + "T00:00:00");

  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const etiquetaMedioPago = (medio) => {
  if (medio === "transferencia") return "Transferencia";
  if (medio === "efectivo") return "Efectivo";
  if (medio === "tarjeta") return "Tarjeta";
  return medio || "Sin especificar";
};

const generarPdfRecibo = ({ propuesta, recibo }) => {
  const pdf = new jsPDF();
  const ancho = pdf.internal.pageSize.getWidth();
  const margen = 20;
  let y = 24;

  const recibos = [...(propuesta.recibos || [])]
    .sort((a, b) => (a.creada || 0) - (b.creada || 0));

  const monedaPresupuesto = recibo.monedaPresupuesto || propuesta.moneda || "ARS";
  const presupuesto = numeroDesdeTexto(recibo.importePresupuesto || propuesta.presupuesto);
  const recibosActivos = recibos.filter(item => item.estado !== "anulado");
  const totalAplicado = recibosActivos.reduce(
    (total, item) => total + numeroDesdeTexto(item.aplicadoPresupuesto),
    0
  );
  const saldoActual = Math.max(presupuesto - totalAplicado, 0);

  pdf.setFillColor(17, 17, 17);
  pdf.rect(0, 0, ancho, 42, "F");

  pdf.setTextColor(197, 160, 89);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("LUISINA BAGNAROLI", margen, 18);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Diseño y producción de eventos", margen, 28);

  pdf.setTextColor(26, 26, 26);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("RECIBO DIGITAL", margen, y + 36);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Fecha de emisión: " + formatoFecha(Date.now()), margen, y + 48);
  pdf.text("Recibo: " + (recibo.id || "-"), margen, y + 55);

  if (recibo.estado === "anulado") {
    pdf.setTextColor(180, 45, 45);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("RECIBO ANULADO", ancho - margen, y + 36, { align: "right" });
    pdf.setFontSize(9);
    pdf.text("Motivo: " + (recibo.motivoAnulacion || "Sin motivo informado"), ancho - margen, y + 46, { align: "right" });
    pdf.setTextColor(26, 26, 26);
  }

  y += 78;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(40, 40, 40);

  const textoPrincipal = "Recibí de " + (propuesta.cliente || "cliente") + " la suma de " + formatoMoneda(recibo.importeEntrega, recibo.monedaEntrega) + " en concepto de entrega a cuenta para el diseño y ejecución de la organización y deco del evento a realizarse el día " + formatoFecha(propuesta.fecha) + ".";
  const lineas = pdf.splitTextToSize(textoPrincipal, ancho - margen * 2);
  pdf.text(lineas, margen, y);
  y += lineas.length * 7 + 8;

  pdf.setFont("helvetica", "bold");
  pdf.text("Medio de pago: " + etiquetaMedioPago(recibo.medioPago), margen, y);
  y += 8;

  if (recibo.monedaEntrega !== monedaPresupuesto) {
    pdf.setFont("helvetica", "normal");
    const lineaConversion = "Cotización aplicada: " + formatoMoneda(recibo.cotizacion, "ARS") + " por USD. Importe aplicado al presupuesto: " + formatoMoneda(recibo.aplicadoPresupuesto, monedaPresupuesto) + ".";
    pdf.text(pdf.splitTextToSize(lineaConversion, ancho - margen * 2), margen, y);
    y += 12;
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.text("Importe aplicado al presupuesto: " + formatoMoneda(recibo.aplicadoPresupuesto, monedaPresupuesto) + ".", margen, y);
    y += 8;
  }

  pdf.setFont("helvetica", "bold");
  pdf.text("Saldo actual: " + formatoMoneda(saldoActual, monedaPresupuesto), margen, y);
  y += 14;

  if (recibo.observacion) {
    pdf.setFont("helvetica", "normal");
    const obs = pdf.splitTextToSize("Observaciones: " + recibo.observacion, ancho - margen * 2);
    pdf.text(obs, margen, y);
    y += obs.length * 6 + 8;
  }

  pdf.setDrawColor(197, 160, 89);
  pdf.line(margen, y, ancho - margen, y);
  y += 14;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Detalle de entregas", margen, y);
  y += 10;

  const headers = ["Fecha", "Entrega", "Aplicado", "Saldo", "Estado"];
  const widths = [32, 42, 42, 42, 24];
  let x = margen;

  pdf.setFontSize(8);
  pdf.setFillColor(244, 236, 224);
  pdf.rect(margen, y - 6, ancho - margen * 2, 9, "F");
  headers.forEach((header, index) => {
    pdf.text(header, x + 1, y);
    x += widths[index];
  });
  y += 9;

  recibos.forEach((item) => {
    if (y > 270) {
      pdf.addPage();
      y = 22;
    }

    const estado = item.estado === "anulado" ? "Anulado" : "Activo";
    const fila = [
      formatoFecha(item.creada),
      formatoMoneda(item.importeEntrega, item.monedaEntrega),
      formatoMoneda(item.aplicadoPresupuesto, monedaPresupuesto),
      formatoMoneda(item.saldoPosterior, monedaPresupuesto),
      estado
    ];

    x = margen;
    pdf.setFont("helvetica", item.id === recibo.id ? "bold" : "normal");
    pdf.setTextColor(item.estado === "anulado" ? 150 : 40);

    fila.forEach((texto, index) => {
      pdf.text(String(texto), x + 1, y);
      x += widths[index];
    });

    y += 8;
  });

  pdf.setTextColor(120, 120, 120);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Documento generado digitalmente por Luisina Bagnaroli.", margen, 288);

  const nombreArchivo = "recibo-" + String(propuesta.cliente || "cliente").replace(/\s+/g, "-").toLowerCase() + ".pdf";
  pdf.save(nombreArchivo);
};

const ReciboCliente = () => {
  const { propuestaId, reciboId } = useParams();
  const [propuesta, setPropuesta] = useState(null);
  const [error, setError] = useState("");
  const [descargado, setDescargado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const ref = doc(db, "propuestas", propuestaId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("No encontramos este recibo.");
          return;
        }

        setPropuesta({
          ...snap.data(),
          _docId: snap.id
        });
      } catch (err) {
        console.error(err);
        setError("No pudimos cargar el recibo.");
      }
    };

    cargar();
  }, [propuestaId]);

  const recibo = useMemo(() => {
    return (propuesta?.recibos || []).find(item => item.id === reciboId);
  }, [propuesta, reciboId]);

  useEffect(() => {
    if (!propuesta || !recibo || descargado) return;

    generarPdfRecibo({ propuesta, recibo });
    setDescargado(true);
  }, [propuesta, recibo, descargado]);

  if (error || (propuesta && !recibo)) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        textAlign: "center"
      }}>
        {error || "Este recibo no existe o fue eliminado."}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, rgba(197,160,89,0.18), transparent 38%), #111",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px",
      textAlign: "center"
    }}>
      <div style={{ maxWidth: "520px" }}>
        <div style={{
          letterSpacing: "4px",
          color: "#c5a059",
          fontSize: "0.75rem",
          marginBottom: "18px"
        }}>
          LUISINA BAGNAROLI
        </div>

        <h1 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "2.4rem",
          marginBottom: "16px"
        }}>
          {descargado ? "Recibo descargado" : "Generando recibo"}
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.7,
          marginBottom: "24px"
        }}>
          Si la descarga no comenzó automáticamente, podés volver a descargarlo desde el botón.
        </p>

        {propuesta && recibo && (
          <button
            type="button"
            onClick={() => generarPdfRecibo({ propuesta, recibo })}
            style={{
              border: "1px solid rgba(197,160,89,0.7)",
              background: "linear-gradient(135deg, #c5a059, #8f6f35)",
              color: "#fff",
              padding: "14px 26px",
              borderRadius: "999px",
              cursor: "pointer",
              letterSpacing: "1px",
              fontWeight: 700
            }}
          >
            Descargar recibo
          </button>
        )}
      </div>
    </div>
  );
};

export default ReciboCliente;
