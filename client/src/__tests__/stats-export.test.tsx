import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '../i18n';
import App from '../App';
import * as exportApi from '../api/export.api';
import * as servicesApi from '../api/services.api';
import * as statsApi from '../api/stats.api';

jest.mock('../api/services.api');
jest.mock('../api/stats.api');
jest.mock('../api/export.api');
jest.mock('../components/TypeFilter', () => ({
  TypeFilter: ({ onChange }: { onChange: (value: 'electricity') => void }) => (
    <button type="button" onClick={() => onChange('electricity')}>Select Electricity</button>
  ),
}));

const mockedServicesApi = servicesApi as jest.Mocked<typeof servicesApi>;
const mockedStatsApi = statsApi as jest.Mocked<typeof statsApi>;
const mockedExportApi = exportApi as jest.Mocked<typeof exportApi>;

const service = {
  id: 1, name: 'CFE', type: 'electricity' as const, amount: 450, paymentDate: null,
  dueDate: '2026-09-20', paid: false, status: 'normal' as const,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('statistics and report export', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'ResizeObserver', {
      configurable: true,
      value: class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    });
  });

  beforeEach(() => {
    mockedServicesApi.listServices.mockResolvedValue([service]);
    mockedStatsApi.getConsumptionStats.mockResolvedValue({
      type: 'electricity',
      periods: [
        { period: '2026-01..2026-02', amount: 0 },
        { period: '2026-03..2026-04', amount: 450 },
      ],
      average: 225,
    });
    mockedExportApi.exportServicesPdf.mockResolvedValue();
  });

  afterEach(() => jest.resetAllMocks());

  it('shows localized consumption periods and average only after selecting a type', async () => {
    render(<App />);
    await screen.findByText('CFE');
    expect(screen.queryByRole('region', { name: 'Consumption by billing period' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Select Electricity' }));

    expect(await screen.findByRole('region', { name: 'Consumption by billing period' })).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === 'Jan–Feb 2026: 0')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.textContent === 'Mar–Apr 2026: 450')).toBeTruthy();
    expect(screen.getByText(/Average: .*225\.00/)).toBeTruthy();
    expect(mockedStatsApi.getConsumptionStats).toHaveBeenCalledWith('electricity');
  });

  it('exports the active list filters and downloads the PDF', async () => {
    render(<App />);
    await screen.findByText('CFE');
    fireEvent.click(screen.getByRole('button', { name: 'Select Electricity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF report' }));

    await waitFor(() => expect(mockedExportApi.exportServicesPdf).toHaveBeenCalledWith(expect.objectContaining({
      type: 'electricity',
    })));
    expect(await screen.findByText('PDF report downloaded')).toBeTruthy();
  });

  it('treats a successful empty export as a successful download', async () => {
    mockedServicesApi.listServices.mockResolvedValue([]);
    render(<App />);
    await screen.findByText('No services match the selected filters.');
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF report' }));

    await waitFor(() => expect(mockedExportApi.exportServicesPdf).toHaveBeenCalled());
    expect(await screen.findByText('Empty PDF report downloaded')).toBeTruthy();
  });

  it('announces statistics loading and request errors', async () => {
    let rejectStats: (error: Error) => void = () => undefined;
    mockedStatsApi.getConsumptionStats.mockReturnValue(new Promise((_, reject) => {
      rejectStats = reject;
    }));
    render(<App />);
    await screen.findByText('CFE');
    fireEvent.click(screen.getByRole('button', { name: 'Select Electricity' }));

    expect(screen.getByText('Loading consumption statistics')).toBeTruthy();
    rejectStats(new Error('Statistics unavailable'));
    expect((await screen.findByRole('alert')).textContent).toBe('Statistics unavailable');
  });
});
