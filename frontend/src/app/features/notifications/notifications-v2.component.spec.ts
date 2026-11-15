import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { UiService } from '../../shared/ui.service';
import { NotificationsV2Component } from './notifications-v2.component';

describe('NotificationsV2Component', () => {
  it('groups today and earlier activity, then filters unread items', async () => {
    const items=[{id:'n-1',type:'APPROVAL',title:'Review',message:'Now',targetUrl:null,readAt:null,createdAt:new Date().toISOString()},{id:'n-2',type:'DOCUMENT',title:'Uploaded',message:'Earlier',targetUrl:null,readAt:'2026-01-01T00:00:00Z',createdAt:'2026-01-01T00:00:00Z'}];
    await TestBed.configureTestingModule({imports:[NotificationsV2Component],providers:[provideRouter([]),{provide:ApiService,useValue:{notifications:()=>of({unread:1,items})}},{provide:UiService,useValue:{notify:vi.fn()}}]}).compileComponents();
    const component=TestBed.createComponent(NotificationsV2Component).componentInstance;
    expect(component.groups().map(group=>group.label)).toEqual(['Today','Earlier']);
    component.view.set('unread');
    expect(component.groups().map(group=>group.items.length)).toEqual([1]);
  });
});
