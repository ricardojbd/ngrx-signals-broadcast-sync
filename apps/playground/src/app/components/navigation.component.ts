import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, Route, RouterModule } from '@angular/router';

type RouteLink = { path: string; title: string };
type RouteLinkRoute = Route & { path: string; data: { title: string } };

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav>
      <a routerLink="/">Home</a>
      @for (route of routes; track route.path) {
      <a [routerLink]="route.path">{{ route.title }}</a>
      }
    </nav>
  `,
  styles: ['nav>a { margin: 0 5px; }']
})
export class NavigationComponent {
  readonly #router = inject(Router);
  readonly routes: RouteLink[] = this.#getRoutesWithTitles();

  #getRoutesWithTitles(): RouteLink[] {
    return this.#router.config
      .filter((route: Route): route is RouteLinkRoute => {
        return typeof route.path === 'string' && route.data != null && typeof route.data['title'] === 'string';
      })
      .map((route) => ({
        path: route.path,
        title: route.data.title
      }));
  }
}
