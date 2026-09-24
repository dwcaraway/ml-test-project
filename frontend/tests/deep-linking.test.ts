import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../src/core/router';
import { HomeView } from '../src/views/home-view';
import { DetailView } from '../src/views/detail-view';
import { NotFoundView } from '../src/views/not-found-view';

describe('User Story 1 - Direct URL Navigation & Deep-Linking', () => {
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
  });

  afterEach(() => {
    router.stop();
    container.remove();
  });

  it('Scenario 1: loads HomeView when accessing root / directly', () => {
    window.history.pushState(null, '', '/');
    router.start();

    expect(container.querySelector('.home-view')).not.toBeNull();
    expect(container.textContent).toContain('SPA Views & Deep-Linking');
    expect(document.title).toBe('Home');
  });

  it('Scenario 2: loads DetailView with extracted parameters when deep-linking to /detail/:id', () => {
    window.history.pushState(null, '', '/detail/resource-xyz');
    router.start();

    expect(container.querySelector('.detail-view')).not.toBeNull();
    const paramDisplay = container.querySelector('#current-id');
    expect(paramDisplay?.textContent).toBe('resource-xyz');
    expect(router.getCurrentRoute()?.params.id).toBe('resource-xyz');
  });

  it('Scenario 3: renders NotFoundView when accessing an unrecognized deep link', () => {
    window.history.pushState(null, '', '/non-existent-path');
    router.start();

    expect(container.querySelector('.not-found-view')).not.toBeNull();
    expect(container.textContent).toContain('404 - View Not Found');
    const homeLink = container.querySelector('#not-found-home-link') as HTMLAnchorElement;
    expect(homeLink).not.toBeNull();
    expect(homeLink.getAttribute('href')).toBe('/');
  });
});
