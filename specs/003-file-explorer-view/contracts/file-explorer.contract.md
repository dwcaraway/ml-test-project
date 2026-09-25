# Frontend Interface Contracts: File Explorer View & Breadcrumbs

## 1. SPA Route & View Contracts

### Route Registration
- **Route Path**: `/files`
- **Title**: `"Files - SPA Explorer"`
- **View Class**: `FileExplorerView`
- **Supported Query Parameters**:
  - `path`: `string` (*optional*, default: `""`) &mdash; Relative directory path within the storage root.

### `FileExplorerView` Interface
```typescript
import { IView } from '../core/types';

export class FileExplorerView implements IView {
  readonly name: string = 'FileExplorerView';

  /**
   * Mounts the view into the specified container, reads the active path query parameter,
   * and initiates directory fetching.
   */
  mount(container: HTMLElement, params: Record<string, string>): void;

  /**
   * Cancels active requests and cleans up child components and event listeners.
   */
  unmount(): void;
}
```

---

## 2. Component Contracts

### `BreadcrumbComponent` Interface
```typescript
import { BaseComponent } from '../core/component';

export interface BreadcrumbSegment {
  name: string;
  path: string;
  isClickable: boolean;
  isCurrent: boolean;
}

export class BreadcrumbComponent extends BaseComponent {
  constructor(
    currentPath: string,
    onNavigate: (targetPath: string) => void,
    rootName: string = 'Home'
  );

  render(): HTMLElement;
}
```

- **DOM Structure**:
  ```html
  <nav class="breadcrumb-nav" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item"><a href="/files">Home</a></li>
      <li class="breadcrumb-separator">&gt;</li>
      <li class="breadcrumb-item"><button class="breadcrumb-ellipsis" aria-label="Expand hidden folders">...</button></li>
      <li class="breadcrumb-separator">&gt;</li>
      <li class="breadcrumb-item active" aria-current="page">current-folder</li>
    </ol>
  </nav>
  ```

### `FileListComponent` Interface
```typescript
import { BaseComponent } from '../core/component';
import { FileSystemItem } from '../api';

export class FileListComponent extends BaseComponent {
  constructor(
    items: FileSystemItem[],
    currentPath: string,
    onFolderClick: (folderPath: string) => void
  );

  render(): HTMLElement;
}
```

- **DOM Structure**:
  ```html
  <div class="file-list-container">
    <table class="file-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Folder Row -->
        <tr class="folder-row">
          <td><a href="/files?path=docs" class="folder-link">📁 docs</a></td>
          <td class="size-col">-</td>
          <td class="action-col"></td>
        </tr>
        <!-- File Row -->
        <tr class="file-row">
          <td><span class="file-name">📄 readme.txt</span></td>
          <td class="size-col">45 B</td>
          <td class="action-col">
            <a href="/api/download?path=docs%2Freadme.txt" class="download-link" download="readme.txt">Download</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  ```

---

## 3. API Client Function Contract

```typescript
export async function fetchBrowseDirectory(
  path: string = '',
  baseUrl: string = ''
): Promise<BrowseResponse>;
```

- **HTTP Request**: `GET ${baseUrl}/api/browse?path=${encodeURIComponent(path)}`
- **Error Handling**: Throws on non-200 HTTP statuses, preserving error message text from server when available.
