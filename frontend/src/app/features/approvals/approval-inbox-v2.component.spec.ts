import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApprovalTask, ManagedDocument, RequestWorkspace } from '../../core/api.models';
import { UiService } from '../../shared/ui.service';
import { ApprovalInboxV2Component } from './approval-inbox-v2.component';

describe('ApprovalInboxV2Component', () => {
  const task: ApprovalTask = { id:'a-1',requestId:'r-1',reference:'REQ-1001',requestTitle:'Renew supplier agreement',requestType:'Purchase',requester:'Alex Rivera',department:'Operations',requestDescription:'Renew the agreement before the current term expires.',submittedAt:'2026-11-12T09:00:00Z',stepName:'Finance review',assigneeRole:'FINANCE',status:'PENDING',attempt:1,createdAt:'2026-11-12T09:00:00Z',decidedAt:null };
  const workspace = { steps:[{position:1,name:'Manager review',approverRole:'MANAGER',status:'APPROVED',attempt:1,actor:'Sam Lee',createdAt:'2026-11-12T09:00:00Z',decidedAt:'2026-11-12T10:00:00Z',comments:'Approved budget'},{position:2,name:'Finance review',approverRole:'FINANCE',status:'PENDING',attempt:1,actor:null,createdAt:'2026-11-12T10:00:00Z',decidedAt:null,comments:null}],approvals:[{id:'d-1',attempt:1,stepPosition:1,stepName:'Manager review',actor:'Sam Lee',decision:'APPROVED',comments:'Approved budget',decidedAt:'2026-11-12T10:00:00Z'}] } as RequestWorkspace;
  let api: { approvals: ReturnType<typeof vi.fn>; decide: ReturnType<typeof vi.fn>; requestDocuments: ReturnType<typeof vi.fn>; requestWorkspace: ReturnType<typeof vi.fn> };
  let ui: { notify: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    api = { approvals:vi.fn().mockReturnValue(of([task])), decide:vi.fn().mockReturnValue(of(task)), requestDocuments:vi.fn().mockReturnValue(of([])), requestWorkspace:vi.fn().mockReturnValue(of(workspace)) };
    ui = { notify:vi.fn() };
    await TestBed.configureTestingModule({ imports:[ApprovalInboxV2Component], providers:[provideRouter([]),{provide:ApiService,useValue:api},{provide:UiService,useValue:ui}] }).compileComponents();
  });
  function render() { const fixture = TestBed.createComponent(ApprovalInboxV2Component); fixture.detectChanges(); return fixture; }

  it('renders an intentional empty queue with a request navigation action', () => {
    api.approvals.mockReturnValue(of([]));
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.queue-empty h2').textContent).toContain('Nothing needs your decision');
    document.documentElement.dataset['theme']='dark';
    expect(getComputedStyle(fixture.nativeElement.querySelector('.queue-empty h2')).color).toBe('var(--ink)');
    document.documentElement.dataset['theme']='light';
    expect(fixture.nativeElement.querySelector('.queue-empty a').getAttribute('href')).toBe('/requests');
    expect(fixture.nativeElement.querySelector('.decision-actions')).toBeNull();
  });
  it('shows a compact role-scoped task and persisted workflow history', () => {
    const fixture = render();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('REQ-1001');
    expect(text).toContain('Renew supplier agreement');
    expect(text).toContain('Alex Rivera');
    expect(text).toContain('Operations');
    expect(text).toContain('Finance review');
    expect(text).toContain('Renew the agreement before');
    expect(text).toContain('Manager review');
    expect(api.requestWorkspace).toHaveBeenCalledWith('r-1');
  });
  it('loads selected task context and ignores stale history and evidence', () => {
    const delayedDocs = new Subject<ManagedDocument[]>();
    const delayedWorkspace = new Subject<RequestWorkspace>();
    api.requestDocuments.mockReturnValueOnce(delayedDocs.asObservable()).mockReturnValueOnce(of([]));
    api.requestWorkspace.mockReturnValueOnce(delayedWorkspace.asObservable()).mockReturnValueOnce(of({...workspace,steps:[],approvals:[]}));
    const component = render().componentInstance;
    component.selectTask({...task,id:'a-2',requestId:'r-2'});
    delayedDocs.next([{id:'doc-1',requestId:'r-1',requestReference:'REQ-1001',title:'Old evidence',latestVersion:1,createdAt:'',updatedAt:'',versions:[]}]);
    delayedWorkspace.next(workspace);
    expect(api.requestDocuments).toHaveBeenLastCalledWith('r-2');
    expect(api.requestWorkspace).toHaveBeenLastCalledWith('r-2');
    expect(component.documents()).toEqual([]);
    expect(component.workspace()?.steps).toEqual([]);
  });
  it('shows authorized task actions and hides them for a nonpending selection', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelectorAll('.decision-actions button').length).toBe(3);
    fixture.componentInstance.active.set({...task,status:'APPROVED'});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.decision-actions')).toBeNull();
    fixture.componentInstance.open({...task,id:'not-in-queue'},'APPROVED');
    expect(fixture.componentInstance.selected()).toBeNull();
  });
  it('loads supporting documents and provides the existing download URL', () => {
    api.requestDocuments.mockReturnValue(of([{id:'doc-1',requestId:'r-1',requestReference:'REQ-1001',title:'Supplier contract',latestVersion:2,createdAt:'',updatedAt:'',versions:[]}]));
    const fixture = render();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.document-list a');
    expect(link.getAttribute('href')).toBe('/api/documents/doc-1/content?version=2');
    expect(link.getAttribute('aria-label')).toContain('Supplier contract');
  });
  it('requires comments for rejection and change requests', () => {
    const component = render().componentInstance;
    component.open(task,'REJECTED');
    expect(component.canSubmit()).toBe(false);
    component.comments.set('Budget evidence is missing.');
    expect(component.canSubmit()).toBe(true);
    component.close();
    component.open(task,'CHANGES_REQUESTED');
    expect(component.canSubmit()).toBe(false);
    component.comments.set('Please attach revised terms.');
    component.submit();
    expect(api.decide).toHaveBeenCalledWith('a-1','CHANGES_REQUESTED','Please attach revised terms.');
  });
  it('closes an unfinished decision with Escape', () => {
    const component = render().componentInstance;
    component.open(task,'CHANGES_REQUESTED');
    component.escape();
    expect(component.selected()).toBeNull();
  });
  it('records approval and refreshes the server queue', () => {
    const component = render().componentInstance;
    component.open(task,'APPROVED');
    component.submit();
    expect(api.decide).toHaveBeenCalledWith('a-1','APPROVED','');
    expect(api.approvals).toHaveBeenCalledTimes(2);
    expect(ui.notify).toHaveBeenCalled();
  });
  it('retains the dialog and comments after a failed submission for retry', () => {
    api.decide.mockReturnValueOnce(throwError(() => ({error:{message:'Task was changed by another approver'}})));
    const component = render().componentInstance;
    component.open(task,'REJECTED');
    component.comments.set('Not within budget');
    component.submit();
    expect(component.selected()).toEqual(task);
    expect(component.comments()).toBe('Not within budget');
    expect(component.decisionError()).toContain('another approver');
    expect(component.canSubmit()).toBe(true);
    component.submit();
    expect(api.decide).toHaveBeenCalledTimes(2);
  });
  it('does not present an empty queue when the API fails and offers retry', () => {
    api.approvals.mockReturnValueOnce(throwError(() => new Error('offline'))).mockReturnValueOnce(of([task]));
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.queue-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.queue-empty')).toBeNull();
    fixture.nativeElement.querySelector('.queue-error button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.task-rail')).not.toBeNull();
  });
});

