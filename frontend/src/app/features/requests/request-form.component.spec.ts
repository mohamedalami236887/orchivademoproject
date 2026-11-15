import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BusinessRequest } from '../../core/api.models';
import { UiService } from '../../shared/ui.service';
import { RequestFormComponent } from './request-form.component';

describe('RequestFormComponent', () => {
  const created: BusinessRequest = { id:'r-1',reference:'REQ-1',requestTypeId:'type-1',requestType:'Purchase',title:'Renew supplier agreement',description:'Renew before the current term expires.',creatorId:'u-1',creatorName:'Alex',departmentId:'d-1',departmentName:'Operations',status:'DRAFT',version:0,createdAt:'2026-11-13T10:00:00Z',updatedAt:'2026-11-13T10:00:00Z',submittedAt:null,completedAt:null };
  let api: { requestTypes: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn>; createRequest: ReturnType<typeof vi.fn>; updateRequest: ReturnType<typeof vi.fn>; submitRequest: ReturnType<typeof vi.fn> };
  let ui: { notify: ReturnType<typeof vi.fn> };
  let routeId: string | null;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    routeId = null;
    api = { requestTypes:vi.fn().mockReturnValue(of([{id:'type-1',code:'PURCHASE',name:'Purchase',description:''}])), request:vi.fn().mockReturnValue(of(created)), createRequest:vi.fn().mockReturnValue(of(created)), updateRequest:vi.fn().mockReturnValue(of(created)), submitRequest:vi.fn().mockReturnValue(of({...created,status:'SUBMITTED'})) };
    ui = { notify:vi.fn() };
    await TestBed.configureTestingModule({ imports:[RequestFormComponent], providers:[provideRouter([]),{provide:ApiService,useValue:api},{provide:UiService,useValue:ui},{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=>routeId}}}}] }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);
  });
  function render() { const fixture = TestBed.createComponent(RequestFormComponent); fixture.detectChanges(); return fixture; }
  function complete(component: RequestFormComponent) { component.form.setValue({requestTypeId:'type-1',title:'Renew supplier agreement',description:'Renew before the current term expires.'}); }

  it('validates before creation and preserves entered values', () => {
    const component = render().componentInstance;
    component.form.controls.title.setValue('Entered title');
    component.save();
    expect(component.attempted()).toBe(true);
    expect(component.form.controls.title.value).toBe('Entered title');
    expect(api.createRequest).not.toHaveBeenCalled();
  });
  it('creates exactly one draft and presents an accessible next-step choice', () => {
    const fixture = render(); const component = fixture.componentInstance; complete(component);
    component.save(); component.save(); fixture.detectChanges();
    expect(api.createRequest).toHaveBeenCalledTimes(1);
    expect(api.submitRequest).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.created()).toEqual(created);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('draft-choice-title');
    expect(dialog.textContent).toContain('not yet been sent for approval');
  });
  it('moves focus into the choice and keeps keyboard Tab within its actions', async () => {
    const fixture=render();const component=fixture.componentInstance;complete(component);component.save();fixture.detectChanges();
    await new Promise(resolve=>setTimeout(resolve,0));
    const buttons=fixture.nativeElement.querySelectorAll('.draft-choice .dialog-actions button') as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(buttons[1]);
    buttons[0].focus();
    const event=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,cancelable:true});
    component.keepChoiceFocus(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[1]);
  });
  it('keeps the single created request as a draft without submission', () => {
    const component = render().componentInstance; complete(component); component.save(); component.keepDraft();
    expect(api.createRequest).toHaveBeenCalledTimes(1);
    expect(api.submitRequest).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/requests','r-1']);
    expect(ui.notify).toHaveBeenCalledWith(expect.stringContaining('remains a draft'));
  });
  it('submits through the existing API once and confirms only after server success', () => {
    const pending = new Subject<BusinessRequest>(); api.submitRequest.mockReturnValue(pending.asObservable());
    const component = render().componentInstance; complete(component); component.save();
    component.submitForApproval(); component.submitForApproval();
    expect(api.submitRequest).toHaveBeenCalledTimes(1);
    expect(api.submitRequest).toHaveBeenCalledWith('r-1');
    expect(ui.notify).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    pending.next({...created,status:'SUBMITTED'}); pending.complete();
    expect(ui.notify).toHaveBeenCalledWith(expect.stringContaining('submitted for approval'));
    expect(navigate).toHaveBeenCalledWith(['/requests','r-1']);
  });
  it('shows backend submission errors and allows retry without creating another draft', () => {
    api.submitRequest.mockReturnValueOnce(throwError(() => ({error:{message:'A published workflow is required'}}))).mockReturnValueOnce(of({...created,status:'SUBMITTED'}));
    const fixture = render(); const component = fixture.componentInstance; complete(component); component.save();
    component.submitForApproval(); fixture.detectChanges();
    expect(component.submissionError()).toContain('published workflow');
    expect(fixture.nativeElement.querySelector('[role="dialog"] [role="alert"]').textContent).toContain('published workflow');
    expect(ui.notify).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    component.submitForApproval();
    expect(api.createRequest).toHaveBeenCalledTimes(1);
    expect(api.submitRequest).toHaveBeenCalledTimes(2);
  });
  it('retains form data and shows no next-step dialog when creation fails', () => {
    api.createRequest.mockReturnValue(throwError(() => ({error:{message:'Request type unavailable'}})));
    const fixture = render(); const component = fixture.componentInstance; complete(component); component.save(); fixture.detectChanges();
    expect(component.error()).toContain('Request type unavailable');
    expect(component.form.controls.title.value).toBe('Renew supplier agreement');
    expect(component.created()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(api.submitRequest).not.toHaveBeenCalled();
  });
  it('keeps edit-draft behavior without reopening the post-create choice', () => {
    routeId = 'r-1'; const component = render().componentInstance;
    component.save();
    expect(api.updateRequest).toHaveBeenCalledWith('r-1',component.form.getRawValue());
    expect(api.createRequest).not.toHaveBeenCalled();
    expect(component.created()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/requests','r-1']);
  });
});

