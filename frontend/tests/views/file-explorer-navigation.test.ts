import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Router } from '../../src/core/router';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('File Explorer Navigation & Breadcrumbs Integration', () => {
  let container: HTMLElement;
  let router: Router;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    router = new Router(container);
    router.register({
      path: '/files',
      viewFactory: () => new FileExplorerView(router),
      title: 'Files - SPA Explorer',
    });
  });

  afterEach(() => {
    router.stop();
    container.remove();
    vi.restoreAllMocks();
  });

  it('navigates into subfolder on row click and updates URL query parameter', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockImplementation(async (path = '') => {
      if (path === '') {
        return {
          currentPath: '',
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
          items: [{ name: 'documents', size: '-', type: 'folder' }],
        };
      }
      if (path === 'documents') {
        return {
          currentPath: 'documents',
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
          items: [{ name: 'file.txt', size: '200', type: 'file' }],
        };
      }
      throw new Error('Not found');
    });

    window.history.pushState(null, '', '/files');
    router.start();

    await vi.waitFor(() => {
      expect(container.querySelector('.folder-link')).not.toBeNull();
    });

    const folderLink = container.querySelector('.folder-link') as HTMLAnchorElement;
    folderLink.click();

    await vi.waitFor(() => {
      expect(window.location.search).toBe('?path=documents');
      expect(container.textContent).toContain('file.txt');
    });

    // Verify breadcrumb appears
    const breadcrumb = container.querySelector('.breadcrumb-nav');
    expect(breadcrumb).not.toBeNull();
    expect(breadcrumb?.textContent).toContain('Home');
    expect(breadcrumb?.textContent).toContain('documents');
  });

  it('navigates back to ancestor when clicking breadcrumb item', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockImplementation(async (path = '') => {
      if (path === 'a/b') {
        return {
          currentPath: 'a/b',
          page: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 0,
          items: [],
        };
      }
      if (path === '') {
        return {
          currentPath: '',
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
          items: [{ name: 'a', size: '-', type: 'folder' }],
        };
      }
      throw new Error('Not found');
    });

    window.history.pushState(null, '', '/files?path=a%2Fb');
    router.start();

    await vi.waitFor(() => {
      expect(container.querySelector('.breadcrumb-nav')).not.toBeNull();
    });

    const homeLink = container.querySelector('.breadcrumb-item a') as HTMLAnchorElement;
    expect(homeLink).not.toBeNull();
    expect(homeLink.textContent).toBe('Home');
    homeLink.click();

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/files');
      expect(window.location.search).toBe('');
      expect(container.textContent).toContain('a');
    });
  });
});
