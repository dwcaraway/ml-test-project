import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('FileExplorerView Search Integration', () => {
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

  it('renders search box to the left of the upload link in browsing mode', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'file1.txt', size: '100', type: 'file' }],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
      expect(container.querySelector('#upload-file-button')).not.toBeNull();
    });

    const headerActions = container.querySelector('.header-actions');
    expect(headerActions).not.toBeNull();

    const searchForm = container.querySelector('#explorer-search-form');
    const uploadBtn = container.querySelector('#upload-file-button');
    expect(searchForm).not.toBeNull();
    expect(uploadBtn).not.toBeNull();

    // Verify searchForm appears before uploadBtn in DOM order (to the left)
    const children = Array.from(headerActions!.children);
    const searchIndex = children.indexOf(searchForm as Element);
    const uploadIndex = children.indexOf(uploadBtn as Element);
    expect(searchIndex).toBeLessThan(uploadIndex);
  });

  it('hides the upload button and places search box above results when in search mode', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'file1.txt', size: '100', type: 'file' }],
    });

    const searchMock = vi.spyOn(api, 'searchFiles').mockResolvedValue({
      basePath: '',
      query: 'test',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'test_folder', path: 'test_folder', size: '-', type: 'folder' },
        { name: 'test_file.txt', path: 'test_file.txt', size: '2048', type: 'file' },
      ],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;

    input.value = 'test';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('', 'test', 1, 50);
      expect(container.querySelector('.search-results-banner')).not.toBeNull();
    });

    // Upload button should be hidden during search mode
    const uploadBtn = container.querySelector('#upload-file-button') as HTMLElement;
    expect(uploadBtn.style.display).toBe('none');

    // Search results table should render items with name and size
    const rows = container.querySelectorAll('.file-table tbody tr');
    expect(rows.length).toBe(2);

    const folderRow = container.querySelector('.folder-row');
    expect(folderRow?.textContent).toContain('test_folder');
    expect(folderRow?.querySelector('.size-col')?.textContent).toBe('-');

    const fileRow = container.querySelector('.file-row');
    expect(fileRow?.textContent).toContain('test_file.txt');
    expect(fileRow?.querySelector('.size-col')?.textContent).toBe('2048 B');
  });

  it('navigates to browse mode with folder contents when user clicks a folder in search results', async () => {
    const browseMock = vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    vi.spyOn(api, 'searchFiles').mockResolvedValue({
      basePath: '',
      query: 'docs',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'docs', path: 'docs', size: '-', type: 'folder' }],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;

    input.value = 'docs';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(container.querySelector('.folder-link')).not.toBeNull();
    });

    // Reset browse mock to simulate entering docs directory
    browseMock.mockResolvedValueOnce({
      currentPath: 'docs',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'inner.txt', size: '50', type: 'file' }],
    });

    const folderLink = container.querySelector('.folder-link') as HTMLAnchorElement;
    folderLink.click();

    await vi.waitFor(() => {
      expect(browseMock).toHaveBeenCalledWith('docs');
    });

    // Upload button should be restored in browse mode
    const uploadBtn = container.querySelector('#upload-file-button') as HTMLElement;
    expect(uploadBtn.style.display).not.toBe('none');
  });

  it('renders pagination options (1 .. N) and updates page on click in search mode', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    const searchMock = vi.spyOn(api, 'searchFiles').mockResolvedValue({
      basePath: '',
      query: 'data',
      page: 1,
      pageSize: 2,
      totalCount: 6,
      totalPages: 3,
      items: [
        { name: 'data1.txt', path: 'data1.txt', size: '10', type: 'file' },
        { name: 'data2.txt', path: 'data2.txt', size: '20', type: 'file' },
      ],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;

    input.value = 'data';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(container.querySelector('#search-pagination')).not.toBeNull();
    });

    const pageButtons = container.querySelectorAll('#search-pagination .page-btn');
    expect(pageButtons.length).toBe(3);
    expect(pageButtons[0].classList.contains('active')).toBe(true);
    expect(pageButtons[0].getAttribute('aria-current')).toBe('page');

    // Click page 2
    searchMock.mockResolvedValueOnce({
      basePath: '',
      query: 'data',
      page: 2,
      pageSize: 2,
      totalCount: 6,
      totalPages: 3,
      items: [
        { name: 'data3.txt', path: 'data3.txt', size: '30', type: 'file' },
        { name: 'data4.txt', path: 'data4.txt', size: '40', type: 'file' },
      ],
    });

    (pageButtons[1] as HTMLButtonElement).click();

    await vi.waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('', 'data', 2, 50);
    });
  });

  it('does not display pagination when there is only 1 page of results', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    vi.spyOn(api, 'searchFiles').mockResolvedValue({
      basePath: '',
      query: 'singlepage',
      page: 1,
      pageSize: 50,
      totalCount: 5,
      totalPages: 1,
      items: [
        { name: 'file1.txt', path: 'file1.txt', size: '10', type: 'file' },
      ],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;

    input.value = 'singlepage';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(container.querySelector('.search-results-banner')).not.toBeNull();
    });

    // Pagination must NOT be displayed when totalPages === 1
    const pagination = container.querySelector('#search-pagination');
    expect(pagination).toBeNull();
  });

  it('follows Google pagination UX pattern with Prev/Next and truncated page numbers when there are more than 10 pages', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    const searchMock = vi.spyOn(api, 'searchFiles').mockResolvedValue({
      basePath: '',
      query: 'many',
      page: 1,
      pageSize: 10,
      totalCount: 250,
      totalPages: 25,
      items: [
        { name: 'item1.txt', path: 'item1.txt', size: '10', type: 'file' },
      ],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;

    input.value = 'many';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(container.querySelector('#search-pagination')).not.toBeNull();
    });

    const pagination = container.querySelector('#search-pagination') as HTMLElement;
    expect(pagination).not.toBeNull();

    // Previous and Next buttons must exist
    const prevBtn = pagination.querySelector('.prev-page-btn') as HTMLButtonElement;
    const nextBtn = pagination.querySelector('.next-page-btn') as HTMLButtonElement;
    expect(prevBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();

    // On page 1, Previous is disabled and Next is enabled
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    // Number of page buttons should NOT be all 25 (must be truncated to avoid going off screen)
    const pageButtons = pagination.querySelectorAll('.page-btn');
    expect(pageButtons.length).toBeLessThan(10);

    // Ellipsis should be displayed
    const ellipsis = pagination.querySelectorAll('.pagination-ellipsis');
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);

    // Click Next button -> advances to page 2
    searchMock.mockResolvedValueOnce({
      basePath: '',
      query: 'many',
      page: 2,
      pageSize: 10,
      totalCount: 250,
      totalPages: 25,
      items: [
        { name: 'item11.txt', path: 'item11.txt', size: '10', type: 'file' },
      ],
    });

    nextBtn.click();

    await vi.waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('', 'many', 2, 50);
    });
  });
});

