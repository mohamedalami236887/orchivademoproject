import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardV2Component } from './dashboard-v2.component';

describe('DashboardV2Component', () => {
  it('shows actionable workload counts from the authorized dashboard response', async () => {
    const dashboard={totalRequests:8,activeRequests:3,approvedRequests:4,pendingApprovals:2,unreadNotifications:1,recentRequests:[],statusBreakdown:[],pendingPreview:[]};
    await TestBed.configureTestingModule({imports:[DashboardV2Component],providers:[provideRouter([]),{provide:ApiService,useValue:{dashboard:()=>of(dashboard)}},{provide:AuthService,useValue:{user:()=>({displayName:'Alex Rivera'}),hasRole:()=>false}}]}).compileComponents();
    const fixture=TestBed.createComponent(DashboardV2Component);
    fixture.detectChanges();
    document.documentElement.dataset['theme']='dark';
    expect(getComputedStyle(fixture.nativeElement.querySelector('.command-header h1')).color).toBe('var(--ink)');
    document.documentElement.dataset['theme']='light';
    const metrics=fixture.nativeElement.querySelectorAll('.operational-metrics a') as NodeListOf<HTMLAnchorElement>;
    expect(metrics).toHaveLength(3);
    expect(metrics[0].textContent).toContain('2');
    expect(metrics[0].getAttribute('href')).toBe('/approvals');
    expect(metrics[1].getAttribute('href')).toContain('IN_REVIEW');
  });
});
