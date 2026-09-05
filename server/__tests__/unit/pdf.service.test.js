/* eslint-env jest */

const { createPdfService } = require('../../services/pdf.service');

function createService(overrides = {}) {
  return {
    id: 1,
    name: 'Water bill',
    type: 'water',
    amount: 45.5,
    paymentDate: null,
    dueDate: '2026-09-10',
    paid: false,
    status: 'urgent',
    ...overrides
  };
}

describe('PDF report service', () => {
  test('renders the same filtered ordered selection with fields, counts, and filter context', () => {
    const serviceService = {
      list: jest.fn(() => [
        createService(),
        createService({ id: 2, name: 'Paid water', amount: null, paid: true, status: 'paid' })
      ])
    };
    const pdfService = createPdfService(serviceService);
    const pdf = pdfService.render({ month: '2026-09', type: 'water' });
    const text = pdf.toString('latin1');

    expect(serviceService.list).toHaveBeenCalledWith({ month: '2026-09', type: 'water' });
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(text).toContain('%PDF-1.4');
    expect(text).toContain('Services Report');
    expect(text).toContain('Month: 2026-09 | Type: water');
    expect(text).toContain('Services: 2 | Paid: 1 | Pending: 1');
    expect(text).toContain('Water bill | water | $45.50 | 2026-09-10 | urgent');
    expect(text).toContain('Paid water | water | N/A | 2026-09-10 | paid');
  });

  test('renders a valid empty report with active filters, zero counts, and no-data statement', () => {
    const serviceService = { list: jest.fn(() => []) };
    const pdf = createPdfService(serviceService).render({
      from: '2026-09-01',
      to: '2026-09-30',
      paid: false
    });
    const text = pdf.toString('latin1');

    expect(text).toContain('%PDF-1.4');
    expect(text).toContain('Due date: 2026-09-01 to 2026-09-30 | Paid: false');
    expect(text).toContain('Services: 0 | Paid: 0 | Pending: 0');
    expect(text).toContain('No services match the selected filters.');
  });
});
