import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { UiService } from '../../shared/ui.service';
import { DepartmentAdminV2Component } from './department-admin-v2.component';

describe('DepartmentAdminV2Component', () => {
  it('finds departments without an accountable manager', async () => {
    const departments=[{id:'d-1',code:'OPS',name:'Operations',active:true,managerId:'u-1'},{id:'d-2',code:'FIN',name:'Finance',active:true,managerId:null}];
    await TestBed.configureTestingModule({imports:[DepartmentAdminV2Component],providers:[{provide:ApiService,useValue:{departments:()=>of(departments),users:()=>of([])}},{provide:UiService,useValue:{notify:vi.fn()}}]}).compileComponents();
    const component=TestBed.createComponent(DepartmentAdminV2Component).componentInstance;
    component.status.set('unmanaged');
    expect(component.filtered().map(dept=>dept.code)).toEqual(['FIN']);
    component.query.set('operations');
    expect(component.filtered()).toEqual([]);
  });
});
