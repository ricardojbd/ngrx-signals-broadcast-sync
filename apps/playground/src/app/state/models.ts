import { InjectionToken, Signal } from '@angular/core';

export type UserState = { user: string | null; isAdmin: boolean | null };

export type UserStore = {
  user: Signal<string | null>;
  isAdmin: Signal<boolean | null>;
  updateUser(user: string): void;
  toggleIsAdmin(): void;
  getBroadcastChannel(): BroadcastChannel | null;
};

export const USER_STORE = new InjectionToken<UserStore>('USER_STORE');
