import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauth-wrapper">
      <div class="unauth-card glass">
        <div class="icon-circle">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2>Accès Refusé</h2>
        <p>Vous ne pouvez accéder qu'au tableau de bord de votre propre ministère.</p>
        <a routerLink="/login" class="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Retour à la connexion
        </a>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .unauth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .unauth-card {
      max-width: 440px;
      width: 100%;
      padding: 48px 40px;
      border-radius: var(--r-xl);
      text-align: center;
    }
    .icon-circle {
      width: 80px; height: 80px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239,68,68,.1);
      border: 1px solid rgba(239,68,68,.2);
      border-radius: 50%;
      color: #fca5a5;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      color: var(--text-secondary);
      font-size: .92rem;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--accent), #4f46e5);
      border-radius: var(--r-md);
      color: #fff !important;
      font-weight: 600;
      font-size: .9rem;
      text-decoration: none;
      transition: all .3s;
    }
    .back-btn:hover { box-shadow: 0 0 20px rgba(99,102,241,.35); transform: translateY(-1px); }
  `,
})
export class UnauthorizedComponent {}
