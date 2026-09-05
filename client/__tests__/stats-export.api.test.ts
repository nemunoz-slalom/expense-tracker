import { exportServicesPdf } from '../src/api/export.api';
import { getConsumptionStats } from '../src/api/stats.api';

describe('statistics and PDF export APIs', () => {
  afterEach(() => jest.restoreAllMocks());

  it('unwraps the requested consumption periods from the contract endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: { type: 'internet', periods: [{ period: '2026-08', amount: 60 }], average: 60 },
    }), { status: 200 }));

    await expect(getConsumptionStats('internet')).resolves.toEqual({
      type: 'internet', periods: [{ period: '2026-08', amount: 60 }], average: 60,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/services/stats/type/internet?periods=6');
  });

  it('serializes active filters and downloads a successful PDF response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(new Blob(['pdf']), { status: 200 }));
    const createObjectUrl = jest.fn(() => 'blob:report');
    const revokeObjectUrl = jest.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, writable: true, value: createObjectUrl },
      revokeObjectURL: { configurable: true, writable: true, value: revokeObjectUrl },
    });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation();

    await exportServicesPdf({ from: '2026-09-01', to: '2026-09-30', type: 'electricity' });

    expect(fetchMock).toHaveBeenCalledWith('/api/services/export/pdf?from=2026-09-01&to=2026-09-30&type=electricity');
    expect(createObjectUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:report');
  });
});
