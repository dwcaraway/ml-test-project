import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileExplorerView } from '../../src/views/file-explorer-view';
import * as api from '../../src/api';

describe('FileExplorerView Deletion Integration', () => {
  let container: HTMLElement;
  let view: FileExplorerView;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    window.confirm = vi.fn();
    view = new FileExplorerView();
  });

  afterEach(() => {
    view.unmount();
    container.remove();
    vi.restoreAllMocks();
  });

  it('prompts window.confirm with item name and unrecoverable warning when delete is clicked', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: 'docs',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'spec.pdf', size: '1024', type: 'file' }],
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    view.mount(container, { path: 'docs' });

    await vi.waitFor(() => {
      expect(container.querySelector('.delete-link')).not.toBeNull();
    });

    const deleteLink = container.querySelector('.delete-link') as HTMLAnchorElement;
    deleteLink.click();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete "spec.pdf"? This action is not recoverable.'
    );
  });

  it('cancels deletion when user declines confirmation prompt', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'folder1', size: '-', type: 'folder' },
        { name: 'file1.txt', size: '100', type: 'file' },
      ],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const deleteSpy = vi.spyOn(api, 'deleteItem');

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.delete-link').length).toBe(2);
    });

    const fileDeleteLink = container.querySelectorAll('.delete-link')[1] as HTMLElement;
    fileDeleteLink.click();

    expect(deleteSpy).not.toHaveBeenCalled();
    // Item is still in table
    expect(container.textContent).toContain('file1.txt');
    // Counters remain unchanged
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 1 | Files: 1');
  });

  it('deletes file upon confirmation, removes it from table, and decrements file count', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: 'docs',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'folder1', size: '-', type: 'folder' },
        { name: 'file1.txt', size: '100', type: 'file' },
      ],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(api, 'deleteItem').mockResolvedValue({
      message: 'Item deleted successfully.',
    });

    view.mount(container, { path: 'docs' });

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.delete-link').length).toBe(2);
    });

    const fileDeleteLink = container.querySelectorAll('.delete-link')[1] as HTMLElement;
    fileDeleteLink.click();

    await vi.waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('docs/file1.txt');
    });

    // Item should be removed from DOM
    await vi.waitFor(() => {
      expect(container.textContent).not.toContain('file1.txt');
    });

    // Folder is still there
    expect(container.textContent).toContain('folder1');

    // Counters update immediately
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 1 | Files: 0');
  });

  it('deletes folder upon confirmation, removes it from table, and decrements folder count', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 2,
      totalPages: 1,
      items: [
        { name: 'photos', size: '-', type: 'folder' },
        { name: 'logo.png', size: '500', type: 'file' },
      ],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(api, 'deleteItem').mockResolvedValue({
      message: 'Item deleted successfully.',
    });

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.delete-link').length).toBe(2);
    });

    const folderDeleteLink = container.querySelectorAll('.delete-link')[0] as HTMLElement;
    folderDeleteLink.click();

    await vi.waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('photos');
    });

    // Folder removed
    await vi.waitFor(() => {
      expect(container.textContent).not.toContain('photos');
    });

    // File remains
    expect(container.textContent).toContain('logo.png');

    // Counters update immediately
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 1');
  });

  it('transitions to empty state and 0 counts when last remaining item is deleted', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: 'lone-item',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'only-me.txt', size: '50', type: 'file' }],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(api, 'deleteItem').mockResolvedValue({
      message: 'Item deleted successfully.',
    });

    view.mount(container, { path: 'lone-item' });

    await vi.waitFor(() => {
      expect(container.querySelector('.delete-link')).not.toBeNull();
    });

    const deleteLink = container.querySelector('.delete-link') as HTMLElement;
    deleteLink.click();

    await vi.waitFor(() => {
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).not.toBeNull();
    });

    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 0');
  });

  it('displays error banner and retains item when deletion API call fails', async () => {
    vi.spyOn(api, 'fetchBrowseDirectory').mockResolvedValue({
      currentPath: '',
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
      items: [{ name: 'protected.txt', size: '100', type: 'file' }],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(api, 'deleteItem').mockRejectedValue(new Error('Access denied to protected item.'));

    view.mount(container, { path: '' });

    await vi.waitFor(() => {
      expect(container.querySelector('.delete-link')).not.toBeNull();
    });

    const deleteLink = container.querySelector('.delete-link') as HTMLElement;
    deleteLink.click();

    await vi.waitFor(() => {
      const errorBanner = container.querySelector('.error-banner');
      expect(errorBanner).not.toBeNull();
      expect(errorBanner?.textContent).toContain('Access denied to protected item.');
    });

    // Item must still be retained in the list
    expect(container.textContent).toContain('protected.txt');
    const footer = container.querySelector('.file-counts-footer');
    expect(footer?.textContent).toContain('Folders: 0 | Files: 1');
  });
});
