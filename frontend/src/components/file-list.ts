import { BaseComponent } from '../core/component';
import { FileSystemItem } from '../api';

export class FileListComponent extends BaseComponent {
  private items: FileSystemItem[];
  private currentPath: string;
  private onFolderClick: (folderPath: string) => void;
  private onDeleteClick?: (item: FileSystemItem) => void;

  constructor(
    items: FileSystemItem[],
    currentPath: string,
    onFolderClick: (folderPath: string) => void,
    onDeleteClick?: (item: FileSystemItem) => void
  ) {
    super();
    this.items = items;
    this.currentPath = currentPath;
    this.onFolderClick = onFolderClick;
    this.onDeleteClick = onDeleteClick;
  }

  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'file-list-container';

    if (this.items.length === 0) {
      container.classList.add('empty');
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-state';
      emptyMsg.textContent = 'This directory is empty (No files or folders found).';
      container.appendChild(emptyMsg);
      return container;
    }

    const table = document.createElement('table');
    table.className = 'file-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Size</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    for (const item of this.items) {
      const tr = document.createElement('tr');
      const isFolder = item.type === 'folder';
      tr.className = isFolder ? 'folder-row' : 'file-row';

      const tdName = document.createElement('td');
      if (isFolder) {
        const targetPath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
        const link = document.createElement('a');
        link.href = `/files?path=${encodeURIComponent(targetPath)}`;
        link.className = 'folder-link';
        link.textContent = `📁 ${item.name}`;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.onFolderClick(targetPath);
        });
        tdName.appendChild(link);
      } else {
        const span = document.createElement('span');
        span.className = 'file-name';
        span.textContent = `📄 ${item.name}`;
        tdName.appendChild(span);
      }
      tr.appendChild(tdName);

      const tdSize = document.createElement('td');
      tdSize.className = 'size-col';
      if (isFolder || item.size === '-') {
        tdSize.textContent = '-';
      } else {
        const bytes = Number(item.size);
        tdSize.textContent = isNaN(bytes) ? item.size : `${bytes} B`;
      }
      tr.appendChild(tdSize);

      const tdActions = document.createElement('td');
      tdActions.className = 'action-col';
      if (!isFolder) {
        const filePath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
        const downloadLink = document.createElement('a');
        downloadLink.href = `/api/download?path=${encodeURIComponent(filePath)}`;
        downloadLink.className = 'download-link';
        downloadLink.download = item.name;
        downloadLink.textContent = 'Download';
        tdActions.appendChild(downloadLink);
      }

      const deleteLink = document.createElement('a');
      deleteLink.href = '#';
      deleteLink.className = 'delete-link';
      deleteLink.textContent = 'Delete';
      deleteLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.onDeleteClick?.(item);
      });
      tdActions.appendChild(deleteLink);

      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }
}
