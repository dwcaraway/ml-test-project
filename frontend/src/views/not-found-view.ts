import { BaseView } from '../core/view';

export class NotFoundView extends BaseView {
  readonly name = 'NotFoundView';

  protected onMount(): void {
    if (!this.container) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'not-found-view';

    const heading = document.createElement('h1');
    heading.textContent = '404 - View Not Found';

    const message = document.createElement('p');
    message.textContent = 'The requested URL path does not correspond to an existing view.';

    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.id = 'not-found-home-link';
    homeLink.className = 'btn-home';
    homeLink.textContent = 'Return to Home';

    wrapper.appendChild(heading);
    wrapper.appendChild(message);
    wrapper.appendChild(homeLink);

    this.container.appendChild(wrapper);
  }
}
