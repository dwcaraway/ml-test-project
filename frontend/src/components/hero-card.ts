import { BaseComponent } from '../core/component';

export interface HeroCardProps {
  title: string;
  description: string;
  badge?: string;
}

export class HeroCardComponent extends BaseComponent {
  private props: HeroCardProps;

  constructor(props: HeroCardProps) {
    super();
    this.props = props;
  }

  render(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card hero-card';

    const header = document.createElement('h2');
    header.textContent = this.props.title;

    if (this.props.badge) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = ` [${this.props.badge}]`;
      header.appendChild(badge);
    }

    const desc = document.createElement('p');
    desc.textContent = this.props.description;

    card.appendChild(header);
    card.appendChild(desc);

    return card;
  }
}
