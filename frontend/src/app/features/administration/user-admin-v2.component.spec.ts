import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { UiService } from '../../shared/ui.service';
import { UserAdminV2Component } from './user-admin-v2.component';

describe('UserAdminV2Component', () => {
  const user = { id:'u-1',username:'alex',email:'alex@orchiva.test',firstName:'Alex',lastName:'Rivera',enabled:true,departmentId:'d-1',departmentName:'Operations',roles:['EMPLOYEE' as const] };
  let api: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    api = { users:vi.fn().mockReturnValue(of([user])), departments:vi.fn().mockReturnValue(of([{id:'d-1',code:'OPS',name:'Operations',active:true,managerId:null}])), createUser:vi.fn().mockReturnValue(of(user)), updateUser:vi.fn().mockReturnValue(of(user)) };
    await TestBed.configureTestingModule({ imports:[UserAdminV2Component], providers:[{provide:ApiService,useValue:api},{provide:UiService,useValue:{notify:vi.fn()}}] }).compileComponents();
  });

  it('opens and closes the account drawer with a clean creation form', () => {
    const component = TestBed.createComponent(UserAdminV2Component).componentInstance;
    component.newUser();
    expect(component.drawerOpen()).toBe(true);
    expect(component.editingId()).toBeNull();
    expect(component.form.controls.username.enabled).toBe(true);
    component.escape();
    expect(component.drawerOpen()).toBe(false);
  });

  it('requires a valid account before creating it', () => {
    const component = TestBed.createComponent(UserAdminV2Component).componentInstance;
    component.newUser();
    component.save();
    expect(component.submitted()).toBe(true);
    expect(api['createUser']).not.toHaveBeenCalled();
    component.form.setValue({username:'sam',email:'sam@orchiva.test',password:'long-password',firstName:'Sam',lastName:'Lee',departmentId:'d-1',roles:['EMPLOYEE'],enabled:true});
    component.save();
    expect(api['createUser']).toHaveBeenCalledOnce();
    expect(component.drawerOpen()).toBe(false);
  });

  it('disables immutable fields while editing an existing account', () => {
    const component = TestBed.createComponent(UserAdminV2Component).componentInstance;
    component.edit(user);
    expect(component.editingId()).toBe('u-1');
    expect(component.form.controls.username.disabled).toBe(true);
    expect(component.form.controls.password.hasValidator).toBeDefined();
  });

  it('combines role and department filters in the directory', () => {
    const component = TestBed.createComponent(UserAdminV2Component).componentInstance;
    component.roleFilter.set('EMPLOYEE');
    component.departmentFilter.set('d-1');
    expect(component.filtered().map(u=>u.id)).toEqual(['u-1']);
    component.departmentFilter.set('unassigned');
    expect(component.filtered()).toEqual([]);
  });
});
