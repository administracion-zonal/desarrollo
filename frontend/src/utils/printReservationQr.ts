type PrintDetail = Readonly<{
  label: string;
  value: string;
}>;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export function printReservationQr(
  container: HTMLElement | null,
  title: string,
  details: PrintDetail[],
): boolean {
  const canvas = container?.querySelector("canvas");
  if (!canvas) return false;

  const printWindow = window.open("", "_blank", "width=600,height=800");
  if (!printWindow) return false;

  const detailRows = details
    .map(
      ({ label, value }) =>
        `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 28px; color: #142033; }
          h1 { font-size: 22px; }
          p { margin: 8px 0; }
          img { width: 240px; height: 240px; margin: 16px auto; }
          .details { text-align: left; width: min(420px, 100%); margin: 18px auto; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Administración Zonal Valle de los Chillos</p>
        <img src="${canvas.toDataURL("image/png")}" alt="Código QR de la reserva" />
        <div class="details">${detailRows}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
  return true;
}
