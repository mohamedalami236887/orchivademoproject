import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticatedUser, LoginRequest, Role } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userState = signal<AuthenticatedUser | null>(null);

  readonly user = this.userState.asReadonly();
  readonly authenticated = computed(() => this.userState() !== null);

  initialize(): Observable<AuthenticatedUser | null> {
    return this.http.get<AuthenticatedUser>('/api/auth/me').pipe(
      tap((user) => this.userState.set(user)),
      catchError(() => {
        this.userState.set(null);
        return of(null);
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.get('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<AuthenticatedUser>('/api/auth/login', credentials)),
      tap((user) => this.userState.set(user))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.userState.set(null))
    );
  }

  hasRole(...roles: Role[]): boolean {
    return roles.some((role) => this.userState()?.roles.includes(role));
  }
}
