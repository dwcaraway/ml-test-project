import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/core/router';
import { HomeView } from '../src/views/home-view';
import { DetailView } from '../src/views/detail-view';
import { NotFoundView } from '../src/views/not-found-view';

describe('User Story 2 - View Navigation & History Synchronization', () => {
  let container: HTMLElement;
  let router: Router;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    router = new Router(container);
    router
      .register({
        path: '/',
        viewFactory: () => new HomeView(),
        title: 'Home',
      })
      .register({
        path: '/detail/:id',
        viewFactory: () => new DetailView(),
        title: 'Detail',
      })
      .setNotFoundView(() => new NotFoundView());

    window.history.pushState(null, '', '/');
    router.start();
  });

  afterEach(() => {
    router.stop();
    container.remove();
  });

  it('navigates to DetailView when an in-app link is clicked without page reload', () => {
    // Initial state: HomeView
    expect(container.querySelector('.home-view')).not.toBeNull();

    // Find and click link to /detail/item-1
    const link = container.querySelector('a[href="/detail/item-1"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();

    // Click event
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // Verify view transitioned to DetailView
    expect(container.querySelector('.home-view')).toBeNull();
    expect(container.querySelector('.detail-view')).not.toBeNull();
    expect(container.querySelector('#current-id')?.textContent).toBe('item-1');
    expect(window.location.pathname).toBe('/detail/item-1');
  });

  it('supports browser Back and Forward navigation via popstate', () => {
    // Navigate from / to /detail/demo-42
    router.navigate('/detail/demo-42');
    expect(container.querySelector('#current-id')?.textContent).toBe('demo-42');

    // Simulate browser Back button: pushState to / then dispatch popstate
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should re-render HomeView
    expect(container.querySelector('.home-view')).not.toBeNull();
    expect(container.querySelector('.detail-view')).toBeNull();

    // Simulate browser Forward button: pushState to /detail/demo-42 then dispatch popstate
    window.history.pushState(null, '', '/detail/demo-42');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should re-render DetailView
    expect(container.querySelector('.detail-view')).not.toBeNull();
    expect(container.querySelector('#current-id')?.textContent).toBe('demo-42');
  });

  it('navigates back to HomeView when clicking Back to Home in DetailView', () => {
    router.navigate('/detail/item-2');
    expect(container.querySelector('.detail-view')).not.toBeNull();

    const backLink = container.querySelector('#back-home-link') as HTMLAnchorElement;
    expect(backLink).not.toBeNull();

    backLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(container.querySelector('.home-view')).not.toBeNull();
    expect(window.location.pathname).toBe('/');
  });

  it('ignores external links and does not intercept them', () => {
    const externalLink = document.createElement('a');
    externalLink.href = 'https://example.com/external';
    container.appendChild(externalLink);

    const navigateSpy = vi.spyOn(router, 'navigate');
    externalLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
