import { BaseView } from '../core/view';
import { IRouter } from '../core/types';
import { NavbarComponent } from '../components/navbar';
import { BreadcrumbComponent } from '../components/breadcrumb';
import { FileListComponent } from '../components/file-list';
import {
  fetchBrowseDirectory,
  deleteItem,
  uploadFile,
  searchFiles,
  FileSystemItem,
} from '../api';

export class FileExplorerView extends BaseView {
  readonly name = 'FileExplorerView';

  private currentPath = '';
  private items: FileSystemItem[] = [];
  private isLoading = false;
  private errorMessage: string | null = null;
  private deletionError: string | null = null;
  private uploadError: string | null = null;
  private searchError: string | null = null;

  // View mode and search state
  private viewMode: 'browsing' | 'searching' = 'browsing';
  private searchQuery = '';
  private searchPage = 1;
  private searchPageSize = 50;
  private searchTotalCount = 0;
  private searchTotalPages = 1;

  // Global operation loading indicators
  private isSearching = false;
  private isDeleting = false;
  private isUploading = false;

  // DOM elements
  private fileInput: HTMLInputElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private breadcrumbContainer: HTMLElement | null = null;
  private headerActions: HTMLElement | null = null;
  private uploadButton: HTMLButtonElement | null = null;
  private searchForm: HTMLFormElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private spinnerElement: HTMLElement | null = null;

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

    // Inject spinner & pagination styles if not already present
    if (!document.getElementById('explorer-dynamic-styles')) {
      const style = document.createElement('style');
      style.id = 'explorer-dynamic-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-icon {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #d0d7de;
          border-top-color: #0969da;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
          box-sizing: border-box;
        }
        .spinner-icon.hidden {
          display: none !important;
        }
        .pagination-nav .prev-page-btn,
        .pagination-nav .next-page-btn,
        .pagination-nav .page-btn {
          padding: 4px 10px;
          cursor: pointer;
          border-radius: 4px;
          border: 1px solid #d0d7de;
          background: #ffffff;
          color: #24292f;
        }
        .pagination-nav .prev-page-btn:disabled,
        .pagination-nav .next-page-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .pagination-nav .page-btn.active {
          font-weight: bold;
          background-color: #0969da;
          color: #ffffff;
          border-color: #0969da;
        }
        .pagination-nav .pagination-ellipsis {
          padding: 0 4px;
          color: #57606a;
          user-select: none;
        }
      `;
      document.head.appendChild(style);
    }

    // 1. Navbar
    const navbar = this.registerComponent(new NavbarComponent('/files'));
    wrapper.appendChild(navbar.render());

    // 2. View Header
    const header = document.createElement('header');
    header.className = 'explorer-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Files';
    header.appendChild(title);

    this.headerActions = document.createElement('div');
    this.headerActions.className = 'header-actions';
    this.headerActions.style.display = 'flex';
    this.headerActions.style.alignItems = 'center';
    this.headerActions.style.gap = '8px';

    // Global Operation Loading Spinner
    this.spinnerElement = document.createElement('span');
    this.spinnerElement.id = 'explorer-spinner';
    this.spinnerElement.className = 'spinner-icon hidden';
    this.spinnerElement.setAttribute('role', 'status');
    this.spinnerElement.setAttribute('aria-label', 'Loading');
    this.spinnerElement.setAttribute('aria-hidden', 'true');
    this.spinnerElement.style.display = 'none';
    this.headerActions.appendChild(this.spinnerElement);

    // Search Box Form (positioned to the left of upload link in browsing mode)
    this.searchForm = document.createElement('form');
    this.searchForm.id = 'explorer-search-form';
    this.searchForm.className = 'search-form';
    this.searchForm.setAttribute('role', 'search');
    this.searchForm.style.display = 'flex';
    this.searchForm.style.gap = '4px';
    this.searchForm.style.alignItems = 'center';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.id = 'search-input';
    this.searchInput.className = 'search-input';
    this.searchInput.placeholder = 'Search...';
    this.searchInput.setAttribute('aria-label', 'Search files and folders');
    this.searchInput.style.padding = '4px 8px';
    this.searchInput.style.fontSize = '14px';
    this.searchForm.appendChild(this.searchInput);

    const searchSubmitBtn = document.createElement('button');
    searchSubmitBtn.type = 'submit';
    searchSubmitBtn.id = 'search-submit-btn';
    searchSubmitBtn.className = 'search-btn';
    searchSubmitBtn.textContent = 'Search';
    searchSubmitBtn.style.padding = '4px 8px';
    searchSubmitBtn.style.cursor = 'pointer';
    this.searchForm.appendChild(searchSubmitBtn);

    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = this.searchInput?.value.trim() ?? '';
      if (query) {
        this.executeSearch(query, 1);
      }
    });
    this.headerActions.appendChild(this.searchForm);

    // Upload Button (to the right of search form)
    this.uploadButton = document.createElement('button');
    this.uploadButton.type = 'button';
    this.uploadButton.className = 'upload-btn';
    this.uploadButton.id = 'upload-file-button';
    this.uploadButton.textContent = 'Upload';
    this.uploadButton.addEventListener('click', () => {
      this.fileInput?.click();
    });
    this.headerActions.appendChild(this.uploadButton);

    header.appendChild(this.headerActions);
    wrapper.appendChild(header);

    // Hidden file input for native OS file selection
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.className = 'file-upload-input';
    this.fileInput.style.display = 'none';
    this.fileInput.setAttribute('aria-hidden', 'true');
    this.fileInput.addEventListener('change', () => {
      this.handleFileSelected();
    });
    wrapper.appendChild(this.fileInput);

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

  private updateSpinnerVisibility(): void {
    const shouldShow = this.isSearching || this.isDeleting || this.isUploading;
    if (this.spinnerElement) {
      if (shouldShow) {
        this.spinnerElement.classList.remove('hidden');
        this.spinnerElement.style.display = 'inline-block';
        this.spinnerElement.setAttribute('aria-hidden', 'false');
      } else {
        this.spinnerElement.classList.add('hidden');
        this.spinnerElement.style.display = 'none';
        this.spinnerElement.setAttribute('aria-hidden', 'true');
      }
    }
  }

  private async executeSearch(query: string, page: number = 1): Promise<void> {
    this.viewMode = 'searching';
    this.searchQuery = query;
    this.searchPage = page;
    this.searchError = null;
    this.isSearching = true;
    this.updateSpinnerVisibility();

    // Hide upload button during search
    if (this.uploadButton) {
      this.uploadButton.style.display = 'none';
    }

    try {
      const response = await searchFiles(this.currentPath, query, page, this.searchPageSize);
      if (this.abortController.signal.aborted) {
        return;
      }

      this.searchTotalCount = response.totalCount;
      this.searchTotalPages = response.totalPages;
      this.items = response.items.map((item) => ({
        name: item.name,
        size: item.size,
        type: item.type,
        path: item.path,
      }));
      this.renderContent();
    } catch (err: unknown) {
      if (this.abortController.signal.aborted) {
        return;
      }
      this.searchError = err instanceof Error ? err.message : 'Search failed.';
      this.renderContent();
    } finally {
      this.isSearching = false;
      this.updateSpinnerVisibility();
    }
  }

  private exitSearchMode(navigateToFolder?: string): void {
    this.viewMode = 'browsing';
    this.searchQuery = '';
    this.searchError = null;
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    if (this.uploadButton) {
      this.uploadButton.style.display = '';
    }

    if (navigateToFolder !== undefined) {
      this.navigateToPath(navigateToFolder);
    } else {
      this.loadDirectory(this.currentPath);
    }
  }

  private async loadDirectory(path: string): Promise<void> {
    this.viewMode = 'browsing';
    this.searchQuery = '';
    this.searchError = null;
    if (this.uploadButton) {
      this.uploadButton.style.display = '';
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.deletionError = null;
    this.uploadError = null;
    this.renderContent();

    try {
      const response = await fetchBrowseDirectory(path);
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
    if (this.viewMode === 'searching') {
      return;
    }

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

    if (this.uploadError) {
      const banner = document.createElement('div');
      banner.className = 'error-banner upload-error';
      banner.setAttribute('role', 'alert');

      const msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = this.uploadError;
      banner.appendChild(msg);

      this.contentContainer.appendChild(banner);
    }

    if (this.searchError) {
      const banner = document.createElement('div');
      banner.className = 'error-banner search-error';
      banner.setAttribute('role', 'alert');

      const msg = document.createElement('p');
      msg.className = 'error-message';
      msg.textContent = this.searchError;
      banner.appendChild(msg);

      this.contentContainer.appendChild(banner);
    }

    // If in search mode, display search results banner above results table
    if (this.viewMode === 'searching') {
      const searchBanner = document.createElement('div');
      searchBanner.className = 'search-results-banner';
      searchBanner.style.display = 'flex';
      searchBanner.style.justifyContent = 'space-between';
      searchBanner.style.alignItems = 'center';
      searchBanner.style.padding = '8px 12px';
      searchBanner.style.marginBottom = '12px';
      searchBanner.style.backgroundColor = '#f6f8fa';
      searchBanner.style.borderRadius = '6px';
      searchBanner.style.border = '1px solid #d0d7de';

      const info = document.createElement('span');
      info.innerHTML = `Search results for: <strong>"${this.searchQuery}"</strong> (${this.searchTotalCount} item${this.searchTotalCount === 1 ? '' : 's'} found)`;
      searchBanner.appendChild(info);

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.id = 'clear-search-btn';
      backBtn.className = 'clear-search-btn';
      backBtn.textContent = 'Back to Browsing';
      backBtn.style.padding = '4px 8px';
      backBtn.style.cursor = 'pointer';
      backBtn.addEventListener('click', () => {
        this.exitSearchMode();
      });
      searchBanner.appendChild(backBtn);

      this.contentContainer.appendChild(searchBanner);
    }

    // Render table
    const fileList = this.registerComponent(
      new FileListComponent(
        this.items,
        this.currentPath,
        (target) => {
          if (this.viewMode === 'searching') {
            this.exitSearchMode(target);
          } else {
            this.navigateToPath(target);
          }
        },
        (item) => {
          this.handleDeleteItem(item);
        }
      )
    );
    this.contentContainer.appendChild(fileList.render());

    // In browsing mode, render folder and file counts
    if (this.viewMode === 'browsing') {
      const folderCount = this.items.filter((item) => item.type === 'folder').length;
      const fileCount = this.items.filter((item) => item.type === 'file').length;

      const footer = document.createElement('div');
      footer.className = 'file-counts-footer';
      footer.id = 'item-counts-summary';
      footer.setAttribute('aria-live', 'polite');
      footer.textContent = `Folders: ${folderCount} | Files: ${fileCount}`;
      this.contentContainer.appendChild(footer);
    }

    // In search mode, render numbered pagination options with Prev/Next and truncation
    // Do not display pagination if there is only 1 page of results
    if (this.viewMode === 'searching' && this.searchTotalPages > 1) {
      const paginationNav = document.createElement('nav');
      paginationNav.id = 'search-pagination';
      paginationNav.className = 'pagination-nav';
      paginationNav.setAttribute('aria-label', 'Search results pagination');
      paginationNav.style.display = 'flex';
      paginationNav.style.justifyContent = 'center';
      paginationNav.style.alignItems = 'center';
      paginationNav.style.gap = '6px';
      paginationNav.style.marginTop = '16px';

      // Previous button
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'prev-page-btn';
      prevBtn.setAttribute('aria-label', 'Previous page');
      prevBtn.textContent = 'Previous';
      prevBtn.disabled = this.searchPage <= 1;
      prevBtn.addEventListener('click', () => {
        if (this.searchPage > 1) {
          this.executeSearch(this.searchQuery, this.searchPage - 1);
        }
      });
      paginationNav.appendChild(prevBtn);

      // Truncated page number buttons following Google pagination UX pattern
      const total = this.searchTotalPages;
      const current = this.searchPage;
      const pageItems: (number | 'ellipsis')[] = [];

      if (total <= 7) {
        for (let p = 1; p <= total; p++) {
          pageItems.push(p);
        }
      } else {
        if (current <= 4) {
          for (let p = 1; p <= 5; p++) {
            pageItems.push(p);
          }
          pageItems.push('ellipsis');
          pageItems.push(total);
        } else if (current >= total - 3) {
          pageItems.push(1);
          pageItems.push('ellipsis');
          for (let p = total - 4; p <= total; p++) {
            pageItems.push(p);
          }
        } else {
          pageItems.push(1);
          pageItems.push('ellipsis');
          pageItems.push(current - 1);
          pageItems.push(current);
          pageItems.push(current + 1);
          pageItems.push('ellipsis');
          pageItems.push(total);
        }
      }

      for (const item of pageItems) {
        if (item === 'ellipsis') {
          const ellipsisSpan = document.createElement('span');
          ellipsisSpan.className = 'pagination-ellipsis';
          ellipsisSpan.setAttribute('aria-hidden', 'true');
          ellipsisSpan.textContent = '…';
          paginationNav.appendChild(ellipsisSpan);
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'page-btn' + (item === current ? ' active' : '');
          btn.setAttribute('data-page', item.toString());
          if (item === current) {
            btn.setAttribute('aria-current', 'page');
          }
          btn.textContent = item.toString();
          btn.addEventListener('click', () => {
            this.executeSearch(this.searchQuery, item);
          });
          paginationNav.appendChild(btn);
        }
      }

      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'next-page-btn';
      nextBtn.setAttribute('aria-label', 'Next page');
      nextBtn.textContent = 'Next';
      nextBtn.disabled = this.searchPage >= this.searchTotalPages;
      nextBtn.addEventListener('click', () => {
        if (this.searchPage < this.searchTotalPages) {
          this.executeSearch(this.searchQuery, this.searchPage + 1);
        }
      });
      paginationNav.appendChild(nextBtn);

      this.contentContainer.appendChild(paginationNav);
    }
  }

  private async handleDeleteItem(item: FileSystemItem): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"? This action is not recoverable.`
    );
    if (!confirmed) {
      return;
    }

    const itemPath = item.path ?? (this.currentPath ? `${this.currentPath}/${item.name}` : item.name);
    try {
      this.deletionError = null;
      this.isDeleting = true;
      this.updateSpinnerVisibility();
      await deleteItem(itemPath);
      this.items = this.items.filter((i) => i.name !== item.name);
      if (this.viewMode === 'searching') {
        this.searchTotalCount = Math.max(0, this.searchTotalCount - 1);
      }
      this.renderContent();
    } catch (err: unknown) {
      this.deletionError = err instanceof Error ? err.message : 'Failed to delete item.';
      this.renderContent();
    } finally {
      this.isDeleting = false;
      this.updateSpinnerVisibility();
    }
  }

  private async handleFileSelected(): Promise<void> {
    const file = this.fileInput?.files?.[0];
    if (!file) {
      return;
    }

    // Client-side size pre-validation (strictly > 8 MB)
    if (file.size > 8 * 1024 * 1024) {
      this.uploadError = 'File exceeds the maximum allowed size of 8 MB.';
      if (this.fileInput) {
        this.fileInput.value = '';
      }
      this.renderContent();
      return;
    }

    try {
      this.uploadError = null;
      this.isUploading = true;
      this.updateSpinnerVisibility();
      const response = await uploadFile(this.currentPath, file);
      const newItem: FileSystemItem = {
        name: response.fileName,
        size: response.sizeBytes.toString(),
        type: 'file',
      };
      this.items.push(newItem);
      this.items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      if (this.fileInput) {
        this.fileInput.value = '';
      }
      this.renderContent();
    } catch (err: unknown) {
      this.uploadError = err instanceof Error ? err.message : 'Failed to upload file.';
      if (this.fileInput) {
        this.fileInput.value = '';
      }
      this.renderContent();
    } finally {
      this.isUploading = false;
      this.updateSpinnerVisibility();
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
