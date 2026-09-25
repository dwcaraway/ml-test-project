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

  it('allows native file download when clicking download link without router 404 navigation', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'sample.txt', size: '100', type: 'file' }],
    });

    const { initializeApp } = await import('../../src/main');
    window.history.pushState(null, '', '/files');
    const router = initializeApp('app');

    await vi.waitFor(() => {
      expect(container.querySelector('a.download-link')).not.toBeNull();
    });

    const downloadLink = container.querySelector('a.download-link') as HTMLAnchorElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    downloadLink.dispatchEvent(clickEvent);

    // The browser download must not be intercepted or prevented by the SPA router
    expect(clickEvent.defaultPrevented).toBe(false);
    expect(container.querySelector('.file-explorer-view')).not.toBeNull();
    expect(container.querySelector('.not-found-view')).toBeNull();
    expect(container.textContent).not.toContain('404');
    expect(router?.getCurrentRoute()?.route.path).toBe('/files');

    router?.stop();
  });

  describe('User Story 1 - Folder and File Counts Summary', () => {
    it('displays accurate folder and file counts in footer for mixed items', async () => {
      vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
        currentPath: '',
        page: 1,
        pageSize: 50,
        totalCount: 5,
        totalPages: 1,
        items: [
          { name: 'docs', size: '-', type: 'folder' },
          { name: 'images', size: '-', type: 'folder' },
          { name: 'readme.txt', size: '100', type: 'file' },
          { name: 'logo.png', size: '200', type: 'file' },
          { name: 'notes.md', size: '300', type: 'file' },
        ],
      });

      view.mount(container, { path: '' });

      await vi.waitFor(() => {
        const footer = container.querySelector('.file-counts-footer');
        expect(footer).not.toBeNull();
      });

      const footer = container.querySelector('.file-counts-footer');
      expect(footer?.textContent).toContain('Folders: 2');
      expect(footer?.textContent).toContain('Files: 3');
    });

    it('displays 0 folders and 0 files in footer for an empty directory', async () => {
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
        const footer = container.querySelector('.file-counts-footer');
        expect(footer).not.toBeNull();
      });

      const footer = container.querySelector('.file-counts-footer');
      expect(footer?.textContent).toContain('Folders: 0');
      expect(footer?.textContent).toContain('Files: 0');
    });

    it('displays accurate counts when directory contains only folders', async () => {
      vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
        currentPath: 'folders-only',
        page: 1,
        pageSize: 50,
        totalCount: 2,
        totalPages: 1,
        items: [
          { name: 'dir1', size: '-', type: 'folder' },
          { name: 'dir2', size: '-', type: 'folder' },
        ],
      });

      view.mount(container, { path: 'folders-only' });

      await vi.waitFor(() => {
        const footer = container.querySelector('.file-counts-footer');
        expect(footer).not.toBeNull();
      });

      const footer = container.querySelector('.file-counts-footer');
      expect(footer?.textContent).toContain('Folders: 2');
      expect(footer?.textContent).toContain('Files: 0');
    });

    it('displays accurate counts when directory contains only files', async () => {
      vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
        currentPath: 'files-only',
        page: 1,
        pageSize: 50,
        totalCount: 2,
        totalPages: 1,
        items: [
          { name: 'file1.txt', size: '50', type: 'file' },
          { name: 'file2.txt', size: '60', type: 'file' },
        ],
      });

      view.mount(container, { path: 'files-only' });

      await vi.waitFor(() => {
        const footer = container.querySelector('.file-counts-footer');
        expect(footer).not.toBeNull();
      });

      const footer = container.querySelector('.file-counts-footer');
      expect(footer?.textContent).toContain('Folders: 0');
      expect(footer?.textContent).toContain('Files: 2');
    });
  });
});
