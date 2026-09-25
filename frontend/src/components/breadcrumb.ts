import { BaseComponent } from '../core/component';

export interface BreadcrumbSegment {
  name: string;
  path: string;
  isClickable: boolean;
  isCurrent: boolean;
}

export class BreadcrumbComponent extends BaseComponent {
  private currentPath: string;
  private onNavigate: (targetPath: string) => void;
  private rootName: string;
  private isExpanded = false;

  constructor(
    currentPath: string,
    onNavigate: (targetPath: string) => void,
    rootName = 'Home'
  ) {
    super();
    this.currentPath = currentPath;
    this.onNavigate = onNavigate;
    this.rootName = rootName;
  }

  render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb-nav';
    nav.setAttribute('aria-label', 'Breadcrumb');

    const cleanPath = this.currentPath.replace(/^\/+|\/+$/g, '').trim();
    if (!cleanPath) {
      nav.classList.add('hidden');
      nav.style.display = 'none';
      return nav;
    }

    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';
    this.populateList(ol, cleanPath);
    nav.appendChild(ol);

    return nav;
  }

  private populateList(ol: HTMLOListElement, cleanPath: string): void {
    ol.innerHTML = '';
    const segments = cleanPath.split('/').filter(Boolean);
    const depth = segments.length;

    // 1. Root Segment (e.g. "Home")
    const rootLi = document.createElement('li');
    rootLi.className = 'breadcrumb-item';
    const rootLink = document.createElement('a');
    rootLink.href = '/files';
    rootLink.textContent = this.rootName;
    rootLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.onNavigate('');
    });
    rootLi.appendChild(rootLink);
    ol.appendChild(rootLi);

    if (depth <= 3 || this.isExpanded) {
      // Full trail
      for (let i = 0; i < segments.length; i++) {
        ol.appendChild(this.createSeparator());

        const li = document.createElement('li');
        li.className = 'breadcrumb-item';
        const isCurrent = i === segments.length - 1;

        if (isCurrent) {
          li.classList.add('active');
          li.setAttribute('aria-current', 'page');
          li.textContent = segments[i];
        } else {
          const segPath = segments.slice(0, i + 1).join('/');
          const link = document.createElement('a');
          link.href = `/files?path=${encodeURIComponent(segPath)}`;
          link.textContent = segments[i];
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.onNavigate(segPath);
          });
          li.appendChild(link);
        }

        ol.appendChild(li);
      }
    } else {
      // Collapsed trail: Home > ... > current
      ol.appendChild(this.createSeparator());

      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'breadcrumb-item';
      const ellipsisBtn = document.createElement('button');
      ellipsisBtn.type = 'button';
      ellipsisBtn.className = 'breadcrumb-ellipsis';
      ellipsisBtn.setAttribute('aria-label', 'Expand hidden folders');
      ellipsisBtn.textContent = '...';
      ellipsisBtn.addEventListener('click', () => {
        this.isExpanded = true;
        this.populateList(ol, cleanPath);
      });
      ellipsisLi.appendChild(ellipsisBtn);
      ol.appendChild(ellipsisLi);

      ol.appendChild(this.createSeparator());

      const currentLi = document.createElement('li');
      currentLi.className = 'breadcrumb-item active';
      currentLi.setAttribute('aria-current', 'page');
      currentLi.textContent = segments[segments.length - 1];
      ol.appendChild(currentLi);
    }
  }

  private createSeparator(): HTMLElement {
    const separator = document.createElement('li');
    separator.className = 'breadcrumb-separator';
    separator.textContent = '>';
    return separator;
  }
}
