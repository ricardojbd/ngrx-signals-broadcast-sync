import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <h1>Stores Playground</h1>
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/simple-store">Simple Store</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: ['nav>a { margin: 0 5px; }'],
})
export class AppComponent {}
