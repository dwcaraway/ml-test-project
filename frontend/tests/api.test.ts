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

describe('fetchBrowseDirectory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches root directory without query param', async () => {
    const mockResponse = {
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'folder1', size: '-', type: 'folder' }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await (await import('../src/api')).fetchBrowseDirectory();
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/browse');
  });

  it('fetches subdirectory with encoded query param', async () => {
    const mockResponse = {
      currentPath: 'docs/sub',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await (await import('../src/api')).fetchBrowseDirectory('docs/sub');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/browse?path=docs%2Fsub');
  });

  it('throws server error message if present in response json', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid path' }),
    });

    await expect((await import('../src/api')).fetchBrowseDirectory('invalid')).rejects.toThrow('Invalid path');
  });

  it('throws HTTP status error if error json is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    await expect((await import('../src/api')).fetchBrowseDirectory('missing')).rejects.toThrow('HTTP error! status: 404');
  });
});

describe('deleteItem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE request with encoded path and returns message on success', async () => {
    const mockResponse = { message: 'Item deleted successfully.' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const { deleteItem } = await import('../src/api');
    const result = await deleteItem('docs/file 1.txt');

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/delete?path=docs%2Ffile%201.txt', {
      method: 'DELETE',
    });
  });

  it('throws error with server message when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid path or path traversal detected.' }),
    });

    const { deleteItem } = await import('../src/api');
    await expect(deleteItem('../outside.txt')).rejects.toThrow(
      'Invalid path or path traversal detected.'
    );
  });

  it('throws HTTP status error fallback when error response is not json', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    const { deleteItem } = await import('../src/api');
    await expect(deleteItem('error-file.txt')).rejects.toThrow(
      'HTTP error! status: 500'
    );
  });
});

