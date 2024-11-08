import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NavigationComponent } from './components';

@Component({
  standalone: true,
  imports: [RouterModule, NavigationComponent],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Stores Playground</h1>
    <nav app-navigation></nav>
    <router-outlet />
  `
})
export class AppComponent {}
