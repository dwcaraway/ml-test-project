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

describe('uploadFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST request with FormData and encoded path and returns UploadResponse on success', async () => {
    const mockResponse = {
      fileName: 'report_copy1.pdf',
      path: 'docs/sub',
      sizeBytes: 1024,
      message: 'File uploaded successfully.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const file = new File(['dummy content'], 'report.pdf', { type: 'application/pdf' });
    const { uploadFile } = await import('../src/api');
    const result = await uploadFile('docs/sub', file);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upload?path=docs%2Fsub',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
  });

  it('uploads to root when path is empty string', async () => {
    const mockResponse = {
      fileName: 'root-file.txt',
      path: '',
      sizeBytes: 50,
      message: 'File uploaded successfully.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const file = new File(['content'], 'root-file.txt', { type: 'text/plain' });
    const { uploadFile } = await import('../src/api');
    const result = await uploadFile('', file);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
  });

  it('throws error with server message when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid path or path traversal detected.' }),
    });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const { uploadFile } = await import('../src/api');
    await expect(uploadFile('../outside', file)).rejects.toThrow(
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

    const file = new File(['content'], 'error.txt', { type: 'text/plain' });
    const { uploadFile } = await import('../src/api');
    await expect(uploadFile('docs', file)).rejects.toThrow(
      'HTTP error! status: 500'
    );
  });

  it('throws error immediately if file size strictly exceeds 8 MB without calling fetch', async () => {
    global.fetch = vi.fn();

    // Mock a file larger than 8 MB (8,388,608 bytes)
    const largeFile = new File(['a'], 'toolarge.bin');
    Object.defineProperty(largeFile, 'size', { value: 8 * 1024 * 1024 + 1 });

    const { uploadFile } = await import('../src/api');
    await expect(uploadFile('docs', largeFile)).rejects.toThrow(
      'File exceeds the maximum allowed size of 8 MB.'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('searchFiles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error immediately if query is empty or whitespace without calling fetch', async () => {
    global.fetch = vi.fn();
    const { searchFiles } = await import('../src/api');

    await expect(searchFiles('docs', '')).rejects.toThrow('Search query cannot be empty.');
    await expect(searchFiles('docs', '   ')).rejects.toThrow('Search query cannot be empty.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('constructs correct search URL with query parameters and returns parsed response', async () => {
    const mockResponse = {
      basePath: 'docs',
      query: 'annual',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [
        {
          name: 'annual_report.pdf',
          path: 'docs/annual_report.pdf',
          size: '1024',
          type: 'file',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const { searchFiles } = await import('../src/api');
    const result = await searchFiles('docs', 'annual', 1, 50);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/search?path=docs&query=annual&page=1&pageSize=50'
    );
  });

  it('throws error with server message when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid path or path traversal detected.' }),
    });

    const { searchFiles } = await import('../src/api');
    await expect(searchFiles('../outside', 'test')).rejects.toThrow(
      'Invalid path or path traversal detected.'
    );
  });

  it('throws HTTP status error fallback when error response is not JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    const { searchFiles } = await import('../src/api');
    await expect(searchFiles('docs', 'test')).rejects.toThrow('HTTP error! status: 500');
  });
});
