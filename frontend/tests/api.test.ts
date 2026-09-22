import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchApiMessage } from '../src/api';

describe('fetchApiMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return API response string on successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'API Response',
    });

    const result = await fetchApiMessage();
    expect(result).toBe('API Response');
    expect(global.fetch).toHaveBeenCalledWith('/test');
  });

  it('should throw an error when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(fetchApiMessage()).rejects.toThrow('HTTP error! status: 500');
  });
});

