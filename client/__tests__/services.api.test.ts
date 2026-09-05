import { ApiError } from '../src/types/services';
import { createService, deleteService, listServices, updateService } from '../src/api/services.api';

const service = {
  id: 1, name: 'CFE', type: 'electricity' as const, amount: 450, paymentDate: null,
  dueDate: '2026-09-20', paid: false, status: 'normal' as const,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('services API', () => {
  afterEach(() => jest.restoreAllMocks());

  it('serializes list filters and unwraps the data envelope', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [service] }), { status: 200 }));
    await expect(listServices({ type: 'electricity', paid: false })).resolves.toEqual([service]);
    expect(fetchMock).toHaveBeenCalledWith('/api/services?type=electricity&paid=false');
  });

  it('uses contract CRUD methods and JSON request bodies', async () => {
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: service }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: service }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await createService({ name: 'CFE', type: 'electricity', dueDate: '2026-09-20', amount: 450 });
    await updateService(1, { paid: true });
    await deleteService(1);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/services', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'CFE', type: 'electricity', dueDate: '2026-09-20', amount: 450 }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/services/1', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ paid: true }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/services/1', { method: 'DELETE' });
  });

  it('serializes API errors as typed errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'ValidationError', message: 'Invalid due date' }), { status: 400 }));
    await expect(listServices()).rejects.toEqual(expect.objectContaining<ApiError>({ name: 'ApiError', status: 400, code: 'ValidationError', message: 'Invalid due date' }));
  });
});
