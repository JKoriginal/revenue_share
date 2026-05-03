export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function printHtml(title: string, body: string) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #17211b; margin: 28px; }
          h1 { font-size: 22px; margin: 0 0 8px; }
          h2 { font-size: 16px; margin: 22px 0 8px; }
          p { color: #57534e; font-size: 12px; margin: 0 0 16px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #d6d3d1; padding: 7px; text-align: left; vertical-align: top; }
          th { background: #f5f5f4; font-weight: 700; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
          .summary div { border: 1px solid #d6d3d1; padding: 8px; background: #fafaf9; }
          .muted { color: #78716c; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Printed on ${escapeHtml(new Date().toLocaleString())}</p>
        ${body}
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
