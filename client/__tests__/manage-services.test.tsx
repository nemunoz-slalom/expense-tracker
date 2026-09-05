import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '../src/i18n';
import App from '../src/App';
import * as api from '../src/api/services.api';

jest.mock('../src/api/services.api');
const mockedApi = api as jest.Mocked<typeof api>;

const service = {
  id: 1, name: 'CFE', type: 'electricity' as const, amount: 450, paymentDate: null,
  dueDate: '2026-09-20', paid: false, status: 'normal' as const,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('service management', () => {
  beforeEach(() => {
    mockedApi.listServices.mockResolvedValue([service]);
    mockedApi.updateService.mockResolvedValue({ ...service, paid: true, status: 'paid' });
    mockedApi.deleteService.mockResolvedValue();
  });

  afterEach(() => jest.resetAllMocks());

  it('renders, marks paid, edits, and confirms deletion through the mocked transport', async () => {
    render(<App />);
    expect(await screen.findByText('CFE')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as paid' }));
    await waitFor(() => expect(mockedApi.updateService).toHaveBeenCalledWith(1, { paid: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Service name'), { target: { value: 'Updated CFE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockedApi.updateService).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated CFE' })));

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete service?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete service' }));
    await waitFor(() => expect(mockedApi.deleteService).toHaveBeenCalledWith(1));
  });
});
