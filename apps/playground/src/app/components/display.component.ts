import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectRouteData } from 'ngxtension/inject-route-data';

import { USER_STORE } from '../state';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ title() }}</h2>
    <p>
      <strong>User:</strong>
      <span data-testid="user-value">{{ store.user() }}</span>
      <input type="text" [formControl]="user" data-testid="user-input" />
      <button (click)="add()" [disabled]="user.invalid" data-testid="user-submit">Update</button>
    </p>
    <p>
      <strong>Is admin:</strong>
      <span data-testid="isadmin-value">{{ store.isAdmin() }}</span>
      <button (click)="store.toggleIsAdmin()" data-testid="isadmin-submit">Toggle</button>
    </p>
    <p>
      <strong>BroadcastChannel:</strong>
      <span data-testid="channel-value">{{ store.getBroadcastChannel()?.name }}</span>
    </p>
  `,
  styles: ['p>* { margin-right: 5px; }']
})
export class DisplayComponent {
  readonly title = injectRouteData<string>('title');
  readonly store = inject(USER_STORE);
  readonly user = new FormControl<string>('', Validators.required);

  add() {
    const user = this.user.value;
    if (user != null) {
      this.store.updateUser(user);
    }
  }
}
