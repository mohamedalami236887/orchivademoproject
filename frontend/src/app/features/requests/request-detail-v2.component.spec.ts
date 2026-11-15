import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UiService } from '../../shared/ui.service';
import { RequestWorkspace } from '../../core/api.models';
import { RequestDetailV2Component } from './request-detail-v2.component';

describe('RequestDetailV2Component',()=>{
  const request={id:'r1',reference:'REQ-1',requestTypeId:'t1',requestType:'Purchase',title:'Supplier renewal',description:'Renew the supplier agreement.',creatorId:'u1',creatorName:'Alex',departmentId:'d1',departmentName:'Operations',status:'IN_REVIEW' as const,version:1,createdAt:'2026-11-01T10:00:00Z',updatedAt:'2026-11-13T10:00:00Z',submittedAt:'2026-11-02T10:00:00Z',completedAt:null};
  const view:RequestWorkspace={request,workflow:{name:'Purchase approval',version:2,status:'ACTIVE',currentStep:1,attempt:1,startedAt:'2026-11-02T10:00:00Z',completedAt:null},steps:[],approvals:[],activity:[]};
  let api:{requestWorkspace:ReturnType<typeof vi.fn>;requestDocuments:ReturnType<typeof vi.fn>};
  beforeEach(async()=>{
    api={requestWorkspace:vi.fn().mockReturnValue(of(view)),requestDocuments:vi.fn().mockReturnValue(of([]))};
    await TestBed.configureTestingModule({imports:[RequestDetailV2Component],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> 'r1'}}}},{provide:ApiService,useValue:api},{provide:AuthService,useValue:{user:()=>({id:'u1'}),hasRole:()=>false}},{provide:UiService,useValue:{confirm:vi.fn(),notify:vi.fn()}}]}).compileComponents();
  });
  it('switches between persisted record sections',()=>{
    const fixture=TestBed.createComponent(RequestDetailV2Component);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Supplier renewal');
    const buttons=Array.from(fixture.nativeElement.querySelectorAll('.record-tabs button')) as HTMLButtonElement[];
    buttons[1].click();fixture.detectChanges();
    expect(fixture.componentInstance.tab()).toBe('workflow');
    expect(fixture.nativeElement.textContent).toContain('Purchase approval');
    buttons[3].click();fixture.detectChanges();
    expect(fixture.componentInstance.tab()).toBe('documents');
    expect(fixture.nativeElement.textContent).toContain('Supporting documents');
  });
  it('shows a retry path when the initial workspace load fails',()=>{
    api.requestWorkspace.mockReturnValueOnce(throwError(()=>new Error('offline'))).mockReturnValueOnce(of(view));
    const fixture=TestBed.createComponent(RequestDetailV2Component);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Retry request');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Supplier renewal');
  });
  it('renders a compact record header for draft and approved requests',()=>{
    const fixture=TestBed.createComponent(RequestDetailV2Component);
    fixture.componentInstance.workspace.set({...view,request:{...request,status:'DRAFT'},workflow:null});fixture.detectChanges();
    const header=fixture.nativeElement.querySelector('.request-hero');
    expect(header.querySelector('h1')?.textContent).toBe('Supplier renewal');
    expect(header.textContent).toContain('Draft');
    expect(header.textContent).not.toContain('Controlled request record');
    expect(fixture.nativeElement.querySelector('.overview-workflow')).toBeNull();
    fixture.componentInstance.workspace.set({...view,request:{...request,status:'APPROVED'}});fixture.detectChanges();
    expect(header.textContent).toContain('Approved');
  });
  it('renders the API request title visibly in the light record header',()=>{
    const actual={...request,reference:'REQ-2026-000902',title:'Replace design team laptops',status:'APPROVED' as const};
    api.requestWorkspace.mockReturnValue(of({...view,request:actual}));
    const fixture=TestBed.createComponent(RequestDetailV2Component);fixture.detectChanges();
    const header=fixture.nativeElement.querySelector('.request-hero') as HTMLElement;
    const title=header.querySelector('h1') as HTMLHeadingElement;
    expect(header.textContent).toContain('REQ-2026-000902');
    expect(title.textContent?.trim()).toBe('Replace design team laptops');
    expect(getComputedStyle(title).color).toBeTruthy();
    expect(getComputedStyle(title).color).not.toBe('rgb(255, 255, 255)');
  });
  it('summarizes only persisted approved stages and preserves multiple decision attempts',()=>{
    const fixture=TestBed.createComponent(RequestDetailV2Component);
    const steps=[
      {position:1,name:'Manager review',approverRole:'MANAGER' as const,status:'APPROVED',attempt:2,actor:'Marcus Reed',createdAt:null,decidedAt:'2026-11-13T03:16:44Z',comments:'Budget confirmed'},
      {position:2,name:'Finance validation',approverRole:'FINANCE' as const,status:'PENDING',attempt:2,actor:null,createdAt:null,decidedAt:null,comments:null}
    ];
    const approvals=[{id:'d1',attempt:1,stepPosition:1,stepName:'Manager review',actor:'Marcus Reed',decision:'CHANGES_REQUESTED',comments:'Attach a quote',decidedAt:'2026-11-11T10:00:00Z'},{id:'d2',attempt:2,stepPosition:1,stepName:'Manager review',actor:'Marcus Reed',decision:'APPROVED',comments:'Budget confirmed',decidedAt:'2026-11-13T03:16:44Z'}];
    fixture.componentInstance.workspace.set({...view,workflow:{...view.workflow!,attempt:2},steps,approvals});fixture.detectChanges();
    const summary=fixture.nativeElement.querySelector('.overview-workflow');
    expect(summary.textContent).toContain('1 of 2 stages approved');
    expect(summary.textContent).toContain('Finance validation');
    fixture.componentInstance.tab.set('workflow');fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.workflow-steps li')).toHaveLength(2);
    const history=fixture.nativeElement.querySelector('.history-disclosure') as HTMLDetailsElement;
    expect(history.open).toBe(false);
    expect(history.querySelector('summary')?.textContent).toContain('2 attempts');
    history.open=true;fixture.detectChanges();
    expect(history.textContent).toContain('Attach a quote');
    expect(history.textContent).toContain('Budget confirmed');
  });
  it('uses persisted stage metadata for activity labels and falls back when absent',()=>{
    const fixture=TestBed.createComponent(RequestDetailV2Component);
    const event={id:'e1',action:'APPROVAL_APPROVED',actor:'Marcus Reed',occurredAt:'2026-11-13T03:16:44Z',targetType:'REQUEST',targetId:'r1',metadata:'{"step":"Finance validation","attempt":2}'};
    expect(fixture.componentInstance.activityLabel(event)).toBe('Finance validation approved');
    expect(fixture.componentInstance.activityLabel({...event,metadata:'{}'})).toBe('Approval Approved');
    fixture.componentInstance.workspace.set({...view,activity:[event]});fixture.componentInstance.tab.set('activity');fixture.detectChanges();
    const timeline=fixture.nativeElement.querySelector('.timeline');
    expect(timeline.textContent).toContain('Finance validation approved');
    expect(timeline.textContent).toMatch(/Nov 13, 2026 · \d{2}:\d{2}/);
    expect(timeline.textContent).not.toContain('03:16:44');
    const details=timeline.querySelector('.event-details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    details.open=true;fixture.detectChanges();
    expect(details.textContent).toContain('Finance validation');
    expect(details.textContent).toContain('Target ID');
    expect(details.textContent).toContain('r1');
    expect(details.textContent).toContain('2');
  });
  it('shows a truthful documents empty state and count',()=>{
    const fixture=TestBed.createComponent(RequestDetailV2Component);
    fixture.componentInstance.tab.set('documents');fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.record-tabs')?.textContent).toContain('Documents 0');
    expect(fixture.nativeElement.textContent).toContain('No supporting documents yet');
  });
});
