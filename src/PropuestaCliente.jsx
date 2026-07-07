import React, {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useLocation
} from "react-router-dom";

import {
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "./firebase";
import {
  templatesPropuesta,
  contenidoGlobal
} from "./templatesPropuesta";
import { jsPDF } from "jspdf";

const PropuestaCliente = () => {
     const { id } = useParams();
  const location = useLocation();
  const modoRegalo = new URLSearchParams(location.search).get("regalo");
  const nombreRegaloDecoded = modoRegalo ? decodeURIComponent(modoRegalo.replace(/-/g, " ")) : null;
  const [regaloPantallaMostrada, setRegaloPantallaMostrada] = useState(false);
  const [regaloConfeti, setRegaloConfeti] = useState(false);
  const [propuesta, setPropuesta] =
  useState(null);
  const [mostrarBienvenidaPropuesta, setMostrarBienvenidaPropuesta] =
  useState(!modoRegalo);
  const [abriendoPropuesta, setAbriendoPropuesta] =
  useState(false);
  const [mostrarPopupCotillon, setMostrarPopupCotillon] =
  useState(false);
  const [popupCotillonMostrado, setPopupCotillonMostrado] =
  useState(false);
  useEffect(() => {

  const cargarPropuesta = async () => {

    try {

      const ref = doc(
        db,
        "propuestas",
        id
      );

      const snap = await getDoc(ref);

      if (snap.exists()) {

        setPropuesta({
          ...snap.data(),
          _docId: snap.id
        });

      }

    } catch (error) {

      console.error(error);

    }

  };

  cargarPropuesta();

}, [id]);
const template =
  templatesPropuesta[
    propuesta?.tipo
  ]?.[
    propuesta?.estilo
  ] ||
  (propuesta?.tipo === "alquiler"
    ? templatesPropuesta.alquiler?.mobiliario
    : null);
  const simboloMoneda =
  propuesta?.moneda === "USD"
    ? "USD "
    : "$";
const esAlquiler =
  propuesta?.tipo === "alquiler";
const esEmpresas =
  propuesta?.tipo === "empresas";
const esRegalo = Boolean(modoRegalo);

const descargarPropuestaPDF = () => {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const marginX = 18;
  const anchoUtil = W - marginX * 2;
  let y = 0;
  const dorado = [197, 160, 89];
  const oscuro = [26, 26, 26];
  const grisTexto = [80, 80, 80];
  const blanco = [255, 255, 255];

  // Cabecera
  pdf.setFillColor(18, 18, 18);
  pdf.rect(0, 0, W, 46, "F");
  pdf.setFillColor(...dorado);
  pdf.rect(0, 0, 5, 46, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...blanco);
  pdf.text("Luisina Bagnaroli", marginX + 4, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(200, 180, 130);
  pdf.text("DISEÑO Y PRODUCCIÓN DE EVENTOS", marginX + 4, 28);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...dorado);
  pdf.text("PROPUESTA CORPORATIVA", W - marginX, 20, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(180, 160, 110);
  const fechaHoy = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  pdf.text(fechaHoy, W - marginX, 28, { align: "right" });
  y = 58;

  // Título
  pdf.setFont("times", "italic");
  pdf.setFontSize(28);
  pdf.setTextColor(...oscuro);
  pdf.text("Propuesta para:", marginX, y);
  y += 11;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...dorado);
  pdf.text(propuesta.cliente || "Cliente", marginX, y);
  y += 5;
  pdf.setDrawColor(...dorado);
  pdf.setLineWidth(0.6);
  pdf.line(marginX, y, marginX + 80, y);
  y += 12;

  // Datos del evento
  pdf.setFillColor(248, 246, 242);
  pdf.roundedRect(marginX, y, anchoUtil, 44, 4, 4, "F");
  pdf.setDrawColor(...dorado);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(marginX, y, anchoUtil, 44, 4, 4, "S");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...dorado);
  pdf.text("DATOS DEL EVENTO", marginX + 7, y + 8);
  y += 13;
  const colW = anchoUtil / 2 - 6;
  const datosEvento = [
    { label: "Fecha", valor: propuesta.fecha || "-" },
    { label: "Lugar", valor: propuesta.lugar || "-" },
    { label: "Espacio / Salón", valor: propuesta.salon || propuesta.espacioSalon || "-" },
    { label: "Invitados", valor: propuesta.invitados ? String(propuesta.invitados) : "-" },
  ];
  datosEvento.forEach((dato, i) => {
    const col = i % 2;
    const xPos = marginX + 7 + col * (colW + 12);
    const yFila = y + Math.floor(i / 2) * 13;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...grisTexto);
    pdf.text(dato.label.toUpperCase(), xPos, yFila);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...oscuro);
    pdf.text(dato.valor, xPos, yFila + 5);
  });
  y += 40;

  // Costos
  const simbolo = propuesta.moneda === "USD" ? "USD " : "$";
  const costos = [
    { label: "VALOR TOTAL DEL SERVICIO", valor: propuesta.presupuesto ? `${simbolo}${propuesta.presupuesto}` : "-", destacado: true },
    { label: "ANTICIPO REQUERIDO", valor: propuesta.anticipo ? `${simbolo}${propuesta.anticipo}` : "-", destacado: true },
    { label: "MODALIDAD DE PAGO", valor: propuesta.cuotas || "-", destacado: false },
  ];
  const costoW = anchoUtil / costos.length - 5;
  costos.forEach((costo, i) => {
    const xCard = marginX + i * (costoW + 7.5);
    const bgColor = costo.destacado ? [18, 18, 18] : [245, 243, 238];
    const textColor = costo.destacado ? blanco : oscuro;
    const labelColor = costo.destacado ? [180, 155, 100] : [...grisTexto];
    pdf.setFillColor(...bgColor);
    pdf.roundedRect(xCard, y, costoW, 32, 4, 4, "F");
    if (costo.destacado) { pdf.setFillColor(...dorado); pdf.roundedRect(xCard, y, costoW, 2.5, 1, 1, "F"); }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...labelColor);
    pdf.text(costo.label, xCard + 7, y + 10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(costo.destacado ? 15 : 12);
    pdf.setTextColor(...textColor);
    pdf.text(costo.valor, xCard + 7, y + 24);
  });
  y += 44;

  // Incluye
  const incluyeTexto = propuesta.incluye || "-";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...dorado);
  pdf.text("INCLUYE", marginX, y);
  pdf.setDrawColor(...dorado);
  pdf.setLineWidth(0.4);
  pdf.line(marginX + 18, y - 1, marginX + anchoUtil * 0.45, y - 1);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...grisTexto);
  const lineasIncluye = pdf.splitTextToSize(incluyeTexto, anchoUtil * 0.9);
  const altoIncluye = lineasIncluye.length * 5.2 + 10;
  pdf.setFillColor(252, 250, 246);
  pdf.roundedRect(marginX, y, anchoUtil, altoIncluye, 3, 3, "F");
  y += 6;
  lineasIncluye.forEach(linea => {
    if (y > 265) { pdf.addPage(); y = 20; }
    pdf.text(linea, marginX + 6, y);
    y += 5.2;
  });
  y += 8;

  // Observaciones
  if (propuesta.observaciones && propuesta.observaciones.trim() !== "") {
    if (y > 240) { pdf.addPage(); y = 20; }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...dorado);
    pdf.text("OBSERVACIONES", marginX, y);
    pdf.setDrawColor(...dorado);
    pdf.setLineWidth(0.4);
    pdf.line(marginX + 36, y - 1, marginX + anchoUtil * 0.55, y - 1);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...grisTexto);
    const lineasObs = pdf.splitTextToSize(propuesta.observaciones, anchoUtil * 0.9);
    const altoObs = lineasObs.length * 5.2 + 10;
    pdf.setFillColor(252, 250, 246);
    pdf.roundedRect(marginX, y, anchoUtil, altoObs, 3, 3, "F");
    y += 6;
    lineasObs.forEach(linea => {
      if (y > 268) { pdf.addPage(); y = 20; }
      pdf.text(linea, marginX + 6, y);
      y += 5.2;
    });
    y += 8;
  }

  // Contacto
  if (y > 240) { pdf.addPage(); y = 20; }
  pdf.setFillColor(245, 243, 238);
  pdf.roundedRect(marginX, y, anchoUtil, 24, 4, 4, "F");
  pdf.setFillColor(...dorado);
  pdf.roundedRect(marginX, y, anchoUtil, 2.5, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...oscuro);
  pdf.text("¿Consultas o querés avanzar con esta propuesta?", marginX + 7, y + 11);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grisTexto);
  pdf.text("WhatsApp: +54 340 459-7725  ·  @armalocomoquieras", marginX + 7, y + 19);

  // Pie
  const totalPages = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(18, 18, 18);
    pdf.rect(0, 285, W, 12, "F");
    pdf.setFont("times", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(180, 155, 100);
    pdf.text("Luisina Bagnaroli · Diseño y producción de eventos", W / 2, 292, { align: "center" });
    if (totalPages > 1) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(130, 110, 80);
      pdf.text(`${p} / ${totalPages}`, W - marginX, 292, { align: "right" });
    }
  }

  const nombreArchivo = `Propuesta_LB_${(propuesta.cliente || "Empresa").replace(/\s+/g, "_")}.pdf`;
  pdf.save(nombreArchivo);
};
   useEffect(() => {

    if (!propuesta || mostrarBienvenidaPropuesta) return;

    const elementos =
      document.querySelectorAll(".reveal-propuesta");

    // En modo regalo, mostrar todo directamente sin animación
    if (esRegalo) {
      elementos.forEach(el => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }

        });

      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px 18% 0px"
      }
    );

    elementos.forEach(el =>
      observer.observe(el)
    );

    return () => observer.disconnect();

  }, [propuesta, mostrarBienvenidaPropuesta, regaloPantallaMostrada]);

  useEffect(() => {

    if (!propuesta || mostrarBienvenidaPropuesta || popupCotillonMostrado) return;

    const selectorPopup =
      propuesta?.tipo === "alquiler"
        ? ".alquiler-popup-trigger"
        : ".frase-cotillon-trigger";

    const disparador = document.querySelector(selectorPopup);

    if (!disparador) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setMostrarPopupCotillon(true);
            setPopupCotillonMostrado(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: propuesta?.tipo === "alquiler" ? 0.2 : 0.35,
        rootMargin: propuesta?.tipo === "alquiler" ? "0px 0px -18% 0px" : "0px 0px -8% 0px"
      }
    );

    observer.observe(disparador);

    return () => observer.disconnect();

  }, [propuesta, mostrarBienvenidaPropuesta, popupCotillonMostrado]);

  useEffect(() => {

  if (document.getElementById("style-propuesta-effects")) return;

  const style = document.createElement("style");
  style.id = "style-propuesta-effects";

  style.innerHTML = `
      .propuesta-atmosfera {
      isolation: isolate;
    }

    .propuesta-luces-fondo {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      background:
        radial-gradient(circle at 18% 22%, rgba(255, 43, 214, 0.12), transparent 28%),
        radial-gradient(circle at 82% 18%, rgba(0, 212, 255, 0.09), transparent 30%),
        radial-gradient(circle at 50% 85%, rgba(255, 215, 120, 0.08), transparent 34%),
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.045), transparent 22%),
        #111;
      filter: blur(1px);
    }

    .propuesta-luces-fondo::before {
      content: "";
      position: absolute;
      inset: -20%;
      background:
        conic-gradient(
          from 0deg,
          transparent 0deg,
          rgba(255,255,255,0.025) 18deg,
          transparent 34deg,
          transparent 80deg,
          rgba(255,43,214,0.035) 100deg,
          transparent 118deg,
          transparent 190deg,
          rgba(0,212,255,0.03) 212deg,
          transparent 235deg,
          transparent 360deg
        );
      opacity: 0.75;
      animation: discoLightRotate 38s linear infinite;
      transform-origin: center;
    }

    .propuesta-luces-fondo::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.035), transparent 3%),
        radial-gradient(circle at 35% 44%, rgba(255,255,255,0.03), transparent 2.5%),
        radial-gradient(circle at 63% 28%, rgba(255,255,255,0.035), transparent 3%),
        radial-gradient(circle at 74% 63%, rgba(255,255,255,0.03), transparent 2.5%),
        radial-gradient(circle at 48% 72%, rgba(255,255,255,0.026), transparent 3%);
      opacity: 0.65;
      animation: discoSmokeDrift 16s ease-in-out infinite alternate;
    }

    @keyframes discoLightRotate {
      from {
        transform: rotate(0deg) scale(1.05);
      }
      to {
        transform: rotate(360deg) scale(1.05);
      }
    }


    .propuesta-luces-fondo.magia-teatro {
      background:
        radial-gradient(circle at 18% 24%, rgba(93, 255, 185, 0.13), transparent 26%),
        radial-gradient(circle at 72% 18%, rgba(178, 89, 255, 0.14), transparent 30%),
        radial-gradient(circle at 50% 78%, rgba(255, 216, 120, 0.11), transparent 34%),
        linear-gradient(180deg, rgba(22, 7, 36, 0.82), rgba(7, 13, 12, 0.95)),
        #0d0a12;
    }

    .propuesta-luces-fondo.magia-teatro::before {
      background:
        repeating-conic-gradient(
          from 12deg,
          transparent 0deg,
          rgba(255, 216, 120, 0.028) 8deg,
          transparent 18deg,
          transparent 54deg,
          rgba(94, 255, 186, 0.024) 68deg,
          transparent 82deg
        );
      opacity: 0.9;
      animation: teatroMagicRotate 52s linear infinite;
    }

    .propuesta-luces-fondo.magia-teatro::after {
      background:
        radial-gradient(circle at 12% 18%, rgba(255,255,255,0.15) 0 1px, transparent 2px),
        radial-gradient(circle at 28% 62%, rgba(255,216,120,0.16) 0 1px, transparent 2px),
        radial-gradient(circle at 47% 31%, rgba(94,255,186,0.13) 0 1px, transparent 2px),
        radial-gradient(circle at 74% 48%, rgba(255,255,255,0.14) 0 1px, transparent 2px),
        radial-gradient(circle at 88% 76%, rgba(178,89,255,0.17) 0 1px, transparent 2px);
      opacity: 0.85;
      animation: teatroSparkle 7s ease-in-out infinite alternate;
    }

    @keyframes teatroMagicRotate {
      from { transform: rotate(0deg) scale(1.08); }
      to { transform: rotate(360deg) scale(1.08); }
    }

    @keyframes teatroSparkle {
      from { transform: translate3d(-1%, -1%, 0) scale(1); filter: blur(0px); }
      to { transform: translate3d(1%, 1.2%, 0) scale(1.04); filter: blur(3px); }
    }

    .nombre-castillo {
      position: relative;
      display: inline-block;
      padding: 0.38em 0.72em 0.32em;
      margin: -0.32em -0.46em -0.12em;
      overflow: visible;
      line-height: 1.38 !important;
      isolation: isolate;
      background: linear-gradient(92deg, #fff8d6, #ffd778 24%, #f6b950 42%, #b66cff 58%, #7dffd4 78%, #fff8d6);
      background-size: 260% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      filter:
        drop-shadow(0 0 8px rgba(255, 216, 120, 0.62))
        drop-shadow(0 0 22px rgba(126, 255, 212, 0.20))
        drop-shadow(0 7px 18px rgba(0, 0, 0, 0.48));
      animation: castleNameGlow 5.5s ease-in-out infinite, nombreEntradaTeatro 1.25s ease-out both;
    }

    .nombre-castillo::before {
      content: "";
      position: absolute;
      top: 0.22em;
      left: -46%;
      width: 190px;
      height: 5px;
      border-radius: 999px;
      z-index: 3;
      background:
        radial-gradient(circle at 100% 50%, #ffffff 0 5px, rgba(255, 231, 152, 0.98) 6px, transparent 12px),
        linear-gradient(90deg, transparent 0%, rgba(126, 255, 212, 0.0) 14%, rgba(255, 216, 120, 0.96) 68%, rgba(255, 255, 255, 0.95) 100%);
      box-shadow:
        0 0 14px rgba(255, 255, 255, 0.95),
        0 0 34px rgba(255, 216, 120, 0.85),
        0 0 58px rgba(126, 255, 212, 0.42);
      transform: rotate(-13deg) translateX(-70px);
      opacity: 0;
      pointer-events: none;
      animation: estrellaFugazNombre 4.8s cubic-bezier(.16, .84, .28, 1) infinite;
    }

    .nombre-castillo::after {
      content: "";
      position: absolute;
      left: 5%;
      right: 5%;
      bottom: 0.08em;
      height: 0.82em;
      border-bottom: 2px solid rgba(255, 216, 120, 0.86);
      border-radius: 0 0 50% 50%;
      z-index: -1;
      background:
        radial-gradient(ellipse at center, rgba(255, 216, 120, 0.16), transparent 62%),
        linear-gradient(90deg, transparent, rgba(255, 216, 120, 0.22), rgba(126, 255, 212, 0.16), transparent);
      box-shadow:
        0 14px 24px rgba(255,216,120,0.22),
        inset 0 -8px 18px rgba(126,255,212,0.12);
      opacity: 0.88;
      animation: arcoMagicoNombre 4.2s ease-in-out infinite;
    }

    .nombre-magia-destellos {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 4;
      overflow: visible;
    }

    .nombre-magia-destellos span {
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #fff8d6;
      box-shadow:
        0 0 8px rgba(255, 255, 255, 0.9),
        0 0 18px rgba(255, 216, 120, 0.8),
        0 0 30px rgba(126, 255, 212, 0.4);
      opacity: 0;
      transform: scale(0.3);
      animation: destelloNombre 3.8s ease-in-out infinite;
    }

    .nombre-magia-destellos span:nth-child(1) { left: 9%; top: 18%; animation-delay: 0.25s; }
    .nombre-magia-destellos span:nth-child(2) { right: 10%; top: 30%; animation-delay: 1.2s; }
    .nombre-magia-destellos span:nth-child(3) { left: 30%; bottom: 18%; animation-delay: 2.1s; }
    .nombre-magia-destellos span:nth-child(4) { right: 28%; bottom: 12%; animation-delay: 3s; }
    .nombre-magia-destellos span:nth-child(5) { left: 52%; top: 9%; animation-delay: 1.75s; }

    @keyframes estrellaFugazNombre {
      0%, 14% {
        opacity: 0;
        transform: rotate(-13deg) translateX(-80px) translateY(12px) scaleX(0.65);
      }
      20% {
        opacity: 1;
      }
      43% {
        opacity: 1;
        transform: rotate(-13deg) translateX(520px) translateY(-28px) scaleX(1.08);
      }
      54%, 100% {
        opacity: 0;
        transform: rotate(-13deg) translateX(660px) translateY(-38px) scaleX(0.8);
      }
    }

    @keyframes arcoMagicoNombre {
      0%, 100% { opacity: 0.58; transform: scaleX(0.82) translateY(1px); filter: blur(0px); }
      50% { opacity: 1; transform: scaleX(1.04) translateY(-1px); filter: blur(0.3px); }
    }

    @keyframes destelloNombre {
      0%, 58%, 100% { opacity: 0; transform: scale(0.25) rotate(0deg); }
      64% { opacity: 1; transform: scale(1.15) rotate(45deg); }
      72% { opacity: 0.35; transform: scale(0.55) rotate(90deg); }
    }

    @keyframes nombreEntradaTeatro {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes castleNameGlow {
      0%, 100% { background-position: 0% center; filter: drop-shadow(0 0 8px rgba(255,216,120,0.35)); }
      50% { background-position: 100% center; filter: drop-shadow(0 0 18px rgba(126,255,212,0.28)); }
    }

    @keyframes castleUnderline {
      0%, 100% { opacity: 0.5; transform: scaleX(0.72); }
      50% { opacity: 1; transform: scaleX(1); }
    }
    @keyframes discoSmokeDrift {
      from {
        transform: translate3d(-1.5%, -1%, 0) scale(1);
        filter: blur(0px);
      }
      to {
        transform: translate3d(1.5%, 1%, 0) scale(1.04);
        filter: blur(5px);
      }
    }
      .frase-celebrar-wrap {
  background: transparent;
}

    .confetti-silver {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }

    .confetti-silver span {
      position: absolute;
      top: -12%;
      width: 5px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(180deg, #ffffff, #bfc3ca, #f7f7f7);
      opacity: 0.42;
      animation: silverConfettiFall linear infinite;
      box-shadow: 0 0 14px rgba(255,255,255,0.35);
    }

    .confetti-silver span:nth-child(3n) {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      opacity: 0.35;
    }

    .confetti-silver span:nth-child(4n) {
      width: 3px;
      height: 22px;
      opacity: 0.3;
    }

    ${Array.from({ length: 34 }).map((_, i) => `
      .confetti-silver span:nth-child(${i + 1}) {
        left: ${(i * 29) % 100}%;
        animation-duration: ${7 + (i % 8)}s;
        animation-delay: -${i % 10}s;
        transform: rotate(${i * 17}deg);
      }
    `).join("")}

    @keyframes silverConfettiFall {
      0% {
        transform: translateY(-20%) rotate(0deg);
      }
      100% {
        transform: translateY(130vh) rotate(360deg);
      }
    }



    .propuesta-luces-fondo.moderno {
      background:
        radial-gradient(circle at 18% 20%, rgba(0, 212, 255, 0.16), transparent 30%),
        radial-gradient(circle at 82% 18%, rgba(174, 80, 255, 0.18), transparent 30%),
        radial-gradient(circle at 52% 82%, rgba(255, 215, 120, 0.08), transparent 34%),
        #08070f;
    }

    .propuesta-luces-fondo.moderno::before {
      background:
        conic-gradient(
          from 35deg,
          transparent 0deg,
          rgba(0,212,255,0.05) 18deg,
          transparent 34deg,
          transparent 88deg,
          rgba(174,80,255,0.07) 110deg,
          transparent 128deg,
          transparent 205deg,
          rgba(255,255,255,0.04) 226deg,
          transparent 245deg,
          transparent 360deg
        );
      opacity: 0.9;
      animation: discoLightRotate 30s linear infinite;
    }

    .propuesta-luces-fondo.moderno::after {
      background:
        linear-gradient(90deg, transparent 0%, rgba(159,220,255,0.055) 48%, transparent 52%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.026) 0 1px, transparent 1px 9px),
        radial-gradient(circle at 30% 40%, rgba(255,255,255,0.05), transparent 3%),
        radial-gradient(circle at 72% 30%, rgba(0,212,255,0.06), transparent 4%),
        radial-gradient(circle at 58% 72%, rgba(174,80,255,0.055), transparent 4%);
      opacity: 0.62;
      animation: pantallaModernaScan 7s ease-in-out infinite alternate;
    }

    @keyframes pantallaModernaScan {
      from { transform: translateX(-3%) scale(1.02); filter: blur(0px); }
      to { transform: translateX(3%) scale(1.04); filter: blur(3px); }
    }
    .propuesta-luces-fondo.corporativo {
      background:
        radial-gradient(circle at 18% 18%, rgba(89, 122, 74, 0.16), transparent 30%),
        radial-gradient(circle at 82% 22%, rgba(214, 180, 110, 0.12), transparent 30%),
        radial-gradient(circle at 50% 90%, rgba(255,255,255,0.045), transparent 36%),
        #0d0f0e;
    }

    .propuesta-luces-fondo.corporativo::before {
      background:
        linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.03) 38%, transparent 62%),
        linear-gradient(245deg, transparent 0%, rgba(92,128,74,0.055) 42%, transparent 68%);
      opacity: 0.75;
      animation: discoSmokeDrift 20s ease-in-out infinite alternate;
    }

    .propuesta-luces-fondo.corporativo::after {
      background:
        radial-gradient(circle at 24% 34%, rgba(214,180,110,0.055), transparent 4%),
        radial-gradient(circle at 70% 26%, rgba(255,255,255,0.04), transparent 3%),
        radial-gradient(circle at 58% 72%, rgba(92,128,74,0.055), transparent 4%);
      opacity: 0.55;
    }


    .nombre-corporativo-shine {
      position: relative;
      display: inline-block;
      overflow: hidden;
      padding: 0 0.08em;
      background: linear-gradient(90deg, #d7b46a 0%, #f4e6bd 48%, #b99855 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent !important;
      text-shadow: 0 10px 34px rgba(0,0,0,0.34);
    }

    .nombre-corporativo-shine::after {
      content: "";
      position: absolute;
      top: -15%;
      left: -35%;
      width: 28%;
      height: 130%;
      background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0.0) 80%, transparent 100%);
      transform: skewX(-18deg);
      animation: nombreCorporativoShine 4.8s ease-in-out infinite;
    }

    @keyframes nombreCorporativoShine {
      0% { left: -40%; opacity: 0; }
      18% { opacity: 0.55; }
      42% { left: 112%; opacity: 0; }
      100% { left: 112%; opacity: 0; }
    }


    .bienvenida-propuesta {
      min-height: 100vh;
      background:
        radial-gradient(circle at 18% 20%, rgba(215,180,106,0.13), transparent 28%),
        radial-gradient(circle at 80% 18%, rgba(255,255,255,0.055), transparent 24%),
        linear-gradient(135deg, #050505 0%, #111 55%, #070707 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 42px 22px;
      overflow-x: hidden;
      animation: bienvenidaEntrada 1.45s ease both;
    }

    .bienvenida-propuesta::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 30% 42%, rgba(215,180,106,0.16), transparent 28%),
        radial-gradient(circle at 74% 20%, rgba(255,255,255,0.07), transparent 24%);
      opacity: 0;
      animation: bienvenidaLuz 2.2s ease 0.25s forwards;
    }

    .bienvenida-propuesta::after {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 50%, rgba(255,232,164,0.92), rgba(215,180,106,0.38) 18%, transparent 54%);
      opacity: 0;
      transform: scale(0.72);
      z-index: 20;
    }

    .bienvenida-propuesta.abriendo::after {
      animation: brilloAbrirPropuesta 1.05s ease forwards;
    }

    .bienvenida-propuesta-card {
      width: min(1120px, 100%);
      display: grid;
      grid-template-columns: minmax(280px, 0.82fr) minmax(320px, 1.18fr);
      gap: 54px;
      align-items: center;
      opacity: 0;
      transform: translateY(24px);
      animation: bienvenidaCardEntrada 1.25s ease 0.45s forwards;
    }

    .bienvenida-propuesta.abriendo .bienvenida-propuesta-card {
      animation: bienvenidaCardSalida 0.95s ease forwards;
    }

    .bienvenida-propuesta-foto {
      position: relative;
      border-radius: 34px;
      overflow: hidden;
      min-height: 620px;
      box-shadow: 0 34px 90px rgba(0,0,0,0.55);
      border: 1px solid rgba(215,180,106,0.28);
    }

    .bienvenida-propuesta-foto img {
      width: 100%;
      height: 100%;
      min-height: 620px;
      display: block;
      object-fit: cover;
      filter: grayscale(100%) contrast(1.05);
    }

    .bienvenida-propuesta-foto::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.42), transparent 42%);
    }

    .bienvenida-propuesta-texto {
      position: relative;
      padding: 10px 0;
    }

    .bienvenida-propuesta-label {
      letter-spacing: 5px;
      font-size: 0.72rem;
      color: #d7b46a;
      font-weight: 700;
      margin-bottom: 22px;
      text-transform: uppercase;
    }

    .bienvenida-propuesta-texto h1 {
      font-family: Georgia, serif;
      font-size: clamp(2.6rem, 5vw, 5.2rem);
      line-height: 0.95;
      margin: 0 0 30px 0;
      font-weight: 400;
    }

    .bienvenida-propuesta-texto p {
      color: rgba(255,255,255,0.76);
      font-size: 1.02rem;
      line-height: 1.85;
      margin: 0 0 16px 0;
    }

    .bienvenida-propuesta-firma {
      font-family: "Brittany Signature", cursive;
      font-size: clamp(2.7rem, 6vw, 5.2rem);
      color: #d7b46a;
      line-height: 1;
      margin: 28px 0 30px 0;
      text-shadow: 0 0 20px rgba(215,180,106,0.28);
    }

    .bienvenida-propuesta-btn {
      border: 1px solid rgba(215,180,106,0.78);
      background: linear-gradient(135deg, #d7b46a 0%, #f3d889 46%, #b99245 100%);
      color: #111;
      padding: 18px 34px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 18px 48px rgba(215,180,106,0.22);
      animation: bienvenidaPulse 3.2s ease-in-out infinite;
    }

    .bienvenida-propuesta-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 60px rgba(215,180,106,0.34);
    }

    @keyframes bienvenidaEntrada {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes bienvenidaLuz {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes bienvenidaCardEntrada {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.985);
        filter: blur(7px);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes bienvenidaCardSalida {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
      to {
        opacity: 0;
        transform: translateY(-14px) scale(1.018);
        filter: blur(10px);
      }
    }

    @keyframes brilloAbrirPropuesta {
      0% {
        opacity: 0;
        transform: scale(0.72);
      }
      38% {
        opacity: 0.9;
        transform: scale(1.05);
      }
      100% {
        opacity: 0;
        transform: scale(1.35);
      }
    }

    @keyframes bienvenidaPulse {
      0%, 100% {
        transform: scale(1);
        filter: brightness(1);
      }
      50% {
        transform: scale(1.025);
        filter: brightness(1.08);
      }
    }

    .cotillon-popup-backdrop {
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 22px;
      animation: cotillonBackdropIn 0.35s ease both;
    }

    .cotillon-popup-card {
      width: min(920px, 100%);
      background:
        radial-gradient(circle at 18% 12%, rgba(215,180,106,0.18), transparent 32%),
        linear-gradient(135deg, rgba(18,18,18,0.98), rgba(7,7,7,0.98));
      border: 1px solid rgba(215,180,106,0.34);
      border-radius: 34px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      box-shadow: 0 34px 100px rgba(0,0,0,0.58);
      animation: cotillonCardIn 0.42s ease both;
    }

    .cotillon-popup-img {
      min-height: 440px;
      background-image: url('/propuestas/cotillon.webp');
      background-size: cover;
      background-position: center;
    }

    .cotillon-popup-content {
      padding: 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cotillon-popup-kicker {
      color: #d7b46a;
      font-size: 0.7rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .cotillon-popup-content h2 {
      font-family: Georgia, serif;
      font-size: clamp(2rem, 4vw, 3.7rem);
      line-height: 1;
      font-weight: 400;
      margin: 0 0 22px;
      color: #fff;
    }

    .cotillon-popup-content p {
      color: rgba(255,255,255,0.78);
      font-size: 1rem;
      line-height: 1.8;
      margin: 0 0 16px;
    }

    .cotillon-popup-btn {
      align-self: flex-start;
      margin-top: 16px;
      border: 1px solid rgba(215,180,106,0.82);
      background: linear-gradient(135deg, #d7b46a 0%, #f3d889 48%, #b99245 100%);
      color: #111;
      padding: 15px 28px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.74rem;
      font-weight: 900;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      box-shadow: 0 16px 44px rgba(215,180,106,0.22);
    }

    @keyframes cotillonBackdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes cotillonCardIn {
      from { opacity: 0; transform: translateY(18px) scale(0.985); filter: blur(8px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }

    @media (max-width: 850px) {
      .bienvenida-propuesta-card {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .bienvenida-propuesta-foto,
      .bienvenida-propuesta-foto img {
        min-height: 420px;
      }

      .cotillon-popup-card {
        grid-template-columns: 1fr;
        border-radius: 26px;
      }

      .cotillon-popup-img {
        min-height: 230px;
      }

      .cotillon-popup-content {
        padding: 28px 24px 26px;
      }

      .cotillon-popup-btn {
        width: 100%;
        justify-content: center;
        text-align: center;
      }

      .bienvenida-propuesta-texto {
        text-align: center;
      }
    }
    .reveal-propuesta {
      opacity: 0;
      transform: translateY(34px);
      transition: opacity 1s ease, transform 1s ease;
    }

    .reveal-propuesta.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .hero-propuesta-bg {
      animation: heroPropuestaZoom 14s ease-out forwards;
      transform-origin: center;
    }

    @keyframes heroPropuestaZoom {
      from {
        transform: scale(1.08);
      }
      to {
        transform: scale(1);
      }
    }

    .img-propuesta-hover {
      transition: transform 1.1s ease, filter 1.1s ease;
    }

    .img-propuesta-card:hover .img-propuesta-hover {
      transform: scale(1.045);
      filter: brightness(1.08);
    }

    .propuesta-content {
      position: relative;
      z-index: 1;
    }

    .propuesta-atmosfera.propuesta-infantil {
      background: linear-gradient(180deg, #9fdcff 0%, #dff5ff 35%, #fff8ef 72%, #f7efe7 100%);
    }

    .propuesta-luces-fondo.cielo-infantil {
      background:
        radial-gradient(circle at 18% 16%, rgba(255,255,255,0.95), transparent 16%),
        radial-gradient(circle at 84% 14%, rgba(255,255,255,0.78), transparent 20%),
        linear-gradient(180deg, #7bcdfd 0%, #bfeeff 42%, #fff8ef 100%);
      filter: none;
      opacity: 1;
    }

    .propuesta-luces-fondo.cielo-infantil::before {
      inset: -10%;
      background:
        radial-gradient(ellipse at 14% 26%, rgba(255,255,255,0.96) 0 13%, transparent 25%),
        radial-gradient(ellipse at 32% 22%, rgba(255,255,255,0.88) 0 11%, transparent 23%),
        radial-gradient(ellipse at 76% 32%, rgba(255,255,255,0.86) 0 14%, transparent 27%),
        radial-gradient(ellipse at 60% 16%, rgba(255,255,255,0.72) 0 10%, transparent 21%);
      opacity: 0.88;
      filter: blur(5px);
      animation: nubesInfantiles 34s ease-in-out infinite alternate;
    }

    .propuesta-luces-fondo.cielo-infantil::after {
      background:
        radial-gradient(circle at 14% 30%, rgba(255,255,255,0.9) 0 1px, transparent 2px),
        radial-gradient(circle at 24% 58%, rgba(255,230,160,0.9) 0 1px, transparent 2px),
        radial-gradient(circle at 58% 26%, rgba(255,255,255,0.85) 0 1px, transparent 2px),
        radial-gradient(circle at 76% 52%, rgba(255,212,230,0.8) 0 1px, transparent 2px),
        radial-gradient(circle at 88% 74%, rgba(255,255,255,0.9) 0 1px, transparent 2px);
      opacity: 0.72;
      animation: brillosInfantiles 8s ease-in-out infinite alternate;
    }

    @keyframes nubesInfantiles {
      from { transform: translate3d(-2%, 0, 0) scale(1.02); }
      to { transform: translate3d(2%, 1%, 0) scale(1.08); }
    }

    @keyframes brillosInfantiles {
      from { opacity: 0.45; transform: translateY(0); }
      to { opacity: 0.85; transform: translateY(-10px); }
    }

    .propuesta-infantil .propuesta-content {
      color: #2f3e45;
    }

    .propuesta-infantil .propuesta-intro-text,
    .propuesta-infantil .propuesta-equipo-text,
    .propuesta-infantil .propuesta-tecnica-section p,
    .propuesta-infantil > div:last-child p:last-child {
      color: rgba(47, 62, 69, 0.76) !important;
    }

    .nombre-infantil {
      position: relative;
      display: inline-block;
      padding: 0.34em 0.28em 0.18em 0.28em;
      overflow: visible !important;
      background: linear-gradient(90deg, #fff7bd, #ffffff, #ffe2ef, #bfeeff, #fff7bd);
      background-size: 260% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent !important;
      animation: nombreInfantilBrillo 7s ease-in-out infinite;
    }

    .nombre-infantil::before {
      content: "";
      position: absolute;
      left: 7%;
      right: 7%;
      bottom: 0.16em;
      height: 2px;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(255,230,160,0.9), transparent);
      box-shadow: 0 0 16px rgba(255,230,160,0.55);
    }

    .nombre-infantil .nombre-magia-destellos span {
      background: #fff7bd;
      box-shadow: 0 0 12px rgba(255,236,170,0.95), 0 0 28px rgba(179,224,255,0.72);
    }

    @keyframes nombreInfantilBrillo {
      0%, 100% { background-position: 0% center; filter: drop-shadow(0 0 12px rgba(255,240,170,0.4)); }
      50% { background-position: 100% center; filter: drop-shadow(0 0 22px rgba(153,213,255,0.6)); }
    }

    .galeria-infantil-grid .img-propuesta-card {
      border: 8px solid rgba(255,255,255,0.78);
      background: rgba(255,255,255,0.55);
      box-shadow: 0 24px 70px rgba(120, 90, 55, 0.16);
    }

    .galeria-infantil-grid .img-propuesta-card::after {
      content: "";
      position: absolute;
      inset: 10px;
      border-radius: inherit;
      border: 1px solid rgba(255,255,255,0.5);
      pointer-events: none;
    }

    .banner-galeria-infantil {
      border: 8px solid rgba(255,255,255,0.78);
      border-radius: 34px;
      overflow: hidden;
      box-shadow: 0 24px 70px rgba(120,90,55,0.16);
      background: rgba(255,255,255,0.5);
    }

    .panel-tecnico-infantil {
      padding: 66px 56px 58px;
      border-radius: 42px;
      background:
        radial-gradient(circle at 8% 12%, rgba(255,214,229,0.72), transparent 22%),
        radial-gradient(circle at 88% 18%, rgba(190,235,255,0.82), transparent 24%),
        radial-gradient(circle at 50% 100%, rgba(255,235,193,0.48), transparent 32%),
        linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,248,238,0.92));
      box-shadow: 0 30px 90px rgba(120, 90, 55, 0.16);
      border: 1px solid rgba(255,255,255,0.78);
      color: #2f3e45;
      position: relative;
      overflow: hidden;
    }

    .panel-tecnico-infantil::before {
      content: "";
      position: absolute;
      inset: 22px;
      border-radius: 32px;
      border: 1px dashed rgba(210,164,100,0.34);
      pointer-events: none;
    }

    .panel-tecnico-infantil > * {
      position: relative;
      z-index: 1;
    }

    .panel-tecnico-infantil .propuesta-tech-card,
    .panel-tecnico-infantil .propuesta-text-card {
      padding: 30px 30px 28px !important;
      border-radius: 26px !important;
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(210,164,100,0.2) !important;
      box-shadow: 0 18px 42px rgba(120,90,55,0.09) !important;
      color: #2f3e45;
      min-height: 150px;
      overflow: hidden;
    }

    .panel-tecnico-infantil .propuesta-tech-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .panel-tecnico-infantil .propuesta-text-card {
      min-height: 170px;
    }

    .panel-tecnico-infantil .propuesta-tech-card div,
    .panel-tecnico-infantil .propuesta-text-card div {
      color: rgba(47,62,69,0.58) !important;
    }

    .panel-tecnico-infantil strong,
    .panel-tecnico-infantil .propuesta-text-card div:first-child {
      color: #b98244 !important;
      text-shadow: none !important;
    }

    @media (max-width: 760px) {
      .galeria-infantil-grid {
        grid-template-columns: 1fr !important;
      }

      .galeria-infantil-grid .img-propuesta-card {
        grid-column: auto !important;
        height: auto !important;
        min-height: 0 !important;
        aspect-ratio: 4 / 5 !important;
        border-width: 6px !important;
      }

      .propuesta-infantil .propuesta-hero-name {
        font-size: clamp(2.2rem, 14vw, 6.3rem) !important;
        padding-top: 0.42em !important;
        line-height: 1.28 !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 95vw !important;
        text-align: center !important;
      }

      .banner-galeria-infantil img {
        height: auto !important;
        aspect-ratio: 16 / 9 !important;
      }

      .panel-tecnico-infantil {
        padding: 30px 18px !important;
        border-radius: 28px !important;
      }
    }

    @media (max-width: 760px) {
      .propuesta-hero {
        height: 92svh !important;
        min-height: 620px !important;
        align-items: flex-end !important;
        padding: 0 18px 74px 18px !important;
      }

      .hero-propuesta-bg {
        background-position: center top !important;
      }

      .propuesta-hero-title {
        font-size: clamp(2rem, 12vw, 3.15rem) !important;
        line-height: 1.02 !important;
        margin-bottom: 8px !important;
        letter-spacing: 1px !important;
      }

      .propuesta-hero-name {
        font-size: clamp(3.1rem, 18vw, 5.2rem) !important;
        line-height: 0.95 !important;
        overflow-wrap: anywhere !important;
      }

      .propuesta-hero-frase {
        font-size: 0.98rem !important;
        line-height: 1.55 !important;
        margin-top: 20px !important;
        max-width: 94vw !important;
      }

      .propuesta-content {
        padding: 58px 16px !important;
      }

      .propuesta-intro-title,
      .propuesta-tecnica-title {
        font-size: clamp(2rem, 10vw, 2.75rem) !important;
        line-height: 1.12 !important;
      }

      .propuesta-intro-text {
        font-size: 0.98rem !important;
        line-height: 1.7 !important;
      }

      .propuesta-destacados-section {
        gap: 34px !important;
        margin-bottom: 54px !important;
      }

      .propuesta-destacados-list {
        gap: 28px !important;
        margin-bottom: 0 !important;
      }

      .img-propuesta-card {
        height: auto !important;
        aspect-ratio: 4 / 5 !important;
        border-radius: 22px !important;
        margin-bottom: 0 !important;
      }

      .img-propuesta-card img {
        object-fit: cover !important;
        object-position: center center !important;
      }

      .img-propuesta-card > div:last-child {
        left: 22px !important;
        right: 22px !important;
        bottom: 24px !important;
        max-width: none !important;
      }

      .img-propuesta-card > div:last-child > div {
        font-size: clamp(1.45rem, 8vw, 2.25rem) !important;
        line-height: 1.12 !important;
      }

      .propuesta-equipo-grid {
        grid-template-columns: 1fr !important;
        gap: 34px !important;
      }

      .propuesta-equipo-img {
        height: auto !important;
        aspect-ratio: 4 / 5 !important;
        border-radius: 24px !important;
        object-position: center top !important;
      }

      .propuesta-equipo-title {
        font-size: clamp(2.25rem, 13vw, 3.6rem) !important;
        line-height: 1.02 !important;
        margin-bottom: 24px !important;
      }

      .propuesta-equipo-text {
        font-size: 1rem !important;
        line-height: 1.75 !important;
      }

      .propuesta-equipo-mini-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 12px !important;
      }

      .propuesta-equipo-mini-card {
        height: auto !important;
        aspect-ratio: 1 / 1.18 !important;
        border-radius: 16px !important;
      }

      .frase-celebrar-wrap {
        margin-top: 82px !important;
        margin-bottom: 44px !important;
        padding: 58px 14px !important;
        border-radius: 24px !important;
      }

      .frase-celebrar-wrap > div[style*="Brittany"] {
        font-size: clamp(3rem, 17vw, 4.7rem) !important;
        line-height: 1.02 !important;
      }

      .frase-celebrar-wrap > div[style*="Georgia"] {
        font-size: clamp(2rem, 10vw, 3rem) !important;
        line-height: 1.12 !important;
      }

      .propuesta-emociones-grid {
        grid-template-columns: 1fr !important;
        gap: 18px !important;
      }

      .propuesta-emocion-card {
        height: auto !important;
        aspect-ratio: 4 / 5 !important;
        border-radius: 22px !important;
      }

      .propuesta-emocion-card img {
        object-fit: cover !important;
        object-position: center center !important;
      }

      .propuesta-banner-emocional img {
        height: auto !important;
        aspect-ratio: 16 / 9 !important;
        border-radius: 22px !important;
        object-fit: cover !important;
      }

      .propuesta-texto-emocional {
        margin-bottom: 78px !important;
      }

      .propuesta-texto-emocional p {
        font-size: 1.05rem !important;
        line-height: 1.75 !important;
      }

      .propuesta-frase-final {
        margin-bottom: 84px !important;
      }

      .propuesta-frase-final-title {
        font-size: clamp(2rem, 10vw, 3rem) !important;
        line-height: 1.14 !important;
      }

      .propuesta-tech-card,
      .propuesta-text-card {
        border-radius: 20px !important;
        padding: 24px !important;
      }

      .propuesta-text-cards-grid {
        grid-template-columns: 1fr !important;
      }

      .propuesta-atmosfera > div:last-child p:last-child {
        font-size: 1rem !important;
        line-height: 1.7 !important;
      }
    }


    .propuesta-alquiler {
      isolation: isolate;
    }

    .propuesta-luces-fondo.alquiler {
      background:
        radial-gradient(circle at 18% 18%, rgba(216,178,118,0.22), transparent 28%),
        radial-gradient(circle at 84% 12%, rgba(255,255,255,0.10), transparent 24%),
        radial-gradient(circle at 50% 72%, rgba(184,116,54,0.16), transparent 32%);
      opacity: 0.85;
    }

    .alquiler-hero {
      min-height: 100vh;
      background-size: cover;
      background-position: center;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 42px 22px;
      overflow: hidden;
    }

    .alquiler-hero::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.45) 52%, #0b0907 100%);
      z-index: 1;
    }

    .alquiler-hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: 880px;
    }

    .alquiler-kicker {
      letter-spacing: .42em;
      text-transform: uppercase;
      font-size: .72rem;
      color: #d8b276;
      margin-bottom: 24px;
    }

    .alquiler-hero h1 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: clamp(2.6rem, 6vw, 5.2rem);
      line-height: .96;
      margin: 0;
      letter-spacing: 0;
      text-shadow: 0 18px 50px rgba(0,0,0,.55);
    }

    .alquiler-hero p {
      max-width: 720px;
      margin: 28px auto 0 auto;
      font-size: 1.15rem;
      line-height: 1.75;
      color: rgba(255,255,255,.86);
    }

    .alquiler-main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 90px 24px 120px;
      position: relative;
      z-index: 1;
    }

    .alquiler-intro {
      text-align: center;
      max-width: 850px;
      margin: 0 auto 72px;
    }

    .alquiler-intro span,
    .alquiler-catalogo span,
    .alquiler-tecnico-head span {
      display: block;
      color: #d8b276;
      letter-spacing: .32em;
      font-size: .72rem;
      text-transform: uppercase;
      margin-bottom: 18px;
    }

    .alquiler-intro h2,
    .alquiler-catalogo h2,
    .alquiler-tecnico-head h2 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: clamp(2.35rem, 5vw, 4.5rem);
      line-height: 1.08;
      margin: 0;
    }

    .alquiler-intro p,
    .alquiler-catalogo p {
      color: rgba(255,255,255,.72);
      font-size: 1.06rem;
      line-height: 1.85;
      margin: 24px auto 0;
    }

    .alquiler-destacados {
      display: grid;
      gap: 28px;
    }

    .alquiler-destacado {
      position: relative;
      min-height: 520px;
      border-radius: 34px;
      overflow: hidden;
      background: #19130e;
      box-shadow: 0 26px 80px rgba(0,0,0,.38);
    }

    .alquiler-destacado img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .alquiler-destacado::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.12) 58%, rgba(0,0,0,.06));
    }

    .alquiler-destacado div {
      position: absolute;
      left: 38px;
      right: 38px;
      bottom: 36px;
      z-index: 2;
      max-width: 660px;
    }

    .alquiler-destacado span {
      color: #d8b276;
      font-size: .8rem;
      letter-spacing: .28em;
      font-weight: 700;
    }

    .alquiler-destacado h3 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: clamp(1.75rem, 4vw, 3.2rem);
      line-height: 1.08;
      margin: 12px 0 0;
      color: #fff;
    }

    .alquiler-catalogo {
      margin: 100px 0;
      border: 1px solid rgba(216,178,118,.28);
      border-radius: 30px;
      background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(216,178,118,.05));
      padding: 34px;
      display: grid;
      grid-template-columns: .85fr 1.15fr;
      gap: 30px;
      align-items: center;
      box-shadow: 0 26px 80px rgba(0,0,0,.30);
    }

    .alquiler-catalogo img {
      width: 100%;
      border-radius: 22px;
      display: block;
      background: #f5efe5;
    }

    .alquiler-galeria {
      display: grid;
      grid-template-columns: repeat(12,1fr);
      grid-auto-flow: dense;
      gap: 22px;
      margin-bottom: 90px;
    }

    .alquiler-galeria img {
      width: 100%;
      height: 380px;
      object-fit: cover;
      border-radius: 28px;
      grid-column: span 6;
      box-shadow: 0 20px 60px rgba(0,0,0,.30);
      display: block;
    }

    .alquiler-galeria img:nth-child(1),
    .alquiler-galeria img:nth-child(4) {
      grid-column: span 12;
      height: 460px;
    }

    .alquiler-galeria img:nth-child(2),
    .alquiler-galeria img:nth-child(3) {
      grid-column: span 6;
      height: 520px;
    }

    .alquiler-galeria img:nth-child(5),
    .alquiler-galeria img:nth-child(6) {
      grid-column: span 6;
      height: 420px;
    }
    .alquiler-banners {
      display: grid;
      gap: 24px;
      margin-bottom: 90px;
    }

    .alquiler-banners img {
      width: 100%;
      height: 420px;
      object-fit: cover;
      border-radius: 30px;
      display: block;
      box-shadow: 0 22px 70px rgba(0,0,0,.32);
    }

    .alquiler-tecnico {
      border: 1px solid rgba(216,178,118,.30);
      border-radius: 34px;
      padding: 44px;
      background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(216,178,118,.06));
      box-shadow: 0 26px 90px rgba(0,0,0,.34);
    }

    .alquiler-tecnico-head {
      text-align: center;
      margin-bottom: 34px;
    }

    .alquiler-tecnico-grid {
      display: grid;
      grid-template-columns: repeat(3,1fr);
      gap: 18px;
    }

    .alquiler-tecnico-grid div {
      padding: 24px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 22px;
    }

    .alquiler-tecnico-grid span {
      display: block;
      text-transform: uppercase;
      letter-spacing: .24em;
      color: rgba(255,255,255,.56);
      font-size: .72rem;
      margin-bottom: 14px;
    }

    .alquiler-tecnico-grid strong {
      display: block;
      font-size: 1.45rem;
      color: #f5d8a0;
      overflow-wrap: anywhere;
    }

    .alquiler-popup .cotillon-popup-card {
      max-width: 900px;
      grid-template-columns: 1.15fr .85fr;
    }

    .alquiler-popup-img {
      min-height: 520px;
      background-size: cover;
      background-position: center;
    }

    .alquiler-popup-content h2 {
      font-family: "Playfair Display", Georgia, serif;
    }

    @media (max-width: 760px) {
      .alquiler-hero {
        min-height: 92svh;
        align-items: flex-end;
        padding: 0 18px 76px;
      }

      .alquiler-hero h1 {
        font-size: clamp(2.15rem, 11vw, 3.6rem);
      }

      .alquiler-hero p {
        font-size: .98rem;
        line-height: 1.6;
      }

      .alquiler-main {
        padding: 62px 16px 84px;
      }

      .alquiler-destacado {
        min-height: 430px;
        border-radius: 24px;
      }

      .alquiler-destacado div {
        left: 22px;
        right: 22px;
        bottom: 24px;
      }

      .alquiler-catalogo {
        grid-template-columns: 1fr;
        margin: 70px 0;
        padding: 20px;
        border-radius: 24px;
      }

      .alquiler-galeria {
        gap: 16px;
        margin-bottom: 62px;
      }

      .alquiler-galeria img,
      .alquiler-galeria img:nth-child(1),
      .alquiler-galeria img:nth-child(2),
      .alquiler-galeria img:nth-child(3),
      .alquiler-galeria img:nth-child(4),
      .alquiler-galeria img:nth-child(5),
      .alquiler-galeria img:nth-child(6) {
        grid-column: span 12;
        height: auto;
        aspect-ratio: 4 / 5;
        border-radius: 22px;
      }

      .alquiler-banners img {
        height: auto;
        aspect-ratio: 16 / 9;
        border-radius: 22px;
      }

      .alquiler-tecnico {
        padding: 24px;
        border-radius: 26px;
      }

      .alquiler-tecnico-grid {
        grid-template-columns: 1fr;
      }

      .alquiler-popup .cotillon-popup-card {
        grid-template-columns: 1fr;
        max-width: min(92vw, 620px);
      }

      .alquiler-popup-img {
        min-height: 320px;
      }
    }
  `;

  document.head.appendChild(style);

}, []);

if (!propuesta) {

  return (

    <div style={{
      minHeight:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"#111",
      color:"#fff"
    }}>

      Cargando propuesta...

    </div>

  );

}

if (esRegalo && !regaloPantallaMostrada) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "radial-gradient(circle at 30% 20%, rgba(255,100,200,0.22), transparent 36%), radial-gradient(circle at 70% 80%, rgba(100,180,255,0.18), transparent 34%), #0d0510",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      textAlign: "center",
      padding: "30px",
      overflow: "hidden",
      zIndex: 9999
    }}>

      {/* Estrellas de fondo */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            width: i % 4 === 0 ? "6px" : "3px",
            height: i % 4 === 0 ? "6px" : "3px",
            borderRadius: "50%",
            background: i % 3 === 0 ? "#ffd6f5" : i % 3 === 1 ? "#c8e8ff" : "#fff8d0",
            opacity: 0.6 + (i % 4) * 0.1,
            animation: `parpadeoEstrella ${2 + (i % 5)}s ease-in-out ${(i % 7) * 0.3}s infinite alternate`,
            boxShadow: `0 0 ${4 + i % 5}px currentColor`
          }} />
        ))}
      </div>

      {/* Globos */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {["🎈", "🎉", "🎊", "🎈", "🎉", "🎈"].map((emoji, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${10 + i * 16}%`,
            bottom: "-10%",
            fontSize: `${2 + (i % 2) * 0.8}rem`,
            animation: `subirGlobo ${6 + i * 1.2}s ease-in ${i * 0.8}s infinite`,
            opacity: 0.85
          }}>
            {emoji}
          </div>
        ))}
      </div>

      {/* Contenido central */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: "clamp(1.8rem, 8vw, 3.2rem)",
          color: "rgba(255,255,255,0.82)",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: 300,
          letterSpacing: "2px",
          marginBottom: "18px"
        }}>
          ✨
        </div>

        <div style={{
          fontFamily: "Brittany Signature, cursive",
          fontSize: "clamp(3.5rem, 14vw, 7rem)",
          color: "#fff",
          lineHeight: 1.05,
          textShadow: "0 0 40px rgba(255,180,240,0.5), 0 0 80px rgba(200,150,255,0.3)",
          marginBottom: "10px"
        }}>
          {propuesta?.cliente}
        </div>

        <div style={{
          fontSize: "clamp(1rem, 4vw, 1.45rem)",
          color: "rgba(255,255,255,0.78)",
          fontWeight: 300,
          marginBottom: "8px",
          letterSpacing: "1px"
        }}>
          tiene un regalo de
        </div>

        <div style={{
          fontSize: "clamp(1.5rem, 6vw, 2.6rem)",
          color: "#ffd6f5",
          fontWeight: 700,
          marginBottom: "52px",
          textShadow: "0 0 20px rgba(255,150,220,0.4)"
        }}>
          {nombreRegaloDecoded}
        </div>

        <button
          type="button"
          onClick={() => {
            setRegaloConfeti(true);
            setTimeout(() => {
              setRegaloPantallaMostrada(true);
            }, 900);
          }}
          style={{
            padding: "20px 44px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(135deg, #d060a8, #e890cc, #b040c0)",
            color: "#fff",
            fontSize: "1.05rem",
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 20px 60px rgba(180,60,160,0.45)",
            transform: regaloConfeti ? "scale(0.97)" : "scale(1)",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden"
          }}
        >
          🎁 Abrir mi regalo
        </button>
      </div>

      <style>{`
        @keyframes parpadeoEstrella {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); }
        }
        @keyframes subirGlobo {
          0% { transform: translateY(0) rotate(-8deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-120vh) rotate(8deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

if (mostrarBienvenidaPropuesta) {

  return (

    <div className={`bienvenida-propuesta ${abriendoPropuesta ? "abriendo" : ""}`}>

      <div className="bienvenida-propuesta-card">

        <div className="bienvenida-propuesta-foto">
          <img
            src="/propuestas/equipo/luisi-bienvenida.webp"
            alt="Luisina Bagnaroli"
          />
        </div>

        <div className="bienvenida-propuesta-texto">
          <h1>
            HOLA!
          </h1>

          <p>
            Si llegaste hasta aquí, es porque conectaste con nuestra forma de trabajar y estás interesado en que seamos parte de uno de los momentos más importantes de tu vida. Y no imaginás la felicidad que eso genera en mí y en todo nuestro equipo.
          </p>

          <p>
            Antes que nada, gracias. Gracias por tomarte este tiempo, por valorar los detalles, las emociones y todo lo que hay detrás de cada celebración.
          </p>

          <p>
            Estás a punto de abrir nuestra propuesta... qué nervios. Detrás de cada idea, cada imagen y cada detalle, hay muchísimo corazón puesto en crear algo único, pensado especialmente para vos.
          </p>

          <p>
            Soñamos cada evento junto a quienes nos eligen. Nos involucramos, acompañamos y diseñamos cada instante entendiendo lo importante y significativo que este momento es para vos y para las personas que amás.
          </p>

          <p>
            Ojalá podamos trabajar juntos. Sería un honor acompañarte y transformar tu celebración en un recuerdo inolvidable.
          </p>

          <div className="bienvenida-propuesta-firma">
            Luisina Bagnaroli
          </div>

          <button
            type="button"
            className="bienvenida-propuesta-btn"
            disabled={abriendoPropuesta}
            onClick={() => {
              setAbriendoPropuesta(true);

              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: "auto"
                });

                setMostrarBienvenidaPropuesta(false);
              }, 950);
            }}
          >
            Abrir propuesta
          </button>

        </div>

      </div>

    </div>

  );

}


if (esAlquiler) {

  const destacadosAlquiler =
    template?.destacados || [];
  const galeriaAlquiler =
    template?.galeriaAlquiler || [];
  const bannersAlquiler =
    template?.bannersAlquiler || [];
  const tipoEventoAlquiler =
    propuesta.incluye ||
    propuesta.observaciones ||
    "Alquiler de mobiliario";
  const precioAlquiler =
    propuesta.presupuesto
      ? `${simboloMoneda}${propuesta.presupuesto}`
      : "-";

  return (

    <div
      className="propuesta-atmosfera propuesta-alquiler"
      style={{
        minHeight: "100vh",
        background: template?.pageBg || "#0b0907",
        color: "#fff",
        overflowX: "hidden"
      }}
    >

      <div className="propuesta-luces-fondo alquiler" />

      {mostrarPopupCotillon && (

        <div
          className="cotillon-popup-backdrop alquiler-popup"
          onClick={() => {
            setMostrarPopupCotillon(false);
            setPopupCotillonMostrado(true);
          }}
        >

          <div
            className="cotillon-popup-card"
            onClick={(e) => e.stopPropagation()}
          >

            <div
              className="alquiler-popup-img"
              style={{
                backgroundImage:
                  `url(${template?.popupImagen || "/propuestas/alquiler/carpa.webp"})`
              }}
            />

            <div className="cotillon-popup-content alquiler-popup-content">

              <span>
                ALQUILER PARA EXTERIOR
              </span>

              <h2>
                Consultanos por el alquiler de nuestra carpa para uso al aire libre
              </h2>

              <p>
                Contamos con una carpa de tela pensada para sumar sombra, presencia y comodidad
                en celebraciones al aire libre.
              </p>

              <button
                type="button"
                className="cotillon-popup-btn"
                onClick={() => {
                  setMostrarPopupCotillon(false);
                  setPopupCotillonMostrado(true);
                }}
              >
                Continuar
              </button>

            </div>

          </div>

        </div>

      )}

      <section
        className="alquiler-hero"
        style={{
          backgroundImage:
            `url(${template?.hero})`
        }}
      >

        <div className="alquiler-hero-content">

          <div className="alquiler-kicker">
            LUISINA BAGNAROLI
          </div>

          <h1>
            Presupuesto de alquiler
          </h1>

          <p>
            Mobiliario, livings, luces y detalles para transformar una reunión simple
            en un espacio cómodo, cálido y con estética de evento.
          </p>

        </div>

      </section>

      <main className="alquiler-main">

        <section className="alquiler-intro reveal-propuesta">

          <span>
            EVENTOS EN CASA
          </span>

          <h2>
            Que el espacio también sea parte de la experiencia
          </h2>

          <p>
            Un living bien armado, una mesa cómoda o una luz cálida pueden cambiar por completo
            la manera en la que tus invitados viven el encuentro.
          </p>

        </section>

        <section className="alquiler-destacados">

          {destacadosAlquiler.map((item, index) => (

            <article
              className="alquiler-destacado reveal-propuesta"
              key={index}
            >

              <img
                src={item.img}
                alt=""
                loading="lazy"
              />

              <div>

                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>
                  {item.frase}
                </h3>

              </div>

            </article>

          ))}

        </section>

        <section className="alquiler-catalogo alquiler-popup-trigger reveal-propuesta">

          <div>

            <span>
              CATÁLOGO DE ALQUILER
            </span>

            <h2>
              Tenemos piezas para armar livings, mesas y rincones completos
            </h2>

            <p>
              Sillas Tiffany, sillones, puffs, mesas, columnas, soportes y guirnaldas:
              elementos pensados para resolver la estética y la comodidad de tu evento sin complicarte.
            </p>

          </div>

          <img
            src={template?.catalogo}
            alt="Catálogo de alquiler"
            loading="lazy"
          />

        </section>

        <section className="alquiler-galeria">

          {galeriaAlquiler.map((img, index) => (

            <img
              key={index}
              src={img}
              alt=""
              loading="lazy"
              className="reveal-propuesta"
            />

          ))}

        </section>

        <section className="alquiler-banners">

          {bannersAlquiler.map((img, index) => (

            <img
              key={index}
              src={img}
              alt=""
              loading="lazy"
              className="reveal-propuesta"
            />

          ))}

        </section>

        <section className="alquiler-tecnico reveal-propuesta">

          <div className="alquiler-tecnico-head">

            <span>
              INFORMACIÓN DEL ALQUILER
            </span>

            <h2>
              Detalle del presupuesto
            </h2>

          </div>

          <div className="alquiler-tecnico-grid">

            <div>

              <span>
                Precio del alquiler
              </span>

              <strong>
                {precioAlquiler}
              </strong>

            </div>

            <div>

              <span>
                Tipo de evento
              </span>

              <strong>
                {tipoEventoAlquiler}
              </strong>

            </div>

            <div>

              <span>
                Lugar
              </span>

              <strong>
                {propuesta.lugar || "-"}
              </strong>

            </div>

          </div>

        </section>

      </main>

    </div>

  );

}
  return (

    <div
      className={`propuesta-atmosfera ${template?.pageClass || ""}`}
      style={{
        minHeight: "100vh",
        background: template?.pageBg || "#111",
        color: template?.textColor || "#fff",
        overflowX: "hidden",
        position: "relative"
      }}
    >

      <div className={`propuesta-luces-fondo ${template?.ambiente || ""}`} />

      {mostrarPopupCotillon && (
        <div className="cotillon-popup-backdrop" role="dialog" aria-modal="true">
          <div className="cotillon-popup-card">
            <div className="cotillon-popup-img" aria-hidden="true" />

            <div className="cotillon-popup-content">
              <div className="cotillon-popup-kicker">
                También vendemos cotillón
              </div>

              <h2>
                Sabemos lo que necesitás para la fiesta.
              </h2>

              <p>
                No compres cotillón al azar. Nosotros te ayudamos a elegirlo según el estilo de tu evento, los colores, la pista y el tipo de invitados.
              </p>

              <p>
                Contamos con una amplia variedad de cotillón para que todo combine con la celebración y puedas resolverlo con el equipo que ya está pensando tu evento.
              </p>

              <button
                type="button"
                className="cotillon-popup-btn"
                onClick={() => setMostrarPopupCotillon(false)}
              >
                Continuar con la propuesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}

<div className="propuesta-hero" style={{
  height: "100vh",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}}>

  {/* VIDEO O IMAGEN */}

  {template?.video ? (

    <video
      autoPlay
      muted
      loop
      playsInline
      style={{
        position:"absolute",
        inset:0,
        width:"100%",
        height:"100%",
        objectFit:"cover"
      }}
    >

      <source
        src={template.video}
        type="video/mp4"
      />

    </video>

  ) : (

    <div
  className="hero-propuesta-bg"
  style={{
    position:"absolute",
    inset:0,
    backgroundImage:
      `url(${template?.hero})`,
    backgroundSize:"cover",
    backgroundPosition:"center"
  }}
/>

  )}

  {/* OVERLAY */}
<div style={{
  position:"absolute",
  bottom:0,
  left:0,
  width:"100%",
  height:"300px",
  background:
    `linear-gradient(to top, ${template?.heroFadeTo || "#111"} 0%, transparent 100%)`,
  zIndex:1
}} />
  <div style={{
    position:"absolute",
    inset:0,
    background: template?.overlay
  }} />

  {/* TEXTO */}

  <div style={{
    position:"relative",
    zIndex:2,
    textAlign:"center",
    padding:"20px"
  }}>

    {!template?.ocultarTituloHero && (
      <h1 className="propuesta-hero-title" style={{
        fontSize: template?.tituloSize || "4rem",
        marginBottom: template?.tituloMarginBottom || "10px",
        fontWeight:700,
        letterSpacing: template?.tituloLetterSpacing || "0",
        textTransform: template?.tituloTransform || "none"
      }}>

        {template?.titulo}

      </h1>
    )}

    <div
      className={`propuesta-hero-name ${template?.nombreEfecto || ""}`}
      style={{
        fontFamily: template?.nombreFont || "Brittany Signature",
        fontSize: template?.nombreSize || "5rem",
        color: template?.color,
        textShadow: template?.neonShadow || "none",
        letterSpacing: template?.nombreLetterSpacing || "0",
        textTransform: template?.nombreTransform || "none",
        fontWeight: template?.nombreWeight || 400,
        lineHeight: template?.nombreLineHeight || 1.34,
        overflow: "visible"
      }}
    >
      {propuesta.cliente}
      {(template?.nombreEfecto === "nombre-castillo" || template?.nombreEfecto === "nombre-infantil") && (
        <span className="nombre-magia-destellos" aria-hidden="true">
              <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
      )}

    </div>

    <p className="propuesta-hero-frase" style={{
      maxWidth:"700px",
      margin:"30px auto 0 auto",
      fontSize:"1.2rem",
      lineHeight:1.7,
      opacity:0.9
    }}>

      {template?.frase}

    </p>

  </div>

</div>

{/* CONTENIDO */}

      <div className="propuesta-content" style={{
        maxWidth:"1100px",
        margin:"0 auto",
        padding:"100px 30px"
      }}>

        <div
  className="reveal-propuesta"
  style={{
    textAlign:"center",
    marginBottom:"80px"
  }}
>
 
  <h2 className="propuesta-intro-title" style={{
    fontSize:"3.5rem",
    lineHeight:1.2,
    marginBottom:"25px"
  }}>

{template?.introTitulo || "Una celebración diseñada para emocionar"}
  </h2>

  <p className="propuesta-intro-text" style={{
    maxWidth:"700px",
    margin:"0 auto",
    color: template?.introColor || "rgba(255,255,255,0.7)",
    lineHeight:1.8,
    fontSize:"1.1rem"
  }}>

{template?.introTexto || "Cada detalle fue pensado para crear una experiencia elegante, cálida e inolvidable."}
  </p>

</div>
<div className="propuesta-destacados-section" style={{
  display:"flex",
  flexDirection:"column",
  gap:"80px",
  marginBottom:"120px"
}}>

  <div className={`propuesta-destacados-list ${template?.destacadosLayout === "grid6" ? "cine-teatro-grid" : ""} ${template?.destacadosLayout === "infantilMosaic" ? "galeria-infantil-grid" : ""}`} style={{
  display: (template?.destacadosLayout === "grid6" || template?.destacadosLayout === "infantilMosaic") ? "grid" : "flex",
  flexDirection: (template?.destacadosLayout === "grid6" || template?.destacadosLayout === "infantilMosaic") ? undefined : "column",
  gridTemplateColumns: template?.destacadosLayout === "grid6" ? "repeat(2, minmax(0, 1fr))" : template?.destacadosLayout === "infantilMosaic" ? "repeat(12, minmax(0, 1fr))" : undefined,
  gap: template?.destacadosLayout === "grid6" ? "28px" : template?.destacadosLayout === "infantilMosaic" ? "26px" : "80px",
  marginBottom: template?.destacadosLayout === "grid6" ? "90px" : template?.destacadosLayout === "infantilMosaic" ? "55px" : "120px"
}}>

  {template?.destacados?.map((item, index) => (

    <div
  key={index}
  className="reveal-propuesta img-propuesta-card"
  style={{
    position:"relative",
    gridColumn: template?.destacadosLayout === "infantilMosaic"
      ? item.formato === "full"
        ? "1 / -1"
        : item.formato === "small"
        ? index >= 7
          ? "span 6"
          : "span 4"
        : "span 8"
      : undefined,
    height: template?.destacadosLayout === "grid6"
      ? "560px"
      : template?.destacadosLayout === "infantilMosaic"
      ? item.formato === "full"
        ? "420px"
        : item.formato === "small"
        ? index >= 7
          ? "360px"
          : "390px"
        : "390px"
      : "520px",
    borderRadius: template?.destacadosLayout === "grid6"
      ? "28px"
      : template?.destacadosLayout === "infantilMosaic"
      ? "32px"
      : "35px",
    overflow:"hidden"
  }}
>

      <img
  src={item.img}
  alt=""
  loading="lazy"
  className="img-propuesta-hover"
  style={{
          width:"100%",
          height:"100%",
          objectFit:"cover"
        }}
      />

      <div style={{
        position:"absolute",
        inset:0,
        background: template?.destacadosLayout === "infantilMosaic"
          ? "linear-gradient(to top, rgba(20,28,34,0.68), rgba(20,28,34,0.22) 46%, rgba(255,255,255,0.02))"
          : "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15))"
      }} />

      <div style={{
        position:"absolute",
        bottom: template?.destacadosLayout === "grid6" ? "28px" : template?.destacadosLayout === "infantilMosaic" ? "20px" : "50px",
        left: template?.destacadosLayout === "grid6" ? "28px" : template?.destacadosLayout === "infantilMosaic" ? "20px" : "50px",
        right: (template?.destacadosLayout === "grid6" || template?.destacadosLayout === "infantilMosaic") ? "20px" : "auto",
        maxWidth: template?.destacadosLayout === "grid6" ? "520px" : template?.destacadosLayout === "infantilMosaic" ? "560px" : "500px",
        padding: template?.destacadosLayout === "infantilMosaic" ? "0" : undefined,
        borderRadius: undefined,
        background: undefined,
        backdropFilter: undefined,
        boxShadow: undefined
      }}>

        <div style={{
          fontSize: template?.destacadosLayout === "grid6" ? "1.7rem" : template?.destacadosLayout === "infantilMosaic" ? "1.05rem" : "2.8rem",
          lineHeight: template?.destacadosLayout === "infantilMosaic" ? 1.35 : 1.2,
          fontWeight: template?.destacadosLayout === "infantilMosaic" ? 600 : 600,
          color: template?.destacadosLayout === "infantilMosaic" ? "#fff" : undefined,
          textShadow: template?.destacadosLayout === "infantilMosaic" ? "0 2px 8px rgba(0,0,0,0.72), 0 10px 26px rgba(0,0,0,0.45)" : undefined
        }}>
          {item.frase}
        </div>

      </div>

    </div>

  ))}

</div>

  {template?.bannerGaleria && (
    <div className="banner-galeria-infantil reveal-propuesta" style={{
      marginTop:"22px",
      marginBottom:"50px"
    }}>
      <img
        src={template.bannerGaleria}
        alt=""
        loading="lazy"
        style={{
          width:"100%",
          height:"430px",
          objectFit:"cover",
          display:"block"
        }}
      />
    </div>
  )}

</div>
<div
  className="propuesta-equipo-section"
  style={{
    marginBottom:"140px"
  }}
>

  {/* BLOQUE SUPERIOR */}

  <div className="propuesta-equipo-grid" style={{
    display:"grid",
    gridTemplateColumns:
      "1.1fr 1fr",
    gap:"70px",
    alignItems:"center",
    marginBottom:"35px"
  }}>
  
    {/* FOTO PRINCIPAL */}

    <div>

      <img
        className="propuesta-equipo-img"
        src={contenidoGlobal.equipo?.img}
        alt=""
        loading="lazy"
        style={{
          width:"100%",
          height:"720px",
          objectFit:"cover",
          borderRadius:"35px",
          filter:"grayscale(100%)"
        }}
      />

    </div>

    {/* TEXTO */}

    <div>
      <div style={{
  fontSize:"0.75rem",
  letterSpacing:"4px",
  opacity:0.55,
  marginBottom:"12px"
}}>
  LUISINA BAGNAROLI
</div>

<div style={{
  fontSize:"0.9rem",
  letterSpacing:"5px",
  opacity:0.7,
  marginBottom:"25px"
}}>
  EXPERIENCIA
</div>

      <div style={{
        width:"70px",
        height:"2px",
        background: template?.color || "#b388ff",
        marginBottom:"35px"
      }} />

      <h2 className="propuesta-equipo-title" style={{
        fontSize:"5rem",
        lineHeight:1,
        marginBottom:"40px",
        fontWeight:400
      }}>
        {contenidoGlobal.equipo?.titulo}
      </h2>

      <p className="propuesta-equipo-text" style={{
        fontSize:"1.2rem",
        lineHeight:2,
        color:"rgba(255,255,255,0.74)"
      }}>
        {contenidoGlobal.equipo?.texto}
      </p>

    </div>

  </div>

  {/* GALERÍA INFERIOR */}

  <div className="propuesta-equipo-mini-grid" style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(6,1fr)",
    gap:"20px"
  }}>

    {contenidoGlobal.equipo?.miniGaleria?.map(
      (img,index) => (

      <div
        key={index}
        className="propuesta-equipo-mini-card"
        style={{
          height:"260px",
          borderRadius:"26px",
          overflow:"hidden"
        }}
      >

        <img
          src={img}
          alt=""
          loading="lazy"
          style={{
            width:"100%",
            height:"100%",
            objectFit:"cover",
            filter:"grayscale(100%)"
          }}
        />

      </div>

    ))}

    
  </div>
{!template?.ocultarFraseCelebrar && (template?.bloqueInstitucional ? (

  <div
    className="frase-celebrar-wrap reveal-propuesta frase-cotillon-trigger"
    style={{
      textAlign:"center",
      marginTop:"150px",
      marginBottom:"85px",
      position:"relative",
      padding:"80px 20px",
      borderTop:"1px solid rgba(255,255,255,0.14)",
      borderBottom:"1px solid rgba(255,255,255,0.14)"
    }}
  >

    <div style={{
      fontSize:"0.72rem",
      letterSpacing:"5px",
      textTransform:"uppercase",
      color: template?.color,
      marginBottom:"24px",
      fontWeight:700
    }}>
      {template?.bloqueInstitucional?.label}
    </div>

    <div style={{
      maxWidth:"900px",
      margin:"0 auto",
      fontFamily: template?.bloqueInstitucional?.fontFamily || "Georgia, serif",
      fontSize:"3.4rem",
      lineHeight:1.12,
      color:"#fff",
      fontWeight:400
    }}>
      {template?.bloqueInstitucional?.titulo}
    </div>

    <p style={{
      maxWidth:"720px",
      margin:"28px auto 0 auto",
      color:"rgba(255,255,255,0.68)",
      fontSize:"1.05rem",
      lineHeight:1.8
    }}>
      {template?.bloqueInstitucional?.texto}
    </p>

  </div>

) : (

  <div
    className="frase-celebrar-wrap reveal-propuesta frase-cotillon-trigger"
    style={{
      textAlign:"center",
      marginTop:"180px",
      marginBottom:"70px",
      position:"relative",
      overflow:"hidden",
      padding:"90px 20px",
      borderRadius:"35px"
    }}
  >

    <div className="confetti-silver">
      {Array.from({ length: 34 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>

    <div style={{
      position:"relative",
      zIndex:2,
      fontFamily:"Brittany Signature",
      fontSize:"5rem",
      color: template?.color,
      lineHeight:1.1,
      textShadow: template?.neonShadow || "none"
    }}>
      El mejor momento para celebrar es siempre
    </div>

  </div>

))}

  {/* EMOCIONES SUPERIORES */}

{!template?.ocultarEmociones && (<>
<div className="propuesta-emociones-grid" style={{
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:"25px",
  marginTop:"0px",
  marginBottom:"35px"
}}>

  {template?.emocionesTop?.map((img,index) => (

    <div
      key={index}
      className="propuesta-emocion-card"
      style={{
        height:"420px",
        borderRadius:"30px",
        overflow:"hidden"
      }}
    >

      <img
        src={img}
        alt=""
        loading="lazy"
        style={{
          width:"100%",
          height:"100%",
          objectFit:"contain",
background:"#111",
          display:"block"
        }}
      />

    </div>

  ))}

</div>

{/* BANNER HORIZONTAL */}

<div className="propuesta-banner-emocional" style={{
  width:"100%",
  marginBottom:"35px"
}}>

  <img
    src={template?.bannerEmocional}
    alt=""
    loading="lazy"
    style={{
      width:"100%",
      height:"500px",
      objectFit:"cover",
      borderRadius:"35px",
      display:"block"
    }}
  />

</div>

{/* EMOCIONES INFERIORES */}

<div className="propuesta-emociones-grid" style={{
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:"25px",
  marginBottom:"70px"
}}>

  {template?.emocionesBottom?.map((img,index) => (

    <div
      key={index}
      style={{
        height:"420px",
        borderRadius:"30px",
        overflow:"hidden"
      }}
    >

      <img
        src={img}
        alt=""
        loading="lazy"
        style={{
          width:"100%",
          height:"100%",
          objectFit:"cover",
          display:"block"
        }}
      />

    </div>

  ))}

</div>
</>)}


</div>

{!template?.ocultarEmociones && (<>
<div className="propuesta-texto-emocional" style={{
  textAlign:"center",
  maxWidth:"900px",
  margin:"0 auto 120px auto"
}}>

  <p style={{
    fontSize:"1.3rem",
    lineHeight:1.9,
    color:"rgba(255,255,255,0.78)"
  }}>
    {template?.textoEmocional}
  </p>

</div>

<div className="propuesta-frase-final" style={{
  textAlign:"center",
  marginBottom:"140px"
}}>

  <h2 className="propuesta-frase-final-title" style={{
    fontSize:"4rem",
    lineHeight:1.2,
    maxWidth:"1000px",
    margin:"0 auto"
  }}>
    {template?.fraseFinal}
  </h2>

</div>
</>)}
        <div
  className={`propuesta-tecnica-section ${template?.panelTecnico === "infantil" ? "panel-tecnico-infantil" : ""}`}
  style={{
    marginBottom:"120px"
  }}
>

  <div style={{
    textAlign:"center",
    marginBottom:"55px"
  }}>

    <div style={{
      fontSize:"0.75rem",
      letterSpacing:"4px",
      opacity:0.55,
      marginBottom:"16px"
    }}>
      {template?.panelTecnico === "infantil" ? "DETALLES DEL FESTEJO" : "INFORMACIÓN DEL EVENTO"}
    </div>

    <h2 className="propuesta-tecnica-title" style={{
      fontSize:"3.4rem",
      lineHeight:1.15,
      marginBottom:"20px"
    }}>
      {template?.panelTecnico === "infantil" ? "Una celebración pensada para guardar este momento" : "Tu propuesta personalizada"}
    </h2>

    <div style={{
      width:"80px",
      height:"2px",
      background: template?.color || "#fff",
      margin:"0 auto 24px auto",
      boxShadow: template?.neonShadow || "none"
    }} />

    <p style={{
      maxWidth:"680px",
      margin:"0 auto",
      color:"rgba(255,255,255,0.68)",
      lineHeight:1.8,
      fontSize:"1.05rem"
    }}>
      {template?.panelTecnico === "infantil" ? "Datos principales del festejo, pensados para que la familia pueda imaginar cada detalle con calma y claridad." : "Estos son los datos principales de la celebración y las condiciones pensadas para esta experiencia."}
    </p>

  </div>

  <div style={{
    display:"grid",
    gridTemplateColumns:
      template?.panelTecnico === "infantil"
        ? "repeat(auto-fit,minmax(280px,1fr))"
        : "repeat(auto-fit,minmax(240px,1fr))",
    gap: template?.panelTecnico === "infantil" ? "24px" : "18px"
  }}>

    {[
      {
        icono:"📅",
        label:"Fecha del evento",
        valor: propuesta.fecha || "-"
      },
      {
        icono:"📍",
        label:"Lugar",
        valor: propuesta.lugar || "-"
      },
      {
        icono:"🏛",
        label:"Espacio / salón",
        valor: propuesta.salon || propuesta.espacioSalon || "-"
      },
      {
        icono:"👥",
        label:"Invitados",
        valor: propuesta.invitados || "-"
      },
      {
        icono:"💰",
        label:"Valor total",
        valor: propuesta.presupuesto
  ? `${simboloMoneda}${propuesta.presupuesto}`
  : "-",
        destacado: true,
        soloAdmin: true
      },
      {
        icono:"💳",
        label:"Anticipo",
        valor: propuesta.anticipo
  ? `${simboloMoneda}${propuesta.anticipo}`
  : "-",
        destacado: true,
        soloAdmin: true
      },
      {
        icono:"🧾",
        label:"Cuotas",
        valor: propuesta.cuotas || "-",
        soloAdmin: true
      }
    ].filter(item => !esRegalo || !item.soloAdmin).map((item, index) => (

      <div
        key={index}
        className="propuesta-tech-card"
        style={{
          borderColor: item.destacado
            ? template?.color || "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.12)",
          boxShadow: item.destacado && template?.neonShadow
            ? `0 0 24px rgba(255,43,214,0.12)`
            : "0 18px 45px rgba(0,0,0,0.22)"
        }}
      >

        <div style={{
          fontSize:"1.55rem",
          marginBottom:"18px"
        }}>
          {item.icono}
        </div>

        <div style={{
          fontSize:"0.68rem",
          letterSpacing:"2px",
          textTransform:"uppercase",
          color:"rgba(255,255,255,0.48)",
          marginBottom:"10px",
          fontWeight:700
        }}>
          {item.label}
        </div>

        <strong style={{
          display:"block",
          fontSize:item.destacado ? "1.65rem" : "1.25rem",
          lineHeight:1.25,
          color:item.destacado
            ? template?.color || "#fff"
            : "#fff",
          textShadow:item.destacado
            ? template?.neonShadow || "none"
            : "none"
        }}>
          {item.valor}
        </strong>

      </div>

    ))}

    {esEmpresas && (
      <div
        className="propuesta-tech-card"
        style={{
          borderColor: `rgba(197,160,89,0.5)`,
          boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer"
        }}
        onClick={descargarPropuestaPDF}
      >
        <div style={{ fontSize: "1.55rem", marginBottom: "18px" }}>📄</div>
        <div style={{ fontSize: "0.68rem", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.48)", marginBottom: "10px", fontWeight: 700 }}>
          Descargar
        </div>
        <strong style={{ display: "block", fontSize: "1rem", lineHeight: 1.25, color: `rgba(197,160,89,1)`, textAlign: "center" }}>
          Propuesta en PDF
        </strong>
      </div>
    )}

  </div>

  <div className="propuesta-text-cards-grid" style={{
    display:"grid",
    gridTemplateColumns:
      template?.panelTecnico === "infantil"
        ? "repeat(auto-fit,minmax(340px,1fr))"
        : "repeat(auto-fit,minmax(320px,1fr))",
    gap: template?.panelTecnico === "infantil" ? "24px" : "22px",
    marginTop: template?.panelTecnico === "infantil" ? "34px" : "28px"
  }}>

    <div className="propuesta-text-card">

      <div style={{
        fontSize:"0.75rem",
        letterSpacing:"3px",
        color: template?.color || "#fff",
        marginBottom:"18px",
        fontWeight:700
      }}>
        INCLUYE
      </div>

      <p style={{
        lineHeight:1.9,
        color:"rgba(255,255,255,0.76)",
        whiteSpace:"pre-line"
      }}>
        {propuesta.incluye || "-"}
      </p>

    </div>

    <div className="propuesta-text-card">

      <div style={{
        fontSize:"0.75rem",
        letterSpacing:"3px",
        color: template?.color || "#fff",
        marginBottom:"18px",
        fontWeight:700
      }}>
        OBSERVACIONES
      </div>

      <p style={{
        lineHeight:1.9,
        color:"rgba(255,255,255,0.76)",
        whiteSpace:"pre-line"
      }}>
        {propuesta.observaciones || "-"}
      </p>

    </div>

  </div>

</div>

        <p style={{
          fontSize:"1.2rem",
          lineHeight:1.8,
          color:"rgba(255,255,255,0.8)"
        }}>
          {template?.textoCierre || "Cada celebración es única. Por eso diseñamos experiencias pensadas especialmente para transmitir emoción, elegancia y recuerdos inolvidables."}
        </p>

      </div>

    </div>

  );

};

export default PropuestaCliente;





