import { Router } from './core/router';
import { HomeView } from './views/home-view';
import { DetailView } from './views/detail-view';
import { NotFoundView } from './views/not-found-view';

export function initializeApp(containerId = 'app'): Router | null {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element #${containerId} not found.`);
    return null;
  }

  const router = new Router(container);
  router
    .register({
      path: '/',
      viewFactory: () => new HomeView(),
      title: 'Home - SPA Explorer',
    })
    .register({
      path: '/detail/:id',
      viewFactory: () => new DetailView(),
      title: 'Detail - SPA Explorer',
    })
    .setNotFoundView(() => new NotFoundView());

  router.start();
  return router;
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
}
