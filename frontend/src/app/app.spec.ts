import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should host the application router', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeTruthy();
  });

  it('inherits the active semantic foreground at the application root', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    document.documentElement.dataset['theme'] = 'dark';
    expect(getComputedStyle(fixture.nativeElement).color).toBe('var(--ink)');
    document.documentElement.dataset['theme'] = 'light';
  });
});
