import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Workflow } from '../../core/api.models';
import { UiService } from '../../shared/ui.service';
import { WorkflowAdminComponent } from './workflow-admin.component';

describe('WorkflowAdminComponent', () => {
  const workflow: Workflow = { id:'wf-1', name:'Purchase approval', requestTypeId:'type-1', requestType:'Purchase', currentVersion:2, steps:[{name:'Manager review',approverRole:'MANAGER'},{name:'Finance review',approverRole:'FINANCE'}] };
  let api: { workflows: ReturnType<typeof vi.fn>; requestTypes: ReturnType<typeof vi.fn>; publishWorkflow: ReturnType<typeof vi.fn> };
  let ui: { confirm: ReturnType<typeof vi.fn>; notify: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { workflows:vi.fn().mockReturnValue(of([workflow])), requestTypes:vi.fn().mockReturnValue(of([{id:'type-1',code:'PURCHASE',name:'Purchase',description:''}])), publishWorkflow:vi.fn().mockReturnValue(of({...workflow,currentVersion:3})) };
    ui = { confirm:vi.fn().mockResolvedValue(true), notify:vi.fn() };
    await TestBed.configureTestingModule({ imports:[WorkflowAdminComponent], providers:[{provide:ApiService,useValue:api},{provide:UiService,useValue:ui}] }).compileComponents();
  });

  it('loads and protects the published workflow definition', () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    expect(component.mode()).toBe('published');
    expect(component.selectedWorkflow()?.id).toBe('wf-1');
    expect(component.visibleSteps()).toHaveLength(2);
  });
  it('binds the studio heading to the active semantic foreground', () => {
    const fixture=TestBed.createComponent(WorkflowAdminComponent);
    fixture.detectChanges();
    document.documentElement.dataset['theme']='dark';
    expect(getComputedStyle(fixture.nativeElement.querySelector('.studio-header h1')).color).toBe('var(--ink)');
    document.documentElement.dataset['theme']='light';
  });

  it('creates an editable version and reorders stages without mutating the published source', () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    component.createVersion();
    component.moveStep(1,-1);
    expect(component.mode()).toBe('draft');
    expect(component.steps.at(0).getRawValue()).toEqual({name:'Finance review',approverRole:'FINANCE'});
    expect(workflow.steps[0].name).toBe('Manager review');
  });

  it('selects a stage for the inspector and closes it with Escape', () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    component.selectStep(1);
    expect(component.selectedStep()).toBe(1);
    component.escape();
    expect(component.selectedStep()).toBeNull();
  });

  it('moves keyboard selection between stages without changing their order', () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    const event = {preventDefault:vi.fn(),currentTarget:{parentElement:null}} as unknown as Event;
    component.selectAdjacent(0,1,event);
    expect(component.selectedStep()).toBe(1);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    component.selectAdjacent(1,1,event);
    expect(component.selectedStep()).toBe(1);
    expect(workflow.steps[0].name).toBe('Manager review');
  });

  it('starts a clean workflow draft and adds a selected stage', () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    component.newWorkflow();
    expect(component.mode()).toBe('draft');
    expect(component.steps).toHaveLength(1);
    component.addStep();
    expect(component.steps).toHaveLength(2);
    expect(component.selectedStep()).toBe(1);
  });

  it('publishes a valid draft only after confirmation', async () => {
    const component = TestBed.createComponent(WorkflowAdminComponent).componentInstance;
    component.createVersion();
    await component.publish();
    expect(ui.confirm).toHaveBeenCalledOnce();
    expect(api.publishWorkflow).toHaveBeenCalledWith({requestTypeId:'type-1',name:'Purchase approval',steps:workflow.steps});
    expect(component.mode()).toBe('published');
  });
});
