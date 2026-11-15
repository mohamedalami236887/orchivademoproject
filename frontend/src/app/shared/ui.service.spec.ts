import { describe, expect, it, vi } from 'vitest';
import { UiService } from './ui.service';

describe('UiService', () => {
  it('resolves an application confirmation with the selected result', async () => {
    const service = new UiService();
    const result = service.confirm({ title: 'Submit?', message: 'Continue', confirmLabel: 'Submit' });

    service.resolveConfirmation(true);

    await expect(result).resolves.toBe(true);
    expect(service.confirmation()).toBeNull();
  });

  it('replaces and automatically clears toast feedback', () => {
    vi.useFakeTimers();
    const service = new UiService();

    service.notify('Saved');
    expect(service.toast()?.message).toBe('Saved');
    vi.advanceTimersByTime(4500);
    expect(service.toast()).toBeNull();
    vi.useRealTimers();
  });
});
