import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SimpleStore } from './simple.store';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [SimpleStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>
      User: {{ store.user() }}
      <input type="text" [formControl]="user" />
      <button (click)="add()" [disabled]="user.invalid">Update</button>
    </p>
    <p>
      Is admin: {{ store.isAdmin() }}
      <button (click)="store.toggleIsAdmin()">Toggle</button>
    </p>
    <p>BroadcastChannel: {{ store.getBroadcastChannel()?.name }}</p>
  `,
})
export class SimpleStoreComponent {
  readonly store = inject(SimpleStore);
  readonly user = new FormControl<string>('', Validators.required);

  add() {
    const user = this.user.value;
    if (user != null) {
      this.store.updateUser(user);
    }
  }
}
