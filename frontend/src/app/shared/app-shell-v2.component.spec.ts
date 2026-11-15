import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { UiService } from './ui.service';
import { AppShellV2Component } from './app-shell-v2.component';

@Component({template:''}) class EmptyRouteComponent {}
@Component({imports:[RouterOutlet],template:'<router-outlet />'}) class HostComponent {}

describe('AppShellV2Component navigation', () => {
  const user = signal({displayName:'Avery Morgan',departmentName:'Information Technology',roles:['ADMIN','EMPLOYEE']});
  beforeEach(async () => {
    localStorage.setItem('orchiva-theme','light');
    user.set({displayName:'Avery Morgan',departmentName:'Information Technology',roles:['ADMIN','EMPLOYEE']});
    await TestBed.configureTestingModule({
      imports:[HostComponent],
      providers:[
        provideRouter([{path:'',component:AppShellV2Component,children:['dashboard','requests','approvals','documents','notifications','admin/workflows','admin/users','admin/departments','admin/audit'].map(path=>({path,component:EmptyRouteComponent}))}]),
        {provide:AuthService,useValue:{user,hasRole:(...roles:string[])=>roles.some(role=>user().roles.includes(role)),logout:()=>of(void 0)}},
        {provide:UiService,useValue:{confirmation:signal(null),toast:signal(null),resolveConfirmation:vi.fn()}}
      ]
    }).compileComponents();
  });
  afterEach(() => { localStorage.removeItem('orchiva-theme'); });
  function labels(element: HTMLElement) { return [...element.querySelectorAll('.sidebar nav a')].map(link=>link.textContent?.trim()); }

  it('keeps Notifications in the same shared menu across authorized routes', async () => {
    const fixture=TestBed.createComponent(HostComponent);
    const router=TestBed.inject(Router);
    let expected: Array<string|undefined> | undefined;
    for(const path of ['/dashboard','/requests','/approvals','/documents','/admin/workflows','/admin/users','/notifications']){
      await router.navigateByUrl(path); fixture.detectChanges();
      const current=labels(fixture.nativeElement);
      expect(current).toContain('Notifications');
      if(expected) expect(current).toEqual(expected);
      expected=current;
    }
  });
  it('preserves role restrictions while showing Notifications to employees', async () => {
    user.set({displayName:'Alex Rivera',departmentName:'Operations',roles:['EMPLOYEE']});
    const fixture=TestBed.createComponent(HostComponent);const router=TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');fixture.detectChanges();
    const current=labels(fixture.nativeElement);
    expect(current).toContain('Notifications');
    expect(current).toContain('Requests');
    expect(current).not.toContain('Approval inbox');
    expect(current).not.toContain('Workflows');
    expect(current).not.toContain('Users');
  });
  it('switches light and dark tokens without changing navigation membership', async () => {
    const fixture=TestBed.createComponent(HostComponent);const router=TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');fixture.detectChanges();
    const shell=fixture.debugElement.query(By.directive(AppShellV2Component)).componentInstance as AppShellV2Component;
    const before=labels(fixture.nativeElement);
    shell.toggleTheme();fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('orchiva-theme')).toBe('dark');
    expect(labels(fixture.nativeElement)).toEqual(before);
    shell.toggleTheme();fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});

