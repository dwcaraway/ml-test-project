import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('FileExplorerView Global Operation Spinner', () => {
  let container: HTMLElement;
  let view: FileExplorerView;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    window.confirm = vi.fn().mockReturnValue(true);
    view = new FileExplorerView();
  });

  afterEach(() => {
    view.unmount();
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders spinner and keeps it hidden when idle', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#explorer-spinner')).not.toBeNull();
    });

    const spinner = container.querySelector('#explorer-spinner') as HTMLElement;
    expect(spinner.classList.contains('hidden') || spinner.style.display === 'none').toBe(true);
  });

  it('displays spinner during search and hides it when search completes', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    let resolveSearch!: (value: api.SearchResponse) => void;
    const searchPromise = new Promise<api.SearchResponse>((resolve) => {
      resolveSearch = resolve;
    });

    vi.spyOn(api, 'searchFiles').mockReturnValue(searchPromise);

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('#search-input')).not.toBeNull();
    });

    const input = container.querySelector('#search-input') as HTMLInputElement;
    const form = container.querySelector('#explorer-search-form') as HTMLFormElement;
    const spinner = container.querySelector('#explorer-spinner') as HTMLElement;

    input.value = 'query';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // While search is in-flight
    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(true);
    });

    // Complete search
    resolveSearch({
      basePath: '',
      query: 'query',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 1,
      items: [],
    });

    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(false);
    });
  });

  it('displays spinner during upload and hides it when upload completes', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      items: [],
    });

    let resolveUpload!: (value: api.UploadResponse) => void;
    const uploadPromise = new Promise<api.UploadResponse>((resolve) => {
      resolveUpload = resolve;
    });

    vi.spyOn(api, 'uploadFile').mockReturnValue(uploadPromise);

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('input.file-upload-input')).not.toBeNull();
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    const spinner = container.querySelector('#explorer-spinner') as HTMLElement;

    const file = new File(['content'], 'sample.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    // While upload is in-flight
    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(true);
    });

    // Complete upload
    resolveUpload({
      fileName: 'sample.txt',
      path: '',
      sizeBytes: 7,
      message: 'File uploaded successfully.',
    });

    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(false);
    });
  });

  it('displays spinner during delete and hides it when delete completes', async () => {
    (window.confirm as any).mockReturnValue(true);
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'file_to_delete.txt', size: '100', type: 'file' }],
    });

    let resolveDelete!: (value: api.DeleteResponse) => void;
    const deletePromise = new Promise<api.DeleteResponse>((resolve) => {
      resolveDelete = resolve;
    });

    vi.spyOn(api, 'deleteItem').mockReturnValue(deletePromise);

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('.delete-link')).not.toBeNull();
    });

    const deleteLink = container.querySelector('.delete-link') as HTMLAnchorElement;
    const spinner = container.querySelector('#explorer-spinner') as HTMLElement;

    deleteLink.click();

    // While delete is in-flight
    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(true);
    });

    // Complete delete
    resolveDelete({
      message: 'Item deleted successfully.',
    });

    await vi.waitFor(() => {
      const isVisible = !spinner.classList.contains('hidden') && spinner.style.display !== 'none';
      expect(isVisible).toBe(false);
    });
  });
});
