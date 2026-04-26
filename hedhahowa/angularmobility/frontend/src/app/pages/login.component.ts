import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Floating Orbs Background -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div class="login-wrapper">
      <!-- Left Branding Panel -->
      <div class="branding fade-in">
        <div class="brand-content">
          <!-- République Française Logo -->
          <div class="rf-logo-login">
            <div class="rf-flag-login">
              <div class="rf-blue-l"></div>
              <div class="rf-white-l"></div>
              <div class="rf-red-l"></div>
            </div>
            <div class="rf-text-login">
              <span>RÉPUBLIQUE</span>
              <span>FRANÇAISE</span>
            </div>
          </div>
          <div class="rf-line">
            <div class="rf-line-blue"></div>
            <div class="rf-line-red"></div>
          </div>
          <h1>Urbain<span>Mobility</span></h1>
          <p class="tagline">Plateforme d'Intelligence Décisionnelle<br>& Machine Learning pour la Mobilité Urbaine</p>
          <div class="features">
            <div class="feature-item">
              <div class="feature-dot"></div>
              <span>Classification & Régression ML</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot dot-cyan"></div>
              <span>Deep Learning (CNN, LSTM, Transformer)</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot dot-pink"></div>
              <span>Prédictions Instantanées par Ministère</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot dot-green"></div>
              <span>Tableaux de Bord Power BI</span>
            </div>
          </div>
        </div>
        <p class="copyright">© 2026 Urbain Mobility Project — République Française — Tous droits réservés</p>
      </div>

      <!-- Right Login Panel -->
      <div class="login-panel fade-in fade-in-d2">
        <div class="login-card glass">
          <div class="card-header">
            <h2>Connexion Ministérielle</h2>
            <p>Accédez à votre tableau de bord personnalisé</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="login-username">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Nom d'utilisateur
              </label>
              <input
                id="login-username"
                type="text"
                formControlName="username"
                placeholder="ministre.transport"
                autocomplete="username"
              />
            </div>

            <div class="field">
              <label for="login-password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              class="submit-btn"
              [disabled]="form.invalid || auth.loading()"
              [class.loading]="auth.loading()"
            >
              <span class="btn-text" *ngIf="!auth.loading()">
                Se connecter
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
              <span class="spinner" *ngIf="auth.loading()"></span>
            </button>
          </form>

          <div class="error-msg" *ngIf="error()" @fadeSlide>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            {{ error() }}
          </div>

          <div class="ministries-hint">
            <p>Ministères disponibles :</p>
            <div class="ministry-tags">
              <span class="tag">Transport</span>
              <span class="tag">Intérieur</span>
              <span class="tag">Aménagement</span>
              <span class="tag">Transition Éco.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }

    /* ── Background Orbs ── */
    .bg-orbs { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .4;
    }
    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(99,102,241,.5), transparent 70%);
      top: -10%; left: -5%;
      animation: orbFloat1 18s ease-in-out infinite alternate;
    }
    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(6,182,212,.4), transparent 70%);
      bottom: -5%; right: 10%;
      animation: orbFloat2 15s ease-in-out infinite alternate;
    }
    .orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(244,114,182,.3), transparent 70%);
      top: 40%; left: 45%;
      animation: orbFloat3 20s ease-in-out infinite alternate;
    }
    @keyframes orbFloat1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(40px,30px) scale(1.15)} }
    @keyframes orbFloat2 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-30px,-20px) scale(1.1)} }
    @keyframes orbFloat3 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(20px,-40px) scale(1.2)} }

    /* ── Wrapper ── */
    .login-wrapper {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }

    /* ── Branding ── */
    .branding {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 56px;
    }
    .brand-content { max-width: 440px; }
    /* ── République Française Logo ── */
    .rf-logo-login {
      display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;
    }
    .rf-flag-login {
      display: flex; width: 36px; height: 48px; border-radius: 2px; overflow: hidden; flex-shrink: 0;
    }
    .rf-blue-l  { flex: 1; background: #000091; }
    .rf-white-l { flex: 1; background: #fff; }
    .rf-red-l   { flex: 1; background: #e1000f; }
    .rf-text-login {
      display: flex; flex-direction: column; gap: 0;
      span {
        font-size: 0.8rem; font-weight: 800; letter-spacing: 0.5px; line-height: 1.4;
        color: #000091; text-shadow: 0 0 20px rgba(0,0,145,.4);
      }
    }
    .rf-line {
      display: flex; gap: 0; height: 3px; width: 100px; margin-bottom: 24px; border-radius: 2px; overflow: hidden;
    }
    .rf-line-blue { flex: 1; background: #000091; }
    .rf-line-red  { flex: 1; background: #e1000f; }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    h1 span {
      background: linear-gradient(135deg, var(--accent-light), var(--accent-2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      color: var(--text-secondary);
      font-size: .95rem;
      line-height: 1.6;
      margin-bottom: 36px;
    }
    .features { display: flex; flex-direction: column; gap: 14px; }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: .88rem;
      color: var(--text-secondary);
    }
    .feature-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent-glow);
      flex-shrink: 0;
    }
    .dot-cyan  { background: var(--accent-2); box-shadow: 0 0 8px rgba(6,182,212,.4); }
    .dot-pink  { background: var(--accent-3); box-shadow: 0 0 8px rgba(244,114,182,.4); }
    .dot-green { background: var(--accent-4); box-shadow: 0 0 8px rgba(52,211,153,.4); }
    .copyright {
      margin-top: auto;
      padding-top: 32px;
      color: var(--text-muted);
      font-size: .78rem;
    }

    /* ── Login Panel ── */
    .login-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 40px 36px;
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-lg);
    }
    .card-header { margin-bottom: 32px; }
    .card-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .card-header p {
      color: var(--text-secondary);
      font-size: .88rem;
    }

    /* ── Form ── */
    form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: .85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    label svg { color: var(--text-muted); }
    input {
      width: 100%;
      padding: 12px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      color: var(--text-primary);
      font-family: var(--font);
      font-size: .92rem;
      transition: all .25s var(--ease);
    }
    input::placeholder { color: var(--text-muted); }
    input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
      outline: none;
    }

    /* ── Submit Button ── */
    .submit-btn {
      position: relative;
      width: 100%;
      padding: 14px;
      margin-top: 4px;
      border: none;
      border-radius: var(--r-md);
      background: linear-gradient(135deg, var(--accent), #4f46e5);
      color: #fff;
      font-family: var(--font);
      font-size: .95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .3s var(--ease);
      overflow: hidden;
    }
    .submit-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,.15) 50%, transparent 60%);
      transform: translateX(-100%);
      transition: transform .6s var(--ease);
    }
    .submit-btn:hover::before { transform: translateX(100%); }
    .submit-btn:hover { box-shadow: var(--shadow-glow); transform: translateY(-1px); }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn:disabled {
      opacity: .5;
      cursor: not-allowed;
      transform: none;
    }
    .btn-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .spinner {
      display: inline-block;
      width: 22px; height: 22px;
      border: 3px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error ── */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(239,68,68,.12);
      border: 1px solid rgba(239,68,68,.25);
      border-radius: var(--r-md);
      color: #fca5a5;
      font-size: .88rem;
    }

    /* ── Ministry Hints ── */
    .ministries-hint {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
    .ministries-hint p {
      font-size: .78rem;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    .ministry-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      padding: 4px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-full);
      font-size: .75rem;
      color: var(--text-secondary);
      transition: all .2s var(--ease);
    }
    .tag:hover {
      border-color: var(--accent);
      color: var(--accent-light);
    }

    /* ── Responsive ── */
    @media (max-width: 880px) {
      .login-wrapper { grid-template-columns: 1fr; }
      .branding { display: none; }
      .login-panel { padding: 24px 16px; }
    }
  `,
})
export class LoginComponent {
  readonly error = signal('');
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();
    this.error.set('');
    this.auth.login(username ?? '', password ?? '').subscribe({
      next: () => {
        this.auth.fetchCurrentUser().subscribe({
          next: (user) => this.router.navigate(['/dashboard', user.ministry]),
        });
      },
      error: () => this.error.set('Identifiants invalides. Veuillez réessayer.'),
    });
  }
}
