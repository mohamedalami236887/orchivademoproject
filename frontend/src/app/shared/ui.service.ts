import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions { title: string; message: string; confirmLabel: string; tone?: 'primary' | 'danger'; }
interface ConfirmState extends ConfirmOptions { resolve: (accepted: boolean) => void; }

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly confirmation = signal<ConfirmState | null>(null);
  readonly toast = signal<{ message: string; tone: 'success' | 'error' } | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;
  confirm(options: ConfirmOptions): Promise<boolean> { return new Promise(resolve => this.confirmation.set({ ...options, resolve })); }
  resolveConfirmation(accepted: boolean): void { const current = this.confirmation(); if (!current) return; this.confirmation.set(null); current.resolve(accepted); }
  notify(message: string, tone: 'success' | 'error' = 'success'): void { if (this.toastTimer) clearTimeout(this.toastTimer); this.toast.set({ message, tone }); this.toastTimer = setTimeout(() => this.toast.set(null), 4500); }
}
