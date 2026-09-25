import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('FileExplorerView Upload Integration', () => {
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

  it('renders upload button in explorer-header', async () => {
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
      expect(container.querySelector('.upload-btn')).not.toBeNull();
    });

    const uploadBtn = container.querySelector('.explorer-header .upload-btn');
    expect(uploadBtn).not.toBeNull();
    expect(uploadBtn?.textContent?.trim()).toBe('Upload');
  });

  it('triggers hidden file input click when upload button is clicked', async () => {
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
      expect(container.querySelector('.upload-btn')).not.toBeNull();
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.type).toBe('file');

    const clickSpy = vi.spyOn(fileInput, 'click');
    const uploadBtn = container.querySelector('.upload-btn') as HTMLElement;
    uploadBtn.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('uploads selected file, adds it to table, and increments file count in footer', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: 'docs',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'folder1', size: '-', type: 'folder' },
        { name: 'old-doc.txt', size: '500', type: 'file' },
      ],
    });

    const mockUploadResponse: api.UploadResponse = {
      fileName: 'new-doc.txt',
      path: 'docs',
      sizeBytes: 1024,
      message: 'File uploaded successfully.',
    };
    const uploadSpy = vi.spyOn(api, 'uploadFile').mockResolvedValue(mockUploadResponse);

    view.mount(container, { path: 'docs' });

    await vi.waitFor(() => {
      expect(container.querySelector('.file-counts-footer')?.textContent).toContain('Folders: 1 | Files: 1');
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    const testFile = new File(['new content'], 'new-doc.txt', { type: 'text/plain' });

    // Mock FileList on file input
    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: true,
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith('docs', testFile);
    });

    // Verify item is added to the table
    await vi.waitFor(() => {
      expect(container.textContent).toContain('new-doc.txt');
    });

    // Verify footer file count increments
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 1 | Files: 2');
  });

  it('handles conflict-renamed file by rendering _copy1 in table and incrementing file count', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'report.pdf', size: '1000', type: 'file' }],
    });

    const mockUploadResponse: api.UploadResponse = {
      fileName: 'report_copy1.pdf',
      path: '',
      sizeBytes: 1000,
      message: 'File uploaded successfully.',
    };
    vi.spyOn(api, 'uploadFile').mockResolvedValue(mockUploadResponse);

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('.file-counts-footer')?.textContent).toContain('Folders: 0 | Files: 1');
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    const testFile = new File(['dummy'], 'report.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: true,
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(container.textContent).toContain('report_copy1.pdf');
    });

    // Both original and copy exist
    expect(container.textContent).toContain('report.pdf');
    expect(container.textContent).toContain('report_copy1.pdf');

    // File count updated
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 2');
  });

  it('rejects file larger than 8 MB client-side with error banner without calling upload API', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'file1.txt', size: '100', type: 'file' }],
    });

    const uploadSpy = vi.spyOn(api, 'uploadFile');

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('.file-counts-footer')?.textContent).toContain('Folders: 0 | Files: 1');
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    const largeFile = new File(['dummy'], 'large.bin');
    Object.defineProperty(largeFile, 'size', { value: 8 * 1024 * 1024 + 50 });

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: true,
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      const errorBanner = container.querySelector('.error-banner');
      expect(errorBanner).not.toBeNull();
      expect(errorBanner?.textContent).toContain('8 MB');
    });

    expect(uploadSpy).not.toHaveBeenCalled();

    // Table and counts remain unchanged
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 1');
  });

  it('displays error banner when upload API fails and retains existing items', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'important.txt', size: '200', type: 'file' }],
    });

    vi.spyOn(api, 'uploadFile').mockRejectedValue(new Error('Network connection lost.'));

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('.file-counts-footer')?.textContent).toContain('Folders: 0 | Files: 1');
    });

    const fileInput = container.querySelector('input.file-upload-input') as HTMLInputElement;
    const testFile = new File(['content'], 'upload.txt', { type: 'text/plain' });

    Object.defineProperty(fileInput, 'files', {
      value: [testFile],
      writable: true,
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      const errorBanner = container.querySelector('.error-banner');
      expect(errorBanner).not.toBeNull();
      expect(errorBanner?.textContent).toContain('Network connection lost.');
    });

    // Original item remains
    expect(container.textContent).toContain('important.txt');
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 1');
  });
});
