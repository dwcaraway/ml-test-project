import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('FileExplorerView Integration', () => {
  let container: HTMLElement;
  let view: FileExplorerView;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    view = new FileExplorerView();
  });

  afterEach(() => {
    view.unmount();
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders loading state initially while fetching', async () => {
    let resolvePromise: (value: api.BrowseResponse) => void;
    const pendingPromise = new Promise<api.BrowseResponse>((res) => {
      resolvePromise = res;
    });

    vi.spyOn(api, 'fetchBrowseDirectory').mockReturnValue(pendingPromise);

    view.mount(container, { path: '' });

    expect(container.querySelector('.loading-indicator')).not.toBeNull();
    expect(container.textContent).toContain('Loading');

    // Clean up pending promise
    resolvePromise!({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });
    await pendingPromise;
  });

  it('binds API data on successful fetch and renders table', async () => {
    const mockResponse: api.BrowseResponse = {
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'src', size: '-', type: 'folder' },
        { name: 'package.json', size: '512', type: 'file' },
      ],
    };

    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue(mockResponse);

    view.mount(container, { path: '' });

    // Wait for microtask / async fetch resolution
    await vi.waitFor(() => {
      expect(container.querySelector('table.file-table')).not.toBeNull();
    });

    expect(container.textContent).toContain('src');
    expect(container.textContent).toContain('package.json');
    expect(container.querySelector('.loading-indicator')).toBeNull();
  });

  it('displays empty state when directory has no files or folders', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: 'empty-dir',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    view.mount(container, { path: 'empty-dir' });

    await vi.waitFor(() => {
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
    });

    expect(container.textContent?.toLowerCase()).toMatch(/empty|no files/);
  });

  it('displays error banner with retry button on API failure', async () => {
    const fetchSpy = vi
      .spyOn(api, 'fetchBrowseDirectory')
      .mockRejectedValueOnce(new Error('Directory not found.'))
      .mockResolvedValueOnce({
        currentPath: '',
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
        items: [],
      });

    view.mount(container, { path: 'invalid' });

    await vi.waitFor(() => {
      expect(container.querySelector('.error-banner')).not.toBeNull();
    });

    expect(container.textContent).toContain('Directory not found.');

    const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
    expect(retryBtn).not.toBeNull();
    retryBtn.click();

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('renders root FileExplorerView and sets page title via initializeApp', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'test.txt', size: '100', type: 'file' }],
    });

    const { initializeApp } = await import('../../src/main');
    window.history.pushState(null, '', '/files');
    const router = initializeApp('app');

    expect(document.title).toBe('Files - SPA Explorer');
    await vi.waitFor(() => {
      expect(container.querySelector('.file-explorer-view')).not.toBeNull();
      expect(container.textContent).toContain('test.txt');
    });

    router?.stop();
  });
});
