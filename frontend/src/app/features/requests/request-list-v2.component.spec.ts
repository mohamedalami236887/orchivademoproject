import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { BusinessRequest, RequestWorkspace } from '../../core/api.models';
import { RequestListV2Component } from './request-list-v2.component';

describe('RequestListV2Component', () => {
  const item: BusinessRequest = {id:'r1',reference:'REQ-100',requestTypeId:'t1',requestType:'Purchase',title:'Supplier renewal',description:'Renew supplier contract.',creatorId:'u1',creatorName:'Alex Rivera',departmentId:'d1',departmentName:'Operations',status:'IN_REVIEW',version:1,createdAt:'2026-11-01T10:00:00Z',updatedAt:'2026-11-13T10:00:00Z',submittedAt:'2026-11-02T10:00:00Z',completedAt:null};
  const workspace: RequestWorkspace = {request:item,workflow:{name:'Purchase approval',version:2,status:'ACTIVE',currentStep:1,attempt:1,startedAt:'2026-11-02T10:00:00Z',completedAt:null},steps:[{position:1,name:'Manager review',approverRole:'MANAGER',status:'PENDING',attempt:1,actor:null,createdAt:null,decidedAt:null,comments:null}],approvals:[],activity:[]};
  let api: {requestTypes:ReturnType<typeof vi.fn>;requests:ReturnType<typeof vi.fn>;requestWorkspace:ReturnType<typeof vi.fn>;requestDocuments:ReturnType<typeof vi.fn>;dashboard:ReturnType<typeof vi.fn>};
  beforeEach(async()=>{
    api={requestTypes:vi.fn().mockReturnValue(of([{id:'t1',code:'PURCHASE',name:'Purchase',description:''}])),requests:vi.fn().mockReturnValue(of({content:[item],page:0,size:10,totalElements:1,totalPages:1})),requestWorkspace:vi.fn().mockReturnValue(of(workspace)),requestDocuments:vi.fn().mockReturnValue(of([])),dashboard:vi.fn().mockReturnValue(of({totalRequests:1,statusBreakdown:[{status:'IN_REVIEW',count:1}]}))};
    await TestBed.configureTestingModule({imports:[RequestListV2Component],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}},{provide:ApiService,useValue:api},{provide:AuthService,useValue:{user:()=>({id:'u1'})}}]}).compileComponents();
  });
  it('opens persisted context and closes with Escape',()=>{
    const component=TestBed.createComponent(RequestListV2Component).componentInstance;
    component.preview(item);
    expect(api.requestWorkspace).toHaveBeenCalledWith('r1');
    expect(component.previewData()?.workflow?.version).toBe(2);
    component.escape();
    expect(component.selectedId()).toBeNull();
  });
  it('shows backend failures and supports retry',()=>{
    const component=TestBed.createComponent(RequestListV2Component).componentInstance;
    api.requestWorkspace.mockReturnValueOnce(throwError(()=>new Error('offline'))).mockReturnValueOnce(of(workspace));
    component.preview(item);
    expect(component.previewError()).toContain('could not be loaded');
    component.retryPreview();
    expect(component.previewData()?.request.reference).toBe('REQ-100');
  });
  it('applies server filters, sorting and pagination then resets',()=>{
    const component=TestBed.createComponent(RequestListV2Component).componentInstance;
    component.query='REQ-100';component.status='IN_REVIEW';component.typeId='t1';component.sort='reference,ASC';
    component.load(2);
    expect(api.requests).toHaveBeenLastCalledWith({query:'REQ-100',status:'IN_REVIEW',typeId:'t1',page:2,size:10,sortBy:'reference',direction:'ASC'});
    component.clear();
    expect(component.hasFilters()).toBe(false);
    expect(api.requests).toHaveBeenLastCalledWith({query:'',status:'',typeId:'',page:0,size:10,sortBy:'updatedAt',direction:'DESC'});
  });
  it('uses a real predefined view and accepts dashboard status links',()=>{
    TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:convertToParamMap({status:'APPROVED'})}}});
    const component=TestBed.createComponent(RequestListV2Component).componentInstance;
    expect(component.status).toBe('APPROVED');
    expect(api.requests).toHaveBeenCalledWith(expect.objectContaining({status:'APPROVED'}));
    component.setStatus('IN_REVIEW');
    expect(api.requests).toHaveBeenLastCalledWith(expect.objectContaining({status:'IN_REVIEW',page:0}));
  });
  it('renders preview navigation and respects owner editing',()=>{
    const fixture=TestBed.createComponent(RequestListV2Component);
    fixture.componentInstance.preview(item);fixture.detectChanges();
    const full=fixture.nativeElement.querySelector('.preview-drawer footer a');
    expect(full.getAttribute('href')).toBe('/requests/r1');
    expect(fixture.componentInstance.canEdit(item)).toBe(false);
    fixture.componentInstance.previewData.set({...workspace,request:{...item,status:'DRAFT'}});
    expect(fixture.componentInstance.canEdit({...item,status:'DRAFT'})).toBe(true);
    fixture.componentInstance.closePreview();
    expect(fixture.componentInstance.selectedId()).toBeNull();
  });
  it('selects the first server record and switches real inspector sections',()=>{
    const fixture=TestBed.createComponent(RequestListV2Component);fixture.detectChanges();
    const component=fixture.componentInstance;
    expect(component.selectedId()).toBe('r1');
    expect(api.requestDocuments).toHaveBeenCalledWith('r1');
    component.activeTab.set('workflow');fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.preview-steps')?.textContent).toContain('Manager review');
    component.activeTab.set('documents');fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.preview-body')?.textContent).toContain('No documents attached');
  });
  it('changes server page size and refreshes the record page',()=>{
    const component=TestBed.createComponent(RequestListV2Component).componentInstance;
    component.setPageSize(20);
    expect(api.requests).toHaveBeenLastCalledWith(expect.objectContaining({size:20,page:0}));
  });
  it('shows persisted stage progress and decision context without inferring approval from request status',()=>{
    const fixture=TestBed.createComponent(RequestListV2Component);
    const component=fixture.componentInstance;
    const stages=[
      {position:1,name:'Manager review',approverRole:'MANAGER' as const,status:'APPROVED',attempt:1,actor:'Marcus Reed',createdAt:'2026-11-02T10:00:00Z',decidedAt:'2026-11-03T10:00:00Z',comments:'Approved budget'},
      {position:2,name:'Finance validation',approverRole:'FINANCE' as const,status:'PENDING',attempt:1,actor:null,createdAt:'2026-11-03T10:00:00Z',decidedAt:null,comments:null}
    ];
    component.previewData.set({...workspace,request:{...item,status:'APPROVED'},steps:stages});
    expect(component.approvedStages(component.previewData()!)).toBe(1);
    expect(component.workflowFocus(component.previewData()!)).toContain('Finance validation');
    fixture.detectChanges();
    const summary=fixture.nativeElement.querySelector('.workflow-summary');
    expect(summary.textContent).toContain('1 of 2 stages approved');
    expect(summary.textContent).toContain('Marcus Reed');
    component.activeTab.set('workflow');fixture.detectChanges();
    const timeline=fixture.nativeElement.querySelector('.preview-steps');
    expect(timeline.querySelectorAll('li.stage-approved')).toHaveLength(1);
    expect(timeline.querySelectorAll('li.stage-pending')).toHaveLength(1);
    expect(timeline.textContent).toContain('Approved budget');
  });
  it('keeps selection and Escape behavior in compact drawer mode',()=>{
    const fixture=TestBed.createComponent(RequestListV2Component);
    const component=fixture.componentInstance;
    component.isCompact.set(true);fixture.detectChanges();
    const inspector=fixture.nativeElement.querySelector('.preview-drawer');
    expect(inspector.getAttribute('role')).toBe('dialog');
    expect(inspector.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('tr.selected')).toBeTruthy();
    component.escape();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.preview-drawer')).toBeNull();
  });
});
