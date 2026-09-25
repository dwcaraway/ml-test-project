import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/core/router';
import { BaseView } from '../src/core/view';

class MockFilesView extends BaseView {
  readonly name = 'MockFilesView';
  mountedParams: Record<string, string> = {};

  protected onMount(): void {
    this.mountedParams = { ...this.params };
    if (this.container) {
      const el = document.createElement('div');
      el.id = 'files-content';
      el.textContent = `Path: ${this.params.path ?? 'root'}`;
      this.container.appendChild(el);
    }
  }
}

describe('Router Query Parameter & History Synchronization', () => {
  let container: HTMLElement;
  let router: Router;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    window.history.pushState(null, '', '/');
    router = new Router(container);
  });

  afterEach(() => {
    router.stop();
    container.remove();
    vi.restoreAllMocks();
  });

  it('matches route when URL contains query parameters and extracts query params', () => {
    let filesView: MockFilesView | null = null;

    router.register({
      path: '/files',
      viewFactory: () => {
        filesView = new MockFilesView();
        return filesView;
      },
      title: 'Files View',
    });

    router.start();
    router.navigate('/files?path=docs');

    expect(router.getCurrentRoute()?.route.path).toBe('/files');
    expect(router.getCurrentRoute()?.params.path).toBe('docs');
    const instance = filesView as MockFilesView | null;
    expect(instance?.mountedParams.path).toBe('docs');
    expect(container.innerHTML).toContain('Path: docs');
    expect(window.location.search).toBe('?path=docs');
  });

  it('preserves query strings on pushState and replaceState navigation', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    router.register({
      path: '/files',
      viewFactory: () => new MockFilesView(),
    });

    router.start();
    router.navigate('/files?path=sub%2Ffolder');
    expect(pushSpy).toHaveBeenCalledWith(null, '', '/files?path=sub%2Ffolder');

    router.navigate('/files?path=other', { replace: true });
    expect(replaceSpy).toHaveBeenCalledWith(null, '', '/files?path=other');
  });

  it('intercepts internal link clicks and preserves query parameters', () => {
    router.register({
      path: '/files',
      viewFactory: () => new MockFilesView(),
    });

    router.start();

    const link = document.createElement('a');
    link.href = '/files?path=reports';
    link.textContent = 'Reports';
    container.appendChild(link);

    link.click();

    expect(router.getCurrentRoute()?.params.path).toBe('reports');
    expect(container.innerHTML).toContain('Path: reports');
    expect(window.location.search).toBe('?path=reports');
  });

  it('synchronizes route on popstate with query parameters', () => {
    let filesView: MockFilesView | null = null;

    router.register({
      path: '/files',
      viewFactory: () => {
        filesView = new MockFilesView();
        return filesView;
      },
    });

    router.start();
    router.navigate('/files?path=initial');

    window.history.pushState(null, '', '/files?path=popped');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(router.getCurrentRoute()?.params.path).toBe('popped');
    const instance = filesView as MockFilesView | null;
    expect(instance?.mountedParams.path).toBe('popped');
  });
});
