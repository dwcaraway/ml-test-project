import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/core/router';
import { BaseView } from '../src/core/view';

class MockHomeView extends BaseView {
  readonly name = 'MockHomeView';
  mountedParams: Record<string, string> = {};

  protected onMount(): void {
    this.mountedParams = this.params;
    if (this.container) {
      const el = document.createElement('h1');
      el.textContent = 'Home Page';
      this.container.appendChild(el);
    }
  }
}

class MockDetailView extends BaseView {
  readonly name = 'MockDetailView';
  mountedParams: Record<string, string> = {};

  protected onMount(): void {
    this.mountedParams = this.params;
    if (this.container) {
      const el = document.createElement('div');
      el.id = 'detail-content';
      el.textContent = `Detail Item: ${this.params.id}`;
      this.container.appendChild(el);
    }
  }
}

class MockNotFoundView extends BaseView {
  readonly name = 'MockNotFoundView';

  protected onMount(): void {
    if (this.container) {
      const el = document.createElement('p');
      el.textContent = 'Custom 404 Page';
      this.container.appendChild(el);
    }
  }
}

describe('Router', () => {
  let container: HTMLElement;
  let router: Router;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    // Reset window.location pathname
    window.history.pushState(null, '', '/');
    router = new Router(container);
  });

  afterEach(() => {
    router.stop();
    container.remove();
    vi.restoreAllMocks();
  });

  it('registers and matches static routes', () => {
    router.register({
      path: '/',
      viewFactory: () => new MockHomeView(),
      title: 'Home',
    });

    router.start();

    expect(container.innerHTML).toContain('Home Page');
    expect(router.getCurrentRoute()?.route.path).toBe('/');
    expect(document.title).toBe('Home');
  });

  it('extracts dynamic route parameters', () => {
    let detailViewInstance: MockDetailView | null = null;

    router
      .register({
        path: '/',
        viewFactory: () => new MockHomeView(),
      })
      .register({
        path: '/detail/:id',
        viewFactory: () => {
          detailViewInstance = new MockDetailView();
          return detailViewInstance;
        },
        title: 'Detail View',
      });

    router.start();
    router.navigate('/detail/test-item-99');

    expect(container.innerHTML).toContain('Detail Item: test-item-99');
    expect(router.getCurrentRoute()?.params.id).toBe('test-item-99');
    const instance = detailViewInstance as MockDetailView | null;
    expect(instance?.mountedParams.id).toBe('test-item-99');
    expect(document.title).toBe('Detail View');
  });

  it('renders custom not-found view when route is unrecognized', () => {
    router
      .register({
        path: '/',
        viewFactory: () => new MockHomeView(),
      })
      .setNotFoundView(() => new MockNotFoundView());

    router.start();
    router.navigate('/unknown-route/123');

    expect(container.innerHTML).toContain('Custom 404 Page');
    expect(document.title).toBe('Not Found');
  });

  it('renders default 404 if no not-found view registered', () => {
    router.register({
      path: '/',
      viewFactory: () => new MockHomeView(),
    });

    router.start();
    router.navigate('/missing');

    expect(container.innerHTML).toContain('404 - Not Found');
  });

  it('handles history replace navigation', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    router.register({
      path: '/replace-target',
      viewFactory: () => new MockHomeView(),
    });

    router.start();
    router.navigate('/replace-target', { replace: true });

    expect(replaceSpy).toHaveBeenCalledWith(null, '', '/replace-target');
  });

  it('unmounts current view when stopped', () => {
    router.register({
      path: '/',
      viewFactory: () => new MockHomeView(),
    });

    router.start();
    expect(container.innerHTML).toContain('Home Page');

    router.stop();
    expect(container.innerHTML).toBe('');
    expect(router.getCurrentRoute()).toBeNull();
  });

  it('does not intercept click on links with download attribute or /api routes', () => {
    router.register({
      path: '/',
      viewFactory: () => new MockHomeView(),
    });

    router.start();

    // 1. Link with download attribute
    const downloadLink = document.createElement('a');
    downloadLink.href = '/api/download?path=file.txt';
    downloadLink.setAttribute('download', 'file.txt');
    container.appendChild(downloadLink);

    const downloadEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    downloadLink.dispatchEvent(downloadEvent);

    expect(downloadEvent.defaultPrevented).toBe(false);
    expect(router.getCurrentRoute()?.route.path).toBe('/');

    // 2. Link targeting /api without download attribute
    const apiLink = document.createElement('a');
    apiLink.href = '/api/browse';
    container.appendChild(apiLink);

    const apiEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    apiLink.dispatchEvent(apiEvent);

    expect(apiEvent.defaultPrevented).toBe(false);
    expect(router.getCurrentRoute()?.route.path).toBe('/');
  });
});
