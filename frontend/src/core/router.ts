import {
  IRouter,
  IView,
  NavigationOptions,
  RouteDefinition,
  RouteMatch,
} from './types';

interface CompiledRoute {
  definition: RouteDefinition;
  regex: RegExp;
  paramKeys: string[];
}

export class Router implements IRouter {
  private routes: CompiledRoute[] = [];
  private notFoundViewFactory: (() => IView) | null = null;
  private currentView: IView | null = null;
  private currentRouteMatch: RouteMatch | null = null;
  private container: HTMLElement | null = null;
  private isStarted = false;
  private popstateListener: ((e: PopStateEvent) => void) | null = null;
  private clickListener: ((e: MouseEvent) => void) | null = null;

  constructor(container?: HTMLElement) {
    if (container) {
      this.container = container;
    }
  }

  setContainer(container: HTMLElement): this {
    this.container = container;
    return this;
  }

  register(route: RouteDefinition): IRouter {
    const paramKeys: string[] = [];
    const pattern = route.path
      .replace(/\/+$/, '') // normalize trailing slashes
      .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramKeys.push(key);
        return '([^/]+)';
      });

    const regexString = pattern === '' ? '^/?$' : `^${pattern}/?$`;
    const regex = new RegExp(regexString);

    this.routes.push({
      definition: route,
      regex,
      paramKeys,
    });

    return this;
  }

  setNotFoundView(viewFactory: () => IView): IRouter {
    this.notFoundViewFactory = viewFactory;
    return this;
  }

  getCurrentRoute(): RouteMatch | null {
    return this.currentRouteMatch;
  }

  navigate(path: string, options: NavigationOptions = {}): void {
    const normalizedPath = this.normalizePath(path);

    if (options.replace) {
      window.history.replaceState(null, '', normalizedPath);
    } else {
      window.history.pushState(null, '', normalizedPath);
    }

    this.resolve(normalizedPath);
  }

  start(): void {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;

    this.popstateListener = () => {
      this.resolve(this.normalizePath(window.location.pathname + window.location.search));
    };
    window.addEventListener('popstate', this.popstateListener);

    // Intercept internal link clicks
    this.clickListener = (event: MouseEvent) => {
      this.handleLinkClick(event);
    };
    document.addEventListener('click', this.clickListener);

    // Initial route resolution
    this.resolve(this.normalizePath(window.location.pathname + window.location.search));
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;

    if (this.popstateListener) {
      window.removeEventListener('popstate', this.popstateListener);
      this.popstateListener = null;
    }

    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }

    if (this.currentView) {
      this.currentView.unmount();
      this.currentView = null;
    }

    this.currentRouteMatch = null;
  }

  private handleLinkClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Check same origin
    const targetUrl = new URL(anchor.href, window.location.origin);
    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    // Do not intercept links with download attribute, non-self target, or external rel
    if (
      anchor.hasAttribute('download') ||
      (anchor.target && anchor.target.toLowerCase() !== '_self') ||
      anchor.rel?.toLowerCase().includes('external')
    ) {
      return;
    }

    // Do not intercept backend API routes
    if (targetUrl.pathname.startsWith('/api/') || targetUrl.pathname === '/api') {
      return;
    }

    event.preventDefault();
    this.navigate(targetUrl.pathname + targetUrl.search);
  }

  private resolve(path: string): void {
    if (!this.container) {
      throw new Error('Router container has not been set. Call setContainer() before start().');
    }

    const match = this.matchRoute(path);

    if (this.currentView) {
      this.currentView.unmount();
      this.currentView = null;
    }

    if (match) {
      this.currentRouteMatch = match;
      if (match.route.title && typeof document !== 'undefined') {
        document.title = match.route.title;
      }
      this.currentView = match.route.viewFactory();
      this.currentView.mount(this.container, match.params);
    } else if (this.notFoundViewFactory) {
      this.currentRouteMatch = {
        route: {
          path,
          viewFactory: this.notFoundViewFactory,
          title: 'Not Found',
        },
        params: {},
        path,
      };
      if (typeof document !== 'undefined') {
        document.title = 'Not Found';
      }
      this.currentView = this.notFoundViewFactory();
      this.currentView.mount(this.container, {});
    } else {
      this.container.innerHTML = '<h1>404 - Not Found</h1>';
      this.currentRouteMatch = null;
    }
  }

  private matchRoute(fullPath: string): RouteMatch | null {
    const [pathname, ...searchParts] = fullPath.split('?');
    const search = searchParts.join('?');

    for (const route of this.routes) {
      const match = route.regex.exec(pathname);
      if (match) {
        const params: Record<string, string> = {};

        if (search) {
          const searchParams = new URLSearchParams(search);
          searchParams.forEach((value, key) => {
            params[key] = value;
          });
        }

        for (let i = 0; i < route.paramKeys.length; i++) {
          params[route.paramKeys[i]] = decodeURIComponent(match[i + 1]);
        }

        return {
          route: route.definition,
          params,
          path: fullPath,
        };
      }
    }
    return null;
  }

  private normalizePath(path: string): string {
    const [pathname, ...searchParts] = path.split('?');
    const search = searchParts.length > 0 ? '?' + searchParts.join('?') : '';
    const normalizedPathname = pathname.startsWith('/') ? pathname : '/' + pathname;
    return normalizedPathname + search;
  }
}
