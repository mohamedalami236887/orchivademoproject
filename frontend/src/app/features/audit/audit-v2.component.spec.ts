import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuditV2Component } from './audit-v2.component';

describe('AuditV2Component', () => {
  it('exposes structured event context while retaining original metadata', async () => {
    await TestBed.configureTestingModule({imports:[AuditV2Component],providers:[provideRouter([]),{provide:ApiService,useValue:{audit:()=>of({content:[],page:0,totalPages:0,totalElements:0})}}]}).compileComponents();
    const component=TestBed.createComponent(AuditV2Component).componentInstance;
    expect(component.metadataEntries('{"request_reference":"REQ-1001","attempt":2}')).toEqual([{key:'request reference',value:'REQ-1001'},{key:'attempt',value:'2'}]);
    expect(component.metadataEntries('unstructured')).toEqual([]);
    expect(component.prettyMetadata('{"attempt":2}')).toContain('"attempt": 2');
  });
});
