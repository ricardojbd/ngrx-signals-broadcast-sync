import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectRouteData } from 'ngxtension/inject-route-data';

import { USER_STORE, UserStore } from '../state';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ title() }}</h2>
    <dl>
      <dt id="user-label">User</dt>
      <dd>
        <span aria-live="polite" data-testid="user-value">{{ store.user() }}</span>
        <input
          type="text"
          id="user-input"
          [formControl]="user"
          aria-labelledby="user-label"
          aria-describedby="user-error"
          data-testid="user-input"
          required
        />
        <button
          (click)="add()"
          [disabled]="user.invalid"
          aria-label="Update user information"
          data-testid="user-submit"
        >
          Update
        </button>
        @if (user.invalid) {
        <span id="user-error" class="error" role="alert">Please, enter a valid user.</span>
        }
      </dd>

      <dt id="admin-label">Is admin</dt>
      <dd>
        <span aria-live="polite" data-testid="isadmin-value">{{ store.isAdmin() }}</span>
        <button
          (click)="store.toggleIsAdmin()"
          aria-labelledby="admin-label"
          aria-label="Toggle admin status"
          data-testid="isadmin-submit"
        >
          Toggle
        </button>
      </dd>

      <dt id="error-event-label">Error Event</dt>
      <dd>
        <button
          (click)="dispatchErrorEvent()"
          aria-labelledby="error-event-label"
          aria-label="Dispatch error event"
          data-testid="errorevent-submit"
        >
          Dispatch Error
        </button>
      </dd>

      <dt id="broadcast-channel-label">BroadcastChannel Name</dt>
      <dd>
        <span aria-labelledby="broadcast-channel-label" aria-live="polite" data-testid="channel-value">{{
          store.getBroadcastChannel()?.name
        }}</span>
      </dd>
    </dl>
  `,
  styles: [
    'dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5em }',
    'dd:has(span:first-of-type:not(:empty))>span:first-of-type { margin-right: 0.5em }',
    '.error { margin-left: 0.5em }'
  ]
})
export class DisplayComponent {
  readonly title: Signal<string | null> = injectRouteData<string>('title');
  readonly store: UserStore = inject(USER_STORE);
  readonly user: FormControl<string | null> = new FormControl<string>('', Validators.required);

  readonly #broadcastChannel: BroadcastChannel | null = this.store.getBroadcastChannel();
  readonly #errorEvent: MessageEvent = new MessageEvent('messageerror', {
    data: { type: 'error', message: `${this.title} error` }
  });

  add() {
    if (this.user.value != null) {
      this.store.updateUser(this.user.value);
    }
  }

  dispatchErrorEvent() {
    this.#broadcastChannel?.dispatchEvent(this.#errorEvent);
  }
}
