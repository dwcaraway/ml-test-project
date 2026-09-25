import { BaseView } from '../core/view';
import { IRouter } from '../core/types';
import { NavbarComponent } from '../components/navbar';
import { BreadcrumbComponent } from '../components/breadcrumb';
import { FileListComponent } from '../components/file-list';
import { fetchBrowseDirectory, deleteItem, FileSystemItem } from '../api';

export class FileExplorerView extends BaseView {
  readonly name = 'FileExplorerView';

  private currentPath = '';
  private items: FileSystemItem[] = [];
  private isLoading = false;
  private errorMessage: string | null = null;
  private deletionError: string | null = null;
  private contentContainer: HTMLElement | null = null;
  private breadcrumbContainer: HTMLElement | null = null;
  private router?: IRouter;

  constructor(router?: IRouter) {
    super();
    this.router = router;
  }

  protected onMount(): void {
    if (!this.container) {
      return;
    }

    // Determine current path from params or window.location.search
    const queryParam = this.params.path ?? new URLSearchParams(window.location.search).get('path') ?? '';
    this.currentPath = queryParam;

    const wrapper = document.createElement('div');
    wrapper.className = 'file-explorer-view';

    // 1. Navbar
    const navbar = this.registerComponent(new NavbarComponent('/files'));
    wrapper.appendChild(navbar.render());

    // 2. View Header
    const header = document.createElement('header');
    header.className = 'explorer-header';
    const title = document.createElement('h2');
    title.textContent = 'Files';
    header.appendChild(title);
    wrapper.appendChild(header);

    // 3. Breadcrumb Container (filled when not root)
    this.breadcrumbContainer = document.createElement('div');
    this.breadcrumbContainer.className = 'breadcrumb-container';
    wrapper.appendChild(this.breadcrumbContainer);

    // 4. Content Area
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'explorer-content';
    wrapper.appendChild(this.contentContainer);

    this.container.appendChild(wrapper);

    // Fetch initial directory
    this.loadDirectory(this.currentPath);
  }

  private async loadDirectory(path: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.deletionError = null;
    this.renderContent();

    try {
      const response = await fetchBrowseDirectory(path);
      // Guard against race conditions if view unmounted or path changed
      if (this.abortController.signal.aborted) {
        return;
      }

      this.currentPath = response.currentPath;
      this.items = response.items;
      this.isLoading = false;
      this.renderContent();
    } catch (err: unknown) {
      if (this.abortController.signal.aborted) {
        return;
      }

      this.isLoading = false;
      this.errorMessage = err instanceof Error ? err.message : 'Failed to load directory.';
      this.renderContent();
    }
  }

  private renderBreadcrumb(): void {
    if (!this.breadcrumbContainer) {
      return;
    }
    this.breadcrumbContainer.innerHTML = '';
    const cleanPath = this.currentPath.replace(/^\/+|\/+$/g, '').trim();
    if (cleanPath) {
      const breadcrumb = this.registerComponent(
        new BreadcrumbComponent(cleanPath, (target) => {
          this.navigateToPath(target);
        })
      );
      this.breadcrumbContainer.appendChild(breadcrumb.render());
    }
  }

  private renderContent(): void {
    this.renderBreadcrumb();

    if (!this.contentContainer) {
      return;
    }
    this.contentContainer.innerHTML = '';

    if (this.isLoading) {
      const loading = document.createElement('div');
      loading.className = 'loading-indicator';
      loading.textContent = 'Loading directory contents...';
      this.contentContainer.appendChild(loading);
      return;
    }

    if (this.errorMessage) {
      const banner = document.createElement('div');
      banner.className = 'error-banner';

      const msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = this.errorMessage;
      banner.appendChild(msg);

      const actions = document.createElement('div');
      actions.className = 'error-actions';

      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-btn';
      retryBtn.textContent = 'Retry';
      retryBtn.addEventListener('click', () => {
        this.loadDirectory(this.currentPath);
      });
      actions.appendChild(retryBtn);

      const homeLink = document.createElement('a');
      homeLink.className = 'home-link';
      homeLink.href = '/files';
      homeLink.textContent = 'Return to Home';
      homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToPath('');
      });
      actions.appendChild(homeLink);

      banner.appendChild(actions);
      this.contentContainer.appendChild(banner);
      return;
    }

    if (this.deletionError) {
      const banner = document.createElement('div');
      banner.className = 'error-banner delete-error';
      banner.setAttribute('role', 'alert');

      const msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = this.deletionError;
      banner.appendChild(msg);

      this.contentContainer.appendChild(banner);
    }

    const fileList = this.registerComponent(
      new FileListComponent(
        this.items,
        this.currentPath,
        (target) => {
          this.navigateToPath(target);
        },
        (item) => {
          this.handleDeleteItem(item);
        }
      )
    );
    this.contentContainer.appendChild(fileList.render());

    // Render folder and file count footer
    const folderCount = this.items.filter((item) => item.type === 'folder').length;
    const fileCount = this.items.filter((item) => item.type === 'file').length;

    const footer = document.createElement('div');
    footer.className = 'file-counts-footer';
    footer.id = 'item-counts-summary';
    footer.setAttribute('aria-live', 'polite');
    footer.textContent = `Folders: ${folderCount} | Files: ${fileCount}`;
    this.contentContainer.appendChild(footer);
  }

  private async handleDeleteItem(item: FileSystemItem): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"? This action is not recoverable.`
    );
    if (!confirmed) {
      return;
    }

    const itemPath = this.currentPath ? `${this.currentPath}/${item.name}` : item.name;
    try {
      this.deletionError = null;
      await deleteItem(itemPath);
      this.items = this.items.filter((i) => i.name !== item.name);
      this.renderContent();
    } catch (err: unknown) {
      this.deletionError = err instanceof Error ? err.message : 'Failed to delete item.';
      this.renderContent();
    }
  }

  private navigateToPath(targetPath: string): void {
    const targetUrl = targetPath ? `/files?path=${encodeURIComponent(targetPath)}` : '/files';
    if (this.router) {
      this.router.navigate(targetUrl);
    } else {
      window.history.pushState(null, '', targetUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
      this.currentPath = targetPath;
      this.loadDirectory(targetPath);
    }
  }
}
