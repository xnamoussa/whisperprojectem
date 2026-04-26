import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  ministry: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:8000/api';
  readonly user = signal<CurrentUser | null>(null);
  readonly loading = signal(false);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(username: string, password: string) {
    this.loading.set(true);
    return this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login/`, { username, password })
      .pipe(
        tap({
          next: (tokens) => {
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
          },
          complete: () => this.loading.set(false),
          error: () => this.loading.set(false),
        }),
      );
  }

  fetchCurrentUser() {
    return this.http
      .get<CurrentUser>(`${this.apiBase}/auth/me/`)
      .pipe(tap((user) => this.user.set(user)));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem('access_token');
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }
}
