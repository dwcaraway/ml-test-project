import { describe, it, expect, vi } from 'vitest';
import { FileListComponent } from '../../src/components/file-list';
import { FileSystemItem } from '../../src/api';

describe('FileListComponent Download Links (User Story 3)', () => {
  it('displays download link for file items targeting /api/download with download attribute', () => {
    const items: FileSystemItem[] = [
      { name: 'document.pdf', size: '1024', type: 'file' },
    ];

    const component = new FileListComponent(items, 'docs', vi.fn());
    const el = component.render();

    const fileRow = el.querySelector('tr.file-row');
    expect(fileRow).not.toBeNull();

    const downloadLink = fileRow?.querySelector('a.download-link') as HTMLAnchorElement;
    expect(downloadLink).not.toBeNull();
    expect(downloadLink.getAttribute('href')).toBe('/api/download?path=docs%2Fdocument.pdf');
    expect(downloadLink.getAttribute('download')).toBe('document.pdf');
    expect(downloadLink.textContent).toBe('Download');
  });

  it('omits download link for folder items', () => {
    const items: FileSystemItem[] = [
      { name: 'subfolder', size: '-', type: 'folder' },
    ];

    const component = new FileListComponent(items, 'docs', vi.fn());
    const el = component.render();

    const folderRow = el.querySelector('tr.folder-row');
    expect(folderRow).not.toBeNull();

    const downloadLink = folderRow?.querySelector('a.download-link');
    expect(downloadLink).toBeNull();

    const actionCol = folderRow?.querySelector('td.action-col');
    expect(actionCol?.querySelector('a.download-link')).toBeNull();
    expect(actionCol?.textContent).not.toContain('Download');
  });

  it('correctly encodes special characters in file download path', () => {
    const items: FileSystemItem[] = [
      { name: 'special report & notes #1.txt', size: '512', type: 'file' },
    ];

    const component = new FileListComponent(items, 'folder with spaces/sub#path', vi.fn());
    const el = component.render();

    const downloadLink = el.querySelector('a.download-link') as HTMLAnchorElement;
    expect(downloadLink).not.toBeNull();
    expect(downloadLink.getAttribute('href')).toBe(
      '/api/download?path=folder%20with%20spaces%2Fsub%23path%2Fspecial%20report%20%26%20notes%20%231.txt'
    );
    expect(downloadLink.getAttribute('download')).toBe('special report & notes #1.txt');
  });
});
