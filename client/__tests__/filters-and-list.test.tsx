import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '../src/i18n';
import App from '../src/App';
import * as api from '../src/api/services.api';

jest.mock('../src/api/services.api');
jest.mock('../src/components/FilterPanel', () => ({
  FilterPanel: ({ onDateFilterChange, onReset, onTypeChange }: {
    onDateFilterChange: (value: { mode: 'custom'; from: string; to: string }) => void;
    onReset: () => void;
    onTypeChange: (value?: 'electricity') => void;
  }) => (
    <div>
      <button type="button" onClick={() => onDateFilterChange({ mode: 'custom', from: '2026-09-01', to: '2026-09-30' })}>Custom range</button>
      <button type="button" onClick={() => onTypeChange('electricity')}>Electricity</button>
      <button type="button" onClick={onReset}>Reset filters</button>
    </div>
  ),
}));
const mockedApi = api as jest.Mocked<typeof api>;

const service = {
  id: 1, name: 'CFE', type: 'electricity' as const, amount: 450, paymentDate: null,
  dueDate: '2026-09-20', paid: false, status: 'overdue' as const,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};

function currentMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

describe('service filters and list', () => {
  beforeEach(() => {
    mockedApi.listServices.mockResolvedValue([service]);
  });

  afterEach(() => jest.resetAllMocks());

  it('loads the current month and renders the localized status text', async () => {
    render(<App />);

    expect(await screen.findByText('CFE')).toBeTruthy();
    expect(mockedApi.listServices).toHaveBeenCalledWith({ month: currentMonth() });
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('uses the selected type together with the current-month filter', async () => {
    render(<App />);
    await screen.findByText('CFE');

    fireEvent.click(screen.getByRole('button', { name: 'Electricity' }));

    await waitFor(() => expect(mockedApi.listServices).toHaveBeenLastCalledWith({
      month: currentMonth(),
      type: 'electricity',
    }));
  });

  it('replaces the month filter with a custom calendar range', async () => {
    render(<App />);
    await screen.findByText('CFE');

    fireEvent.click(screen.getByRole('button', { name: 'Custom range' }));
    await waitFor(() => expect(mockedApi.listServices).toHaveBeenLastCalledWith({
      from: '2026-09-01',
      to: '2026-09-30',
    }));
    expect(mockedApi.listServices).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ month: expect.any(String) }),
    );
  });

  it('offers a reset action when active filters return no services', async () => {
    mockedApi.listServices.mockResolvedValue([]);
    render(<App />);

    expect(await screen.findByText('No services match the selected filters.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    await waitFor(() => expect(mockedApi.listServices).toHaveBeenLastCalledWith({ month: currentMonth() }));
  });
});
