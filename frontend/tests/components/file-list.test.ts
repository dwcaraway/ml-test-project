import { describe, it, expect, vi } from 'vitest';
import { FileListComponent } from '../../src/components/file-list';
import { FileSystemItem } from '../../src/api';

describe('FileListComponent', () => {
  it('renders semantic table with headers and items', () => {
    const items: FileSystemItem[] = [
      { name: 'docs', size: '-', type: 'folder' },
      { name: 'notes.txt', size: '128', type: 'file' },
    ];
    const onFolderClick = vi.fn();

    const component = new FileListComponent(items, '', onFolderClick);
    const el = component.render();

    expect(el.className).toContain('file-list-container');
    const table = el.querySelector('table.file-table');
    expect(table).not.toBeNull();

    const headers = el.querySelectorAll('th');
    expect(headers[0].textContent).toBe('Name');
    expect(headers[1].textContent).toBe('Size');
    expect(headers[2].textContent).toBe('Actions');

    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('renders folder size as "-" and file size with byte count', () => {
    const items: FileSystemItem[] = [
      { name: 'photos', size: '-', type: 'folder' },
      { name: 'logo.png', size: '2048', type: 'file' },
    ];

    const component = new FileListComponent(items, 'root', vi.fn());
    const el = component.render();

    const folderRow = el.querySelector('tr.folder-row');
    expect(folderRow).not.toBeNull();
    const folderSize = folderRow?.querySelector('.size-col')?.textContent;
    expect(folderSize).toBe('-');

    const fileRow = el.querySelector('tr.file-row');
    expect(fileRow).not.toBeNull();
    const fileSize = fileRow?.querySelector('.size-col')?.textContent;
    expect(fileSize).toContain('2048');
  });

  it('renders empty-state message when directory has no items', () => {
    const component = new FileListComponent([], '', vi.fn());
    const el = component.render();

    const emptyMsg = el.querySelector('.empty-state');
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg?.textContent?.toLowerCase()).toMatch(/empty|no files/);
  });

  it('triggers onFolderClick callback when folder link is clicked', () => {
    const items: FileSystemItem[] = [
      { name: 'subfolder', size: '-', type: 'folder' },
    ];
    const onFolderClick = vi.fn();

    const component = new FileListComponent(items, 'parent', onFolderClick);
    const el = component.render();

    const folderLink = el.querySelector('a.folder-link') as HTMLAnchorElement;
    expect(folderLink).not.toBeNull();
    folderLink.click();

    expect(onFolderClick).toHaveBeenCalledWith('parent/subfolder');
  });

  it('renders delete link for both folders and files in action column', () => {
    const items: FileSystemItem[] = [
      { name: 'subfolder', size: '-', type: 'folder' },
      { name: 'file.txt', size: '100', type: 'file' },
    ];
    const onDeleteClick = vi.fn();

    const component = new FileListComponent(items, 'docs', vi.fn(), onDeleteClick);
    const el = component.render();

    const folderRow = el.querySelector('tr.folder-row');
    const folderDeleteLink = folderRow?.querySelector('.action-col .delete-link') as HTMLElement;
    expect(folderDeleteLink).not.toBeNull();
    expect(folderDeleteLink.textContent).toBe('Delete');

    const fileRow = el.querySelector('tr.file-row');
    const fileDeleteLink = fileRow?.querySelector('.action-col .delete-link') as HTMLElement;
    expect(fileDeleteLink).not.toBeNull();
    expect(fileDeleteLink.textContent).toBe('Delete');

    // Clicking delete link triggers onDeleteClick with corresponding item
    folderDeleteLink.click();
    expect(onDeleteClick).toHaveBeenCalledWith(items[0]);

    fileDeleteLink.click();
    expect(onDeleteClick).toHaveBeenCalledWith(items[1]);
  });
});
