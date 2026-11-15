import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Role } from '../core/auth.models';
import { IconComponent } from './icon.component';
import { UiService } from './ui.service';

interface NavItem { label: string; icon: string; path: string; roles?: Role[]; }

@Component({
  selector: 'app-shell-v2',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="workspace" [class.nav-open]="navOpen()" [class.nav-collapsed]="collapsed()">
      <aside class="sidebar" aria-label="Workspace navigation">
        <div class="brand-row">
          <a class="wordmark" routerLink="/dashboard" aria-label="Orchiva dashboard"><span>O</span><strong>Orchiva</strong></a>
          <button class="shell-button collapse-button" type="button" [attr.aria-label]="collapsed() ? 'Expand navigation' : 'Collapse navigation'" (click)="toggleCollapsed()">
            <app-icon [name]="collapsed() ? 'expand' : 'collapse'" />
          </button>
        </div>
        <div class="workspace-label">@if(router.url.startsWith('/requests')){<span>{{ auth.user()?.departmentName || 'Orchiva workspace' }}</span><small>Enterprise workspace</small>}@else{<span>Workspace</span><small>Enterprise operations</small>}</div>
        <nav aria-label="Primary navigation">
          @for (item of visibleNavigation(); track item.path) {
            @if(item.path==='/admin/workflows'){<span class="nav-group">Administration</span>}
            <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{exact:item.path==='/dashboard'}" (click)="navOpen.set(false)" [attr.title]="collapsed() ? item.label : null">
              <app-icon [name]="item.icon" /><span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-foot">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <div class="identity"><strong>{{ auth.user()?.displayName }}</strong><small>{{ roleLabel() }}</small></div>
          <button type="button" class="shell-button" aria-label="Sign out" title="Sign out" (click)="logout()"><app-icon name="logout" /></button>
        </div>
      </aside>
      <button class="scrim" type="button" aria-label="Close navigation" (click)="navOpen.set(false)"></button>
      <section class="content-frame">
        <header class="topbar">
          <button class="shell-button menu-button" type="button" aria-label="Open navigation" (click)="navOpen.set(true)"><app-icon name="menu" /></button>
          <div class="context"><p>Enterprise workspace</p><strong>{{ auth.user()?.departmentName || 'Cross-functional operations' }}</strong></div>
          @if(router.url.startsWith('/requests')){<a class="quick-records" href="#request-search" (click)="focusRequestSearch($event)"><app-icon name="search"/> Search in requests…</a>}@else{<a class="quick-records" routerLink="/requests"><app-icon name="search"/> Find requests</a>}
          <div class="top-actions">
            <button class="shell-button" type="button" [attr.aria-label]="theme()==='dark' ? 'Use light theme' : 'Use dark theme'" (click)="toggleTheme()"><app-icon [name]="theme()==='dark' ? 'sun' : 'moon'" /></button>
            <a routerLink="/notifications" class="shell-button" aria-label="Open notifications"><app-icon name="bell" /><span class="notification-dot" aria-hidden="true"></span></a>
          </div>
        </header>
        <main id="main-content" tabindex="-1"><router-outlet /></main>
      </section>
    </div>

    @if (ui.confirmation(); as confirmation) {
      <div class="dialog-overlay" (click)="ui.resolveConfirmation(false)">
        <section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" (click)="$event.stopPropagation()">
          <p class="eyebrow">Please confirm</p><h2 id="confirm-title">{{ confirmation.title }}</h2><p id="confirm-message">{{ confirmation.message }}</p>
          <div class="dialog-actions"><button class="button" type="button" (click)="ui.resolveConfirmation(false)">Keep working</button><button class="button" [class.primary]="confirmation.tone!=='danger'" [class.danger]="confirmation.tone==='danger'" type="button" (click)="ui.resolveConfirmation(true)">{{ confirmation.confirmLabel }}</button></div>
        </section>
      </div>
    }
    @if (ui.toast(); as toast) { <div class="toast" [class]="'toast '+toast.tone" role="status" aria-live="polite">{{ toast.message }}</div> }
  `,
  styles: [`
    :host{display:block;min-height:100vh}.workspace{min-height:100vh;background:var(--bg)}.sidebar{position:fixed;inset:0 auto 0 0;z-index:20;width:var(--sidebar);box-sizing:border-box;padding:1rem .8rem;display:flex;flex-direction:column;color:#d7e4e6;background:#0a2630;border-right:1px solid #183d47;transition:width .2s ease,transform .2s ease}.brand-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.1rem .35rem 1.15rem}.wordmark{display:flex;align-items:center;gap:.68rem;min-width:0;color:#fff;text-decoration:none;font-size:1.18rem;letter-spacing:-.025em}.wordmark span{display:grid;place-items:center;width:2rem;height:2rem;flex:0 0 auto;border-radius:.62rem;color:#082a23;background:#6ed9b7;font-weight:900}.workspace-label{display:grid;gap:.08rem;padding:.65rem .72rem 1rem;border-top:1px solid #20424c}.workspace-label span{color:#eff9f7;font-size:.78rem;font-weight:800}.workspace-label small{color:#77969c;font-size:.72rem}.sidebar nav{display:grid;gap:.18rem}.sidebar nav a{display:flex;align-items:center;gap:.78rem;min-height:2.65rem;padding:.62rem .72rem;border-radius:.62rem;color:#adc2c7;text-decoration:none;font-weight:650;font-size:.9rem;transition:color .15s ease,background .15s ease}.sidebar nav a:hover,.sidebar nav a.active{color:#fff;background:#153c47}.sidebar nav a.active{box-shadow:inset 3px 0 #64d6b2}.sidebar nav app-icon{color:#77d7ba}.sidebar-foot{margin-top:auto;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.62rem;padding:1rem .35rem 0;border-top:1px solid #24434d}.avatar{display:grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:50%;color:#083128;background:#8fe3c8;font-weight:900;font-size:.72rem}.identity{min-width:0}.identity strong,.identity small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.identity strong{color:#fff;font-size:.84rem}.identity small{margin-top:.1rem;color:#89a4aa;font-size:.72rem}.shell-button{position:relative;display:grid;place-items:center;width:2.55rem;height:2.55rem;padding:0;border:1px solid transparent;border-radius:.7rem;color:inherit;background:transparent;text-decoration:none;cursor:pointer}.shell-button:hover{border-color:var(--line);background:var(--surface-2)}.sidebar .shell-button:hover{border-color:#31505a;background:#153c47}.content-frame{min-height:100vh;margin-left:var(--sidebar);transition:margin-left .2s ease}.topbar{position:sticky;top:0;z-index:10;height:4.25rem;padding:0 clamp(1rem,3vw,2.2rem);display:flex;align-items:center;gap:1rem;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(12px)}.context p{margin:0;color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.12em}.context strong{display:block;margin-top:.08rem;color:var(--ink);font-size:.9rem}.top-actions{display:flex;gap:.25rem;margin-left:auto;color:var(--ink-2)}.notification-dot{position:absolute;top:.55rem;right:.5rem;width:.42rem;height:.42rem;border:2px solid var(--surface);border-radius:50%;background:var(--danger)}.menu-button{display:none}.scrim{display:none}.skip-link{position:fixed;z-index:1200;top:.4rem;left:.4rem;transform:translateY(-150%);padding:.65rem .8rem;border-radius:.5rem;color:#fff;background:#062630}.skip-link:focus{transform:none}main{padding:clamp(1.25rem,3vw,2.5rem);outline:none}.nav-collapsed .sidebar{width:4.75rem}.nav-collapsed .content-frame{margin-left:4.75rem}.nav-collapsed .wordmark strong,.nav-collapsed .workspace-label,.nav-collapsed .sidebar nav a span,.nav-collapsed .identity,.nav-collapsed .collapse-button{display:none}.nav-collapsed .brand-row{justify-content:center}.nav-collapsed .sidebar nav a{justify-content:center}.nav-collapsed .sidebar-foot{grid-template-columns:1fr;justify-items:center}.nav-collapsed .sidebar-foot .shell-button{display:none}
    @media(max-width:900px){.sidebar,.nav-collapsed .sidebar{width:min(18rem,86vw);transform:translateX(-105%)}.nav-open .sidebar{transform:none}.content-frame,.nav-collapsed .content-frame{margin-left:0}.menu-button{display:grid}.collapse-button{display:none!important}.nav-collapsed .wordmark strong,.nav-collapsed .workspace-label,.nav-collapsed .sidebar nav a span,.nav-collapsed .identity{display:block}.nav-collapsed .sidebar nav a{justify-content:flex-start}.nav-collapsed .sidebar-foot{grid-template-columns:auto 1fr auto;justify-items:stretch}.nav-collapsed .sidebar-foot .shell-button{display:grid}.nav-open .scrim{display:block;position:fixed;z-index:15;inset:0;border:0;background:var(--scrim)}}
  `]
})
export class AppShellV2Component {
  protected readonly auth = inject(AuthService); protected readonly ui = inject(UiService);
  protected readonly router = inject(Router); private readonly document = inject(DOCUMENT); private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly navOpen = signal(false); readonly collapsed = signal(false); readonly theme = signal<'light'|'dark'>('light');
  private readonly nav: NavItem[] = [
    {label:'Dashboard',icon:'dashboard',path:'/dashboard'},{label:'Requests',icon:'requests',path:'/requests'},
    {label:'Approval inbox',icon:'approvals',path:'/approvals',roles:['MANAGER','FINANCE','ADMIN']},{label:'Documents',icon:'documents',path:'/documents'},
    {label:'Notifications',icon:'bell',path:'/notifications'},
    {label:'Workflows',icon:'workflows',path:'/admin/workflows',roles:['ADMIN']},{label:'Users',icon:'users',path:'/admin/users',roles:['ADMIN']},
    {label:'Departments',icon:'departments',path:'/admin/departments',roles:['ADMIN']},{label:'Audit history',icon:'audit',path:'/admin/audit',roles:['ADMIN']}
  ];
  constructor(){if(this.browser){const stored=localStorage.getItem('orchiva-theme');const dark=stored==='dark'||(!stored&&matchMedia('(prefers-color-scheme: dark)').matches);this.theme.set(dark?'dark':'light');this.document.documentElement.dataset['theme']=this.theme();this.collapsed.set(localStorage.getItem('orchiva-nav')==='collapsed')}}
  visibleNavigation(){return this.nav.filter(item=>!item.roles||this.auth.hasRole(...item.roles))} initials(){return (this.auth.user()?.displayName??'O').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()} roleLabel(){return this.auth.user()?.roles.map(role=>role[0]+role.slice(1).toLowerCase()).join(' · ')??'Member'}
  toggleTheme(){const next=this.theme()==='dark'?'light':'dark';this.theme.set(next);this.document.documentElement.dataset['theme']=next;if(this.browser)localStorage.setItem('orchiva-theme',next)}
  toggleCollapsed(){this.collapsed.update(value=>!value);if(this.browser)localStorage.setItem('orchiva-nav',this.collapsed()?'collapsed':'expanded')}
  focusRequestSearch(event:Event){event.preventDefault();this.document.getElementById('request-search')?.focus()}
  logout(){this.auth.logout().subscribe({next:()=>void this.router.navigateByUrl('/login')})}
  @HostListener('document:keydown.escape') onEscape(){this.navOpen.set(false);if(this.ui.confirmation())this.ui.resolveConfirmation(false)}
}
