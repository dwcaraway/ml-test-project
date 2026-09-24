import { BaseView } from '../core/view';
import { NavbarComponent } from '../components/navbar';
import { HeroCardComponent } from '../components/hero-card';

export class DetailView extends BaseView {
  readonly name = 'DetailView';

  protected onMount(): void {
    if (!this.container) {
      return;
    }

    const itemId = this.params.id || 'unknown';
    const currentPath = `/detail/${itemId}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'detail-view';

    // 1. Navigation Bar Component
    const navbar = this.registerComponent(new NavbarComponent(currentPath));
    wrapper.appendChild(navbar.render());

    // 2. Hero Card Component
    const heroCard = this.registerComponent(
      new HeroCardComponent({
        title: `Resource Detail: ${itemId}`,
        description: `This view is rendered client-side and synchronized with URL path "${currentPath}".`,
        badge: 'Active Route',
      })
    );
    wrapper.appendChild(heroCard.render());

    // 3. Detail Inspector Body
    const card = document.createElement('div');
    card.className = 'detail-card';

    const paramDisplay = document.createElement('p');
    paramDisplay.id = 'detail-param-display';
    paramDisplay.innerHTML = `Viewing Resource ID: <strong id="current-id">${itemId}</strong>`;
    card.appendChild(paramDisplay);

    const backLink = document.createElement('a');
    backLink.href = '/';
    backLink.id = 'back-home-link';
    backLink.className = 'btn-back';
    backLink.textContent = 'Back to Home';
    card.appendChild(backLink);

    wrapper.appendChild(card);
    this.container.appendChild(wrapper);
  }
}
