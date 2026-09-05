import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '../src/i18n';
import App from '../src/App';
import * as api from '../src/api/services.api';
import { dateKey } from '../src/lib/date';

jest.mock('../src/api/services.api');
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
    expect(screen.getByText('Overdue').className).toContain('status-overdue');
    expect(screen.getByText('$ 450.00')).toBeTruthy();
  });

  it('formats list dates and labels a payment made today', async () => {
    mockedApi.listServices.mockResolvedValue([{
      ...service,
      dueDate: '2026-09-25',
      paymentDate: dateKey(new Date()),
    }]);

    render(<App />);

    expect(await screen.findByText('Due date: Friday 25, Sep.')).toBeTruthy();
    expect(screen.getByText('Payment date: Today')).toBeTruthy();
  });

  it('renders the service type filter with the current-month filter', async () => {
    render(<App />);
    await screen.findByText('CFE');

    expect(screen.getByRole('combobox', { name: 'Service type filter' })).toBeTruthy();
  });

  it('renders the date range filter controls', async () => {
    render(<App />);
    await screen.findByText('CFE');

    expect(screen.getByRole('combobox', { name: 'Date range' })).toBeTruthy();
    expect(screen.getByText('Current month')).toBeTruthy();
  });

  it('shows the active range in the range-calendar trigger', async () => {
    render(<App />);
    await screen.findByText('CFE');

    fireEvent.click(screen.getByRole('combobox', { name: 'Date range' }));
    fireEvent.click(screen.getByText('Custom range'));

    expect(await screen.findByRole('button', { name: 'Select date range' })).toBeTruthy();
  });

  it('offers a reset action when active filters return no services', async () => {
    mockedApi.listServices.mockResolvedValue([]);
    render(<App />);

    expect(await screen.findByText('No services match the selected filters.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    await waitFor(() => expect(mockedApi.listServices).toHaveBeenLastCalledWith({ month: currentMonth() }));
  });
});
