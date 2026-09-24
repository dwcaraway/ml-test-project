import { BaseComponent } from '../core/component';

export interface NavLink {
  path: string;
  label: string;
}

export class NavbarComponent extends BaseComponent {
  private currentPath: string;
  private links: NavLink[];

  constructor(currentPath: string, links?: NavLink[]) {
    super();
    this.currentPath = currentPath;
    this.links = links || [
      { path: '/', label: 'Home' },
      { path: '/detail/item-1', label: 'Item 1' },
      { path: '/detail/item-2', label: 'Item 2' },
    ];
  }

  render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    for (const link of this.links) {
      const a = document.createElement('a');
      a.href = link.path;
      a.textContent = link.label;

      if (this.currentPath === link.path) {
        a.className = 'active';
      }

      nav.appendChild(a);
    }

    return nav;
  }
}
