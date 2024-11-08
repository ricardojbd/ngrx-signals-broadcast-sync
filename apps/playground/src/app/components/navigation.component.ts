import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, Route, RouterModule } from '@angular/router';

type RouteLink = { path: string; title: string; id: string; ariaLabel: string };
type RouteLinkRoute = Route & { path: string; data: { title: string } };

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'nav[app-navigation]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="visually-hidden">Main Menu</h2>
    <ul>
      @for (routeLink of routeLinks; track routeLink.path) {
      <li>
        <a
          [routerLink]="routeLink.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          [attr.aria-current]="isRouteActive.isActive ? 'page' : null"
          [attr.aria-label]="routeLink.ariaLabel"
          [attr.data-testid]="routeLink.id"
          #isRouteActive="routerLinkActive"
          >{{ routeLink.title }}</a
        >
      </li>
      }
    </ul>
  `,
  styles: [
    'ul { list-style: none; padding: 0; display: flex; gap: 0.5em }',
    'a {margin: 0 0.5em; text-decoration: none }',
    'a.active { font-weight: bold }'
  ],
  host: {
    role: 'navigation'
  }
})
export class NavigationComponent {
  readonly #router: Router = inject(Router);
  readonly routeLinks: RouteLink[] = this.#getRouteLinks();

  #getRouteLinks(): RouteLink[] {
    const routeLinks: RouteLink[] = this.#router.config.filter(isRouteLinkRoute).map(createRouteLink);
    routeLinks.unshift({ path: '/', title: 'Home', id: `main-menu-link-home`, ariaLabel: `Navigate to Home` });

    return routeLinks;
  }
}

function isRouteLinkRoute(route: Route): route is RouteLinkRoute {
  return typeof route.path === 'string' && route.data != null && typeof route.data['title'] === 'string';
}

function createRouteLink(route: RouteLinkRoute): RouteLink {
  return {
    path: route.path,
    title: route.data.title,
    id: `main-menu-link-${route.path.replace(/\//g, '-')}`,
    ariaLabel: `Navigate to ${route.data.title}`
  };
}
