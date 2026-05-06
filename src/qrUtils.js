import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export const generarQRPDF = async (eventoId) => {
  const url = `https://app-eventos-rouge.vercel.app/evento/${eventoId}/mensajes`;

  const qr = await QRCode.toDataURL(url);

  const pdf = new jsPDF();

  const posiciones = [
    [10, 10],
    [110, 10],
    [10, 140],
    [110, 140]
  ];

  posiciones.forEach(([x, y]) => {
    pdf.addImage(qr, "PNG", x, y, 80, 80);
  });

  pdf.save("qr-evento.pdf");
};

export const descargarMensajesPDF = (mensajes, nombreEvento) => {
  const pdf = new jsPDF();

  let y = 20;

  pdf.setFontSize(16);
  pdf.text(`Mensajes: ${nombreEvento}`, 10, 10);

  pdf.setFontSize(10);

  mensajes.forEach((m) => {
    pdf.text(`${m.nombre}: ${m.mensaje}`, 10, y);
    y += 8;

    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
  });

  pdf.save(`mensajes-${nombreEvento}.pdf`);
};