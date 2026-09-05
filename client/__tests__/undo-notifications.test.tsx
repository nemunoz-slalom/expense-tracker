import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';

import '../src/i18n';
import * as api from '../src/api/services.api';
import { ServiceForm } from '../src/components/ServiceForm';
import { UndoToast } from '../src/components/UndoToast';
import { useServices } from '../src/hooks/useServices';
import { ToastProvider, useToasts } from '../src/hooks/useToasts';

jest.mock('../src/api/services.api');
const mockedApi = api as jest.Mocked<typeof api>;

function NotificationFeedback(): JSX.Element {
  const { notify } = useServices();
  const { success, error } = useToasts();
  const { t } = useTranslation();
  const requestNotification = async (): Promise<void> => {
    try {
      await notify(4);
      success(t('undo.notificationRequested'));
    } catch (caught) {
      error(caught instanceof Error ? caught.message : t('error.default'));
    }
  };

  return <button onClick={() => void requestNotification()}>Request notification</button>;
}

describe('Undo creation notifications', () => {
  beforeEach(() => {
    mockedApi.listServices.mockResolvedValue([]);
    mockedApi.notifyService.mockResolvedValue();
  });

  afterEach(() => jest.resetAllMocks());

  it('restores submitted create values and exposes an accessible Undo action', () => {
    const onUndo = jest.fn();
    const form = render(
      <ServiceForm
        open
        service={null}
        initialValues={{ name: 'Internet', type: 'internet', amount: 60, paymentDate: '2026-09-04', dueDate: '2026-09-10' }}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect((screen.getByLabelText('Service name') as HTMLInputElement).value).toBe('Internet');
    expect(screen.getByRole('button', { name: 'Payment date' }).textContent).toBe('Friday 04, Sep.');
    fireEvent.click(screen.getByRole('button', { name: 'Clear payment date' }));
    expect(screen.getByRole('button', { name: 'Payment date' }).textContent).toBe('Select date');
    form.unmount();
    render(<UndoToast expiresAt={Date.now() + 8_000} onUndo={onUndo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('shows localized success feedback after the mocked application notification request', async () => {
    render(<ToastProvider><NotificationFeedback /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Request notification' }));

    await waitFor(() => expect(mockedApi.notifyService).toHaveBeenCalledWith(4));
    expect(await screen.findByText('Creation notification requested')).toBeTruthy();
  });
});
