function formatFilterContext(filters) {
  const parts = [];
  if (filters.month) {
    parts.push(`Month: ${filters.month}`);
  } else if (filters.from) {
    parts.push(`Due date: ${filters.from} to ${filters.to}`);
  } else {
    parts.push('All dates');
  }
  if (filters.type) {
    parts.push(`Type: ${filters.type}`);
  }
  if (filters.paid !== undefined) {
    parts.push(`Paid: ${filters.paid}`);
  }
  return parts.join(' | ');
}

function formatAmount(amount) {
  return amount === null ? 'N/A' : `$${amount.toFixed(2)}`;
}

function escapePdfText(value) {
  return String(value)
    .replace(/[\\()]/g, '\\$&')
    .replace(/[^\x20-\x7E]/g, '?');
}

function createPdf(lines) {
  const pages = [];
  for (let index = 0; index < lines.length; index += 42) {
    pages.push(lines.slice(index, index + 42));
  }

  const fontObjectId = 3 + pages.length * 2;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`
  ];

  for (const [index, pageLines] of pages.entries()) {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const content = pageLines
      .map((line, lineIndex) => `BT /F1 10 Tf 50 ${760 - lineIndex * 17} Td (${escapePdfText(line)}) Tj ET`)
      .join('\n');
    const contentLength = Buffer.byteLength(content, 'ascii');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${contentLength} >>\nstream\n${content}\nendstream`);
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, 'ascii'));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, 'ascii');
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, 'ascii');
}

function createPdfService(serviceService) {
  function render(filters) {
    const services = serviceService.list(filters);
    const paid = services.filter((service) => service.paid).length;
    const lines = [
      'Services Report',
      formatFilterContext(filters),
      `Services: ${services.length} | Paid: ${paid} | Pending: ${services.length - paid}`,
      ''
    ];

    if (services.length === 0) {
      lines.push('No services match the selected filters.');
    } else {
      lines.push('Name | Type | Amount | Due date | Status');
      lines.push(...services.map((service) => [
        service.name,
        service.type,
        formatAmount(service.amount),
        service.dueDate,
        service.status
      ].join(' | ')));
    }

    return createPdf(lines);
  }

  return { render };
}

module.exports = { createPdfService, formatFilterContext };
