import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <section class="brand-panel" aria-label="Orchiva introduction">
        <a class="brand" href="/" aria-label="Orchiva home"><span>O</span> Orchiva</a>
        <div>
          <p class="eyebrow">Enterprise workflow, made visible</p>
          <h1>Move important work forward with confidence.</h1>
          <p>Requests, approvals, documents and accountability in one focused workspace.</p>
        </div>
        <small>Secure local portfolio environment</small>
      </section>
      <section class="form-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="eyebrow">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p class="muted">Use one of the local development accounts documented in the README.</p>
          @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }
          <label for="username">Username</label>
          <input id="username" type="text" formControlName="username" autocomplete="username" />
          @if (form.controls.username.touched && form.controls.username.invalid) {
            <small class="field-error">Username is required.</small>
          }
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <small class="field-error">Password is required.</small>
          }
          <button class="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .login-page { min-height: 100vh; display: grid; grid-template-columns: minmax(340px, 1.05fr) minmax(380px, .95fr); }
    .brand-panel { padding: clamp(2rem, 6vw, 6rem); color: white; background: radial-gradient(circle at 15% 20%, #315b73 0, transparent 36%), linear-gradient(145deg, #122f3b, #071b25 70%); display:flex; flex-direction:column; justify-content:space-between; }
    .brand { color:white; text-decoration:none; font:700 1.35rem/1 system-ui; letter-spacing:-.02em; }
    .brand span { display:inline-grid; place-items:center; width:2rem; height:2rem; margin-right:.5rem; border-radius:.65rem; color:#09202a; background:#78e2c2; }
    .brand-panel h1 { max-width:12ch; margin:.6rem 0 1rem; font-size:clamp(2.5rem, 5vw, 5rem); line-height:.98; letter-spacing:-.055em; }
    .brand-panel p:not(.eyebrow) { max-width:36rem; color:#c7d8df; font-size:1.08rem; line-height:1.7; }
    .eyebrow { color:#55cda9; font-size:.72rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
    .form-panel .eyebrow { color:var(--brand-ink); }
    .form-panel { display:grid; place-items:center; padding:2rem; color:var(--ink); background:var(--bg); }
    form { width:min(100%, 28rem); padding:clamp(2rem, 4vw, 3.5rem); border:1px solid var(--line); border-radius:1.4rem; background:var(--surface); box-shadow:var(--shadow-1); }
    h2 { margin:.45rem 0 .6rem; color:var(--ink); font-size:2rem; letter-spacing:-.035em; }
    .muted { margin:0 0 2rem; color:var(--muted); line-height:1.6; }
    label { display:block; margin:1.1rem 0 .45rem; color:var(--ink-2); font-weight:700; font-size:.86rem; }
    input { box-sizing:border-box; width:100%; padding:.82rem .9rem; border:1px solid var(--line-strong); border-radius:.65rem; color:var(--ink); -webkit-text-fill-color:var(--ink); caret-color:var(--ink); background:var(--surface-2); font:inherit; }
    input::placeholder { color:var(--muted); opacity:1; }
    input:-webkit-autofill { -webkit-text-fill-color:var(--ink); -webkit-box-shadow:0 0 0 1000px var(--surface-2) inset; caret-color:var(--ink); }
    input:focus { outline:3px solid var(--focus); outline-offset:2px; border-color:var(--brand); }
    .primary { width:100%; margin-top:1.5rem; padding:.9rem; border:0; border-radius:.65rem; color:var(--primary-action-ink); background:var(--brand); font-weight:800; cursor:pointer; }
    .primary:disabled { opacity:.62; cursor:wait; }
    .alert { margin:1rem 0; padding:.8rem; border-radius:.6rem; color:var(--danger); background:var(--danger-soft); }
    .field-error { display:block; margin-top:.35rem; color:var(--danger); }
    @media (max-width: 760px) { .login-page { grid-template-columns:1fr; } .brand-panel { min-height:35vh; gap:3rem; } }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => this.error.set('Sign-in failed. Check your username and password.')
    });
  }
}
